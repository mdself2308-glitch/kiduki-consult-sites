#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidencePath = path.join(
  projectRoot,
  'content/evidence/article-cta-wordpress-dry-run-2026-09-01.json',
);
const planPath = path.join(projectRoot, 'content/article-plan.json');
const bundlePath = path.join(
  projectRoot,
  'content/exact/article-cta-owner-review-2026-09-01-v6.json',
);
const raw = await readFile(evidencePath, 'utf8');
const evidence = JSON.parse(raw);
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const bundleRaw = await readFile(bundlePath, 'utf8');
const bundle = JSON.parse(bundleRaw);
const failures = [];

if (evidence.schema_version !== 1) failures.push('schema-version');
if (evidence.mode !== 'dry-run' || evidence.writes !== false) failures.push('write-boundary');
if (evidence.wordpress_apply_authority_confirmed !== false) failures.push('apply-authority-boundary');
if (evidence.backup_path !== null) failures.push('unexpected-backup');
if (evidence.exact_version !== '2026-09-01-v6') failures.push('exact-version');
if (evidence.approval_bundle_sha256 !== '8a37688634893094c2fc0a6ba7827230dd2eba6797e9dd1183c56482bef1a34a') {
  failures.push('approval-bundle-sha256');
}
if (createHash('sha256').update(bundleRaw).digest('hex') !== evidence.approval_bundle_sha256) {
  failures.push('approval-bundle-file-sha256');
}
if (evidence.summary?.would_update !== 11 || evidence.summary?.would_update_reviewed_full_body !== 1) {
  failures.push('summary');
}

const rows = evidence.results || [];
if (rows.length !== 12) failures.push('row-count');
const uniqueSlugs = new Set(rows.map((row) => row.slug));
if (uniqueSlugs.size !== 12) failures.push('unique-slugs');

const plannedArticles = plan.articles || [];
if (plannedArticles.length !== 12) failures.push('plan-row-count');
for (const article of plannedArticles) {
  const row = rows.find((candidate) => candidate.slug === article.slug);
  if (!row) {
    failures.push(`missing-row:${article.slug}`);
    continue;
  }
  if (row.post_id !== article.wordpress_post_id) failures.push(`post-id:${article.slug}`);
  const expectedStatus = article.production_status === 'published' ? 'publish' : 'future';
  if (row.status !== expectedStatus) failures.push(`status:${article.slug}`);
  if (row.date !== article.publish_at) failures.push(`date:${article.slug}`);
  if (row.cta_status !== 'owner-review') failures.push(`cta-status:${article.slug}`);
  const bundleItem = (bundle.items || []).find((candidate) => candidate.slug === article.slug);
  if (!bundleItem) {
    failures.push(`missing-bundle-item:${article.slug}`);
    continue;
  }
  const expectedScope = bundleItem.change_scope;
  if (row.change_scope !== expectedScope) failures.push(`change-scope:${article.slug}`);
  const expectedAction = expectedScope === 'reviewed_full_body'
    ? 'would_update_reviewed_full_body'
    : 'would_update';
  if (row.action !== expectedAction) failures.push(`action:${article.slug}`);
}

if (!evidence.evidence_boundary?.includes('made no write')) failures.push('evidence-boundary');
const prohibitedPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /"(?:password|cookie|authorization|api[_ -]?key|secret)"\s*:/i,
];
for (const pattern of prohibitedPatterns) {
  if (pattern.test(raw)) failures.push(`prohibited-content:${pattern.source}`);
}

console.log(JSON.stringify({
  ok: failures.length === 0,
  evidencePath,
  rows: rows.length,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 2;
