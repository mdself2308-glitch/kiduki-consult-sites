#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectLiveMatch = process.argv.includes('--expect-live-match');
const checkLive = expectLiveMatch || process.argv.includes('--live');
const forms = [
  {
    name: 'pack',
    sourcePage: 'return-to-work-pack',
    formName: 'kiduki_rtw_pack',
    localPath: 'consult/return-to-work-pack/index.html',
    liveUrl: 'https://consult.kdkconslt-sngyouijm.com/return-to-work-pack/',
  },
  {
    name: 'spot',
    sourcePage: 'return-to-work-spot',
    formName: 'kiduki_rtw_spot',
    localPath: 'consult/return-to-work-spot/index.html',
    liveUrl: 'https://consult.kdkconslt-sngyouijm.com/return-to-work-spot/',
  },
];

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

const results = [];
for (const form of forms) {
  const local = await readFile(path.join(projectRoot, form.localPath));
  const localText = local.toString('utf8');
  const localEvent = eventPayload(localText);
  let response;
  let live;
  let liveEvent = '';
  if (checkLive) {
    response = await fetch(form.liveUrl, {
      headers: { 'User-Agent': 'kdk-static-lead-form-verifier/1.0' },
    });
    live = Buffer.from(await response.arrayBuffer());
    liveEvent = eventPayload(live.toString('utf8'));
  }
  const localChecks = {
    sharedGa4Property:
      localText.includes('G-JQFWB6XG2E') &&
      localText.includes("'generate_lead'"),
    eventAfterSuccessfulFirstPartyWrite:
      localText.indexOf('!response.ok') >= 0 &&
      localText.indexOf("'generate_lead'") > localText.indexOf('!response.ok'),
    formName: localEvent.includes(`form_name: '${form.formName}'`) ||
      localEvent.includes(`form_name:'${form.formName}'`),
    sourcePage: localEvent.includes(`source_page: '${form.sourcePage}'`) ||
      localEvent.includes(`source_page:'${form.sourcePage}'`),
    targetOffer: localEvent.includes("target_offer: 'return-to-work'") ||
      localEvent.includes("target_offer:'return-to-work'"),
    ctaRole: localEvent.includes("cta_role: 'form-submit'") ||
      localEvent.includes("cta_role:'form-submit'"),
    noFirstPartyLeadIdInGa4: !localEvent.includes('lead_id'),
    noInquiryDetailInGa4:
      !localEvent.includes('support_reason') &&
      !localEvent.includes('delivery_method'),
  };
  const exactMatch = live ? local.equals(live) : null;
  results.push({
    name: form.name,
    localPath: path.join(projectRoot, form.localPath),
    liveUrl: form.liveUrl,
    status: response?.status ?? null,
    exactMatch,
    localChecks,
    localSha256: sha256(local),
    liveSha256: live ? sha256(live) : null,
    liveEventContainsFirstPartyLeadId: live ? liveEvent.includes('lead_id') : null,
  });
}

const failures = [];
for (const result of results) {
  if (checkLive && result.status !== 200) failures.push(`${result.name}:live-status`);
  for (const [check, passed] of Object.entries(result.localChecks)) {
    if (!passed) failures.push(`${result.name}:${check}`);
  }
  if (expectLiveMatch && !result.exactMatch) {
    failures.push(`${result.name}:live-match`);
  }
}

console.log(JSON.stringify({
  ok: failures.length === 0,
  checkLive,
  expectLiveMatch,
  results,
  failures,
}, null, 2));

if (failures.length > 0) process.exitCode = 2;
