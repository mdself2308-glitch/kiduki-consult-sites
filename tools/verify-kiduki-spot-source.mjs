import fs from 'node:fs';

const home = fs.readFileSync('consult/index.html', 'utf8');
const legacySpot = fs.readFileSync('consult/return-to-work-spot/index.html', 'utf8');
const sitemap = fs.readFileSync('consult/sitemap.xml', 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, ok: Boolean(condition) });

check('home-keeps-contact-for-tailored-support', (home.match(/https:\/\/kdkconslt-sngyouijm\.com\/contact\//g) || []).length >= 5);
check('home-does-not-link-retired-spot-route', !/href="(?:https:\/\/kdkconslt-sngyouijm\.com\/spot\/|\/return-to-work-spot\/)"/.test(home));
check('sitemap-preserves-legacy-spot-url', sitemap.includes('https://consult.kdkconslt-sngyouijm.com/return-to-work-spot/'));
check('home-does-not-duplicate-catalog-prices', !/(?:\d{1,3}(?:,\d{3})+|\d+)\s*円/.test(home));
check('home-offers-return-to-work-assessment-by-the-case', home.includes('復職判定面談を1件から'));
check('home-links-self-service-menu', home.includes('href="/spot/"'));
check('home-foregrounds-existing-doctor-complement', home.includes('すでに産業医がいる事業場でも'));
check('legacy-spot-identifies-kiduki-contract-window', legacySpot.includes('契約・請求・支援の窓口はKIDUKIです'));
check('legacy-spot-foregrounds-existing-doctor-gap', legacySpot.includes('既存産業医が対応できない') && legacySpot.includes('産業医を替える契約ではありません'));
check('legacy-spot-routes-online-booking-to-current-menu', legacySpot.includes('href="/spot/"'));
check('legacy-spot-routes-tailored-support-to-contact', legacySpot.includes('href="https://kdkconslt-sngyouijm.com/contact/"'));
check('legacy-spot-states-no-monthly-contract-needed', legacySpot.includes('月額契約やCasetraの別途契約は必要ありません'));
check('legacy-spot-preserves-canonical-url', legacySpot.includes('<link rel="canonical" href="https://consult.kdkconslt-sngyouijm.com/return-to-work-spot/">'));
check('legacy-spot-has-no-retired-intake-or-workspace-promises', !/<form\b|KIDUKI_RTW_SPOT|\/api\/leads|事前打合せ|30日間|契約後/.test(legacySpot));
// 構造化データは二本柱と一致させる。価格は載せない（トップで金額を出さない方針と揃える）。
check('structured-data-matches-two-pillars',
  home.includes('"name":"睡眠に特化した産業医業務"')
  && home.includes('"name":"Casetraを活用した産業衛生DX支援"'));
check('structured-data-carries-no-price', !home.includes('"price"'));
check('structured-data-includes-return-to-work-service',
  home.includes('"name":"復職判定面談（睡眠評価を含む）"'));

const failures = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failures.length === 0, checks, failures }, null, 2));
if (failures.length > 0) process.exit(1);
