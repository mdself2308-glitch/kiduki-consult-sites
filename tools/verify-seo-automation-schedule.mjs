#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidencePath = path.join(
  projectRoot,
  'content/evidence/codex-seo-automation-schedule-2026-09-02.json',
);
const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
const ledgerPath = path.join(
  projectRoot,
  'content/evidence/seo-milestone-review-ledger.json',
);
const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
const failures = [];

const expected = new Map([
  ['kiduki-seo-milestone-review', {
    rrule: 'DTSTART;TZID=Asia/Tokyo:20260903T073000\\nRRULE:FREQ=DAILY;BYHOUR=7;BYMINUTE=30;BYSECOND=0',
    first: '2026-09-03T07:30:00+09:00',
  }],
  ['kiduki-seo-growth-loop', {
    rrule: 'DTSTART;TZID=Asia/Tokyo:20260907T080000\\nRRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=8;BYMINUTE=0;BYSECOND=0',
    first: '2026-09-07T08:00:00+09:00',
  }],
  ['kiduki-seo-monthly-funnel-review', {
    rrule: 'DTSTART;TZID=Asia/Tokyo:20261001T083000\\nRRULE:FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=8;BYMINUTE=30;BYSECOND=0',
    first: '2026-10-01T08:30:00+09:00',
  }],
]);

if (evidence.schema_version !== 1) failures.push('schema-version');
if (evidence.timezone !== 'Asia/Tokyo') failures.push('timezone');
if (evidence.scheduler !== 'Codex local automation control plane') failures.push('scheduler');
if (evidence.google_calendar?.operational_dependency !== false) failures.push('calendar-dependency');
if (evidence.google_calendar?.mutation_in_this_change !== 'none') failures.push('calendar-mutation');
if (ledger.schema_version !== 1) failures.push('ledger-schema');
if (ledger.timezone !== 'Asia/Tokyo') failures.push('ledger-timezone');
if (ledger.automation_id !== 'kiduki-seo-milestone-review') failures.push('ledger-automation');
if (JSON.stringify(ledger.terminal_statuses) !== JSON.stringify(['measured', 'observed_no_data'])) {
  failures.push('ledger-terminal-statuses');
}
if (JSON.stringify(ledger.retryable_statuses) !== JSON.stringify(['partial', 'blocked'])) {
  failures.push('ledger-retryable-statuses');
}
if (!Array.isArray(ledger.records)) failures.push('ledger-records');

const automationRows = evidence.automations || [];
if (automationRows.length !== expected.size) failures.push('automation-count');
for (const row of automationRows) {
  const spec = expected.get(row.id);
  if (!spec) {
    failures.push(`unexpected:${row.id}`);
    continue;
  }
  if (row.status !== 'ACTIVE') failures.push(`evidence-status:${row.id}`);
  if (row.rrule.replaceAll('\n', '\\n') !== spec.rrule) failures.push(`evidence-rrule:${row.id}`);
  if (row.first_scheduled_run !== spec.first) failures.push(`first-run:${row.id}`);
  try {
    await access(row.definition);
  } catch {
    failures.push(`missing-definition:${row.id}`);
    continue;
  }
  const source = await readFile(row.definition, 'utf8');
  if (!source.includes(`id = "${row.id}"`)) failures.push(`definition-id:${row.id}`);
  if (!source.includes('status = "ACTIVE"')) failures.push(`definition-status:${row.id}`);
  if (!source.includes(`rrule = "${spec.rrule}"`)) failures.push(`definition-rrule:${row.id}`);
  if (!source.includes(evidence.global_content_manual)) failures.push(`global-manual:${row.id}`);
  if (!source.includes(`project_id = "${evidence.project_id}"`)) failures.push(`project-id:${row.id}`);
  if (!source.includes(`cwds = ["${evidence.project_path}"]`)) failures.push(`cwd:${row.id}`);
  if (row.id === 'kiduki-seo-milestone-review' && !source.includes('content/evidence/seo-milestone-review-ledger.json')) {
    failures.push('milestone-ledger-binding');
  }
  if (!/Google Calendar[^\n]*(?:作成|予定)[^\n]*(?:更新|使わ)[^\n]*(?:削除|ない)/.test(source)) {
    failures.push(`calendar-boundary:${row.id}`);
  }
}
for (const id of expected.keys()) {
  if (!automationRows.some((row) => row.id === id)) failures.push(`missing:${id}`);
}

const scheduleDoc = await readFile(path.join(projectRoot, 'content/seo-review-schedule.md'), 'utf8');
const contentGuide = await readFile(path.join(projectRoot, 'content/README.md'), 'utf8');
for (const id of expected.keys()) {
  if (!scheduleDoc.includes(id)) failures.push(`schedule-doc:${id}`);
}
if (!scheduleDoc.includes('Google Calendar予定は、削除指示がないため変更していない')) {
  failures.push('legacy-calendar-boundary');
}
if (!contentGuide.includes(evidence.global_content_manual)) failures.push('content-guide-manual');

console.log(JSON.stringify({
  ok: failures.length === 0,
  evidencePath,
  ledgerPath,
  automations: automationRows.map(({ id, status, first_scheduled_run: firstScheduledRun }) => ({
    id,
    status,
    firstScheduledRun,
  })),
  googleCalendarDependency: evidence.google_calendar?.operational_dependency,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 2;
