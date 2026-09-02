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
const verifyConfigOnly = Boolean(args['verify-config']);

if (apply && (!backup || !backupConfirmed)) {
  throw new Error(
    'Refusing WordPress post creation without --backup --backup-confirmed.',
  );
}
if (apply && !args['creation-authority-confirmed']) {
  throw new Error(
    'Refusing WordPress post creation without --creation-authority-confirmed.',
  );
}
if (apply && config.status === 'publish' && !args['publish-authority-confirmed']) {
  throw new Error(
    'Refusing immediate WordPress publication without --publish-authority-confirmed.',
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

function parseTicketFrontmatter(value) {
  const match = String(value).match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => {
        const separator = line.indexOf(':');
        if (separator < 0) return null;
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      })
      .filter(Boolean),
  );
}

function verifyExactCreateBinding() {
  const approval = config.exactApproval || null;
  if (!approval) {
    if (apply) {
      throw new Error(
        'Refusing WordPress post creation without an exactApproval binding in the config.',
      );
    }
    return { required: false };
  }

  for (const field of [
    'exactVersion',
    'exactPayload',
    'exactPayloadSha256',
    'candidateSourceSha256',
    'approvalTicket',
  ]) {
    if (!approval[field]) {
      throw new Error(`Missing exactApproval field: ${field}`);
    }
  }

  const exactPayloadPath = path.resolve(approval.exactPayload);
  if (!fs.existsSync(exactPayloadPath)) {
    throw new Error(`Exact approval payload does not exist: ${exactPayloadPath}`);
  }
  const exactPayloadRaw = fs.readFileSync(exactPayloadPath, 'utf8');
  const exactPayload = JSON.parse(exactPayloadRaw);
  const approvalTicketPath = path.resolve(approval.approvalTicket);
  if (!fs.existsSync(approvalTicketPath)) {
    throw new Error(`Approval ticket does not exist: ${approvalTicketPath}`);
  }
  const approvalTicket = parseTicketFrontmatter(
    fs.readFileSync(approvalTicketPath, 'utf8'),
  );
  const exactPayloadSha256 = contentSha256(exactPayloadRaw);
  const candidateSourceSha256 = contentSha256(source);
  const humanApprovalReady =
    approvalTicket.status === 'approved' &&
    approvalTicket.owner_decision === 'approved' &&
    approvalTicket.exact_version === approval.exactVersion &&
    approvalTicket.exact_version_sha256 === exactPayloadSha256 &&
    Boolean(approvalTicket.approval_evidence) &&
    Boolean(approvalTicket.physician_approval);

  if (exactPayloadSha256 !== approval.exactPayloadSha256) {
    throw new Error(
      `Exact approval payload SHA-256 mismatch: expected ${approval.exactPayloadSha256}, found ${exactPayloadSha256}.`,
    );
  }
  if (candidateSourceSha256 !== approval.candidateSourceSha256) {
    throw new Error(
      `Candidate source SHA-256 mismatch: expected ${approval.candidateSourceSha256}, found ${candidateSourceSha256}.`,
    );
  }
  if (
    exactPayload.exact_version !== approval.exactVersion ||
    exactPayload.state !== 'owner-review' ||
    exactPayload.target?.channel !== 'wordpress-post' ||
    exactPayload.target?.wordpress_post_id !== null ||
    exactPayload.target?.publication_status !== 'not_created' ||
    exactPayload.target?.slug !== config.slug ||
    exactPayload.copy?.title !== config.title ||
    exactPayload.copy?.h1 !== config.title ||
    exactPayload.copy?.excerpt !== config.excerpt ||
    exactPayload.copy?.meta_description !== config.metaDescription ||
    path.resolve(exactPayload.copy?.body_path || '') !== sourcePath ||
    exactPayload.copy?.body_sha256 !== candidateSourceSha256
  ) {
    throw new Error(
      'WordPress create config does not match the owner-review exact payload.',
    );
  }

  if (apply) {
    if (!humanApprovalReady) {
      throw new Error(
        'Refusing WordPress post creation because the bound content ticket does not record approved owner/physician evidence for this exact version.',
      );
    }
    const approvedBundlePath = args['approval-bundle']
      ? path.resolve(args['approval-bundle'])
      : null;
    if (
      args['approved-version'] !== approval.exactVersion ||
      approvedBundlePath !== exactPayloadPath ||
      args['approved-bundle-sha256'] !== exactPayloadSha256
    ) {
      throw new Error(
        'Refusing WordPress post creation without the exact approved version, payload path, and SHA-256.',
      );
    }
  }

  return {
    required: true,
    exactVersion: approval.exactVersion,
    exactPayloadPath,
    approvalTicketPath,
    exactPayloadSha256,
    candidateSourceSha256,
    ownerReviewState: exactPayload.state,
    ticketState: approvalTicket.status || null,
    humanApprovalReady,
    publicationAuthorityInPayload:
      exactPayload.approval?.publication_authority || null,
    applyAuthorizationVerified: apply,
  };
}

const exactApprovalBinding = verifyExactCreateBinding();

if (verifyConfigOnly) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'verify-config',
        persistentWrites: false,
        configPath,
        sourcePath,
        release: config.release,
        slug: config.slug,
        status: config.status,
        categories: config.categories ?? [],
        exactApprovalBinding,
      },
      null,
      2,
    ),
  );
  process.exit(0);
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
  ...(Array.isArray(config.categories) ? { categories: config.categories } : {}),
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
        exactApprovalBinding,
        duplicateSlugMatches: 0,
        next: {
          slug: payload.slug,
          status: payload.status,
          title: payload.title,
          excerpt: payload.excerpt,
          contentBytes: Buffer.byteLength(source),
          contentSha256: contentSha256(source),
          categories: payload.categories ?? [],
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
      exactApprovalBinding,
    },
    null,
    2,
  )}\n`,
  { mode: 0o600 },
);
fs.chmodSync(backupPath, 0o600);

const response = await wpRequest(env, 'POST', '/wp-json/wp/v2/posts', payload);
const created = response.data;
const readbackResponse = await wpRequest(
  env,
  'GET',
  `/wp-json/wp/v2/posts/${created.id}?context=edit`,
);
const readback = readbackResponse.data;
const readbackTitle =
  readback.title?.raw || cleanRendered(readback.title?.rendered || '');
const verified =
  Number(readback.id) === Number(created.id) &&
  readback.slug === payload.slug &&
  readback.status === payload.status &&
  readbackTitle === payload.title &&
  contentSha256(readback.content?.raw || '') === contentSha256(source) &&
  JSON.stringify([...(readback.categories ?? [])].sort((a, b) => a - b)) ===
    JSON.stringify([...(payload.categories ?? [])].sort((a, b) => a - b));
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
      exactApprovalBinding,
      backupPath,
      created: {
        id: readback.id,
        slug: readback.slug,
        status: readback.status,
        modified: readback.modified,
        link: readback.link,
        title: readbackTitle,
        contentSha256: contentSha256(readback.content?.raw || ''),
        categories: readback.categories ?? [],
        readbackVerified: true,
      },
    },
    null,
    2,
  ),
);
