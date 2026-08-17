// KIDUKI サービスご案内 2026.08 — trust-first rebuild
const pptxgen = require("pptxgenjs");
const { HEAD, BODY, W, H, MX, CW, makeHelpers } = require("./common");

const C = {
  INK: "1D3A30", // deep green (headings)
  MID: "35664F", // mid green
  TINT: "EEF5F1", // soft bg
  TINT2: "DBEAE2", // borders / soft
  BORDER: "DBEAE2",
  GOLD: "A97724", // sparing accent
  TEXT: "2B322E",
  MUTED: "566159",
};

const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "KIDUKIコンサルティング産業医事務所";
pptx.company = "KIDUKIコンサルティング産業医事務所";
pptx.title = "KIDUKI サービスのご案内 2026.08";

const Hh = makeHelpers(pptx, C, "KIDUKIコンサルティング産業医事務所");
const { footer, titleBlock, card, numCircle, text } = Hh;

// ---------------------------------------------------------------- S1 cover
{
  const s = pptx.addSlide();
  // soft circles, right side
  s.addShape(pptx.ShapeType.ellipse, { x: 9.35, y: -2.4, w: 6.6, h: 6.6, fill: { color: C.TINT }, line: { type: "none" } });
  s.addShape(pptx.ShapeType.ellipse, { x: 10.85, y: 3.55, w: 3.6, h: 3.6, fill: { type: "none" }, line: { color: C.TINT2, width: 1.25 } });

  text(s, "KIDUKIコンサルティング産業医事務所", { x: MX, y: 0.62, w: 8, h: 0.35, fontSize: 13, bold: true, color: C.INK });
  text(s, "サービスのご案内｜2026年8月", { x: MX, y: 1.0, w: 8, h: 0.3, fontSize: 10, color: C.MUTED });

  s.addText("判断に根拠を。\n対応に、記録を。", {
    x: MX, y: 2.5, w: 9.6, h: 2.0, fontFace: HEAD, fontSize: 32, bold: true,
    color: C.INK, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.35,
  });
  text(s, "休職・復職の支援から、日常の産業保健まで。\n産業医の意見が職場で実施されるところまでを、記録の残るかたちでお引き受けします。", {
    x: MX, y: 4.72, w: 9.2, h: 0.9, fontSize: 12.5, color: C.MUTED, lineSpacingMultiple: 1.45 });

  text(s, "東京・新橋｜代表  宮部 大輔（内科専門医・心療内科専門医・労働衛生コンサルタント）", {
    x: MX, y: 6.55, w: 11.0, h: 0.35, fontSize: 10.5, color: C.TEXT });
}

// ------------------------------------------------------- S2 事務所のご紹介
{
  const s = pptx.addSlide();
  titleBlock(s, "事務所のご紹介", "働く人の睡眠を専門としながら、産業医の業務全般に対応する産業医事務所です。");

  // left: facts
  const fx = MX, fy = 1.85, fw = 6.1;
  const facts = [
    ["名 称", "KIDUKIコンサルティング産業医事務所（東京・新橋）"],
    ["代 表", "宮部 大輔\n内科専門医／心療内科専門医／労働衛生コンサルタント"],
    ["体 制", "産業医チーム制。担当医師のほか、代表・他の医師も相談に対応します"],
    ["連 携", "労働法を専門とする顧問弁護士と連携しています"],
    ["対 応", "オンライン・遠隔地の事業場にも対応します"],
    ["関与業種", "製造／情報通信／銀行・証券／建材・住宅／システム開発／運輸"],
  ];
  let yy = fy;
  const rowHs = [0.52, 0.78, 0.78, 0.52, 0.52, 0.78];
  facts.forEach(([k, v], i) => {
    const rh = rowHs[i];
    text(s, k, { x: fx, y: yy + 0.02, w: 1.05, h: rh, fontSize: 10, bold: true, color: C.MID });
    text(s, v, { x: fx + 1.15, y: yy, w: fw - 1.15, h: rh, fontSize: 10.5, lineSpacingMultiple: 1.25 });
    yy += rh + 0.13;
    if (i < facts.length - 1) {
      s.addShape(pptx.ShapeType.line, { x: fx, y: yy - 0.075, w: fw, h: 0, line: { color: C.TINT2, width: 0.75 } });
    }
  });

  // right: 3 stance cards
  const rx = 7.15, rw = W - MX - rx;
  text(s, "私たちの基本姿勢", { x: rx, y: 1.85, w: rw, h: 0.35, fontSize: 12.5, bold: true, color: C.INK });
  const stances = [
    ["判断には、根拠を添える", "医学的な意見は、評価の材料と理由を添えてお伝えします。印象では判断しません。"],
    ["経過は、記録に残す", "面談・意見・決定の経過を、後から一続きで説明できる記録として残します。監督署の調査や係争の際にも、そのまま提出できる形です。"],
    ["決定は、会社が行う", "就業上の措置の決定は、法律上、事業者に委ねられています（労働安全衛生法66条の5）。当事務所はその判断材料を揃え、決定の記録を残します。"],
  ];
  let sy = 2.3;
  const shs = [1.18, 1.5, 1.5];
  stances.forEach(([t, d], i) => {
    const sh = shs[i];
    card(s, rx, sy, rw, sh, { fill: C.TINT, noLine: false, line: C.TINT2 });
    numCircle(s, rx + 0.22, sy + 0.2, i + 1, { d: 0.3, size: 11 });
    text(s, t, { x: rx + 0.66, y: sy + 0.17, w: rw - 0.85, h: 0.32, fontSize: 12, bold: true, color: C.INK });
    text(s, d, { x: rx + 0.66, y: sy + 0.52, w: rw - 0.9, h: sh - 0.62, fontSize: 9.5, lineSpacingMultiple: 1.28 });
    sy += sh + 0.18;
  });

  footer(s, 2);
}

// --------------------------------------------------- S3 対応業務の全体像
{
  const s = pptx.addSlide();
  titleBlock(s, "産業医の法定業務は、一通りお引き受けします",
    "専門領域は睡眠とメンタルヘルスですが、対応範囲を限定するものではありません。嘱託産業医として、日常の産業保健業務の全般を担当します。");

  const duties = [
    ["衛生委員会", "出席、議題・資料の整備、議事録への意見", "労働安全衛生法18条"],
    ["職場巡視", "定期巡視と、指摘事項の是正確認まで", "労働安全衛生規則15条"],
    ["健康診断の事後措置", "結果への医師意見、就業区分の判定", "労働安全衛生法66条の4・66条の5"],
    ["長時間労働者への面接指導", "対象者の面談と意見書の作成", "労働安全衛生法66条の8"],
    ["ストレスチェック", "実施者対応、高ストレス者の面接指導", "労働安全衛生法66条の10"],
    ["休職・復職支援", "面談、意見書、復職後のフォロー", "厚労省・職場復帰支援の手引き"],
    ["健康相談・衛生教育", "従業員の健康相談、研修の実施", "労働安全衛生規則14条"],
    ["体制構築の支援", "50名到達・拠点新設時の体制づくり、規程・書式の整備", "健康経営の調査項目にも対応"],
  ];
  const cw2 = 2.86, gap = 0.16, ch = 1.62;
  const rows = [[0, 4], [4, 8]];
  let ry = 1.98;
  rows.forEach(([a, b]) => {
    for (let i = a; i < b; i++) {
      const col = i - a;
      const x = MX + col * (cw2 + gap);
      const [t, d, law] = duties[i];
      card(s, x, ry, cw2, ch, {});
      text(s, t, { x: x + 0.18, y: ry + 0.16, w: cw2 - 0.36, h: 0.52, fontSize: 11.5, bold: true, color: C.INK, lineSpacingMultiple: 1.15 });
      text(s, d, { x: x + 0.18, y: ry + 0.62, w: cw2 - 0.36, h: 0.62, fontSize: 9, lineSpacingMultiple: 1.25 });
      text(s, law, { x: x + 0.18, y: ry + ch - 0.34, w: cw2 - 0.36, h: 0.26, fontSize: 7.5, color: C.MUTED });
      if (i === 5) {
        text(s, "専門領域", { x: x + cw2 - 0.88, y: ry + 0.16, w: 0.72, h: 0.24, fontSize: 8, bold: true, color: C.GOLD, align: "right" });
      }
    }
    ry += ch + 0.2;
  });

  text(s, "※ 睡眠研修（90分・事前事後アンケート・実施報告書つき）は、単発でも承っています。", {
    x: MX, y: 5.78, w: CW, h: 0.3, fontSize: 9.5, color: C.MUTED });

  footer(s, 3);
}

// --------------------------------------- S4 休職・復職の3つの問題
{
  const s = pptx.addSlide();
  titleBlock(s, "休職・復職の対応は、「可否の判断」だけでは終わりません",
    "多くの企業で、判断のあとに同じ問題が起きています。");

  const probs = [
    ["判断材料が揃わない", "主治医の診断書、勤務の実態、本人の状態が別々に届き、医学の知識がないまま、人事が判断を抱え込みます。"],
    ["措置が曖昧なまま現場に渡る", "「残業は控えめに」といった表現では、現場は動けません。措置には、内容・開始日・期限が必要です。"],
    ["再評価が抜ける", "復職後の見直し時期が管理されず、一時的なはずの就業制限が何年も残る。逆に、必要な制限が外れたままになることもあります。"],
  ];
  const pw = 3.84, pg = 0.2, ph = 2.1, py = 2.0;
  probs.forEach(([t, d], i) => {
    const x = MX + i * (pw + pg);
    card(s, x, py, pw, ph, {});
    numCircle(s, x + 0.24, py + 0.26, i + 1, { d: 0.36 });
    text(s, t, { x: x + 0.76, y: py + 0.28, w: pw - 1.0, h: 0.62, fontSize: 12.5, bold: true, color: C.INK, lineSpacingMultiple: 1.15 });
    text(s, d, { x: x + 0.28, y: py + 1.0, w: pw - 0.56, h: ph - 1.2, fontSize: 10, lineSpacingMultiple: 1.32 });
  });

  // response band
  const by = 4.6, bh = 1.45;
  card(s, MX, by, CW, bh, { fill: C.TINT, line: C.TINT2 });
  text(s, "当事務所の対応", { x: MX + 0.35, y: by + 0.28, w: 2.2, h: 0.4, fontSize: 12.5, bold: true, color: C.MID });
  text(s, "意見書には「措置の内容・開始日・再評価日・解除条件」の4点を必ず明記します。\nそして再評価日が来るまで、ひとつの案件として追跡します。開いたままの案件を残しません。", {
    x: MX + 2.6, y: by + 0.28, w: CW - 3.0, h: bh - 0.5, fontSize: 12, lineSpacingMultiple: 1.5, color: C.TEXT });

  footer(s, 4);
}

// --------------------------------------- S5 復職支援の進め方
{
  const s = pptx.addSlide();
  titleBlock(s, "復職支援の進め方", "復職支援Packの標準的な流れです。ご依頼から、復職後の措置解除（または復職日から3か月）までを担当します。");

  // timeline
  const steps = [
    ["情報の整理", "診断書・勤務情報\n本人同意"],
    ["主治医への照会", "照会文面は\n当事務所が作成"],
    ["面談・評価", "面談3回＋生活リズム\nの客観評価"],
    ["意見書", "措置4点を明記"],
    ["会社の決定", "決定は必ず\n会社が行います"],
    ["フォロー・再評価", "復職後面談、措置の\n見直し・解除"],
  ];
  const n = steps.length;
  const ty = 2.3;
  const span = CW - 0.6;
  const step = span / (n - 1);
  s.addShape(pptx.ShapeType.line, { x: MX + 0.3, y: ty + 0.17, w: span, h: 0, line: { color: C.TINT2, width: 1.5 } });
  steps.forEach(([t, d], i) => {
    const cx = MX + 0.3 + i * step;
    numCircle(s, cx - 0.17, ty, i + 1, { d: 0.34 });
    text(s, t, { x: cx - 0.95, y: ty + 0.48, w: 1.9, h: 0.5, fontSize: 10.5, bold: true, color: C.INK, align: "center", lineSpacingMultiple: 1.1 });
    text(s, d, { x: cx - 0.95, y: ty + 0.94, w: 1.9, h: 0.6, fontSize: 8.5, color: C.MUTED, align: "center", lineSpacingMultiple: 1.2 });
  });

  // two info cards
  const iy = 4.1, ih = 2.2, iw = (CW - 0.24) / 2;
  card(s, MX, iy, iw, ih, {});
  text(s, "客観的生活リズム評価（Packに標準で含まれます）", { x: MX + 0.26, y: iy + 0.2, w: iw - 0.52, h: 0.34, fontSize: 11.5, bold: true, color: C.INK });
  text(s, "腕時計型の活動量計（アクチグラフ）と睡眠日誌により、復職前の生活リズムを約2週間、実測で評価します。印象ではなく、データに基づいて判断するためです。\n測定データを扱うのは医師のみ。会社には、勤務準備性の評価結果のみをお伝えします。", {
    x: MX + 0.26, y: iy + 0.62, w: iw - 0.52, h: ih - 0.85, fontSize: 10, lineSpacingMultiple: 1.35 });

  const x2 = MX + iw + 0.24;
  card(s, x2, iy, iw, ih, {});
  text(s, "ご担当者にお願いする作業", { x: x2 + 0.26, y: iy + 0.2, w: iw - 0.52, h: 0.34, fontSize: 11.5, bold: true, color: C.INK });
  text(s, "資料の共有と、要所での決定のみです。主治医との調整、日程調整、文書の作成、期日の管理は当事務所が行います。\n完了時には、面談記録・意見・決定の経過をまとめた記録一式（Decision Pack）をお渡しします。", {
    x: x2 + 0.26, y: iy + 0.62, w: iw - 0.52, h: ih - 0.85, fontSize: 10, lineSpacingMultiple: 1.35 });

  footer(s, 5);
}

// --------------------------------------- S6 ご契約の形
{
  const s = pptx.addSlide();
  titleBlock(s, "ご契約の形は、3つあります",
    "必要な範囲だけをご契約いただけます。月額契約がなくても、1件からご依頼いただけます。");

  const plans = [
    {
      name: "復職支援Pack", tag: "月額契約なし・1件完結", price: "150,000円", unit: "／件",
      who: "いま目の前の復職案件を\n解決したい企業に",
      items: ["主治医照会、面談3回、意見書（措置4点）", "客観的生活リズム評価を標準で含む", "人事フィードバック、記録一式の納品", "期間：復職日から3か月または措置解除まで"],
    },
    {
      name: "KIDUKI Basic", tag: "継続的な相談窓口", price: "40,000円", unit: "／月",
      who: "選任義務のない企業や、既存の\n産業医を補完したい企業に",
      items: ["月30分の相談・対応枠", "休復職・睡眠・メンタルの専門対応", "既存産業医の選任関係・法定業務はそのまま", "超過分は契約者料金（次ページ）"],
    },
    {
      name: "KIDUKI Retain", tag: "嘱託産業医", price: "100,000円", unit: "／月〜",
      who: "選任産業医として、法定業務\n全般の継続対応を求める企業に",
      items: ["定例対応 月60分〜（時間は契約範囲により設計）", "衛生委員会、巡視、面接指導ほか法定業務", "産業保健体制の継続的な把握と改善", "超過分は契約者料金（次ページ）"],
    },
  ];
  const pw = 3.84, pg = 0.2, ph = 4.14, py = 1.95;
  plans.forEach((p, i) => {
    const x = MX + i * (pw + pg);
    card(s, x, py, pw, ph, { shadow: true });
    text(s, p.name, { x: x + 0.28, y: py + 0.26, w: pw - 0.56, h: 0.34, fontSize: 14, bold: true, color: C.INK });
    text(s, p.tag, { x: x + 0.28, y: py + 0.62, w: pw - 0.56, h: 0.28, fontSize: 9.5, color: C.GOLD, bold: true });
    s.addText([
      { text: p.price, options: { fontSize: 23, bold: true, color: C.MID } },
      { text: " " + p.unit, options: { fontSize: 11, color: C.MUTED } },
    ], { x: x + 0.28, y: py + 0.95, w: pw - 0.56, h: 0.5, fontFace: BODY, align: "left", valign: "middle", margin: 0 });
    text(s, p.who, { x: x + 0.28, y: py + 1.52, w: pw - 0.56, h: 0.56, fontSize: 9.5, color: C.MUTED, lineSpacingMultiple: 1.25 });
    s.addShape(pptx.ShapeType.line, { x: x + 0.28, y: py + 2.2, w: pw - 0.56, h: 0, line: { color: C.TINT2, width: 0.75 } });
    const lines = p.items.map((it, j) => ({
      text: "・" + it, options: { fontSize: 9, breakLine: true, paraSpaceAfter: 5 },
    }));
    s.addText(lines, { x: x + 0.28, y: py + 2.34, w: pw - 0.5, h: ph - 2.5, fontFace: BODY, color: C.TEXT, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.22 });
  });

  text(s, "※ 表示価格に対する消費税・実費の取扱いは、お見積書に明記します。／同一案件での追加面談（4回目以降）は 28,000円／回です。", {
    x: MX, y: 6.28, w: CW, h: 0.3, fontSize: 9, color: C.MUTED });

  footer(s, 6);
}

// --------------------------------------- S7 料金の考え方
{
  const s = pptx.addSlide();
  titleBlock(s, "料金は、事前にすべてご提示します");

  const lx = MX, lw = 5.6;
  text(s, "月額プランには、毎月の対応時間が含まれます（Basic：月30分、Retain：月60分〜）。含まれる時間を超える業務は、右の契約者料金でご請求します。", {
    x: lx, y: 1.45, w: lw, h: 1.1, fontSize: 11, lineSpacingMultiple: 1.45 });

  text(s, "3つのお約束", { x: lx, y: 2.75, w: lw, h: 0.35, fontSize: 12.5, bold: true, color: C.INK });
  const promises = [
    "契約の前に、総額の目安をお見積りでご提示します",
    "含まれる範囲と、追加になる場合の単価を契約書に明記します",
    "追加費用が見込まれる場合は、着手の前にご連絡します",
  ];
  let pyy = 3.2;
  promises.forEach((p, i) => {
    card(s, lx, pyy, lw, 0.86, { fill: C.TINT, line: C.TINT2 });
    numCircle(s, lx + 0.2, pyy + 0.26, i + 1, { d: 0.32, size: 11 });
    text(s, p, { x: lx + 0.68, y: pyy + 0.12, w: lw - 0.9, h: 0.66, fontSize: 10.5, valign: "middle", lineSpacingMultiple: 1.25 });
    pyy += 1.02;
  });

  // right: rate table
  const rx = 6.75, rw = W - MX - rx;
  text(s, "主な業務の契約者料金（オンライン実施を基準）", { x: rx, y: 1.45, w: rw, h: 0.35, fontSize: 12.5, bold: true, color: C.INK });
  const hdr = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: C.INK } } });
  const rows = [
    [hdr("業務"), hdr("時間"), hdr("料金")],
    ["健康相談 等", "20分", "14,000円"],
    ["ストレス・その他面談", "30分", "20,000円"],
    ["復職・体調相談", "40分", "27,000円"],
    ["人事フィードバック", "15分", "10,000円"],
    ["人事フィードバック", "30分", "20,000円"],
    ["診療情報提供依頼書 等", "1通", "5,000円"],
  ];
  s.addTable(rows, {
    x: rx, y: 1.92, w: rw, colW: [3.05, 0.95, 1.55],
    fontFace: BODY, fontSize: 10.5, color: C.TEXT,
    border: { type: "solid", color: C.TINT2, pt: 0.75 },
    fill: { color: "FFFFFF" },
    align: "left", valign: "middle",
    rowH: 0.42,
    margin: [0.04, 0.08, 0.04, 0.08],
  });
  // header fill overlay handled via first-row options:
  text(s, "※ 契約者料金は、月額プラン（Basic・Retain）のご契約企業に適用される単価です。\n※ 上記にない業務・訪問を伴う業務は、個別にお見積りします。", {
    x: rx, y: 5.05, w: rw, h: 0.7, fontSize: 9, color: C.MUTED, lineSpacingMultiple: 1.35 });

  footer(s, 7);
}

// --------------------------------------- S8 記録と情報の取扱い
{
  const s = pptx.addSlide();
  titleBlock(s, "記録の管理と、健康情報の取扱い",
    "「対応した」で終わらせず、「説明できる」状態を保つこと。私たちのサービスの土台です。");

  const iy = 2.0, ih = 4.1, iw = (CW - 0.24) / 2;

  // left: case management
  card(s, MX, iy, iw, ih, {});
  text(s, "案件の進行と記録", { x: MX + 0.28, y: iy + 0.24, w: iw - 0.56, h: 0.36, fontSize: 13, bold: true, color: C.INK });
  text(s, "面談の予約から記録の保管、対応状況の追跡までを、当事務所が自社開発した産業保健の管理システム「Casetra」で行います。", {
    x: MX + 0.28, y: iy + 0.68, w: iw - 0.56, h: 0.85, fontSize: 10.5, lineSpacingMultiple: 1.35 });
  const leftItems = [
    "日程調整はシステムが行い、往復メールをなくします",
    "再評価日・フォロー時期などの期日を自動で管理します",
    "経過は案件ごとに整理され、必要な際に一式でお渡しできます",
  ];
  s.addText(leftItems.map(t => ({ text: "・" + t, options: { breakLine: true, paraSpaceAfter: 6 } })), {
    x: MX + 0.28, y: iy + 1.62, w: iw - 0.56, h: 1.5, fontFace: BODY, fontSize: 10, color: C.TEXT, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.3 });
  card(s, MX + 0.28, iy + 3.12, iw - 0.56, 0.72, { fill: C.TINT, line: C.TINT2 });
  text(s, "システムは当事務所の業務運用の一部です。貴社に追加のシステム利用料は発生しません。", {
    x: MX + 0.46, y: iy + 3.2, w: iw - 0.92, h: 0.6, fontSize: 9.5, valign: "middle", lineSpacingMultiple: 1.25, color: C.INK });

  // right: health info
  const x2 = MX + iw + 0.24;
  card(s, x2, iy, iw, ih, {});
  text(s, "健康情報の取扱い", { x: x2 + 0.28, y: iy + 0.24, w: iw - 0.56, h: 0.36, fontSize: 13, bold: true, color: C.INK });
  const rightItems = [
    "医療に関わる情報は、医師の管理下で区分して保管します",
    "会社にお伝えするのは、就業上の意見（結論）のみです",
    "情報の取得・提供は、本人の同意の範囲で行います",
    "アクセスは役割ごとに制限し、外部共有は原則行いません",
    "受診が必要な場合も、医療機関の指定・紹介は行いません。受診先はご本人が選びます",
  ];
  s.addText(rightItems.map(t => ({ text: "・" + t, options: { breakLine: true, paraSpaceAfter: 7 } })), {
    x: x2 + 0.28, y: iy + 0.72, w: iw - 0.56, h: ih - 1.0, fontFace: BODY, fontSize: 10.5, color: C.TEXT, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.35 });

  footer(s, 8);
}

// --------------------------------------- S9 FAQ
{
  const s = pptx.addSlide();
  titleBlock(s, "よくあるご質問");

  const faqs = [
    ["睡眠が専門とのことですが、通常の産業医業務も依頼できますか。",
     "はい。衛生委員会、職場巡視、健診事後措置、長時間労働者・高ストレス者の面接指導、復職支援まで、嘱託産業医の法定業務を一通りお引き受けします。"],
    ["すでに産業医がいます。休復職の対応だけを依頼できますか。",
     "できます。既存の産業医の選任関係や法定業務はそのままに、休復職・睡眠・メンタルの面談を専門的に補完します（Basic、または1件ごとのPack）。"],
    ["会社側の作業は増えませんか。",
     "増やしません。お願いするのは、窓口を1名決めていただくこと、資料の共有、要所での決定です。日程調整・文書作成・期日管理は当事務所が行います。"],
    ["従業員の健康情報は、どこまで会社に伝わりますか。",
     "就業上の意見（結論）のみをお伝えします。診断名や検査データなどの医療情報は、ご本人の同意なく会社に開示しません。"],
    ["遠方の事業場でも対応できますか。",
     "オンラインで対応します。訪問が必要な業務（職場巡視など）は、頻度と方法を契約時に取り決めます。"],
    ["記録の管理システムだけを、自社で使うことはできますか。",
     "当事務所が業務で使用しているシステム「CASETRA」は、企業向けにも提供しています。ご希望の場合は別途ご案内します（本資料のサービスとは独立した契約です）。"],
  ];
  const qw = (CW - 0.3) / 2;
  const positions = [
    [MX, 1.6], [MX, 3.25], [MX, 4.9],
    [MX + qw + 0.3, 1.6], [MX + qw + 0.3, 3.25], [MX + qw + 0.3, 4.9],
  ];
  faqs.forEach(([q, a], i) => {
    const [x, y] = positions[i];
    s.addText([
      { text: "Q. ", options: { bold: true, color: C.MID, fontSize: 11 } },
      { text: q, options: { bold: true, color: C.INK, fontSize: 11 } },
    ], { x, y, w: qw, h: 0.52, fontFace: BODY, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.2 });
    text(s, a, { x: x + 0.02, y: y + 0.56, w: qw - 0.05, h: 0.95, fontSize: 9.5, color: C.TEXT, lineSpacingMultiple: 1.3 });
  });

  footer(s, 9);
}

// --------------------------------------- S10 ご相談の流れ
{
  const s = pptx.addSlide();
  titleBlock(s, "ご相談から開始まで");

  const steps = [
    ["初回のご相談", "無料・オンライン15分", "現在の体制と、お困りの案件を伺います。その場でのご契約は不要です。"],
    ["ご提案・お見積り", "書面でご提示", "対応する範囲と概算を、書面でご提示します。ご検討はお見積りをご確認のうえで。"],
    ["ご契約・開始", "最短で当月から", "窓口・書式・進め方を整えて開始します。"],
  ];
  const pw = 3.84, pg = 0.2, ph = 2.1, py = 1.7;
  steps.forEach(([t, tag, d], i) => {
    const x = MX + i * (pw + pg);
    card(s, x, py, pw, ph, {});
    numCircle(s, x + 0.26, py + 0.28, i + 1, { d: 0.36 });
    text(s, t, { x: x + 0.78, y: py + 0.26, w: pw - 1.0, h: 0.34, fontSize: 13, bold: true, color: C.INK });
    text(s, tag, { x: x + 0.78, y: py + 0.62, w: pw - 1.0, h: 0.28, fontSize: 9, color: C.GOLD, bold: true });
    text(s, d, { x: x + 0.28, y: py + 1.02, w: pw - 0.56, h: ph - 1.2, fontSize: 10, lineSpacingMultiple: 1.32 });
  });

  s.addText("まずは、いま止まっている案件の状況をお聞かせください。", {
    x: MX, y: 4.35, w: CW, h: 0.5, fontFace: HEAD, fontSize: 16, bold: true, color: C.INK, align: "center", valign: "middle", margin: 0 });

  const cy = 5.1, chh = 1.5;
  card(s, MX + 1.6, cy, CW - 3.2, chh, { fill: C.TINT, line: C.TINT2 });
  text(s, "初回のご相談（無料）はこちらから", { x: MX + 1.6, y: cy + 0.22, w: CW - 3.2, h: 0.3, fontSize: 10.5, color: C.MUTED, align: "center" });
  text(s, "https://consult.kdkconslt-sngyouijm.com/", { x: MX + 1.6, y: cy + 0.54, w: CW - 3.2, h: 0.4, fontSize: 15, bold: true, color: C.MID, align: "center" });
  text(s, "KIDUKIコンサルティング産業医事務所（東京・新橋）　代表　宮部 大輔", { x: MX + 1.6, y: cy + 1.0, w: CW - 3.2, h: 0.3, fontSize: 9.5, color: C.MUTED, align: "center" });

  footer(s, 10);
}

pptx.writeFile({ fileName: "KIDUKI_service_guide_202608.pptx" }).then(() => console.log("KIDUKI deck written"));
