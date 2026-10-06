# CasetraとCal.comの現状確認

確認日：2026年10月6日 JST。対象は既存の企業登録、予約、面談、意見書送付、料金・請求のつながり。コードとログイン済みCal.com管理画面、Azure設定、現行デプロイを読み取り確認した。設定変更、予約作成、決済、通知送信、公開・デプロイは行っていない。

**Casetraには、会社専用予約、担当医のCal.com枠選択、案件との連携、面談記録、意見書PDF生成、企業への自動通知までの実装が既にある。ただし「新規企業がメールだけで登録し、その場でカード決済して当日面談する」一続きのサービスには、現在の登録・受付・決済の設定はなっていない。特にCal.comの通知先に削除済み旧APIが残り、現行APIへの予約通知がどの経路で届くかを確定できていない。**

新サービスの提案や料金の変更はこの記録の対象外。「既存料金表の総額、追加費用なし」というユーザーの方針を、現行の旧料金コードや追加課金ロジックで上書きしない。

## 現在ある流れ

```text
既存企業の準備・担当医の設定
  → 会社専用登録コードで担当者登録（Microsoft またはメールの6桁コード）
  → 会社専用予約リンク、または案件から予約ページへ
  → 面談目的・対象者・FB・会議方式を入力
  → 担当医個人のCal.comイベントで日時選択
  → Cal.comの予約通知をAPIが受信
  → Booking・Case・日程タスク・資料提出用Boxへ反映
  → 医師が面談記録を入力し、医師出力タスクを完了
  → 意見書PDF生成・Box保存
  → 予約者を優先した宛先にPDFダウンロードリンクと受領確認リンクを自動メール
  → 受領記録・企業判断・必要に応じた次回案件
```

この図は実装上の接続を示す。現在のCal.com通知経路と、実予約から受信箱への到着までの通し動作は別途の未確認事項である。

| 段階 | 確認できた現在の挙動 | 重要な条件 |
|---|---|---|
| 新規問い合わせ | 無料15分相談のLead登録とCalリンクがある | 本業面談の会社専用予約とは別入口 |
| 企業登録 | 既存企業に担当者を登録。MicrosoftまたはメールOTPを使用 | メール入力だけで未登録法人を新規作成する入口ではない |
| SPOT・PACKのアクセス | 月額契約なしの限定アクセスを扱う実装がある | 事前の招待、対象Case、期限が前提。一般公開の即時登録とは異なる |
| 予約入口 | 会社トークン付きURL。Caseからは案件・従業員・担当医も引き継ぐ | activeな担当医とCalユーザー名が必要 |
| 医師の選択 | 会社に紐づく医師個人のCalページを表示 | Cal READYはチーム参加とユーザー名の確認であり、全連携の検査済みを意味しない |
| 日程調整 | Googleの予定を除いたCal.comの空き枠から選択 | 実際の空き枠は受付スケジュール、締切、イベント時間にも依存 |
| 会議URL | 標準は既定会議アプリ、または企業指定URL | 調査したアカウントの既定はMicrosoft Teams。実発行メールは未検証 |
| 資料提出 | Boxの提出領域と定期監視がある | ファイル受領と医師による内容確認は別状態 |
| 面談記録 | TK-IV-01を記録・完了 | この保存だけで意見書送信は始まらない |
| 意見書 | TK-DO-01を完了するとPDFを生成し、Boxへ保存して自動通知 | 必要項目、予約との紐付け、宛先等が必要。別途OPS送信を必須としない |
| 受領・フォロー | 受領確認、会社判断、次回Case作成がある | 次回Case作成は次回Cal予約の自動確定ではない |
| 支払い | 実施報告に基づく利用明細・請求書・入金済み記録がある | 現行の面談予約とカード前払いを結ぶ処理は確認できない |

## 意見書送付の正確な動作

ユーザーが指摘した自動化は存在する。正確な入口は **医師出力タスクTK-DO-01の完了** である。途中保存はIN_PROGRESS、完了はDONEとして扱い、完了時に面談記録と医師出力からPDFを生成する。

- メールは**PDF添付ではなくダウンロードリンクと受領確認リンク**。自動生成後に別のOPS送信操作を挟む必要はない。
- 通常の自動送付先は予約者側のメールを優先し、なければ企業の納品通知メールを使う。`employee_email`という項目は直接参照しないが、予約者の役割や本人アドレスとの一致を除外する判定はない。**従業員本人が予約者の場合、本人の予約者メールが送付先になり得る。** 常に企業マスターの代表メールや企業担当者へ送信するわけではない。
- APIのメール送信フラグは本番でtrue。ただし送信処理の成功記録と、実際の受信箱への到着は同義ではない。
- Boxは同名PDFの版を管理する。片方の保存先だけ成功した際の補修処理もある。
- メール送信だけが失敗した場合、調査したBox補修ワーカーの再送対象には自動的に入らない。手動再送機能はある。
- 72時間後の自動受領はシステム上の状態であり、人が読んだ証拠ではない。ダウンロードリンクの既定期限72時間、受領確認トークン14日とは役割が異なる。

根拠：[完了処理](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/src/functions/caseos/todos.ts:521>)、[PDF生成](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/src/caseos/services/opinionLetterGenerator.ts:616>)、[自動通知と宛先](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/src/caseos/services/deliverableNotifier.ts:150>)、[本人予約の入力](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/docs/booking/index.html:3976>)、[Calメールへの転記](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/docs/booking/index.html:4563>)。

## 予約メニューの実装

| Casetra予約画面の目的 | 面談・FBの設定 | Cal側で照合した内容 |
|---|---|---|
| 長時間労働・健診事後措置 | 面談20分、HRは任意でFB15分を追加して35分 | 20分、35分イベントあり |
| ストレスチェック後面談 | 面談30分、任意FB15分で45分 | 30分、45分イベントあり |
| 健康相談 | 面談30分、任意FB15分で45分 | 30分、45分イベントあり |
| 復職判定面談 | **面談40分＋FB30分の70分。FB必須** | 通常70分と企業指定URLの70分が実在 |
| 緊急対応 | FB必須、画面説明は60分枠 | 60分イベントが実在。ただし受付締切と説明に矛盾あり |
| HR相談・協議 | 30分 | オンライン30分のテンプレートあり |
| 研修・講話 | 30分／60分 | 両方のテンプレートあり |
| 健診判定 | 30分、種類・枚数・期限を入力 | 30分のテンプレートあり |
| 衛生委員会 | 30分 | 30分のテンプレートあり |
| 定期産業医訪問 | Casetra画面は60分 | Calの同名テンプレート一覧は45分。slugの個別照合は未実施 |
| 単独の口頭FB | 通常フォームの最上位選択肢には独立入口なし | **HR報告・協議15分が実在**。まとめ用FB30分も存在 |

復職を「FBなしでも受けられる既存メニュー」と理解するのは誤り。現状はFB必須。単独FBのCalイベントがあることと、既存面談に後日FBを追加して決済・案件管理まで完結することも区別する。

HRには通常／まとめ予約があり、従業員本人向けには面談に絞った分岐がある。非定期訪問の通常予約はオンライン固定。onsite用ルートがソースにあっても、すべてが通常画面から選択できるわけではない。

根拠：[予約画面のメニューと分岐](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/docs/booking/index.html:3568>)、[復職と緊急のFB必須処理](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/docs/booking/index.html:4353>)。

## Cal.comで確認した実設定

対象はユーザーがログインした `kdk-k6whio`、チーム `kiduki`（ID 147934）。他の医師アカウントすべての接続状態を検査した結果ではない。チーム一覧79件を読み込み、テンプレート61件、ラウンドロビン18件を確認した。旧ラウンドロビンには非表示・old付きslugのイベントが残り、通常のCasetra予約は医師個人のslugを使う。

| 設定画面 | 種別 | 長さ | 最小通知時間 | 前後バッファ | 有料予約 |
|---|---|---:|---:|---:|---|
| [4747551](https://app.cal.com/event-types/4747551?tabName=setup) | 長時間労働・健診事後措置の通常テンプレート | 20分 | 2日 | 0分／0分 | OFF |
| [4747569](https://app.cal.com/event-types/4747569?tabName=setup) | 健康相談の通常テンプレート | 30分 | 2日 | 0分／0分 | OFF |
| [4747571](https://app.cal.com/event-types/4747571?tabName=setup) | 復職の通常テンプレート | 70分 | 2日 | 0分／0分 | OFF |
| [4747547](https://app.cal.com/event-types/4747547?tabName=setup) | 緊急オンラインの通常テンプレート | 60分 | 2日 | 0分／0分 | OFF |
| [4747667](https://app.cal.com/event-types/4747667?tabName=setup) | 個人に配布された復職・企業指定URL枠 | 70分 | 2日 | 0分／0分 | OFF |
| [4747663](https://app.cal.com/event-types/4747663?tabName=setup) | 個人に配布された単独HR報告・協議 | 15分 | 2日 | 0分／0分 | OFF |

2日は開始まで48時間以上必要という設定。したがって調査した枠は、当日・翌日に空きがあっても通常は予約できない。緊急テンプレートの説明「48時間以内の対応」とこの締切は整合していない。全79件の詳細設定を個別検査したわけではない。

復職の通常テンプレートと企業指定URLの個人枠は手動承認OFF、予約者メール確認OFF。テンプレートのロック用スイッチと機能のON/OFFは別々に確認した。

### カレンダーと会議

- Googleカレンダーは2アカウント接続済み。独自ドメインの業務アカウントが予定の追加先で、重複チェックもON。
- もう一方の業務Gmailアカウントと、その共有「予定表」は重複チェックOFF。そこだけにある予定はこの設定では空き枠から除外されない。
- 既定の「運営時間」は月〜金9:00〜19:00、土9:30〜12:00、Asia/Tokyo。別のWorking Hoursは月〜金9:00〜19:00。Googleの空きだけを無条件に公開する構成ではない。
- インストール済み会議アプリはCal Video、Google Meet、Microsoft 365/Teams、Zoom。**既定はMicrosoft Teams**。復職の公開ページにもMS Teamsと表示された。
- 企業指定URLの復職イベントはcustom_attendee_location。一方、説明に「自動的に接続URLが発行」ともあり、文面に混在がある。

確認画面：[カレンダー](https://app.cal.com/apps/installed/calendar)、[受付時間](https://app.cal.com/availability)、[会議アプリ](https://app.cal.com/apps/installed/conferencing)。

### 決済と通知

- インストール済み支払いアプリ一覧はAt locationとCal Pay。Stripeという独立項目は表示されなかった。Cal Payの加盟店設定・残高・入金は今回調べていない。
- 上表の6イベントは有料予約OFF。Casetraの現行ソースにもStripe Checkout／PaymentIntentを予約に結ぶ処理を確認できなかった。
- 通常復職テンプレートのワークフロー画面には確定・変更・取消等のカスタムメール候補があるが、確認した各トグルはOFF。これはCal標準の予約通知メールがすべてOFFという意味ではない。

確認画面：[支払いアプリ](https://app.cal.com/apps/installed/payment)、[復職ワークフロー](https://app.cal.com/event-types/4747571?tabName=workflows)。

## 予約通知先の不一致

[アカウントWebhook一覧](https://app.cal.com/settings/developer/webhooks)には有効な設定が5件ある。Make宛て3件、旧Casetra API宛て1件、旧occupational health platformのAPI宛て1件。Makeの個別受信用URLはこの資料に保存しない。

旧Casetra宛ては `kiduki-consult-api-dev-001.azurewebsites.net/api/webhook/booking` で、予約作成・変更・取消を対象にしていた。しかし次の現状と一致しない。

1. 現行構成資料には旧001を2026年5月10日に削除したと明記され、Front Doorの転送先はflex-003。
2. 当日のAzureサブスクリプション内Function一覧でも、該当する稼働APIは `kiduki-consult-api-dev-flex-003` のみ。
3. 旧001のホストは今回の名前解決に失敗。同じ環境で現行flex-003のホストは解決できた。
4. 通常復職テンプレートと企業指定URLの復職個人イベントのWebhook画面は、個別Webhookなしの表示。アカウント全体のWebhookがないという意味ではない。

**旧001向けの通知先が現行構成と不一致なのは確認済み。予約取り込み全体が停止しているかは、Make等から現行APIへの転送が未確認なので断定しない。** 現行ソース・runbookにそのMakeシナリオの根拠は見つからなかった。

根拠：[移行後構成](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/docs/runbooks/casetra_worktreat_inventory_cleanup_2026-05-10.md:14>)、[旧API削除の記録](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/docs/runbooks/azure_functionapp_flex_consumption_rollout.md:181>)、[現行Webhook入口](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/src/functions/webhookBooking.ts:103>)。

## コードで確認した接続上の不一致

以下は現行ソースの条件を追跡し、主要4件を別担当でも反証確認した結果。実際の誤予約・誤請求の発生件数を示すものではない。

| 項目 | 確認できたこと | 影響の限界 |
|---|---|---|
| 復職・緊急の時間パラメータ | 復職70分slugへduration=55を送る。緊急60分も種別により35／45／55を送る | 公開の復職ページへduration=55付きでアクセスすると70分表示を維持し、そのパラメータはURLから除去された。**55分予約になると断定しない**。予約確定は未実施 |
| まとめ予約 | HR画面は120／180／240分ブロックを提供するが、必須保存先POST /api/bundlesの受け口が現行src・登録・追跡distにない | 外部ルーティングの有無と実POST結果は未確認。通常予約とは分ける |
| 同じCaseへの別予約 | 明示case_idが同じで旧Box領域があると、変更イベントでなくても旧予約をRESCHEDULED扱いの領域状態にして同じ予約チェーンへ寄せる | 旧予約のstatus自体をcancelledにはしない。追加FBを同Caseで別予約にする際の実害は未検証 |
| 種別と請求用SKU | CaseにはSKUを設定するが、新規Bookingへ自動転記するwriterが見つからない。実施報告はBookingのSKUを読む | 本番のBILLING_DEFAULT_BASE_SKUは未設定。既存DBの補完・単価・上書きで金額は変わるため、誤請求額は不明 |
| 会社画面の後処理 | FULL Companyに表示されるClose／Followup／VOIDと、OPS限定API権限に不一致 | 画面上の操作実行は未実施 |
| 通知だけの失敗 | Box保存成功後、メールだけ失敗した記録はBox補修ワーカーの抽出条件に入らない | 手動再送はある。今回未着が実際に発生したとするものではない |
| 予約のCase補完 | Calからcase_idが戻らない場合、同じ企業の直近6時間の最新予約intentで補完 | 予約者・従業員で照合していないため、同一企業の並列予約での関連付けは未検証 |
| 健診判定の補足情報 | 種別・枚数・期限をCal URLへ渡すが、標準正規化マップには対応キーがない | RawEvent等とは別に、Bookingの業務項目として保持できるかは未確認 |

根拠：[時間計算](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/docs/booking/index.html:4458>)、[まとめ保存](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/docs/booking/index.html:3312>)、[同Caseの継承](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/src/domain/upsertFromNormalized.ts:438>)、[実施報告のSKU](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/src/functions/portalWorkReport.ts:412>)。条件と反証の詳細は別紙に残した。

## 料金と請求の現在地

旧非会員料金表の現存候補は、料金seedの `CONS-SPT-*`、`FB-SPT-*`。オンライン20分22,000円、30分32,000円、40分43,000円、FB15分16,000円、FB30分32,000円が残っている。**現在のseedでは履歴用active:falseで、実行時の本番単価を確認した結果ではない。** seed自体には旧価格の税区分が定義されていない。

一方、現行KIDUKIの復職単発60,000円等は別商品。過去の30分22,000円案、旧SPT料金、現在の商品価格を混ぜない。「あの料金表」がどの版を指すかを、この資料だけで新たに確定しない。

実装上の現在の請求は、実施報告から面談・FB・緊急・延長・追加書面・英語・交通費等の明細を作り、請求対象をまとめる方式。PACK_INCLUDED／KIDUKI_SPOT_INCLUDED／KIDUKI_INTERNAL等は別扱い。請求書の入金済み処理はあるが、予約時のカード払いではない。

本番価格はCosmosの料金マスター、料金式・上書き、環境値等で解決するため、seedの金額をそのまま「現在請求される額」とは扱えない。追加費用なしの総額をその場で確定する新しい方針が、予約・決済・請求の全経路へ反映済みとは確認できない。Basic／Retainの含有時間や正本文書間の差も別紙に記載した。

根拠：[旧SPT料金の保存先](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/seeds/billing/charge_catalog_v1.json:110>)、[KIDUKI料金正本](</Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/pricing-growth-canonical.md:169>)、[実行時の単価解決](</Users/dmmac/casetra_active/kiduki-consult-api-deploy/src/shared/chargeResolver.ts:177>)。

## 現行デプロイと検証範囲

| 対象 | 当日確認した状態 |
|---|---|
| API | local・GitHub main・稼働中 /api/version が `c5c8af0a8ccf65de43b9da0137e822a87cf984b7` で一致。build 2026-10-06T02:45:41Z |
| APIデプロイ | [Actions 37405677512](https://github.com/mdself2308-glitch/kiduki-consult-api/actions/runs/37405677512) 成功 |
| Portal | local `bcbe12d799e39e6d2daf6c640d5c4261600fde46`。[Actions 37385638601](https://github.com/mdself2308-glitch/portal-ops/actions/runs/37385638601) 成功。画面から取得できる稼働SHAは未確認 |
| 相談サイト | local `cc9689a6e327317fa0bfa3c7c73e69936b7c7876` |
| Azure | Azure サブスクリプション 1、rg-kiduki-consult-dev、kiduki-consult-api-dev-flex-003、Running |
| Case同期 | CASEOS_ENABLE=true。これが予約からCaseへの直接条件 |
| 関連フラグ | FEATURE_WEBHOOK_INGEST_ENABLED、FEATURE_CAL_SYNC_ENABLED、FEATURE_MAIL_DELIVERY_ENABLED、FEATURE_BOX_PROVISIONING_ENABLED、FEATURE_ENTRA_PROVISIONING_ENABLEDはtrue。ただし各フラグが制御する経路は同一ではない |

企業登録・面談記録・PDF・再送・請求・予約復帰等の既存テストは内容を確認した。2026年9月の受入記録を10月の実稼働証拠に転用していない。今回、新しい実予約、変更・取消、会議URL発行、意見書メールの受信、カード決済の通し試験は行っていない。実装・設定の調査であり、全導線の受入完了とは区別する。

API、Portal、相談サイトに編集は行わず、KIDUKIの既存未コミット変更も維持した。追加したのは本資料と調査別紙だけ。

## 調査別紙

- [予約と料金のソース監査](</Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/reports/casetra-calcom-audit-evidence-2026-10-06/booking-source-audit.md>)
- [企業登録から意見書送付までのソース監査](</Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/reports/casetra-calcom-audit-evidence-2026-10-06/case-delivery-source-audit.md>)
- [主要4件の独立反証レビュー](</Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/reports/casetra-calcom-audit-evidence-2026-10-06/booking-independent-review.md>)

別紙の各担当の「未確認」は担当範囲時点の記述。Cal実設定・本番フラグ・復職公開ページの時間表示など、後から統合確認した事項は本資料を優先する。
