import fs from 'node:fs';
import path from 'node:path';
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

check(plan.last_reviewed === '2026-08-31', 'plan review date is current');
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
  check(publishDate > Date.now(), `${label}: publication date is in the future`);
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
  check(/href="\/service\//.test(html), `${label}: service CTA is present`);
  check(/href="\/contact\/"/.test(html), `${label}: contact CTA is present`);
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
