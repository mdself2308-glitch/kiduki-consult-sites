# KIDUKI SEO owner approval → production handoff

Status: Approval gates pending  
Last verified: 2026-09-01  
Owner: 宮部 大輔  
Global production manual: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/.agents/skills/content-production/SKILL.md`  
KIDUKI project guide: `README.md`

## Purpose

承認済みのexact versionだけを、現在のWordPress状態と再照合し、バックアップ付きで反映し、公開・計測・契約成果を別々に検証する。以下の手順は承認を代替しない。承認前はdry-runとローカル検証までとする。

## Current release queue

| Queue | Exact state | Production state | Current evidence | Remaining gate |
|---|---|---|---|---|
| `スポット産業医` CTR v2 | superseded by v3 | v3に包含（個別反映しない） | payload `a3607427…016d9`、現行本文 `2030a084…02ed`、候補本文 `b64bdb23…6a0`、`masterFirstReady: true`、WordPress dry-run成功 | owner/physician approval、apply権限 |
| 12記事CTA v6 | `owner-review` | 12/12 not applied | bundle `8a376886…a34a`、未受入Pack除外、11 CTA-only＋SAS reviewed full-body 1、21:47 JST live dry-run再成功 | owner/physician approval、apply権限 |
| 単発vsPack比較記事 v3 | `tier-s-review` | WordPress post未作成 | exact候補 `207ea308…3204`、本文 `904aa236…fd6`、正本hash・CTA・禁止語検証成功 | Pack実機受入、期間説明のowner decision、owner/physician approval、作成・公開権限 |
| 50人未満ストレスチェック2028 v3 | `owner-review` | post 1555は旧本文のまま公開 | exact候補 `6bcbd35e…10bc`、候補本文 `a5a8666d…c97f`、現行raw本文 `665dff9a…f4c1` を固定 | owner/physician approval、tracking allowlist反映、apply権限 |
| 既存産業医＋専門補完記事 v1 | `owner-review` | WordPress post未作成 | exact候補 `c524ae17…34fc4`、本文 `46f87f40…aacd5`、Basic主CTA・単発副CTA、Pack除外 | owner/physician approval、作成・公開権限、post ID・公開日 |
| 産業保健案件管理記事 v1 | `owner-review` | WordPress post未作成 | exact候補 `ef7b280d…c1b7a`、本文 `33539eeb…2f54`、CASETRA主CTA・Retain副CTA、既存3記事へ工程別リンク | owner/physician approval、作成・公開権限、post ID・公開日 |
| consult→WordPress問い合わせ帰属 | local only | not deployed | 構造・runtime test成功、live/local hash不一致 | static `main` push、WordPress受信側apply、テスト問い合わせ権限 |
| consultトップ→Pack・SPOT分岐 v1 | `tier-s-review` | not applied | exact候補 `873eeba5…c931`、内部UTM除去、会社決定・産業医意見の表現修正 | CASETRA P-01/P-02 PASS、owner/physician approval、static production権限 |
| Pack・SPOT GA4プライバシー v1 | `production-approval-pending` | not deployed | exact manifest `static-lead-form-ga4-privacy-2026-09-01-v1.json`、2ファイル限定、local/live-before hash固定 | static production権限、main push、反映後live hash確認、受入試験権限 |
| Site Kit週次メール | `frequency: weekly` | `subscribed: false` | REST readback、dry-run `would_update` | 登録メールへの継続送信の明示権限 |
| SEO目標完了監査 | 19要件 | overall `not_complete` | `seo-goal-completion-audit-2026-09-01.json`、未完了11要件、verifier合格 | 承認・本番反映・公開後実測・第一者営業/契約証拠 |
| 子テーマ 検索土台 S1 | approved 2026-09-02 | **deployed 2026-09-02 09:05 JST** | `functions.php` にタイトル区切り・excerpt由来description・Organization/WebSite JSON-LD・noindex受け皿（空）。`verify:seo-hardening` 合格、`php -l` OK | S1承認、4ファイル差分確認、child deploy権限 |
| 静的トップ 構造化データ S2（＋S5 title/H1/実務記事） | approved 2026-09-02 | **deployed 2026-09-02 09:48 JST**（commit 18c76b3、live-match 合格） | 住所・設立・メール・ロゴ付き ProfessionalService と WebSite。差分patch `exact/static-home-jsonld-2026-09-02-v1.patch` | S2承認、static `main` push権限（9/1帰属ブリッジと同ファイル） |
| `スポット産業医` ページ v3（本文全文） | approved 2026-09-02 | **applied 2026-09-02 09:05 JST**（本文・title・excerpt・meta） | exact `82c8b531…`、本文 `41f35165…`、v2を包含、FAQ5問＋FAQPage、関連記事4本、`verify:spot-page-v3-binding` 合格 | owner/physician approval、apply権限。承認時はv2を個別反映しない |
| 内部リンク補強 4ページ（1030/160/162/166） | approved 2026-09-02 | **applied 2026-09-02 09:06 JST** | exact `e6097acd…`、3ページは追記のみ（検証済み）、記事ハブは latest-posts 自動一覧 | owner approval、push権限、apply後PC/スマホ目視 |
| 旧記事 noindex/統合 | approved 2026-09-02 | **deployed with S1**（noindex 19本、301 3本→/kenkoutoushi/） | `evidence/old-article-triage-2026-09-02.json`（改稿7・統合4・維持7・noindex候補19） | Search Console query×page確認、owner決定、S1と同手順で反映 |

## A. `スポット産業医` v2

### Approval object

- Exact payload: `content/exact/spot-industrial-physician-ctr-2026-09-01-v2.json`
- Exact version: `2026-09-01-v2`
- SHA-256: `a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9`
- WordPress target: page 164 `/service/return-to-work-support/`
- Approved scope: title/H1、meta、excerpt、CTAラベル、受診先選択・特定医療機関非指定/非紹介の1段落
- Not approved by this object: その他の本文、slug、status、商品・料金、公開権限

### Preflight already completed

```sh
npm run verify:spot-ctr-approval-binding
npm run wp:update-spot-ctr
```

dry-runは2026-09-01に `persistentWrites: false` で成功し、21:45 JSTにも再実行した。WordPress現行modified `2026-08-31T17:19:23`、本文SHA `2030a084…02ed`、slug/statusはlockと一致し、title/excerpt/bodyだけが差分だった。誤ったpayload SHA-256はWordPress接続前に拒否した。最新証拠は `evidence/spot-wordpress-dry-run-2026-09-01.json` に固定した。

### Apply sequence after exact approval

1. `kiduki/docs/copy/site-copy.md` にはexact v2のtitle/H1、meta、excerpt、CTA、必須境界文を「公開候補・未承認・未反映」として追記済み。公開承認とはみなさない。
2. `npm run verify:spot-ctr-approval-binding` で `masterFirstReady: true` を再確認する。
3. 同じWordPress現行modified/hashであることを `npm run wp:update-spot-ctr` で再確認する。
4. 次の承認binding付きコマンドで本文・title・excerptをバックアップ後に反映する。

```sh
npm run wp:update-spot-ctr -- --apply --backup --backup-confirmed --approved-version 2026-09-01-v2 --approval-bundle content/exact/spot-industrial-physician-ctr-2026-09-01-v2.json --approved-bundle-sha256 a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9
```

5. title/slugがexact状態になった後、Emanon metaのdry-run、バックアップ付きapplyをこの順で行う。

```sh
node kiduki/scripts/configure-seo-meta.mjs --manifest kiduki/config/seo-spot-ctr-2026-09-01-v2.json --ids 164
node kiduki/scripts/configure-seo-meta.mjs --manifest kiduki/config/seo-spot-ctr-2026-09-01-v2.json --ids 164 --apply --backup --backup-confirmed --approved-version 2026-09-01-v2 --approval-bundle content/exact/spot-industrial-physician-ctr-2026-09-01-v2.json --approved-bundle-sha256 a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9
```

6. `npm run verify:spot-ctr-live` でtitle、meta、canonical、H1 1件、必須境界文、新CTA、旧CTA不在、sitemap、旧URL redirectを確認する。
7. ログアウト相当の公開画面をPC・スマホで目視し、レイアウト、CTA、医療広告境界を確認する。
8. 反映時刻を基準に7日・28日・90日のレビュー予定を登録する。7日は配信・index、28日は同一query/page/periodのCTR、90日は問い合わせ・商談・契約まで確認する。

## B. 12記事CTA v6

### Approval object

- Exact bundle: `content/exact/article-cta-owner-review-2026-09-01-v6.json`
- Exact version: `2026-09-01-v6`
- SHA-256: `8a37688634893094c2fc0a6ba7827230dd2eba6797e9dd1183c56482bef1a34a`
- State: 12/12 `owner-review` / `not_applied`
- Supersedes: v5。Pack P-01/P-02未実施のため、公開CTAのPack表記を除外し、bundle生成時にも混入を拒否する。

### Preflight already completed

```sh
npm run verify:article-cta-approval-bundle
npm run verify:article-cta-apply-binding
npm run wp:update-article-ctas
```

### Apply sequence after exact approval

```sh
npm run wp:update-article-ctas -- --apply --backup --backup-confirmed --wordpress-apply-authority-confirmed --approved-version 2026-09-01-v6 --approval-bundle content/exact/article-cta-owner-review-2026-09-01-v6.json --approved-bundle-sha256 8a37688634893094c2fc0a6ba7827230dd2eba6797e9dd1183c56482bef1a34a --allow-reviewed-full-body
```

applyは12件すべての個別ticketで `status: approved`、`owner_decision: approved`、同一exact version/source SHA、宮部大輔、approval evidence、physician approvalを要求する。さらにexact承認とは別のWordPress本番反映権限を `--wordpress-apply-authority-confirmed` で要求する。一部だけ承認した状態ではWordPress接続前に停止する。v6ではPack CTAを復活させない。SASの `reviewed_full_body` は本文内の医療広告境界1件だけであり、`--allow-reviewed-full-body` を明示しなければ停止する。

更新ごとにWordPress APIで同じpostを再取得し、slug、status、公開日時、本文SHAを照合する。反映後は `npm run audit:article-schedule` でも12件のpost ID、publish/future、公開日時が変わっていないことを確認する。公開中の記事は公開URL、予約中の記事はWordPress edit APIのraw本文でCTA全文・href・計測属性を照合する。予約状態を公開・承認の証拠にしない。

## C. 単発vsPack比較記事 v3

この成果物はまだowner-reviewへ進めない。`content/exact/return-to-work-one-off-vs-pack-2026-09-01-v3.json` は `tier-s-review` である。公開済みpost 1809との境界、根拠のない頻度表現、執筆者表記は修正済みだが、Pack実機受入証拠と「復職後3か月／契約開始から最長6か月」の期間説明を正本で確定してからowner-reviewへ進める。

WordPress postの作成、slug確保、公開日設定、featured image、カテゴリー、7/28/90日予定は、review完了とexact owner/physician approval、作成・公開権限の後に行う。候補URLが存在する前に既存記事からリンクしない。

## D. 50人未満ストレスチェック2028 v3

### Approval object

- Exact payload: `content/exact/stresscheck-small-workplace-2028-2026-09-01-v3.json`
- Exact version: `2026-09-01-v3`
- SHA-256: `6bcbd35e962d235b7344fe0571d9e1ea3907597c78e8df725bdd19fd337610bc`
- WordPress target: post 1555 `/stresschecknew/`
- Current raw body lock: `665dff9ab33275a8f564f0f25eb47f72a92de3faa52a08f2dc5111c9b5e6f4c1`
- Candidate body: `a5a8666dcb2d0512b23b6e0796988ee9fec2652bfba86640adf400b60aeec97f`
- Approved scope after review: title/H1、meta、excerpt、full body、主CTA。slug、status、URLは変更しない。

### Preflight

```sh
npm run verify:stresscheck-2028-exact
npm run verify:stresscheck-2028-approval-binding
npm run wp:update-stresscheck-2028
```

full-bodyのapply bindingは、exact payload、候補本文、公開中の現行raw本文、post ID、slug、modifiedを一つに固定する。WordPressの本文が再編集されていれば停止する。記事のexact版が承認の正本であり、商品・責任・医療広告の3正本hashをその中で固定している。未承認の本文を `site-copy.md` へ複製しない。

2026-09-01のv2 dry-runは `persistentWrites: false` で成功した。post 1555のslug `stresschecknew`、status `publish`、modified `2026-07-28T16:27:23`、現行raw本文hashがlockと一致し、変更対象はtitle、空だったexcerpt、本文だけだった。誤ったexact SHA-256のapplyはWordPress接続前に拒否した。meta descriptionは別工程であり、未反映である。

### Apply sequence after exact approval

0. 記事本文を変える前に、公開HTMLのtracking許可リストへ `stresschecknew` が含まれる状態を作る。ローカルでは `functions.php` と `assets/js/cf7-redirect.js` の両方へ追加済みで、`npm run verify:conversion-tracking` は合格している。既存の `deploy-kiduki-child-files.mjs` は4ファイルをまとめて扱うため、実行前に全4ファイルのremote/local差分を確認し、今回の承認外の差分があれば停止する。バックアップ付き反映後、公開post HTMLに `'stresschecknew': true` があり、既存12 slugが残ることを確認する。

```sh
npm run wp:update-stresscheck-2028 -- --apply --backup --backup-confirmed --approved-version 2026-09-01-v3 --approval-bundle content/exact/stresscheck-small-workplace-2028-2026-09-01-v3.json --approved-bundle-sha256 6bcbd35e962d235b7344fe0571d9e1ea3907597c78e8df725bdd19fd337610bc
```

本文・title・excerptのreadback後、Emanon metaを同じexact bindingで反映する。

```sh
node kiduki/scripts/configure-seo-meta.mjs --manifest kiduki/config/seo-stresscheck-small-workplace-2028-2026-09-01-v3.json --ids 1555
node kiduki/scripts/configure-seo-meta.mjs --manifest kiduki/config/seo-stresscheck-small-workplace-2028-2026-09-01-v3.json --ids 1555 --apply --backup --backup-confirmed --approved-version 2026-09-01-v3 --approval-bundle content/exact/stresscheck-small-workplace-2028-2026-09-01-v3.json --approved-bundle-sha256 6bcbd35e962d235b7344fe0571d9e1ea3907597c78e8df725bdd19fd337610bc
```

`npm run verify:stresscheck-2028-live` でtitle、meta、canonical、H1 1件、2028年4月1日、施行前境界、新CTA、旧法案・旧広告表現の不在を確認する。PC・スマホを目視し、反映時刻を基準に7日・28日・90日のレビューを登録する。

## E. 新規Tier S記事 F・G

2本ともMyBrain全体のcontent-productionマニュアルに従い、1成果物1チケット、一次資料、KIDUKI商品正本、事実・安全・医療広告レビュー、exact manifestまで作成した。検索語は現時点では仮説であり、検索需要や契約成果を確認済みとは扱わない。

| Candidate | Exact / body SHA-256 | Search→offer | Current state |
|---|---|---|---|
| F `existing-industrial-physician-specialist-support` | `c524ae175125c8be963b2ed3fc1cdc2b8ffb6e8e1213db0f1bcae4e023234fc4` / `46f87f401fc660a14c7da8e51c195a351495c74eb838db4ae8c7884d79eaacd5` | `既存産業医 睡眠`（仮説）→Basic、目前の1件は単発 | owner-review / post未作成 / live dry-run slug一致0件 |
| G `occupational-health-case-management` | `ef7b280d49fa75e34013a0f540d6b4ceb00b680c4ca0ac0200abf5f6d57c1b7a` / `33539eeb60d77bce0d4229082254b883846735bfbe22f7364de6f3415ce22f54` | `産業医 意見書 管理`（仮説）→CASETRA、委託はRetain | owner-review / post未作成 / live dry-run slug一致0件 |

### 下書き作成の準備状況

- F config: `kiduki/config/seo-post-existing-industrial-physician-specialist-support-2026-09-01-v1.json`。作成時はdraft、category 45/47。
- G config: `kiduki/config/seo-post-occupational-health-case-management-2026-09-01-v1.json`。作成時はdraft、category 46/47。
- 2件ともexact payload、本文SHA、承認ticketへ拘束済み。config-only検証とWordPress live read-only dry-runに合格し、slug一致0件、`persistentWrites: false` を確認した。
- create scriptは、ticketの `status: approved`、`owner_decision: approved`、同一exact version/hash、approval evidence、physician approvalが揃うまでapplyをWordPress接続前に拒否する。下書き作成権限と公開権限も別のCLI gateである。
- apply後は作成レスポンスだけでなく、WordPress APIで同じpostを再取得し、ID、slug、draft状態、title、本文SHA、categoryを照合する。

exact版の承認証拠を各ticketへ記録し、別途「この2件のWordPress下書き作成」を許可された後だけ、次を実行する。どちらも公開ではなくdraft作成である。

```sh
npm run wp:create-existing-physician-specialist -- \
  --apply --backup --backup-confirmed --creation-authority-confirmed \
  --approved-version 2026-09-01-v1 \
  --approval-bundle content/exact/existing-industrial-physician-specialist-support-2026-09-01-v1.json \
  --approved-bundle-sha256 c524ae175125c8be963b2ed3fc1cdc2b8ffb6e8e1213db0f1bcae4e023234fc4

npm run wp:create-occupational-health-case-management -- \
  --apply --backup --backup-confirmed --creation-authority-confirmed \
  --approved-version 2026-09-01-v1 \
  --approval-bundle content/exact/occupational-health-case-management-2026-09-01-v1.json \
  --approved-bundle-sha256 ef7b280d49fa75e34013a0f540d6b4ceb00b680c4ca0ac0200abf5f6d57c1b7a
```

draft readback後にEmanon meta、featured image、既存記事との検索意図重複、内部リンク、構造化データ、PC/スマホを確認する。別の公開権限を得て実公開し、WordPress `published_at` を読み戻してから `future-article-review-plan.json` を7日・28日・90日の実日付とCalendar event IDへ更新する。仮の公開日では予定を作らない。

## F. Pack・SPOT GA4プライバシー v1

### Exact release object

- Manifest: `content/exact/static-lead-form-ga4-privacy-2026-09-01-v1.json`
- Exact version: `2026-09-01-v1`
- State: `production-approval-pending`
- Target files: `consult/return-to-work-pack/index.html`、`consult/return-to-work-spot/index.html` の2件だけ
- Excluded: `consult/index.html`、sitemap、WordPress、Casetra API/Cosmos Leads、商品・料金・同意文・予約処理

公開版は両フォームとも第一者 `lead_id` をGA4 `generate_lead` へ送っている。ローカル候補は、Casetra Leadsへの第一者保存と完了画面/予約導線でのID利用を維持したまま、GA4から `lead_id`、`support_reason`、`delivery_method` 等の相談詳細を除外し、`form_name`、`source_page`、`target_offer`、`cta_role` の集計項目だけを送る。

### Locked hashes

| Form | Live before | Local candidate |
|---|---|---|
| Pack | `32059887…33c58` | `b7879124…15ae` |
| SPOT | `ee6e14da…814ea` | `a49626fb…37de2` |

### Release sequence after production permission

```sh
npm run verify:static-lead-release
npm run verify:static-lead-release-live-before
```

2つの検証に合格し、Git差分がmanifest対象2ファイルだけのリリース単位へ分離されていることを確認してから、明示されたstatic production手順で反映する。現在の作業ツリーには他の未承認変更があるため、まとめて `main` へpushしない。

反映後は次を実行する。

```sh
npm run verify:static-lead-release-after-deploy
npm run verify:conversion-tracking
npm run test:static-contact-runtime
```

live hashがcandidateと一致し、公開イベントに第一者IDと相談詳細がないことを確認する。実フォーム送信はCasetra Leads、通知メール、GA4への外部書込みを伴うため、テストデータと送信先を確定した別の受入権限が必要である。

## G. Measurement acceptance

ローカル検証合格と本番受信を分ける。

- 現在合格: `verify:conversion-tracking`、`verify:static-lead-forms`、`test:conversion-runtime`、`test:static-contact-runtime`、`verify:static`、`test:site-kit-report`、`verify:seo-ledger-template`、`verify:casetra-leads-aggregate-template`、`verify:search-console-snapshot`
- 確認済み: 認証済みSearch Consoleの両URL-prefixを28日選択で読み取り、WordPressは実データ2026-08-02〜29で11クリック・241表示、consultは2026-08-13〜29で1クリック・16表示。プロパティと実日付範囲を分け、合算しない。
- 確認済み: GA4本体で既存 `generate_lead` 5回・2ユーザー、キーイベント指定、非PIIの6カスタムディメンション登録・読み戻し。これは実問い合わせ5件や契約を証明しない。
- 確認済み: Flamingo全5件は7月28日・31日で、GA4対象期間内は0件。GA4の5イベントを問い合わせ件数にしない。
- 確認済み: consultのPack/単発フォームはCasetra Leads保存成功後に同じ `generate_lead` を送る非Flamingo経路。公開版が第一者 `lead_id` をGA4へ送る問題はローカル修正済み・未公開。
- 確認済み: 同じ連絡先・商品では既存Lead更新でもAPI成功後に `generate_lead` が発火する。従ってLeadレコード数とイベント数を同一視せず、新規Lead、期間内最終更新Lead、成功応答を件数専用テンプレートで分ける。現在のAzure principalはApplication Insights/Cosmosともread不可で、RBAC変更・Leadレコード読取はしていない。
- 未確認: Casetra Leadsの期間別件数とGA4の一致、`article_service_click` / `service_contact_click`、登録後の流入パラメータ、Flamingo hidden fields、通知メール、WordPress/静的各フォームの受入、営業台帳、契約記録
- Site Kitのプラグイン自動コンバージョンは、独自 `generate_lead` と二重化しないことを実測するまで無効のままにする。
- WordPressテスト問い合わせは1件だけ実施し、GA4 1回、Flamingo 1件、通知メール1通、URLから内部帰属パラメータ除去、古い帰属の消去を確認する。
- 静的フォームはPackまたは単発のどちらか1件だけ受入試験し、Casetra Leads 1件、GA4 1回、通知メール1通、GA4に `lead_id` がないことを確認する。実送信は個人情報・通知を伴うため、実行直前に送信先とテストデータを確定する。

## Stop conditions

- WordPress modified、slug、status、本文hashのいずれかがdry-run時点から変わった。
- exact payload、bundle、source、candidateのSHA-256が一致しない。
- `npm run verify:spot-ctr-approval-binding` でsite-copy master-firstが成立しない。
- owner/physician approvalまたは当該production write権限が記録されていない。
- consultトップのPack分岐は、`CASETRA_TEST_COMPANY_AUDIT_SHEET_JA.md` のP-01/P-02が両方PASSになるまで反映しない。ローカル実装や一般ローンチNO-GOの解消だけでは代替しない。
- title/metaだけ、本文だけ、静的側だけなど、対になる変更の一部しか反映できない。
- post 1555を公開する時点でtracking許可リストに `stresschecknew` がなく、`kiduki-retain` の受信許可も確認できない。
- バックアップ作成、反映後readback、PC/スマホ確認のいずれかが失敗した。

停止時は現在の公開状態を維持し、公開済み・承認済み・計測済みと報告しない。

## H. 検索順位回復計画（2026-09-02）

承認シート、反映コマンド、順番は `seo-ranking-recovery-plan-2026-09-02.md` を正とする。要点だけ記す。

- S1（子テーマ）は `deploy-kiduki-child-files.mjs` の4ファイル一括反映。9/1の計測修正（`cf7-redirect.js`、`contact-thanks.js`、`functions.php` の `stresschecknew` 追加）が同時に本番へ出るため、apply前に4ファイルの remote/local 差分を確認し、承認外の差分があれば止める。
- S3（スポットv3）は `full_body_replacement`。`npm run wp:update-spot-page-v3` の dry-run で page 164 の `modified` が `2026-08-31T17:19:23`、現行本文SHAが `2030a084…02ed` のままであることを確認してから apply する。v3承認時は v2 を個別反映しない。反映後は旧URL `/service/spot/` と新URLを URL検査し、インデックス登録をリクエストする。
- S4（内部リンク）は `push-wordpress-content.mjs` を4回。dry-run で各ページの現行本文が `internal-link-pages-2026-09-02-v1.json` の baseline と一致することを確認する。
- 7日・28日・90日のレビューは既存の `seo-review-schedule.md` の物差しに乗せ、反映日時を基準日にする。
