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
  routes.push(
    ['seo-service-retain', `${siteConfig.wordpressUrl}/service/sangyoui/`],
    ['seo-service-basic', `${siteConfig.wordpressUrl}/service/komon/`],
    [
      'seo-service-return-to-work',
      `${siteConfig.wordpressUrl}/service/return-to-work-support/`,
    ],
    ['seo-pillar-selection', `${siteConfig.wordpressUrl}/jimushochoice/`],
  );
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

console.log(
  JSON.stringify(
    {
      ok: true,
      entryRedirect: {
        from: siteConfig.publicEntryUrl,
        to: siteConfig.staticHomeUrl,
        status: entry.status,
      },
      checks,
    },
    null,
    2,
  ),
);
