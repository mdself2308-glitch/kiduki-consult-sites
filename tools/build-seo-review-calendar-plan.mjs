#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const milestones = [
  {
    key: '7d',
    days: 7,
    start: '08:00:00',
    end: '08:20:00',
    label: '7日',
    review:
      '公開状態、canonical、インデックス、初期クエリ、表示ページ、誤った検索意図を確認する。',
  },
  {
    key: '28d',
    days: 28,
    start: '08:20:00',
    end: '08:50:00',
    label: '28日',
    review:
      '同条件のSearch Consoleクエリ・ページ・表示・クリック・CTR・平均順位と、GA4の記事からサービスへの遷移、問い合わせを確認する。',
  },
  {
    key: '90d',
    days: 90,
    start: '08:50:00',
    end: '09:20:00',
    label: '90日',
    review:
      '検索寄与、サービス遷移、問い合わせ、商談、契約を分離し、維持・改稿・統合・アーカイブ案を判断する。',
  },
];

function addDaysInJst(localDateTime, days) {
  const date = new Date(`${localDateTime}+09:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function buildReviewEvents(plan) {
  return plan.articles.flatMap((article) =>
    milestones.map((milestone) => {
      const date = addDaysInJst(article.publish_at, milestone.days);
      const canonicalUrl = `https://kdkconslt-sngyouijm.com/${article.slug}/`;
      return {
        record_key: `${article.slug}:${milestone.key}`,
        slug: article.slug,
        post_id: article.wordpress_post_id,
        milestone: milestone.key,
        publish_at_jst: `${article.publish_at}+09:00`,
        title: `[KIDUKI SEO] ${milestone.label}レビュー｜${article.title}`,
        start_time: `${date}T${milestone.start}+09:00`,
        end_time: `${date}T${milestone.end}+09:00`,
        description: [
          `記事: ${article.title}`,
          `slug: ${article.slug}`,
          `WordPress post: ${article.wordpress_post_id}`,
          `公開URL: ${canonicalUrl}`,
          `公開日時: ${article.publish_at}+09:00`,
          '',
          milestone.review,
          'npm run audit:article-schedule と npm run audit:analytics-access を実行し、取得できない数値は未確認と記録する。',
          '医療・安全・法令・料金・商品文言の改稿は1成果物1チケット、Tier Sレビュー、宮部大輔のexact version承認後にのみ公開する。',
          '',
          '運用正本: content/seo-review-schedule.md',
          '計測仕様: content/seo-measurement-spec.md',
        ].join('\n'),
      };
    }),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const planArgIndex = process.argv.indexOf('--plan');
  const planPath = path.resolve(
    planArgIndex >= 0 && process.argv[planArgIndex + 1]
      ? process.argv[planArgIndex + 1]
      : 'content/article-plan.json',
  );
  const plan = JSON.parse(await readFile(planPath, 'utf8'));

  console.log(
    JSON.stringify(
      {
        writes: false,
        timezone: 'Asia/Tokyo',
        planPath,
        events: buildReviewEvents(plan),
      },
      null,
      2,
    ),
  );
}
