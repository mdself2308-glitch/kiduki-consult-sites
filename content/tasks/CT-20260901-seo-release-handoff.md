---
task_id: CT-20260901-seo-release-handoff
title: KIDUKI SEO exact承認後の本番反映手順
project: kdk-wordpress
channel: internal
domain: employment
risk_tier: S
status: review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-release-handoff.md
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- `スポット産業医` v2、12記事CTA v6、新規比較記事v3、ストレスチェック記事v3、新規Tier S記事F・G、計測、Site Kitメールの承認・反映・検証境界を一つの実行手順にし、部分反映や未承認公開を防ぐ。

## Audience and action

- Audience: KIDUKI owner/physician、WordPress・SEO運用者
- Main question or job: 何が承認待ちで、承認後にどの順でdry-run、master更新、backup、apply、live verify、測定を行うか
- Desired next action: exact owner/physician approvalと対象別production権限を記録し、該当手順だけを実行する
- Non-goals: この文書自体を承認証拠にすること、未承認のWordPress更新、static push、テスト問い合わせ、メール購読を行うこと

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: `スポット産業医` v2、Packを除外した12記事CTA v6、ストレスチェック記事v3、新規記事F・Gはowner-review・未反映。F・GはWordPress post未作成。比較記事v3はPack実機受入と期間説明のowner decisionを残してTier Sレビュー中。static帰属はlocal only。Site Kitメールは未購読。
- Approved terminology: owner-review、tier-s-review、not_applied、dry-run、backup、published verification、measurement acceptance
- Constraints and boundaries: exact payload approval、production権限、公開、index、計測、契約を分ける。WordPress書込みはrepo script、dry-run、backup、readbackを必須とする。static main pushは別権限。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/README.md | 2026-09-01 | グローバル制作マニュアルのKIDUKI適用、承認・公開境界 | 個別owner approval |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/spot-industrial-physician-ctr-2026-09-01-v2.json | 2026-09-01 | page 164 exact v2文字列 | owner approval、公開成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/article-cta-owner-review-2026-09-01-v6.json | 2026-09-01 | 12記事CTA exact v6、未受入Pack除外 | owner approval、公開成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/return-to-work-one-off-vs-pack-2026-09-01-v3.json | 2026-09-01 | 新規比較記事exact候補とレビュー状態 | Pack実機受入、期間説明の正本確定、owner approval、WordPress post |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/stresscheck-small-workplace-2028-2026-09-01-v3.json | 2026-09-01 | post 1555の法令・医療・医療広告Tier S再レビュー済みexact候補 | owner/physician approval、公開成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/existing-industrial-physician-specialist-support-2026-09-01-v1.json | 2026-09-01 | FのTier S exact、Basic主CTA、単発副CTA、未作成状態 | 検索需要、owner/physician approval、WordPress post、公開成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/occupational-health-case-management-2026-09-01-v1.json | 2026-09-01 | GのTier S exact、CASETRA主CTA、Retain副CTA、未作成状態 | 検索需要、owner/physician approval、WordPress post、公開成果 |
| WordPress dry-run / public HTML / Site Kit | 2026-09-01 | 現行modified・hash・title・meta、246表示、10クリック、9検索訪問、主要イベント0、メール未購読 | Search Console query×page、GA4実受信、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/measurement-live-audit-2026-09-01.json | 2026-09-01 | GA4本体のgenerate_lead受信・キー指定・6カスタムディメンション、両Search Console URL-prefix、Flamingoの期間別件数、匿名公開タグ | 個別問い合わせ内容との一致、発火源、商談、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/search-console-dual-property-snapshot-2026-09-01.json | 2026-09-01 | 認証済みSearch Consoleの両URL-prefix・28日選択、実日付範囲、query×page、consultページ別値 | 問い合わせ、商談、契約、自動取得 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/spot-wordpress-dry-run-2026-09-01.json | 2026-09-01 | page 164の21:45 JST live baseline lock一致、候補差分、persistentWrites false | owner approval、apply、公開、検索成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/article-cta-wordpress-dry-run-2026-09-01.json | 2026-09-01 | 12記事の21:47 JST live baseline、公開1・予約11、11 CTA-only＋SAS full-body 1、書込み0 | owner/physician approval、apply、公開、検索成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/static-lead-form-ga4-privacy-2026-09-01-v1.json | 2026-09-01 | Pack・SPOTの2ファイル限定GA4 privacy release、live-before/local-candidate hash | production approval、公開成果、実フォーム受入 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/consult-home-pack-spot-links-2026-09-01-v1.json | 2026-09-01 | consultトップ2分岐のTier S候補、非PII計測、P-01/P-02停止ゲート | P-01/P-02 PASS、owner/physician approval、公開成果 |
| /Users/dmmac/casetra_active/docs/operations/CASETRA_PRETEST_LAUNCH_STATUS_2026-08-25.md / CASETRA_TEST_COMPANY_AUDIT_SHEET_JA.md | 2026-09-01 | 最新記録の一般ローンチNO-GOとPack P-01/P-02未実施 | 将来のPASS、公開権限 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/seo-goal-completion-audit-2026-09-01.json | 2026-09-01 | 目標19要件、overall not_complete、未完了11要件、阻害ゲート | 将来の承認・本番反映・公開後成果 |

### Unresolved points

- owner/physician approvalと各production write権限は未記録。
- WordPress用・consult用Search Consoleのライブ実測、GA4の既存 `generate_lead` 受信とキー指定、Flamingoの期間不一致、consult Pack/単発の非Flamingo経路は確認済み。Casetra Leadsの期間別件数、GA4不一致イベントの確定発生源、登録後の導線パラメータ受信、WordPress/静的各フォームの受入、両プロパティ自動取得、営業台帳は未確認。
- site-copy masterにはスポットv2 exactを「公開候補・未承認・未反映」として追記し、`masterFirstReady: true` を確認した。これはowner approvalや公開権限ではない。
- consultトップのPack/単発2分岐はTier S候補まで作成したが、最新のCASETRA記録では一般ローンチNO-GOかつPack P-01/P-02が未実施である。候補から内部UTMを除去して自然検索帰属を保全したが、P-01/P-02 PASSまで公開キューへ進めない。

## Outline

1. リリースキューと状態を分ける
2. スポットv2のmaster-first・本文・meta・live verifyを固定する
3. 12記事CTA v6のapply、Pack停止ゲート、予約状態非変更を固定する
4. 新規記事の未完了Tier Sゲートを明示する
5. GA4・Flamingo・台帳の本番受入と停止条件を定める

## Draft requirements

- Voice: 実行時に状態を誤認しない内部runbook。コマンド、対象、hash、停止条件を具体化する。
- Required points: exact version、SHA-256、master-first、dry-run、backup、readback、PC/スマホ、7/28/90日、計測受入
- Forbidden claims or wording: approved、applied、published、measured、contractedの未確認断定
- Channel limits: 内部用。公開コンテンツではない。承認証拠ではない。
- CTA or next action: owner/physician approvalと対象別production権限を記録する

## Review plan

- Source and fact reviewer: exact payload、manifest、WordPress dry-run、package commandの照合
- Safety or compliance reviewer: master-first、医療広告、部分反映、production権限、個人情報・メール送信境界
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | spot apply | exact文字列と候補本文の結合、master-first、meta反映が別々で、部分反映の余地があった | exact v2、旧release script、site-copy | exact/source/candidate hash binding、masterFirstReady、content→meta→live verify順を強制 | accepted / repaired locally |
| High | comparison article | 初稿作成だけでは既存process記事との論理・検索意図重複が残る | public post 1809 / comparison draft | 全工程と外部依頼範囲を分け、内部リンクとexact candidateへ固定。Tier S再レビュー後もPack実機受入と期間説明を公開ゲートとして残す | accepted / repaired locally; product gates pending |
| High | stresscheck article | 公開post 1555は法案段階の旧情報で、v1候補にも集団分析の2027年施行日、産業医選任要件、同意確認時期が不足 | 公開post 1555 / MHLW現行一次資料 / exact v1 | Tier S再レビューでv2へ修正し、現行remote hashを維持したread-only dry-runで再拘束 | accepted / repaired locally; owner approval pending |
| Medium | old content | 公開37記事に現行非目標の個人向け・広範記事が残る | WordPress public posts API | GSC取得前に一括削除せず、1記事1チケットで改稿・統合・維持・noindexを判断 | accepted / queued |
| High | static form analytics | Pack・SPOT公開版が第一者lead_idをGA4へ送信し、他の未承認static変更と同じworktreeにある | 公開HTML、local candidate、exact privacy manifest | 第一者IDと相談詳細を除外し、2ファイル限定hash manifestとpre/post deploy verifierで分離 | repaired locally; production pending |
| High | consultトップPack分岐 | 内部UTMがOrganic Search帰属を上書きし、PackはP-01/P-02未実施のまま目立つ導線になる | Tier S candidate review、CASETRA launch/audit records | clean URLと非PIIクリックイベントへ修正し、P-01/P-02 PASSまで公開停止 | repaired locally / product acceptance pending |
| Blocker | 12記事CTA v5 | 未受入Packを7件のtarget offerと2件の公開CTAで明示したままowner-reviewへ進んでいた | v5 bundle、pricing正本、CASETRA P-01/P-02未実施 | Packを除外したv6を作り、生成・owner review検証で混入を拒否 | accepted / repaired in v6 / v5 superseded |
| High | KIDUKI project content guide | 共通マニュアルのKIDUKI適用正本に、Packを現行1件商品・4記事の導線とする旧記載、および静的トップから商用ページへのリンクがないという旧監査結果が残っていた | `content/README.md`、CTA v6、CASETRA P-01/P-02、2026-09-01 21:10 JST live再確認 | 現行単発/Basic/Retain/CASETRA導線と実リンク状態へ修正し、Pack旧導線の再混入を `verify:seo-content-map` で拒否 | accepted / repaired locally |
| High | 12記事CTA反映runbook | bundle hashとplan照合はあるが、12個別ticketのapproval evidence、別のWordPress反映権限、POST後の独立GET readbackがapplyの必須条件ではなかった | content-production状態境界、CTA v6、WordPress update script | 個別ticket 12/12と別権限flagを接続前gateにし、各postを更新後にAPI再取得 | accepted / repaired locally; approval pending |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-release-handoff.md`
- Automated checks: content task validator、`verify:seo-owner-review`、`verify:seo-goal-completion-audit`、`verify:article-cta-approval-bundle`、`verify:article-cta-apply-binding`、`verify:article-cta-wordpress-dry-run-evidence`、`verify:spot-ctr-approval-binding`、`verify:spot-wordpress-dry-run-evidence`、`verify:return-to-work-comparison-exact`、`verify:stresscheck-2028-exact`、`verify:stresscheck-2028-approval-binding`、`verify:existing-physician-specialist-exact`、`verify:occupational-health-case-management-exact`、`verify:existing-physician-specialist-create`、`verify:occupational-health-case-management-create`、`verify:future-article-review-plan`、`verify:seo-content-map`、`verify:search-console-snapshot`、`verify:consult-home-service-paths`、`verify:static-lead-release`、`verify:static-lead-release-live-before`、`verify:casetra-leads-aggregate-template`、WordPress live read-only dry-run、article schedule audit、`git diff --check`。12記事CTAは別権限なし・個別ticket承認なしのnegative applyが接続前拒否、成功時のpost別GET readbackをコード確認
- Human approval:
- Schedule record: 既存週次・月次、12記事36件。F・Gは `future-article-review-plan.json` の週次キューへ追加し、実公開readback待ちのためone-offは0件。スポット変更・新規記事は実際の反映/公開後に7/28/90日を追加
- Published verification: なし。全対象で今回のproduction writeは未実施
- Measurement source and period: Site Kit過去28日を2026-09-01 19:03 JST、GA4本体を同日19:50 JSTまでに確認。認証済みSearch Consoleは21:35 JSTに両URL-prefixを28日選択で再取得し、WordPress実データ2026-08-02〜29、consult実データ2026-08-13〜29として別表・非合算で保持する。
- Remaining gates: 文書記載の対象別approval・production権限・反映後受入

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | 複数のSEO改善が別々の承認・反映ゲートに達したためrunbook ticket作成 |
| 2026-09-01 | backlog | review | exact hash、master-first、apply順、live verify、測定受入、停止条件を統合。未承認・未公開 |
| 2026-09-01 | review | review | スポット産業医v2のexact copyをsite-copy masterへ公開候補・未承認・未反映として先行記録し、`masterFirstReady: true` を確認。正本hashに依存する比較記事・ストレスチェック記事をv3へ再拘束 |
| 2026-09-01 | review | review | consultトップ2分岐をTier S再レビューし、内部UTMと決定境界を修正。最新CASETRA受入記録でP-01/P-02未実施を確認し、Pack導線を公開停止のままexact候補へ固定。Casetra件数専用テンプレートも追加 |
| 2026-09-01 | review | review | v5の未受入Pack混入をBlockerとしてv6へ修正。12件のWordPress baselineと予約日時、static live-beforeを20:37 JSTにread-only再確認し、A〜Cのexact判断資料を作成。未公開 |
| 2026-09-01 | review | review | 全体content-productionマニュアルに従う新規Tier S記事F・Gをexact v1へ固定し、owner-review・post未作成としてリリースキューと週次レビューへ追加。作成・公開権限はexact承認と分離 |
| 2026-09-01 | review | review | F・Gの下書き作成configをexact payload・本文SHA・承認ticketへ拘束。WordPress live dry-runでslug一致0件、draft、category、書込み0を2/2確認し、owner/physician承認未記録のapply拒否とAPI readback検証を実装。実公開時刻待ちの7/28/90日計画も検証済み |
| 2026-09-01 | review | review | KIDUKI適用正本に残った旧Pack導線4件と旧内部リンク監査記述を、CTA v6・P-01/P-02未実施・live再確認結果へ修正。今後の旧記載再混入をSEO content map verifierで停止する |
| 2026-09-01 | review | review | 12記事CTA v6をlive再dry-runし、11 CTA-only＋SAS full-body 1、書込み0を確認。12個別ticketの承認証拠と別のWordPress反映権限がないapplyを接続前拒否し、更新後post別API readbackを必須化 |
| 2026-09-01 | review | review | 認証済みSearch Consoleで両URL-prefixの28日選択を再取得し、実日付範囲・query×page・consultページ別値を構造化JSONとverifierへ固定。再クロールは認証待ちではなくexact本番反映後の操作とした |
| 2026-09-01 | review | review | page 164のlive dry-runを21:45 JSTに再実行。modified・slug・status・現行本文SHAのlock一致、候補差分、書込み0を構造化証拠とverifierへ固定 |
| 2026-09-01 | review | review | 12記事CTA v6のlive dry-runを21:47 JSTに再実行。公開1・予約11のID・status・日時を維持し、11 CTA-only＋SAS full-body 1、書込み0を構造化証拠とverifierへ固定 |
| 2026-09-01 | review | review | SEO目標を19要件へ分解した完了監査を追加。overall not_complete、未完了11要件を維持し、承認・本番権限・公開後計測・問い合わせ・商談・契約証拠が揃うまで完了扱いを拒否 |
