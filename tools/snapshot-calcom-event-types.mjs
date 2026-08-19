#!/usr/bin/env node
/**
 * cal.com のチームイベント種別を丸ごと保存する。
 *
 * cal.com の操作ログは上位プランの機能なので、何をいつ変えたかの記録は手元に作るしかない。
 * 破壊的な変更（削除・slug変更・表示切替）の前後でこれを実行し、差分をコミットしておく。
 * 削除したイベントは戻せないが、「何が存在していたか」は残る。
 *
 * 一覧の取得は cal.com が認証なしで応答するため、鍵は不要。
 *
 * 使い方:
 *   node tools/snapshot-calcom-event-types.mjs                 # reports/calcom/ へ保存
 *   node tools/snapshot-calcom-event-types.mjs --stdout        # 標準出力だけ
 *   node tools/snapshot-calcom-event-types.mjs --label before-delete-32
 *
 * 環境変数: CAL_TEAM_ID（既定 147934） / CAL_API_BASE_URL
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const argv = process.argv.slice(2);
const arg = (name, fallback = '') => {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : fallback;
};

const TEAM_ID = arg('--team-id', process.env.CAL_TEAM_ID ?? '147934').trim();
const BASE_URL = (process.env.CAL_API_BASE_URL ?? 'https://api.cal.com/v2').replace(/\/+$/, '');
const LABEL = arg('--label', 'snapshot').replace(/[^a-zA-Z0-9._-]/g, '-');
const TO_STDOUT = argv.includes('--stdout');

const res = await fetch(`${BASE_URL}/teams/${TEAM_ID}/event-types`, {
  headers: { 'cal-api-version': '2024-09-04' }
});
if (!res.ok) {
  console.error(`取得に失敗しました: ${res.status}`);
  process.exit(1);
}
const events = (await res.json())?.data ?? [];

// 復元や監査で本当に要る項目だけ残す。全文だと差分が読めない。
const rows = events
  .map((e) => ({
    id: String(e.id),
    slug: String(e.slug ?? ''),
    title: String(e.title ?? ''),
    hidden: e.hidden === true,
    schedulingType: e.schedulingType ?? null,
    lengthInMinutes: e.lengthInMinutes ?? null,
    assignAllTeamMembers: e.assignAllTeamMembers === true,
    parentEventTypeId: e.parentEventTypeId ?? null,
    hosts: (e.hosts ?? []).map((h) => h.username).sort()
  }))
  .sort((a, b) => Number(a.id) - Number(b.id));

const kind = (slug) => (/-old-\d+$/.test(slug) ? 'old' : /-managed-tmp-\d+$/.test(slug) ? 'managed-tmp' : 'current');
const counts = rows.reduce((acc, r) => {
  const k = kind(r.slug);
  acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});

const snapshot = { team_id: TEAM_ID, total: rows.length, counts, event_types: rows };
const json = `${JSON.stringify(snapshot, null, 2)}\n`;

if (TO_STDOUT) {
  process.stdout.write(json);
} else {
  const dir = path.join(process.cwd(), 'reports', 'calcom');
  fs.mkdirSync(dir, { recursive: true });
  // 時刻はファイル名に入れない。差分を読むのが目的なので、同じラベルは上書きして git の履歴に任せる。
  const file = path.join(dir, `event-types-${TEAM_ID}-${LABEL}.json`);
  fs.writeFileSync(file, json, 'utf8');
  console.log(`保存しました: ${path.relative(process.cwd(), file)}`);
}

console.log(`合計 ${rows.length} 件 = ` + Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' + '));
