import crypto from 'node:crypto';
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
const manifestPath = path.resolve(
  args.manifest || 'kiduki/config/seo-release-2026-08-17.json',
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);
const publishDrafts = Boolean(args['publish-drafts']);
const requestedIds = args.ids
  ? new Set(String(args.ids).split(',').map((value) => Number(value.trim())))
  : null;

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing WordPress SEO release without --backup --backup-confirmed.',
  );
}

const items = (manifest.items || []).filter(
  (item) => !requestedIds || requestedIds.has(Number(item.id)),
);
if (!items.length) throw new Error('No manifest items were selected.');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
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
const prepared = [];

for (const item of items) {
  const restBase = requireContentType(item.type);
  const sourcePath = path.resolve(item.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file is missing for ${item.type}:${item.id}: ${sourcePath}`);
  }

  const source = fs.readFileSync(sourcePath, 'utf8');
  const response = await wpRequest(
    env,
    'GET',
    `/wp-json/wp/v2/${restBase}/${item.id}?context=edit`,
  );
  const current = response.data;
  if (!item.allowedCurrentSlugs?.includes(current.slug)) {
    throw new Error(
      `${item.type}:${item.id} current slug "${current.slug}" is outside the allowlist.`,
    );
  }
  if (apply && !item.expectedModified) {
    throw new Error(
      `${item.type}:${item.id} has no expectedModified lock. Run the dry-run, review current.modified, then pin it in the manifest before apply.`,
    );
  }
  if (apply && item.expectedModified !== current.modified) {
    throw new Error(
      `${item.type}:${item.id} changed after review: expected ${item.expectedModified}, found ${current.modified}. Pull and review again.`,
    );
  }

  const slugMatches = await wpRequest(
    env,
    'GET',
    `/wp-json/wp/v2/${restBase}?context=edit&slug=${encodeURIComponent(item.slug)}&per_page=100`,
  );
  const conflict = slugMatches.data.find(
    (candidate) => Number(candidate.id) !== Number(item.id),
  );
  if (conflict) {
    throw new Error(
      `${item.type}:${item.id} target slug "${item.slug}" is already used by ${conflict.id}.`,
    );
  }

  const nextStatus =
    publishDrafts && item.status === 'draft' ? 'publish' : item.status;
  const payload = {
    title: item.title,
    slug: item.slug,
    status: nextStatus,
    excerpt: item.excerpt,
    content: source,
  };
  const currentContent = current.content?.raw || '';
  const currentTitle = current.title?.raw || cleanRendered(current.title?.rendered);

  prepared.push({
    item,
    restBase,
    sourcePath,
    source,
    current,
    payload,
    comparison: {
      type: item.type,
      id: item.id,
      current: {
        modified: current.modified,
        slug: current.slug,
        status: current.status,
        title: currentTitle,
        contentBytes: Buffer.byteLength(currentContent),
        contentSha256: sha256(currentContent),
      },
      next: {
        slug: payload.slug,
        status: payload.status,
        title: payload.title,
        contentBytes: Buffer.byteLength(source),
        contentSha256: sha256(source),
      },
      changed: {
        slug: current.slug !== payload.slug,
        status: current.status !== payload.status,
        title: currentTitle !== payload.title,
        excerpt: (current.excerpt?.raw || '') !== payload.excerpt,
        content: sha256(currentContent) !== sha256(source),
      },
    },
  });
}

if (!apply) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'dry-run',
        persistentWrites: false,
        release: manifest.release,
        manifestPath,
        publishDrafts,
        items: prepared.map(({ comparison }) => comparison),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const backupDirectory = path.resolve(
  'backups',
  `wp-seo-release-${safeStamp()}`,
);
fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
fs.chmodSync(backupDirectory, 0o700);
for (const { item, current } of prepared) {
  const backupPath = path.join(
    backupDirectory,
    `${item.type}-${item.id}.json`,
  );
  fs.writeFileSync(backupPath, `${JSON.stringify(current, null, 2)}\n`, {
    mode: 0o600,
  });
  fs.chmodSync(backupPath, 0o600);
}

const updatedItems = [];
for (const preparedItem of prepared) {
  const { item, restBase, payload, source } = preparedItem;
  const response = await wpRequest(
    env,
    'POST',
    `/wp-json/wp/v2/${restBase}/${item.id}`,
    payload,
  );
  const updated = response.data;
  const updatedContent = updated.content?.raw || source;
  const updatedTitle = updated.title?.raw || cleanRendered(updated.title?.rendered);
  const verified =
    updated.slug === payload.slug &&
    updated.status === payload.status &&
    updatedTitle === payload.title &&
    sha256(updatedContent) === sha256(source);
  if (!verified) {
    throw new Error(
      `Verification failed after updating ${item.type}:${item.id}. Backups: ${backupDirectory}`,
    );
  }
  updatedItems.push({
    type: item.type,
    id: item.id,
    slug: updated.slug,
    status: updated.status,
    modified: updated.modified,
    link: updated.link,
    contentSha256: sha256(updatedContent),
  });
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: 'apply',
      release: manifest.release,
      manifestPath,
      backupDirectory,
      updatedItems,
    },
    null,
    2,
  ),
);
