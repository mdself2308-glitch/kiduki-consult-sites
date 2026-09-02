#!/usr/bin/env node
/**
 * 先生（宮部大輔）の「B OK」のような一言承認を、監査できる記録に変える。
 *
 *   node tools/record-owner-approval.mjs --codes B,C --message "B C OK" --record
 *   node tools/record-owner-approval.mjs --codes F --hold --message "Fは保留" --record
 *
 * --record が無ければ dry-run（何も書かない）。
 * 記録先: content/evidence/owner-approvals-2026-09.json（追記）と、各成果物に結びついたチケットの frontmatter。
 * exact ファイル自体は書き換えない（ハッシュが承認対象なので）。
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const record = Boolean(args.record);
const hold = Boolean(args.hold);
const message = String(args.message || '').trim();
const codes = String(args.codes || '').split(/[,\s]+/).map((c) => c.trim()).filter(Boolean);
if (!codes.length) throw new Error('Usage: --codes B,C,T --message "<先生の発言>" [--hold] [--record]');
if (record && !message) throw new Error('--record には --message（先生の発言そのまま）が必要です。');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const now = new Date();
const jst = new Date(now.getTime() + 9 * 3600 * 1000);
const stamp = jst.toISOString().replace('Z', '+09:00');
const evidencePath = 'content/evidence/owner-approvals-2026-09.json';
const umbrellaTicket = 'content/tasks/CT-20260902-seo-ranking-recovery.md';
const plan = JSON.parse(fs.readFileSync('content/article-plan.json', 'utf8'));

const REGISTRY = {
  B: {
    label: '12記事CTA v6（記事末のお誘い文を記事ごとの主導線へ）',
    exact: 'content/exact/article-cta-owner-review-2026-09-01-v6.json',
    version: '2026-09-01-v6',
    tickets: plan.articles.map((a) => `content/tasks/CT-20260901-${a.slug}.md`),
    perTicketSha: (bundle, ticketPath) => {
      const slug = path.basename(ticketPath).replace(/^CT-20260901-/, '').replace(/\.md$/, '');
      return bundle.items.find((i) => i.slug === slug)?.source_sha256 || null;
    },
    apply: 'npm run wp:update-article-ctas -- --apply --backup --backup-confirmed --wordpress-apply-authority-confirmed --approved-version 2026-09-01-v6 --approval-bundle content/exact/article-cta-owner-review-2026-09-01-v6.json --approved-bundle-sha256 <SHA> --allow-reviewed-full-body',
  },
  C: {
    label: 'ストレスチェック2028 v3（post 1555 本文・title・meta）',
    exact: 'content/exact/stresscheck-small-workplace-2028-2026-09-01-v3.json',
    version: '2026-09-01-v3',
    tickets: ['content/tasks/CT-20260901-stresscheck-small-workplace-2028.md'],
    apply: 'npm run wp:update-stresscheck-2028 -- --apply --backup --backup-confirmed --approved-version 2026-09-01-v3 --approval-bundle content/exact/stresscheck-small-workplace-2028-2026-09-01-v3.json --approved-bundle-sha256 <SHA>  ／ その後 node kiduki/scripts/configure-seo-meta.mjs --manifest kiduki/config/seo-stresscheck-small-workplace-2028-2026-09-01-v3.json --ids 1555 --apply --backup --backup-confirmed --approved-version 2026-09-01-v3 --approval-bundle <同じ> --approved-bundle-sha256 <SHA>',
  },
  T: {
    label: '嘱託産業医ページ 東京向け増強 v2（page 160）',
    exact: 'content/exact/tokyo-industrial-physician-page-160-2026-09-02-v2.json',
    version: '2026-09-02-v2',
    tickets: [],
    apply: 'npm run wp:update-tokyo-sangyoui -- --apply --backup --backup-confirmed --approved-version 2026-09-02-v2 --approval-bundle content/exact/tokyo-industrial-physician-page-160-2026-09-02-v2.json --approved-bundle-sha256 <SHA> ／ その後 configure-seo-meta（manifest kiduki/config/seo-tokyo-sangyoui-2026-09-02-v2.json --ids 160）',
  },
  F: {
    label: '新記事F 既存産業医を替えずに専門支援を追加（下書き作成）',
    exact: 'content/exact/existing-industrial-physician-specialist-support-2026-09-01-v1.json',
    version: '2026-09-01-v1',
    tickets: ['content/tasks/CT-20260901-existing-industrial-physician-specialist-support.md'],
    apply: 'npm run wp:create-existing-physician-specialist -- --apply --backup --backup-confirmed --creation-authority-confirmed --approved-version 2026-09-01-v1 --approval-bundle content/exact/existing-industrial-physician-specialist-support-2026-09-01-v1.json --approved-bundle-sha256 <SHA>',
  },
  G: {
    label: '新記事G 産業医面談・意見書・再評価の案件管理（下書き作成）',
    exact: 'content/exact/occupational-health-case-management-2026-09-01-v1.json',
    version: '2026-09-01-v1',
    tickets: ['content/tasks/CT-20260901-occupational-health-case-management.md'],
    apply: 'npm run wp:create-occupational-health-case-management -- --apply --backup --backup-confirmed --creation-authority-confirmed --approved-version 2026-09-01-v1 --approval-bundle content/exact/occupational-health-case-management-2026-09-01-v1.json --approved-bundle-sha256 <SHA>',
  },
  P: {
    label: 'Pack・SPOT申込面 GA4プライバシー v1（静的2ファイルの公開）',
    exact: 'content/exact/static-lead-form-ga4-privacy-2026-09-01-v1.json',
    version: '2026-09-01-v1',
    tickets: [],
    apply: 'git add consult/return-to-work-pack/index.html consult/return-to-work-spot/index.html → commit → push（Run 1回）→ npm run verify:static-lead-release-after-deploy',
  },
  166: {
    label: '産業衛生DX・Casetraページ v2（page 166 本文・title・meta）',
    exact: 'content/exact/dx-service-page-166-2026-09-02-v2.json',
    version: '2026-09-02-v2',
    tickets: [],
    apply: 'npm run wp:update-dx-cloud -- --apply --backup --backup-confirmed --approved-version 2026-09-02-v2 --approval-bundle content/exact/dx-service-page-166-2026-09-02-v2.json --approved-bundle-sha256 <SHA> ／ その後 configure-seo-meta（manifest kiduki/config/seo-dx-cloud-2026-09-02-v2.json --ids 166）',
  },
  FAQ: {
    label: 'よくあるご質問ページ（page 39）のH1を1つにする（本文の2つをH2へ）',
    exact: 'content/exact/internal-fixes-2026-09-02-v1.json',
    version: '2026-09-02-v1',
    tickets: [],
    apply: 'node tools/push-wordpress-content.mjs --type page --id 39 --content content/exact/faq-page-39-h1-fix-2026-09-02-v1-body.html --apply --backup --backup-confirmed',
  },
  1472: {
    label: '旧記事「産業医事務所とは」の最小修正（金額枠・リンク切れ・根拠のない主張の削除）',
    exact: 'content/exact/internal-fixes-2026-09-02-v1.json',
    version: '2026-09-02-v1',
    tickets: [],
    apply: 'node tools/push-wordpress-content.mjs --type post --id 1472 --content content/exact/post-1472-minimal-fix-2026-09-02-v1-body.html --apply --backup --backup-confirmed',
  },
  IMG: {
    label: 'ヘッダー画像 1.68MB PNG → 113KB WebP（page 164・post 1809 のアイキャッチ）',
    exact: 'content/exact/internal-fixes-2026-09-02-v1.json',
    version: '2026-09-02-v1',
    tickets: [],
    apply: 'node tools/replace-featured-image.mjs --apply --backup --backup-confirmed',
  },
  THEME2: {
    label: '子テーマ第2弾（OGP、著者アーカイブcanonical、フォント非ブロック化、contact以外でreCAPTCHAを外す）',
    exact: 'kiduki/wp-content/themes/kiduki-child/functions.php',
    version: 'functions.php 2026-09-02b',
    tickets: [],
    apply: 'node kiduki/scripts/deploy-kiduki-child-files.mjs（dry-run）→ 同 --apply --backup --backup-confirmed → npm run verify',
  },
  CASETRA: {
    label: 'casetra.jp ブログ5本からKIDUKI記事・ページへの本文中リンク（各1本・UTMなし）',
    exact: 'content/exact/casetra-blog-links-2026-09-02-v1.json',
    version: '2026-09-02-v1',
    tickets: [],
    apply: 'node tools/apply-casetra-blog-links.mjs --apply --backup --backup-confirmed --approved-spec-sha256 <SHA>',
  },
  HOME2: {
    label: '静的トップ第2弾（フォント非ブロック化・main・フッター文字色・DXページへの内部リンク）を main へ push（先生の Run）',
    exact: 'consult/index.html',
    version: 'consult/index.html 2026-09-02b',
    tickets: [],
    apply: 'チャットの Run（git add/commit -F content/exact/commit-message-2026-09-02b.txt/push）→ 3分後 npm run verify:live-match',
  },
  R1: {
    label: 'A4一枚「会社が決めること・記録すること」（サイト内の記録シートとして）',
    exact: 'content/exact/company-decision-record-sheet-2026-09-v1.json',
    version: '2026-09-v1',
    tickets: [],
    apply: '（exact作成後に定義）',
  },
};

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error('frontmatter not found');
  const fields = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { raw: m[0], fields };
}
function setFrontmatterField(text, key, value) {
  const re = new RegExp(`^${key}:.*$`, 'm');
  if (!re.test(text.split('\n---\n')[0] + '\n---\n' + text.split('\n---\n')[0])) {
    // key missing: insert before closing ---
    return text.replace(/\n---\n/, `\n${key}: ${value}\n---\n`);
  }
  return text.replace(re, `${key}: ${value}`);
}

const results = [];
for (const code of codes) {
  const entry = REGISTRY[code];
  if (!entry) { results.push({ code, error: 'unknown code' }); continue; }
  if (!fs.existsSync(entry.exact)) { results.push({ code, error: `exact file missing: ${entry.exact}` }); continue; }
  const raw = fs.readFileSync(entry.exact, 'utf8');
  const exactSha = sha256(raw);
  let bundle = null;
  try { bundle = JSON.parse(raw); } catch { bundle = null; }
  const ticketChecks = [];
  for (const t of entry.tickets) {
    if (!fs.existsSync(t)) { ticketChecks.push({ ticket: t, ok: false, reason: 'missing' }); continue; }
    const { fields } = parseFrontmatter(fs.readFileSync(t, 'utf8'));
    const expectedSha = entry.perTicketSha ? entry.perTicketSha(bundle, t) : exactSha;
    const ok = fields.exact_version === entry.version && fields.exact_version_sha256 === expectedSha && fields.approval_owner === '宮部 大輔';
    ticketChecks.push({ ticket: t, ok, current_status: fields.status, reason: ok ? null : `version/sha/owner mismatch (ticket ${fields.exact_version} ${String(fields.exact_version_sha256).slice(0, 12)} vs ${entry.version} ${String(expectedSha).slice(0, 12)})` });
  }
  const allOk = ticketChecks.every((c) => c.ok);
  const decision = hold ? 'hold' : 'approved';
  const evidenceEntry = {
    code, label: entry.label, decision, recorded_at: stamp, approver: '宮部 大輔', approver_account: 'kdkconsult.sngyijm@gmail.com',
    channel: 'Claude Code chat', message, exact_path: entry.exact, exact_version: entry.version, exact_sha256: exactSha,
    tickets: ticketChecks.map((c) => c.ticket), recorded_by: 'Claude (record-owner-approval.mjs)',
  };
  if (record && allOk) {
    const evidence = fs.existsSync(evidencePath) ? JSON.parse(fs.readFileSync(evidencePath, 'utf8')) : { schema_version: 1, note: '先生の一言承認の記録。ハッシュはClaudeが記録時に計算。exactファイルは書き換えない。', approvals: [] };
    evidence.approvals.push(evidenceEntry);
    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 1) + '\n');
    if (decision === 'approved') {
      for (const t of entry.tickets) {
        let text = fs.readFileSync(t, 'utf8');
        text = setFrontmatterField(text, 'status', 'approved');
        text = setFrontmatterField(text, 'owner_decision', 'approved');
        text = setFrontmatterField(text, 'last_verified', stamp.slice(0, 10));
        text = setFrontmatterField(text, 'approval_evidence', `${evidencePath}#${code}@${stamp}`);
        text = setFrontmatterField(text, 'physician_approval', `宮部 大輔（代表医師本人） ${stamp} chat「${message.replace(/\n/g, ' ')}」`);
        if (text.includes('## State history')) {
          text = text.trimEnd() + `\n| ${stamp.slice(0, 16).replace('T', ' ')} JST | owner-review | approved | 先生の一言「${message.replace(/\n/g, ' ')}」。記録 ${evidencePath}#${code} |\n`;
        }
        fs.writeFileSync(t, text);
      }
      // umbrella ticket note
      let u = fs.readFileSync(umbrellaTicket, 'utf8');
      u = u.trimEnd() + `\n| ${stamp.slice(0, 16).replace('T', ' ')} JST | 同左 | 同左 / ${code} approved | 先生の一言「${message.replace(/\n/g, ' ')}」で ${entry.label} を承認。exact ${entry.exact} SHA ${exactSha.slice(0, 16)}…。記録 ${evidencePath} |\n`;
      fs.writeFileSync(umbrellaTicket, u);
    }
  }
  results.push({ code, label: entry.label, decision, exact: entry.exact, exact_sha256: exactSha, tickets: ticketChecks, ready: allOk, recorded: record && allOk, next: entry.apply.replace(/<SHA>/g, exactSha) });
}
console.log(JSON.stringify({ mode: record ? 'record' : 'dry-run', stamp, results }, null, 2));
if (results.some((r) => r.error || r.ready === false)) process.exit(1);
