#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exactPath = path.join(
  root,
  'content/exact/consult-home-pack-spot-links-2026-09-01-v1.json',
);
const candidatePath = path.join(root, 'content/consult-home-pack-spot-links.md');
const homePath = path.join(root, 'consult/index.html');

const exactBuffer = await readFile(exactPath);
const exact = JSON.parse(exactBuffer.toString('utf8'));
const candidate = await readFile(candidatePath, 'utf8');
const home = await readFile(homePath, 'utf8');
const failures = [];

function check(name, condition) {
  if (!condition) failures.push(name);
}

check('state-tier-s-review', exact.state === 'tier-s-review');
check(
  'deployment-not-applied',
  exact.publication_gates?.deployment_status === 'not_applied',
);
check(
  'pack-p01-not-tested',
  exact.publication_gates?.pack_acceptance_p01 === 'not_tested',
);
check(
  'pack-p02-not-tested',
  exact.publication_gates?.pack_acceptance_p02 === 'not_tested',
);
check(
  'approval-not-inferred',
  exact.publication_gates?.owner_physician_approval === null &&
    exact.publication_gates?.static_production_permission === null,
);
check('exact-two-links', exact.copy?.links?.length === 2);
check('candidate-supporting-copy', candidate.includes(exact.copy?.supporting_text));

for (const link of exact.copy?.links || []) {
  check(`${link.target_offer}:candidate-label`, candidate.includes(link.label));
  check(`${link.target_offer}:candidate-href`, candidate.includes(`\`${link.href}\``));
  check(`${link.target_offer}:clean-href`, !/[?&]utm_/i.test(link.href));
  check(`${link.target_offer}:relative-href`, /^\/return-to-work-(?:pack|spot)\/$/.test(link.href));
  check(`${link.target_offer}:event-name`, link.event_name === 'service_contact_click');
  check(`${link.target_offer}:source-page`, link.source_page === 'consult-home');
  check(`${link.target_offer}:cta-role`, link.cta_role === 'service-path');
}

check('candidate-forbids-internal-utm', candidate.includes('同一サイト内リンクへUTMを付けない'));
check('candidate-company-decision-boundary', candidate.includes('会社が決定する工程'));
check(
  'home-not-applied-yet',
  !exact.copy.links.every((link) => home.includes(`href="${link.href}"`)),
);

const sha256 = createHash('sha256').update(exactBuffer).digest('hex');

console.log(JSON.stringify({
  ok: failures.length === 0,
  exactVersion: exact.exact_version,
  state: exact.state,
  deploymentStatus: exact.publication_gates?.deployment_status,
  exactSha256: sha256,
  checks: {
    linkCount: exact.copy?.links?.length ?? 0,
    packP01: exact.publication_gates?.pack_acceptance_p01,
    packP02: exact.publication_gates?.pack_acceptance_p02,
    homeApplied: exact.copy?.links?.every((link) => home.includes(`href="${link.href}"`)),
  },
  failures,
}, null, 2));

if (failures.length > 0) process.exitCode = 2;
