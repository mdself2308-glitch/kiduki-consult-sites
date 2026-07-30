import fs from 'node:fs';
import path from 'node:path';
import {
  getWordPressEnv,
  parseArgs,
  requireContentType,
  safeStamp,
  wpRequest,
} from './wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const type = args.type;
const id = Number(args.id);

if (!type || !id) {
  throw new Error(
    'Usage: node tools/pull-wordpress-content.mjs --type page|post --id 24',
  );
}

const restBase = requireContentType(type);
const env = getWordPressEnv();
const response = await wpRequest(
  env,
  'GET',
  `/wp-json/wp/v2/${restBase}/${id}?context=edit`,
);
const item = response.data;
const slug = item.slug || `id-${id}`;

const backupDir = path.resolve('backups');
const sourceDir = path.resolve('source/wordpress');
fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(sourceDir, { recursive: true });

const backupPath = path.join(
  backupDir,
  `wp-${type}-${id}-pull-${safeStamp()}.json`,
);
const sourcePath = path.join(sourceDir, `${type}-${id}-${slug}.html`);

fs.writeFileSync(backupPath, `${JSON.stringify(item, null, 2)}\n`);
fs.writeFileSync(sourcePath, item.content?.raw || '');

console.log(
  JSON.stringify(
    {
      ok: true,
      type,
      id,
      slug,
      status: item.status,
      modified: item.modified,
      contentBytes: Buffer.byteLength(item.content?.raw || ''),
      sourcePath,
      backupPath,
    },
    null,
    2,
  ),
);

