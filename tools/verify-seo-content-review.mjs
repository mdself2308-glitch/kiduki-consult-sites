import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const configPath = resolve(root, 'kiduki/config/seo-content-review-2026-08-17.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const items = [...config.revisions, ...config.newDraftPosts];
const failures = [];
const checks = [];

function record(condition, message) {
  checks.push(message);
  if (!condition) failures.push(message);
}

record(config.approvalRequired === true, 'approvalRequired must be true');
record(config.publishable === false, 'review pack must not be publishable');
record(
  config.productBoundary?.standaloneHealthCheckJudgment === 'not-offered',
  'standalone health-check judgment must remain not offered',
);
record(config.newDraftPosts.length === 7, 'exactly seven focused draft posts are expected');
record(
  config.productBoundary?.casetraPositioning ===
    'external-saas-plus-kiduki-professional-services',
  'Casetra must be positioned as external SaaS plus KIDUKI professional services',
);
record(
  config.productBoundary?.casetraPackMode ===
    'pack-target-case-company-portal-not-arr-case-scope-implemented',
  'Pack must use one assigned company case without counting it as SaaS ARR',
);
record(
  config.productBoundary?.casetraCasePass === 'rejected-no-new-sku',
  'a separate Case Pass SKU must not be introduced',
);

for (const item of items) {
  const sourcePath = resolve(root, item.source);
  const html = await readFile(sourcePath, 'utf8');
  const openBlocks = (html.match(/<!-- wp:/g) || []).length;
  const closeBlocks = (html.match(/<!-- \/wp:/g) || []).length;

  record(openBlocks === closeBlocks, `${item.source}: WordPress block comments balance`);
  record(!/<h1\b/i.test(html), `${item.source}: content must not contain h1`);
  record(
    !/2026年[◯○]|【名称】|◯◯保健所|TODO|FIXME/.test(html),
    `${item.source}: no unapproved placeholder remains`,
  );
  record(
    /kdk-service-page/.test(html),
    `${item.source}: existing KIDUKI page layout class is used`,
  );
}

for (const item of config.newDraftPosts) {
  const html = await readFile(resolve(root, item.source), 'utf8');
  const h2Count = (html.match(/<h2\b/g) || []).length;
  record(/執筆・監修：/.test(html), `${item.source}: real author credit is present`);
  record(/宮部 大輔/.test(html), `${item.source}: author is Miyabe Daisuke`);
  record(/参考となる公的情報/.test(html), `${item.source}: primary references section is present`);
  record(
    /\/contact\/|\/return-to-work-(?:pack|spot)\//.test(html),
    `${item.source}: inquiry CTA is present`,
  );
  record(h2Count >= 6, `${item.source}: at least six decision-useful sections are present`);
  record(
    !/睡眠専門医|院長|必ず治る|必ず復職|復職を保証/.test(html),
    `${item.source}: prohibited or overpromising wording is absent`,
  );
  record(!/健診判定|健康診断結果の判定/.test(html), `${item.source}: no health-check judgment acquisition topic`);
}

for (const item of config.newDraftPosts.filter(
  ({ slug }) => slug !== 'return-to-work-interview-process-roles',
)) {
  const html = await readFile(resolve(root, item.source), 'utf8');
  record(
    /consult\.kdkconslt-sngyouijm\.com\/return-to-work-pack\//.test(html),
    `${item.source}: full-case Pack route is present`,
  );
  record(
    /consult\.kdkconslt-sngyouijm\.com\/return-to-work-spot\//.test(html),
    `${item.source}: fixed-scope spot route is present`,
  );
}

const spotReview = await readFile(
  resolve(root, 'source/wordpress/review-page-164-return-to-work-support.html'),
  'utf8',
);
record(
  /健康診断結果の判定だけを行う単発受託/.test(spotReview),
  'return-to-work review page states the standalone health-check boundary',
);
record(
  /KIDUKI Retain/.test(spotReview),
  'return-to-work review page routes continuing occupational-physician duties to Retain',
);
record(
  /Pack対象の復職Case/.test(spotReview) && /月額利用件数には重ねて計上しません/.test(spotReview),
  'return-to-work review page defines Pack Casetra use as target-case and non-monthly',
);
record(
  /企業担当者が行うこと/.test(spotReview) && /意見書を受領確認/.test(spotReview),
  'return-to-work review page states the company operator workflow',
);
record(
  /最終決定/.test(spotReview) && /職場で実施/.test(spotReview),
  'return-to-work review page preserves the employer decision boundary',
);
record(/復職Case 1件だけを表示/.test(spotReview), 'return-to-work review page states one-case Pack authorization');

const oneStopDraft = await readFile(
  resolve(root, 'source/wordpress/draft-post-return-to-work-one-stop.html'),
  'utf8',
);
record(/復職Case 1件と操作期限/.test(oneStopDraft), 'one-stop draft states implemented case-limited Pack access');

const staticHome = await readFile(resolve(root, 'consult/index.html'), 'utf8');
record(
  /会社は起票内容、事前資料、主治医照会の要否・目的、意見書受領、会社決裁、再評価を入力/.test(
    staticHome,
  ),
  'static home states the actual company operator sequence',
);
record(
  /就業区分、残業・時短・業務等の措置、実施期間、見直し時期/.test(staticHome),
  'static home describes the actual company-decision fields',
);
record(/担当者にはその1件だけが表示/.test(staticHome), 'static home states implemented one-case authorization');
record(
  /Packの契約だけでCasetra月額契約になることはありません/.test(staticHome),
  'static home separates Pack fulfillment from Casetra monthly SaaS',
);

const greetingReview = await readFile(
  resolve(root, 'source/wordpress/review-page-43-greeting.html'),
  'utf8',
);
record(/宮部 大輔/.test(greetingReview), 'greeting review uses the real representative name');
record(
  !/クリニック.*院長|開設|保健所|厚生局/.test(greetingReview),
  'greeting review excludes unapproved clinic-opening claims',
);

const packWorkflow = await readFile(
  resolve(root, 'kiduki/docs/strategy/return-to-work-pack-casetra-workflow-2026-08-17.md'),
  'utf8',
);
record(
  /外部Casetra ARR・契約社数にも含めない/.test(packWorkflow) &&
    /PACK_INCLUDED/.test(packWorkflow),
  'Pack workflow separates Pack use from ARR with an explicit billing classification',
);
record(
  /KIDUKIが会社決裁を代行しない/.test(packWorkflow),
  'Pack workflow preserves the employer-only decision action',
);
record(
  /依頼企業、担当者、対象社員、復職CaseをCasetraへ登録/.test(packWorkflow) &&
    /Decision Pack/.test(packWorkflow),
  'Pack workflow covers registration through Decision Pack',
);
record(
  /割り当てた1 Caseだけ/.test(packWorkflow) && /READ_ONLY/.test(packWorkflow),
  'Pack workflow records the implemented one-case and read-only boundary',
);
record(
  /TK-MI-01/.test(packWorkflow) && /送付・回答/.test(packWorkflow),
  'Pack workflow records the physician-inquiry evidence flow',
);

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures, checks: checks.length }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, items: items.length, checks: checks.length }, null, 2));
