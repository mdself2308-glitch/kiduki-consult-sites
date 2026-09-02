#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidencePath = path.join(
  projectRoot,
  'content/evidence/spot-wordpress-dry-run-2026-09-01.json',
);
const raw = await readFile(evidencePath, 'utf8');
const evidence = JSON.parse(raw);
const failures = [];

const expect = (condition, label) => {
  if (!condition) failures.push(label);
};
const same = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(label);
};

expect(evidence.schema_version === 1, 'schema-version');
expect(evidence.mode === 'dry-run', 'mode');
expect(evidence.persistent_writes === false, 'persistent-writes');
expect(evidence.approval?.apply_authorization_verified === false, 'apply-authorization-boundary');
expect(
  evidence.approval?.exact_payload_sha256 ===
    'a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9',
  'exact-payload-sha256',
);
expect(evidence.wordpress_item?.id === 164, 'wordpress-id');
expect(evidence.wordpress_item?.current?.modified === '2026-08-31T17:19:23', 'current-modified');
expect(
  evidence.wordpress_item?.current?.content_sha256 ===
    '2030a084b3a72470f00f27a6d88f6f974bc1d7d96c33b5a5b44376d54e8e02ed',
  'current-content-sha256',
);
expect(evidence.wordpress_item?.current?.remote_source_lock_matches === true, 'remote-source-lock');
expect(
  evidence.wordpress_item?.candidate?.content_sha256 ===
    'b64bdb234eb4e8aa92a4099f6dc9edb7b8564ebc22953564ff4fde4d4f3516a0',
  'candidate-content-sha256',
);
same(evidence.wordpress_item?.changed_fields, ['title', 'excerpt', 'content'], 'changed-fields');
same(evidence.wordpress_item?.unchanged_fields, ['slug', 'status'], 'unchanged-fields');
expect(evidence.evidence_boundary?.includes('made no persistent write'), 'evidence-boundary');

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
  failures,
}, null, 2));
if (failures.length) process.exitCode = 2;
