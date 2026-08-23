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
check('home-defines-three-standard-interviews', home.includes('復職時、復職後1か月、復職後3か月の面談'));
check('form-defines-six-month-maximum', form.includes('開始から最長6か月'));
check('home-foregrounds-self-service-booking', home.includes('専用リンクから担当産業医の空き枠を見て日時を選択'));
check('home-avoids-absolute-zero-coordination-claim', !/予約のやり取り(が|は)発生しない|日程調整ゼロ/.test(home));
check('form-explains-booking-link', form.includes('企業専用の予約リンクから担当産業医の空き枠を確認'));
check('home-removes-m3-m6-standard-copy', !home.includes('M3・M6等'));
check('manual-defines-three-exit-options', manual.includes('Casetraを別途月額契約') && manual.includes('KIDUKIへ単発フォロー') && manual.includes('自社または既存産業医'));
// 料金セクションの3枚のカードは、いずれも次の行き先を持つこと。
// 以前は Pack と Casetra STARTER が行き止まりで、購入意思が出た地点で導線が切れていた。
check('pricing-card-pack-has-cta', home.includes('<a class="pricing-cta" href="/return-to-work-pack/">'));
check('pricing-card-spot-has-cta', home.includes('<a class="pricing-cta" href="/return-to-work-spot/">'));
check('pricing-card-casetra-has-cta', /<a class="pricing-cta" href="https:\/\/casetra\.jp\/\?utm_source=kdk-consult[^"]*utm_campaign=pricing"/.test(home));

check('pack-includes-three-opinion-letters', home.includes('各面談後の産業医意見書（計3通）') && form.includes('各面談後の産業医意見書3通') && manual.includes('各面談後に産業医意見書を1通ずつ発行'));

const failures = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failures.length === 0, checks, failures }, null, 2));
if (failures.length > 0) process.exit(1);
