#!/usr/bin/env node
/**
 * 重いアイキャッチ（1.68MB PNG, media 152）を軽いWebPへ置き換える。
 *
 *   node tools/replace-featured-image.mjs                                   # dry-run
 *   node tools/replace-featured-image.mjs --apply --backup --backup-confirmed
 *
 * 手順: (1) content/exact/service-header-2026-09-02.webp を /wp-json/wp/v2/media にアップロード（alt/title付き）
 *       (2) page 164 と post 1809 の featured_media を新IDへ変更 (3) 再取得して照合。旧メディア152は削除しない。
 */
import fs from 'node:fs';
import path from 'node:path';
import { getWordPressEnv, parseArgs, safeStamp, wpRequest } from './wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const apply = Boolean(args.apply);
if (apply && (!args.backup || !args['backup-confirmed'])) throw new Error('Refusing WordPress writes without --backup --backup-confirmed.');
const filePath = path.resolve(args.file || 'content/exact/service-header-2026-09-02.webp');
const oldMediaId = Number(args['old-media'] || 152);
const targets = [{ type: 'pages', id: 164 }, { type: 'posts', id: 1809 }];
const alt = '東京・港区の産業医事務所KIDUKIの復職支援・スポット産業医サービス';
const env = getWordPressEnv();

const current = [];
for (const t of targets) {
  const r = await wpRequest(env, 'GET', `/wp-json/wp/v2/${t.type}/${t.id}?context=edit&_fields=id,slug,featured_media,modified`);
  current.push({ ...t, slug: r.data.slug, featured_media: r.data.featured_media, modified: r.data.modified });
}
const old = await wpRequest(env, 'GET', `/wp-json/wp/v2/media/${oldMediaId}?_fields=id,source_url,media_details`);
const summary = { mode: apply ? 'apply' : 'dry-run', file: filePath, fileBytes: fs.statSync(filePath).size, oldMedia: { id: oldMediaId, url: old.data.source_url, bytes: old.data.media_details?.filesize || null }, targets: current };
if (!current.every((c) => c.featured_media === oldMediaId)) {
  summary.error = 'a target no longer uses the old media as featured image; review before apply';
  console.log(JSON.stringify(summary, null, 2)); process.exit(1);
}
if (!apply) { console.log(JSON.stringify(summary, null, 2)); process.exit(0); }

const backupDir = path.resolve('backups', `featured-image-${safeStamp()}`);
fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(backupDir, 'before.json'), JSON.stringify(summary, null, 2) + '\n', { mode: 0o600 });

// upload via fetch (multipart) using the same auth header wpRequest builds
const auth = 'Basic ' + Buffer.from(`${env.username}:${env.password}`).toString('base64');
const form = new FormData();
form.append('file', new Blob([fs.readFileSync(filePath)], { type: 'image/webp' }), 'kiduki-service-header.webp');
form.append('title', 'KIDUKI 産業医サービス ヘッダー');
form.append('alt_text', alt);
const up = await fetch(`${env.siteUrl}/wp-json/wp/v2/media`, { method: 'POST', headers: { Authorization: auth }, body: form });
if (!up.ok) throw new Error(`media upload failed (${up.status}): ${(await up.text()).slice(0, 300)}`);
const media = await up.json();
const updated = [];
for (const t of current) {
  const r = await wpRequest(env, 'POST', `/wp-json/wp/v2/${t.type}/${t.id}`, { featured_media: media.id });
  const v = await wpRequest(env, 'GET', `/wp-json/wp/v2/${t.type}/${t.id}?context=edit&_fields=id,slug,featured_media,modified,status`);
  updated.push({ ...t, featured_media_after: v.data.featured_media, status: v.data.status, modified: v.data.modified, ok: v.data.featured_media === media.id });
}
console.log(JSON.stringify({ ...summary, backupDir, newMedia: { id: media.id, url: media.source_url, bytes: media.media_details?.filesize || null }, updated }, null, 2));
if (!updated.every((u) => u.ok)) process.exit(1);
