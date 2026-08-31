import fs from 'node:fs';

import { siteConfig } from './kdk-site-config.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchManual(url) {
  return fetch(url, {
    redirect: 'manual',
    headers: { 'User-Agent': 'kdk-public-verifier/1.0' },
  });
}

const entry = await fetchManual(siteConfig.publicEntryUrl);
assert(entry.status === 301, `Entry URL returned ${entry.status}, expected 301.`);
assert(
  entry.headers.get('location') === siteConfig.staticHomeUrl,
  `Entry URL redirects to ${entry.headers.get('location') || '(empty)'}.`,
);

const checks = [];
const expectSeoRelease = process.argv.includes('--expect-seo-release');
const seoExpectations = new Map();
const routes = [
  ['static-home', siteConfig.staticHomeUrl],
  ['reserve', siteConfig.reserveUrl],
  ['office', `${siteConfig.wordpressUrl}/office/`],
  ['office-info', `${siteConfig.wordpressUrl}/office/office-info/`],
  ['representative', `${siteConfig.wordpressUrl}/office/greeting/`],
  ['service', `${siteConfig.wordpressUrl}/service/`],
  ['high-intent-article', `${siteConfig.wordpressUrl}/jimushochoice/`],
  ['contact', `${siteConfig.wordpressUrl}/contact/`],
  ['privacy', `${siteConfig.wordpressUrl}/privacy-policy/`],
  ['rest-index', `${siteConfig.wordpressUrl}/wp-json/`],
  ['robots', `${siteConfig.wordpressUrl}/robots.txt`],
  ['sitemap', `${siteConfig.wordpressUrl}/sitemap.xml`],
];

if (expectSeoRelease) {
  const manifestUrls = [
    new URL('../kiduki/config/seo-two-pillars-2026-08-27.json', import.meta.url),
    new URL('../kiduki/config/seo-indexing-recovery-2026-08-31.json', import.meta.url),
  ];
  const currentItems = new Map();
  for (const manifestUrl of manifestUrls) {
    const manifest = JSON.parse(fs.readFileSync(manifestUrl, 'utf8'));
    for (const item of manifest.items) {
      currentItems.set(`${item.type}:${item.id}`, item);
    }
  }
  for (const item of currentItems.values()) {
    const serviceChildren = new Set([
      'sangyoui',
      'komon',
      'return-to-work-support',
      'cloud',
    ]);
    const path = item.type === 'post'
      ? `/${item.slug}/`
      : serviceChildren.has(item.slug)
        ? `/service/${item.slug}/`
        : `/${item.slug}/`;
    const url = `${siteConfig.wordpressUrl}${path}`;
    seoExpectations.set(url, item);
    if (!routes.some(([, routeUrl]) => routeUrl === url)) {
      routes.push([`seo-${item.type}-${item.id}`, url]);
    }
  }
}

for (const route of routes) {
  const [name, url] = route;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'kdk-public-verifier/1.0' },
  });
  assert(response.status === 200, `${name} returned ${response.status}.`);
  const text = await response.text();
  if (name !== 'robots' && name !== 'sitemap' && name !== 'rest-index') {
    assert(
      !/name=["']robots["'][^>]*noindex/i.test(text),
      `${name} contains noindex.`,
    );
  }
  const seoExpectation = seoExpectations.get(url);
  if (seoExpectation) {
    assert(
      text.includes(`<title>${seoExpectation.title}`),
      `${name} title does not match the SEO manifest.`,
    );
    assert(
      text.includes(
        `<meta name="description" content="${seoExpectation.metaDescription}"`,
      ),
      `${name} meta description does not match the SEO manifest.`,
    );
    assert(
      text.includes(`<link rel="canonical" href="${url}"`),
      `${name} canonical does not match its public URL.`,
    );
    assert(
      (text.match(/<h1\b/gi) || []).length === 1,
      `${name} must contain exactly one H1.`,
    );
    assert(
      !/adsbygoogle|pagead2\.googlesyndication\.com|code-block code-block-|class=["']ad-(?:h2-above|content)/i.test(
        text,
      ),
      `${name} contains a lead-generation-breaking ad placement.`,
    );
  }
  if (name === 'static-home') {
    assert(
      text.includes(
        '<link rel="canonical" href="https://consult.kdkconslt-sngyouijm.com/">',
      ),
      'static-home canonical is missing or incorrect.',
    );
    if (expectSeoRelease) {
      assert(
        !/kdkconslt-sngyouijm\.com\/(?:\?main|spot\/|greeting\/|office-info\/)/.test(
          text,
        ),
        'static-home contains a retired internal URL.',
      );
    }
  }
  if (name === 'representative') {
    assert(
      text.includes('<title>代表者紹介｜宮部大輔'),
      'representative title does not identify the representative.',
    );
    assert(
      text.includes('代表　宮部 大輔'),
      'representative page does not contain the confirmed representative name.',
    );
    assert(
      !/2026年◯月|【名称】|◯◯保健所|院長/.test(text),
      'representative page contains a placeholder or clinic-only title.',
    );
  }
  if (name === 'office') {
    assert(
      text.includes(
        '<title>事務所について  |  KIDUKIコンサルティング産業医事務所',
      ),
      'office page title does not identify the office.',
    );
    assert(
      text.includes('内科専門医・心療内科専門医・労働衛生コンサルタント'),
      'office page does not contain the confirmed qualifications.',
    );
    assert(
      !/href=["']https:\/\/kdkconslt-sngyouijm\.com\/(?:greeting|office-info)\//.test(
        text,
      ),
      'office page contains a retired root-level office link.',
    );
    assert(
      text.includes(
        'href="https://kdkconslt-sngyouijm.com/office/greeting/"',
      ),
      'office page does not link to the canonical representative page.',
    );
  }
  if (name === 'office-info') {
    assert(
      text.includes('<title>事務所概要  |  KIDUKIコンサルティング産業医事務所'),
      'office-info title does not match the confirmed office identity.',
    );
    assert(
      (text.match(/<h1\b/gi) || []).length === 1,
      'office-info must contain exactly one H1.',
    );
    assert(
      text.includes('〒105-0004') && text.includes('新橋1-18-21'),
      'office-info does not contain the confirmed address.',
    );
    assert(
      !/03-6403-0173|<th[^>]*>電話<\/th>/.test(text),
      'office-info exposes the retired public telephone listing.',
    );
  }
  if (name === 'high-intent-article') {
    assert(
      text.includes('この記事を書いた人'),
      'high-intent article does not expose an author block.',
    );
    assert(
      text.includes('宮部 大輔') && !text.includes('sin_sangyoui'),
      'high-intent article does not expose the confirmed author name.',
    );
  }
  if (name === 'contact') {
    assert(
      text.includes('睡眠に特化した産業医の継続契約を相談したい') &&
        text.includes('産業衛生業務のDX・Casetra利用を相談したい') &&
        text.includes('復職支援・判定面談を1件から相談したい'),
      'contact form does not expose the two pillars and one-off support.',
    );
    assert(
      !text.includes('復職支援Pack（1案件・面談3回＋再評価）を相談したい'),
      'contact form still puts the retired return-to-work-first option first.',
    );
  }
  if (name === 'robots') {
    assert(
      /Sitemap:\s*https:\/\/kdkconslt-sngyouijm\.com\/sitemap\.xml/i.test(
        text,
      ),
      'robots.txt does not advertise the active WordPress sitemap.',
    );
  }
  if (name === 'sitemap') {
    const isSitemapIndex = /<sitemapindex\b/i.test(text);
    assert(
      /<(?:urlset|sitemapindex)\b/i.test(text),
      'sitemap.xml is not a sitemap document.',
    );
    if (isSitemapIndex) {
      assert(
        /page-sitemap(?:\d+)?\.xml/i.test(text),
        'sitemap index does not contain a page sitemap.',
      );
    } else {
      assert(
        text.includes(`${siteConfig.wordpressUrl}/service/`),
        'URL sitemap does not contain the service section.',
      );
    }
  }
  checks.push({ name, url: response.url, status: response.status });
}

let legacyRedirect = null;
let sitemapChecks = null;
if (expectSeoRelease) {
  const oldSpotUrl = `${siteConfig.wordpressUrl}/service/spot/`;
  const expectedSpotTarget = `${siteConfig.wordpressUrl}/service/return-to-work-support/`;
  const oldSpot = await fetchManual(oldSpotUrl);
  assert(oldSpot.status === 301, `Retired spot URL returned ${oldSpot.status}.`);
  assert(
    oldSpot.headers.get('location') === expectedSpotTarget,
    `Retired spot URL redirects to ${oldSpot.headers.get('location') || '(empty)'}.`,
  );
  legacyRedirect = {
    from: oldSpotUrl,
    to: expectedSpotTarget,
    status: oldSpot.status,
  };

  const sitemapResponse = await fetch(`${siteConfig.wordpressUrl}/sitemap.xml`);
  const sitemapIndex = await sitemapResponse.text();
  const childSitemaps = [...sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1].replace(/&amp;/g, '&'),
  );
  let sitemapCorpus = sitemapIndex;
  for (const childUrl of childSitemaps) {
    if (childUrl.startsWith(`${siteConfig.wordpressUrl}/`)) {
      sitemapCorpus += `\n${await (await fetch(childUrl)).text()}`;
    }
  }
  const included = Object.fromEntries(
    [...seoExpectations.keys()].map((url) => {
      const isIncluded = sitemapCorpus.includes(`<loc>${url}</loc>`);
      assert(isIncluded, `Sitemap does not contain ${url}.`);
      return [url, isIncluded];
    }),
  );
  const excluded = Object.fromEntries(
    [
      `${siteConfig.wordpressUrl}/question/`,
      `${siteConfig.wordpressUrl}/contact/thanks/`,
    ].map((url) => {
      const absent = !sitemapCorpus.includes(`<loc>${url}</loc>`);
      assert(absent, `Sitemap contains non-indexable URL ${url}.`);
      return [url, absent];
    }),
  );
  sitemapChecks = { included, excluded };
}

console.log(
  JSON.stringify(
    {
      ok: true,
      entryRedirect: {
        from: siteConfig.publicEntryUrl,
        to: siteConfig.staticHomeUrl,
        status: entry.status,
      },
      legacyRedirect,
      sitemapChecks,
      checks,
    },
    null,
    2,
  ),
);
