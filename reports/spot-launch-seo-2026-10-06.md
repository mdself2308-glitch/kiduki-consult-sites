# KIDUKI SPOT 公開前SEO・任意計測確認

確認日: 2026-10-06（Asia/Tokyo）
状態: ローカル実装・模擬検証済み。本番未公開、GA4専用設定・実受信未確認。
案件票: [CT-20261006](../content/tasks/CT-20261006-kiduki-spot-self-service-booking.md)
正本: [コンテンツガイド](../content/README.md)、[計測仕様](../content/seo-measurement-spec.md)、[デザインブリーフ](../content/spot-booking-design-brief-2026-10-06.md)

10月8日は目標日で、公開済み日ではない。以下はSEOの技術条件と計測実装の確認であり、インデックス、順位、売上、予約・決済・面談の実運用を証明しない。医療・料金・運用文言は既存のTier S案件票で扱い、本作業では料金やサービス範囲を変更していない。

## 入口と公開状態

| URL / 対象 | ローカル確認 | 10月6日の公開GET |
|---|---|---|
| consultホーム `/` | 自己canonical。新SPOTへ直接進めるリンクあり | 200・canonical一致 |
| `/return-to-work-spot/` | index可、自己canonical、title/description/H1、sitemap掲載。旧申込フォームを新予約CTAへ置換 | 200・canonical一致。ローカル新CTA配信の証拠ではない |
| `/spot/` | 予約アプリ。自己canonical、noindex/nofollow、sitemap未掲載、no-referrer | 404（未公開） |
| `/spot/terms/` | 取引条件。自己canonical、noindex/nofollow | 404（未公開） |

検索入口と入力・認証を含む予約画面を分けているため、`/spot/` のnoindexは検索着地ページのnoindex不具合とは扱わない。ホームと既存サービスページから通常のhrefで予約画面へ進める。robots/canonical/sitemapの変更は行っていない。

既存WordPressの `/service/return-to-work-support/` と静的 `/return-to-work-spot/` は近いテーマを扱う。現時点のクエリ別表示先や競合は未確認なので、統合・canonical変更を独断で行っていない。2つのSearch Console URL-prefixを同じ期間で別集計し、実表示先を確認する。

## 任意計測の実装

予約画面末尾に「利用状況の計測（任意）」を追加。許可・拒否は同じ大きさ・操作数。未選択と拒否ではGoogleタグを読み込まず、予約はそのまま利用できる。予約情報送信への同意とは独立している。

同意の選択と期限のみ30日保存し、送信直前にも期限と最新選択を確認する。別タブの拒否はstorageイベントで反映し、開いたままのページも期限到来時に停止する。保存失敗時は古い許可を復活させず拒否を優先し、古い保存値の削除と拒否専用BroadcastChannelで停止を共有する。保存できない場合は画面にその旨を表示する。

| イベント | 発生条件 | 送信先 |
|---|---|---|
| `spot_cta_click` | ホームのSPOTリンク実クリック。リンク単位でページ内重複を抑止 | 既存ホームGA4 |
| `spot_menu_view` | メニュー表示、またはメニュー閲覧中の許可 | SPOT専用GA4 |
| `spot_booking_start` | 選択済メニューから企業担当者入力へ進む | 同上 |
| `spot_contact_verified` | 新規予約でOTP確認成功 | 同上 |
| `spot_slots_view` | 空き枠APIの正常応答 | 同上 |
| `spot_checkout_start` | Checkout API成功と決済URL検証・再開情報保存後 | 同上 |
| `spot_booking_confirmed` | 認証済GETで現在の注文IDと一致する `CONFIRMED` を取得 | 同上 |

Stripeから戻ったURL、画面表示だけ、支払い待ち、履行途中、要確認状態では完了を送らない。`spot_slots_view` は空き枠検索結果の閲覧であり、予約可能枠が存在した件数とは呼ばない。

専用イベントのパラメータは `send_to`、固定 `source_page=spot-booking`、固定ページURL・タイトル、空referrer、transport方式のみ。企業・担当者・従業員・健康情報、面談種類、価格、日時、注文/Case/医師/認証ID、入力・リンクの値を送らない。query/fragmentはタグの読込み前にアドレスバーから除去する。広告同意は常に拒否、Google signalsと広告パーソナライズは無効、ホームとは別cookie prefix・予約画面pathを使う。

重複抑止キーはタブのsessionStorageに最大24時間・100件で保持し、GA4へ送らない。同じタブの再読込み・状態ポーリングは抑止するが、別タブ、保存消去、通信障害を含めた完全な一回送信は保証しない。許可者のみの参考集計であり、予約数・売上の正本ではない。ホームと予約画面のGA4を個別顧客IDで連結しない。

## 計測を有効にする前の条件

`consult/spot/index.html` の `data-spot-analytics-id` は空、`data-spot-analytics-reviewed` はfalseのまま。許可されても現状は送信しない。既存ホームID `G-JQFWB6XG2E` はコードでも拒否する。

この2属性による明示停止は、公開前検証でも正常な設定として扱う。GA4の認証・設定待ちだけでSPOT受付開始を止めず、停止中は第一者の予約・売上記録で業務成果を確認する。計測有効化時は専用IDとreviewed=trueの両方を必要とし、属性欠落や中途半端な設定は拒否する。JSONは `analyticsStatus` と `analyticsFollowUp` を公開の必須条件 `prerequisites` から分ける。現在は `disabled_explicitly` で、専用GA4設定・実受信は未確認の後続作業である。

専用stream管理画面で以下を読み戻してから設定する。

1. Enhanced Measurementを全項目OFF。履歴変更pageview・form・outbound・downloadなどの自動送信を含む。
2. Google tagのAllow user-provided data capabilitiesをOFF。自動検出・CSS指定・user_data送信を追加しない。
3. 追加送信先・広告連携・クロスドメイン連携を使わず、別タグやGTMを混在させない。
4. 公開後の許可・拒否・撤回試験で、URL/タイトル/パラメータ・自動イベントを実ネットワークと管理画面で確認する。実顧客の情報や実予約を検証用に使わない。

`send_page_view:false` だけでは拡張計測による履歴変更イベントを止められないため、管理画面側の確認が必要。[Google公式 page views](https://developers.google.com/analytics/devguides/collection/ga4/views)、[Enhanced Measurement](https://support.google.com/analytics/answer/9216061)

user-provided dataの自動検出はページ上のメール・電話・氏名などを対象にできる。通常の拡張計測とは別にOFF確認が必要。[Google公式 user-provided data](https://support.google.com/analytics/answer/14078702?hl=en)

設定・同意・無効化の実装根拠: [GA4 config](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)、[Consent](https://developers.google.com/tag-platform/security/guides/consent)、[ga-disable](https://developers.google.com/tag-platform/security/guides/privacy)、[PII送信の禁止](https://support.google.com/analytics/answer/6366371?hl=ja)。このコードと同意UIだけで外部設定の安全性を確認済みとはしない。

## 検証結果

| 検証 | 結果・範囲 |
|---|---|
| `node tools/verify-spot-launch.mjs` | 33項目PASS。既定はローカル読取と隔離VM。任意計測は明示停止で正常。商取引開示の電話・承認未了のためreleaseReady=false |
| 同 `--live` | 公開URLへのGETのみ。ホーム/着地200、予約/規約404を記録。公開・送信・予約操作なし |
| 同 `--release` | 計測の明示停止、または専用IDと設定確認フラグが揃った有効化を許容。半端な設定は拒否。現状は商取引開示の電話・承認のみが期待する失敗。決済や面談の受入判定を代替しない |
| `node tools/verify-conversion-tracking.mjs` | 39項目PASS。旧SPOTフォーム期待を置換。Pack/CF7/既存帰属の検証を維持 |
| `node tools/verify-kiduki-spot-source.mjs` | 17項目PASS |
| `node tools/test-static-home-contact-runtime.mjs` | 既存問い合わせ導線5項目PASS |
| `node tools/verify-seo-automation-schedule.mjs` | 既存3件ACTIVE、設定整合PASS。変更なし |
| 実Chromium・API/Google完全mock | 390/860/1440px、同等の許可/拒否操作、未選択送信なし、拒否中も企業入力へ進める、URL除去、固定payload、別タブ拒否・保存消去、保存強制失敗時の停止共有をPASS。consoleerror 0・外部要求送信0 |

独立レビューで検出した別タブ・期限切れ・書込失敗時の古い許可復活を修正し、対応する回帰fixtureを追加した。その他の変更で予約API・決済・メール処理を改変していない。

状態遷移の追加確認では、`BOOKING_CONFIRMING` と `COMPENSATING` も確定イベントを送信しないことを検証した。GA4の公開条件変更は検証ツールだけで、予約UI・計測の送信処理・商取引表示・決済/予約受入の条件は変更していない。

証跡: [スマートフォン](casetra-calcom-audit-evidence-2026-10-06/spot-analytics/choice-390.png)、[デスクトップ](casetra-calcom-audit-evidence-2026-10-06/spot-analytics/choice-1440.png)、[browser結果](casetra-calcom-audit-evidence-2026-10-06/spot-analytics/results.json)、[local結果](casetra-calcom-audit-evidence-2026-10-06/spot-analytics/local-checks.json)、[公開GET結果](casetra-calcom-audit-evidence-2026-10-06/spot-analytics/public-readback.json)。画像のメニューは模擬カタログであり、本番価格・受付開始の証拠ではない。

## 既存監視の再利用

新しい重複automationは作成していない。既存の `kiduki-seo-milestone-review`（毎日7:30）、`kiduki-seo-growth-loop`（月曜8:00）、`kiduki-seo-monthly-funnel-review`（毎月1日8:30、すべてJST）を使う。

10月6日の既存記事レビュー7件は取得経路の403によりpartialで、次回retryは10月13日8:00以降。別の5件は10月9日8:00以降。これは当該レポートの取得結果であり、本作業でGA4/GSCを新しく取得した結果ではない。`seo-milestone-2026-10-06.md`、`seo-growth-loop-2026-10-05.md`（既存ローカル記録。今回のレビュー差分には含めない）

SPOTは現行記事manifestに自動追加されない。公開を確認した日を記録した後、既存の週次・月次レポートへ、静的ホーム/既存サービス着地のquery×pageとSPOTの参考イベントを追加する。GA4/GSCの読取ができない期間は未確認と記録し、0件や順位改善に置き換えない。

公開後は次を別々に確認する。

- 技術: HTTP、canonical、インデックス可否、内部CTA、新版の配信、予約画面のnoindex。
- 検索: 2つのURL-prefixで同一期間・同一条件の表示、クリック、CTR、順位、表示先。新規ページの即時順位上昇は約束しない。
- 行動: 許可者のメニュー→企業確認→日時→決済→確定を集計し、少数・途中参加・計測拒否の偏りを明記。
- 業務成果: 権限のある第一者記録から、確定有料予約、実施、意見書送付、再利用を件数で確認。GA4や検索クエリと個別人物を照合しない。

公開日を確定する前に7/28/90日の達成記録や計測済み状態を作らない。SEO・計測コードの完了と、10月8日の公開・本番受付・外部計測完了は別の状態として引き継ぐ。
