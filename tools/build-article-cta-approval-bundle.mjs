import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseArgs } from './wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const planPath = path.resolve(args.plan || 'content/article-plan.json');
const bundlePath = path.resolve(
  args.bundle || 'content/exact/article-cta-owner-review-2026-09-01-v6.json',
);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function textContent(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function attribute(tag, name) {
  return tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] || '';
}

function buildBundle() {
  const planRaw = fs.readFileSync(planPath, 'utf8');
  const plan = JSON.parse(planRaw);
  const planDir = path.dirname(planPath);
  const items = (plan.articles || []).map((article) => {
    const sourcePath = path.resolve(planDir, article.content);
    const source = fs.readFileSync(sourcePath, 'utf8');
    const ctaBlocks = source.match(/<aside class="kdk-article-cta"[\s\S]*?<\/aside>/gi) || [];
    if (ctaBlocks.length !== 1) {
      throw new Error(`${article.slug}: expected exactly one article CTA`);
    }

    const ctaHtml = ctaBlocks[0];
    const leadMatch = ctaHtml.match(/<strong>([\s\S]*?)<\/strong>/i);
    if (!leadMatch) {
      throw new Error(`${article.slug}: CTA lead is missing`);
    }

    const links = [...ctaHtml.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map((match) => {
      const tag = match[0];
      return {
        role: attribute(tag, 'data-kdk-article-cta'),
        label: textContent(tag),
        href: attribute(tag, 'href'),
        target_offer: attribute(tag, 'data-kdk-target-offer'),
      };
    });
    if (
      links.length !== 2
      || links[0].role !== 'primary'
      || links[1].role !== 'secondary'
    ) {
      throw new Error(`${article.slug}: CTA must have primary and secondary links in order`);
    }

    const sourceSha256 = sha256(source);
    if (sourceSha256 !== article.exact_source_sha256) {
      throw new Error(`${article.slug}: article source hash differs from the plan`);
    }
    if (
      links[0].href !== article.primary_landing
      || links[1].href !== article.secondary_landing
    ) {
      throw new Error(`${article.slug}: CTA landing differs from the plan`);
    }
    if (!article.search_intent || !article.target_offer) {
      throw new Error(`${article.slug}: search intent and target offer are required`);
    }
    if (!['published', 'scheduled'].includes(article.production_status)) {
      throw new Error(`${article.slug}: article publication status is invalid`);
    }
    if (
      article.full_body_update_reason
      && !/^[a-f0-9]{64}$/.test(article.expected_remote_source_sha256 || '')
    ) {
      throw new Error(`${article.slug}: reviewed full-body repair requires the expected WordPress source hash`);
    }
    if (
      article.slug === 'drowsy-driving-workplace-safety'
      && !ctaHtml.includes('復職や就業制限の変更・解除など、対象を固定した1案件')
    ) {
      throw new Error(`${article.slug}: secondary CTA can be mistaken for the discontinued general SPOT offer`);
    }
    if (
      ctaHtml.includes('受診勧奨')
      && !(ctaHtml.includes('受診先はご本人が選ぶ') && ctaHtml.includes('特定の医療機関を指定・紹介しない'))
    ) {
      throw new Error(`${article.slug}: referral wording lacks the required provider-choice boundary`);
    }

    return {
      slug: article.slug,
      title: article.title,
      risk_tier: article.risk_tier,
      domain: article.domain,
      search_intent: article.search_intent,
      article_publication_status: article.production_status,
      cta_deployment_status: 'not_applied',
      wordpress_post_id: article.wordpress_post_id,
      publish_at: article.publish_at,
      target_offer: article.target_offer,
      primary_landing: article.primary_landing,
      secondary_landing: article.secondary_landing,
      change_scope: article.full_body_update_reason ? 'reviewed_full_body' : 'cta_only',
      ...(article.full_body_update_reason
        ? {
            full_body_update_reason: article.full_body_update_reason,
            expected_remote_source_sha256: article.expected_remote_source_sha256,
          }
        : {}),
      cta_version: article.cta_version,
      cta_status: article.cta_status,
      source_path: path.relative(process.cwd(), sourcePath),
      source_sha256: sourceSha256,
      cta_html_sha256: sha256(ctaHtml),
      lead: textContent(leadMatch[1]),
      cta_text: textContent(ctaHtml),
      links,
    };
  });

  const versions = new Set(items.map(({ cta_version: version }) => version));
  const states = new Set(items.map(({ cta_status: state }) => state));
  if (versions.size !== 1 || states.size !== 1) {
    throw new Error('all CTA items must share one version and one review state');
  }
  const packMentions = items.filter((item) =>
    /Pack|単発\/Pack|単発・Pack/.test([
      item.target_offer,
      item.cta_text,
      ...item.links.map((link) => link.label),
    ].join(' ')),
  );
  if (packMentions.length) {
    throw new Error(`unaccepted Pack must not appear in v6 CTA items: ${packMentions.map((item) => item.slug).join(', ')}`);
  }

  return {
    schema_version: 1,
    exact_version: [...versions][0],
    state: [...states][0],
    supersedes: {
      exact_version: '2026-09-01-v5',
      reason: 'Pack P-01/P-02 are not tested; remove Pack from public CTA decisions until both pass',
    },
    purpose: '宮部大輔による12記事CTAのexact version一括確認',
    boundary: '内部承認資料。承認記録でも公開権限でもなく、WordPressへの書込みを許可しない。',
    approval_owner: '宮部 大輔',
    publication_authority_required: true,
    approval: {
      owner_decision: 'pending',
      physician_approval: 'pending',
      approval_evidence: null,
      publication_authority: 'not_granted',
    },
    product_gate: {
      pack_p01: 'not_tested',
      pack_p02: 'not_tested',
      pack_mentions_allowed: false,
      evidence: [
        '/Users/dmmac/casetra_active/docs/operations/CASETRA_PRETEST_LAUNCH_STATUS_2026-08-25.md',
        '/Users/dmmac/casetra_active/docs/operations/CASETRA_TEST_COMPANY_AUDIT_SHEET_JA.md',
      ],
    },
    approval_binding: {
      algorithm: 'sha256',
      record_in_plan: 'cta_approval_bundle_sha256',
      required_apply_arguments: ['--approval-bundle', '--approved-bundle-sha256'],
      bound_item_fields: [
        'cta_version',
        'source_sha256',
        'cta_html_sha256',
        'change_scope',
        'full_body_update_reason',
        'expected_remote_source_sha256',
        'wordpress_post_id',
      ],
    },
    source_plan: path.relative(process.cwd(), planPath),
    source_plan_sha256: sha256(planRaw),
    item_count: items.length,
    items,
  };
}

const canonicalBundle = buildBundle();
if (
  canonicalBundle.item_count !== 12
  || canonicalBundle.exact_version !== '2026-09-01-v6'
  || canonicalBundle.state !== 'owner-review'
) {
  throw new Error('approval bundle must contain 12 owner-review items for exact version 2026-09-01-v6');
}

const expected = `${JSON.stringify(canonicalBundle, null, 2)}\n`;
if (!args.check) {
  process.stdout.write(expected);
  process.exit(0);
}

if (!fs.existsSync(bundlePath)) {
  console.error(JSON.stringify({ ok: false, error: 'approval bundle is missing', bundlePath }, null, 2));
  process.exit(1);
}

const actual = fs.readFileSync(bundlePath, 'utf8');
if (actual !== expected) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'approval bundle differs from the canonical plan or article CTA sources',
        bundlePath,
        expected_sha256: sha256(expected),
        actual_sha256: sha256(actual),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      bundlePath,
      items: canonicalBundle.item_count,
      exact_version: canonicalBundle.exact_version,
      state: canonicalBundle.state,
      bundle_sha256: sha256(actual),
    },
    null,
    2,
  ),
);
