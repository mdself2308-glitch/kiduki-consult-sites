import fs from 'node:fs';

const home = fs.readFileSync('consult/index.html', 'utf8');
const form = fs.readFileSync('consult/return-to-work-pack/index.html', 'utf8');
const sitemap = fs.readFileSync('consult/sitemap.xml', 'utf8');
const manual = fs.readFileSync('docs/kiduki-pack-casetra-beginner-manual.md', 'utf8');
const checks = [];

function check(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

check('home-routes-pack-ctas-to-dedicated-form', (home.match(/href="\/return-to-work-pack\/"/g) || []).length >= 3);
check('sitemap-includes-pack-form', sitemap.includes('https://consult.kdkconslt-sngyouijm.com/return-to-work-pack/'));
check('form-identifies-kiduki-inquiry', form.includes('これはKIDUKIへの相談です'));
check('form-disclaims-casetra-inquiry', form.includes('Casetraの問い合わせ・月額契約申込ではありません'));
check('form-discloses-included-pack-screen', form.includes('追加のシステム利用料は発生しません'));
check('form-posts-pack-intake-type', form.includes("intakeType: 'KIDUKI_RTW_PACK'"));
check('form-uses-canonical-front-door', form.includes('https://casetra-api-dev-edge-bacnf4bqc9dxe8hn.z01.azurefd.net/api/leads'));
check('form-requires-privacy-consent', /name="privacyConsent"[^>]*required/.test(form));
check('form-prohibits-health-data', form.includes('社員の氏名・病名・診断書の内容は入力しないでください'));
check('success-keeps-kiduki-contract-boundary', form.includes('今回の送信でCasetra月額契約が成立することはありません'));
check('manual-names-kiduki-contract', manual.includes('企業が問い合わせ、打合せ、契約をする相手は **KIDUKI'));
check('manual-has-ops-runbook-url', manual.includes('https://core.casetra.jp/ops/pack'));
check('manual-requires-one-case-boundary', manual.includes('割り当てられた復職Case 1件だけ'));

const failures = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failures.length === 0, checks, failures }, null, 2));
if (failures.length > 0) process.exit(1);
