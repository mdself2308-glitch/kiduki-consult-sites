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

- 2026-10-06追記：ユーザーが契約・売上主体を「株式会社MedSelf」と確認。利用条件の運営・契約・請求主体に反映。Stripeでカード払いのみの実装と一致するよう、支払手段と予約日時での実施を明記。商取引開示の住所・電話・提供時期等は実環境設定と併せて確認中。

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
- Remaining gates: 法人の所在地・公開電話の確認、Stripeとバックエンドの接続設定、署名Webhook、Cal予約から意見書送付までの実環境検証、医師・運用確認、公開判断。

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
