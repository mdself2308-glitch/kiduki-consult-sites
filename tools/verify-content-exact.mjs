import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './wordpress-rest-utils.mjs';

const args = parseArgs(process.argv.slice(2));
const exactPath = path.resolve(
  args.exact ||
    'content/exact/return-to-work-one-off-vs-pack-2026-09-01-v3.json',
);
const exactRaw = fs.readFileSync(exactPath, 'utf8');
const exact = JSON.parse(exactRaw);
const projectRoot = process.cwd();

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function countOccurrences(value, needle) {
  if (!needle) return 0;
  return String(value).split(needle).length - 1;
}

const failures = [];
const bodyPath = path.resolve(projectRoot, exact.copy?.body_path || '');
if (!fs.existsSync(bodyPath)) {
  failures.push(`missing-body:${bodyPath}`);
}
const body = fs.existsSync(bodyPath) ? fs.readFileSync(bodyPath, 'utf8') : '';
const bodySha256 = sha256(body);
if (bodySha256 !== exact.copy?.body_sha256) {
  failures.push(
    `body-sha256:${bodySha256}:expected:${exact.copy?.body_sha256}`,
  );
}

if (exact.copy?.title !== exact.copy?.h1) failures.push('title-h1-mismatch');
const titleLength = [...String(exact.copy?.title || '')].length;
const metaLength = [...String(exact.copy?.meta_description || '')].length;
if (titleLength < 10 || titleLength > 60) {
  failures.push(`title-length:${titleLength}`);
}
if (metaLength < 60 || metaLength > 160) {
  failures.push(`meta-length:${metaLength}`);
}
if (/<h1\b/i.test(body)) failures.push('body-contains-h1');

const targetSlug = String(exact.target?.slug || '');
if (!targetSlug) {
  failures.push('missing-target-slug');
} else if (
  countOccurrences(body, `data-kdk-article-slug="${targetSlug}"`) !== 1
) {
  failures.push(`article-slug-occurrence:${targetSlug}`);
}

function verifyCta(role, cta) {
  if (!cta) {
    failures.push(`missing-${role}-cta`);
    return;
  }
  for (const value of [
    `>${cta.label}</a>`,
    `href="${cta.href}"`,
    `data-kdk-article-cta="${role}"`,
    `data-kdk-target-offer="${cta.target_offer}"`,
  ]) {
    if (countOccurrences(body, value) !== 1) {
      failures.push(`${role}-cta-occurrence:${value}`);
    }
  }
}

const primaryCta = exact.copy?.primary_cta;
verifyCta('primary', primaryCta);
const secondaryCtaCount = countOccurrences(
  body,
  'data-kdk-article-cta="secondary"',
);
if (exact.copy?.secondary_cta === null && secondaryCtaCount !== 0) {
  failures.push(`unexpected-secondary-cta:${secondaryCtaCount}`);
} else if (exact.copy?.secondary_cta) {
  verifyCta('secondary', exact.copy.secondary_cta);
}

if (
  primaryCta?.href !== exact.search_intent?.primary_landing ||
  (exact.copy?.secondary_cta &&
    exact.copy.secondary_cta.href !== exact.search_intent?.secondary_landing)
) {
  failures.push('cta-search-intent-landing-mismatch');
}

for (const required of exact.required_body_strings || []) {
  if (!body.includes(required)) failures.push(`missing-required:${required}`);
}
for (const forbidden of exact.forbidden_body_strings || []) {
  if (body.includes(forbidden)) failures.push(`forbidden:${forbidden}`);
}

for (const [assertion, value] of Object.entries(
  exact.review_assertions || {},
)) {
  if (value !== true) failures.push(`review-assertion-not-true:${assertion}`);
}

const canonicalSourceChecks = [];
for (const binding of exact.canonical_source_bindings || []) {
  const sourcePath = path.resolve(projectRoot, binding.path);
  if (!fs.existsSync(sourcePath)) {
    failures.push(`missing-canonical-source:${binding.path}`);
    continue;
  }
  const actualSha256 = sha256(fs.readFileSync(sourcePath));
  const ok = actualSha256 === binding.sha256;
  if (!ok) {
    failures.push(
      `canonical-source-sha256:${binding.path}:${actualSha256}:expected:${binding.sha256}`,
    );
  }
  canonicalSourceChecks.push({
    path: binding.path,
    sha256: actualSha256,
    ok,
  });
}


for (const binding of exact.external_source_bindings || []) {
  if (!binding.url || !binding.verified_date || !binding.supports) {
    failures.push(`invalid-external-source-binding:${binding.url || 'missing-url'}`);
  }
}

if (
  exact.approval?.owner_decision !== 'pending' ||
  exact.approval?.physician_approval !== 'pending' ||
  exact.approval?.publication_authority !== 'not_granted'
) {
  failures.push('unexpected-approval-state');
}

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      exactPath,
      exactSha256: sha256(exactRaw),
      exactVersion: exact.exact_version,
      state: exact.state,
      bodyPath,
      bodySha256,
      titleLength,
      metaLength,
      canonicalSourceChecks,
      approval: exact.approval,
      failures,
    },
    null,
    2,
  ),
);

if (failures.length) process.exit(1);
