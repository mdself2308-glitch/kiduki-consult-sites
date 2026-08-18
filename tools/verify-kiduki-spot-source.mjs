import fs from 'node:fs';

const home = fs.readFileSync('consult/index.html', 'utf8');
const form = fs.readFileSync('consult/return-to-work-spot/index.html', 'utf8');
const sitemap = fs.readFileSync('consult/sitemap.xml', 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, ok: Boolean(condition) });

check('home-links-to-spot-form', (home.match(/href="\/return-to-work-spot\/"/g) || []).length >= 3);
check('sitemap-includes-spot-form', sitemap.includes('https://consult.kdkconslt-sngyouijm.com/return-to-work-spot/'));
check('home-publishes-online-fee', home.includes('オンライン60,000円'));
check('home-publishes-onsite-fee-and-travel', home.includes('訪問75,000円＋交通費'));
check('home-publishes-complex-from-price', home.includes('緊急・複雑案件は80,000円から'));
check('home-defines-included-interview-and-opinion', home.includes('面談1回・意見書1通'));
check('form-identifies-kiduki-contract-window', form.includes('契約・請求・支援の窓口はKIDUKIです'));
check('form-defines-thirty-day-limited-access', form.includes('案件限定画面を30日間'));
check('form-states-no-automatic-monthly-billing', form.includes('Casetra月額契約への自動移行や月額請求はありません'));
check('form-posts-spot-intake-type', form.includes("intakeType:'KIDUKI_RTW_SPOT'"));
check('form-posts-delivery-method', form.includes("deliveryMethod:String(v.deliveryMethod"));
check('form-uses-canonical-front-door', form.includes('https://casetra-api-dev-edge-bacnf4bqc9dxe8hn.z01.azurefd.net/api/leads'));
check('form-requires-privacy-consent', /name="privacyConsent"[^>]*required/.test(form));
check('form-prohibits-health-data', form.includes('社員の氏名・病名・診断書内容は入力しないでください'));
check('structured-data-includes-spot-offers', home.includes('"name":"復職・両立支援 単発オンライン"') && home.includes('"price":"60000"') && home.includes('"price":"75000"'));

const failures = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failures.length === 0, checks, failures }, null, 2));
if (failures.length > 0) process.exit(1);
