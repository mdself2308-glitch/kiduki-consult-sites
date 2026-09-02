#!/usr/bin/env node

import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const planPath = path.join(projectRoot, 'content/future-article-review-plan.json');
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const failures = [];

const expected = new Map([
  [
    'existing-industrial-physician-specialist-support',
    {
      exactVersion: '2026-09-01-v1',
      exactSha256: 'c524ae175125c8be963b2ed3fc1cdc2b8ffb6e8e1213db0f1bcae4e023234fc4',
      primaryLandingPath: '/service/komon/',
      secondaryLandingPath: '/service/return-to-work-support/',
    },
  ],
  [
    'occupational-health-case-management',
    {
      exactVersion: '2026-09-01-v1',
      exactSha256: 'ef7b280d49fa75e34013a0f540d6b4ceb00b680c4ca0ac0200abf5f6d57c1b7a',
      primaryLandingPath: '/service/cloud/',
      secondaryLandingPath: '/service/sangyoui/',
    },
  ],
]);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function check(name, condition, detail = null) {
  if (!condition) failures.push({ name, detail });
}

check('schema-version', plan.schema_version === 1, plan.schema_version);
check('state', plan.state === 'awaiting_actual_publication', plan.state);
check('timezone', plan.timezone === 'Asia/Tokyo', plan.timezone);
check(
  'schedule-anchor',
  plan.schedule_anchor === 'wordpress_published_at_readback',
  plan.schedule_anchor,
);
check(
  'review-offsets',
  JSON.stringify(plan.review_offsets_days) === JSON.stringify([7, 28, 90]),
  plan.review_offsets_days,
);
check('review-scheduler', plan.review_scheduler === 'codex_automation', plan.review_scheduler);
check(
  'milestone-automation',
  plan.milestone_automation_id === 'kiduki-seo-milestone-review',
  plan.milestone_automation_id,
);
check('no-google-calendar-dependency', plan.google_calendar_dependency === false);
check('no-calendar-events-yet', plan.calendar_events_created === false);
check('article-count', plan.articles?.length === expected.size, plan.articles?.length);
check(
  'slugs-unique',
  new Set((plan.articles || []).map((article) => article.slug)).size ===
    (plan.articles || []).length,
);
check(
  'funnel-to-contract',
  plan.funnel_stages?.[0] === 'search_impression' &&
    plan.funnel_stages?.at(-1) === 'contract',
  plan.funnel_stages,
);

for (const article of plan.articles || []) {
  const wanted = expected.get(article.slug);
  check(`${article.slug}:expected`, Boolean(wanted));
  if (!wanted) continue;

  const exactPath = path.join(projectRoot, article.exact_payload);
  const exactRaw = await readFile(exactPath, 'utf8');
  const exact = JSON.parse(exactRaw);
  const configPath = path.join(projectRoot, article.create_config);
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const ticket = await readFile(path.join(projectRoot, article.ticket), 'utf8');
  const sourceRaw = await readFile(path.join(projectRoot, config.source), 'utf8');

  check(`${article.slug}:exact-version`, article.exact_version === wanted.exactVersion);
  check(`${article.slug}:exact-sha-plan`, article.exact_payload_sha256 === wanted.exactSha256);
  check(`${article.slug}:exact-sha-file`, sha256(exactRaw) === wanted.exactSha256);
  check(`${article.slug}:exact-state`, exact.state === 'owner-review', exact.state);
  check(`${article.slug}:not-created`, exact.target?.wordpress_post_id === null);
  check(`${article.slug}:publication-status`, exact.target?.publication_status === 'not_created');
  check(`${article.slug}:config-slug`, config.slug === article.slug, config.slug);
  check(`${article.slug}:config-draft`, config.status === 'draft', config.status);
  check(
    `${article.slug}:config-exact-binding`,
      config.exactApproval?.exactVersion === article.exact_version &&
      config.exactApproval?.exactPayloadSha256 === article.exact_payload_sha256 &&
      config.exactApproval?.exactPayload === article.exact_payload &&
      config.exactApproval?.approvalTicket === article.ticket,
    config.exactApproval,
  );
  check(
    `${article.slug}:source-sha`,
    sha256(sourceRaw) === config.exactApproval?.candidateSourceSha256,
    sha256(sourceRaw),
  );
  check(`${article.slug}:ticket-binding`, ticket.includes(article.exact_payload_sha256));
  check(`${article.slug}:state`, article.state === 'owner_review_post_not_created');
  check(`${article.slug}:post-id-null`, article.post_id === null);
  check(`${article.slug}:url-null`, article.publication_url === null);
  check(`${article.slug}:published-at-null`, article.published_at === null);
  check(`${article.slug}:event-ids-empty`, article.calendar_event_ids?.length === 0);
  check(`${article.slug}:weekly-queue`, article.weekly_queue === true);
  check(
    `${article.slug}:monthly-after-publish`,
    article.monthly_funnel_review_after_publication === true,
  );
  check(
    `${article.slug}:primary-landing`,
    article.primary_landing_path === wanted.primaryLandingPath,
    article.primary_landing_path,
  );
  check(
    `${article.slug}:secondary-landing`,
    article.secondary_landing_path === wanted.secondaryLandingPath,
    article.secondary_landing_path,
  );
  check(`${article.slug}:queries`, article.query_hypotheses?.length >= 2);
  check(`${article.slug}:7d`, article.measurement?.['7d']?.includes('url_inspection'));
  check(`${article.slug}:28d`, article.measurement?.['28d']?.includes('ctr'));
  check(`${article.slug}:90d`, article.measurement?.['90d']?.includes('contract'));
}

const output = {
  ok: failures.length === 0,
  planPath,
  articles: plan.articles?.length || 0,
  state: plan.state,
  reviewScheduler: plan.review_scheduler,
  googleCalendarDependency: plan.google_calendar_dependency,
  calendarEventsCreated: plan.calendar_events_created,
  failures,
};

console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exitCode = 2;
