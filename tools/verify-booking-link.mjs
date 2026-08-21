import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// リードフォームの最後の1段を見る。
// フォーム送信は成功するのに予約ページが404、という状態を検出できるのはここだけなので、
// 予約URLはAPIのソースから読み、その実物を叩いて確認する。定数が変わっても追随する。

const casetraRoot = process.env.CASETRA_ROOT
  || path.join(os.homedir(), 'Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/casetra_active');
const publicLeadsPath = path.join(casetraRoot, 'kiduki-consult-api-deploy/src/functions/publicLeads.ts');
// 無料相談の入口は2つあり、予約URLはそれぞれ別の場所に書かれている。
// KIDUKIサイトはAPIの定数から受け取るが、Casetraの無料相談ページはHTMLに直接書いてある。
// 片方だけ直すとズレるので、両方を突き合わせる。
const casetraConsultPath = path.join(casetraRoot, 'casetra-consult-swa/public/index.html');

const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), ...(detail ? { detail } : {}) });

const status = async (url) => {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
    return res.status;
  } catch (error) {
    return `error:${error instanceof Error ? error.message : String(error)}`;
  }
};

let bookingUrl = null;
if (fs.existsSync(publicLeadsPath)) {
  const source = fs.readFileSync(publicLeadsPath, 'utf8');
  const match = source.match(/KIDUKI_PACK_BOOKING_URL\s*=\s*"([^"]+)"/);
  bookingUrl = match ? match[1] : null;
  check('lead-api-declares-a-booking-url', Boolean(bookingUrl), bookingUrl ?? 'constant not found');
} else {
  check('lead-api-source-available', false, `set CASETRA_ROOT (looked for ${publicLeadsPath})`);
}

if (bookingUrl) {
  // 予約ページ本体。クエリは付けずに素のイベントURLで見る。
  const base = bookingUrl.split('?')[0];
  const code = await status(base);
  check('booking-page-is-reachable', code === 200, `${base} -> ${code}`);

  // マネージドイベントはチームURLでは予約できない。ここがチームURLへ戻ると必ず404になるので、
  // 到達性とは別に形そのものを止める。
  check('booking-page-is-not-a-team-url', !/cal\.com\/team\//.test(base), base);

  // 無料相談は事務所のみで受ける。イベントの割り当ては assignAllTeamMembers なので、
  // 事務所アカウントを名指ししていることがそのまま「産業医へ回さない」担保になる。
  const office = process.env.KIDUKI_CAL_OFFICE_USERNAME ?? 'kdk-k6whio';
  check('booking-page-is-the-office-account', base.includes(`cal.com/${office}/`), base);
}

// Casetra の無料相談ページ（consult.casetra.jp）が同じ予約先を指しているか。
if (bookingUrl && fs.existsSync(casetraConsultPath)) {
  const consultHtml = fs.readFileSync(casetraConsultPath, 'utf8');
  const found = consultHtml.match(/https:\/\/cal\.com\/[^"'\s]+/);
  check('casetra-consult-page-declares-a-booking-url', Boolean(found), found ? found[0] : 'not found');
  if (found) {
    check('casetra-consult-page-matches-lead-api', found[0].split('?')[0] === bookingUrl.split('?')[0],
      `consult=${found[0].split('?')[0]} / api=${bookingUrl.split('?')[0]}`);
  }
} else if (bookingUrl) {
  check('casetra-consult-page-available', false, `not found: ${casetraConsultPath}`);
}

// 旧予約ページ（/reserve）。CAL_URLは現在呼ばれないdead codeだが、チームURLが残っていると
// コピーや復活の瞬間に404へ直行するので、到達性ではなく形そのものを止める。
const reserveHtml = fs.readFileSync('reserve/index.html', 'utf8');
const reserveCal = reserveHtml.match(/https:\/\/cal\.com\/[^"'\s]+/);
check('reserve-page-has-no-team-url', !/cal\.com\/team\//.test(reserveHtml), reserveCal ? reserveCal[0] : 'no cal.com url');

// フォーム側は、送信先とボタンの結線が残っているかだけ見る。文言はsource verifierの担当。
for (const [name, file] of [['pack', 'consult/return-to-work-pack/index.html'], ['spot', 'consult/return-to-work-spot/index.html']]) {
  const html = fs.readFileSync(file, 'utf8');
  check(`${name}-form-posts-to-lead-api`, html.includes('/api/leads'));
  check(`${name}-form-wires-booking-button`, html.includes("getElementById('bookingButton')"));
}

const failures = checks.filter((item) => !item.ok);
console.log(JSON.stringify({ ok: failures.length === 0, bookingUrl, checks, failures }, null, 2));
if (failures.length > 0) process.exit(1);
