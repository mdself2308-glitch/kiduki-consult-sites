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
const planPath = path.resolve(args.plan || 'content/article-plan.json');
const apply = Boolean(args.apply);
const backup = Boolean(args.backup);
const backupConfirmed = Boolean(args['backup-confirmed']);
const approvedVersion = args['approved-version'] || null;
const allowReviewedFullBody = Boolean(args['allow-reviewed-full-body']);
const wordpressApplyAuthorityConfirmed = Boolean(
  args['wordpress-apply-authority-confirmed'],
);
const verifyApprovalBundle = Boolean(args['verify-approval-bundle']);
const approvalBundlePath = args['approval-bundle']
  ? path.resolve(args['approval-bundle'])
  : null;
const approvedBundleSha256 = args['approved-bundle-sha256'] || null;

if (apply && (!backup || !backupConfirmed)) {
  throw new Error('Refusing WordPress writes without --backup --backup-confirmed.');
}
if (apply && !approvedVersion) {
  throw new Error('Refusing WordPress writes without --approved-version.');
}
if (apply && !wordpressApplyAuthorityConfirmed) {
  throw new Error(
    'Refusing WordPress writes without --wordpress-apply-authority-confirmed.',
  );
}
if ((apply || verifyApprovalBundle) && (!approvalBundlePath || !approvedBundleSha256)) {
  throw new Error(
    'Refusing WordPress writes without --approval-bundle and --approved-bundle-sha256.',
  );
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const planDir = path.dirname(planPath);
const planArticles = plan.articles || [];
const planSlugs = planArticles.map(({ slug }) => slug);
if (planArticles.length !== 12 || new Set(planSlugs).size !== planArticles.length) {
  throw new Error('Article plan must contain exactly 12 unique slugs.');
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function wordpressSha256(value) {
  return sha256(String(value || '').replace(/\\u002d/gi, '-'));
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

function articleCta(html, label) {
  const matches = String(html || '').match(
    /<aside class="kdk-article-cta"[^>]*>[\s\S]*?<\/aside>/gi,
  ) || [];
  if (matches.length !== 1) {
    throw new Error(`${label}: expected exactly one kdk-article-cta, found ${matches.length}.`);
  }
  return matches[0];
}

let approvalBundle = null;
let approvalItemsBySlug = new Map();
let approvalTicketsBySlug = new Map();
if (apply || verifyApprovalBundle) {
  if (!fs.existsSync(approvalBundlePath)) {
    throw new Error(`Approval bundle not found: ${approvalBundlePath}`);
  }
  const approvalBundleRaw = fs.readFileSync(approvalBundlePath, 'utf8');
  if (sha256(approvalBundleRaw) !== approvedBundleSha256) {
    throw new Error('Approval bundle SHA-256 does not match --approved-bundle-sha256.');
  }
  approvalBundle = JSON.parse(approvalBundleRaw);
  if (
    (apply && approvalBundle.exact_version !== approvedVersion)
    || approvalBundle.state !== 'owner-review'
    || approvalBundle.item_count !== 12
    || !Array.isArray(approvalBundle.items)
  ) {
    throw new Error('Approval bundle version, state, or item count is invalid.');
  }
  if (
    approvalBundle.product_gate?.pack_p01 !== 'not_tested'
    || approvalBundle.product_gate?.pack_p02 !== 'not_tested'
    || approvalBundle.product_gate?.pack_mentions_allowed !== false
    || approvalBundle.approval?.owner_decision !== 'pending'
    || approvalBundle.approval?.physician_approval !== 'pending'
    || approvalBundle.approval?.publication_authority !== 'not_granted'
  ) {
    throw new Error('Approval bundle product or approval-state boundary is invalid.');
  }
  approvalItemsBySlug = new Map(
    approvalBundle.items.map((bundleItem) => [bundleItem.slug, bundleItem]),
  );
  if (approvalItemsBySlug.size !== 12) {
    throw new Error('Approval bundle article slugs are missing or duplicated.');
  }
  const bundleSlugs = [...approvalItemsBySlug.keys()].sort();
  const sortedPlanSlugs = [...planSlugs].sort();
  if (JSON.stringify(bundleSlugs) !== JSON.stringify(sortedPlanSlugs)) {
    throw new Error('Article plan and approval bundle slug sets do not match exactly.');
  }
}

if (apply) {
  for (const item of planArticles) {
    const ticketPath = path.resolve(
      'content/tasks',
      `CT-20260901-${item.slug}.md`,
    );
    if (!fs.existsSync(ticketPath)) {
      throw new Error(`${item.slug}: approval ticket not found: ${ticketPath}`);
    }
    const ticket = parseTicketFrontmatter(fs.readFileSync(ticketPath, 'utf8'));
    const approvalItem = approvalItemsBySlug.get(item.slug);
    if (
      !approvalItem ||
      ticket.status !== 'approved' ||
      ticket.owner_decision !== 'approved' ||
      ticket.exact_version !== approvedVersion ||
      ticket.exact_version_sha256 !== approvalItem.source_sha256 ||
      ticket.approval_owner !== '宮部 大輔' ||
      !ticket.approval_evidence ||
      !ticket.physician_approval
    ) {
      throw new Error(
        `${item.slug}: bound ticket does not record approved owner/physician evidence for ${approvedVersion}.`,
      );
    }
    approvalTicketsBySlug.set(item.slug, { ticketPath, ticket });
  }
}

function assertApprovalItemMatchesPlan(item, approvalItem, source, localCta, changeScope) {
  if (
    !approvalItem
    || approvalItem.cta_version !== approvalBundle.exact_version
    || approvalItem.cta_status !== 'owner-review'
    || approvalItem.source_sha256 !== item.exact_source_sha256
    || approvalItem.source_sha256 !== sha256(source)
    || approvalItem.cta_html_sha256 !== sha256(localCta)
    || approvalItem.change_scope !== changeScope
    || (approvalItem.full_body_update_reason || null) !== (item.full_body_update_reason || null)
    || (approvalItem.expected_remote_source_sha256 || null) !== (item.expected_remote_source_sha256 || null)
    || Number(approvalItem.wordpress_post_id) !== Number(item.wordpress_post_id)
  ) {
    throw new Error(`${item.slug}: current plan or source differs from the approval bundle.`);
  }
}

if (verifyApprovalBundle) {
  for (const item of planArticles) {
    const sourcePath = path.resolve(planDir, item.content || '');
    const source = fs.readFileSync(sourcePath, 'utf8');
    const localCta = articleCta(source, `${item.slug} local`);
    const plannedScope = item.full_body_update_reason ? 'reviewed_full_body' : 'cta_only';
    assertApprovalItemMatchesPlan(
      item,
      approvalItemsBySlug.get(item.slug),
      source,
      localCta,
      plannedScope,
    );
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'verify-approval-bundle',
        approvalBundlePath,
        approvedBundleSha256,
        exactVersion: approvalBundle.exact_version,
        items: planArticles.length,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const env = getWordPressEnv(args.site || 'office');

async function findBySlug(slug) {
  const response = await wpRequest(
    env,
    'GET',
    `/wp-json/wp/v2/posts?context=edit&slug=${encodeURIComponent(slug)}` +
      '&status=publish,future,draft,pending,private&per_page=100' +
      '&_fields=id,slug,status,title,date,modified,link,content',
  );
  return Array.isArray(response.data) && response.data.length === 1
    ? response.data[0]
    : null;
}

const prepared = [];
const results = [];

for (const item of planArticles) {
  const sourcePath = path.resolve(planDir, item.content || '');
  const source = fs.readFileSync(sourcePath, 'utf8');
  if (sha256(source) !== item.exact_source_sha256) {
    throw new Error(`${item.slug}: local source does not match exact_source_sha256.`);
  }

  const localCta = articleCta(source, `${item.slug} local`);
  const existing = await findBySlug(item.slug);
  if (!existing) {
    throw new Error(`${item.slug}: WordPress post not found.`);
  }
  if (Number(existing.id) !== Number(item.wordpress_post_id)) {
    throw new Error(`${item.slug}: WordPress post id differs from the reviewed plan.`);
  }

  const remote = existing.content?.raw || '';
  const remoteCta = articleCta(remote, `${item.slug} remote`);
  const sourceWithRemoteCta = source.replace(localCta, remoteCta);
  const remoteSourceSha256 = wordpressSha256(remote);
  const nonCtaContentMatches = wordpressSha256(sourceWithRemoteCta) === remoteSourceSha256;
  const reviewedFullBodyChange = Boolean(item.full_body_update_reason);
  if (!nonCtaContentMatches) {
    if (!reviewedFullBodyChange || !item.expected_remote_source_sha256) {
      throw new Error(
        `${item.slug}: non-CTA content drift detected; remote_source_sha256=${remoteSourceSha256}. ` +
        'Record an exact reviewed repair and expected remote hash before continuing.',
      );
    }
    if (item.expected_remote_source_sha256 !== remoteSourceSha256) {
      throw new Error(
        `${item.slug}: WordPress source changed after the reviewed full-body repair was prepared.`,
      );
    }
  }

  const changeScope = nonCtaContentMatches ? 'cta_only' : 'reviewed_full_body';
  const row = {
    slug: item.slug,
    post_id: existing.id,
    status: existing.status,
    date: existing.date,
    cta_version: item.cta_version,
    cta_status: item.cta_status,
    change_scope: changeScope,
    action:
      wordpressSha256(source) === wordpressSha256(remote)
        ? 'unchanged'
        : changeScope === 'reviewed_full_body'
          ? 'would_update_reviewed_full_body'
          : 'would_update',
  };
  results.push(row);

  if (row.action === 'unchanged') continue;
  if (apply) {
    const approvalItem = approvalItemsBySlug.get(item.slug);
    assertApprovalItemMatchesPlan(item, approvalItem, source, localCta, changeScope);
    if (changeScope === 'reviewed_full_body' && !allowReviewedFullBody) {
      throw new Error(
        `${item.slug}: reviewed full-body repair requires --allow-reviewed-full-body.`,
      );
    }
    prepared.push({
      item,
      source,
      existing,
      row,
      approvalTicket: approvalTicketsBySlug.get(item.slug),
    });
  }
}

let backupPath = null;
if (apply) {
  const backupDir = path.resolve('backups');
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  backupPath = path.join(
    backupDir,
    `wp-article-ctas-before-${safeStamp()}.json`,
  );
  fs.writeFileSync(
    backupPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        planPath,
        approvedVersion,
        approvalBundlePath,
        approvedBundleSha256,
        wordpressApplyAuthorityConfirmed,
        approvalTickets: [...approvalTicketsBySlug.values()].map(
          ({ ticketPath, ticket }) => ({
            ticketPath,
            exactVersion: ticket.exact_version,
            exactVersionSha256: ticket.exact_version_sha256,
            approvalEvidence: ticket.approval_evidence,
            physicianApproval: ticket.physician_approval,
          }),
        ),
        posts: prepared.map(({ existing }) => existing),
      },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  fs.chmodSync(backupPath, 0o600);
}

for (const { source, existing, row } of prepared) {
  const updatedResponse = await wpRequest(
    env,
    'POST',
    `/wp-json/wp/v2/posts/${existing.id}`,
    { content: source },
  );
  const updated = updatedResponse.data;
  const readbackResponse = await wpRequest(
    env,
    'GET',
    `/wp-json/wp/v2/posts/${existing.id}?context=edit` +
      '&_fields=id,slug,status,date,modified,link,content',
  );
  const verified = readbackResponse.data;
  if (
    Number(updated.id) !== Number(existing.id) ||
    Number(verified.id) !== Number(existing.id) ||
    verified.slug !== row.slug ||
    verified.status !== existing.status ||
    verified.date !== existing.date ||
    wordpressSha256(verified.content?.raw) !== wordpressSha256(source)
  ) {
    throw new Error(
      `${row.slug}: post-update verification failed. Backup: ${backupPath}`,
    );
  }
  row.action = 'updated_readback_verified';
  row.modified = verified.modified;
}

const summary = results.reduce((acc, row) => {
  acc[row.action] = (acc[row.action] || 0) + 1;
  return acc;
}, {});

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: apply ? 'apply' : 'dry-run',
      writes: apply,
      wordpressApplyAuthorityConfirmed,
      backupPath,
      summary,
      results,
    },
    null,
    2,
  ),
);
