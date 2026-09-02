#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const inputFlag = args.indexOf('--input');
const inputPath = path.resolve(
  projectRoot,
  inputFlag >= 0 && args[inputFlag + 1]
    ? args[inputFlag + 1]
    : 'content/templates/casetra-leads-aggregate.example.json',
);
const expectTemplate = args.includes('--template');
const raw = await readFile(inputPath, 'utf8');
const report = JSON.parse(raw);
const failures = [];

const expectedProductKeys = [
  'KIDUKI_RTW_PACK',
  'KIDUKI_RTW_SPOT_ONLINE',
  'KIDUKI_RTW_SPOT_ONSITE',
  'total',
];
const prohibitedKey = /^(?:id|lead[_-]?id|lead[_-]?token|name|company[_-]?name|contact|contact[_-]?(?:name|email|phone)|email|phone|tel|message|body|subject|health|diagnosis|employee|record|records|items|token|authorization|cookie|secret|password|api[_-]?key)$/i;
const prohibitedValuePatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(?:\+?81[- ]?|0)\d{1,4}[- ]?\d{1,4}[- ]?\d{3,4}/,
];

function visit(value, trail = []) {
  if (Array.isArray(value)) {
    failures.push(`arrays-not-allowed:${trail.join('.') || 'root'}`);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (prohibitedKey.test(key)) failures.push(`prohibited-key:${[...trail, key].join('.')}`);
      visit(child, [...trail, key]);
    }
    return;
  }
  if (typeof value === 'string') {
    for (const pattern of prohibitedValuePatterns) {
      if (pattern.test(value)) failures.push(`prohibited-value:${trail.join('.')}`);
    }
  }
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateCountGroup(group, label, allowNull) {
  if (!group || typeof group !== 'object' || Array.isArray(group)) {
    failures.push(`missing-count-group:${label}`);
    return;
  }
  if (JSON.stringify(Object.keys(group)) !== JSON.stringify(expectedProductKeys)) {
    failures.push(`count-keys:${label}`);
    return;
  }
  const values = expectedProductKeys.map((key) => group[key]);
  if (allowNull) {
    if (!values.every((value) => value === null)) failures.push(`template-counts-must-be-null:${label}`);
    return;
  }
  if (!values.every((value) => Number.isInteger(value) && value >= 0)) {
    failures.push(`invalid-count:${label}`);
    return;
  }
  const subtotal = expectedProductKeys
    .filter((key) => key !== 'total')
    .reduce((sum, key) => sum + group[key], 0);
  if (subtotal !== group.total) failures.push(`count-total-mismatch:${label}`);
}

visit(report);

if (report.schema_version !== 1) failures.push('schema-version');
if (report.report_type !== 'casetra_leads_count_only_reconciliation') failures.push('report-type');
if (report.source_system !== 'casetra_leads') failures.push('source-system');
if (!isDate(report.period?.start) || !isDate(report.period?.end)) failures.push('period');
if (report.period?.timezone !== 'Asia/Tokyo') failures.push('timezone');
if (report.aggregation_rules?.product_code_field !== 'requested_product_code') failures.push('product-code-field');
if (report.aggregation_rules?.created_period_field !== 'created_at') failures.push('created-period-field');
if (report.aggregation_rules?.latest_touch_period_field !== 'lead_notification_updated_at') failures.push('latest-touch-period-field');
if (report.aggregation_rules?.unique_records_only !== true) failures.push('unique-records-only');
if (report.aggregation_rules?.personal_data_exported !== false) failures.push('personal-data-boundary');
if (report.aggregation_rules?.successful_api_responses_equal_unique_records !== false) failures.push('event-record-boundary');

const isTemplate = report.state === 'template_only';
if (expectTemplate && !isTemplate) failures.push('expected-template');
if (!['template_only', 'count_only_observation'].includes(report.state)) failures.push('state');

const sourceStatuses = Object.values(report.sources || {}).map((source) => source?.status);
if (JSON.stringify(Object.keys(report.sources || {})) !== JSON.stringify(['cosmos', 'application_insights'])) {
  failures.push('source-keys');
}
if (isTemplate) {
  if (!sourceStatuses.every((status) => status === 'not_run')) failures.push('template-source-status');
  if (report.extracted_at !== null) failures.push('template-extracted-at');
  if (!Object.values(report.sources || {}).every((source) => source?.evidence_reference === null)) {
    failures.push('template-evidence-reference');
  }
} else {
  if (!sourceStatuses.every((status) => ['observed', 'unavailable'].includes(status))) failures.push('observation-source-status');
  if (!sourceStatuses.includes('observed')) failures.push('observation-needs-observed-source');
  if (typeof report.extracted_at !== 'string' || Number.isNaN(Date.parse(report.extracted_at))) failures.push('extracted-at');
  for (const [sourceName, source] of Object.entries(report.sources || {})) {
    if (typeof source?.evidence_reference !== 'string' || !source.evidence_reference.trim()) {
      failures.push(`observation-evidence-reference:${sourceName}`);
    }
  }
}

validateCountGroup(report.counts?.unique_records_created, 'unique_records_created', isTemplate || report.sources?.cosmos?.status !== 'observed');
validateCountGroup(report.counts?.unique_records_latest_touched, 'unique_records_latest_touched', isTemplate || report.sources?.cosmos?.status !== 'observed');

const responseTotal = report.counts?.successful_api_responses?.total;
if (isTemplate || report.sources?.application_insights?.status !== 'observed') {
  if (responseTotal !== null) failures.push('unobserved-api-response-count-must-be-null');
} else if (!Number.isInteger(responseTotal) || responseTotal < 0) {
  failures.push('invalid-api-response-count');
}

const boundary = String(report.boundary || '');
for (const required of ['Count-only', 'separate measures', 'Do not add lead identifiers']) {
  if (!boundary.includes(required)) failures.push(`boundary:${required}`);
}

console.log(JSON.stringify({
  ok: failures.length === 0,
  inputPath,
  state: report.state,
  sourceStatuses: report.sources,
  failures: [...new Set(failures)],
}, null, 2));

if (failures.length) process.exitCode = 2;
