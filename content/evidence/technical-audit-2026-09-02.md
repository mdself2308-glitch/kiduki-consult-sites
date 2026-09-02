# 事務所サイト 技術面の実測レポート（2026-09-02）

- 実測日時: 2026-09-02 13:51〜13:53 JST（Lighthouse 取得時刻 2026-09-02T04:52 UTC）
- 計測方法: curl で公開HTMLを取得／ヘッドレスChrome + Lighthouse 13.4.1（モバイル設定、回線を遅くした模擬計測＝simulate、RTT 150ms・1.6Mbps）
- 書き込み: なし（本番 WordPress・consult・git には一切触っていない。書いたのはこのファイルだけ）
- 生データ: /tmp/claude-501/lh-spot.json, /tmp/claude-501/lh-consult.json, /tmp/claude-501/*.html（セッション終了で消える一時ファイル）

## 結論（先に）

1. `/inquiry/`（よくあるご質問）は **H1 が 3 つ**。ページ見出し1つ＋本文中の見出しブロック2つ。本文の2つを H2 に落とすだけで直る（WordPress の編集画面で直せる）。
2. 表示速度はどちらも遅い。復職支援ページ **Performance 59 / LCP 13.5秒**、consult トップ **Performance 56 / LCP 11.9秒**（モバイル模擬）。SEO は両方 100。
   - 復職支援ページの最大の原因は **ヘッダー背景画像が 1.68MB の PNG**（1456×832、2023年8月のファイル）。WebP にして差し替えるだけで約1.4MB 減る（Lighthouse の推定）。
   - consult トップの最大の原因は **Google Fonts の CSS（183KB、3書体・9ウェイト）が描画をブロック**していること。推定 8.0 秒分。
3. og:image は **WordPress 側の全ページ（記事・固定ページ）に無い**。consult トップだけある。子テーマで出せる。
4. Article JSON-LD の `datePublished` は **`"2026-9-1"`**（ゼロ埋めなし・タイムゾーンなし）。ISO 8601 の `2026-09-01T07:00:00+09:00` が正しい形。親テーマ（Emanon Premium）の出力なので子テーマから直接は直せない。
5. 著者アーカイブ `/author/kdk-sgj/` は **canonical が無い**（description はある）。ページ送りも `page/2/`〜`page/4/` があり、`rel=next/prev` も無い。子テーマで出せる。
6. 記事1本（夜勤・交代勤務の睡眠対策）の画像 alt 欠落: **本文内 0 件**。alt="" が 1 件（関連記事のサムネイル、装飾扱いなら問題なし）。アイキャッチ本体は本文に `<img>` として出ていない（ヘッダー背景として CSS で敷かれている）。

---

## (1) /inquiry/ の H1 構造

取得: `https://kdkconslt-sngyouijm.com/inquiry/`（259,221 バイト、HTTP 200）

| # | タグ | 中身 | 出どころ |
|---|---|---|---|
| 1 | `<h1 class="article-title">` | よくあるご質問 | テーマのページタイトル（正しい H1） |
| 2 | `<h1 class="wp-block-heading has-text-align-center">` | 産業医業務に関すること | 本文の「見出し」ブロック（レベル1） |
| 3 | `<h1 class="wp-block-heading alignfull has-text-align-center">` | KIDUKIコンサルティング産業医事務所について | 本文の「見出し」ブロック（レベル1） |

本文内の見出し構造（実測）: h1, h1, h2×1, h5×2, h6×6。h3/h4 を飛ばして h5/h6 が使われている。

**修正方針（WordPress 本文で直せる）**
- 「よくあるご質問」ページを編集画面で開き、本文中の 2 つの見出しブロック（`産業医業務に関すること`／`KIDUKIコンサルティング産業医事務所について`）のレベルを **H1 → H2** に変更する。文言・装飾クラス（epb-underline-02/03）は変えない。
- できれば同じページの h5/h6 は h3 に揃える（見出しの順番の警告をなくす）。
- 変更後の確認: `curl -s https://kdkconslt-sngyouijm.com/inquiry/ | grep -c '<h1'` が **1** になること。

## (2) Lighthouse 実測（モバイル、simulate）

### A. https://kdkconslt-sngyouijm.com/service/return-to-work-support/

| 項目 | 実測値 |
|---|---|
| Performance | **59** |
| SEO | 100 |
| Accessibility | 98 |
| LCP（一番大きい要素が出るまで） | **13.5 秒**（13,522ms） |
| CLS（ずれ） | 0 |
| TBT（操作できない時間） | 60 ms |
| FCP | 6.3 秒 |
| Speed Index | 6.4 秒 |
| サーバー応答（TTFB） | 20 ms（サーバーは速い） |
| リクエスト数／転送量 | 47 件／約 3.0 MB |

LCP 要素: `div#contents > div.article-header-full-width > div.article-header-full-width__thumbnail`（ヘッダー背景画像）。内訳: 読み込み待ち 472ms、読み込み 92ms、描画待ち 2,042ms。

改善提案 上位3つ（推定削減は Lighthouse の値）:
1. **ヘッダー背景画像を WebP に**: `/wp-content/uploads/2023/08/dm202308_IT_date_service_intricate_detail_ultra_realistic_photo_64a592d1-….png` が 1,684,069 バイト（1456×832 PNG、実測）。推定削減 **1,452 KiB**。同じ画像が `/inquiry/` のヘッダーにも使われている。
2. **描画をブロックする読み込みを減らす**: 推定 FCP 4.55 秒分。内訳（大きい順）: Google Fonts CSS 91.6KB（2,143ms）、Xserver Webフォント JS `webfonts.xserver.jp/js/xserverv3.js` 48.6KB（1,713ms、キャッシュ期限 0）、jQuery 3.7.1（1,354ms）、Emanon の style.css / style-min.css（両方読まれている 36KB+34KB）、wp-user-avatar の select2.js（21KB、フロントでは不要）。
3. **使っていない JavaScript**: 推定 521 KiB。reCAPTCHA 354KB（このページにフォームが無いのに読まれている）、gtag が 3 本（GT-5D9KJF2 ×2、288922294）で計 475KB。

その他: ロゴ `kiduki-logo-dark.webp` が表示サイズより大きい（625×67、推定 5KiB）。アクセシビリティで落ちたのは「見出しの順番」1件（フッターウィジェット `div#block-186 > h5` が全角スペースだけの空見出し）。

### B. https://consult.kdkconslt-sngyouijm.com/

| 項目 | 実測値 |
|---|---|
| Performance | **56** |
| SEO | 100 |
| Accessibility | 94 |
| LCP | **11.9 秒**（11,872ms） |
| CLS | 0 |
| TBT | 0 ms |
| FCP | 11.4 秒 |
| Speed Index | 11.4 秒 |
| サーバー応答（TTFB） | 90 ms |
| リクエスト数／転送量 | 71 件／約 1.8 MB |

LCP 要素: `section#top > div.container > div.hero-content > p.hero-tagline`（テキスト）。内訳: TTFB 255ms、描画待ち 2,576ms。画像ではなく**フォント待ち**で遅れている。

改善提案 上位3つ:
1. **Google Fonts の CSS が描画をブロック**: `fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Serif+JP:wght@500;700&family=Inter:wght@400;500;600;700&display=swap` 183,378 バイト。推定 **8,030ms**。ウェイトを減らす（例: Noto Sans JP 400/700 だけ）、`<link rel="preload" as="style">` + `media="print" onload` で非ブロック化、または unicode-range で必要な文字だけ読む。
2. **使っていない CSS 182 KiB**: 上と同じフォント CSS（ほぼ全て未使用と判定。Noto の日本語サブセットが大量に列挙されるため）。
3. **使っていない JS 76 KiB**: gtag（G-JQFWB6XG2E）192KB のうち 78KB。`async` は付いているので影響は小さい。

アクセシビリティで落ちた2件（両方 `consult/index.html` で直せる）:
- **色のコントラスト不足**: `div.footer-top > div.footer-brand > p.footer-rep > span`（「内科専門医・心療内科専門医・労働衛生コンサルタント」）。文字色 #7c8e8a／背景 #1d3a30、12.8px、比率 3.58（必要 4.5）。原因は `.footer-rep span { font-size:.8rem; opacity:.75 }`（index.html 1352行）。opacity を 1 に近づける、または文字色を明るくする。
- **`<main>` が無い**: `<header>` と `<section>` だけ。`<section class="hero" id="top">` から最後の section までを `<main>` で囲む。

注意: リポジトリの `consult/index.html` は本番と差分あり（未コミット: `.casetra-link--external` のCSSとリンク文言）。直すときはその差分と混ざらないように。

## (3) 公開HTMLの確認

### og:image の有無

| ページ | og:image | og:title 等 | twitter:card |
|---|---|---|---|
| 記事 `/night-shift-sleep-management/` | **無し** | 無し（og: / twitter: メタが 0 件） | 無し |
| 固定ページ `/service/return-to-work-support/` | **無し** | 無し | 無し |
| 固定ページ `/inquiry/` | **無し** | 無し | 無し |
| 著者 `/author/kdk-sgj/` | 無し | 無し | 無し |
| consult トップ | あり `https://consult.kdkconslt-sngyouijm.com/og-image.png`（1200×630） | あり | summary_large_image |

→ WordPress 側は OGP が丸ごと無い（Emanon Premium の OGP 設定が無効か、未設定）。記事はアイキャッチ（例: `/wp-content/uploads/2026/08/night-shift-sleep-management.webp` 1280×720）があるので、子テーマで `og:title / og:description / og:url / og:type / og:image / twitter:card` を出せる。固定ページでアイキャッチが無いものは consult の `og-image.png` を既定値にする。

### Article JSON-LD の datePublished

記事 `/night-shift-sleep-management/` の実測（1件目の `<script type="application/ld+json">`）:

```
"@type":"Article", "datePublished":"2026-9-1", "dateModified":"2026-9-1"
```

- REST API の実値: `2026-09-01T07:00:00`（`/wp-json/wp/v2/posts?per_page=3`）
- 形式は **`Y-n-j`（ゼロ埋めなし）で、時刻・タイムゾーンなし**。Google の構造化データは ISO 8601（`2026-09-01T07:00:00+09:00`）を求める。`2026-9-1` は不正確な日付と扱われる恐れがある。
- 同じ JSON-LD の `author.image` が `スクリーンショット-2024-05-24-20.34.08-150x150.png`（日本語ファイル名のスクリーンショット）。`publisher.logo` は `kiduki-logo-dark.webp`（625×67）。
- 出どころは親テーマ Emanon Premium（子テーマ functions.php に Article 出力は無い。子テーマが出しているのは ProfessionalService / WebSite / FAQPage / BreadcrumbList 側）。
- 固定ページ（rtw, inquiry）には Article は無く、BreadcrumbList（＋子テーマの ProfessionalService 等）のみ。整合している。

### 著者アーカイブ /author/kdk-sgj/

| 項目 | 実測 |
|---|---|
| HTTP | 200（リダイレクト無し） |
| `<title>` | 宮部 大輔 \| KIDUKIコンサルティング産業医事務所 |
| canonical | **無し** |
| robots | `max-image-preview:large` のみ（index 可） |
| meta description | あり（代表プロフィール） |
| H1 | `<h1 class="author-card__avatar--name">宮部 大輔` |
| 記事数／ページ送り | 1ページ 10件、`page/2/`（200）〜`page/4/` へのリンクあり。`rel=next/prev` 無し |
| JSON-LD | BreadcrumbList のみ（Person は無い。子テーマの Person は `/office/greeting/` にだけ付く設計） |

### 画像 alt（記事1本: /night-shift-sleep-management/）

| 範囲 | img 数 | alt 属性なし | alt="" |
|---|---|---|---|
| `<main>` 内 | 5 | **0** | 1（`wp-post-image` 160×160、関連記事の前後ナビのサムネイル） |
| ページ全体 | 7 | 0 | 2（上記＋フッターロゴ `kiduki-logo-light.webp`） |

- 本文内の図はなく、`<main>` 内の img は著者アバター（alt=宮部 大輔）と関連記事サムネイル 4 枚。
- alt="" の 2 枚は装飾／リンク文言が隣にあるので、アクセシビリティ上は許容範囲。ただしフッターロゴは「KIDUKIコンサルティング産業医事務所」を alt に入れた方が良い（メディアライブラリの代替テキストを入れれば直る）。
- 記事アイキャッチ（1280×720 webp）はヘッダー背景（CSS）として敷かれ、`<img>` としては出ていないので alt の対象外。

---

## (4) 直せるものの仕分け

### A. 子テーマ（kiduki-child/functions.php）で直せる

| 優先 | 内容 | 根拠の実測 | やり方（案） |
|---|---|---|---|
| 高 | **OGP / Twitter カードを全ページに出す** | WP側 og:image 0 件 | `wp_head` に og:title / og:description（既存 `kiduki_seo_meta_description` を再利用）/ og:url / og:type（記事=article、他=website）/ og:image（アイキャッチ→無ければ consult の og-image.png）/ twitter:card を出力。Emanon 側の OGP が有効化されていないか先に管理画面で確認し、二重出力を避ける |
| 高 | **著者アーカイブに canonical と rel=next/prev** | `/author/kdk-sgj/` canonical 無し、page/2〜4 あり | `wp_head` で `is_author()` のとき `get_author_posts_url()`＋ページ番号で canonical を出す。`get_next_posts_page_link` / `get_previous_posts_page_link` で next/prev |
| 中 | **フロントで不要なスクリプトを外す** | reCAPTCHA 354KB がフォームの無いページでも読まれる。wp-user-avatar の select2.js 21KB＋frontend.css 16KB（未使用100%） | `wp_enqueue_scripts` で `is_page('contact')` 以外は `wp_dequeue_script('google-recaptcha')`（CF7 は `wpcf7_load_js` フィルタでも制御可）。wp-user-avatar のフロント資材も `wp_dequeue_*` |
| 中 | **Xserver Webフォント JS を止める**（描画ブロック 1,713ms、キャッシュ 0） | `webfonts.xserver.jp/js/xserverv3.js` | サーバーパネル側の設定（Xserver「Webフォント設定」）を OFF にする。子テーマの `wp_enqueue_scripts` で dequeue も試せるが、ハンドル名は実機で確認が必要（未確認） |
| 中 | **Google Fonts を非ブロック化** | 91.6KB、2,143ms | `style_loader_tag` フィルタで `kiduki-noto-sans-jp` に `media="print" onload="this.media='all'"` を付け、`<noscript>` で通常読み込みも残す。または `wp_enqueue_style` をやめて `wp_head` で `preload as=style` を出す |
| 低 | 記事 Article JSON-LD の日付形式 | `"2026-9-1"` | 親テーマの出力を止められれば子テーマで正しい Article を出せる。ただし親のフック名（`wp_head` の優先度・関数名）は親テーマのソースが手元に無いため**未確認**。管理画面 → Emanon 設定に「構造化データ」の ON/OFF があれば、そこで止めてから子テーマで出すのが安全 |

### B. WordPress 本文（編集画面）で直せる

| 優先 | 内容 | 根拠 | やり方 |
|---|---|---|---|
| 高 | `/inquiry/` 本文の見出しブロック 2 つを **H1 → H2** | H1 が 3 つ | 上記 (1) |
| 中 | `/inquiry/` の h5/h6 を h3/h4 に | 見出しが h2 → h5 と飛ぶ | 見出しブロックのレベル変更 |
| 高 | **ヘッダー背景画像の差し替え**（`/service/return-to-work-support/`、`/inquiry/`、記事「復職面談の進め方」他） | 1,684,069 バイト PNG、推定削減 1,452KiB | 同じ絵を WebP（幅 1456 以下、品質 75 前後で 100〜200KB 目安・推定）に変換してメディアに上げ、各ページのアイキャッチを差し替える。Smush は導入済みだが PNG→WebP 変換はこのファイルに効いていない（実測: content-type image/png のまま配信） |
| 中 | ロゴのメディア代替テキスト | フッター `kiduki-logo-light.webp` alt="" | メディアライブラリで代替テキストを入れる |
| 低 | 著者アバター画像の差し替え | JSON-LD author.image が `スクリーンショット-2024-05-24-20.34.08-150x150.png` | プロフィール写真を英数字ファイル名で登録し直す（WP User Avatar） |
| 低 | フッターウィジェット `block-186` の空 h5（全角スペース） | 見出しの順番エラー | ウィジェットで空の見出しを削除、または段落に変える |

### C. 静的 consult トップ（リポジトリ `consult/index.html`。これはテーマではなく静的ファイル）

| 優先 | 内容 | 根拠 | やり方 |
|---|---|---|---|
| 高 | **Google Fonts を軽くする／非ブロック化** | 183KB、推定 8,030ms | ウェイトを絞る（Noto Sans JP 900、Noto Serif JP、Inter の実使用箇所を洗う）、`rel="preload" as="style"`＋`onload`、`<noscript>` fallback |
| 中 | `<main>` を追加 | landmark-one-main 失敗 | `section#top`〜最後の section を `<main>` で囲む |
| 中 | フッター代表肩書きの文字色 | コントラスト 3.58（要 4.5） | `.footer-rep span { opacity:.75 }` → `opacity:1` か色指定を明るく（例: `#b6d6c6`＝既存 `--color-accent-soft`。実際の比率は再計測が必要・推定） |

### D. テーマ側（親テーマ Emanon Premium／ホスティング）で直せない・触らない方がよいもの

| 内容 | 理由 |
|---|---|
| Article JSON-LD の `datePublished` を `Y-n-j` で出す親テーマの実装そのもの | 親テーマの PHP を直接書き換えると更新で消える。上記 A の方法（親の出力を止めて子で出す）か、テーマ作者への報告 |
| `style.css` と `style-min.css` の両方が読み込まれる（36KB＋34KB） | 子テーマ functions.php 13〜22 行目で親 `style.css` を明示 enqueue しているため二重。子テーマ側で `style-min.css` だけに寄せられる可能性はあるが、親がどのハンドルで何を読むかは親ソースが無く未確認。触るなら実機で崩れ確認が必要 |
| gtag が 3 本（GT-5D9KJF2 ×2、288922294）計 475KB | Site Kit／GTM の設定側。計測方針（クロスドメイン）に関わるので技術修正だけで消さない |
| Xserver Webフォント | サーバーパネル設定。子テーマから止められるか未確認 |

---

## 次にやること（提案・未実施）

1. `/inquiry/` の本文見出し 2 つを H2 に変える（編集画面。5分）。
2. ヘッダー背景 PNG（1.68MB）を WebP に変換してアイキャッチを差し替える（復職支援ページ・inquiry・同じ絵を使う記事）。
3. 子テーマに OGP 出力と著者アーカイブの canonical を追加する（コード案はこのレポートの A 表。Emanon 側の OGP 設定が OFF であることを管理画面で先に確認）。
4. contact 以外で reCAPTCHA と wp-user-avatar のフロント資材を外す（子テーマ）。
5. consult/index.html の Google Fonts を絞って非ブロック化し、`<main>` とフッター文字色を直す（リポジトリの未コミット差分と一緒に扱う）。
6. 直した後に同じ Lighthouse コマンドで再計測し、このファイルに追記する。

## 補足（未計測・未確認）

- Lighthouse は 1 回ずつの計測。回線模擬のため、実端末の体感とは差がある。
- 親テーマ Emanon Premium のソースは手元に無いため、JSON-LD と CSS 二重読み込みのフック名は未確認。
- デスクトップ設定の Lighthouse は今回未計測。
