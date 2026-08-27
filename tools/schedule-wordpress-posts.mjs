import fs from 'node:fs';
import path from 'node:path';
import { getWordPressEnv, parseArgs, wpRequest, safeStamp } from './wordpress-rest-utils.mjs';

/**
 * 記事を予約投稿として WordPress に置く。
 *
 * 既存の push-wordpress-content.mjs は ID 指定で既存記事を更新するもので、新規記事を
 * 未来日で積むことはできない。こちらは記事の台帳（JSON）を読み、まだ WordPress に無い
 * ものだけを status=future で作成する。
 *
 * 二重投稿を防ぐのは slug。台帳の slug で既存記事を検索し、見つかればスキップする。
 * 走らせ直しても同じ記事が増えない。ストックを書き足しながら何度も実行する運用を想定。
 *
 * 既定は下見。実際に書き込むには --apply が要る（既存ツールと同じ作法）。
 *
 * 使い方:
 *   node tools/schedule-wordpress-posts.mjs --plan content/article-plan.json
 *   node tools/schedule-wordpress-posts.mjs --plan content/article-plan.json --apply --backup-confirmed
 */

const args = parseArgs(process.argv.slice(2));
const planPath = args.plan ? path.resolve(args.plan) : null;
const shouldApply = Boolean(args.apply);
const backupConfirmed = Boolean(args['backup-confirmed']);
const siteKey = args.site ?? 'wordpress';

if (!planPath) {
  throw new Error(
    'Usage: node tools/schedule-wordpress-posts.mjs --plan content/article-plan.json [--apply --backup-confirmed]',
  );
}
if (shouldApply && !backupConfirmed) {
  throw new Error('Refusing to write to WordPress without --backup-confirmed.');
}
if (!fs.existsSync(planPath)) throw new Error(`plan not found: ${planPath}`);

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const planDir = path.dirname(planPath);

/**
 * 公開日時は台帳に JST で書く。WordPress の `date` はサイトのタイムゾーンで解釈される
 * ため、ここで UTC へ変換しない。ずらすと予約が9時間動く。
 */
function requireFuture(dateJst, label) {
  const parsed = Date.parse(`${dateJst}+09:00`);
  if (!Number.isFinite(parsed)) throw new Error(`${label}: date is not parseable: ${dateJst}`);
  if (parsed <= Date.now()) {
    // 過去日で future を渡すと WordPress は即時公開する。予約のつもりが公開になる。
    throw new Error(`${label}: publish_at is in the past (${dateJst}). WordPress would publish it immediately.`);
  }
  return dateJst;
}

async function findBySlug(env, slug) {
  const found = await wpRequest(env, 'GET', `/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=any&per_page=1`);
  return Array.isArray(found) && found.length > 0 ? found[0] : null;
}

async function uploadFeaturedImage(env, filePath, altText) {
  const bytes = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const response = await fetch(`${env.siteUrl}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.username}:${env.password}`).toString('base64')}`,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': mime,
      'User-Agent': 'kdk-wordpress-local-tools/1.0',
    },
    body: bytes,
  });
  if (!response.ok) {
    throw new Error(`media upload failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }
  const media = await response.json();
  if (altText) {
    await wpRequest(env, 'POST', `/wp-json/wp/v2/media/${media.id}`, { alt_text: altText });
  }
  return media.id;
}

const results = [];
const env = shouldApply || args.check ? getWordPressEnv(siteKey) : null;

for (const [index, item] of (plan.articles ?? []).entries()) {
  const label = item.slug || `#${index}`;
  const contentPath = path.resolve(planDir, item.content);
  const row = {
    slug: item.slug,
    title: item.title,
    publish_at: item.publish_at,
    action: 'pending',
  };

  if (!fs.existsSync(contentPath)) {
    // 台帳に載っていて原稿が無いものは、書き上がっていない記事。予約対象から外すだけで、
    // エラーにはしない。ストックを書きながら回すため。
    row.action = 'skipped_draft_missing';
    row.detail = path.relative(planDir, contentPath);
    results.push(row);
    continue;
  }
  requireFuture(item.publish_at, label);

  const imagePath = item.featured_image ? path.resolve(planDir, item.featured_image) : null;
  if (imagePath && !fs.existsSync(imagePath)) {
    row.action = 'skipped_image_missing';
    row.detail = path.relative(planDir, imagePath);
    results.push(row);
    continue;
  }
  row.has_featured_image = Boolean(imagePath);

  if (!shouldApply) {
    row.action = 'would_schedule';
    results.push(row);
    continue;
  }

  const existing = await findBySlug(env, item.slug);
  if (existing) {
    row.action = 'exists_untouched';
    row.post_id = existing.id;
    row.status = existing.status;
    results.push(row);
    continue;
  }

  const payload = {
    title: item.title,
    slug: item.slug,
    content: fs.readFileSync(contentPath, 'utf8'),
    excerpt: item.excerpt ?? '',
    status: 'future',
    date: item.publish_at,
    ...(Array.isArray(item.categories) ? { categories: item.categories } : {}),
    ...(Array.isArray(item.tags) ? { tags: item.tags } : {}),
  };
  if (imagePath) {
    payload.featured_media = await uploadFeaturedImage(env, imagePath, item.featured_image_alt ?? item.title);
  }
  const created = await wpRequest(env, 'POST', '/wp-json/wp/v2/posts', payload);
  row.action = 'scheduled';
  row.post_id = created.id;
  row.status = created.status;
  row.link = created.link;
  results.push(row);
}

const summary = results.reduce((acc, r) => {
  acc[r.action] = (acc[r.action] ?? 0) + 1;
  return acc;
}, {});

const report = { mode: shouldApply ? 'apply' : 'dry-run', at: safeStamp(), summary, results };
console.log(JSON.stringify(report, null, 2));

if (results.some((r) => r.action === 'scheduled')) {
  console.error('\n予約投稿を作成しました。WordPress の投稿一覧で「予約済み」を確認してください。');
}
