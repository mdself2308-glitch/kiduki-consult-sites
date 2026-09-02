#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReviewEvents } from './build-seo-review-calendar-plan.mjs';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const plan = JSON.parse(
  await readFile(path.join(projectRoot, 'content/article-plan.json'), 'utf8'),
);
const manifest = JSON.parse(
  await readFile(
    path.join(projectRoot, 'content/seo-article-review-calendar.json'),
    'utf8',
  ),
);
const expected = buildReviewEvents(plan);
const expectedByKey = new Map(
  expected.map((event) => [event.record_key, event]),
);
const actualByKey = new Map(
  manifest.events.map((event) => [event.record_key, event]),
);
const eventIds = manifest.events.map((event) => event.calendar_event_id);
const failures = [];

function check(name, condition, detail = null) {
  if (!condition) failures.push({ name, detail });
}

check('article-count', plan.articles.length === 12, plan.articles.length);
check('expected-event-count', expected.length === 36, expected.length);
check(
  'manifest-event-count',
  manifest.events.length === expected.length,
  manifest.events.length,
);
check(
  'record-keys-unique',
  actualByKey.size === manifest.events.length,
  actualByKey.size,
);
check(
  'calendar-event-ids-present',
  eventIds.every(Boolean),
);
check(
  'calendar-event-ids-unique',
  new Set(eventIds).size === eventIds.length,
  new Set(eventIds).size,
);

for (const [recordKey, expectedEvent] of expectedByKey) {
  const actual = actualByKey.get(recordKey);
  check(`${recordKey}:exists`, Boolean(actual));
  if (!actual) continue;
  for (const field of ['slug', 'post_id', 'milestone', 'start_time', 'end_time', 'title']) {
    check(
      `${recordKey}:${field}`,
      actual[field] === expectedEvent[field],
      { expected: expectedEvent[field], actual: actual[field] },
    );
  }

  const ticketPath = path.join(
    projectRoot,
    `content/tasks/CT-20260901-${expectedEvent.slug}.md`,
  );
  const ticket = await readFile(ticketPath, 'utf8');
  check(
    `${recordKey}:ticket-event-id`,
    ticket.includes(actual.calendar_event_id),
    ticketPath,
  );
}

const output = {
  ok: failures.length === 0,
  articles: plan.articles.length,
  events: manifest.events.length,
  checks: 6 + expected.length * 7,
  failures,
};

console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exitCode = 2;
