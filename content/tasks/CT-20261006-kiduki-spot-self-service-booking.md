---
task_id: CT-20261006-kiduki-spot-self-service-booking
title: KIDUKI SPOTのメニュー選択・予約・決済導線
project: kdk-wordpress
channel: website
domain: employment
risk_tier: S
status: review
owner_decision: pending
created: 2026-10-06
last_verified: 2026-10-06
draft_reference: consult/spot/index.html
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- KIDUKIの単発面談を、表示総額と対応範囲を見て予約できる入口にする。継続支援とCasetra導入の初回営業相談を購入の必須手順にしない。

## Audience and action

- Audience: 企業の人事・労務担当者
- Main question or job: 必要な1回の内容・時間・総額を比較し、予約日時と支払いを確定する
- Desired next action: メニュー選択、担当者メール確認、日時選択、総額確認、決済
- Non-goals: 個人向け診療、未確定の即日発行保証、月額への自動移行、ソフトウェア契約の強制

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 2026-10-06のユーザー指示による新しいSPOT導線。ローカル実装中・本番未公開。予約受付はサーバーの設定と規約承認フラグで制御。
- Approved terminology: SPOT、企業担当者、税込総額、本人面談、人事フィードバック、オンライン面談、産業医意見書
- Constraints and boundaries: 料金はAPIカタログのみ。復職40分＋FB30分必須。48時間以上先。企業担当者が予約主体。医師確定後に意見書リンクを担当者へ。会社による最終決定と実施を維持。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| このチャットの2026-10-06ユーザー決定・親タスク確定API契約 | 2026-10-06 | 税込総額追加なし、メニュー、予約主体、48時間、オンライン面談、納品工程、今回の実装範囲、キャンセル条件のユーザー承認（48時間以上前は全額返金、以降なし、事務所中止は全額返金、変更は48時間以上前） | 本番公開、実決済・実予約 |
| ../README.md | 2026-10-06 | KIDUKIの文体、医療・雇用判断境界、静的/WordPress区分 | 新SPOT料金や受付開始の証拠 |
| ../../consult/index.html と https://consult.kdkconslt-sngyouijm.com/ | 2026-10-06 | 現行ブランド、二本柱、継続相談の対象 | 新予約導線が公開済みとの主張 |
| /Users/dmmac/CodexWorktrees/kiduki-spot-api-20261006/config/spotCatalog.v1.json | 2026-10-06 | 中央料金・対象・時間・承認済みキャンセル条件 | 実環境反映 |
| https://styles.refero.design/style/9946887b-ffa9-4276-af81-ae6352795afb | 2026-10-06 | 公開デザイン解説、予約画面の階層と主CTAの参照 | 非公開画面の確認、KIDUKIの仕様 |
| https://sangyoui.m3career.com/service/spot/ | 2026-10-06 | 単発依頼の工程を先に示す参照 | KIDUKIの料金・即日対応・需要証明 |

- 2026-10-06追記：ユーザーが契約・売上主体を「株式会社MedSelf」と確認。利用条件の運営・契約・請求主体に反映。Stripeでカード払いのみの実装と一致するよう、支払手段と予約日時での実施を明記。法人名・法人番号・代表者・所在地・公開メールは下記の一次資料・本人回答記録と照合し、商取引開示と利用条件に反映。Stripe公式要件に基づく顧客電話の本人回答と、公開前のページ承認・Stripe本番表示の照合は未完了。

### Unresolved points

- キャンセル条件はユーザー承認済み。実決済と予約連携の実環境設定・受付開始判断は親タスクで管理。
- 本番公開、実案件運用、実売上・需要・月額転換は未確認。

## Outline

1. ブランドを保った企業向け予約の説明
2. APIカタログから種類・時間・税込総額を比較
3. 企業担当者のメール確認と従業員情報（FB単独は不要）
4. 空き日時、最終確認、Stripe決済、サーバーでの予約確定確認
5. 面談後の案内と会社・医師の役割境界

## Draft requirements

- Voice: 実務的で短い日本語。何を選び、次に何を行うかを先に書く。
- Required points: 月額不要、税込総額、48時間、企業担当者、オンライン面談、医師確定後の意見書、予約確定状態と決済状態の区別
- Forbidden claims or wording: 即日発行の確約、必ず予約可能、未確認の効果、選任契約の代替、医療情報のURL/分析ツール送信
- Channel limits: 静的SPOT新画面とhome、旧単発ページ、WordPress下層ページのローカルソース。モバイルとPCを確認。
- CTA or next action: 単発面談のメニュー・税込総額を見る

## Review plan

- Source and fact reviewer: 親タスクの独立レビュー（カタログ・API契約との一致）
- Safety or compliance reviewer: 親タスクの独立レビュー（医療情報、規約表示と承認フラグ、予約/決済の状態）
- Editorial reviewer: 親タスク、宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | 旧単発ページ | 旧固定6万円、事前相談フォーム、15分の事前打合せ、30日Casetra画面の案内が新予約導線と競合 | 親タスク最終レビュー、既存ローカルソース | 旧料金表・フォーム・submit JS・専用画面の確約を削除。オンラインは新メニュー、訪問等はcontactへ統一 | repaired |
| High | 決済戻り | 戻りURLだけでは支払い/予約確定を確認できない | 親API契約 | confirm＋GETstatus、CONFIRMEDのみ確定表示 | repaired |
| High | 規約 | キャンセル条件未承認では決済を開始できない | ユーザー承認、中央config policy.approved=trueへ親タスクで更新 | bookingEnabledとpolicyApprovedで受付制御を維持 | repaired; policy approved, live setting pending |
| High | 従業員メール | Calの案内は企業担当者にのみ届き、任意メール欄の本人送信説明と不一致 | 独立レビュー・親タスク指示 | 従業員メール欄を削除し、企業担当者が本人へ案内共有する説明に変更 | repaired |
| Medium | 会議provider | 現APIはTeamsのみを強制していない | 独立APIレビュー | UIはオンライン面談と表記し、Teams初期設定は実機受入で確認 | repaired; live setting pending |
| Medium | 追加FBの選択位置 | 全メニュー末尾ではスマートフォンの次へ操作で見落とす | 独立UIレビュー | 選んだ面談カード直後にだけ追加FBの選択肢を置く。RTW・FB単独は表示しない | repaired |
| Medium | 料金更新 | catalogVersion変更時に古い金額で再試行するおそれ | フロント実装レビュー | catalog再取得・メニューから再確認 | repaired |
| Medium | ブラウザー再読込 | Stripe戻り後URL除去で予約番号を失うおそれ | フロント実装レビュー | opaque予約IDのみsessionStorageで保持 | repaired |

## Completion evidence

- Local artifact: `../../consult/spot/index.html`、`../../consult/assets/spot-booking.js`、`../../consult/assets/spot-booking.css`、`../spot-booking-design-brief-2026-10-06.md`
- Automated checks: JavaScript構文確認、verify:static、verify:spot-source、ticket draft validator、git diff --check。完全mockブラウザーruntime試験は中央7メニュー・390/860/1440px・24 API要求、consoleerror 0。受付停止中の既存予約再OTP回復、誤コードの再入力、決済準備中の同一idempotency key維持を含む。結果と代表画面は `../../reports/casetra-calcom-audit-evidence-2026-10-06/spot-ui/` に保存。旧単発ページの最終整理後、verify:spot-source 17項目PASS・390/860/1440pxに横はみ出しなし・ticket draft validator PASS。最終確認は親タスクへ引継ぎ。
- Human approval: 今回の価格・運用方針・キャンセル条件はチャット指示で承認済み。完成HTML exact版の承認・本番公開は未実施。
- Schedule record: なし
- Published verification: なし。静的push・WordPress applyは実施していない。
- Measurement source and period: 公開後に対象者の閲覧、予約開始、決済、確定、実施、再利用を分離して評価。現時点は未測定。
- Remaining gates: 商取引開示の顧客電話の本人確認・掲載、ページ承認とStripe本番開示リンク・表示の照合、Stripeとバックエンドの接続設定、署名Webhook、Cal予約から意見書送付までの実環境検証、医師・運用確認、公開判断。

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-10-06 | — | backlog | Ticket created |
| 2026-10-06 | backlog | review | 新予約UI、既存導線変更、API adapter、mock動作・視覚検証。未公開 |
| 2026-10-06 | review | review | 最終レビュー修正：旧単発ページの事前相談フォームと旧運用確約を削除し、予約・問い合わせ導線を統一。キャンセル条件のユーザー承認を反映。未公開 |

## SPOT利用条件ページの追加確認（2026-10-06）

- Artifact: `../../consult/spot/terms/index.html`。既存ブランドCSSを使用し、本案件票の一部として作成。
- ユーザー承認済み条件を反映：予約時決済、48時間前までのキャンセルは全額返金、以降のキャンセル・無断不参加は返金なし、事務所都合中止は全額返金、日程変更は48時間前まで、追加請求なし。料金はカタログ・申込最終確認画面を参照し、金額を重複定義しない。
- 企業担当者の予約・案内共有、医師確定後の意見書PDF閲覧リンク送付、月額不要、医師意見と企業の最終判断の境界を記載。プライバシーポリシーは既存 `/privacy-policy/` に統一。
- 独立レビュー：funnel_critique が承認条件との整合、医師・企業判断境界、PDFリンク送付を確認し、必須修正なし。親タスク確認後、既存プライバシーURL・無断不参加の扱いを明確化。
- Visual QA: 1440px と390pxで確認。最終390pxで横幅・scrollWidthとも390px、返金表と問い合わせ導線に横はみ出しなし。証跡は `/private/tmp/kiduki-spot-ui-evidence/terms-1440.jpg`、`terms-390.jpg`、`terms-policy-390.jpg`。
- 状態：条件はユーザー承認済み。HTMLはローカル実装・レビュー済み。本番公開、Cal設定反映、実予約・実決済・メール送信は未実施。

## 最終検証追記（2026-10-06）

- 株式会社MedSelfの表示追加後、利用条件を390px／1440pxで再確認。横はみ出しなし。
- APIは最終1,208/1,208 testsとbuildが成功。Portalは境界テスト45件とbuildが成功。両方の本番依存関係の監査は脆弱性0件。
- HR概要入力はユーザーが保存方法を明示承認した上で維持。独立レビューで発見した同一予約IDの会社変更を保存前に拒否する修正も、12通りの回帰テストと独立再レビューで確認。HR画面のPC・390px証跡は既存evidenceディレクトリへ保存。
- Stripe公式プラグインのKIDUKIサンドボックス接続後、合成データ・公式テストカードで22,000円の与信、管理画面で売上確定と全額返金、APIで金額・状態・領収書URL生成を確認。本番決済やCasetraとの通し検証ではない。
- 引継ぎ：`../../docs/for-owner/spot-booking-2026-10-06.md`。APIローカルcommit `63f92d4`、Portal `6020df4`。公開操作なし。

## 公開目標の更新（2026-10-06）

- ユーザーが「全部完璧に省略することなく」「明後日ぐらいから公開」「順位をどんどん上げていきたい」と依頼。目標日は2026-10-08。これは今回のSPOT公開に向けた実装・設定・検証・公開の依頼であり、未確認の法人情報や本番決済の有効化を完了扱いにする根拠ではない。
- API/Portalはレビュー用draft PRを作成。API #1619、Portal #43。APIはモード不一致ガードと安定したStripeフロー識別子を追加し、1,212 tests/build/audit 0を確認。Portal GitHub checks 7件PASS。最終SHAとCIは公開直前に再照合する。
- WordPress 164のdry-run成功（現行modified: 2026-09-02T14:38:34）。本番書込みなし。
- 計測実装・独立レビュー・設定待ちは `../../reports/spot-launch-seo-2026-10-06.md` に記録。既存SEO weekly/monthly automationを都度予約のファネルに更新し、新規の重複SEO automationは作らない。
- 10月7日・8日9時の読み取り専用公開前チェックを設定。公開や本番決済設定を自動で実行する権限は付与されていない。
- 現状はreviewのまま。公開・実環境通し検証・検索成果は未確認。本人操作と回答待ちの詳細は上記の引継ぎ文書を参照。

## 公開前境界の追加確認（2026-10-06）

- ホームページ専用branch `codex/spot-launch-20261008` の`8b47a5d`をpush済み。既存記事・PHP・過去SEO差分は含めず、サイトPRによる意図しないpreview公開も行っていない。
- Calの既存9枠を実画面で確認。必須項目・時間・Teams・48時間前まで・課金OFFは確認できたが、既存契約と共用の用途別名を変更しないため専用6枠を提案。作成は自動承認審査が直前確認を要求し、全件未作成。
- 新専用枠へのカタログ切替と、未払いのSPOT予約を通常のCasetra保存経路から除外する修正をAPI `5b72db8`に保存。全1,223テスト・build・本番依存audit 0を確認し、独立レビューのP1を修正済み。料金・時間・Case種別・既存契約は維持。
- Calの非表示はアクセス制限ではなく、Cloudの直接予約からの枠占有・通知は別の未確認事項として残す。標準Webhook形式・支払い経路・意見書送付までの合格条件を[実環境受入表](../../reports/spot-live-acceptance-2026-10-06.md)に整理。
- 本番公開・実売上・外部計測完了へは進めていない。ローカル試験とStripe単体テストだけを通し運用の証拠にしない。

## 運営情報の根拠照合（2026-10-06）

- `consult/spot/terms/index.html` の運営情報に、株式会社MedSelf、法人番号9010401176495、代表者 宮部 大輔、〒105-0004 東京都港区新橋1-18-21 第一日比谷ビル、info@kdkconslt-sngyouijm.comを反映。契約・売上主体は今回のユーザー回答とも一致する。会社英名・電話番号は追加しない。料金・決済時期・キャンセル・日程変更条件は変更しない。
- [gBizINFO](https://info.gbiz.go.jp/hojin/ichiran?hojinBango=9010401176495)を2026-10-06に確認し、法人名・法人番号・登記所在地を照合。gBiz側の国税庁データ取得・更新日は2025-12-05で、代表者欄は空欄。
- 会計処理の国税庁保存原本 `../../../会計処理/02_処理中/クラウド経費照合/MedSelf_法人番号公表情報_20260929.pdf` を1ページ全体で視覚確認。2026-09-29 10:57時点、最終更新2023-08-21。法人名・番号・所在地がgBizと一致。国税庁詳細画面の2026-10-06時点での再取得は未完了。
- 代表取締役 宮部大輔は `../../../会計処理/00_運用ルール/AI経理/本人指示_20260924_最終版A案とeTax準備.md` の2026-09-24本人回答で確認。公開の[代表者紹介](https://kdkconslt-sngyouijm.com/office/greeting/)でKIDUKI代表、郵便番号・建物名を含む事務所所在地を照合。登記事項証明書の現行代表者欄を取得したとの主張はしない。
- 公開の[お問い合わせ](https://kdkconslt-sngyouijm.com/contact/)を2026-10-06に読み、上記メールを直接連絡先として確認。メール送受信テストは実施していない。
- 運営情報調査時点では公開電話を確認できなかった。旧Googleビジネスプロフィールの電話や法人税資料の個人携帯番号を顧客窓口へ転載しない。その後のStripe公式要件確認と未解決事項は次節に記録する。運営情報の補完だけで特商法表示・Stripeの本番審査が完了したとは扱わない。
- 状態：Tier S / reviewのまま。canonical作業コピーのみ修正し、この法人情報追記に伴う公開・commit・pushは行わない。親タスクによる独立確認と公開前の商取引開示確認を引き継ぐ。
- 法人情報追加後の検証：利用条件の第1〜6節を変更前とバイト比較し、料金・決済・キャンセル・日程変更の本文が不変であることを確認。新SPOT検証30項目、SPOT導線17項目、案件票draft検証はPASS。390px・1440pxのブラウザー表示は横はみ出しなし、追加した運営情報の画像を目視確認。証跡は `/private/tmp/kiduki-operator-info-ui-20261006/`。外部要求はすべてローカル応答または遮断し、公開・メール・予約・決済は行っていない。

## 商取引開示の具体化（2026-10-06）

- 一次資料：[Stripe「特定商取引法に基づく表記」ページの作成と表示方法](https://support.stripe.com/questions/how-to-create-and-display-a-commerce-disclosure-page?locale=ja-JP)を同日に確認。Stripe加盟店は消費者向け通信販売を行わない場合も商取引開示が必要。法人名・所在地・顧客電話・メール・責任者、追加手数料、返品・返金対応、提供時期、決済手段・時期、税込価格を一ページにまとめ、ホーム・決済画面から開けるよう求めている。個人事業主の請求時開示の例外を株式会社MedSelfに適用しない。Stripe要件の整理であり、すべての法令への適合判断を終えたとは扱わない。
- `/spot/terms/` を「商取引に関する開示」のH1とページタイトルに変更。既決定の販売価格・追加費用なし・予約時カード払い・予約日時の面談・医師確定後の意見書リンク送付・48時間前を基準とした取消/返金/変更条件を、項目名で探せるよう整理した。サービスの不備は窓口へ連絡する旨を追加し、新たな返金保証・意見書発行日数・費用は作らない。条件・金額の正本は従来どおりAPI catalog。
- 静的ホームと予約ページのフッター、予約の最終確認画面から同ページへ案内し、リンク名を「商取引に関する開示・利用条件」に統一。Stripeのホスト型決済画面下部のリンクは、ダッシュボード側で開示URLを登録・読み戻す別作業で、未実施。
- 公開電話はユーザー回答待ち。原稿へ電話の空欄・旧番号・個人番号・「請求時開示」の文言は出さず、未完成の原稿として保持する。`data-commerce-disclosure-approved="false"` を維持し、公開前validatorは電話掲載と全体承認が揃わない限り `releaseReady=false`、`--release` は失敗する。現段階で商取引開示の必要項目がすべて揃ったとは扱わない。
- 変更先は `consult/spot/terms/index.html`、`consult/index.html`、`consult/spot/index.html`、`consult/assets/spot-booking.js` の案内ラベル、`consult/assets/spot-booking.css` のfooter折返し、`tools/verify-spot-launch.mjs`、本案件票・本人引継ぎ・実環境受入表。API/Portal、既存の料金・返金条件・Casetraシステムは変更しない。この節の記録時点はTier S / review、未公開・未commit・未push。その後、公開用worktreeへ同差分を反映し、既存の作業ブランチへ保存する対象に含めた。
- 検証：新SPOT通常チェック33項目PASS、SPOT導線17項目PASS、案件票draft検証PASS。後述の任意計測gate見直し後の `--release` は、公開電話/商取引全体承認が未完了のため期待どおりexit 1・`releaseReady=false`。期待する停止を通常チェックの成功や公開済みと混同しない。
- 表示：390px・1440pxで商取引ページ、ホーム/予約footer、決済前確認リンクを確認。横はみ出しなし。モバイルfooterの長い案内が無理に縮まらないよう `flex-wrap:wrap` のみ追加。同意欄は固定の総額バーより上にスクロールでき、リンクと支払ボタンを確認。外部要求はローカル応答または遮断し、API送信・メール・予約・決済を行っていない。合成表示データには中央catalogの現行取消文を使用。画像・結果は `/private/tmp/kiduki-commerce-disclosure-ui-20261006/`。

## 任意計測の公開条件整理（2026-10-06）

- GA4未設定だけで公開を妨げないよう、空ID＋reviewed=falseを明示停止として認める。計測有効時は専用ID＋reviewed=trueを維持し、欠落・半端な設定・既存ホームID流用は拒否する。JSONに `analyticsStatus` と `analyticsFollowUp` を分離。専用GA4設定・実受信は未確認の後続作業として残す。
- `BOOKING_CONFIRMING`、`COMPENSATING` を非確定状態のruntime検証へ追加し、いずれも確定イベント送信ゼロを確認する。商取引表示の電話/承認、APIの受付フラグ、決済/予約/意見書の実環境受入は緩めない。今回の調整ではUIと送信コードを変更しない。
- 最終確認：通常33項目PASS。`--release` は35項目中、商取引表示の電話・承認のみ期待どおり失敗しexit 1。JSONの `analyticsStatus=disabled_explicitly` を確認。計測設定の10組合せで明示停止・確認済み専用IDのみを許容し、空欄/確認済みの不一致・属性欠落・既存ホームID・不正IDを拒否。上記2状態を含む非確定状態は確定イベントゼロ。案件票draft検証PASS。証跡は前節と同じディレクトリの `local-verification.json`、`release-verification.json`、`analytics-gate-cases.json`。

## API追加修正のローカル検証更新（2026-10-06）

- 親タスクから、Calを常時承認待ちにし与信注文だけ確定する処理・失敗時補償を含む追加修正について、全1,251/1,251テスト、対象102テスト、別出力先build、本番依存audit 0を確認したとの報告を受領。独立レビューはP1/P2なし、70テスト・6障害時検証を確認。
- 追加修正 `5ecb6f5` を既存 `codex/spot-checkout` へpushし、draft PR #1619の本文を更新済み。新SHAのGitHub CIは6件成功し、build・evidence-packの完了待ち。この結果だけでCal.com Cloud・通知・Teams・決済から意見書までの実環境受入を合格にしない。
