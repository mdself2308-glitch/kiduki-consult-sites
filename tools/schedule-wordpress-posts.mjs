import crypto from 'node:crypto';
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
 *   node tools/schedule-wordpress-posts.mjs --plan content/article-plan.json --apply --backup --backup-confirmed
 */

const args = parseArgs(process.argv.slice(2));
const planPath = args.plan ? path.resolve(args.plan) : null;
const shouldApply = Boolean(args.apply);
const backupRequested = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);
const siteKey = args.site ?? 'office';

if (!planPath) {
  throw new Error(
    'Usage: node tools/schedule-wordpress-posts.mjs --plan content/article-plan.json [--apply --backup --backup-confirmed]',
  );
}
if (shouldApply && (!backupRequested || !backupConfirmed)) {
  throw new Error(
    'Refusing to write to WordPress without --backup --backup-confirmed.',
  );
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

function contentSha256(value) {
  return crypto
    .createHash('sha256')
    .update(String(value || '').replace(/\\u002d/gi, '-'))
    .digest('hex');
}

async function findBySlug(env, slug) {
  const response = await wpRequest(
    env,
    'GET',
    `/wp-json/wp/v2/posts?context=edit&slug=${encodeURIComponent(slug)}&status=publish,draft,pending,private,future&per_page=100&_fields=id,slug,status,title,date,modified,link,featured_media,categories,excerpt,content`,
  );
  return Array.isArray(response.data) && response.data.length > 0
    ? response.data[0]
    : null;
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
const prepared = [];
const existingSnapshots = [];
const env = getWordPressEnv(siteKey);

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
  const imagePath = item.featured_image ? path.resolve(planDir, item.featured_image) : null;
  if (imagePath && !fs.existsSync(imagePath)) {
    row.action = 'skipped_image_missing';
    row.detail = path.relative(planDir, imagePath);
    results.push(row);
    continue;
  }
  row.has_featured_image = Boolean(imagePath);
  const source = fs.readFileSync(contentPath, 'utf8');

  const existing = await findBySlug(env, item.slug);
  if (existing) {
    const expectedStatus = item.production_status === 'published' ? 'publish' : 'future';
    const expectedCategories = [...(item.categories ?? [])].sort((a, b) => a - b);
    const actualCategories = [...(existing.categories ?? [])].sort((a, b) => a - b);
    const matchesPlan =
      existing.slug === item.slug &&
      existing.status === expectedStatus &&
      existing.date === item.publish_at &&
      (existing.title?.raw ?? '') === item.title &&
      (existing.excerpt?.raw ?? '') === (item.excerpt ?? '') &&
      contentSha256(existing.content?.raw) === contentSha256(source) &&
      (!imagePath || Number(existing.featured_media || 0) > 0) &&
      JSON.stringify(actualCategories) === JSON.stringify(expectedCategories);
    if (!matchesPlan) {
      throw new Error(
        `${label}: an existing post uses this slug but does not match the reviewed plan (post ${existing.id}).`,
      );
    }
    row.action = existing.status === 'publish' ? 'exists_published_verified' : 'exists_verified';
    row.post_id = existing.id;
    row.status = existing.status;
    row.featured_media = existing.featured_media;
    row.categories = existing.categories;
    row.verified = true;
    existingSnapshots.push(existing);
    results.push(row);
    continue;
  }

  // A past date is safe only when the matching published post already exists.
  // Creating a missing post with a past date would publish it immediately.
  requireFuture(item.publish_at, label);

  if (!shouldApply) {
    row.action = 'would_schedule';
    results.push(row);
    continue;
  }

  row.action = 'ready_to_schedule';
  results.push(row);
  prepared.push({ item, contentPath, imagePath, source, row });
}

let backupDirectory = null;
if (shouldApply) {
  backupDirectory = path.resolve(
    'backups',
    `wp-scheduled-posts-${safeStamp()}`,
  );
  fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  fs.chmodSync(backupDirectory, 0o700);
  const backupPath = path.join(backupDirectory, 'pre-change-snapshot.json');
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        site: env.siteUrl,
        planPath,
        plan,
        existingPosts: existingSnapshots,
        postsToCreate: prepared.map(({ item }) => ({
          slug: item.slug,
          title: item.title,
          publish_at: item.publish_at,
        })),
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  fs.chmodSync(backupPath, 0o600);
}

for (const { item, imagePath, source, row } of prepared) {

  const payload = {
    title: item.title,
    slug: item.slug,
    content: source,
    excerpt: item.excerpt ?? '',
    status: 'future',
    date: item.publish_at,
    ...(Array.isArray(item.categories) ? { categories: item.categories } : {}),
    ...(Array.isArray(item.tags) ? { tags: item.tags } : {}),
  };
  if (imagePath) {
    payload.featured_media = await uploadFeaturedImage(env, imagePath, item.featured_image_alt ?? item.title);
  }
  const createdResponse = await wpRequest(
    env,
    'POST',
    '/wp-json/wp/v2/posts',
    payload,
  );
  const created = createdResponse.data;
  const verifiedResponse = await wpRequest(
    env,
    'GET',
    `/wp-json/wp/v2/posts/${created.id}?context=edit&_fields=id,slug,status,title,date,link,featured_media,categories,excerpt,content`,
  );
  const verified = verifiedResponse.data;
  const expectedCategories = [...(payload.categories ?? [])].sort((a, b) => a - b);
  const actualCategories = [...(verified.categories ?? [])].sort((a, b) => a - b);
  if (
    verified.slug !== item.slug ||
    verified.status !== 'future' ||
    verified.date !== item.publish_at ||
    (verified.title?.raw ?? '') !== item.title ||
    (verified.excerpt?.raw ?? '') !== (item.excerpt ?? '') ||
    contentSha256(verified.content?.raw) !== contentSha256(source) ||
    Number(verified.featured_media || 0) !== Number(payload.featured_media || 0) ||
    JSON.stringify(actualCategories) !== JSON.stringify(expectedCategories)
  ) {
    throw new Error(
      `Post verification failed for ${item.slug}. Backups: ${backupDirectory}`,
    );
  }
  row.action = 'scheduled';
  row.post_id = verified.id;
  row.status = verified.status;
  row.link = verified.link;
  row.featured_media = verified.featured_media;
  row.categories = verified.categories;
  row.verified = true;
}

const summary = results.reduce((acc, r) => {
  acc[r.action] = (acc[r.action] ?? 0) + 1;
  return acc;
}, {});

const report = {
  mode: shouldApply ? 'apply' : 'dry-run',
  at: safeStamp(),
  backupDirectory,
  summary,
  results,
};
console.log(JSON.stringify(report, null, 2));

if (results.some((r) => r.action === 'scheduled')) {
  console.error('\n予約投稿を作成しました。WordPress の投稿一覧で「予約済み」を確認してください。');
}
