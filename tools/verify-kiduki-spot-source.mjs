import fs from 'node:fs';

const home = fs.readFileSync('consult/index.html', 'utf8');
const form = fs.readFileSync('consult/return-to-work-spot/index.html', 'utf8');
const sitemap = fs.readFileSync('consult/sitemap.xml', 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, ok: Boolean(condition) });

check('home-routes-spot-inquiries-to-current-contact-form', (home.match(/https:\/\/kdkconslt-sngyouijm\.com\/contact\//g) || []).length >= 5);
check('home-does-not-link-retired-spot-route', !/href="(?:https:\/\/kdkconslt-sngyouijm\.com\/spot\/|\/return-to-work-spot\/)"/.test(home));
check('sitemap-includes-spot-form', sitemap.includes('https://consult.kdkconslt-sngyouijm.com/return-to-work-spot/'));
check('home-keeps-spot-pricing-fuzzy', !/(?:\d{1,3}(?:,\d{3})+|\d+)\s*円/.test(home));
check('home-offers-return-to-work-assessment-by-the-case', home.includes('復職判定面談を1件から'));
check('form-identifies-kiduki-contract-window', form.includes('契約・請求・支援の窓口はKIDUKIです'));
check('form-defines-thirty-day-case-workspace', form.includes('案件専用画面を30日間'));
check('form-states-no-automatic-monthly-billing', form.includes('Casetra月額契約への自動移行や月額請求はありません'));
check('form-posts-spot-intake-type', form.includes("intakeType:'KIDUKI_RTW_SPOT'"));
check('form-posts-delivery-method', form.includes("deliveryMethod:String(v.deliveryMethod"));
check('home-foregrounds-existing-doctor-complement', home.includes('すでに産業医がいる事業場でも'));
check('form-foregrounds-existing-doctor-gap', form.includes('既存産業医が対応できない') && form.includes('産業医を替える契約ではありません'));
check('form-requires-support-reason', /name="supportReason"[^>]*required/.test(form));
check('form-posts-support-reason', form.includes('supportReason,deliveryMethod'));
check('form-includes-support-reason-in-inquiry-message', form.includes('今回KIDUKIが補う理由:'));
check('form-uses-canonical-front-door', form.includes('https://casetra-api-dev-edge-bacnf4bqc9dxe8hn.z01.azurefd.net/api/leads'));
check('form-requires-privacy-consent', /name="privacyConsent"[^>]*required/.test(form));
check('form-prohibits-health-data', form.includes('社員の氏名・病名・診断書内容は入力しないでください'));
// 構造化データは二本柱と一致させる。価格は載せない（トップで金額を出さない方針と揃える）。
check('structured-data-matches-two-pillars',
  home.includes('"name":"睡眠に特化した産業医業務"')
  && home.includes('"name":"Casetraを活用した産業衛生DX支援"'));
check('structured-data-carries-no-price', !home.includes('"price"'));

const failures = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failures.length === 0, checks, failures }, null, 2));
if (failures.length > 0) process.exit(1);
