import fs from 'node:fs';

const home = fs.readFileSync('consult/index.html', 'utf8');
const form = fs.readFileSync('consult/return-to-work-pack/index.html', 'utf8');
const sitemap = fs.readFileSync('consult/sitemap.xml', 'utf8');
const manual = fs.readFileSync('docs/kiduki-pack-casetra-beginner-manual.md', 'utf8');
const checks = [];

function check(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

check('home-routes-inquiries-to-current-contact-form', (home.match(/https:\/\/kdkconslt-sngyouijm\.com\/contact\//g) || []).length >= 5);
check('home-does-not-bypass-current-contact-form', !/href="\/return-to-work-(?:pack|spot)\/"/.test(home));
check('sitemap-includes-pack-form', sitemap.includes('https://consult.kdkconslt-sngyouijm.com/return-to-work-pack/'));
check('form-identifies-kiduki-inquiry', form.includes('これはKIDUKIへの相談です'));
check('form-names-kiduki-as-service-window', form.includes('ご相談、契約、請求、支援の窓口はKIDUKIです'));
check('form-explains-included-pack-screen', form.includes('専用画面の利用はPack料金に含まれます'));
check('form-avoids-confusing-negative-contract-copy', !/Casetraの問い合わせ・月額契約申込ではありません|追加のシステム利用料は発生しません|Casetra月額契約が成立/.test(form));
check('form-posts-pack-intake-type', form.includes("intakeType: 'KIDUKI_RTW_PACK'"));
check('form-uses-canonical-front-door', form.includes('https://casetra-api-dev-edge-bacnf4bqc9dxe8hn.z01.azurefd.net/api/leads'));
check('form-requires-privacy-consent', /name="privacyConsent"[^>]*required/.test(form));
check('form-prohibits-health-data', form.includes('社員の氏名・病名・診断書の内容は入力しないでください'));
check('success-keeps-kiduki-service-window', form.includes('ご相談の送信先と対応窓口はKIDUKIです'));
check('manual-names-kiduki-contract', manual.includes('企業が問い合わせ、打合せ、契約をする相手は **KIDUKI'));
check('manual-has-ops-runbook-url', manual.includes('https://core.casetra.jp/ops/pack'));
check('manual-requires-one-case-boundary', manual.includes('割り当てられた復職Case 1件だけ'));
check('home-offers-one-case-return-to-work-assessment', home.includes('急なご依頼となる復職判定面談を1件から承ります'));
check('form-defines-six-month-maximum', form.includes('開始から最長6か月'));
check('home-defines-sleep-informed-return-to-work-assessment', home.includes('睡眠時間、生活リズム、日中の眠気、服薬の影響と業務内容'));
check('home-avoids-absolute-zero-coordination-claim', !/予約のやり取り(が|は)発生しない|日程調整ゼロ/.test(home));
check('form-explains-booking-link', form.includes('企業専用の予約リンクから担当産業医の空き枠を確認'));
check('home-removes-m3-m6-standard-copy', !home.includes('M3・M6等'));
check('manual-defines-three-exit-options', manual.includes('Casetraを別途月額契約') && manual.includes('KIDUKIへ単発フォロー') && manual.includes('自社または既存産業医'));
check('home-keeps-pricing-fuzzy', !/(?:\d{1,3}(?:,\d{3})+|\d+)\s*円/.test(home));
check('home-keeps-casetra-as-dx-means', home.includes('この運用は、自社開発の産業衛生管理システム') && home.includes('Casetra'));
check('pack-form-and-manual-keep-three-opinion-letters', form.includes('各面談後の産業医意見書3通') && manual.includes('各面談後に産業医意見書を1通ずつ発行'));

const failures = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failures.length === 0, checks, failures }, null, 2));
if (failures.length > 0) process.exit(1);
