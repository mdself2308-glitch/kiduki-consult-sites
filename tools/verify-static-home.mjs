import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { siteConfig } from './kdk-site-config.mjs';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

const localPath = path.resolve(siteConfig.staticHomePath);
const local = fs.readFileSync(localPath);
const localText = local.toString('utf8');
const response = await fetch(siteConfig.staticHomeUrl, {
  headers: { 'User-Agent': 'kdk-static-verifier/1.0' },
});
const live = Buffer.from(await response.arrayBuffer());
const expectLiveMatch = process.argv.includes('--expect-live-match');
const localChecks = {
  doctype: /^<!doctype html>/i.test(localText.trimStart()),
  language: /<html[^>]*lang=["']ja["']/i.test(localText),
  title: /<title>[^<]+<\/title>/i.test(localText),
  description: /<meta[^>]*name=["']description["'][^>]*content=["'][^"']+/i.test(
    localText,
  ),
  canonical:
    localText.includes(
      '<link rel="canonical" href="https://consult.kdkconslt-sngyouijm.com/">',
    ),
  singleH1: (localText.match(/<h1\b/gi) || []).length === 1,
  restoredSimpleStructure:
    localText.includes('眠りから、職場の安全と生産性をつくる。') &&
    localText.includes('料金の考え方'),
  currentContactRoute:
    (localText.match(/https:\/\/kdkconslt-sngyouijm\.com\/contact\//g) || [])
      .length >= 4,
  fuzzyPricing: !/(?:\d{1,3}(?:,\d{3})+|\d+)\s*円/.test(localText),
  nonTrivialSize: local.length > 10_000,
};
const localValid = Object.values(localChecks).every(Boolean);
const exactMatch = local.equals(live);

const result = {
  ok:
    response.status === 200 &&
    localValid &&
    (!expectLiveMatch || exactMatch),
  localPath,
  liveUrl: siteConfig.staticHomeUrl,
  status: response.status,
  expectLiveMatch,
  exactMatch,
  localChecks,
  localBytes: local.length,
  liveBytes: live.length,
  localSha256: sha256(local),
  liveSha256: sha256(live),
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
