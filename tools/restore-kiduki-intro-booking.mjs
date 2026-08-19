#!/usr/bin/env node
/**
 * 初回15分相談の予約リンクを、ラウンドロビンへ戻す（A案）。
 *
 * 背景:
 *   cal.com 上の状態（2026-08-19 実測）:
 *     id=3974730  intro-15-online-old-3974730  roundRobin  hidden
 *     id=4747643  intro-15-online              managed     visible
 *
 *   退避側の `-old-3974730` はフルIDが入っており、移行スクリプト
 *   (migrate-cal-roundrobin-to-managed.mjs) の命名規則である末尾6桁 `-old-974730` とは
 *   一致しない。つまりこの退避は人手によるもので、スクリプトの実行結果ではない。
 *
 *   問題は、空いた `intro-15-online` をマネージドイベントが占めていること。
 *   マネージドイベントはチームURLでは予約できず、割り当てられた各メンバーの個人ページ
 *   `cal.com/<username>/<slug>` に子イベントとして生成される。よってKIDUKIサイトの
 *   リードフォームが使う `cal.com/team/<team>/intro-15-online` は404になる。
 *
 *   企業向け予約画面 (docs/booking/index.html) は intro を一切使わない（全文検索で0件）。
 *   組み立てるのは consult-* / health-consult-* / hr-consult-30 / stress-check-* / training-*
 *   のみ。したがってこのスクリプトの変更は企業の予約画面に影響しない。
 *
 *   初回15分相談は「担当医が決まっていない状態で誰かに繋ぐ」予約なので、ラウンドロビンが
 *   本来正しいモデルである。このスクリプトは intro のみラウンドロビンへ戻す。
 *
 *   注意: マネージド側を退避すると `cal.com/<医師>/intro-15-online` という個人ページ側の
 *   初回相談リンクは使えなくなる。そちらを運用に組み込んでいる場合は実行前に確認すること。
 *
 * 方針:
 *   - マネージドイベントは削除しない。`<slug>-managed-<id末尾>` へ退避するだけにする。
 *     移行をやり直す判断が後からでもできる状態を残す。
 *   - 失敗したらその場で自動的に元へ戻す。
 *   - 実行内容は state ファイルへ書き、--rollback で戻せるようにする。
 *
 * 使い方:
 *   # 何をするかだけ表示（変更しない）
 *   node tools/restore-kiduki-intro-booking.mjs --api-key cal_live_xxx
 *
 *   # 実行
 *   node tools/restore-kiduki-intro-booking.mjs --api-key cal_live_xxx --apply
 *
 *   # 取り消し
 *   node tools/restore-kiduki-intro-booking.mjs --api-key cal_live_xxx --rollback
 *
 * 環境変数: CAL_API_KEY / CAL_TEAM_ID / CAL_API_BASE_URL
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const argv = process.argv.slice(2);
const arg = (name, fallback = '') => {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(name);

const API_KEY = arg('--api-key', process.env.CAL_API_KEY ?? '').trim();
const TEAM_ID = arg('--team-id', process.env.CAL_TEAM_ID ?? '147934').trim();
const BASE_URL = arg('--base-url', process.env.CAL_API_BASE_URL ?? 'https://api.cal.com/v2').replace(/\/+$/, '');
const TEAM_SLUG = arg('--team-slug', 'kiduki').trim();
const SLUG = arg('--slug', 'intro-15-online').trim();
const STATE_FILE = arg('--state-file', path.join(process.cwd(), `intro-booking-restore-${TEAM_ID}.json`));

const MODE_ROLLBACK = flag('--rollback');
const MODE_APPLY = flag('--apply');
const MODE_PLAN = !MODE_ROLLBACK && !MODE_APPLY;

const PUBLIC_URL = `https://cal.com/team/${TEAM_SLUG}/${SLUG}`;
const PARKED_RE = new RegExp(`^${SLUG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-old-\\d+$`);

// 一覧の取得（GET /teams/{id}/event-types）は cal.com 側が認証なしで応答するため、
// planモードは鍵なしでも動く。変更する場合だけ鍵を要求する。
if (!API_KEY && !MODE_PLAN) {
  console.error('ERROR: 変更するには --api-key か CAL_API_KEY が必要です。');
  process.exit(1);
}

// cal.com のテナントによって受け付けるヘッダが違うので、移行スクリプトと同じ順で試す。
const HEADER_CANDIDATES = API_KEY
  ? [
      { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'cal-api-version': '2024-09-04' },
      { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }
    ]
  : [{ 'Content-Type': 'application/json', 'cal-api-version': '2024-09-04' }];

async function request(method, endpoint, body) {
  let lastErr = null;
  for (const headers of HEADER_CANDIDATES) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      if (!res.ok) {
        lastErr = new Error(`${method} ${endpoint} -> ${res.status} ${text.slice(0, 300)}`);
        continue;
      }
      return json;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error(`${method} ${endpoint} failed`);
}

async function tryEndpoints(method, endpoints, body) {
  let lastErr = null;
  for (const endpoint of endpoints) {
    try {
      return await request(method, endpoint, body);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error(`all endpoints failed: ${endpoints.join(', ')}`);
}

async function listTeamEvents() {
  const data = await tryEndpoints('GET', [`/teams/${TEAM_ID}/event-types`, `/event-types?limit=200`]);
  const direct = Array.isArray(data?.data) ? data.data : [];
  if (direct.length > 0) return direct;
  const groups = Array.isArray(data?.data?.eventTypeGroups) ? data.data.eventTypeGroups : [];
  return groups.flatMap((g) => (Array.isArray(g?.eventTypes) ? g.eventTypes : []));
}

const patchEvent = (id, payload) =>
  tryEndpoints('PATCH', [`/teams/${TEAM_ID}/event-types/${id}`, `/event-types/${id}`], payload);

async function publicStatus(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
    return res.status;
  } catch {
    return 0;
  }
}

// cal.com の公開ページは反映に少し遅れがあるので、数回見る。
async function waitForPublic(url, expect = 200, attempts = 6) {
  for (let i = 1; i <= attempts; i += 1) {
    const status = await publicStatus(url);
    console.log(`  check ${i}/${attempts}: ${url} -> ${status}`);
    if (status === expect) return true;
    if (i < attempts) await new Promise((r) => setTimeout(r, 5000));
  }
  return false;
}

const describe = (e) =>
  `id=${e.id} slug=${e.slug} scheduling=${e.schedulingType ?? '-'} hidden=${e.hidden ?? '-'} title=${e.title ?? '-'}`;

async function rollback() {
  let state = null;
  try {
    state = JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
  } catch {
    console.error(`取り消し用の記録がありません: ${STATE_FILE}`);
    process.exit(1);
  }
  console.log(`記録から戻します: ${STATE_FILE}`);
  if (state.parked) {
    await patchEvent(state.parked.id, {
      slug: state.parked.slug_before,
      hidden: state.parked.hidden_before
    });
    console.log(`  旧イベントを戻しました: ${state.parked.slug_after} -> ${state.parked.slug_before}`);
  }
  if (state.managed) {
    await patchEvent(state.managed.id, { slug: state.managed.slug_before });
    console.log(`  マネージドを戻しました: ${state.managed.slug_after} -> ${state.managed.slug_before}`);
  }
  console.log('取り消し完了。');
}

async function main() {
  if (MODE_ROLLBACK) return rollback();

  console.log(`team=${TEAM_ID} slug=${SLUG} public=${PUBLIC_URL}`);
  console.log(`mode=${MODE_PLAN ? 'plan（変更しません）' : 'apply'}\n`);

  const events = await listTeamEvents();
  console.log(`チームのイベント数: ${events.length}`);

  const managed = events.find((e) => String(e.slug) === SLUG) ?? null;
  const parkedAll = events.filter((e) => PARKED_RE.test(String(e.slug ?? '')));

  console.log(`\n元のslug "${SLUG}" を持つイベント:`);
  console.log(managed ? `  ${describe(managed)}` : '  なし');
  console.log(`\n退避された "${SLUG}-old-*":`);
  if (parkedAll.length === 0) console.log('  なし');
  parkedAll.forEach((e) => console.log(`  ${describe(e)}`));

  if (parkedAll.length === 0) {
    console.error('\n退避された旧イベントが見つかりません。戻す対象がないため中止します。');
    process.exit(1);
  }
  if (parkedAll.length > 1) {
    console.error('\n退避された旧イベントが複数あります。どれを戻すか自動判断できないため中止します。');
    console.error('--slug で対象を絞るか、cal.com 側で整理してください。');
    process.exit(1);
  }
  const parked = parkedAll[0];
  const managedParkSlug = managed ? `${SLUG}-managed-${String(managed.id).slice(-6)}` : null;

  console.log('\n実行内容:');
  if (managed) console.log(`  1. マネージドを退避   ${managed.slug} -> ${managedParkSlug}（削除しません）`);
  else console.log('  1. マネージドなし。退避不要');
  console.log(`  2. 旧イベントを復帰   ${parked.slug} -> ${SLUG} / hidden=false / roundRobin`);
  console.log(`  3. 公開URLが200になることを確認   ${PUBLIC_URL}`);

  const before = await publicStatus(PUBLIC_URL);
  console.log(`\n現在の公開URL: ${PUBLIC_URL} -> ${before}`);
  if (before === 200 && MODE_APPLY) {
    console.log('すでに200です。変更せず終了します。');
    return;
  }

  if (MODE_PLAN) {
    console.log('\nplanモードのため、ここで終了します。実行するには --apply を付けてください。');
    return;
  }

  const state = {
    at: new Date().toISOString(),
    team_id: TEAM_ID,
    slug: SLUG,
    managed: null,
    parked: null
  };
  const writeState = () => fs.writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

  try {
    if (managed) {
      await patchEvent(managed.id, { slug: managedParkSlug });
      state.managed = { id: String(managed.id), slug_before: String(managed.slug), slug_after: managedParkSlug };
      await writeState();
      console.log(`\nマネージドを退避しました: ${managed.slug} -> ${managedParkSlug}`);
    }

    await patchEvent(parked.id, { slug: SLUG, hidden: false, schedulingType: 'roundRobin' });
    state.parked = {
      id: String(parked.id),
      slug_before: String(parked.slug),
      slug_after: SLUG,
      hidden_before: parked.hidden ?? true
    };
    await writeState();
    console.log(`旧イベントを復帰しました: ${parked.slug} -> ${SLUG}（表示ON / roundRobin）`);

    console.log('\n公開URLを確認します。');
    const ok = await waitForPublic(PUBLIC_URL, 200);
    if (!ok) throw new Error(`公開URLが200になりませんでした: ${PUBLIC_URL}`);

    console.log(`\n完了しました。${PUBLIC_URL} が予約可能です。`);
    console.log(`記録: ${STATE_FILE}（--rollback で戻せます）`);
    console.log('\n続けて、サイト側の導線を確認してください:');
    console.log('  npm run verify:booking-link');
  } catch (e) {
    console.error(`\n失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    console.error('元の状態へ戻します。');
    try {
      if (state.parked) {
        await patchEvent(state.parked.id, { slug: state.parked.slug_before, hidden: state.parked.hidden_before });
        console.error(`  旧イベントを戻しました: ${SLUG} -> ${state.parked.slug_before}`);
      }
      if (state.managed) {
        await patchEvent(state.managed.id, { slug: state.managed.slug_before });
        console.error(`  マネージドを戻しました: ${state.managed.slug_after} -> ${state.managed.slug_before}`);
      }
      console.error('元に戻しました。cal.com側は変更前の状態です。');
    } catch (revertErr) {
      console.error(`自動復旧に失敗しました: ${revertErr instanceof Error ? revertErr.message : String(revertErr)}`);
      console.error(`手作業で戻してください。記録: ${STATE_FILE}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
