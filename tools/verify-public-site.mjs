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
for (const route of [
  ['static-home', siteConfig.staticHomeUrl],
  ['reserve', siteConfig.reserveUrl],
  ['office', `${siteConfig.wordpressUrl}/office/`],
  ['service', `${siteConfig.wordpressUrl}/service/`],
  ['contact', `${siteConfig.wordpressUrl}/question/`],
  ['privacy', `${siteConfig.wordpressUrl}/privacy-policy/`],
  ['rest-index', `${siteConfig.wordpressUrl}/wp-json/`],
  ['robots', `${siteConfig.wordpressUrl}/robots.txt`],
  ['sitemap', `${siteConfig.wordpressUrl}/wp-sitemap.xml`],
]) {
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

