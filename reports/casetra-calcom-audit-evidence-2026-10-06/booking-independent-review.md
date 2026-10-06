# Casetra booking 接続候補の独立反証レビュー（2026-10-06）

範囲: 現行ソースの読み取りのみ。API c5c8af0a8ccf65de43b9da0137e822a87cf984b7、Portal bcbe12d799e39e6d2daf6c640d5c4261600fde46。両 worktree clean。予約、POST、送信、テスト実行、設定変更はしていない。本番の障害発生や誤請求実績を示すレビューではない。

根拠の短縮表記: A=/Users/dmmac/casetra_active/kiduki-consult-api-deploy、P=/Users/dmmac/casetra_active/portal-ops。

## 1. 70分イベントと duration=55分

分類: **確定コード不整合（送出パラメータ）。実際の予約枠が55分になるという影響は未確定。**

- A/docs/booking/index.html:4353-4355 で復職・緊急のFBをyesに固定。
- 同4380-4386で緊急は60分という設計コメント/urgentイベント、非緊急復職はconsult-online-70系へ接続。
- 同4458-4475では復職40分に一律15分加算して55分。urgentを計算条件に含めないため緊急も元種別により35/45/55分。
- 同4510-4511で算出値をdurationクエリとして送る。
- 反証: A/src/domain/upsertFromNormalized.ts:1003-1018 はCal payload.endTime優先。durationから終了時刻を算出するのはendTime等が欠けた場合だけ。
- 反証: A/src/functions/portalWorkReport.ts:140-141,186-190 は70分slugを40分面談+30分FBとして計算するため、duration55をそのまま請求時間にする構造ではない。
- したがって「70分予約が55分に短縮」「必ず誤請求」は言い過ぎ。現行Cal側でdurationが予約枠を上書きするか、custom項目になるかはこのソースから未確認。

## 2. まとめ予約の /api/bundles

分類: **確定コード不整合（公開する現行画面の必須POSTに現行API受け口がない）。旧/到達不能ではない。**

- A/src/functions/bookPage.ts:9-11,15-28 は問題のdocs/booking/index.htmlを現在のGET/api/bookで配信。
- A/docs/booking/index.html:3595-3613 でHRの面談予約に「まとめ予約」が選択可能。同5505→6331→6585で確定ハンドラへつながる。
- 同3312-3326で同一originのPOST/api/bundlesへ保存。6592-6610では保存成功後だけCal予約画面を表示。失敗時は6611-6614の保存失敗表示。
- A/package.json のmainはdist/src/index.js。src/index.ts:5-9→adapters/casetra/register.ts:1→shared/registerCoreFunctions.ts:1-89 の現行登録にbundles handlerなし。srcと追跡対象distの両方を検索して該当ルートなし。
- BundleConfig repositoryと読取側は存在する（A/src/domain/upsertFromNormalized.ts:972-975）が、作成handlerの代用にはならない。
- 留保: 実環境のPOST404を実行確認していない。外部gateway等が別サービスへ/api/bundlesを振り分ける設定が別に存在する場合は反証となり得るが、今回の現行APIソースからは確認できない。

## 3. 同じCaseへの追加予約を変更扱い

分類: **同Caseを無条件に変更チェーンへ寄せるコード挙動は確定。『追加FBで壊れる』は条件付きの可能性。**

- A/src/domain/upsertFromNormalized.ts:440-450 はvalues.case_idが明示され、継承フォルダ未設定、同Caseの別Bookingにbox_workspace_folder_idありの場合、最新の旧Bookingを拾う。isReschedule、旧予約status、booking_kindの絞り込みなし。
- 同452-466でBox/提出済状態/booking_chain_idを継承。475-481で旧Bookingにworkspace_provisioning_status=RESCHEDULED、rescheduled_to_booking_idを設定。
- 正確にはこの代替分岐は旧Bookingのstatusをcancelledには変えていない。明示reschedule分岐の挙動とは区別する。
- 同502-505のbooking-intentからのCase補完はこの判定の後。明示case_idがなくintentだけで結びついた予約には当分岐は適用されない。
- A/src/billing/usageCounters.ts:363-372 はチェーン単位に回数重複排除。A/src/caseos/integrations/bookingSync.ts:527-538 はCaseのbooking_summaryを単一で置換。
- 影響条件は「変更ではない別予約を、同じcase_idを明示して作り、前予約にBox workspaceがある」。この条件では独立予約を同一チェーンへ束ねる。
- ただし現行トップメニューに追加FB単独の予約導線は見当たらず、Caseのfollowup生成は別Caseを作る。従って一般の予約変更/別Caseでの再面談を壊すという主張にはならない。追加FBを同Caseに紐づける実運用があるかは未確認。

## 4. Case SKU→Booking SKU→work-report

分類: **確定コード不整合（通常Webhook新規Bookingに種別SKUを渡さずwork-report側がdefaultにfallback）。金額影響は未確定。旧経路として除外はできない。**

- A/src/caseos/integrations/bookingSync.ts:435-437 でCaseのbase_sku_codeは更新する。
- A/src/domain/upsertFromNormalized.ts:507-518 はCaseからtemplate_variant_idだけを取得、540-646のBooking組立にbase_sku_codeなし。
- genericなmapped.bookings経路も確認済み。A/src/shared/applyMappings.ts:14-20 はconfig.fields.targetsだけを転記するが、A/config/cal_param_map.v1.json:6-48にbase_sku_code/base_sku_code_calcなし。
- A/src/functions/bookingsUpsert.ts:32-43 も同じmapping/upsertを通り、SKUの迂回転記はない。src全体でBooking SKUを自動設定する別writerは未発見。
- A/src/functions/portalWorkReport.ts:412-416 はBooking.calc→Booking.base→BILLING_DEFAULT_BASE_SKU→CONS-BSC-ONL-KJU-KEN順に選択。461-467で後からCaseを取得するがbilling_classification用でSKUには戻さない。
- P/app/today/page.tsx:236、P/app/doctor/today/page.tsx:242、P/app/bookings/[bookingId]/page.tsx:130が現行work-report呼出。P/lib/apiAccess.ts:54はops/doctorに許可。v3の意見書生成と別経路だが、到達不能な過去コードではない。
- 反証/留保: 既にBookingにSKUがあればmergeDefined（A/src/domain/upsertFromNormalized.ts:649,1021-1028）で保持。実DBに外部/手動設定があればdefaultに落ちない。defaultと本来SKUが同じ種別なら差はない。実金額は現在の環境default、価格カタログ、料金式/上書き、課金区分で変わるため、誤請求額/発生件数は判断していない。

## 総評

4項目をまとめて「予約全体が動かない」とは言えない。確定できるのは上記のコード接続/条件と送出値。4件とも現行ソースに接続はあり、全部を旧経路だから無視できるという反証は成立しない。特にbundlesは可視選択肢から必須保存呼出までつながる。追加FBの実害、Cal予約時間への反映、実請求差はそれぞれ別の実環境証拠が必要。
