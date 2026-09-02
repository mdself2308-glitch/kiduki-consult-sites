# KIDUKI SEO 継続レビュー日程

Status: Active operational schedule  
Start: 2026-09-01  
Timezone: Asia/Tokyo  
Owner: 宮部 大輔  
Content guide: `README.md`  
Conversion strategy: `seo-contract-funnel.md`

## Purpose

公開本数ではなく、検索表示、クリック、記事からサービスへの遷移、問い合わせ、商談、契約を別々に観測し、記事・CTA・着地ページを継続改訂する。

## Goal completion audit

`evidence/seo-goal-completion-audit-2026-09-01.json` は目標を19要件へ分解し、2026-09-01時点のoverall statusを `not_complete` とする。未完了11要件は、スポットv2と12記事CTAのexact承認・本番権限、主要イベント不一致の第一者照合、公開後7/28/90日、実 `article_service_click` / `service_contact_click` 受信、valid inquiry、商談・見積・契約台帳である。予定作成、ローカルreview、dry-run、GA4イベント受信だけを目標完了へ読み替えない。`npm run verify:seo-goal-completion-audit` は未証明要件が誤って完了扱いになっていないことを検証する。

## Recurring cadence

| Frequency | Timing | Review | Evidence | Allowed output |
|---|---|---|---|---|
| 公開翌日 | 各記事公開の24時間後 | 公開URL、canonical、Article構造化データ、画像、内部リンク、PC/スマホ | WordPress、公開HTML | 検証記録。自動改稿しない |
| 公開7日後 | 各記事ごと | インデックス、対象クエリの初期表示、誤った検索意図 | Search Console URL inspection / performance | 改稿候補をチケットへ追記 |
| 公開28日後 | 各記事ごと | クエリ、表示、クリック、CTR、平均順位、主サービス遷移、問い合わせ | Search Console、GA4、問い合わせ台帳 | タイトル・導入・内部リンク・CTAの修正案 |
| 公開90日後 | 各記事ごと | 契約寄与、重複、統合・更新・維持の判断 | Search Console、GA4、商談・契約記録 | 維持、改稿、統合、アーカイブ案 |
| 週次 | 毎週月曜 08:00 JST | 直近公開、次回予約、リンク切れ、インデックス未確認、監修証拠 | WordPress、公開サイト、各CTチケット | 1週間の優先修正3件以内 |
| 月次 | 毎月1日 08:30 JST | 直近28日と前28日、クエリ→ページ→CTA→問い合わせ→契約 | 同一プロパティ・同一期間のSearch Console/GA4/契約記録 | `article-plan.json` と導線戦略の改訂案 |

## Scheduled records

運用正本は、`/Users/dmmac/.codex/automations/` にある次のCodex自動化3本である。構成・時刻・権限境界は `evidence/codex-seo-automation-schedule-2026-09-02.json` と `npm run verify:seo-automation-schedule` で確認する。

| Automation | Schedule | First run | Purpose |
|---|---|---|---|
| `kiduki-seo-milestone-review` | 毎日07:30 JST | 2026-09-03 | 当日または未処理の公開後7日・28日・90日だけを確認。対象なしはno-op |
| `kiduki-seo-growth-loop` | 毎週月曜08:00 JST | 2026-09-07 | 2つのSearch Console URL-prefix、GA4、WordPress、非指名queryを確認し、優先改善を最大1バッチ作る |
| `kiduki-seo-monthly-funnel-review` | 毎月1日08:30 JST | 2026-10-01 | 直近28日と前28日を比較し、query→page→service→valid inquiry→相談→見積→契約の離脱を確認 |

記事マイルストーンのローカル日付manifestは `seo-article-review-calendar.json`、処理状態の正本は `evidence/seo-milestone-review-ledger.json` とする。12記事×7日・28日・90日の36件があり、最初は2026-09-08の `night-shift-sleep-management:7d`、最後は2027-01-07の `when-sleep-becomes-a-return-to-work-decision:90d` である。ファイル名と一部フィールドには過去のGoogle Calendar記録が残るが、Codexは `record_key`、`slug`、`milestone`、`start_time` だけを運用入力として使い、Google event IDやURLは使わない。`measured` と `observed_no_data` は完了、`partial` と `blocked` は `next_retry_at` 到来時だけ再試行し、同じマイルストーンを毎日重複処理しない。

F・Gの2記事は `future-article-review-plan.json` に保持する。owner-review中は週次キューで検索仮説・カニバリ・主副CTAだけを確認し、WordPress readbackで実 `published_at` を得るまで7日・28日・90日を起算しない。仮の公開日やexact承認だけでは公開扱いにしない。

Codex自動化は監査、測定、ローカル記録、承認候補差分までを行う。新規公開、公開本文変更、WordPress本番書き込み、静的トップのmain push、Azure本番デプロイ、メール送信、Google Calendar、認証・権限変更は行わない。各変更はチケット、exact version、owner/physician approval、別の本番実行権限、dry-run、backup、公開後readbackを必要とする。

2026-09-01に作成済みのGoogle Calendar予定は、削除指示がないため変更していない。ただし2026-09-02以降のレビュー運用正本ではなく、Codex自動化の実行条件にも使わない。Site Kitメールも `subscribed: false` のままであり、定期レビューはどちらにも依存しない。

## Baseline

2026-09-01のSite Kit「過去28日間」と、同日21:35 JSTに認証済みSearch Consoleで取得した両URL-prefixの28日選択を初期基準とする。Search Consoleはプロパティごとの実データ範囲を保持し、合算しない。

- Search Console property: URL-prefix `https://kdkconslt-sngyouijm.com/`
- Total impressions: 246（前期間比 +33%）
- Total clicks: 10
- Unique visitors from search: 9
- Site Kit key events widget: 0
- GA4 direct evidence for the same 2026-08-05〜2026-09-01 range: `generate_lead` 5 events / 2 users、key events 1（Direct 1、Organic Search 0）。`generate_lead` はキーイベント指定済み
- First-party reconciliation: Flamingo保存5件は全て2026-07-28・31、GA4対象期間内は0件。consultのPack/単発フォームはCasetra Leads保存後に同イベントを送るため、まず両第一者システムを別集計する。GA4の5イベントを問い合わせとして数えない
- Commercial queries observed: 先行基準（2026-08-05〜2026-08-31）は `スポット産業医` 53表示・1クリック・CTR 1.9%・平均順位26.2、`産業医 スポット` 94表示・0クリック・CTR 0%・平均順位26.9。21:35 JSTの28日選択（実データ2026-08-02〜2026-08-29）では、それぞれ56表示・1クリック・CTR 1.8%・平均順位26.0、91表示・0クリック・CTR 0%・平均順位27.2。いずれも旧URL `/service/spot/` に表示された。期間が違う値を上書き・直結しない
- Search Console WordPress URL-prefix: 28日選択、実データ2026-08-02〜2026-08-29、11クリック・241表示・CTR 4.6%・平均掲載順位21.1
- Search Console consult URL-prefix: 28日選択、実データ2026-08-13〜2026-08-29、1クリック・16表示・CTR 6.2%・平均掲載順位8.4。トップ1クリック・16表示、Pack 0クリック・1表示。`casetra` 0クリック・1表示のためトップのクリックへ帰属しない
- Search Console evidence: `evidence/search-console-dual-property-snapshot-2026-09-01.json`。ドメインプロパティは未確認
- Device breakdown: 先行基準2026-08-05〜31では、`スポット産業医` はモバイル27表示・1クリック／PC26表示・0クリック、`産業医 スポット` はPC50表示・0クリック／モバイル44表示・0クリックまで取得済み。21:35 JSTの新しい28日選択（実データ2026-08-02〜29）と同一期間の端末別は未取得。21:42 JSTの補完時には対象権限のあるChromeセッションが期限切れで、別セッションはプロパティ権限なしだった。ログイン情報入力・アクセス申請・権限変更は行っていない。期間を混ぜず、次回同じ28日選択で補完する
- GA4 administration: `source_article`、`source_page`、`target_offer`、`article_cta_role`、`article_slug`、`cta_role` をイベントスコープで登録・読み戻し済み。登録後の実値受信を次回確認する

## Decision rules

1. 表示がない記事は、インデックス、検索意図、内部リンク、主ページとの重複を先に確認し、本文量だけを増やさない。
2. 表示があるのにCTRが弱い記事は、クエリとtitle/metaの一致、検索結果上の差別化、表示ページの競合を確認する。
3. クリックはあるが主サービスへ進まない記事は、冒頭の回答、商品適合、CTA、内部リンクを修正する。
4. 主サービスへ進むがフォーム開始がない場合は、サービス範囲、料金の見せ方、信頼要素、フォーム負荷を確認する。
5. 問い合わせはあるが契約しない場合は、SEO記事ではなく、商品適合、初回相談、見積、反論処理、契約条件を見直す。
6. 指名検索だけが増えた場合はブランド成果とし、非指名SEOの成功に数えない。
7. Site KitとGA4本体のキーイベント数が不一致なら、同一期間、キー指定日時、イベント名、チャネルをGA4本体で確認し、Flamingo照合前に問い合わせ数を断定しない。

## Publication and approval boundary

- 監査、測定、チケット更新は読み取り中心で行う。
- 医療・安全・法令・雇用・料金を含む改稿はTier Sの新しいexact versionとして扱う。
- AIレビュー、lint合格、予約状態は宮部大輔による承認の代わりにならない。
- WordPress更新、予約変更、公開、Search Console設定変更は、対象操作に対する明示権限がある場合だけ行う。
- 変更後は公開URL、PC/スマホ、計測イベントを再確認する。

## Immediate review queue

1. `スポット産業医` と `産業医 スポット` の変更前基準と先行期間の端末別を維持し、対象権限のあるSearch Consoleへ再ログインできた時点で新しい28日選択と同期間の端末別を補完する。exact公開後はCTR・平均順位・旧URLから新URLへのquery×page移行も確認する。
2. 予約中11記事の同一CTAを、`article-plan.json` の主着地・副着地に合わせた個別CTAへ修正する。
3. 既存のWordPress用・consult用URL-prefixは認証済みSearch Consoleで28日選択の別表を取得できた。次は同じ形式の自動取得経路を確立し、それまでは本体UI読取を構造化JSONへ固定する。
4. GA4の `generate_lead` 5回・2ユーザーとFlamingo対象期間0件の不一致について、まず非Flamingo経路であるconsultのPack/単発フォームをCasetra Leadsの期間別件数と照合する。残差があれば、旧計測、匿名公開HTMLで確認した数値のみのGoogle tag設定 `288922294`、重複タグを切り分ける。数値タグを原因と断定せず、照合内容や個人情報はGitへ保存しない。
5. 問い合わせ、初回相談、見積、契約を同じ第一者IDで追える権限管理済み台帳を確認または設計する。
6. owner-review中のF `existing-industrial-physician-specialist-support` とG `occupational-health-case-management` は、`future-article-review-plan.json` により検索仮説・既存記事との重複・主副CTAを週次レビューで確認する。exact承認だけではpostを作成せず、下書き作成権限と公開権限を分け、実公開後のWordPress `published_at` readbackを起点に各7日・28日・90日予定を追加する。

## Review command

`npm run audit:analytics-access` は書き込みを行わず、Site Kit接続、現在のWordPressユーザーのSite Kit認証、当期と比較期のSearch Console合計、クエリ×ページ、`スポット産業医` の表示ページ、GA4キーイベント可否、メールレポート購読状態を出力する。必須の検索・行動データのいずれかが取得できない場合は `ok: false` と非ゼロ終了にし、その週の数値を自動取得済みとして記録しない。

`npm run audit:article-schedule` はWordPress本文を比較せず、12記事のpost ID、slug、publish/future、公開日時だけを `article-plan.json` と照合する。CTAの承認待ち差分があっても、レビュー基準日の監査を独立して行える。
