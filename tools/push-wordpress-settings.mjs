import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  safeStamp,
  wpRequest,
} from './wordpress-rest-utils.mjs';

/**
 * Update a whitelisted subset of WordPress site settings.
 *
 * Only the keys in ALLOWED_KEYS can ever be written. This is deliberate:
 * the settings endpoint can change site-wide behaviour, so this tool is
 * restricted to the presentational fields we actually need.
 */
const ALLOWED_KEYS = new Set(['title', 'description']);

const args = parseArgs(process.argv.slice(2));
const shouldApply = Boolean(args.apply);
const shouldBackup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);
const isDryRun = Boolean(args['dry-run']) || !shouldApply;

const updates = {};
for (const key of ALLOWED_KEYS) {
  if (typeof args[key] === 'string' && args[key].length > 0) {
    updates[key] = args[key];
  }
}

const unknown = Object.keys(args).filter(
  (k) =>
    !['apply', 'backup', 'backup-confirmed', 'dry-run'].includes(k) &&
    !ALLOWED_KEYS.has(k),
);

if (unknown.length > 0) {
  throw new Error(
    `Refusing to run: ${unknown.join(', ')} is not a writable setting. Allowed: ${[...ALLOWED_KEYS].join(', ')}`,
  );
}

if (Object.keys(updates).length === 0) {
  throw new Error(
    'Usage: node tools/push-wordpress-settings.mjs --title "..." [--description "..."] [--dry-run | --apply --backup --backup-confirmed]',
  );
}

if (shouldApply && (!shouldBackup || !backupConfirmed)) {
  throw new Error(
    'Refusing live settings update without --backup --backup-confirmed.',
  );
}

const env = getWordPressEnv();

const current = await wpRequest(env, 'GET', '/wp-json/wp/v2/settings');
const before = {};
for (const key of ALLOWED_KEYS) {
  before[key] = current.data[key];
}

const diff = Object.entries(updates)
  .filter(([key, value]) => before[key] !== value)
  .map(([key, value]) => ({ key, before: before[key], after: value }));

if (diff.length === 0) {
  console.log(
    JSON.stringify({ ok: true, mode: 'no-op', message: 'Settings already match.', before }, null, 2),
  );
  process.exit(0);
}

if (isDryRun) {
  console.log(JSON.stringify({ ok: true, mode: 'dry-run', diff }, null, 2));
  process.exit(0);
}

const backupDir = path.resolve('backups');
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `wp-settings-before-${safeStamp()}.json`);
fs.writeFileSync(backupPath, JSON.stringify({ takenAt: new Date().toISOString(), settings: before }, null, 2));

const result = await wpRequest(env, 'POST', '/wp-json/wp/v2/settings', updates);

const after = {};
for (const key of ALLOWED_KEYS) {
  after[key] = result.data[key];
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      backupPath,
      diff,
      after,
    },
    null,
    2,
  ),
);
