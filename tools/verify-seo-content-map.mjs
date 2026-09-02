import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const plan = JSON.parse(
  fs.readFileSync(path.resolve(root, 'content/article-plan.json'), 'utf8'),
);
const comparison = JSON.parse(
  fs.readFileSync(
    path.resolve(
      root,
      'content/exact/return-to-work-one-off-vs-pack-2026-09-01-v3.json',
    ),
    'utf8',
  ),
);
const spot = JSON.parse(
  fs.readFileSync(
    path.resolve(
      root,
      'content/exact/spot-industrial-physician-ctr-2026-09-01-v2.json',
    ),
    'utf8',
  ),
);
const stresscheck = JSON.parse(
  fs.readFileSync(
    path.resolve(
      root,
      'content/exact/stresscheck-small-workplace-2028-2026-09-01-v3.json',
    ),
    'utf8',
  ),
);
const existingPhysicianSupport = JSON.parse(
  fs.readFileSync(
    path.resolve(
      root,
      'content/exact/existing-industrial-physician-specialist-support-2026-09-01-v1.json',
    ),
    'utf8',
  ),
);
const caseManagement = JSON.parse(
  fs.readFileSync(
    path.resolve(
      root,
      'content/exact/occupational-health-case-management-2026-09-01-v1.json',
    ),
    'utf8',
  ),
);
const comparisonBody = fs.readFileSync(
  path.resolve(root, comparison.copy.body_path),
  'utf8',
);
const serviceCandidate = fs.readFileSync(
  path.resolve(
    root,
    'content/exact/spot-industrial-physician-ctr-2026-09-01-v2-body.html',
  ),
  'utf8',
);
const stresscheckBody = fs.readFileSync(
  path.resolve(root, stresscheck.copy.body_path),
  'utf8',
);
const existingPhysicianSupportBody = fs.readFileSync(
  path.resolve(root, existingPhysicianSupport.copy.body_path),
  'utf8',
);
const caseManagementBody = fs.readFileSync(
  path.resolve(root, caseManagement.copy.body_path),
  'utf8',
);
const funnelStrategy = fs.readFileSync(
  path.resolve(root, 'content/seo-contract-funnel.md'),
  'utf8',
);
const spotStrategy = fs.readFileSync(
  path.resolve(root, 'content/spot-industrial-physician-ctr.md'),
  'utf8',
);
const contentGuide = fs.readFileSync(
  path.resolve(root, 'content/README.md'),
  'utf8',
);

const failures = [];
const articles = plan.articles || [];
const uniqueCount = (values) => new Set(values).size;
if (articles.length !== 12) failures.push(`article-count:${articles.length}`);
if (uniqueCount(articles.map((item) => item.slug)) !== articles.length) {
  failures.push('duplicate-article-slug');
}
if (uniqueCount(articles.map((item) => item.title)) !== articles.length) {
  failures.push('duplicate-article-title');
}
if (
  uniqueCount(articles.map((item) => item.search_intent)) !== articles.length
) {
  failures.push('duplicate-article-search-intent');
}
if (
  articles.some(
    (item) =>
      item.cta_version !== '2026-09-01-v6' ||
      item.cta_status !== 'owner-review',
  )
) {
  failures.push('article-cta-version-or-state');
}

const comparisonSlug = comparison.target.slug;
if (articles.some((item) => item.slug === comparisonSlug)) {
  failures.push('comparison-slug-collides-with-article-plan');
}
if (articles.some((item) => item.title === comparison.copy.title)) {
  failures.push('comparison-title-collides-with-article-plan');
}
if (comparison.copy.title === spot.changes.title) {
  failures.push('comparison-title-collides-with-service-title');
}
if (
  comparison.search_intent.primary_landing !==
  '/service/return-to-work-support/'
) {
  failures.push('comparison-primary-landing');
}
if (
  !comparisonBody.includes('/return-to-work-interview-process-roles/') ||
  !comparisonBody.includes('href="/service/return-to-work-support/"')
) {
  failures.push('comparison-context-links');
}
if (
  comparisonBody.includes(
    'href="/return-to-work-interview-process-roles/" data-kdk-article-cta=',
  )
) {
  failures.push('process-link-must-not-be-commercial-cta');
}
if (!serviceCandidate.includes('href="https://kdkconslt-sngyouijm.com/contact/"')) {
  failures.push('service-candidate-contact-link');
}
if (
  !spotStrategy.includes('初回商品: 範囲固定の復職・両立支援単発') ||
  !spotStrategy.includes('P-01/P-02 PASSまで公開導線に数えない') ||
  spotStrategy.includes('初回商品: 復職・両立支援単発または復職支援Pack')
) {
  failures.push('spot-current-product-gate');
}
if (
  !funnelStrategy.includes(
    'PackはP-01/P-02が両方PASSになるまで、公開CTA、比較記事、静的トップ分岐、初回商品、拡張KPIに数えない。',
  ) ||
  funnelStrategy.includes(
    '月額契約のない企業の復職案件は、範囲に応じて復職・両立支援単発または復職支援Packへつなぐ。',
  ) ||
  funnelStrategy.includes('単発60,000円/75,000円またはPack 150,000円')
) {
  failures.push('funnel-current-pack-gate');
}
if (
  !contentGuide.includes(
    '現在の1案件は復職・両立支援単発、継続支援はKIDUKI Basic／Retain、自社運用はCASETRAを選ぶ',
  ) ||
  !contentGuide.includes(
    '復職支援PackはP-01/P-02が両方PASSになるまで、公開CTA、比較記事、静的トップ分岐、初回商品、拡張KPIに数えない',
  ) ||
  contentGuide.includes('1案件は復職・両立支援単発または復職支援Pack') ||
  /Pack\/単発への主導線|Casetra\/Packへの主導線|Pack\/単発\/Casetraへの主導線/.test(
    contentGuide,
  )
) {
  failures.push('content-guide-current-pack-gate');
}

if (articles.some((item) => item.slug === stresscheck.target.slug)) {
  failures.push('stresscheck-slug-collides-with-article-plan');
}
if (articles.some((item) => item.title === stresscheck.copy.title)) {
  failures.push('stresscheck-title-collides-with-article-plan');
}
if (
  stresscheck.search_intent.primary_landing !== '/service/sangyoui/' ||
  stresscheck.copy.primary_cta.href !== '/service/sangyoui/' ||
  stresscheck.copy.primary_cta.target_offer !== 'kiduki-retain' ||
  !stresscheckBody.includes('data-kdk-article-slug="stresschecknew"') ||
  !stresscheckBody.includes('data-kdk-target-offer="kiduki-retain"') ||
  !stresscheckBody.includes('href="/service/sangyoui/"')
) {
  failures.push('stresscheck-primary-landing');
}
if (
  !stresscheckBody.includes('2028年4月1日から義務化されます') ||
  stresscheckBody.includes('2025年最新') ||
  stresscheckBody.includes('実績多数') ||
  /<(?:h1|style|script)\b/i.test(stresscheckBody)
) {
  failures.push('stresscheck-current-law-or-structure');
}
if (
  !funnelStrategy.includes(
    stresscheck.search_intent.primary_query_hypothesis,
  ) ||
  !funnelStrategy.includes(
    '継続体制が必要な企業だけをRetainへ送る',
  )
) {
  failures.push('stresscheck-funnel-strategy');
}

const additionalCandidates = [existingPhysicianSupport, caseManagement];
const allCandidateSlugs = [
  comparison.target.slug,
  stresscheck.target.slug,
  ...additionalCandidates.map((item) => item.target.slug),
];
if (uniqueCount(allCandidateSlugs) !== allCandidateSlugs.length) {
  failures.push('candidate-slug-collision');
}
for (const candidate of additionalCandidates) {
  if (articles.some((item) => item.slug === candidate.target.slug)) {
    failures.push(`candidate-slug-collides-with-article-plan:${candidate.target.slug}`);
  }
  if (articles.some((item) => item.title === candidate.copy.title)) {
    failures.push(`candidate-title-collides-with-article-plan:${candidate.target.slug}`);
  }
  if (
    candidate.state !== 'owner-review' ||
    candidate.target.wordpress_post_id !== null ||
    candidate.target.publication_status !== 'not_created'
  ) {
    failures.push(`candidate-state-or-publication:${candidate.target.slug}`);
  }
  if (
    !funnelStrategy.includes(candidate.search_intent.primary_query_hypothesis) ||
    !funnelStrategy.includes(candidate.copy.body_path.replace(/^content\//, ''))
  ) {
    failures.push(`candidate-funnel-strategy:${candidate.target.slug}`);
  }
}

if (
  existingPhysicianSupport.search_intent.primary_landing !== '/service/komon/' ||
  existingPhysicianSupport.search_intent.secondary_landing !==
    '/service/return-to-work-support/' ||
  !existingPhysicianSupportBody.includes('data-kdk-target-offer="kiduki-basic"') ||
  !existingPhysicianSupportBody.includes('data-kdk-target-offer="return-to-work"') ||
  /復職支援Pack|150,000円/.test(existingPhysicianSupportBody)
) {
  failures.push('existing-physician-support-product-gate');
}

if (
  caseManagement.search_intent.primary_landing !== '/service/cloud/' ||
  caseManagement.search_intent.secondary_landing !== '/service/sangyoui/' ||
  !caseManagementBody.includes('data-kdk-target-offer="casetra"') ||
  !caseManagementBody.includes('data-kdk-target-offer="kiduki-retain"') ||
  !caseManagementBody.includes('/industrial-physician-scheduling/') ||
  !caseManagementBody.includes('/after-the-physician-opinion/') ||
  !caseManagementBody.includes('/work-restriction-release-management/')
) {
  failures.push('case-management-intent-or-links');
}

const expectedReturnLanding = new Map([
  ['return-to-work-sleep-assessment', 'primary_landing'],
  ['when-sleep-becomes-a-return-to-work-decision', 'primary_landing'],
  ['work-restriction-release-management', 'primary_landing'],
  ['after-the-physician-opinion', 'secondary_landing'],
]);
const returnCluster = [];
for (const [slug, field] of expectedReturnLanding) {
  const item = articles.find((candidate) => candidate.slug === slug);
  if (!item) {
    failures.push(`missing-return-cluster-article:${slug}`);
    continue;
  }
  const ok = item[field] === '/service/return-to-work-support/';
  if (!ok) failures.push(`return-cluster-landing:${slug}:${field}`);
  returnCluster.push({ slug, field, landing: item[field], ok });
}

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      articleCount: articles.length,
      ctaVersion: '2026-09-01-v6',
      service: {
        postId: spot.target.wordpress_post_id,
        path: spot.target.path,
        title: spot.changes.title,
      },
      comparison: {
        slug: comparisonSlug,
        title: comparison.copy.title,
        state: comparison.state,
        primaryQuery: comparison.search_intent.primary_query_hypothesis,
        primaryLanding: comparison.search_intent.primary_landing,
        linksToProcessArticle: true,
      },
      stresscheck: {
        postId: stresscheck.target.wordpress_post_id,
        slug: stresscheck.target.slug,
        title: stresscheck.copy.title,
        state: stresscheck.state,
        primaryQuery: stresscheck.search_intent.primary_query_hypothesis,
        primaryLanding: stresscheck.search_intent.primary_landing,
      },
      existingPhysicianSupport: {
        slug: existingPhysicianSupport.target.slug,
        title: existingPhysicianSupport.copy.title,
        state: existingPhysicianSupport.state,
        primaryQuery:
          existingPhysicianSupport.search_intent.primary_query_hypothesis,
        primaryLanding: existingPhysicianSupport.search_intent.primary_landing,
        secondaryLanding:
          existingPhysicianSupport.search_intent.secondary_landing,
      },
      caseManagement: {
        slug: caseManagement.target.slug,
        title: caseManagement.copy.title,
        state: caseManagement.state,
        primaryQuery: caseManagement.search_intent.primary_query_hypothesis,
        primaryLanding: caseManagement.search_intent.primary_landing,
        secondaryLanding: caseManagement.search_intent.secondary_landing,
      },
      returnCluster,
      failures,
    },
    null,
    2,
  ),
);

if (failures.length) process.exit(1);
