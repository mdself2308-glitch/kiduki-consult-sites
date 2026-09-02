#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const auditPath = path.join(
  projectRoot,
  'content/evidence/seo-goal-completion-audit-2026-09-01.json',
);
const raw = await readFile(auditPath, 'utf8');
const audit = JSON.parse(raw);
const failures = [];

const expectedStatuses = new Map(Object.entries({
  global_content_manual: 'verified',
  kiduki_product_medical_publication_boundaries: 'verified_local_rules',
  one_deliverable_one_ticket: 'verified',
  tier_s_fact_safety_medical_ad_review: 'verified_local_review',
  spot_low_ctr_diagnosis: 'verified_baseline',
  spot_exact_repair: 'ready_for_owner_review',
  consult_search_console_coverage: 'verified_separate_property',
  search_console_query_page_click_impression_ctr_baseline: 'verified_baseline',
  site_kit_zero_key_event_reconciliation: 'partially_reconciled',
  article_specific_cta_repair: 'ready_for_owner_review',
  miyabe_exact_owner_physician_approval: 'missing',
  production_publication_authority: 'missing',
  weekly_monthly_review_schedule: 'scheduled_verified',
  published_article_7_28_90_reviews: 'scheduled_not_due',
  future_article_7_28_90_reviews: 'awaiting_actual_publication',
  article_to_service_transition_measurement: 'implementation_present_reception_unverified',
  service_to_contact_transition_measurement: 'local_candidate_not_published',
  valid_inquiry_measurement: 'incomplete_first_party_reconciliation',
  sales_consultation_quote_contract_measurement: 'missing_authorized_ledger',
}));

if (audit.schema_version !== 1) failures.push('schema-version');
if (audit.overall_status !== 'not_complete') failures.push('overall-status');
if (audit.completion_allowed !== false) failures.push('completion-allowed');
const requirements = audit.requirements || [];
if (requirements.length !== expectedStatuses.size) failures.push('requirement-count');
const seen = new Set();
for (const requirement of requirements) {
  if (seen.has(requirement.id)) failures.push(`duplicate:${requirement.id}`);
  seen.add(requirement.id);
  if (expectedStatuses.get(requirement.id) !== requirement.status) {
    failures.push(`status:${requirement.id}`);
  }
  if (!requirement.boundary) failures.push(`boundary:${requirement.id}`);
  for (const evidencePath of requirement.evidence || []) {
    if (evidencePath.endsWith('/')) continue;
    const resolved = path.isAbsolute(evidencePath)
      ? evidencePath
      : path.join(projectRoot, evidencePath);
    try {
      await access(resolved);
    } catch {
      failures.push(`missing-evidence:${requirement.id}:${evidencePath}`);
    }
  }
}
for (const id of expectedStatuses.keys()) {
  if (!seen.has(id)) failures.push(`missing-requirement:${id}`);
}

const reviewTicket = await readFile(
  path.join(projectRoot, 'content/tasks/CT-20260901-seo-exact-owner-review.md'),
  'utf8',
);
if (!/^status: owner-review$/m.test(reviewTicket)) failures.push('owner-review-ticket-status');
if (!/^owner_decision: pending$/m.test(reviewTicket)) failures.push('owner-decision-state');
if (!/^approval_evidence:\s*$/m.test(reviewTicket)) failures.push('approval-evidence-state');
if (!/^physician_approval:\s*$/m.test(reviewTicket)) failures.push('physician-approval-state');

const calendar = JSON.parse(await readFile(
  path.join(projectRoot, 'content/seo-article-review-calendar.json'),
  'utf8',
));
if (calendar.event_count !== 36 || (calendar.events || []).length !== 36) {
  failures.push('review-calendar-count');
}
if (calendar.events?.[0]?.start_time !== '2026-09-08T08:00:00+09:00') {
  failures.push('first-review-date');
}

const futurePlan = JSON.parse(await readFile(
  path.join(projectRoot, 'content/future-article-review-plan.json'),
  'utf8',
));
if (futurePlan.state !== 'awaiting_actual_publication') failures.push('future-plan-state');
if (futurePlan.calendar_events_created !== false) failures.push('future-calendar-state');

const incompleteStatuses = new Set([
  'ready_for_owner_review',
  'partially_reconciled',
  'missing',
  'scheduled_not_due',
  'awaiting_actual_publication',
  'implementation_present_reception_unverified',
  'local_candidate_not_published',
  'incomplete_first_party_reconciliation',
  'missing_authorized_ledger',
]);
if (!requirements.some((item) => incompleteStatuses.has(item.status))) {
  failures.push('missing-incomplete-state');
}
if ((audit.blocking_gates || []).length < 6) failures.push('blocking-gates');

const prohibitedPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /"(?:password|cookie|authorization|api[_ -]?key|secret)"\s*:/i,
];
for (const pattern of prohibitedPatterns) {
  if (pattern.test(raw)) failures.push(`prohibited-content:${pattern.source}`);
}

console.log(JSON.stringify({
  ok: failures.length === 0,
  auditPath,
  overallStatus: audit.overall_status,
  requirements: requirements.length,
  incomplete: requirements.filter((item) => incompleteStatuses.has(item.status)).map((item) => item.id),
  failures,
}, null, 2));
if (failures.length) process.exitCode = 2;
