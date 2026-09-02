#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestArgument = process.argv.indexOf('--manifest');
const manifestPath = manifestArgument >= 0
  ? process.argv[manifestArgument + 1]
  : 'content/exact/static-lead-form-ga4-privacy-2026-09-01-v1.json';
const verifyLiveBefore = process.argv.includes('--verify-live-before');
const afterDeploy = process.argv.includes('--after-deploy');

if (verifyLiveBefore && afterDeploy) {
  throw new Error('--verify-live-before and --after-deploy are mutually exclusive');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function eventPayload(source) {
  const eventStart = source.search(
    /gtag\s*\(\s*['"]event['"]\s*,\s*['"]generate_lead['"]/,
  );
  if (eventStart < 0) return '';
  const remainder = source.slice(eventStart);
  const end = remainder.indexOf('});');
  return end >= 0 ? remainder.slice(0, end + 3) : remainder.slice(0, 1200);
}

const resolvedManifestPath = path.resolve(projectRoot, manifestPath);
const manifest = JSON.parse(await readFile(resolvedManifestPath, 'utf8'));
const failures = [];

if (manifest.release_name !== 'static-lead-form-ga4-privacy') {
  failures.push('manifest:release-name');
}
if (manifest.state !== 'production-approval-pending') {
  failures.push('manifest:state');
}
if (manifest.approval_evidence !== null || manifest.production_permission !== null) {
  failures.push('manifest:unverified-approval-fields');
}
if (!Array.isArray(manifest.files) || manifest.files.length !== 2) {
  failures.push('manifest:file-count');
}

const expectedPaths = new Set([
  'consult/return-to-work-pack/index.html',
  'consult/return-to-work-spot/index.html',
]);
const manifestPaths = new Set((manifest.files || []).map((file) => file.path));
if (
  manifestPaths.size !== expectedPaths.size ||
  [...expectedPaths].some((expected) => !manifestPaths.has(expected))
) {
  failures.push('manifest:exact-file-scope');
}

const results = [];
for (const file of manifest.files || []) {
  const local = await readFile(path.resolve(projectRoot, file.path));
  const localHash = sha256(local);
  const localText = local.toString('utf8');
  const event = eventPayload(localText);
  const required = file.required_event || {};
  const checks = {
    candidateHash: localHash === file.candidate_sha256,
    generateLead: event.includes('generate_lead'),
    formName:
      event.includes(`form_name: '${required.form_name}'`) ||
      event.includes(`form_name:'${required.form_name}'`),
    sourcePage:
      event.includes(`source_page: '${required.source_page}'`) ||
      event.includes(`source_page:'${required.source_page}'`),
    targetOffer:
      event.includes(`target_offer: '${required.target_offer}'`) ||
      event.includes(`target_offer:'${required.target_offer}'`),
    ctaRole:
      event.includes(`cta_role: '${required.cta_role}'`) ||
      event.includes(`cta_role:'${required.cta_role}'`),
    noLeadId: !event.includes('lead_id'),
    noInquiryDetail:
      !event.includes('support_reason') &&
      !event.includes('delivery_method') &&
      !event.includes('message'),
  };

  let liveStatus = null;
  let liveHash = null;
  let expectedLiveHash = null;
  if (verifyLiveBefore || afterDeploy) {
    const response = await fetch(file.live_url, {
      headers: { 'User-Agent': 'kdk-static-lead-release-verifier/1.0' },
    });
    const live = Buffer.from(await response.arrayBuffer());
    liveStatus = response.status;
    liveHash = sha256(live);
    expectedLiveHash = afterDeploy
      ? file.candidate_sha256
      : file.live_before_sha256;
    checks.liveStatus = liveStatus === 200;
    checks.liveHash = liveHash === expectedLiveHash;
  }

  for (const [check, passed] of Object.entries(checks)) {
    if (!passed) failures.push(`${file.name}:${check}`);
  }
  results.push({
    name: file.name,
    path: file.path,
    liveUrl: file.live_url,
    localHash,
    liveStatus,
    liveHash,
    expectedLiveHash,
    checks,
  });
}

console.log(JSON.stringify({
  ok: failures.length === 0,
  manifest: path.relative(projectRoot, resolvedManifestPath),
  exactVersion: manifest.exact_version,
  state: manifest.state,
  verifyLiveBefore,
  afterDeploy,
  results,
  failures,
}, null, 2));

if (failures.length > 0) process.exitCode = 2;
