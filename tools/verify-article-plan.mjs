import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseArgs } from './wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const planPath = path.resolve(args.plan || 'content/article-plan.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const planDir = path.dirname(planPath);
const failures = [];
const checks = [];

function check(condition, message) {
  checks.push({ ok: Boolean(condition), message });
  if (!condition) failures.push(message);
}

function textContent(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function pngDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length < 24 || bytes.toString('ascii', 1, 4) !== 'PNG') {
    return null;
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

const articles = plan.articles || [];
const requiredCategories = {
  sleep: [45, 47],
  dx: [46, 47],
  bridge: [45, 47],
};
const slugs = articles.map(({ slug }) => slug);
const titles = articles.map(({ title }) => title);

check(plan.last_reviewed === '2026-09-01', 'plan review date is current');
check(articles.length === 12, 'exactly twelve articles are planned');
check(new Set(slugs).size === slugs.length, 'article slugs are unique');
check(new Set(titles).size === titles.length, 'article titles are unique');

let previousDate = 0;
for (const item of articles) {
  const label = item.slug || '(missing slug)';
  const contentPath = path.resolve(planDir, item.content || '');
  const imagePath = path.resolve(planDir, item.featured_image || '');
  const publishDate = Date.parse(`${item.publish_at}+09:00`);
  const html = fs.existsSync(contentPath)
    ? fs.readFileSync(contentPath, 'utf8')
    : '';
  const copy = textContent(html);
  const dimensions = fs.existsSync(imagePath) ? pngDimensions(imagePath) : null;
  const expectedCategories = requiredCategories[item.pillar];
  const actualCategories = Array.isArray(item.categories)
    ? [...item.categories].sort((a, b) => a - b)
    : [];

  check(Boolean(item.slug), `${label}: slug is present`);
  check(Boolean(item.title), `${label}: title is present`);
  check(Number.isFinite(publishDate), `${label}: publication date parses`);
  check(
    ['scheduled', 'published'].includes(item.production_status),
    `${label}: production status is scheduled or published`,
  );
  if (item.production_status === 'scheduled') {
    check(publishDate > Date.now(), `${label}: scheduled publication date is in the future`);
  }
  if (item.production_status === 'published') {
    check(publishDate <= Date.now(), `${label}: published date is not in the future`);
    check(
      typeof item.published_url === 'string' && item.published_url.startsWith('https://'),
      `${label}: published URL is recorded`,
    );
  }
  check(Number.isInteger(item.wordpress_post_id), `${label}: WordPress post id is recorded`);
  check(item.risk_tier === 'S', `${label}: public medical/safety article is Tier S`);
  check(Boolean(item.search_intent), `${label}: search intent is recorded`);
  check(Boolean(item.target_offer), `${label}: target offer is recorded`);
  check(/^\/service\//.test(item.primary_landing || ''), `${label}: primary landing is recorded`);
  check(/^\/service\//.test(item.secondary_landing || ''), `${label}: secondary landing is recorded`);
  check(/^2026-09-01-v\d+$/.test(item.cta_version || ''), `${label}: exact CTA version is recorded`);
  check(item.cta_status === 'owner-review', `${label}: exact CTA waits for owner review`);
  if (item.full_body_update_reason) {
    check(
      /^[a-f0-9]{64}$/.test(item.expected_remote_source_sha256 || ''),
      `${label}: reviewed full-body repair records the expected WordPress source hash`,
    );
  }
  check(
    item.exact_source_sha256 === sha256(html),
    `${label}: reviewed source hash matches the exact article version`,
  );
  check(publishDate > previousDate, `${label}: publication dates are strictly increasing`);
  previousDate = publishDate;
  check(fs.existsSync(contentPath), `${label}: article source exists`);
  check(fs.existsSync(imagePath), `${label}: featured image exists`);
  check(dimensions?.width >= 1200 && dimensions?.height >= 630, `${label}: featured image is at least 1200x630`);
  check(
    typeof item.featured_image_alt === 'string' && item.featured_image_alt.length >= 12,
    `${label}: featured image alt text is descriptive`,
  );
  check(
    typeof item.excerpt === 'string' && item.excerpt.length >= 45 && item.excerpt.length <= 130,
    `${label}: excerpt is 45-130 characters`,
  );
  check(
    JSON.stringify(actualCategories) === JSON.stringify(expectedCategories),
    `${label}: pillar categories are correct`,
  );
  check(!/<h1\b/i.test(html), `${label}: body does not add a second H1`);
  check((html.match(/<h2\b/gi) || []).length >= 5, `${label}: body has decision-useful sections`);
  check(copy.length >= 1200, `${label}: body has at least 1200 text characters`);
  check(
    /執筆・監修：<\/strong><a href="\/office\/greeting\/">宮部 大輔<\/a>/.test(html),
    `${label}: named author and representative link are present`,
  );
  check(/最終確認：2026年8月31日/.test(html), `${label}: review date is visible`);
  const ctaContainers = html.match(/<aside class="kdk-article-cta"[\s\S]*?<\/aside>/gi) || [];
  const cta = ctaContainers[0] || '';
  check(ctaContainers.length === 1, `${label}: exactly one article CTA is present`);
  check(
    cta.includes(`data-kdk-article-slug="${item.slug}"`),
    `${label}: CTA records its article slug`,
  );
  check(
    new RegExp(`href="${item.primary_landing.replaceAll('/', '\\/')}"[^>]*data-kdk-article-cta="primary"`).test(cta),
    `${label}: primary CTA matches the planned landing`,
  );
  check(
    new RegExp(`href="${item.secondary_landing.replaceAll('/', '\\/')}"[^>]*data-kdk-article-cta="secondary"`).test(cta),
    `${label}: secondary CTA matches the planned landing`,
  );
  check(!/href="\/contact\/"/.test(cta), `${label}: article CTA does not skip the service landing`);
  check(
    /href="https:\/\/(?:www\.)?(?:mhlw\.go\.jp|laws\.e-gov\.go\.jp|meti\.go\.jp|mlit\.go\.jp|pmc\.ncbi\.nlm\.nih\.gov)/.test(html),
    `${label}: primary or official linked source is present`,
  );
  check(
    /本記事は一般的な情報提供/.test(html),
    `${label}: general-information boundary is present`,
  );
  check(
    !/必ず治る|必ず復職|復職を保証|事故を完全に防ぐ|睡眠専門医|クリニック院長/.test(html),
    `${label}: prohibited or overpromising wording is absent`,
  );

  for (const match of html.matchAll(/href="\/(?!\/)([^"?#]+)\/?(?:[?#][^"]*)?"/g)) {
    const linkedSlug = match[1].replace(/^|\/$/g, '');
    const allowedStatic = new Set([
      'contact',
      'office/greeting',
      'service',
      'service/sangyoui',
      'service/komon',
      'service/return-to-work-support',
      'service/cloud',
    ]);
    check(
      slugs.includes(linkedSlug) || allowedStatic.has(linkedSlug),
      `${label}: internal link target is planned or established (${linkedSlug})`,
    );
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures, checks: checks.length }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      planPath,
      articles: articles.length,
      checks: checks.length,
    },
    null,
    2,
  ),
);
