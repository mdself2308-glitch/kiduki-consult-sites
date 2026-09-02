#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const templatePath = path.join(
  projectRoot,
  'content/templates/seo-funnel-ledger.csv',
);
const lines = (await readFile(templatePath, 'utf8'))
  .split(/\r?\n/)
  .filter(Boolean);
const columns = lines[0]?.split(',') || [];
const expected = [
  'source_system',
  'inquiry_record_id',
  'inquiry_received_at',
  'source_article',
  'source_page',
  'target_offer',
  'inquiry_type',
  'consultation_status',
  'consultation_held_at',
  'fit_result',
  'quote_status',
  'quoted_at',
  'quoted_offer',
  'contracted_offer',
  'contracted_at',
  'initial_revenue_tax_exclusive',
  'record_updated_at',
];
const prohibited = [
  'company_name',
  'person_name',
  'email',
  'phone',
  'health_information',
  'medical_information',
  'search_query',
  'consultation_notes',
];
const failures = [];

if (lines.length !== 1) failures.push('template-must-contain-header-only');
if (JSON.stringify(columns) !== JSON.stringify(expected)) {
  failures.push('columns-do-not-match-approved-schema');
}
for (const column of prohibited) {
  if (columns.includes(column)) failures.push(`prohibited-column:${column}`);
}

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      rows: lines.length,
      columns: columns.length,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 2;
