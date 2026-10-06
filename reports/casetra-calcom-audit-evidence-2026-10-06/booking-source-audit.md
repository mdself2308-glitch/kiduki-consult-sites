# Casetra予約・料金連携 現状監査（2026-10-06、読み取り専用）

## 調査範囲と証拠水準

ソース読取のみ。予約作成、送信、設定変更、テスト実行、秘密値・本番個人データの閲覧は実施していない。Cal管理画面・デプロイ済みSHAの照合は親担当。以下はコードに存在／コードの呼出しがつながることの確認であり、現行本番E2Eの成功を意味しない。

基準ディレクトリ A=`/Users/dmmac/casetra_active/kiduki-consult-api-deploy`、P=`/Users/dmmac/casetra_active/portal-ops`、C=`/Users/dmmac/casetra_active/casetra-consult-swa`、K=`/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress`。

| repo | HEAD | status --short |
|---|---|---|
| A | c5c8af0a8ccf65de43b9da0137e822a87cf984b7 | clean |
| P | bcbe12d799e39e6d2daf6c640d5c4261600fde46 | clean |
| C | cc9689a6e327317fa0bfa3c7c73e69936b7c7876 | clean |

親README/AGENTS、A・PのAGENTSと運用README、CのREADMEを確認。graveyard/archiveは実装根拠にしていない。

## 入口は3種類

1. **新規の無料相談**：C/public/index.html:1096–1097 はLead APIと15分無料相談Calリンク。回答送信後にCalへ遷移（1185）。送信失敗時も「回答を引き継がず無料相談へ」は残る（1169–1170）。会社専用の本業面談ページとは異なる。
2. **会社専用予約リンクから直接**：A/src/functions/bookPage.ts:10,15–28がA/docs/booking/index.htmlをGET /api/bookで配信。tトークン必須（index:3396–3413）。company-contextはトークンで既存企業を引き、名前・プラン・住所を返す（companyContext.ts:18–70）。この入口自体はメール会社登録ではない。
3. **Caseの日程調整から**：P/app/cases/[caseId]/page.tsx:1031–1084で会社予約URLにcase_id、employee_id、担当医、担当者連絡先を追加。company modeではactiveなCal連携医がいなければリンクを返さない（1040–1050）。通常フォームを通して同じCal iframeへ。

Caseから開くとA/index:3546–3551でbooking-intentをPOSTする。APIは会社トークンを照合しCase IDをRawEventへ保存（bookingIntent.ts:28–78）。CalからCase IDが戻らない場合、同じ企業の直近6時間の最新intentを採用する（upsertFromNormalized.ts:823–840）。予約者・従業員・ブラウザとの照合条件はこのfallbackにはないため、同一企業で並列予約がある場合の正しい関連付けは実機未検証。

## 予約画面にある全メニュー

定義A/docs/booking/index.html:3568–4262。単に自由に20/30/40分を選ぶ画面ではなく、面談目的から長さを決定する。

| 画面のメニュー | 長さ／FB | 生成する通常online slug（4380–4451） |
|---|---|---|
| 長時間労働面談 | 20分、HRなら任意+15分FB | consult-online-20 / consult-online-35 |
| 健診事後措置面談 | 20分、HRなら任意+15分FB | 同上 |
| ストレスチェック後面談 | 30分、HRなら任意+15分FB | stress-check-online-30 / stress-check-online-45 |
| 健康相談 | 30分、HRなら任意+15分FB | health-consult-online-30 / health-consult-online-45 |
| 復職判定面談 | 40分、FB30分強制、70分枠 | consult-online-70 |
| 緊急対応（48時間以内） | FB必須、60分枠という画面説明 | consult-urgent-online-fb |
| HR相談・協議 | 30分 | hr-consult-30 |
| 研修・講話 | 30/60分を選択 | training-online-30 / training-online-60 |
| 健診判定 | 表示30分。種類・予定枚数・希望期限を入力 | health-check-work |
| 衛生委員会 | 30分 | committee-online |
| 定期産業医訪問 | 60分 | retainer-60 |

面談・HR相談は企業指定会議URLを選ぶと`-custom`が付く。最上位メニューには独立した「FB15分／30分追加購入」はない。HR相談30分とまとめ用FB30分は存在するが、同一Caseの過去面談への後日追加購入経路と同一視できない。

### 条件分岐と入力

- 役割は従業員本人／HR等（3570–3577）。従業員は面談だけ。会社正式案内ありなら長時間／ストレス／健診、なしなら健康相談（3744–3816）。従業員はオンライン・当社Teams固定（4327–4331）。
- HRは通常／まとめ（3595–3613）。通常復職と緊急はneedsFeedback=yesを強制（4353–4355）。通常の他面談は+15分選択（3964–3972）。緊急の画面は「追加緊急料金・FB必須・60分」と記載（3944–3960）。当日実施を保証する処理ではない。
- 非定期訪問はオンライン固定、対面選択ステップは常にfalse（3677–3687,3880–3890,4333–4341）。onsite slugはコードにあるが通常画面では到達しない。
- HR面談では担当者氏名・メール・電話、従業員氏名・メールが必須、社員番号は任意（4000–4057）。言語JP/EN（追加料金表示）、標準産業医意見書以外の書面希望（4060–4078）。
- HR相談は相談区分+概要（4093–4121）、研修は時間/テーマ/対象/人数/言語（4082–4089,4124–4175）、委員会は種別/名称/議題（4180–4221）、健診判定は健診種別/枚数/希望期限（4225–4259）。
- 健康相談では緊急状況のチェックと該当時の予約停止を実装（3820–3876,5916–5965）。臨床的妥当性の評価は本監査の範囲外。
- メニュー制限表は旧日本語プラン名3種類だけ（3373–3377）。未設定や未認識のプラン名では全メニュー開放（4666–4682）。STARTER/STANDARD/PLUSやlimited tierを画面で判定する対応表ではない。

## 医師・会議・Calとの接続

- publicCompanyDoctors.ts:60–84は企業に紐付くactive医師、provider_id/cal_usernameあり、statusがREADYまたは未設定を返す。厳密にREADYだけではない。
- 通常iframeは当該企業のselectedDoctor.cal_usernameに切り替える（index:6930–6952）。provider_id指定で医師選択をロックし、指定なし複数医師ならタブを出す（6940–6942,6982–7014）。P側コメント1064–1065の「強制しない/ヒントだけ」と、A側provider_idでロックは文言不整合。
- 設定はslug単位。全onlineルートにA/config/eventTypeMapping.v1.jsonの対応はある。数値Cal event IDを固定照合する通常画面ではない。Cal側の各医師の同名イベント存在・公開・長さ・空き枠・決済は本監査では未確認。
- Cal医師招待/同期APIはmembership登録を扱う（portalCalProvisioning.ts:146–225,368–448）。accepted+usernameでREADY。Google接続、各event slug、会議アプリ、Webhook設定を検証してREADYにする実装ではない。
- 通常フォームの会議方式は当社Teams／企業指定URL（3894–3940）。企業指定URLはCalのcustom_urlに渡す（4574–4583）。A/upsertFromNormalized.ts:556–567の保存優先順位はcustom_url→Cal API参照→Webhook URL→旧値。ここで毎回Teamsを新規生成しているわけではない。
- Calに渡す会社/Case/連絡先・選択情報の構築は4479–4644。氏名・メール・相談概要等がクエリになり、完成URLをconsole.logする（6954–6956）。診療情報の実データは本監査で閲覧していない。

## まとめ予約の実装境界

- UIに120/180/240分のブロック、長時間20/健診20/ストレス30の人数、最後にFB30がある（5288–5350）。復職は通常予約案内（5323）。担当者情報・社員別氏名/メール・順序、custom時は社員別URL入力と重複回避案内（6342–6414）。
- `saveBundleConfig`はPOST `/api/bundles`（3312–3328）。companyId/plan/ブロック/順序/担当者を保存要求し（6592–6608）、成功後に予約へ。
- **現行src登録には `/api/bundles` の保存実装が見つからない。** entryはsrc/index.ts→adapters/casetra/register.ts→shared/registerCoreFunctions.ts:1–106。bundles route/functionはない。bundleConfigs repositoryとWebhookでcompany_idを引くreader（upsertFromNormalized.ts:968–977）は存在。全tracked srcに後続予約の自動作成実装も未確認。別サービス実装があるか・実環境ルーティングは親の確認対象。
- まとめ画面は最初の面談のみCalへ出し残りは自動作成と表示（6680–6728）。しかし通常のshowCalendarEmbedを使わず、CAL_BASE_URL（既定team/kiduki）からURL構築（6625–6637）。selectedDoctor、case_idを渡していない。company_idもCalクエリに渡さず、bundle readerによる解決が前提。

## Webhook→Booking→Case→成果物

子監査担当も同一SHA/cleanを確認。以下すべてA基準。

- webhookBooking.ts:76–85,92–106,124–130,177–182：POST /webhook/booking、HMAC-SHA256署名、定時間比較、webhook_ingestフラグ→processRawEvent。
- processRawEvent.ts:28–77：RawEvent保存→必須項目チェック→正規化→Booking upsert。upsertFromNormalized.ts:246–249：企業未解決ならLeadに保留しBookingなし。
- upsertFromNormalized.ts:696–714：CASEOS_ENABLE=trueでCase同期。同期失敗をログ後に握りつぶして処理自体はcompleted扱い。Webhook HTTP200はCase反映の証明ではない。
- bookingSync.ts:172–279：指定Case更新、なければテンプレートで作成、予約と日程Todoを接続。545–553：日時あり非キャンセルでDRAFT→ACTIVE。支払済み条件はない。
- upsertFromNormalized.ts:381–429：Cal rescheduleUidによる旧Booking探索、Box/資料/booking_chain_id引継ぎと旧予約取消。
- **同一Caseの別予約を変更と扱う可能性**：upsertFromNormalized.ts:438–481はisReschedule条件なしで同一case_idの別Booking/Box workspaceを探索、旧予約をRESCHEDULED扱い、chainを継承。bookingSync.ts:527–538は単一booking_summaryを上書き。後日FB等の別予約保存は、独立した複数予約としての実機証明なし。
- **遅延取消の影響**：bookingSync.ts:669–733はCase予約要約と日程Todoを取り消す際、現在要約のbooking_idと取消対象の比較なし。旧予約取消通知が新予約要約へ作用する可能性、未実証。
- Case表示はbookingSync.ts:472–524→portalBookings.ts:65–119。P側refreshBooking（1517–1615）は別タブ復帰/postMessage後に認証APIを再取得し反映待ち/失敗を表示、未保存入力は保持。postMessage受信だけで予約データを確定扱いしない。
- opinionLetterGenerator.ts:636–690が面談記録TK-IV-01と医師出力TK-DO-01を読む。functions/caseos/todos.ts:521–568,621–669で医師出力完了後PDF/Box/納品通知。予約確定だけで面談記録・意見書が自動完成する構造ではない。

## 料金・請求の現状

### カタログに存在する価格（runtimeの見積値ではない）

A/seeds/billing/charge_catalog_v1.jsonには以下。BSC=true、旧SPT=false（歴史保持）である。顧客向け専門業務価格であり医師への報酬額ではない。旧SPTの税区分はこのseed単体では定義されない。現Casetraプラン/現KIDUKI固定商品はconfig/billingPlans.v1.json:4が税別。

| 業務 | BSC online | 旧SPT online | BSC onsite | 旧SPT onsite | seed行 |
|---|---:|---:|---:|---:|---|
| 面談20 | 14,000 | 22,000 | 24,000 | 32,000 | 36,110,143,173 |
| 面談30 | 20,000 | 32,000 | 30,000 | 42,000 | 90,121,153,184 |
| 面談40 | 27,000 | 43,000 | 37,000 | 53,000 | 100,132,163,195 |
| FB15 | 10,000 | 16,000 | 20,000 | 26,000 | 248,288,268,310 |
| FB30 | 20,000 | 32,000 | 30,000 | 42,000 | 258,299,278,321 |
| 健診判定30 | 20,000 | 32,000 | 30,000 | 42,000 | 206–237 |
| 研修30 | 40,000 | 64,000 | 50,000 | 74,000 | 332–363 |
| 研修60 | 80,000 | 128,000 | 90,000 | 138,000 | 374–405 |

その他：診療情報提供依頼書5,000（436）、英文書8,000（446）、英語対応10,000（456）、緊急BASE×1.6（477）。標準産業医意見書以外の追加文書というUI（index:4072–4078）とDOC-JPは区別。

別の現行KIDUKI直接商品：オンライン60,000/訪問75,000/複雑80,000〜、Pack150,000（seed46–87、commercial_pricing_canonical:43–50）。旧SPT40+FB30の算術75,000とは商品コード・含む範囲が違う。

K/pricing正本（kiduki/docs/pricing-growth-canonical.md:70–91）はBSC同額の契約者料金をBasic/Retain/Casetra月額へ適用。Basic30分、Retain60/120分の先充当を規定。K:48/63–64はBasic40,000、Retain60=100,000、Retain120=185,000。一方seedのRETAINER-MONTHは80,000（16–23）とSNG-RTN-ONS100,000（26–33）が併存。

### 接続されている請求処理

- portalWorkReport.ts:347–397：医師/OPSの認証付き実施報告→Booking.work_reportへ保存。延長、追加文書、英語、交通費、変数等。
- 同412–444：Booking.base_sku_code_calc→base_sku_code→環境既定→CONS-BSC-ONL-KJU-KENを選択。予約start/endと延長から分数を計算。
- 単価解決はchargeResolver.ts:177–188でCosmos chargeCatalog→config/priceBook.v1.json→環境値。現tracked repoにpriceBook.v1.jsonはなし。pricingConfig formula/overrideが優先（portalWorkReport:191–204,425–444）。seedは現在のCosmosと同一とは確認していない。
- BASE/FB/緊急/延長/追加書面/英語/交通費を明細化（180–340）。35分=20+15、45分=30+15、70分=40+30の分割あり（120–143）。FB SKUはBSC固定（152–155）。
- PACK_INCLUDED/KIDUKI_SPOT_INCLUDED/KIDUKI_INTERNALはincluded明細になり通常請求から除外（kidukiIncludedBilling.ts:1–8、portalWorkReport:461–505）。
- billingInvoices.ts:530–660でdraftのlock、請求対象抽出、医師内外の判定、価格override、価格未解決ブロック。692以降で月額/Case/予約利用超過を合わせPDF/Box/請求書化。
- publicMarkPaid.ts:18–65は署名tokenの既送付請求書をOPSメールリンクでPAIDにする処理。カード決済画面ではない。src/config/packageにStripe/PaymentIntent取込は検索で未確認。

### 料金連動の不一致・未確認

1. **BookingのSKU設定元**：Case同期はCase.base_sku_codeを設定（bookingSync:435–438）。Booking保存（upsertFromNormalized:540–654）にはSKU設定がなく、全tracked srcでBooking側base_sku_code_calcの書込なし。実施報告はCase SKUを読まずBookingだけを読む。既存DBで事前補完されているか未確認。種類ごとの正しい単価自動適用を証明できない。
2. **契約別切替**：FBはBSC固定で、旧SPTがinactive。既存予約から旧SPT価格が自動選択される現行経路は確認できない。
3. **内部医師フラグ**：internalDoctorBilling.ts:88のCosmos SELECTにはis_internal_providerが含まれないが、142–164はその明示フラグを請求可否に使う。query経路で内部医師も外部扱いになる可能性。test/billingInternalDoctorRules:133–137はqueryをmockしてflag込みのオブジェクトを返し、このprojectionを検査していない。
4. **含有時間**：上記Basic/Retainの分数充当を実行するsrc処理は検索で確認できず、seedの「30m credit」は名称のみ。現在の手動調整/別処理は未確認。
5. **料金正本間の差**：K正本103–113は全CasetraプランへRetain割引20,000とするが、API canonical35/config.billingPlans21–30はRetain120+STARTERだけ。現機械設定と文書に差がある。
6. **税込最終額**：configは税別だが、現billingInvoices:209–241は明細総額をPDFに表示する実装で、同ファイルに税計算/税欄を確認できない。実際の会計請求/領収書の税処理は未確認。

## 追加で確認できた具体的不一致

- 復職70/緊急60のslug（index4380–4386）に対しcalculateDuration（4458–4475）は常にFB+15。復職55、緊急35/45/55をdurationに渡す（4510–4511）。Cal実枠は未確認。APIはendTimeがあれば優先し、なければdurationからendを補う（upsertFromNormalized1003–1018）ので下流にも影響しうる。
- 健診判定のcheckup_type/count/deadlineをURL送信（index4631–4640）するがcal_param_mapにはこの3キーがなく、normalizeValuesは定義キーだけを保持（normalize.ts23–34）。標準Bookingへの正規化保存では落ちる。RawEvent保持や別処理を除き、これらが業務に引き継がれる証明なし。
- HR面談の通常iframe完了検知はbookingSuccessfulかつorigin文字列がcal.comを含む条件（7071–7090）。Portalへの通知は`*`（7130–7135）。ただしPortalはデータを受け入れず認証APIを再読込する。

## テスト・実績の水準

今回テスト未実行。存在を確認したテスト：

- A/test/webhookBooking.signature.test.ts:12–59：署名受理/拒否/不正JSON。
- A/test/a8_idempotency.test.ts:40–101：InMemoryでRawEvent/Booking/Employee件数。Case/Box/mailまでのexactly-once証明ではない。processRawEvent28–77に処理済みskipはない。
- A/test/reschedule.test.ts:4–71：テスト内に関数を再定義。実Webhook→Case統合試験ではない。
- A/test/companyBookingLink*.test.ts：会社トークン/URL/HTTP到達のguard。
- P/e2e/booking-return.visual.spec.ts:8–30,72–162：1440/390px、API/予約先をmockした復帰・待機・エラー・変更取消・入力保持。実Calを予約しない。
- A/test/chargeResolverFailClosed.test.ts、billingInvoiceGenerationRecovery.test.ts、billingInternalDoctorRules.test.ts、commercialPricingConsistency.test.ts、workReportProvenance.test.ts：価格欠落、請求回復、医師区分、正本整合、実施報告の権限/出所を対象。Calイベント選択→正しいSKU→支払→請求の一続きではない。
- 親docs/operations/CASETRA_LAUNCH_READINESS_2026-09-15.md:23–29,53–59は当時SHA47aa98c…のCI/合成受入PASS。現HEADのCal実予約/変更/取消/支払の実機結果として転用できない。
- A/docs/runbooks/pilot_launch_checklist.md:229–248の面談→意見書→Box→メール受領/再送防止チェックは未チェック。

本監査だけで実環境確認済みと言える予約はゼロ。これは実環境に予約や利用実績がないという意味ではなく、今回その本番記録を閲覧・実行していないという意味。

## 追加確認：Case同期フラグと「既存非会員価格表」の特定

2026-10-06追加。API HEADはc5c8af0a8ccf65de43b9da0137e822a87cf984b7、git status --short空。以下はソース確認であり、実設定値・本番価格・実予約成功はこの追加調査では読んでいない。

### Case同期の最小read-only allowlist

- `CASEOS_ENABLE`：A/src/domain/upsertFromNormalized.ts:696–714。厳密に文字列`true`の場合だけBooking保存後にsyncBookingToCaseOs。未設定/`1`/`TRUE`は通らない。同期例外は記録してcompletedを返すため、trueかつWebhook200でもCase成功の証明にはならない。
- `FEATURE_WEBHOOK_INGEST_ENABLED`：A/src/shared/featureFlags.ts:55–58、A/src/functions/webhookBooking.ts:92–106。未設定時true。falseなら入口503。`CAL_WEBHOOK_SECRET`は値を出さず設定済みかだけ確認し、Cal側と署名が一致する必要がある。
- `FEATURE_CAL_SYNC_ENABLED`（既定true）はA/src/shared/calApi.ts:42–48のAPI呼出制御で、Case同期直接フラグではない。さらに会議URLの補完処理A/src/domain/upsertFromNormalized.ts:1241–1256は同フラグを経由せずCAL_API_KEYで直接fetchする。
- `FEATURE_BOX_PROVISIONING_ENABLED`（既定true）はA/src/functions/provisioningQueueWorker.ts:106で企業Box初期化を止める。一方予約WorkspaceのA/src/functions/bookingWorkspaceProvisionerTimer.ts:37–88→A/src/integrations/bookingWorkspaceProvisioner.ts:583以降には同フラグ判定がない。Box全操作の一括制御とは断定しない。
- `FEATURE_MAIL_DELIVERY_ENABLED`（既定true）はA/src/shared/mailer.ts:253以降の送信制御。Case生成自体とは別。取扱制限メールには利用可能な経路も必要（A/src/shared/configAudit.ts:17–46）。
- Booleanの監査源流はA/src/shared/configAudit.ts:49–72。caseos_enabled、cal_webhook_secret等は値を返さない。ただしこの監査のboolFlagとfeatureFlags本体には許容値の差があるため、実挙動の根拠は各呼出元とする。

### 旧非会員価格の該当ファイルと現在の適用境界

1. **ユーザーが指す旧非会員/SPOT表の数値候補**はA/seeds/billing/charge_catalog_v1.jsonの`CONS-SPT-*`/`FB-SPT-*`。オンライン20分22,000、30分32,000、40分43,000（110–140行）、FB15分16,000・30分32,000（288–307行）。現在はactive:falseで歴史用。現行SPOT6万円のSKUとは別。
2. 履歴裏付け：API commit7108edf93689696c6c9237ac6248f70cb582b556の同ファイル66–93行では上記20/30/40料金がactive:true。2026-08-06 commit35c9ff99f0e37af216037b8a89daba2113dbd6f0で一般SPOT群を非アクティブ化。旧申込フォームの同commit public/contract-form/index.html:86–88はSPOT月0/BASIC月40,000/RETAIN月100,000。これらは履歴であり現行販売状態の証明ではない。
3. **現在の商品方針正本**はK/kiduki/docs/pricing-growth-canonical.md（2026-08-18確定）、契約者料金70–91、別商品としての復職単発169–181。API側はA/docs/runbooks/casetra_commercial_pricing_canonical.md:39–57とconfig/billingPlans.v1.json。Kの旧政策文言は今のユーザー指示を阻止する権限ではないが、ソースはまだ更新されていない。
4. **本番で請求される価格の源流**はseed直読ではない。A/src/functions/portalWorkReport.ts:412–444のSKU選択とPricingConfigの数式/override、A/src/shared/pricingConfig.ts:71–91のCosmos設定、A/src/shared/chargeResolver.ts:146–188のCosmos chargeCatalog→priceBook→envを読む。したがってseed金額を本番価格として断定不可。
5. 「料金表そのまま総額・追加なし」の料金決定対象としては旧SPT表を特定できるが、現在の実装は追加書面/英語/緊急/延長等の別ラインを持つ。標準意見書を追加文書と分けるUIはA/docs/booking/index.html:4071–4078に存在する。この表示は標準意見書の全料金条件・納期を単独で確定する根拠ではない。
6. このseed自体に税込/税別のフィールドはない。現行Casetra Platform正本の税別規定を旧KIDUKI SPTへ自動外挿しない。ユーザーの受領済み旧料金表・当時の税別注記はroot側の証拠と合わせる。
