---
task_id: CT-20260901-seo-review-schedule
title: KIDUKI SEO継続レビュー日程
project: kdk-wordpress
channel: internal
domain: general
risk_tier: A
status: review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-02
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-review-schedule.md
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- 各記事の公開後7日・28日・90日と週次・月次のSEOレビューを定義し、順位だけでなく問い合わせ・契約まで継続改善する。

## Audience and action

- Audience: KIDUKIの経営者、SEO・WordPress・コンテンツ運用者
- Main question or job: いつ何を測り、どの症状なら記事・CTA・サービス・営業のどこを直すか決める
- Desired next action: 週次・月次レビューで優先修正を3件以内に絞り、個別チケットへ起票する
- Non-goals: 順位保証、データ不足での成功/失敗断定、無承認の自動公開・自動改稿

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 2026-09-01時点で12記事中1本公開、11本予約。Site Kit過去28日間は246表示、10クリック、9検索訪問、主要イベント0だが、GA4本体では `generate_lead` 5回・2ユーザー、キーイベント1回を確認した。
- Approved terminology: published、scheduled、indexed、clicked、lead、contractedを分離する
- Constraints and boundaries: Search ConsoleはWordPress用とconsult用の2つのURL-prefixを同期間・別表で扱う。Tier S改稿はexact versionの承認後にのみ公開する。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/README.md | 2026-09-01 | 制作状態と測定境界 | 自動化の実行履歴 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-contract-funnel.md | 2026-09-01 | 検索語、着地、商品、契約導線 | 今後の実測結果 |
| Site Kit dashboard / Search Console URL-prefix `https://kdkconslt-sngyouijm.com/` | 2026-09-01 | 初期測定値と上位クエリCTR | consultサブドメイン、契約実績 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/measurement-live-audit-2026-09-01.json | 2026-09-01 | consult用URL-prefix、GA4イベント・キー指定・カスタムディメンション、Flamingo期間別件数、匿名公開タグ | 個別問い合わせ内容との一致、発火源、商談、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/search-console-dual-property-snapshot-2026-09-01.json | 2026-09-01 | 両URL-prefixの28日選択、プロパティ別実日付範囲、query×page、consultページ別値 | 自動取得、問い合わせ、商談、契約 |
| [Google Site Kit REST_Email_Reporting_Controller.php](https://github.com/google/site-kit-wp/blob/develop/includes/Core/User/REST_Email_Reporting_Controller.php) | 2026-09-01 | ユーザー別メールレポート設定のREST routeとschema | KIDUKIでの実購読、送信先、配信実績 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-article-review-calendar.json | 2026-09-02 | 12記事36件の7日・28日・90日ローカル日付、slug、milestone | 実レビュー結果、検索成果。Google event項目は履歴のみ |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/seo-goal-completion-audit-2026-09-01.json | 2026-09-01 | 目標19要件、overall not_complete、未完了11要件、証拠境界 | 将来の承認・公開・計測・契約成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/.agents/skills/content-production/SKILL.md | 2026-09-02 | 全Project共通の制作、Tier、状態、承認境界 | KIDUKI固有の商品・検索実測 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/codex-seo-automation-schedule-2026-09-02.json | 2026-09-02 | Codex日次・週次・月次automationの構成、時刻、権限境界 | 各回が実行済みであること、順位上昇 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/seo-milestone-review-ledger.json | 2026-09-02 | 7日・28日・90日の処理状態と再試行境界 | 将来の実レビュー結果 |

### Unresolved points

- Codexのローカルcontrol planeへ日次・週次・月次の3本を `ACTIVE` で定義した。Google Calendarは運用正本にせず、既存予定も自動化の入力に使わない。
- Site Kitのメールレポート設定をREST readbackし、`subscribed: false`、`frequency: weekly` を確認した。安全スクリプトのdry-runは `would_update` だが、登録メールアドレスへの継続送信に対する明示権限がないためapplyしていない。
- Search Console本体で `スポット産業医` と `産業医 スポット` の表示・クリック・CTR・平均順位・表示ページを取得済み。先行期間2026-08-05〜31の端末別も取得済みだが、新しい28日選択2026-08-02〜29と同期間の端末別は未取得。21:42 JSTの補完時に対象権限のあるChromeセッションが期限切れ、別セッションはプロパティ権限なしだった。旧URL `/service/spot/` から新URLへのquery×page移行と同期間端末別は継続確認が必要。
- Application Password経由のSite Kit監査はサイト接続を確認できるが、Site Kit OAuthは未認証となり、クエリ×ページの自動取得は403。ブラウザのSite Kit表示値と別の認証境界である。
- Chromeの既存Googleセッションでは21:35 JSTにSearch Console本体を認証済みで読取でき、両URL-prefixの28日選択を構造化証拠へ固定した。21:42 JSTにはそのセッションが期限切れとなった。これはApplication Password経由の自動取得403を解消するものではない。

## Outline

1. 公開後24時間・7日・28日・90日の確認項目
2. 週次・月次のレビュー日程
3. 現在の測定ベースライン
4. 症状別の修正判断
5. 公開・承認の境界

## Draft requirements

- Voice: 実行者が迷わない内部運用文書。日付、状態、証拠、次の判断を具体化する。
- Required points: cadence、evidence、decision rules、approval boundary、current baseline
- Forbidden claims or wording: 未実行レビューを実行済みとすること、順位保証、公開済みの推測、主要イベント0を実問い合わせ0と断定
- Channel limits: 内部用。患者・企業向けの公開コンテンツではない。
- CTA or next action: 週次・月次レビューの実行手段を接続し、最初にスポット産業医の低CTRを調べる。

## Review plan

- Source and fact reviewer: Site Kit、WordPress、content tasks、契約記録の同期間照合
- Safety or compliance reviewer: 状態・承認境界の確認
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
| High | 目標完了判定 | 予定、dry-run、GA4イベント受信をまとめてSEO完了と扱う余地があった | active objective、各CT ticket、Search Console/GA4/WordPress evidence | 19要件へ分解し、承認・公開・post-publish・inquiry・sales・contractを個別状態にする | accepted / completion audit verified / overall not_complete |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-review-schedule.md`
- Automated checks: `npm run audit:article-schedule`（WordPress 12/12一致）、`npm run verify:seo-automation-schedule`（Codex 3/3 ACTIVE、Asia/Tokyo、Google Calendar非依存）、`npm run verify:future-article-review-plan`（F・G 2/2、公開時刻未設定を確認）、`npm run verify:search-console-snapshot`、`npm run verify:seo-goal-completion-audit`、content task validator
- Human approval:
- Schedule record: Codex `kiduki-seo-milestone-review`（毎日07:30 JST）、`kiduki-seo-growth-loop`（毎週月曜08:00 JST）、`kiduki-seo-monthly-funnel-review`（毎月1日08:30 JST）を `ACTIVE` で定義。12記事36件はローカルmanifestの日付で処理し、F・Gは実published_at待ち。Google Calendar予定は運用正本ではない
- Published verification:
- Measurement source and period: Site Kit 2026-08-05〜09-01。認証済みSearch Console 28日選択はWordPress実データ2026-08-02〜29、consult実データ2026-08-13〜29。別表・非合算
- Remaining gates: 実レビューの継続実行、対象権限のあるSearch Consoleへの再ログイン、新28日選択と同期間の端末別、両Search Consoleのクエリ×ページ自動取得、Casetra Leads期間別件数、GA4不一致イベントの確定発生源、登録後GA4パラメータ受信、静的フォームID除外の本番反映、Site Kit週次メール購読の明示権限、F・Gのexact承認と別の作成・公開権限、owner approval

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | Ticket created |
| 2026-09-01 | backlog | review | 継続レビュー日程と判断基準を作成。自動実行は未作成 |
| 2026-09-01 | review | review | 週次・月次のGoogle Calendar定期予定を作成。予定はレビュー用であり、自動公開・自動承認は行わない |
| 2026-09-01 | review | review | Google Calendar APIで両定期予定を再確認し、週次に監査コマンド・証拠境界・Tier S承認、月次に両プロパティ・スポット産業医・契約導線の手順を追記。Site Kit週次メールはクリック座標エラーで未成立、Search Console本体はGoogleログイン待ち、Application Password監査はSite Kit OAuth未認証で403と記録 |
| 2026-09-01 | review | review | WordPressの12記事ID・slug・status・日時を監査し12/12一致。公開7日・28日・90日のGoogle Calendar予定36件を登録し、API readbackで36/36一致。中央manifestと各記事チケットへevent IDを記録 |
| 2026-09-01 | review | review | 18:09 JSTのSite Kit表示を再確認し、過去28日は246表示、10クリック、検索訪問9、主要イベント0、スポット産業医CTR 1.89%。メール設定はRESTで未購読・weeklyを確認し、dry-runだけ実施。継続送信の明示権限がないためapplyせず |
| 2026-09-01 | review | review | 19:03 JSTにログイン済みSite Kitで同じ過去28日値を再確認。Search Console本体は別ログイン要求のため認証情報へ触れず停止し、クエリ×ページ・平均順位・端末別を未取得として維持 |
| 2026-09-01 | review | review | 19:09 JSTに既存GoogleログインでSearch Console本体を確認。`スポット産業医` は53表示・1クリック・平均順位26.2、`産業医 スポット` は94表示・0クリック・平均順位26.9、いずれも旧URL `/service/spot/`。新URLはインデックス登録済みで、公開後の再クロールとURL移行をレビュー項目へ追加 |
| 2026-09-01 | review | review | GA4本体で `generate_lead` 5回・2ユーザー、キーイベント1回とキー指定を確認し、導線用6カスタムディメンションを登録・読み戻し。実問い合わせとの照合は未完了 |
| 2026-09-01 | review | review | consult専用Search Console URL-prefixを確認。3か月選択は1クリック・16表示・CTR 6.3%・平均順位8.4で、WordPress側と同期間・別表の定期レビューへ更新 |
| 2026-09-01 | review | review | Flamingo全5件は7月28日・31日でGA4期間内0件と確認。GA4のgenerate_lead 5回を実問い合わせに数えず、発生源の診断を週次キューへ追加 |
| 2026-09-01 | review | review | MyBrain全体のcontent-productionマニュアルに従って作成したF・GのTier S exact候補を週次キューへ追加。post未作成のため、公開7/28/90日予定は作成・公開権限と公開時刻の確定後に追加する |
| 2026-09-01 | review | review | F・Gのexact SHA、作成config、検索仮説、主副着地、7/28/90日指標を `future-article-review-plan.json` へ固定。実公開のWordPress readback前は日付・event IDを空のままにするverifierが合格 |
| 2026-09-01 | review | review | 認証済みSearch Consoleで両URL-prefixを28日選択へそろえて取得。WordPressは実データ2026-08-02〜29で11クリック・241表示、consultは2026-08-13〜29で1クリック・16表示。別表・非合算とし、JSON証拠とverifierへ固定 |
| 2026-09-01 | review | review | 先行期間2026-08-05〜31の端末別は既存正本で取得済みと再確認。新しい28日選択と同期間の補完は、対象権限のあるChromeセッション期限切れ・別プロファイル権限なしで未取得。認証入力・アクセス申請・権限変更をせず、期間差と次回取得をJSONへ固定 |
| 2026-09-01 | review | review | アクティブSEO目標を19要件へ分解し、overall not_complete、未完了11要件を構造化監査へ固定。予定・dry-run・GA4イベント受信を承認・公開・問い合わせ・契約成果へ読み替えないverifierを追加 |
| 2026-09-02 | review | review | MyBrain全体のcontent-production正本を再確認し、Codex日次・週次・月次automationをACTIVEで定義。Google Calendarを運用正本から外し、既存予定は削除指示がないため変更せず履歴扱いとした。マイルストーン処理台帳を追加し、完了・無データ観測・部分取得・blocked・再試行を分離した |
