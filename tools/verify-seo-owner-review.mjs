#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (value) => path.join(root, value);
const failures = [];

async function readText(file) {
  return readFile(rel(file), 'utf8');
}

async function readJson(file) {
  return JSON.parse(await readText(file));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function requireValue(condition, label) {
  if (!condition) failures.push(label);
}

const files = {
  packet: 'content/seo-exact-owner-review-2026-09-01.md',
  spot: 'content/exact/spot-industrial-physician-ctr-2026-09-01-v2.json',
  ctas: 'content/exact/article-cta-owner-review-2026-09-01-v6.json',
  stress: 'content/exact/stresscheck-small-workplace-2028-2026-09-01-v3.json',
  privacy: 'content/exact/static-lead-form-ga4-privacy-2026-09-01-v1.json',
  comparison: 'content/exact/return-to-work-one-off-vs-pack-2026-09-01-v3.json',
  homePaths: 'content/exact/consult-home-pack-spot-links-2026-09-01-v1.json',
  existingPhysicianSupport:
    'content/exact/existing-industrial-physician-specialist-support-2026-09-01-v1.json',
  caseManagement:
    'content/exact/occupational-health-case-management-2026-09-01-v1.json',
};

const [
  packet,
  spotRaw,
  ctasRaw,
  stressRaw,
  privacyRaw,
  comparisonRaw,
  homePathsRaw,
  existingPhysicianSupportRaw,
  caseManagementRaw,
] = await Promise.all([
  readText(files.packet),
  readText(files.spot),
  readText(files.ctas),
  readText(files.stress),
  readText(files.privacy),
  readText(files.comparison),
  readText(files.homePaths),
  readText(files.existingPhysicianSupport),
  readText(files.caseManagement),
]);

const spot = JSON.parse(spotRaw);
const ctas = JSON.parse(ctasRaw);
const stress = JSON.parse(stressRaw);
const privacy = JSON.parse(privacyRaw);
const comparison = JSON.parse(comparisonRaw);
const homePaths = JSON.parse(homePathsRaw);
const existingPhysicianSupport = JSON.parse(existingPhysicianSupportRaw);
const caseManagement = JSON.parse(caseManagementRaw);

const expected = {
  spot: 'a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9',
  ctas: '8a37688634893094c2fc0a6ba7827230dd2eba6797e9dd1183c56482bef1a34a',
  stress: '6bcbd35e962d235b7344fe0571d9e1ea3907597c78e8df725bdd19fd337610bc',
  privacy: 'a17cd81de2dd936fca0447bd0fa8f8bf0e7586043a9712d2f5466ece62d3fecb',
  existingPhysicianSupport:
    'c524ae175125c8be963b2ed3fc1cdc2b8ffb6e8e1213db0f1bcae4e023234fc4',
  caseManagement:
    'ef7b280d49fa75e34013a0f540d6b4ceb00b680c4ca0ac0200abf5f6d57c1b7a',
};

requireValue(sha256(spotRaw) === expected.spot, 'spot-exact-sha256');
requireValue(sha256(ctasRaw) === expected.ctas, 'cta-exact-sha256');
requireValue(sha256(stressRaw) === expected.stress, 'stress-exact-sha256');
requireValue(sha256(privacyRaw) === expected.privacy, 'privacy-exact-sha256');
requireValue(
  sha256(existingPhysicianSupportRaw) === expected.existingPhysicianSupport,
  'existing-physician-support-exact-sha256',
);
requireValue(
  sha256(caseManagementRaw) === expected.caseManagement,
  'case-management-exact-sha256',
);

requireValue(spot.exact_version === '2026-09-01-v2', 'spot-version');
requireValue(spot.target?.wordpress_post_id === 164, 'spot-target');

requireValue(ctas.exact_version === '2026-09-01-v6', 'cta-version');
requireValue(ctas.state === 'owner-review', 'cta-state');
requireValue(ctas.item_count === 12 && ctas.items?.length === 12, 'cta-item-count');
requireValue(ctas.supersedes?.exact_version === '2026-09-01-v5', 'cta-supersedes-v5');
requireValue(ctas.approval?.owner_decision === 'pending', 'cta-owner-pending');
requireValue(ctas.approval?.physician_approval === 'pending', 'cta-physician-pending');
requireValue(ctas.approval?.approval_evidence === null, 'cta-approval-evidence-empty');
requireValue(ctas.approval?.publication_authority === 'not_granted', 'cta-publication-not-granted');
requireValue(ctas.product_gate?.pack_p01 === 'not_tested', 'cta-pack-p01');
requireValue(ctas.product_gate?.pack_p02 === 'not_tested', 'cta-pack-p02');
requireValue(ctas.product_gate?.pack_mentions_allowed === false, 'cta-pack-mentions-gate');
requireValue(
  !/Pack|単発\/Pack|単発・Pack/.test(JSON.stringify(ctas.items)),
  'cta-unaccepted-pack-mention',
);
requireValue(ctas.items.every((item) =>
  item.cta_status === 'owner-review'
  && item.cta_deployment_status === 'not_applied'
  && /^[a-f0-9]{64}$/.test(item.source_sha256)
  && /^[a-f0-9]{64}$/.test(item.cta_html_sha256)
), 'cta-item-boundaries');

requireValue(stress.exact_version === '2026-09-01-v3', 'stress-version');
requireValue(stress.state === 'owner-review', 'stress-state');
requireValue(stress.approval?.owner_decision === 'pending', 'stress-owner-pending');
requireValue(stress.approval?.physician_approval === 'pending', 'stress-physician-pending');
requireValue(stress.approval?.publication_authority === 'not_granted', 'stress-publication-not-granted');

requireValue(privacy.state === 'production-approval-pending', 'privacy-state');
requireValue(privacy.approval_evidence === null, 'privacy-approval-evidence-empty');
requireValue(privacy.production_permission === null, 'privacy-production-permission-empty');
requireValue(privacy.publication?.performed === false, 'privacy-not-published');

requireValue(comparison.state === 'tier-s-review', 'comparison-blocked-state');
requireValue(comparison.approval?.owner_decision === 'pending', 'comparison-owner-pending');
requireValue(homePaths.state === 'tier-s-review', 'home-paths-blocked-state');
requireValue(homePaths.publication_gates?.deployment_status === 'not_applied', 'home-paths-not-applied');
requireValue(homePaths.publication_gates?.pack_acceptance_p01 === 'not_tested', 'home-paths-pack-p01');
requireValue(homePaths.publication_gates?.pack_acceptance_p02 === 'not_tested', 'home-paths-pack-p02');

for (const [label, candidate] of [
  ['existing-physician-support', existingPhysicianSupport],
  ['case-management', caseManagement],
]) {
  requireValue(candidate.exact_version === '2026-09-01-v1', `${label}-version`);
  requireValue(candidate.state === 'owner-review', `${label}-state`);
  requireValue(candidate.target?.wordpress_post_id === null, `${label}-post-not-created`);
  requireValue(
    candidate.target?.publication_status === 'not_created',
    `${label}-publication-not-created`,
  );
  requireValue(candidate.approval?.owner_decision === 'pending', `${label}-owner-pending`);
  requireValue(candidate.approval?.physician_approval === 'pending', `${label}-physician-pending`);
  requireValue(
    candidate.approval?.publication_authority === 'not_granted',
    `${label}-publication-not-granted`,
  );
}

const readyRows = (packet.match(/^\| [ABC]\. /gm) || []).length;
requireValue(readyRows === 3, 'packet-ready-row-count');
for (const [decision, version, hash] of [
  ['A', '2026-09-01-v2', expected.spot],
  ['B', '2026-09-01-v6', expected.ctas],
  ['C', '2026-09-01-v3', expected.stress],
]) {
  requireValue(packet.includes(`${decision} 承認: ${version} / ${hash}`), `packet-decision:${decision}`);
}
for (const [decision, version, hash] of [
  ['F', '2026-09-01-v1', expected.existingPhysicianSupport],
  ['G', '2026-09-01-v1', expected.caseManagement],
]) {
  requireValue(packet.includes(`${decision} 承認: ${version} / ${hash}`), `packet-decision:${decision}`);
}
requireValue(packet.includes(`D 本番反映を許可: 2026-09-01-v1 / ${expected.privacy}`), 'packet-production-decision:D');
for (const [decision, version, hash] of [
  ['E-A', '2026-09-01-v2', expected.spot],
  ['E-B', '2026-09-01-v6', expected.ctas],
  ['E-C', '2026-09-01-v3', expected.stress],
]) {
  requireValue(packet.includes(`${decision} WordPress本番反映を許可: ${version} / ${hash}`), `packet-production-decision:${decision}`);
}
requireValue(packet.includes('単発vsPack比較記事 v3 | tier-s-review'), 'packet-comparison-blocked');
requireValue(packet.includes('consultトップ→Pack・SPOT分岐 v1 | tier-s-review'), 'packet-home-paths-blocked');
requireValue(packet.includes('exact版の承認とWordPress本番反映権限は別'), 'packet-approval-production-boundary');
requireValue(packet.includes('A〜Cの承認だけでは実行しない'), 'packet-static-production-boundary');
requireValue(packet.includes('次の5件が'), 'packet-five-ready-decisions');
requireValue(
  packet.includes('F〜Gのexact承認も文言判断だけを証明'),
  'packet-new-post-production-boundary',
);

console.log(JSON.stringify({
  ok: failures.length === 0,
  packet: files.packet,
  readyDecisions: ['A', 'B', 'C', 'F', 'G'],
  separateProductionDecisions: ['D', 'E-A', 'E-B', 'E-C'],
  exactHashes: expected,
  blockedCandidates: {
    comparison: comparison.state,
    consultHome: homePaths.state,
  },
  failures,
}, null, 2));

if (failures.length) process.exitCode = 2;
