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
  ['service', `${siteConfig.wordpressUrl}/service/`],
  ['contact', `${siteConfig.wordpressUrl}/contact/`],
  ['privacy', `${siteConfig.wordpressUrl}/privacy-policy/`],
  ['rest-index', `${siteConfig.wordpressUrl}/wp-json/`],
  ['robots', `${siteConfig.wordpressUrl}/robots.txt`],
  ['sitemap', `${siteConfig.wordpressUrl}/sitemap.xml`],
];

if (expectSeoRelease) {
  const manifest = JSON.parse(
    fs.readFileSync(
      new URL('../kiduki/config/seo-release-2026-08-17.json', import.meta.url),
      'utf8',
    ),
  );
  for (const item of manifest.items) {
    const path =
      item.type === 'post' || ['service', 'field'].includes(item.slug)
        ? `/${item.slug}/`
        : `/service/${item.slug}/`;
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
  sitemapChecks = Object.fromEntries(
    [...seoExpectations.keys()].map((url) => {
      const included = sitemapCorpus.includes(`<loc>${url}</loc>`);
      assert(included, `Sitemap does not contain ${url}.`);
      return [url, included];
    }),
  );
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
