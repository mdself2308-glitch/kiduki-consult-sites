import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from './wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const configPath = path.resolve(
  args.config || 'kiduki/config/seo-post-return-to-work-process-roles.json',
);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing WordPress post creation without --backup --backup-confirmed.',
  );
}

for (const field of [
  'release',
  'type',
  'slug',
  'title',
  'status',
  'source',
  'excerpt',
  'metaDescription',
]) {
  if (!config[field]) throw new Error(`Missing required config field: ${field}`);
}
if (config.type !== 'post') throw new Error('Only WordPress posts are supported.');
if (!['draft', 'publish'].includes(config.status)) {
  throw new Error('Post status must be draft or publish.');
}

const sourcePath = path.resolve(config.source);
if (!fs.existsSync(sourcePath)) {
  throw new Error(`Post source does not exist: ${sourcePath}`);
}
const source = fs.readFileSync(sourcePath, 'utf8');

function contentSha256(value) {
  return crypto
    .createHash('sha256')
    .update(String(value || '').replace(/\\u002d/gi, '-'))
    .digest('hex');
}

function cleanRendered(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .trim();
}

const env = getWordPressEnv();
const existingResponse = await wpRequest(
  env,
  'GET',
  `/wp-json/wp/v2/posts?context=edit&slug=${encodeURIComponent(config.slug)}&per_page=100&status=publish,draft,pending,private,future`,
);
const existing = existingResponse.data;
if (existing.length > 0) {
  throw new Error(
    `Refusing to create duplicate slug "${config.slug}"; existing post ids: ${existing
      .map((item) => item.id)
      .join(', ')}.`,
  );
}

const payload = {
  title: config.title,
  slug: config.slug,
  status: config.status,
  excerpt: config.excerpt,
  content: source,
};

if (!apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        persistentWrites: false,
        configPath,
        sourcePath,
        release: config.release,
        duplicateSlugMatches: 0,
        next: {
          slug: payload.slug,
          status: payload.status,
          title: payload.title,
          excerpt: payload.excerpt,
          contentBytes: Buffer.byteLength(source),
          contentSha256: contentSha256(source),
        },
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const backupDirectory = path.resolve(
  'backups',
  `wp-post-create-${safeStamp()}`,
);
fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
fs.chmodSync(backupDirectory, 0o700);
const backupPath = path.join(backupDirectory, 'pre-create-slug-query.json');
fs.writeFileSync(
  backupPath,
  `${JSON.stringify(
    {
      site: env.siteUrl,
      slug: config.slug,
      matches: existing,
    },
    null,
    2,
  )}\n`,
  { mode: 0o600 },
);
fs.chmodSync(backupPath, 0o600);

const response = await wpRequest(env, 'POST', '/wp-json/wp/v2/posts', payload);
const created = response.data;
const createdTitle =
  created.title?.raw || cleanRendered(created.title?.rendered || '');
const verified =
  Number(created.id) > 0 &&
  created.slug === payload.slug &&
  created.status === payload.status &&
  createdTitle === payload.title &&
  contentSha256(created.content?.raw || source) === contentSha256(source);
if (!verified) {
  throw new Error(
    `Verification failed after creating WordPress post. Pre-create backup: ${backupPath}`,
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      release: config.release,
      backupPath,
      created: {
        id: created.id,
        slug: created.slug,
        status: created.status,
        modified: created.modified,
        link: created.link,
        title: createdTitle,
        contentSha256: contentSha256(created.content?.raw || source),
      },
    },
    null,
    2,
  ),
);
