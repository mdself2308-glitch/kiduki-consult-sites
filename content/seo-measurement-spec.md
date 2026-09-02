# KIDUKI SEOから契約までの計測仕様

Status: Review  
Last verified: 2026-09-01  
Owner: 宮部 大輔  
Content guide: `README.md`  
Conversion strategy: `seo-contract-funnel.md`

## Purpose

検索表示、記事閲覧、サービスページ遷移、問い合わせ、初回相談、見積、契約、継続契約を別々の事実として記録する。GA4のクリックを契約とみなさない。Search Consoleはクエリ×ページの集計寄与、個別の第一者照合は記事CTA以降として分離する。

## Measurement chain

| Stage | Event or record | Required fields | Authoritative evidence |
|---|---|---|---|
| Search discovery | Search Console row | property, period, query, page, clicks, impressions, CTR, position | Search Console export/API |
| Article engagement | page view | page path, session, source/medium | GA4 |
| Service transition | `article_service_click` | article_slug, target_offer, article_cta_role, link_url | GA4 event |
| Service-to-contact transition | `service_contact_click` | source_page, target_offer, cta_role, link_url | GA4 event |
| Inquiry | `generate_lead` | form_name, source_article, source_page, target_offer, article_cta_role | GA4 event |
| First-party inquiry attribution | WordPress/Flamingo or Casetra Leads record | source_system, inquiry_record_id, source_article, source_page, target_offer | WordPress/Flamingo or Casetra Leads/Cosmos |
| Sales consultation | sales ledger row | source_system, inquiry_record_id, held_at, fit_result, proposed_offer | authorized sales ledger |
| Quote | sales ledger row | source_system, inquiry_record_id, quoted_at, quoted_offer, quoted_amount | authorized sales ledger |
| Contract | contract record | source_system, inquiry_record_id, contracted_at, contracted_offer, initial_revenue | contract or billing record |
| Expansion | contract record | company/customer id, prior_offer, next_offer, converted_at | contract history |

WordPress/Flamingoの `lead_tracking_id` とCasetra Leadsの `lead_id` は、氏名等を直接含まなくても問い合わせ情報や営業台帳と結び付く第一者照合キーとして扱う。どちらもGA4へ送らず、対応する第一者記録と権限管理された営業台帳だけで保持する。営業台帳では `source_system` と `inquiry_record_id` の組で区別する。顧客情報、健康情報、照合結果、契約実績をこのGitリポジトリへ保存しない。

Search Consoleの行には個別IDがないため、検索クエリから特定の契約までを個別に結び付けない。記事・ページ単位の集計寄与と、記事CTA以降の第一者照合を別々に報告する。

## Search Console boundaries

1. WordPress URL-prefix `https://kdkconslt-sngyouijm.com/` と静的トップ `https://consult.kdkconslt-sngyouijm.com/` は別プロパティとして、同じ期間選択で取得する。実データ開始日が異なる場合は、プロパティごとの実日付範囲も保持する。
2. 2026-09-01のプロパティ一覧では上記2つのURL-prefixを確認し、ドメインプロパティは確認できなかった。各URL-prefixを別表で報告し、単一プロパティの実績のように合算しない。
3. 将来ドメインプロパティを利用できる場合も、ページ単位ではWordPressと静的トップを分けて集計する。
4. クエリ、ページ、期間が異なる数字を直接比較しない。
5. 指名クエリと非指名クエリを分ける。`宮部大輔` の増加を `スポット産業医` の改善として扱わない。
6. クロール依頼、インデックス、順位、クリックは別の状態として記録する。
7. 端末別を取得していない場合は、aggregateのCTRからdesktop/mobile/tabletの差を推測しない。query×pageとdeviceは別の取得状態として記録する。

## Current implementation

### Article to service

WordPress子テーマは、記事CTA内の `/service/` リンクが押されたときに `article_service_click` を送る。既存公開版のようにデータ属性がないCTAも、リンク順から primary / secondary を補完して計測する。

記事slugと商品分類は許可リストで固定する。公開中post 1555の改稿候補は `article_slug=stresschecknew`、`target_offer=kiduki-retain` とし、ローカルの `functions.php` と `cf7-redirect.js` の両方へ同じslugを追加した。2026-09-01の公開HTML確認では既存の `article_service_click` と12記事slugは配信されていたが `stresschecknew` はまだ含まれず、この追加分は本番未反映である。

同時に次を `sessionStorage` の `kiduki_content_origin` へ保存する。page 164の問い合わせCTAにも `source_page=return-to-work-support` と同じ第一者照合キーを設定する。帰属はlast-touch、期限は30分とし、問い合わせ成功後に元の帰属情報を削除する。

- `article_slug`
- `source_page`
- `target_offer`
- `article_cta_role`
- `lead_tracking_id`
- `clicked_at`

### Static consult home to contact

静的トップはWordPressと同じGA4測定ID `G-JQFWB6XG2E` を使用し、問い合わせリンクの実クリック時に `service_contact_click` を送る。`source_page=consult-home`、`target_offer=general-inquiry`、`cta_role` は集計・第一者帰属のための許容値であり、`general-inquiry` は商品SKUではない。

静的トップとWordPressは別originのため、静的トップの `sessionStorage` はWordPressから読めない。問い合わせリンクには実クリック時だけ3つの非PIIパラメータを付け、WordPress問い合わせページで許容値を検証してから `lead_tracking_id` を生成し、内部パラメータをURLから除去する。ID自体はURLにもGA4にも入れない。無効な値はdirectとして扱う。

このブリッジは2026-09-01にローカル実装・動的検証済みだが、静的トップの公開には `main` push、WordPress側にはバックアップ付き子テーマ反映が必要であり、どちらも今回の修正版は未公開である。片側だけを公開済みとみなさない。

### Static Pack / SPOT forms to Casetra Leads

`/return-to-work-pack/` と `/return-to-work-spot/` はWordPress/Flamingoではなく、成功時にCasetraの `/api/leads` へ第一者リードを保存する。バックエンド実装ではPack/単発を `requested_product_code` で区別し、CosmosのLeadsコンテナへ記録してから `lead_id` と予約URLを返す。両フォームはAPI成功後にだけ同じGA4プロパティへ `generate_lead` を送るため、Flamingo対象期間0件でもGA4イベントが存在し得る。

2026-09-01の公開HTMLは修正前ローカルソースと一致し、両フォームのGA4イベントへ第一者 `lead_id` を送っていた。ローカルではこれを削除し、登録済みの集計用ディメンション `source_page`、`target_offer=return-to-work`、`cta_role=form-submit` に置き換えた。第一者IDは画面表示・予約・Casetra Leadsと営業台帳の照合にだけ使う。修正版は未公開であり、公開版にIDが残る事実とローカル修正済みを混同しない。

Casetraの現行APIは、同じ連絡先・同じ商品コードで未完了のLeadがある場合、新規行ではなく既存Leadを更新して200を返す。静的フォームは新規201と更新200のどちらでもAPI成功後に `generate_lead` を送る。このため、期間内のLeadレコード数とGA4イベント数を同じ件数として照合しない。

個人情報を取得せずに照合するため、`templates/casetra-leads-aggregate.example.json` を件数専用の受け口とする。次の3指標を分け、Lead ID、氏名、会社名、連絡先、相談内容、健康情報、レコード配列を置かない。

- `unique_records_created`: `created_at` が期間内の新規Leadレコード数
- `unique_records_latest_touched`: `lead_notification_updated_at` の最新値が期間内の一意Leadレコード数。期間内の送信回数とは呼ばない
- `successful_api_responses`: Application Insights等で確認した期間内の成功応答数。新規Lead数とは呼ばない

`npm run verify:casetra-leads-aggregate-template` は空テンプレートの個人情報不在、商品コード、期間、集計境界を検証する。実集計ファイルを作る場合は権限のある環境から件数だけを出力し、`node tools/verify-casetra-leads-aggregate.mjs --input <count-only-json>` へ渡す。現在のAzure principalはApplication Insightsの `Microsoft.Insights/components/read` とCosmosのreadを持たず、どちらも件数未取得である。RBACは変更せず、Leadレコードも読んでいない。

### Contact and lead

お問い合わせページでは、保存済みの流入情報を許容値リストと30分の期限で検証し、Contact Form 7のhidden fieldへ追加する。フォーム読込時だけでなく、送信直前にも再検証・再設定し、期限切れならdirect / not_set / 空IDへ戻す。`generate_lead` はメール送信成功時の `wpcf7mailsent` から1回だけ送信し、サンクスページでは再送しない。GA4へは記事・サービス・CTA役割の集計項目だけを付け、`lead_tracking_id` は送らない。

| CF7 / Flamingo field | GA4 parameter | Boundary |
|---|---|---|
| `source-article` | `source_article` | 記事slugの許容値のみ |
| `source-page` | `source_page` | return-to-work-support / consult-home |
| `target-offer` | `target_offer` | kiduki-basic / kiduki-retain / return-to-work / casetra / general-inquiry |
| `article-cta-role` | `article_cta_role` | primary / secondary / service-primary / header / hero / service / final / footer |
| `lead-tracking-id` | 送信しない | 仮名化された第一者照合キー |

本番反映後、Flamingoがhidden fieldを保存すること、通知メールが従来どおり届くこと、`generate_lead` が二重送信されないことをテスト送信1件で確認する。

## GA4 administration and current status

- `generate_lead` はキーイベントとして有効で、過去28日間にアクティブなウェブストリームがあることを2026-09-01にGA4管理画面で確認した。
- `source_article`、`source_page`、`target_offer`、`article_cta_role`、`article_slug`、`cta_role` をイベントスコープのカスタムディメンションとして登録し、同日に6/6を読み戻した。登録前の値へ遡及適用されるとはみなさない。
- `lead_tracking_id` はGA4パラメータやカスタムディメンションにしない。Googleはセッションごとの一意IDのような高カーディナリティのカスタムディメンションを避けるよう案内している（[GA4 custom dimensions](https://support.google.com/analytics/answer/14240153?hl=en)）。
- `article_service_click` は中間指標であり、キーイベントにしない。
- デバッグビューまたはリアルタイムで、記事CTAクリック1回とフォーム成功1回を確認する。
- イベント受信確認と実際の問い合わせ受信・契約成立を分けて記録する。

## Sales ledger minimum schema

顧客情報を置く権限管理された営業台帳に、次の列を追加する。台帳の所在が決まるまでは、このリポジトリに実データを作らない。

列だけの移行用テンプレートは `templates/seo-funnel-ledger.csv` とする。このCSVは常にヘッダー1行のみとし、実データを入力しない。`npm run verify:seo-ledger-template` は列定義とヘッダーのみであることを検証する。

| Field | Allowed values or rule |
|---|---|
| source_system | `wordpress_flamingo` または `casetra_leads`。別システムのIDを同一空間として扱わない |
| inquiry_record_id | WordPressでは `lead_tracking_id`、consultのPack/単発ではCasetra Leadsの `lead_id`。GA4へ送らない。無い問い合わせは `unknown` |
| inquiry_received_at | ISO日時 |
| source_article | 記事slug、direct、unknown |
| source_page | return-to-work-support、consult-home、return-to-work-pack、return-to-work-spot、direct、unknown |
| target_offer | kiduki-basic, kiduki-retain, return-to-work, casetra, general-inquiry, other。general-inquiryは商品ではなく静的トップからの一般問い合わせ分類 |
| inquiry_type | 問い合わせフォームの選択値 |
| consultation_status | not_scheduled, scheduled, held, no_show |
| fit_result | single, pack, basic, retain, casetra, no_fit, undecided |
| quote_status | not_needed, preparing, sent, declined, accepted |
| contracted_offer | single, pack, basic, retain, casetra, none |
| contracted_at | 契約成立時だけ記録 |
| initial_revenue | 税別。権限のある台帳だけに保存 |

## Funnel calculations

- Article to service rate = `article_service_click` users / article users
- Service to GA4 lead-event rate = `generate_lead` users / service-page users。計測診断用で、問い合わせ率とは呼ばない
- Service to valid inquiry rate = WordPress/FlamingoとCasetra Leadsで確認したvalid inquiries / service-page users
- Inquiry to consultation rate = held consultations / valid inquiries
- Consultation to quote rate = sent quotes / held consultations
- Quote to contract rate = accepted contracts / sent quotes
- Article-assisted contract count = 第一者台帳でsource_articleが特定できるcontracts
- Service-page-assisted contract count = 第一者台帳でsource_pageが特定できるcontracts
- Initial revenue by article = 第一者台帳のsource_article別initial_revenue合計

母数が10未満の率は参考値とし、順位や文言の変更判断は実クエリ、検索意図、営業記録も合わせて行う。

## Current evidence and remaining gates

- `generate_lead` 二重送信防止と成功後発火は自動検証済み。
- consultのPack/単発フォームがCasetra Leads保存成功後に `generate_lead` を送る非Flamingo経路であることを、公開HTMLとバックエンド正本で確認した。これが過去5イベントの発火元だったかは、権限管理されたCasetra Leadsの期間別集計で未照合である。
- Casetra Leadsの件数専用テンプレートと検証を追加した。既存Lead更新でも `generate_lead` が発火する実装のため、新規Lead数、期間内最終更新Lead数、API成功応答数を別指標にした。現在のAzure principalはApplication Insights/Cosmosともread権限がなく、RBAC変更・Leadレコード読取・実件数取得は行っていない。
- 公開中のPack/単発フォームは第一者 `lead_id` をGA4へ送っていた。ローカルではIDを除外し、`source_page` / `target_offer` / `cta_role` の集計値だけに修正して検証したが、静的公開には `main` push権限が必要で未反映である。
- `article_service_click` とCF7 hidden fieldの初版は、2026-09-01に子テーマへバックアップ付きで本番反映済み。
- 独立レビューでGA4への高カーディナリティID送信、帰属期限、許容値検証、page 164の直接流入、サンクスページとの二重送信余地を検出した。GA4からIDを除外し、30分last-touch、送信直前再検証、成功後消去、許容値検証、page 164のsource_page、wpcf7mailsent単独送信へ修正し、2026-09-01にバックアップ付きで本番反映した。配信コードと既存 `generate_lead` のGA4受信は確認したが、今回の流入パラメータは未確認。
- 記事別exact CTAはローカルのowner-review版であり、本番記事はまだ一律CTAのまま。
- 2026-09-01 19:03 JSTのSite Kit表示では過去28日246表示（前期間比+33%）、10クリック、検索訪問9、主要イベント0。
- 2026-09-01 21:35 JSTに認証済みSearch Consoleで両URL-prefixを28日選択へそろえて再取得した。WordPress側は実データ2026-08-02〜29で11クリック・241表示・CTR 4.6%・平均掲載順位21.1、consult側は実データ2026-08-13〜29で1クリック・16表示・CTR 6.2%・平均掲載順位8.4。consultトップが1クリック・16表示、Packが0クリック・1表示で、`casetra` 0クリック・1表示をトップのクリックへ帰属しない。`evidence/search-console-dual-property-snapshot-2026-09-01.json` に別表・非合算で固定した。
- `スポット産業医` と `産業医 スポット` の端末別は先行期間2026-08-05〜31に取得済みで、前者はモバイル27表示・1クリック／PC26表示・0クリック、後者はPC50表示・0クリック／モバイル44表示・0クリックだった。21:42 JSTの補完時に対象権限のあるChromeセッションが期限切れとなり、別セッションはプロパティ権限なしだったため、新しい2026-08-02〜29スナップショットと同期間のdevice行は未取得。認証情報入力、アクセス申請、権限変更はしていない。期間を区別して次回補完する。
- 2026-09-01 19:50 JSTにGA4本体を確認すると、同じ2026-08-05〜2026-09-01のイベントレポートには `generate_lead` 5回・2ユーザー、トラフィック獲得レポートにはキーイベント1回（Direct 1、Organic Search 0）があった。GA4管理画面でも `generate_lead` はキーイベント指定済みである。したがってSite Kitの主要イベント0を「問い合わせ0」または「GA4未設定」と解釈しない。
- Flamingoには計5件が保存されていたが、全て2026-07-28または2026-07-31で、GA4対象期間の2026-08-05〜2026-09-01には0件だった。従ってGA4の5イベントはFlamingo問い合わせ5件ではない。送信者名、連絡先、件名、本文は取得・保存していない。非Flamingo経路であるCasetra Leadsを最初に照合し、残差だけを旧計測・重複タグ・数値タグの診断へ回す。
- 未ログインの匿名公開HTMLを確認すると、WordPress問い合わせページはSite Kitの `GT-5D9KJF2` に加えて数値のみのGoogle tag設定 `288922294` を出力し、子テーマ `cf7-redirect.js?ver=1.12.0` は `wpcf7mailsent` で `generate_lead` を送っていた。静的consultトップは `G-JQFWB6XG2E` 1系統と `cta_click` を出力していた。これは配信コードの存在を示すが、GA4がイベントを受理・重複排除した証拠ではない。数値タグを不一致の原因と断定せず、設定の所有元と必要性を確認してから扱う。
- 同じGA4イベントレポートでは `article_service_click` と `service_contact_click` はまだ直近イベントに現れなかった。関連コードの公開状態と実クリック後の受信を別途確認する。
- 同日の読み取り専用監査 `npm run audit:analytics-access` では、Site Kitサイト接続は `setupCompleted: true` だった一方、Application Passwordで認証したWordPressユーザーのSite Kit OAuth状態は `authenticated: false` だった。この経路ではSearch Consoleの日別・クエリ×ページとGA4キーイベントが403になり、ダッシュボード表示値を自動取得する経路としては未開通である。ブラウザ上のSite Kit表示とApplication Password経由の自動監査を同一の認証状態とみなさない。ユーザー別メール設定だけは取得でき、`subscribed: false`、`frequency: weekly` だった。
- Site Kit設定画面では、GA4コード挿入と拡張計測は有効、プラグインのコンバージョントラッキングは無効だった。後者はContact Form 7を自動検出して追加イベントを送る機能であるため、KIDUKI独自の `generate_lead` と重複しないことを確認するまで有効化しない。現時点の主要イベント0だけを理由にこの設定を変更しない。
- 監査スクリプトは、権限が利用可能になった時点で同期間の上位クエリ、上位ページ、`スポット産業医` の表示・クリック・CTR・平均順位・表示ページを同時取得できるよう拡張済み。Site Kit公式実装が受け付ける `query,page` dimensions と1000行上限を使用する。
- ログイン済みSearch Consoleでは、3か月（2026-05-30〜2026-08-29）の全体716表示・27クリック・CTR 3.8%・平均掲載順位20.8を確認した。`スポット産業医` は167表示・1クリック、`産業医 スポット` は289表示・0クリック、`産業医スポット` は28表示・0クリック。ページ文字列 `stresschecknew` は0表示・0クリック・クエリ行なしだったため、Site Kitの別期間クエリをpost 1555へ帰属させない。URL検査ではGoogle登録済み、2026-08-18クロール、取得成功、index許可、自己canonicalを確認し、再登録はリクエストしていない。
- Search Consoleのプロパティ一覧には静的トップ専用 `https://consult.kdkconslt-sngyouijm.com/` が既に存在した。3か月選択時（チャート上のデータ期間2026-08-13〜2026-08-29）は1クリック・16表示・CTR 6.3%・平均掲載順位8.4で、ページ行はトップが1クリック・16表示、`/return-to-work-pack/` が0クリック・1表示だった。クエリ表で確認できた `casetra` は0クリック・1表示で、1クリックをこの語へ帰属できない。WordPress用URL-prefixとは別表で継続取得する。
- 静的トップの公開版は2026-09-01の修正前ソースと一致していた。静的トップ→WordPress問い合わせの集計イベントと第一者帰属ブリッジをローカル追加し、構造検証、静的クリック動的検証、WordPress到着時の許容値・URL除去・ID生成を通した。公開版とのhashは意図どおり不一致で、修正版は未公開である。
- post 1555の新CTAは `stresschecknew` / `kiduki-retain` へ固定し、記事側・送信側の両許可リストへローカル追加した。`verify:conversion-tracking` は合格したが、公開HTMLには `stresschecknew` がまだなく、記事改稿前または同一リリース窓で子テーマをバックアップ付き反映する必要がある。
- WordPress公開1本・予約11本の実状態はWordPress APIで再確認済み。
- 記事exact CTAの本番反映には、exact versionのowner/physician approval、バックアップ付きapply、公開後テストが必要。
- GA4のキーイベント指定と6カスタムディメンション、`generate_lead` の既存受信、両Search Console URL-prefixの閲覧面、Flamingoの件数・期間、匿名公開タグ、非FlamingoのCasetra Leads経路は確認済み。残るのはCasetra Leadsの期間別件数、GA4不一致イベントの確定発生源と数値タグの所有元、登録後の新パラメータ受信、`article_service_click` / `service_contact_click` の実受信、WordPressと静的フォームの各1件の受入、両プロパティの自動取得経路、公開後query×page、権限管理された営業台帳の所在である。Site Kit週次メールは未購読で、継続送信を開始するには明示権限が必要である。
- 構造化した当日証拠は `evidence/measurement-live-audit-2026-09-01.json` に保存した。Googleアカウントのメールアドレス、問い合わせ内容、個人情報、健康情報は保存していない。

## Acceptance evidence

1. `npm run verify:conversion-tracking` が成功する。
2. `npm run test:conversion-runtime` がfresh/期限切れ/source_page/GA4-ID除外/generate_lead一回を動的検証する。
3. `npm run test:static-contact-runtime` が、問い合わせhrefを読込時は汚さず、実クリック時だけ許容済み導線を付け、`service_contact_click` からIDを除外することを動的検証する。
4. `npm run verify:article-plan` が12記事の主着地・副着地・CTA属性を検証する。
5. `npm run test:site-kit-report` が複数表示ページにまたがるクエリのクリック、表示、CTR、加重平均順位、`スポット産業医` の表示ページ集計を検証する。
6. `npm run verify:seo-ledger-template` が営業台帳テンプレートをヘッダー1行・承認列16個・個人情報/健康情報/検索クエリ列なしとして検証する。
7. `npm run verify:measurement-live-audit` が当日ライブ証拠の両Search Console URL-prefix、GA4キー指定、6カスタムディメンション、`lead_tracking_id` 除外、PII不在、Casetra読取不可とRBAC未変更を検証する。
8. `npm run verify:casetra-leads-aggregate-template` が件数専用テンプレートを検証し、実集計時は `node tools/verify-casetra-leads-aggregate.mjs --input <count-only-json>` が個人情報キー・レコード配列・合計不一致を拒否する。Leadレコード数と成功応答数を同一指標にしない。
9. 公開後に `npm run verify:live-match` が静的トップの完全一致を返し、公開問い合わせページから許容済みクエリを受け取れる。片側だけの公開を受入完了にしない。
10. 本番記事で `article_service_click` が1回届き、page 164と静的トップで `service_contact_click` が各1回届く。配信コードの存在だけで受信済みと判定しない。
11. テスト問い合わせ1件で `generate_lead` が1回だけ届き、Flamingoと通知メールに欠落がない。フォームを30分超開いた状態の期限切れ試験では、古い帰属IDが保存されない。
12. `source_system` と `inquiry_record_id` の組を、対応する第一者記録、営業台帳、契約記録で照合でき、WordPressの `lead_tracking_id` もCasetra Leadsの `lead_id` もGA4イベントに含まれない。
13. Search Consoleのクエリ×ページ集計、GA4の記事→サービス→問い合わせ遷移、第一者台帳のsource_article/source_page→契約を別々に報告できる。検索クエリ単位の個別契約帰属は主張しない。
14. `npm run audit:analytics-access` が当期・比較期の `queryPage.available: true` を返し、`trackedQueries.spotIndustrialPhysician` に表示ページと平均順位が入る。403やブラウザ表示だけでは自動取得済みと判定しない。
15. post 1555の公開HTMLに `stresschecknew` の許可リストが配信され、同記事CTA 1クリックで `article_service_click.article_slug=stresschecknew` と `target_offer=kiduki-retain` が1回だけ届く。
