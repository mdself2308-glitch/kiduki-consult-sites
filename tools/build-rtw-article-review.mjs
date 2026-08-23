import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(
  await readFile(resolve(root, 'kiduki/config/seo-content-review-2026-08-17.json'), 'utf8'),
);
const publishedSlug = 'return-to-work-interview-process-roles';
const articles = config.newDraftPosts.filter(({ slug }) => slug !== publishedSlug);
const output = resolve(root, 'reports/kiduki-rtw-article-review-pack-2026-08-23.html');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const renderedArticles = [];
for (const [index, article] of articles.entries()) {
  const body = await readFile(resolve(root, article.source), 'utf8');
  renderedArticles.push(`
    <article id="article-${index + 1}" class="article-card">
      <header class="article-header">
        <p class="article-number">ARTICLE ${String(index + 1).padStart(2, '0')}</p>
        <h2>${escapeHtml(article.title)}</h2>
        <dl class="meta-grid">
          <div><dt>狙う検索意図</dt><dd>${escapeHtml(article.searchIntent)}</dd></div>
          <div><dt>公開予定URL</dt><dd>/${escapeHtml(article.slug)}/</dd></div>
          <div class="wide"><dt>meta description</dt><dd>${escapeHtml(article.metaDescription)}</dd></div>
        </dl>
      </header>
      <section class="wordpress-preview">${body}</section>
      <footer class="review-check">
        <strong>監修チェック</strong>
        <span>□ 医学的表現</span><span>□ 実務フロー</span><span>□ 対応範囲</span><span>□ CTA</span>
      </footer>
    </article>`);
}

const nav = articles
  .map(
    (article, index) =>
      `<a href="#article-${index + 1}"><span>${String(index + 1).padStart(2, '0')}</span>${escapeHtml(article.title)}</a>`,
  )
  .join('');

const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KIDUKI 復職支援記事6本 監修用完成稿</title>
  <style>
    :root { --ink:#16231f; --green:#1f4b3d; --green2:#3f7a5e; --pale:#eef5f1; --line:#d8e4dd; --gold:#b9832f; --paper:#fbfcfb; }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; overflow-x:hidden; color:var(--ink); background:#e8efeb; font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic",sans-serif; line-height:1.8; }
    a { color:#1c6a50; text-underline-offset:3px; }
    .hero { background:linear-gradient(135deg,#173a30,#2f6551); color:white; padding:72px max(6vw,24px); }
    .hero-inner { max-width:1120px; margin:auto; }
    .eyebrow,.article-number { font-size:12px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
    .hero h1 { max-width:900px; margin:12px 0 20px; font-size:clamp(36px,6vw,66px); line-height:1.18; }
    .hero p { max-width:850px; margin:0; font-size:17px; }
    .notice { margin-top:28px; padding:16px 18px; border:1px solid rgba(255,255,255,.34); border-radius:12px; background:rgba(255,255,255,.08); }
    .layout { display:grid; grid-template-columns:280px minmax(0,1fr); gap:28px; max-width:1280px; margin:32px auto; padding:0 24px 80px; align-items:start; }
    nav { position:sticky; top:18px; padding:18px; border-radius:16px; background:white; box-shadow:0 8px 26px rgba(18,49,39,.08); }
    nav h2 { margin:0 0 10px; font-size:16px; }
    nav a { display:grid; grid-template-columns:30px minmax(0,1fr); gap:7px; padding:10px 4px; color:var(--ink); font-size:13px; line-height:1.45; text-decoration:none; overflow-wrap:anywhere; border-top:1px solid var(--line); }
    nav a span { color:var(--green2); font-weight:800; }
    main { min-width:0; }
    .article-card { margin-bottom:36px; overflow:hidden; background:white; border-radius:18px; box-shadow:0 10px 34px rgba(18,49,39,.09); }
    .article-header { padding:34px 42px 28px; color:white; background:var(--green); }
    .article-header h2 { margin:5px 0 20px; font-size:clamp(28px,4vw,42px); line-height:1.35; overflow-wrap:anywhere; }
    .article-number { margin:0; color:#b9d6ca; }
    .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 24px; margin:0; }
    .meta-grid div { padding-top:9px; border-top:1px solid rgba(255,255,255,.24); }
    .meta-grid .wide { grid-column:1/-1; }
    dt { font-size:11px; font-weight:800; letter-spacing:.08em; color:#b9d6ca; }
    dd { margin:2px 0 0; min-width:0; font-size:13px; overflow-wrap:anywhere; }
    .wordpress-preview { padding:42px; background:var(--paper); }
    .wordpress-preview > .wp-block-group { max-width:800px; margin:auto; }
    .wordpress-preview h2 { margin:2.3em 0 .55em; padding-bottom:.4em; font-size:27px; line-height:1.4; border-bottom:2px solid var(--line); }
    .wordpress-preview h3 { font-size:20px; }
    .wordpress-preview p { margin:1em 0; }
    .kdk-article-lead { margin-top:0 !important; padding:20px 22px; font-size:18px; font-weight:650; background:#e7f1ec; border-left:5px solid var(--green2); }
    .kdk-summary-box,.kdk-boundary-box { margin:26px 0; padding:18px 22px; border-radius:12px; }
    .kdk-summary-box { background:#edf5f1; border:1px solid #c9ddd2; }
    .kdk-boundary-box { background:#fff7e8; border:1px solid #ead3aa; }
    .kdk-summary-box h2 { margin:0 0 .6em; padding:0; font-size:21px; border:0; }
    ul,ol { padding-left:1.35em; }
    li { margin:.45em 0; }
    table { width:100%; border-collapse:collapse; font-size:14px; background:white; }
    th,td { padding:11px 12px; text-align:left; vertical-align:top; border:1px solid #cfdcd5; }
    th { background:#e2eee8; }
    .wp-block-columns { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; }
    .kdk-service-card { padding:16px; border:1px solid var(--line); border-radius:10px; background:white; }
    .wp-block-buttons { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin:26px 0 4px; }
    .wp-block-button__link { display:inline-block; padding:12px 18px; color:white; font-weight:800; text-decoration:none; border-radius:999px; background:var(--green2); }
    .is-style-outline .wp-block-button__link { color:var(--green); background:white; border:2px solid var(--green2); }
    .review-check { display:flex; flex-wrap:wrap; gap:12px 20px; padding:16px 42px; font-size:13px; color:#29463d; background:#dfeae4; }
    @media (max-width:900px) { .layout { grid-template-columns:minmax(0,1fr); } nav { position:static; min-width:0; } }
    @media (max-width:640px) { .hero { padding:48px 22px; } .hero h1 { font-size:38px; } .hero p,.notice { overflow-wrap:anywhere; } .layout { padding:0 12px 56px; } .article-header,.wordpress-preview { padding:26px 20px; } .meta-grid { grid-template-columns:minmax(0,1fr); } .meta-grid .wide { grid-column:auto; } table { display:block; max-width:100%; overflow-x:auto; } .review-check { padding:14px 20px; } }
  </style>
</head>
<body>
  <header class="hero">
    <div class="hero-inner">
      <p class="eyebrow">KIDUKI / RETURN-TO-WORK SEO CLUSTER / MEDICAL REVIEW</p>
      <h1>復職支援記事6本<br>監修用完成稿</h1>
      <p>企業担当者の検索意図に直接答え、制度説明だけで終わらず、会社の次の行動とKIDUKIの適切な入口までつなげた原稿です。</p>
      <div class="notice"><strong>現在の状態：</strong>ローカル原稿。WordPress未登録・未公開です。医学的表現、実務フロー、対応範囲、CTAをご確認ください。記事内にPackの価格は記載していません。</div>
    </div>
  </header>
  <div class="layout">
    <nav aria-label="記事一覧"><h2>監修対象 6本</h2>${nav}</nav>
    <main>${renderedArticles.join('\n')}</main>
  </div>
</body>
</html>`;

await mkdir(dirname(output), { recursive: true });
await writeFile(output, html, 'utf8');
console.log(JSON.stringify({ ok: true, output, articles: articles.length, bytes: Buffer.byteLength(html) }, null, 2));
