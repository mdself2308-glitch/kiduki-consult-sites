#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  aggregateRows,
  searchRows,
  summarizeQueryPage,
} from '../kiduki/scripts/site-kit-report-utils.mjs';

const result = {
  ok: true,
  data: [
    {
      keys: ['スポット産業医', 'https://example.com/service/spot/'],
      clicks: 1,
      impressions: 10,
      ctr: 0.1,
      position: 3,
    },
    {
      keys: [
        'スポット産業医',
        'https://example.com/service/return-to-work-support/',
      ],
      clicks: 0,
      impressions: 10,
      ctr: 0,
      position: 5,
    },
    {
      keys: ['復職 産業医 意見書', 'https://example.com/article/'],
      clicks: 2,
      impressions: 5,
      ctr: 0.4,
      position: 2,
    },
  ],
};

const normalized = searchRows(result, ['query', 'page']);
assert.equal(normalized.available, true);
assert.equal(normalized.rows[0].query, 'スポット産業医');
assert.equal(
  normalized.rows[0].page,
  'https://example.com/service/spot/',
);

const queries = aggregateRows(normalized.rows, 'query');
assert.deepEqual(queries[0], {
  query: 'スポット産業医',
  clicks: 1,
  impressions: 20,
  ctr: 0.05,
  averagePosition: 4,
});

const report = summarizeQueryPage(result);
assert.equal(report.available, true);
assert.equal(report.rowCount, 3);
assert.equal(report.trackedQueries.spotIndustrialPhysician.found, true);
assert.equal(
  report.trackedQueries.spotIndustrialPhysician.pages.length,
  2,
);
assert.equal(
  report.trackedQueries.spotIndustrialPhysician.averagePosition,
  4,
);

const unavailable = summarizeQueryPage({ ok: false, error: '403' });
assert.deepEqual(unavailable, { available: false, error: '403' });

console.log('Site Kit report aggregation checks passed.');
