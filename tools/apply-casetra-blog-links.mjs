#!/usr/bin/env node
/**
 * casetra.jp のブログ記事に、KIDUKI事務所サイトへの本文中リンクを1本ずつ入れる。
 * 指示書: content/exact/casetra-blog-links-2026-09-02-v1.json（read-only 承認資料）
 *
 *   node tools/apply-casetra-blog-links.mjs                       # dry-run（casetra.jp から読むだけ）
 *   node tools/apply-casetra-blog-links.mjs --apply --backup --backup-confirmed --approved-spec-sha256 <SHA>
 *
 * 各記事について: 指定の段落（先頭20字で特定）が本文にちょうど1回あること、同じリンクが未挿入であることを確認し、
 * その段落の直後に link_html を挿入する。apply 前に記事全体のJSONを backups/ に保存し、apply 後に再取得して照合する。
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getWordPressEnv, parseArgs, safeStamp, wpRequest } from './wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
const specPath = path.resolve(args.spec || 'content/exact/casetra-blog-links-2026-09-02-v1.json');
const specRaw = fs.readFileSync(specPath, 'utf8');
const spec = JSON.parse(specRaw);
const specSha = crypto.createHash('sha256').update(specRaw).digest('hex');
if (apply && (!args.backup || !args['backup-confirmed'])) throw new Error('Refusing casetra.jp writes without --backup --backup-confirmed.');
if (apply && args['approved-spec-sha256'] !== specSha) throw new Error(`Refusing apply: --approved-spec-sha256 must equal the spec SHA-256 (${specSha}).`);

const env = getWordPressEnv('casetra');
const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const results = [];
const backupDir = path.resolve('backups', `casetra-blog-links-${safeStamp()}`);

for (const item of spec.items) {
  const id = Number(item.casetra_post_id);
  const res = await wpRequest(env, 'GET', `/wp-json/wp/v2/posts/${id}?context=edit`);
  const post = res.data;
  const raw = post.content?.raw || '';
  const row = { id, slug: post.slug, status: post.status, modified: post.modified, target: item.target_url };
  if (post.slug !== item.casetra_slug) { row.error = `slug mismatch (live ${post.slug})`; results.push(row); continue; }
  if (raw.includes(item.target_url)) { row.skip = 'link already present'; results.push(row); continue; }
  const needle = String(item.insert_after_paragraph_starting_with).replace(/\*\*/g, '').slice(0, 20);
  const paras = [...raw.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)];
  const hits = paras.filter((m) => strip(m[0]).replace(/\*\*/g, '').startsWith(needle));
  if (hits.length !== 1) { row.error = `anchor paragraph matched ${hits.length} times (needle: ${needle})`; results.push(row); continue; }
  const anchor = hits[0];
  const insertAt = anchor.index + anchor[0].length;
  // keep block markup if the anchor is a block paragraph
  const afterAnchor = raw.slice(insertAt);
  const closesBlock = afterAnchor.startsWith('<!-- /wp:paragraph -->');
  const insertion = closesBlock
    ? `<!-- /wp:paragraph -->\n<!-- wp:paragraph -->\n${item.link_html}\n`
    : `\n${item.link_html}\n`;
  const next = closesBlock
    ? raw.slice(0, insertAt) + insertion + afterAnchor.slice('<!-- /wp:paragraph -->'.length)
    : raw.slice(0, insertAt) + insertion + afterAnchor;
  row.anchor_preview = strip(anchor[0]).slice(0, 60);
  row.link_preview = strip(item.link_html).slice(0, 90);
  row.bytes = { before: Buffer.byteLength(raw), after: Buffer.byteLength(next) };
  if (apply) {
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(backupDir, `post-${id}.json`), JSON.stringify(post, null, 2) + '\n', { mode: 0o600 });
    const upd = await wpRequest(env, 'POST', `/wp-json/wp/v2/posts/${id}`, { content: next });
    const verify = await wpRequest(env, 'GET', `/wp-json/wp/v2/posts/${id}?context=edit`);
    const vraw = verify.data.content?.raw || '';
    row.applied = vraw.includes(item.target_url) && verify.data.status === post.status;
    row.modified_after = verify.data.modified;
    if (!row.applied) row.error = 'post-apply verification failed (link not found or status changed)';
  }
  results.push(row);
}
console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', site: 'casetra', specPath, specSha256: specSha, backupDir: apply ? backupDir : null, results }, null, 2));
if (results.some((r) => r.error)) process.exit(1);
