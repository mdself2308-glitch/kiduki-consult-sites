#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const evidencePath = path.join(
  projectRoot,
  'content/evidence/measurement-live-audit-2026-09-01.json',
);
const raw = await readFile(evidencePath, 'utf8');
const evidence = JSON.parse(raw);
const failures = [];

const expectedDimensions = [
  'article_cta_role',
  'article_slug',
  'cta_role',
  'source_article',
  'source_page',
  'target_offer',
];
const actualDimensions = (
  evidence.ga4?.custom_dimensions_created_and_read_back || []
)
  .map((item) => item.parameter)
  .sort();
const expectedProperties = [
  'https://consult.kdkconslt-sngyouijm.com/',
  'https://kdkconslt-sngyouijm.com/',
].sort();
const actualProperties = [
  ...(evidence.search_console?.properties_visible || []),
].sort();

if (evidence.schema_version !== 1) failures.push('schema-version');
if (evidence.site_kit?.key_events_widget !== 0) {
  failures.push('site-kit-key-events-baseline');
}
if (evidence.ga4?.event_report?.generate_lead_events !== 5) {
  failures.push('ga4-generate-lead-events');
}
if (evidence.ga4?.event_report?.generate_lead_users !== 2) {
  failures.push('ga4-generate-lead-users');
}
if (evidence.ga4?.key_event_configuration?.generate_lead !== 'enabled_and_active_stream_detected') {
  failures.push('generate-lead-key-event-state');
}
if (JSON.stringify(actualDimensions) !== JSON.stringify(expectedDimensions)) {
  failures.push('custom-dimensions');
}
if (evidence.ga4?.explicitly_excluded_dimension !== 'lead_tracking_id') {
  failures.push('lead-tracking-id-exclusion');
}
if (JSON.stringify(actualProperties) !== JSON.stringify(expectedProperties)) {
  failures.push('search-console-properties');
}
if (evidence.search_console?.domain_property_visible !== false) {
  failures.push('domain-property-state');
}
if (evidence.search_console?.consult_property?.clicks !== 1) {
  failures.push('consult-clicks');
}
if (evidence.search_console?.consult_property?.impressions !== 16) {
  failures.push('consult-impressions');
}
if (evidence.flamingo?.total_inbound_items !== 5) {
  failures.push('flamingo-total-inbound-items');
}
if (evidence.flamingo?.items_within_ga4_report_period !== 0) {
  failures.push('flamingo-ga4-period-mismatch');
}
const contactTagAudit = evidence.anonymous_public_tag_audit?.wordpress_contact_page;
if (JSON.stringify(contactTagAudit?.google_tag_config_ids) !== JSON.stringify([
  'GT-5D9KJF2',
  '288922294',
])) {
  failures.push('wordpress-public-tag-config-ids');
}
if (contactTagAudit?.cf7_redirect_listens_for !== 'wpcf7mailsent') {
  failures.push('cf7-completion-listener');
}
if (contactTagAudit?.cf7_redirect_sends_event !== 'generate_lead') {
  failures.push('cf7-generate-lead-event');
}
if (evidence.anonymous_public_tag_audit?.consult_homepage?.inline_event_names?.includes('cta_click') !== true) {
  failures.push('consult-cta-click-event');
}
const staticLeadForms = evidence.static_consult_lead_forms?.forms || [];
if (staticLeadForms.length !== 2) failures.push('static-consult-lead-form-count');
if (!staticLeadForms.every((form) =>
  form.first_party_record_system === 'casetra_leads_cosmos' &&
  form.uses_flamingo === false &&
  form.generate_lead_after_successful_api_response === true &&
  form.live_ga4_payload_included_first_party_lead_id === true &&
  form.live_matches_local_repair === false &&
  /^[a-f0-9]{64}$/.test(form.live_sha256 || '') &&
  /^[a-f0-9]{64}$/.test(form.local_repaired_sha256 || '') &&
  form.live_sha256 !== form.local_repaired_sha256
)) {
  failures.push('static-consult-lead-form-boundary');
}
if (evidence.static_consult_lead_forms?.local_privacy_repair?.status !== 'verified_not_deployed') {
  failures.push('static-consult-local-repair-state');
}
if (evidence.static_consult_lead_forms?.local_privacy_repair?.first_party_lead_id_removed_from_ga4 !== true) {
  failures.push('static-consult-ga4-id-removal');
}
const firstPartyCountAccess = evidence.static_consult_lead_forms?.first_party_count_access;
if (firstPartyCountAccess?.result !== 'unavailable') failures.push('first-party-count-access-state');
if (firstPartyCountAccess?.read_surfaces?.application_insights?.result !== 'authorization_failed') {
  failures.push('application-insights-read-state');
}
if (firstPartyCountAccess?.read_surfaces?.application_insights?.required_action !== 'Microsoft.Insights/components/read') {
  failures.push('application-insights-required-action');
}
if (firstPartyCountAccess?.read_surfaces?.cosmos?.result !== 'authorization_failed') {
  failures.push('cosmos-read-state');
}
if (firstPartyCountAccess?.lead_records_read !== false) failures.push('lead-record-read-boundary');
if (firstPartyCountAccess?.rbac_changed !== false) failures.push('rbac-boundary');
if (firstPartyCountAccess?.count_only_contract !== 'content/templates/casetra-leads-aggregate.example.json') {
  failures.push('count-only-contract');
}

const prohibitedPatterns = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /"(?:password|cookie|authorization|api[_ -]?key|secret)"\s*:/i,
  /(?:patient|employee|company|person)[_ -]?(?:name|email|phone)/i,
];
for (const pattern of prohibitedPatterns) {
  if (pattern.test(raw)) failures.push(`prohibited-content:${pattern.source}`);
}

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      evidencePath,
      customDimensions: actualDimensions,
      searchConsoleProperties: actualProperties,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 2;
