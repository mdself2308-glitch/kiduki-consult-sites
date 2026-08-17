// CASETRA プラットフォームご案内 2026.08 — trust-first rebuild
const pptxgen = require("pptxgenjs");
const { HEAD, BODY, W, H, MX, CW, makeHelpers } = require("./common");

const C = {
  INK: "0F3D2E",
  MID: "1A4D3A",
  MID2: "2E6B53",
  TINT: "F1F5F2",
  BORDER: "D6E0D9",
  GOLD: "B45309",
  TEXT: "1A2421",
  MUTED: "6B7570",
};
C.TINT2 = C.BORDER;

const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "KIDUKIコンサルティング産業医事務所";
pptx.company = "KIDUKIコンサルティング産業医事務所";
pptx.title = "CASETRA プラットフォームのご案内 2026.08";

const Hh = makeHelpers(pptx, C, "CASETRA｜KIDUKIコンサルティング産業医事務所");
const { footer, titleBlock, card, numCircle, text } = Hh;

// ---------------------------------------------------------------- S1 cover
{
  const s = pptx.addSlide();
  s.addShape(pptx.ShapeType.ellipse, { x: 9.35, y: -2.4, w: 6.6, h: 6.6, fill: { color: C.TINT }, line: { type: "none" } });
  s.addShape(pptx.ShapeType.ellipse, { x: 10.85, y: 3.55, w: 3.6, h: 3.6, fill: { type: "none" }, line: { color: C.BORDER, width: 1.25 } });

  text(s, "CASETRA", { x: MX, y: 0.62, w: 8, h: 0.4, fontSize: 16, bold: true, color: C.MID, charSpacing: 2 });
  text(s, "産業保健の案件管理システム｜サービスのご案内　2026年8月", { x: MX, y: 1.05, w: 9, h: 0.3, fontSize: 10, color: C.MUTED });

  s.addText("一人ひとりを、\n最後まで見届ける。", {
    x: MX, y: 2.5, w: 9.6, h: 2.0, fontFace: HEAD, fontSize: 32, bold: true,
    color: C.INK, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.35,
  });
  text(s, "面談・措置・フォローアップを案件（Case）単位で管理し、期限と記録を確実に残す。\n産業医業務の実務から生まれた、企業のための管理システムです。", {
    x: MX, y: 4.72, w: 9.4, h: 0.9, fontSize: 12.5, color: C.MUTED, lineSpacingMultiple: 1.45 });

  text(s, "開発・提供：KIDUKIコンサルティング産業医事務所（東京・新橋）", {
    x: MX, y: 6.55, w: 11.0, h: 0.35, fontSize: 10.5, color: C.TEXT });
}

// ------------------------------------------- S2 開発の背景（provenance）
{
  const s = pptx.addSlide();
  titleBlock(s, "産業医事務所が、自らの実務のために開発しました");

  const lx = MX, lw = 5.9;
  text(s,
    "CASETRAは、KIDUKIコンサルティング産業医事務所が、自らの産業医業務を運用するために開発した案件管理システムです。",
    { x: lx, y: 1.55, w: lw, h: 0.95, fontSize: 12, lineSpacingMultiple: 1.45, bold: true, color: C.INK });
  text(s,
    "面談の日程調整に費やされる往復メール。復職者の3か月後フォローの抜け。散在する記録と、監査のたびの資料の再構成——産業保健の実務で繰り返されるこうした問題を、ひとつずつシステムの仕様として解決してきました。",
    { x: lx, y: 2.55, w: lw, h: 1.5, fontSize: 11, lineSpacingMultiple: 1.5 });
  text(s,
    "現在も当事務所の全案件がCASETRA上で運用されており、実際の案件で確認できた手順だけを機能にしています。同じ仕組みを、自社で産業保健を運用する企業へ提供します。",
    { x: lx, y: 4.15, w: lw, h: 1.5, fontSize: 11, lineSpacingMultiple: 1.5 });

  const rx = 7.0, rw = W - MX - rx;
  text(s, "実務由来である、ということ", { x: rx, y: 1.55, w: rw, h: 0.35, fontSize: 12.5, bold: true, color: C.INK });
  const points = [
    ["画面と手順が、実務の順番どおり", "起票から完了まで、産業保健業務の実際の流れに沿って設計されています。"],
    ["記録は「提出できる形」で残る", "監督署の調査・監査・係争の際に、案件ごとの経過を一式で出力できます。"],
    ["決定の権限は、会社に残る", "就業上の措置の決定は事業者が行うもの。システムは判断材料の整理と、決定の記録を担います。"],
  ];
  let sy = 2.05;
  points.forEach(([t, d], i) => {
    const sh = 1.42;
    card(s, rx, sy, rw, sh, { fill: C.TINT, line: C.BORDER });
    numCircle(s, rx + 0.22, sy + 0.2, i + 1, { d: 0.3, size: 11 });
    text(s, t, { x: rx + 0.66, y: sy + 0.17, w: rw - 0.85, h: 0.32, fontSize: 11.5, bold: true, color: C.INK });
    text(s, d, { x: rx + 0.66, y: sy + 0.52, w: rw - 0.9, h: sh - 0.62, fontSize: 9.5, lineSpacingMultiple: 1.28 });
    sy += sh + 0.16;
  });

  footer(s, 2);
}

// ------------------------------------------- S3 課題
{
  const s = pptx.addSlide();
  titleBlock(s, "産業保健の管理で、こんな状態になっていませんか");

  const probs = [
    ["次の一手が見えない", "情報がメール・口頭・Excelに分かれ、いま誰の対応待ちなのかが分からなくなる。"],
    ["期限が追えない", "面談、措置の見直し、フォローの期日が別々に管理され、抜け漏れが起きる。"],
    ["あとから説明できない", "誰が、いつ、何を根拠に決めたのかを、一続きの記録として出せない。"],
  ];
  const pw = 3.84, pg = 0.2, ph = 2.05, py = 1.75;
  probs.forEach(([t, d], i) => {
    const x = MX + i * (pw + pg);
    card(s, x, py, pw, ph, {});
    numCircle(s, x + 0.24, py + 0.26, i + 1, { d: 0.36 });
    text(s, t, { x: x + 0.76, y: py + 0.3, w: pw - 1.0, h: 0.4, fontSize: 12.5, bold: true, color: C.INK });
    text(s, d, { x: x + 0.28, y: py + 0.95, w: pw - 0.56, h: ph - 1.15, fontSize: 10.5, lineSpacingMultiple: 1.35 });
  });

  const by = 4.25, bh = 1.75;
  card(s, MX, by, CW, bh, { fill: C.TINT, line: C.BORDER });
  text(s, "共通する原因", { x: MX + 0.35, y: by + 0.3, w: 2.2, h: 0.4, fontSize: 12.5, bold: true, color: C.MID2 });
  text(s, "業務が「案件」として管理されていないことです。CASETRAは、一つひとつの対応を起票から完了まで案件単位で追跡し、期限・担当・記録をその案件に紐づけて管理します。担当者が交代しても、案件は止まりません。", {
    x: MX + 2.6, y: by + 0.3, w: CW - 3.0, h: bh - 0.5, fontSize: 12, lineSpacingMultiple: 1.5 });

  footer(s, 3);
}

// ------------------------------------------- S4 機能
{
  const s = pptx.addSlide();
  titleBlock(s, "CASETRAでできること");

  const feats = [
    ["案件（Case）管理", "起票から完了まで、状態・担当・期日を案件単位で管理します。担当者が交代しても案件は止まりません。"],
    ["期限の自動管理", "再評価日やフォロー期日を登録すると、期日前に自動で通知。超過した場合は段階的にお知らせします。"],
    ["面談予約", "空き枠から選ぶだけの予約で、日程調整の往復メールをなくします。予定はカレンダーに自動反映されます。"],
    ["措置・是正の記録", "指示の内容・責任者・期限・実施結果を記録します。「伝えた」ではなく「実施された」まで追えます。"],
    ["記録の一括出力", "面談記録・意見・決定の経過を、案件ごとに一式で出力。監査・調査の際にそのまま提出できます。"],
    ["2つのポータル", "企業担当者用と産業医用に分かれ、役割に応じて必要な範囲だけを表示します（役割ベースの権限管理）。"],
  ];
  const cw2 = 3.84, gap = 0.2, ch = 1.9;
  feats.forEach(([t, d], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = MX + col * (cw2 + gap);
    const y = 1.6 + row * (ch + 0.22);
    card(s, x, y, cw2, ch, {});
    text(s, t, { x: x + 0.24, y: y + 0.2, w: cw2 - 0.48, h: 0.34, fontSize: 12, bold: true, color: C.INK });
    text(s, d, { x: x + 0.24, y: y + 0.62, w: cw2 - 0.48, h: ch - 0.8, fontSize: 9.5, lineSpacingMultiple: 1.3 });
  });

  text(s, "※ 機能の詳細と画面は、オンラインでのご説明時にご覧いただけます。", {
    x: MX, y: 5.9, w: CW, h: 0.3, fontSize: 9.5, color: C.MUTED });

  footer(s, 4);
}

// ------------------------------------------- S5 運用の流れ
{
  const s = pptx.addSlide();
  titleBlock(s, "起票から完了まで、ひとつの流れで");

  const steps = [
    ["起票", "案件の種別・担当者・必要な情報・本人同意の範囲を、最初に登録します。"],
    ["実行", "予約、面談、文書、期日を案件の中で進行管理します。関係者への確認・催促はシステムが行います。"],
    ["完了", "措置と見直し時期を確定し、決定を記録して案件を閉じます。記録一式はいつでも出力できます。"],
  ];
  const pw = 3.84, pg = 0.2, ph = 2.3, py = 1.8;
  steps.forEach(([t, d], i) => {
    const x = MX + i * (pw + pg);
    card(s, x, py, pw, ph, {});
    text(s, "0" + (i + 1), { x: x + 0.26, y: py + 0.22, w: 0.9, h: 0.5, fontSize: 22, bold: true, color: C.BORDER, fontFace: BODY });
    text(s, t, { x: x + 0.95, y: py + 0.3, w: pw - 1.2, h: 0.4, fontSize: 14, bold: true, color: C.INK });
    text(s, d, { x: x + 0.28, y: py + 0.95, w: pw - 0.56, h: ph - 1.15, fontSize: 10.5, lineSpacingMultiple: 1.38 });
    if (i < 2) {
      s.addText("›", { x: x + pw - 0.02, y: py + 0.9, w: 0.26, h: 0.5, fontSize: 20, color: C.MUTED, align: "center", valign: "middle", margin: 0, fontFace: BODY });
    }
  });

  const by = 4.55, bh = 1.45;
  card(s, MX, by, CW, bh, { fill: C.TINT, line: C.BORDER });
  text(s, "「完了」の定義がある、ということ", { x: MX + 0.35, y: by + 0.24, w: CW - 0.7, h: 0.35, fontSize: 12, bold: true, color: C.MID2 });
  text(s, "案件は「対応した」ではなく、「完了の条件を満たした」ときに閉じます。決定が記録されていない案件、見直し時期が未設定の案件は完了になりません。この完了の定義が、抜け漏れを防ぎます。", {
    x: MX + 0.35, y: by + 0.62, w: CW - 0.7, h: bh - 0.75, fontSize: 11, lineSpacingMultiple: 1.4 });

  footer(s, 5);
}

// ------------------------------------------- S6 料金
{
  const s = pptx.addSlide();
  titleBlock(s, "料金プラン", "月間の案件数・予約数に合わせて選べる3つのプランです。初期費用は無料です。");

  const plans = [
    { name: "STARTER", tag: "小規模・低頻度の利用に", price: "40,000円", cases: "Case枠  月4件（超過 4,000円／件）", books: "予約枠  月4件（超過 5,000円／件）" },
    { name: "STANDARD", tag: "標準的なプラン", price: "60,000円", cases: "Case枠  月11件（超過 3,000円／件）", books: "予約枠  月9件（超過 4,000円／件）" },
    { name: "PLUS", tag: "高頻度・中規模以上に", price: "99,000円", cases: "Case枠  月18件（超過 2,000円／件）", books: "予約枠  月18件（超過 3,000円／件）" },
  ];
  const pw = 3.84, pg = 0.2, ph = 2.6, py = 1.95;
  plans.forEach((p, i) => {
    const x = MX + i * (pw + pg);
    card(s, x, py, pw, ph, { shadow: true });
    text(s, p.name, { x: x + 0.28, y: py + 0.24, w: pw - 0.56, h: 0.34, fontSize: 14, bold: true, color: C.INK, charSpacing: 1 });
    text(s, p.tag, { x: x + 0.28, y: py + 0.6, w: pw - 0.56, h: 0.28, fontSize: 9.5, color: C.GOLD, bold: true });
    s.addText([
      { text: p.price, options: { fontSize: 23, bold: true, color: C.MID2 } },
      { text: " ／月（税別）", options: { fontSize: 10.5, color: C.MUTED } },
    ], { x: x + 0.28, y: py + 0.92, w: pw - 0.56, h: 0.5, fontFace: BODY, align: "left", valign: "middle", margin: 0 });
    s.addShape(pptx.ShapeType.line, { x: x + 0.28, y: py + 1.58, w: pw - 0.56, h: 0, line: { color: C.BORDER, width: 0.75 } });
    text(s, p.cases, { x: x + 0.28, y: py + 1.72, w: pw - 0.56, h: 0.3, fontSize: 9.5 });
    text(s, p.books, { x: x + 0.28, y: py + 2.08, w: pw - 0.56, h: 0.3, fontSize: 9.5 });
  });

  const by = 4.85, bh = 1.5;
  card(s, MX, by, CW, bh, { fill: C.TINT, line: C.BORDER });
  text(s, "料金に含まれるもの・含まれないもの", { x: MX + 0.35, y: by + 0.22, w: CW - 0.7, h: 0.32, fontSize: 11.5, bold: true, color: C.MID2 });
  s.addText([
    { text: "含まれる： ", options: { bold: true } },
    { text: "システム利用、企業ポータル・産業医ポータル、記録・証跡の管理", options: { breakLine: true } },
    { text: "含まれない： ", options: { bold: true } },
    { text: "産業医等の医師業務（面談・意見書など）。貴社の産業医・保健スタッフでそのまま運用できます。必要な場合は、案件単位で当事務所へご依頼も可能です（次ページ）。", options: {} },
  ], { x: MX + 0.35, y: by + 0.58, w: CW - 0.7, h: bh - 0.7, fontFace: BODY, fontSize: 10, color: C.TEXT, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.4 });

  text(s, "※ 運用設計・初期設定を支援するオンボーディング（100,000円・税別）を別途ご用意しています。", {
    x: MX, y: 6.5, w: CW, h: 0.3, fontSize: 9, color: C.MUTED });

  footer(s, 6);
}

// ------------------------------------------- S7 医師業務が必要な場合
{
  const s = pptx.addSlide();
  titleBlock(s, "医師業務が必要になったときは",
    "CASETRAはシステム利用のご契約です。医師業務は、必要なときに必要な分だけ。契約と請求は、常に分けて明示します。");

  const lx = MX, lw = 6.9;
  const pats = [
    ["CASETRA ＋ 必要時のみ依頼", "貴社の人事・産業医で日常運用し、休復職面談や意見書など、専門業務が必要なときだけ当事務所（KIDUKI）へ案件単位でご依頼いただけます。CASETRA契約企業には、右の契約者料金を適用します。"],
    ["嘱託産業医とあわせて（Retain ＋ CASETRA）", "当事務所が嘱託産業医として継続対応し、貴社もポータルで案件を管理する形です。この場合、CASETRAの月額基本料を20,000円割り引きます（例：STANDARD 60,000円 → 40,000円）。"],
  ];
  let yy = 2.1;
  pats.forEach(([t, d], i) => {
    const sh = 1.85;
    card(s, lx, yy, lw, sh, {});
    text(s, String.fromCharCode(65 + i), { x: lx + 0.24, y: yy + 0.2, w: 0.5, h: 0.45, fontSize: 18, bold: true, color: C.BORDER, fontFace: BODY });
    text(s, t, { x: lx + 0.78, y: yy + 0.24, w: lw - 1.0, h: 0.38, fontSize: 12.5, bold: true, color: C.INK });
    text(s, d, { x: lx + 0.28, y: yy + 0.72, w: lw - 0.56, h: sh - 0.9, fontSize: 10, lineSpacingMultiple: 1.35 });
    yy += sh + 0.22;
  });
  text(s, "※ 産業医業務を中心にご検討の場合は、別資料「KIDUKI サービスのご案内」をご覧ください。", {
    x: lx, y: yy + 0.05, w: lw, h: 0.35, fontSize: 9, color: C.MUTED });

  const rx = 8.0, rw = W - MX - rx;
  text(s, "契約者料金（主なオンライン業務）", { x: rx, y: 2.1, w: rw, h: 0.32, fontSize: 11.5, bold: true, color: C.INK });
  const hdr = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: C.MID } } });
  const rows = [
    [hdr("業務"), hdr("料金")],
    ["健康相談 等（20分）", "14,000円"],
    ["ストレス・その他面談（30分）", "20,000円"],
    ["復職・体調相談（40分）", "27,000円"],
    ["人事フィードバック（15分）", "10,000円"],
    ["人事フィードバック（30分）", "20,000円"],
    ["診療情報提供依頼書 等", "5,000円"],
  ];
  s.addTable(rows, {
    x: rx, y: 2.5, w: rw, colW: [3.3, 1.33],
    fontFace: BODY, fontSize: 9.5, color: C.TEXT,
    border: { type: "solid", color: C.BORDER, pt: 0.75 },
    fill: { color: "FFFFFF" },
    align: "left", valign: "middle", rowH: 0.4,
    margin: [0.03, 0.07, 0.03, 0.07],
  });

  footer(s, 7);
}

// ------------------------------------------- S8 導入の流れ
{
  const s = pptx.addSlide();
  titleBlock(s, "導入の流れ");

  const steps = [
    ["現状確認", "無料・オンライン15分", "月の案件数・面談数・運用体制を伺います。"],
    ["プラン選定", "最小構成から", "実際の件数に合う、最小のプランをご提案します。"],
    ["初期設定", "オンボーディング支援あり", "案件種別・権限・書式を設定します。"],
    ["運用開始", "月次で確認", "開始後も、月次で運用状況をご一緒に確認します。"],
  ];
  const pw = 2.86, pg = 0.16, ph = 2.2, py = 1.7;
  steps.forEach(([t, tag, d], i) => {
    const x = MX + i * (pw + pg);
    card(s, x, py, pw, ph, {});
    numCircle(s, x + 0.22, py + 0.24, i + 1, { d: 0.34 });
    text(s, t, { x: x + 0.68, y: py + 0.26, w: pw - 0.9, h: 0.34, fontSize: 12.5, bold: true, color: C.INK });
    text(s, tag, { x: x + 0.24, y: py + 0.78, w: pw - 0.48, h: 0.28, fontSize: 8.5, color: C.GOLD, bold: true });
    text(s, d, { x: x + 0.24, y: py + 1.12, w: pw - 0.48, h: ph - 1.3, fontSize: 9.5, lineSpacingMultiple: 1.3 });
  });

  s.addText("まずは、いまの案件数と運用の状況をお聞かせください。", {
    x: MX, y: 4.4, w: CW, h: 0.5, fontFace: HEAD, fontSize: 16, bold: true, color: C.INK, align: "center", valign: "middle", margin: 0 });

  const cy = 5.15, chh = 1.5;
  card(s, MX + 1.6, cy, CW - 3.2, chh, { fill: C.TINT, line: C.BORDER });
  text(s, "無料相談（オンライン・15分）はこちらから", { x: MX + 1.6, y: cy + 0.22, w: CW - 3.2, h: 0.3, fontSize: 10.5, color: C.MUTED, align: "center" });
  text(s, "https://consult.casetra.jp/", { x: MX + 1.6, y: cy + 0.54, w: CW - 3.2, h: 0.4, fontSize: 15, bold: true, color: C.MID2, align: "center" });
  text(s, "CASETRA｜開発・提供：KIDUKIコンサルティング産業医事務所", { x: MX + 1.6, y: cy + 1.0, w: CW - 3.2, h: 0.3, fontSize: 9.5, color: C.MUTED, align: "center" });

  footer(s, 8);
}

pptx.writeFile({ fileName: "CASETRA_platform_guide_202608.pptx" }).then(() => console.log("CASETRA deck written"));
