import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  requireContentType,
  safeStamp,
  wpRequest,
} from './wordpress-rest-utils.mjs';
import { siteConfig } from './kdk-site-config.mjs';

const args = parseArgs(process.argv.slice(2));
const type = args.type;
const id = Number(args.id);

if (!type || !id) {
  throw new Error(
    'Usage: node tools/push-wordpress-content.mjs --type page|post --id 24 [--content file.html | --from-backup backup.json] [--title "..."] [--status draft|publish|private|pending|future] [--dry-run | --apply --backup --backup-confirmed]',
  );
}

if (
  type === 'page' &&
  id === siteConfig.frontPagePlaceholderId &&
  !args['allow-front-page-placeholder']
) {
  throw new Error(
    'Refusing to update WordPress page 18: the production homepage is consult/index.html. Pass --allow-front-page-placeholder only for an explicitly requested placeholder-page operation.',
  );
}

const restBase = requireContentType(type);
const shouldApply = Boolean(args.apply);
const shouldBackup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);
const isDryRun = Boolean(args['dry-run']) || !shouldApply;

if (shouldApply && (!shouldBackup || !backupConfirmed)) {
  throw new Error(
    'Refusing live WordPress update without --backup --backup-confirmed.',
  );
}

const contentPath = args.content ? path.resolve(args.content) : null;
const backupSourcePath = args['from-backup']
  ? path.resolve(args['from-backup'])
  : null;

if (
  !contentPath &&
  !backupSourcePath &&
  !args.title &&
  !args.status &&
  !args.slug &&
  !args.excerpt
) {
  throw new Error('No content or metadata update was supplied.');
}

if (contentPath && !fs.existsSync(contentPath)) {
  throw new Error(`Content file not found: ${contentPath}`);
}
if (backupSourcePath && !fs.existsSync(backupSourcePath)) {
  throw new Error(`Backup file not found: ${backupSourcePath}`);
}

const env = getWordPressEnv();
const currentResponse = await wpRequest(
  env,
  'GET',
  `/wp-json/wp/v2/${restBase}/${id}?context=edit`,
);
const current = currentResponse.data;
const backupSource = backupSourcePath
  ? JSON.parse(fs.readFileSync(backupSourcePath, 'utf8'))
  : null;

let nextContent = null;
if (contentPath) nextContent = fs.readFileSync(contentPath, 'utf8');
if (backupSource) nextContent = backupSource.content?.raw || '';

const payload = {};
if (nextContent !== null) payload.content = nextContent;
if (args.title) payload.title = args.title;
if (args.status) payload.status = args.status;
if (args.slug) payload.slug = args.slug;
if (args.excerpt) payload.excerpt = args.excerpt;
if (backupSource) {
  if (backupSource.title?.raw) payload.title = backupSource.title.raw;
  if (backupSource.status) payload.status = backupSource.status;
  if (backupSource.slug) payload.slug = backupSource.slug;
  if (backupSource.excerpt?.raw) payload.excerpt = backupSource.excerpt.raw;
}

const summary = {
  dryRun: isDryRun,
  type,
  id,
  current: {
    slug: current.slug,
    status: current.status,
    title: current.title?.raw || current.title?.rendered || '',
    modified: current.modified,
    contentBytes: Buffer.byteLength(current.content?.raw || ''),
  },
  next: {
    slug: payload.slug ?? current.slug,
    status: payload.status ?? current.status,
    title:
      payload.title ?? current.title?.raw ?? current.title?.rendered ?? '',
    contentBytes:
      nextContent === null
        ? Buffer.byteLength(current.content?.raw || '')
        : Buffer.byteLength(nextContent),
  },
};

if (isDryRun) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

const backupDir = path.resolve('backups');
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(
  backupDir,
  `wp-${type}-${id}-before-${safeStamp()}.json`,
);
fs.writeFileSync(backupPath, `${JSON.stringify(current, null, 2)}\n`);

const updatedResponse = await wpRequest(
  env,
  'POST',
  `/wp-json/wp/v2/${restBase}/${id}`,
  payload,
);
const updated = updatedResponse.data;

console.log(
  JSON.stringify(
    {
      ok: true,
      backupPath,
      type,
      id: updated.id,
      slug: updated.slug,
      status: updated.status,
      modified: updated.modified,
      link: updated.link,
      contentBytes: Buffer.byteLength(updated.content?.raw || nextContent || ''),
    },
    null,
    2,
  ),
);

