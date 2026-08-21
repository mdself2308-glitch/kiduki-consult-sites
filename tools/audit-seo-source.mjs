import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve(
  process.argv[2] || 'kiduki/config/seo-release-2026-08-17.json',
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const forbiddenDocumentPatterns = [
  ['doctype', /<!doctype\s+html/i],
  ['html-element', /<\/?html(?:\s|>)/i],
  ['head-element', /<\/?head(?:\s|>)/i],
  ['body-element', /<\/?body(?:\s|>)/i],
  ['title-element', /<title(?:\s|>)/i],
  ['meta-element', /<meta(?:\s|>)/i],
  ['embedded-style', /<style(?:\s|>)/i],
  ['embedded-script', /<script(?:\s|>)/i],
];

const prohibitedClaims = [
  ['sleep-specialist-claim', /睡眠専門医/],
  ['general-spot-plan', /月額\s*0\s*円|一般(?:的な)?SPOT契約/],
];

const legacyInternalLinks = [
  ['legacy-main-query', /https:\/\/kdkconslt-sngyouijm\.com\/\?main/],
  ['legacy-spot-root', /https:\/\/kdkconslt-sngyouijm\.com\/spot\//],
  ['retired-spot-service', /https:\/\/kdkconslt-sngyouijm\.com\/service\/spot\//],
  ['legacy-greeting-root', /https:\/\/kdkconslt-sngyouijm\.com\/greeting\//],
  ['legacy-office-info-root', /https:\/\/kdkconslt-sngyouijm\.com\/office-info\//],
];

const approvedConversionLinks = [
  'https://kdkconslt-sngyouijm.com/contact/',
  'https://consult.kdkconslt-sngyouijm.com/return-to-work-pack/',
  'https://consult.kdkconslt-sngyouijm.com/return-to-work-spot/',
];

const requiredFields = [
  'type',
  'id',
  'slug',
  'title',
  'status',
  'source',
  'excerpt',
  'metaDescription',
];

const seenKeys = new Set();
const results = [];
let ok = true;

for (const item of manifest.items || []) {
  const errors = [];
  for (const field of requiredFields) {
    if (item[field] === undefined || item[field] === '') {
      errors.push(`missing-${field}`);
    }
  }

  const key = `${item.type}:${item.id}`;
  if (seenKeys.has(key)) errors.push('duplicate-id');
  seenKeys.add(key);

  const sourcePath = path.resolve(item.source || 'missing');
  if (!fs.existsSync(sourcePath)) {
    errors.push('source-missing');
    results.push({ key, sourcePath, errors });
    ok = false;
    continue;
  }

  const source = fs.readFileSync(sourcePath, 'utf8');
  for (const [label, pattern] of forbiddenDocumentPatterns) {
    if (pattern.test(source)) errors.push(label);
  }
  for (const [label, pattern] of prohibitedClaims) {
    if (pattern.test(source)) errors.push(label);
  }
  for (const [label, pattern] of legacyInternalLinks) {
    if (pattern.test(source)) errors.push(label);
  }

  const h1Count = (source.match(/<h1(?:\s|>)/gi) || []).length;
  const h2Count = (source.match(/<h2(?:\s|>)/gi) || []).length;
  const openingBlocks = (source.match(/<!--\s+wp:[^/][\s\S]*?-->/g) || [])
    .filter((comment) => !/\/-->$/.test(comment))
    .length;
  const closingBlocks = (source.match(/<!--\s+\/wp:[\s\S]*?-->/g) || []).length;
  const plainText = source
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (h1Count !== 0) errors.push(`content-h1-count-${h1Count}`);
  if (h2Count < 2) errors.push(`too-few-h2-${h2Count}`);
  if (plainText.length < 600) errors.push(`thin-content-${plainText.length}`);
  if (!approvedConversionLinks.some((link) => source.includes(link))) {
    errors.push('conversion-link-missing');
  }
  if (openingBlocks !== closingBlocks) {
    errors.push(`block-comment-mismatch-${openingBlocks}-${closingBlocks}`);
  }
  if (item.metaDescription.length < 60 || item.metaDescription.length > 160) {
    errors.push(`meta-description-length-${item.metaDescription.length}`);
  }
  if (!Array.isArray(item.allowedCurrentSlugs) || item.allowedCurrentSlugs.length === 0) {
    errors.push('allowed-current-slugs-missing');
  }

  if (errors.length) ok = false;
  results.push({
    key,
    sourcePath,
    bytes: Buffer.byteLength(source),
    textCharacters: plainText.length,
    h1Count,
    h2Count,
    openingBlocks,
    closingBlocks,
    metaDescriptionLength: item.metaDescription.length,
    errors,
  });
}

const staticHomePath = path.resolve('consult/index.html');
const staticHome = fs.readFileSync(staticHomePath, 'utf8');
const staticErrors = [];
for (const [label, pattern] of legacyInternalLinks) {
  if (pattern.test(staticHome)) staticErrors.push(label);
}
for (const requiredUrl of [
  'https://kdkconslt-sngyouijm.com/service/sangyoui/',
  'https://kdkconslt-sngyouijm.com/service/komon/',
  'https://kdkconslt-sngyouijm.com/office/greeting/',
  'https://kdkconslt-sngyouijm.com/office/office-info/',
]) {
  if (!staticHome.includes(requiredUrl)) {
    staticErrors.push(`static-link-missing:${requiredUrl}`);
  }
}
if (staticErrors.length) ok = false;

console.log(
  JSON.stringify(
    {
      ok,
      release: manifest.release,
      manifestPath,
      items: results,
      staticHome: {
        path: staticHomePath,
        errors: staticErrors,
      },
    },
    null,
    2,
  ),
);

if (!ok) process.exitCode = 1;
