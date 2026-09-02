#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidencePath = path.join(
  projectRoot,
  'content/evidence/search-console-dual-property-snapshot-2026-09-01.json',
);
const raw = await readFile(evidencePath, 'utf8');
const evidence = JSON.parse(raw);
const failures = [];

const byProperty = new Map(
  (evidence.properties || []).map((entry) => [entry.property, entry]),
);
const wordpress = byProperty.get('https://kdkconslt-sngyouijm.com/');
const consult = byProperty.get('https://consult.kdkconslt-sngyouijm.com/');

const same = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(label);
};

if (evidence.schema_version !== 1) failures.push('schema-version');
if (evidence.operation !== 'read_only' || evidence.writes !== false) {
  failures.push('read-only-boundary');
}
if (evidence.selected_range !== '28_days') failures.push('selected-range');
if (byProperty.size !== 2) failures.push('property-count');
if (evidence.device_breakdown?.status !== 'captured_for_prior_period_only') {
  failures.push('device-breakdown-status');
}
if (evidence.device_breakdown?.same_period_status !== 'not_captured') {
  failures.push('same-period-device-status');
}
if (evidence.device_breakdown?.credentials_entered !== false ||
    evidence.device_breakdown?.access_requested !== false ||
    evidence.device_breakdown?.property_permissions_changed !== false) {
  failures.push('device-access-boundary');
}
same(evidence.device_breakdown?.required_next_capture, [
  'スポット産業医 by device for the same selected range',
  '産業医 スポット by device for the same selected range',
], 'device-next-capture');
same(evidence.device_breakdown?.prior_period, {
  start: '2026-08-05',
  end: '2026-08-31',
  captured_at: '2026-09-01T19:09:00+09:00',
  query_rows: [
    {
      query: 'スポット産業医',
      devices: [
        { device: 'mobile', clicks: 1, impressions: 27 },
        { device: 'desktop', clicks: 0, impressions: 26 },
      ],
    },
    {
      query: '産業医 スポット',
      devices: [
        { device: 'desktop', clicks: 0, impressions: 50 },
        { device: 'mobile', clicks: 0, impressions: 44 },
      ],
    },
  ],
}, 'prior-period-device-rows');
if (!evidence.device_breakdown?.evidence_boundary?.includes('Keep the prior-period device rows separate')) {
  failures.push('device-inference-boundary');
}

same(wordpress?.chart_data_range, { start: '2026-08-02', end: '2026-08-29' }, 'wordpress-range');
same(wordpress?.metrics, {
  clicks: 11,
  impressions: 241,
  ctr: 0.046,
  average_position: 21.1,
}, 'wordpress-metrics');

const spotRows = wordpress?.query_page_rows || [];
same(spotRows, [
  {
    query: 'スポット産業医',
    page: 'https://kdkconslt-sngyouijm.com/service/spot/',
    clicks: 1,
    impressions: 56,
    ctr: 0.018,
    average_position: 26,
  },
  {
    query: '産業医 スポット',
    page: 'https://kdkconslt-sngyouijm.com/service/spot/',
    clicks: 0,
    impressions: 91,
    ctr: 0,
    average_position: 27.2,
  },
], 'spot-query-page-rows');

same(consult?.chart_data_range, { start: '2026-08-13', end: '2026-08-29' }, 'consult-range');
same(consult?.metrics, {
  clicks: 1,
  impressions: 16,
  ctr: 0.062,
  average_position: 8.4,
}, 'consult-metrics');
same(consult?.query_rows, [{ query: 'casetra', clicks: 0, impressions: 1 }], 'consult-query-row');
same(consult?.page_rows, [
  {
    page: 'https://consult.kdkconslt-sngyouijm.com/',
    clicks: 1,
    impressions: 16,
  },
  {
    page: 'https://consult.kdkconslt-sngyouijm.com/return-to-work-pack/',
    clicks: 0,
    impressions: 1,
  },
], 'consult-page-rows');

const boundaries = evidence.evidence_boundaries || [];
if (!boundaries.some((value) => value.includes('must not be summed'))) {
  failures.push('separate-property-boundary');
}
if (!boundaries.some((value) => value.includes('does not explain the consult homepage click'))) {
  failures.push('consult-query-suppression-boundary');
}
if (!boundaries.some((value) => value.includes('not service-page transitions'))) {
  failures.push('conversion-boundary');
}

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
  properties: [...byProperty.keys()],
  failures,
}, null, 2));
if (failures.length) process.exitCode = 2;
