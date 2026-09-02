---
task_id: CT-20260901-seo-measurement-spec
title: SEOから契約までの計測仕様
project: kdk-wordpress
channel: internal
domain: general
risk_tier: A
status: review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-measurement-spec.md
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- Search Consoleの表示から契約・初回売上までを、状態と証拠を混同せず追える計測仕様を定める。

## Audience and action

- Audience: KIDUKIの経営者、SEO・WordPress・GA4・営業運用者
- Main question or job: どのイベントと台帳を使い、検索クエリから契約までを同じリードとして追うか決める
- Desired next action: 子テーマ計測を安全に本番反映し、GA4とFlamingoでテスト問い合わせを照合する
- Non-goals: GA4クリックを契約とみなすこと、顧客情報をGitへ保存すること、医療成果をSEO成果として扱うこと

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 記事はサービスページを経由して問い合わせへ進める。現在案内可能な初回商品は復職・両立支援単発、Basic、Retain、CASETRAへ分岐する。PackはP-01/P-02 PASSまで公開導線・初回商品・契約KPIから除外する。
- Approved terminology: article_service_click、generate_lead、source_system、inquiry_record_id、lead_tracking_id、lead_id、inquiry、consultation、quote、contract
- Constraints and boundaries: Search Console、GA4、Flamingo、営業台帳、契約記録の証拠範囲を分ける。仮名化ID・個人情報・健康情報をGA4/Gitへ入れない。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-contract-funnel.md | 2026-09-01 | 検索語、記事、サービス、契約商品の導線 | GA4実受信、契約実績 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/wp-content/themes/kiduki-child/functions.php | 2026-09-01 | 記事からサービスへのイベント実装と本番配信コード | GA4実受信、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/wp-content/themes/kiduki-child/assets/js/cf7-redirect.js | 2026-09-01 | メール成功後のgenerate_leadと流入引継ぎ、本番配信コード | 実問い合わせ受信、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/consult/index.html | 2026-09-01 | 静的トップのGA4測定ID、linker、問い合わせCTAとローカル帰属ブリッジ | 修正版の本番公開、GA4受信、契約 |
| Site Kit dashboard / URL-prefix Search Console | 2026-09-01 | 18:09 JST時点で246表示、10クリック、検索訪問9、主要イベント0 | consultサブドメイン、契約実績 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/measurement-live-audit-2026-09-01.json | 2026-09-01 | GA4のgenerate_lead受信・キー指定・6カスタムディメンション、両Search Console URL-prefix、Flamingoの期間別件数、匿名公開タグの実測 | 個別問い合わせ内容との一致、発火源、商談、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/search-console-dual-property-snapshot-2026-09-01.json | 2026-09-01 | 認証済みSearch Consoleの両URL-prefix・28日選択、実日付範囲、query×page、consultページ別値 | 自動取得、問い合わせ、商談、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/casetra_active/kiduki-consult-api-deploy/src/functions/publicLeads.ts | 2026-09-01 | consult Pack/単発の検証、Casetra Leads/Cosmos保存、商品コード、第一者lead_id、既存Lead更新時も200成功となる境界、通知・予約URL | 本番の期間別件数、GA4イベントとの個別一致、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/templates/casetra-leads-aggregate.example.json | 2026-09-01 | 個人情報を含まない新規Lead・最終更新Lead・API成功応答の分離形式 | 本番件数、個別Lead、契約 |
| [Google Site Kit Search_Analytics_Trait.php](https://github.com/google/site-kit-wp/blob/develop/includes/Modules/Search_Console/Datapoints/Search_Analytics_Trait.php) / [Authentication.php](https://github.com/google/site-kit-wp/blob/develop/includes/Core/Authentication/Authentication.php) | 2026-09-01 | `query,page` dimensions、行上限、Site KitユーザーOAuthと要求scopeの境界 | KIDUKIアカウントの実データ、契約実績 |
| [Google Site Kit Plugin conversion tracking](https://sitekit.withgoogle.com/documentation/using-site-kit/plugin-conversion-tracking/) | 2026-09-01 | Contact Form 7を含む対応プラグインの操作を追加イベントとして計測する設定 | KIDUKI独自イベントとの非重複、GA4実受信 |
| WordPress API | 2026-09-01 | 公開1本、予約11本、サービスページの現行文言 | 検索・計測成果 |

### Unresolved points

- 子テーマ計測コードは本番配信済みで、GA4本体では既存 `generate_lead` 5回・2ユーザーを確認した。ただし今回追加した流入パラメータは未確認。Flamingoは全5件が7月28日・31日でGA4対象期間内は0件だが、consultのPack/単発フォームはCasetra Leads保存成功後に同イベントを送る。従ってGA4の5回を問い合わせ件数にせず、両第一者記録を照合する。
- `generate_lead` のキーイベント指定と、`source_article`、`source_page`、`target_offer`、`article_cta_role`、`article_slug`、`cta_role` のイベントスコープ登録はGA4管理画面で確認済み。登録後の値受信とDebugView試験は未確認。
- Application PasswordユーザーではSite Kitサイト接続は確認できるが、Site Kit OAuthは `authenticated: false` で、Search Consoleクエリ×ページとGA4キーイベントのREST取得は403。ブラウザのSite Kit表示と自動監査の認証境界を解消する必要がある。ユーザー別メール設定は取得でき、`subscribed: false`、`frequency: weekly` だった。
- Site Kit設定画面ではGA4コード挿入・拡張計測は有効、プラグインのコンバージョントラッキングは無効。Contact Form 7の自動イベントはKIDUKI独自の `generate_lead` と重複し得るため、主要イベント0だけを理由に有効化しない。
- 営業台帳の権限管理された保存先と、契約記録への `source_system` / `inquiry_record_id` 転記方法は未確認。
- 静的トップの修正版と、それを受け取るWordPress問い合わせ側の修正版はローカル検証済みだが未公開。静的トップは `main` push、WordPress側はバックアップ付き反映の権限が必要で、片側だけでは受入完了にならない。
- Search ConsoleにはWordPress用とconsult用の2つのURL-prefixが存在する。認証済みChromeでは両方を28日選択で読取でき、WordPress側は実データ2026-08-02〜29で11クリック・241表示、consult側は2026-08-13〜29で1クリック・16表示だった。両プロパティを同形式で自動取得する経路は未確立。
- Casetra APIは既存Leadを更新した200応答でも静的フォームから `generate_lead` が発火するため、Leadレコード件数だけではGA4 5イベントを完全照合できない。件数専用テンプレートで新規Lead、期間内最終更新Lead、API成功応答を分離した。現在のAzure principalはApplication Insights/Cosmosともread不可で、実件数は取得せず、RBACも変更していない。

## Outline

1. 検索、記事、サービス、問い合わせ、商談、見積、契約の証拠を分ける
2. article_service_clickとgenerate_leadのパラメータを定義する
3. GA4へ集計用source_article/source_pageを送り、WordPressのlead_tracking_idとCasetra Leadsのlead_idは各第一者記録と権限管理された台帳だけで照合する
4. 営業台帳の最小列とファネル計算を定義する
5. 本番受入証拠と未完了ゲートを定義する

## Draft requirements

- Voice: 実装者と経営者が同じ数値境界を使える内部仕様。事実、未確認、受入条件を明記する。
- Required points: property/period境界、集計イベント、第一者の仮名化ID、Flamingo、営業台帳、契約記録、受入試験
- Forbidden claims or wording: 自動計測済み、本番反映済み、問い合わせ0、契約0の未確認断定
- Channel limits: 内部用。顧客・患者向け公開文書ではない。
- CTA or next action: 子テーマのdry-run・本番反映とテスト送信を、公開権限のもとで実施する。

## Review plan

- Source and fact reviewer: 現行ソース、WordPress API、Site Kit表示、GA4イベント境界の照合
- Safety or compliance reviewer: 個人情報・健康情報をイベント/Gitへ送らないこと、公開と計測状態の分離
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | 記事からサービスへの遷移 | 既存GA4実装には記事別の内部サービス遷移イベントがない | functions.phpと12記事の一律CTA | article_service_clickと非PII流入情報を追加 | accepted / deployed 2026-09-01 |
| High | 問い合わせから契約 | 初版はgenerate_leadとFlamingoへ同じlead_tracking_idを付与した | cf7-redirect.jsと旧計測目標 | 旧設計。下記GA4識別子findingでsupersededし、IDは第一者側だけへ限定 | superseded by GA4識別子 finding |
| High | 本番証拠 | ローカル検証だけではGA4/Flamingo受信を証明できない | content-production status rule | 本番反映後にCTAクリックとテスト問い合わせを実測 | unresolved gate |
| Medium | Search Console範囲 | URL-prefixはconsult静的トップを含まない | Site Kit property表示、Search Consoleプロパティ一覧 | 既存のWordPress用とconsult用URL-prefixを同期間で別表取得 | live read repaired / automated export pending |
| High | GA4識別子 | `lead_tracking_id` はFlamingo・営業台帳と結び付く仮名化IDで、高カーディナリティのためGA4へ送るべきでない | 独立Tier Sレビュー / Google Analytics公式ガイド | GA4からIDを除外し、第一者台帳だけで保持 | accepted / deployed 2026-09-01; GA4 reception pending |
| High | Search Console帰属 | Search Consoleクエリには個別照合IDがなく、特定契約まで個別追跡できない | Search Console集計境界 | クエリ×ページ集計と記事CTA以降の個別導線を分離 | accepted / repaired |
| Medium | 帰属品質 | 期限・成功後消去・許容値検証がなかった | 独立Tier Sレビュー / child theme code | 30分last-touch、成功後消去、slug/offer/role/ID検証を追加 | accepted / deployed 2026-09-01; live inquiry pending |
| High | page 164直接流入 | 記事CTAでだけIDを生成するとスポット産業医ページへの直接検索流入を契約まで第一者照合できない | 独立Tier S再レビュー | page 164の問い合わせCTAへsource_pageと第一者IDを付与 | accepted / deployed 2026-09-01; event reception pending |
| Medium | TTL実行時 | hidden fieldが読込時固定だと30分超で古い帰属が残る | 独立Tier S再レビュー | 送信直前に再検証・再設定する | accepted / runtime test passed / deployed 2026-09-01 |
| Medium | generate_lead重複 | callbackが遅いとサンクスページ側が再送し得る | 独立Tier S再レビュー | wpcf7mailsentだけから送信し、サンクスページは再送しない | accepted / runtime test passed / deployed 2026-09-01 |
| High | 静的トップ直通の問い合わせ帰属 | GA4タグとlinkerはあるが、別originの静的トップはWordPressのsessionStorageへ第一者帰属を書けず、契約台帳ではdirectになる | 公開版とローカル版の完全一致監査、consult/index.html、cf7-redirect.js | クリック時だけ非PIIの許容値を渡し、WordPress到着時にID生成・URL除去。GA4は標準service_contact_clickへ統一 | accepted / local runtime tests passed / production pending |
| Medium | Site Kit自動コンバージョン | Contact Form 7対応の自動計測は無効だが、独自 `generate_lead` がすでにある | Site Kit設定画面、公式plugin conversion tracking仕様、子テーマ実装 | 重複イベント名・発火回数を実問い合わせで確認するまで自動計測を有効化しない | accepted / setting unchanged / live test pending |
| Medium | GA4管理設定 | キーイベントと導線パラメータの管理状態が未確認だった | GA4管理画面・イベントレポート | `generate_lead` のキー指定を確認し、非PIIの6イベントスコープ定義を登録。`lead_tracking_id` は除外 | accepted / configured and read back 2026-09-01 / new-value reception pending |
| High | 非Flamingo問い合わせ経路 | consultのPack/単発フォームはCasetra Leadsへ保存後にgenerate_leadを送り、Flamingoには入らない | 公開HTML、casetra_active publicLeads.ts | valid inquiryはWordPress/FlamingoとCasetra Leadsを別集計し、source_systemとinquiry_record_idで営業台帳へ接続 | accepted / source proven / live record count unavailable |
| High | GA4への第一者ID送信 | 公開Pack/単発フォームがAPI応答のlead_idをgenerate_leadへ含めていた | 公開HTMLとローカルソースのhash一致 | lead_idをGA4から除外し、source_page/target_offer/cta_roleの集計値へ置換。静的本番反映後に公開HTML確認 | accepted / repaired locally / not deployed |
| High | Casetra件数の等価性 | 同一連絡先・商品は既存Lead更新でも200成功となり、静的フォームはその後にgenerate_leadを送るため、Leadレコード数とイベント数は一致しない | publicLeads.ts、静的2フォーム | 新規Lead、期間内最終更新Lead、API成功応答を分離し、件数だけの検証済み形式を使う | accepted / aggregate contract verified / live counts unavailable |
| High | post 1555の新CTA | 新しい `stresschecknew` は本番の許可リストになく、CTAを先に公開すると記事→サービス遷移と問い合わせ帰属が落ちる | 公開記事HTML、functions.php、cf7-redirect.js | `stresschecknew` / `kiduki-retain` を記事側・送信側へ同時追加し、記事公開前または同一リリース窓で反映 | repaired locally / production pending |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-measurement-spec.md`
- Automated checks: `npm run verify:conversion-tracking`、`npm run verify:static-lead-forms`、`node tools/verify-static-lead-forms.mjs --live`、`npm run test:conversion-runtime`、`npm run test:static-contact-runtime`、`npm run verify:static`、`npm run test:site-kit-report`、`npm run verify:seo-ledger-template`、`npm run verify:casetra-leads-aggregate-template`、`npm run verify:measurement-live-audit`、`npm run verify:search-console-snapshot`、`npm run verify:article-plan`、content task validator
- Human approval:
- Schedule record:
- Published verification: 既存のWordPress計測修正版は2026-09-01にバックアップ `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/backups/wp-kiduki-child-before-2026-09-01T07-33-56-597Z.json` 付きで反映済み。今回追加した静的トップ→問い合わせブリッジと受信側追加は未公開。現行静的トップの公開hash `8a4b7731999b57f20bdff9f16b21df1a0a89333b70da5cdb5dab65750e50e7ba`、ローカル修正版hash `becc1b3c279b59f4fd2793f3d9ca432df94e361de1668c961117abab830910a5` で不一致を確認。GA4受信と実問い合わせは未確認。
- Measurement source and period: Site Kit過去28日を2026-09-01 19:03 JSTに確認。Search Consoleの3か月基準ではWordPress側2026-05-30〜08-29が716表示・27クリック・CTR 3.8%・平均掲載順位20.8、ページ文字列 `stresschecknew` は0表示・0クリック・クエリ行なし。21:35 JSTの28日選択ではWordPress側実データ2026-08-02〜29が11クリック・241表示・CTR 4.6%・平均掲載順位21.1、consult側実データ2026-08-13〜29が1クリック・16表示・CTR 6.2%・平均掲載順位8.4。期間・プロパティを別表で保持する。GA4は2026-08-05〜09-01に `generate_lead` 5回・2ユーザー、キーイベント1回を確認。
- Remaining gates: CTA exact版承認、post 1555のtracking allowlist本番反映、静的Pack/単発のGA4 ID除外本番反映、権限ある環境からのCasetra件数専用集計、GA4不一致イベントの確定発生源、登録後のGA4パラメータ受信、`article_service_click` / `service_contact_click` 実受信、WordPress/静的各フォームの受入、対象権限のあるSearch Consoleへの再ログイン、新28日選択と同期間の端末別、両Search Consoleプロパティの自動取得、公開後query×page、営業台帳の所在

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | Ticket created |
| 2026-09-01 | backlog | review | 計測仕様、article_service_click、lead_tracking_id、受入条件をローカル作成 |
| 2026-09-01 | review | review | 子テーマ計測をdry-run・バックアップ付きで本番反映し、公開コードを確認。GA4受信と問い合わせ照合は未確認 |
| 2026-09-01 | review | review | 独立レビューのHighを受け、GA4から仮名化IDを除外し、Search Console集計境界、30分TTL、成功後消去、許容値検証へ修正。再デプロイ・実受信確認待ち |
| 2026-09-01 | review | review | 追加の独立レビューを2回実施し、page 164 source_page、送信直前TTL更新、generate_lead単独送信、動的テストへ修正。blockerなしを確認してバックアップ付きで本番反映し、配信コードとSEO live verifyを確認 |
| 2026-09-01 | review | review | Site Kit読み取り監査をクエリ×ページとスポット産業医の表示ページまで拡張。現在のApplication Password経路はSite Kit OAuth未認証で403、ブラウザ表示値との認証境界を記録 |
| 2026-09-01 | review | review | Site Kitの接続設定だけ読める状態を成功扱いしないよう、Search Console合計・クエリ×ページ・GA4キーイベントの必須データ欠落時は監査を `ok: false` と非ゼロ終了へ変更 |
| 2026-09-01 | review | review | ログイン済みSearch Consoleで3か月の全体値と非指名商用語を確認。ページ文字列 `stresschecknew` は0表示・0クリック・クエリ行なしで、Site Kit別期間クエリをpost 1555へ帰属させない境界を記録 |
| 2026-09-01 | review | review | post 1555のURL検査でGoogle登録済み、2026-08-18クロール、取得成功、index許可、自己canonicalを確認。インデックス再登録は未実施 |
| 2026-09-01 | review | review | 問い合わせ→初回相談→見積→契約を分ける16列の空台帳テンプレートを追加。Gitへ実データ・個人情報・健康情報・検索クエリを保存しない検証を追加 |
| 2026-09-01 | review | review | 静的トップの公開一致を確認後、consult-home→WordPress問い合わせの別origin帰属欠落を検出。IDをURL/GA4へ出さず、クリック時だけ許容値を渡して到着側でID生成・URL除去する修正版と動的テストを追加。両面とも今回分は未公開 |
| 2026-09-01 | review | review | 18:09 JSTのSite Kit表示を再確認し、過去28日は246表示、10クリック、検索訪問9、主要イベント0。監査を再実行し、検索・GA4は403、メール設定だけは未購読・weeklyとして取得できる状態を記録 |
| 2026-09-01 | review | review | Site Kit設定画面でGA4コード挿入・拡張計測は有効、プラグインのコンバージョントラッキングは無効と確認。CF7の自動イベントと独自generate_leadの二重計測を避けるため設定変更せず |
| 2026-09-01 | review | review | post 1555改稿候補のCTAが本番許可リスト外であることを公開HTMLから検出。`stresschecknew` / `kiduki-retain` を記事・functions.php・cf7-redirect.jsへ揃え、ローカル検証合格。本番反映とGA4受信は未実施 |
| 2026-09-01 | review | review | GA4本体で `generate_lead` のキーイベント指定、過去28日5回・2ユーザー、キーイベント1回を確認。Site Kitの主要イベント0を実問い合わせ0と解釈しない境界へ修正 |
| 2026-09-01 | review | review | `source_article`、`source_page`、`target_offer`、`article_cta_role`、`article_slug`、`cta_role` をイベントスコープで登録し6/6読み戻し。`lead_tracking_id` は登録せず、登録後の受信確認を残した |
| 2026-09-01 | review | review | Search Consoleにconsult専用URL-prefixが既存であることを確認。3か月選択は1クリック・16表示・CTR 6.3%・平均順位8.4で、WordPressプロパティと別表計測へ変更 |
| 2026-09-01 | review | review | Flamingoを件数・日時だけで照合。全5件は7月28日・31日で、GA4期間内は0件。GA4のgenerate_lead 5回を実問い合わせと数えず、発生源診断を残した |
| 2026-09-01 | review | review | consultのPack/単発フォームがCasetra Leads保存成功後にgenerate_leadを送る非Flamingo経路と確認。公開版のGA4 lead_id送信をローカルで除外し、集計用3パラメータへ置換。Azure principalはCosmos read権限がなく、実件数は未照合 |
| 2026-09-01 | review | review | 同一連絡先・商品では既存Lead更新時にもGA4イベントが発火する件数差を確認。新規Lead・期間内最終更新Lead・API成功応答を分ける個人情報なし集計テンプレートと検証を追加。Application Insights/Cosmosのread不可を記録し、RBAC変更・Lead読取は未実施 |
| 2026-09-01 | review | review | 認証済みSearch Consoleで両URL-prefixを28日選択へそろえて取得。実データ開始日をプロパティ別に保持し、query×page・consultページ別値を構造化JSONとverifierへ固定 |
