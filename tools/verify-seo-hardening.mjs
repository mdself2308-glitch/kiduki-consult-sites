#!/usr/bin/env node
/**
 * 検索対策の土台（2026-09-02）がローカルソースに揃っているかを確認する。
 *
 * 見るもの:
 * - 子テーマ functions.php: タイトル区切り、description 後始末、事務所/サイトの
 *   構造化データ、noindex 補助（承認前は空リスト）
 * - 静的トップ consult/index.html: JSON-LD が全て正しい JSON で、
 *   ProfessionalService と WebSite があり、住所が事務所概要と一致する
 * - 公開サイト検証が新旧どちらのタイトル区切りも受け付ける
 *
 * 本番反映の証拠ではない。ローカルの整合だけを見る。
 */
import fs from 'node:fs';

const functionsPhp = fs.readFileSync(
  'kiduki/wp-content/themes/kiduki-child/functions.php',
  'utf8',
);
const staticHome = fs.readFileSync('consult/index.html', 'utf8');
const publicVerifier = fs.readFileSync('tools/verify-public-site.mjs', 'utf8');

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok: Boolean(ok), ...(detail ? { detail } : {}) });
}

check('title-separator-filter', functionsPhp.includes("add_filter( 'document_title_separator', 'kiduki_seo_document_title_separator'"));
check('title-normalizer-filter', functionsPhp.includes("add_filter( 'document_title', 'kiduki_seo_document_title'"));
check('emanon-description-filter', functionsPhp.includes("add_filter( 'emanon_custom_description', 'kiduki_seo_meta_description'"));
check('description-prefers-manual-value', functionsPhp.includes("get_post_meta( $post->ID, 'emanon_meta_description', true )"));
check('description-uses-post-excerpt', functionsPhp.includes('$post->post_excerpt'));
check('description-strips-byline', functionsPhp.includes('最終確認'));
check('organization-jsonld-hook', functionsPhp.includes("add_action( 'wp_head', 'kiduki_seo_organization_jsonld', 5 )"));
check('organization-jsonld-address', functionsPhp.includes("'postalCode'      => '105-0004'") && functionsPhp.includes("'streetAddress'   => '新橋1-18-21 第一日比谷ビル'"));
check('organization-jsonld-website', functionsPhp.includes("'@type'         => 'WebSite'"));
check('person-jsonld-on-greeting', functionsPhp.includes('is_page( 43 )'));
check('noindex-helper-present', functionsPhp.includes('function kiduki_seo_noindex_ids()'));

const noindexList = functionsPhp.match(/function kiduki_seo_noindex_ids\(\) \{([\s\S]*?)\n\}/);
const approvedNoindexPath = 'content/evidence/old-article-noindex-approval.json';
const noindexIds = noindexList
  ? [...noindexList[1].replace(/\/\/[^\n]*/g, '').matchAll(/\b(\d+)\b/g)].map((m) => Number(m[1]))
  : null;
const approvedNoindex = fs.existsSync(approvedNoindexPath)
  ? JSON.parse(fs.readFileSync(approvedNoindexPath, 'utf8'))
  : null;
check(
  'noindex-list-empty-until-approved',
  noindexIds !== null && (noindexIds.length === 0 || approvedNoindex !== null),
  noindexIds === null ? 'noindex list not found' : `${noindexIds.length} ids`,
);
check(
  'noindex-list-matches-approval-evidence',
  noindexIds !== null && (noindexIds.length === 0 || (
    approvedNoindex?.owner_decision === 'approved' &&
    JSON.stringify([...noindexIds].sort((a, b) => a - b)) === JSON.stringify([...(approvedNoindex?.noindex_post_ids || [])].sort((a, b) => a - b))
  )),
);
const mergedList = functionsPhp.match(/function kiduki_seo_merged_post_ids\(\) \{([\s\S]*?)\n\}/);
const mergedIds = mergedList ? [...mergedList[1].replace(/\/\/[^\n]*/g, '').matchAll(/\b(\d+)\b/g)].map((m) => Number(m[1])) : [];
check(
  'merged-redirect-ids-match-approval-evidence',
  mergedIds.length === 0 || JSON.stringify([...mergedIds].sort((a, b) => a - b)) === JSON.stringify([...(approvedNoindex?.merged_post_ids || [])].sort((a, b) => a - b)),
  `${mergedIds.length} ids`,
);
check('legacy-question-redirect-kept', functionsPhp.includes("kiduki_redirect_legacy_question"));
check('legacy-spot-redirect-kept', functionsPhp.includes("kiduki_redirect_legacy_service_spot"));
check('article-cta-tracking-kept', functionsPhp.includes("window.gtag('event', 'article_service_click'"));

const ldBlocks = [...staticHome.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
let parsed = [];
let allParse = true;
for (const block of ldBlocks) {
  try {
    parsed.push(JSON.parse(block));
  } catch (error) {
    allParse = false;
  }
}
check('static-home-jsonld-parses', allParse && ldBlocks.length >= 3, `${ldBlocks.length} blocks`);
const types = parsed.map((p) => p['@type']);
check('static-home-has-professional-service', types.includes('ProfessionalService'));
check('static-home-has-website', types.includes('WebSite'));
check('static-home-has-faqpage', types.includes('FAQPage'));
const org = parsed.find((p) => p['@type'] === 'ProfessionalService');
check('static-home-org-address-matches-office-info', org?.address?.postalCode === '105-0004' && org?.address?.streetAddress === '新橋1-18-21 第一日比谷ビル' && org?.address?.addressLocality === '港区');
check('static-home-org-name-is-registered-name', org?.name === 'KIDUKIコンサルティング産業医事務所');
const site = parsed.find((p) => p['@type'] === 'WebSite');
check('static-home-website-url-is-home', site?.url === 'https://consult.kdkconslt-sngyouijm.com/');
check('static-home-still-single-h1', (staticHome.match(/<h1\b/gi) || []).length === 1);

check('public-verifier-accepts-both-separators', (publicVerifier.match(/\(\?:  \\\|  \|｜\)/g) || []).length === 2);

const failures = checks.filter((c) => !c.ok);
console.log(JSON.stringify({ ok: failures.length === 0, checks, failures: failures.map((f) => f.name) }, null, 2));
if (failures.length) process.exit(1);
