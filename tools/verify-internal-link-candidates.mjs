#!/usr/bin/env node
/**
 * 内部リンク補強の候補本文（content/exact/internal-link-pages-2026-09-02-v1.json）が、
 * 承認対象のハッシュと一致し、追記のみの候補はベースライン本文を一字も変えていない
 * ことを確認する。WordPress へは接続しない。
 */
import crypto from 'node:crypto';
import fs from 'node:fs';

const exactPath = 'content/exact/internal-link-pages-2026-09-02-v1.json';
const exact = JSON.parse(fs.readFileSync(exactPath, 'utf8'));
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const failures = [];
const rows = [];

for (const item of exact.items) {
  const baseline = fs.readFileSync(item.baseline_source, 'utf8');
  const candidate = fs.readFileSync(item.candidate_source, 'utf8');
  const row = {
    id: item.id,
    slug: item.slug,
    baselineSha256Matches: sha256(baseline) === item.baseline_sha256,
    candidateSha256Matches: sha256(candidate) === item.candidate_sha256,
    appendOnly: null,
    addedLinks: (candidate.match(/<a href="https:\/\/kdkconslt-sngyouijm\.com\//g) || []).length
      - (baseline.match(/<a href="https:\/\/kdkconslt-sngyouijm\.com\//g) || []).length,
    linksToScheduledArticles: false,
    containsH1: /<h1\b/i.test(candidate),
    containsScriptOutsideJsonLd: /<script(?![^>]*application\/ld\+json)/i.test(candidate),
  };
  if (item.append_only) {
    const closing = '</div>\n<!-- /wp:group -->';
    const baselineBody = baseline.trimEnd().slice(0, baseline.trimEnd().lastIndexOf(closing)).trimEnd();
    row.appendOnly = candidate.startsWith(baselineBody) && candidate.trimEnd().endsWith(closing);
  }
  const scheduledSlugs = [
    'drowsy-driving-workplace-safety', 'sas-screening-at-work', 'long-hours-interview-sleep',
    'kenko-keiei-sleep-measures', 'return-to-work-sleep-assessment', 'committee-minutes-three-year-retention',
    'industrial-physician-scheduling', 'after-the-physician-opinion', 'work-restriction-release-management',
    'sleep-findings-to-work-accommodation', 'when-sleep-becomes-a-return-to-work-decision',
    'return-to-work-one-off-vs-pack', 'existing-industrial-physician-specialist-support', 'occupational-health-case-management',
  ];
  row.linksToScheduledArticles = scheduledSlugs.some((slug) => candidate.includes(`/${slug}/`));
  for (const [key, ok] of Object.entries(row)) {
    if (key === 'id' || key === 'slug' || key === 'addedLinks') continue;
    const expected = key === 'appendOnly' ? (item.append_only ? true : null) : (key.startsWith('contains') || key === 'linksToScheduledArticles' ? false : true);
    if (ok !== expected) failures.push(`${item.id}:${key}`);
  }
  rows.push(row);
}

const result = { ok: failures.length === 0, exactPath, exactSha256: sha256(fs.readFileSync(exactPath)), state: exact.state, rows, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
