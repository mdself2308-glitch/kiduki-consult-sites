# KIDUKI SEO exact owner / physician review

Status: owner-review  
Prepared: 2026-09-01 20:38 JST  
Approval owner: 宮部 大輔  
Production status: not applied  
Global manual: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/.agents/skills/content-production/SKILL.md`  
Project guide: `README.md`

## この資料で判断すること

次の5件が、Tier SのAIレビューを終え、人間のexact版判断へ進める状態です。A〜Cは既存WordPress baselineに結合した改稿、F〜GはWordPress post未作成の新規記事候補です。

| Decision | Exact version | SHA-256 | Current state | Production |
|---|---|---|---|---|
| A. `スポット産業医` CTR改稿 | `2026-09-01-v2` | `a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9` | owner-review | not applied |
| B. 12記事CTA | `2026-09-01-v6` | `8a37688634893094c2fc0a6ba7827230dd2eba6797e9dd1183c56482bef1a34a` | owner-review | 12/12 not applied |
| C. 50人未満ストレスチェック2028 | `2026-09-01-v3` | `6bcbd35e962d235b7344fe0571d9e1ea3907597c78e8df725bdd19fd337610bc` | owner-review | not applied; old article remains live |
| F. 既存産業医を替えず専門支援を追加する記事 | `2026-09-01-v1` | `c524ae175125c8be963b2ed3fc1cdc2b8ffb6e8e1213db0f1bcae4e023234fc4` | owner-review | WordPress post not created |
| G. 産業医面談・意見書・再評価の案件管理記事 | `2026-09-01-v1` | `ef7b280d49fa75e34013a0f540d6b4ceb00b680c4ca0ac0200abf5f6d57c1b7a` | owner-review | WordPress post not created |

この資料自体は承認証拠ではありません。A〜C・F〜Gは個別に承認・修正・保留を判断します。exact版の承認とWordPress本番反映権限は別です。F〜Gの新規post作成権限も、文言承認とは別に判断します。

## A. `スポット産業医` CTR v2

- Exact: `exact/spot-industrial-physician-ctr-2026-09-01-v2.json`
- WordPress: page 164 `/service/return-to-work-support/`
- 2026-09-01 20:37 JST read-only dry-run: modified `2026-08-31T17:19:23`、slug/status維持、現行本文SHA `2030a084b3a72470f00f27a6d88f6f974bc1d7d96c33b5a5b44376d54e8e02ed`、候補本文SHA `b64bdb234eb4e8aa92a4099f6dc9edb7b8564ebc22953564ff4fde4d4f3516a0`

| Field | Exact value |
|---|---|
| title / H1 | スポット産業医｜法人1件からの復職面談・再評価 |
| meta description | 月額契約のない企業向け。復職判定面談、復職後の再評価、就業制限の変更・解除に必要な評価・意見を、目的と対象を定めて1件から支援します。診断・治療や会社の最終決定は行いません。 |
| excerpt | 月額契約のない企業向けに、復職判定面談、復職後の再評価、就業制限の変更・解除に必要な評価・意見を、目的と対象を定めて1件から支援します。 |
| CTA label | 初回のご相談（15分） |
| 本文追加 | 受診が必要と考えられる場合はその旨をお伝えしますが、受診先はご本人が選びます。KIDUKIが特定の医療機関を指定・紹介することはありません。 |

承認時に固定する文字列:

`A 承認: 2026-09-01-v2 / a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9`

## B. 12記事CTA v6

- Exact: `exact/article-cta-owner-review-2026-09-01-v6.json`
- v5からの変更: CASETRA PackのP-01/P-02が未実施のため、公開CTAのPack表記を除外。単発・Basic・Retain・CASETRAの現行導線だけに限定
- 2026-09-01 20:37 JST read-only dry-run: 12/12でpost ID、slug、publish/future、公開日時、変更前本文が一致。CTAのみ11件、SASの事前レビュー済み全文1件。writes `false`

| # | 記事 | Exact CTA | Primary | Secondary | Scope |
|---|---|---|---|---|---|
| 1 | 夜勤・交代勤務の睡眠対策 | 夜勤・交代勤務を、勤務表と就業上の配慮まで含めて見直したい企業へ。既存の産業医体制に睡眠・勤務リスクの専門支援を追加する場合は、睡眠に特化した産業医支援をご確認ください。復職や就業制限など1件の判断支援は、復職・両立支援で対応範囲をご案内します。 | 睡眠に特化した産業医支援 → `/service/komon/` | 復職・両立支援 → `/service/return-to-work-support/` | `cta_only` |
| 2 | 運転業務の眠気リスク | 運転業務の眠気リスクを、勤務記録と就業措置まで含めて見直したい企業へ。既存体制へ継続的な専門支援を追加する場合は、睡眠に特化した産業医支援をご確認ください。復職や就業制限の変更・解除など、対象を固定した1案件は、復職・両立支援で対応範囲をご案内します。 | 睡眠に特化した産業医支援 → `/service/komon/` | 復職・両立支援 → `/service/return-to-work-support/` | `cta_only` |
| 3 | 職場のSAS対策 | SAS対策を、対象業務・スクリーニング後の対応・結果待ちの就業配慮まで設計したい企業へ。既存体制へ継続的な専門支援を追加する場合は、睡眠に特化した産業医支援をご確認ください。復職や就業制限など個別案件の支援は、復職・両立支援で対応範囲をご案内します。 | 睡眠に特化した産業医支援 → `/service/komon/` | 復職・両立支援 → `/service/return-to-work-support/` | `reviewed_full_body` |
| 4 | 長時間労働者の面接指導 | 長時間労働者の面接指導を、意見提出後の措置と再評価まで継続して回したい企業へ。選任・定例業務を含む体制は、嘱託産業医サービスをご確認ください。既存の産業医体制へ睡眠領域の支援を追加する場合は、睡眠に特化した産業医支援をご案内します。 | 嘱託産業医サービス → `/service/sangyoui/` | 睡眠に特化した産業医支援 → `/service/komon/` | `cta_only` |
| 5 | 健康経営の睡眠施策 | 睡眠施策を、実施記録と次年度の改善まで含めて設計したい企業へ。既存の産業医体制に睡眠施策の継続支援を追加する場合は、睡眠に特化した産業医支援をご確認ください。選任・定例業務として施策を継続する場合は、嘱託産業医サービスをご確認ください。 | 睡眠に特化した産業医支援 → `/service/komon/` | 嘱託産業医サービス → `/service/sangyoui/` | `cta_only` |
| 6 | 復職時の睡眠評価 | 「復職可能」の診断書は届いたものの、会社として判断材料が足りない企業へ。目前の1案件について面談・意見書・会社決定・再評価を進める場合は、復職・両立支援の単発をご確認ください。反復する案件を既存体制へ継続的に補完する場合は、睡眠に特化した産業医支援をご案内します。 | 復職・両立支援の単発 → `/service/return-to-work-support/` | 睡眠に特化した産業医支援 → `/service/komon/` | `cta_only` |
| 7 | 衛生委員会議事録の3年保存 | 衛生委員会の開催・議事録・実施確認を継続して回したい企業へ。選任産業医と定例運用を含む体制は、嘱託産業医サービスをご確認ください。自社の担当者と産業医で記録・期限・証跡を管理する場合は、産業衛生DX・CASETRAをご案内します。 | 嘱託産業医サービス → `/service/sangyoui/` | 産業衛生DX・CASETRA → `/service/cloud/` | `cta_only` |
| 8 | 産業医面談の日程調整 | 面談日程・必要資料・確定責任者を、案件ごとにメールで追う運用から変えたい企業へ。自社の人事と産業医で案件を管理する場合は、産業衛生DX・CASETRAをご確認ください。選任・定例業務を含めて委託する場合は、嘱託産業医サービスをご案内します。 | 産業衛生DX・CASETRA → `/service/cloud/` | 嘱託産業医サービス → `/service/sangyoui/` | `cta_only` |
| 9 | 産業医意見書が届いたあと | 産業医意見の受領後に、会社決定・実施・再評価が止まる企業へ。自社の人事と産業医で期限と証跡を継続管理する場合は、産業衛生DX・CASETRAをご確認ください。目前の復職案件を1件単位で完了させる場合は、復職・両立支援をご案内します。 | 産業衛生DX・CASETRA → `/service/cloud/` | 復職・両立支援 → `/service/return-to-work-support/` | `cta_only` |
| 10 | 就業制限の解除忘れ | 就業制限の再評価日が迫っている、または古い制限が残っている企業へ。目前の1案件について面談・意見・会社決定・解除条件を整理する場合は、復職・両立支援をご確認ください。複数案件の期限と証跡を自社で継続管理する場合は、産業衛生DX・CASETRAをご案内します。 | 復職・両立支援 → `/service/return-to-work-support/` | 産業衛生DX・CASETRA → `/service/cloud/` | `cta_only` |
| 11 | 睡眠所見から就業配慮へ | 睡眠の所見を、業務リスク・産業医意見・会社決定・再評価へつなげたい企業へ。既存の産業医体制へ睡眠領域の支援を追加する場合は、睡眠に特化した産業医支援をご確認ください。選任・定例業務を含む体制は、嘱託産業医サービスをご案内します。 | 睡眠に特化した産業医支援 → `/service/komon/` | 嘱託産業医サービス → `/service/sangyoui/` | `cta_only` |
| 12 | 睡眠の問題が復職判断に変わるとき | 睡眠の相談から休職・復職判断へ局面が変わり、会社側の材料が足りない企業へ。目前の1案件について面談・意見書・会社決定・再評価を進める場合は、復職・両立支援の単発をご確認ください。反復する案件を既存体制へ継続的に補完する場合は、睡眠に特化した産業医支援をご案内します。 | 復職・両立支援の単発 → `/service/return-to-work-support/` | 睡眠に特化した産業医支援 → `/service/komon/` | `cta_only` |

承認時に固定する文字列:

`B 承認: 2026-09-01-v6 / 8a37688634893094c2fc0a6ba7827230dd2eba6797e9dd1183c56482bef1a34a`

## C. 50人未満ストレスチェック2028 v3

- Exact: `exact/stresscheck-small-workplace-2028-2026-09-01-v3.json`
- Full body: `articles/stresscheck-small-workplace-2028.html`、SHA `a5a8666dcb2d0512b23b6e0796988ee9fec2652bfba86640adf400b60aeec97f`
- WordPress: post 1555 `/stresschecknew/`
- 2026-09-01 20:37 JST read-only dry-run: modified `2026-07-28T16:27:23`、現行本文SHA `665dff9ab33275a8f564f0f25eb47f72a92de3faa52a08f2dc5111c9b5e6f4c1` とlock一致。slug/status維持、旧記事が現在も公開中

| Field | Exact value |
|---|---|
| title / H1 | ストレスチェックは50人未満も義務化｜2028年4月1日までの準備 |
| meta description | 50人未満の事業場でもストレスチェックは2028年4月1日から義務化されます。法案段階ではない現行情報と、実施体制、個人結果の取扱い、高ストレス者の面接指導までに企業が準備する項目を整理します。 |
| excerpt | 労働者数50人未満の事業場でも、ストレスチェックは2028年4月1日から義務化されます。施行前に企業が決める実施体制、個人結果の取扱い、面接指導後の会社対応を整理します。 |
| Primary CTA | 嘱託産業医サービスの対応範囲を確認する → `/service/sangyoui/` |

承認時に固定する文字列:

`C 承認: 2026-09-01-v3 / 6bcbd35e962d235b7344fe0571d9e1ea3907597c78e8df725bdd19fd337610bc`

## F. 既存産業医を替えず専門支援を追加する記事 v1

- Exact: `exact/existing-industrial-physician-specialist-support-2026-09-01-v1.json`
- Full body: `articles/existing-industrial-physician-specialist-support.html`、SHA `46f87f401fc660a14c7da8e51c195a351495c74eb838db4ae8c7884d79eaacd5`
- WordPress: post未作成、slug候補 `existing-industrial-physician-specialist-support`
- 主検索仮説: `既存産業医 睡眠`。実測語ではなく、公開後のquery×pageで検証
- 主導線: KIDUKI Basic → `/service/komon/`
- 副導線: 復職・両立支援単発 → `/service/return-to-work-support/`
- PackはP-01/P-02未実施のため本文・CTAから除外

| Field | Exact value |
|---|---|
| title / H1 | 既存産業医を替えずに睡眠・復職支援を追加する方法｜役割分担の決め方 |
| meta description | 既存の選任産業医を交代せず、睡眠・夜勤・運転・SAS・休復職の専門支援を追加する方法を、担当範囲、健康情報の共有、会社決定、再評価、単発と継続支援の分け方で整理します。 |
| Primary CTA | 睡眠に特化した産業医支援 → `/service/komon/` |
| Secondary CTA | 復職・両立支援 → `/service/return-to-work-support/` |

承認時に固定する文字列:

`F 承認: 2026-09-01-v1 / c524ae175125c8be963b2ed3fc1cdc2b8ffb6e8e1213db0f1bcae4e023234fc4`

## G. 産業医面談・意見書・再評価の案件管理記事 v1

- Exact: `exact/occupational-health-case-management-2026-09-01-v1.json`
- Full body: `articles/occupational-health-case-management.html`、SHA `33539eeb60d77bce0d4229082254b883846735bfbe22f7364de6f3415ce22f54`
- WordPress: post未作成、slug候補 `occupational-health-case-management`
- 主検索仮説: `産業医 意見書 管理`。実測語ではなく、公開後のquery×pageで検証
- 主導線: CASETRA → `/service/cloud/`
- 副導線: KIDUKI Retain → `/service/sangyoui/`
- メール・表計算を一律に否定せず、担当・期限・会社決定・再評価を一案件で追えるかを切替基準とする

| Field | Exact value |
|---|---|
| title / H1 | 産業医面談・意見書・再評価を管理する方法｜メール・表計算から見直す基準 |
| meta description | 産業医面談、資料、意見書、会社決定、実施、再評価を一つの案件として管理する方法を解説。メール・表計算を続けられる条件と、案件管理へ切り替える目安、健康情報の取扱いを整理します。 |
| Primary CTA | 産業衛生DX・CASETRA → `/service/cloud/` |
| Secondary CTA | 嘱託産業医サービス → `/service/sangyoui/` |

承認時に固定する文字列:

`G 承認: 2026-09-01-v1 / ef7b280d49fa75e34013a0f540d6b4ceb00b680c4ca0ac0200abf5f6d57c1b7a`

## 別の本番権限が必要なプライバシー修正

Pack・SPOTフォームのGA4 privacy v1はコンテンツ承認ではなく、静的本番反映の運用判断です。

- Manifest: `exact/static-lead-form-ga4-privacy-2026-09-01-v1.json`
- SHA: `a17cd81de2dd936fca0447bd0fa8f8bf0e7586043a9712d2f5466ece62d3fecb`
- 公開版は2026-09-01 20:37 JSTにlive-before hash一致
- ローカル候補はGA4から第一者 `lead_id` と相談詳細を除外し、Casetraへの第一者保存、完了画面、予約導線を維持
- `main` pushはAzure本番反映になるため、A〜Cの承認だけでは実行しない

本番反映を許可する場合に固定する文字列:

`D 本番反映を許可: 2026-09-01-v1 / a17cd81de2dd936fca0447bd0fa8f8bf0e7586043a9712d2f5466ece62d3fecb`

## WordPress本番反映権限

A〜Cのexact版を承認したうえで、実際のWordPress更新も許可する場合は対象ごとに次を固定します。各反映は直前dry-run、バックアップ、readback、公開PC/スマホ確認を必須とします。

`E-A WordPress本番反映を許可: 2026-09-01-v2 / a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9`

`E-B WordPress本番反映を許可: 2026-09-01-v6 / 8a37688634893094c2fc0a6ba7827230dd2eba6797e9dd1183c56482bef1a34a`

`E-C WordPress本番反映を許可: 2026-09-01-v3 / 6bcbd35e962d235b7344fe0571d9e1ea3907597c78e8df725bdd19fd337610bc`

## 現在は承認対象に入れないもの

| Candidate | State | Reason |
|---|---|---|
| 単発vsPack比較記事 v3 | tier-s-review | Pack P-01/P-02未実施、期間説明の正本決定待ち |
| consultトップ→Pack・SPOT分岐 v1 | tier-s-review | Pack P-01/P-02未実施。clean URLと非PII計測への修正は済んだが公開不可 |
| Site Kit週次メール | subscribed false | 登録メールへの継続送信は別権限。コンテンツexact承認に含めない |
| テスト問い合わせ | not performed | Flamingo/Casetra、通知メール、GA4への外部書込みを伴うため別の受入権限が必要 |

## 状態境界

- A〜Cのexact承認は、文言・記事本文の人間判断だけを証明する。
- F〜Gのexact承認も文言判断だけを証明し、WordPress post作成、予約、公開を許可しない。
- Dは静的2ファイルの本番反映権限であり、A〜Cを自動的に公開しない。
- E-A〜E-Cは対象別のWordPress本番反映権限であり、対応するA〜Cのexact承認なしでは実行しない。
- WordPress本番反映は、直前dry-run、バックアップ、readback、PC/スマホ確認が別途必要。
- 公開後7日・28日・90日、週次・月次で、Search Console、GA4遷移、第一者問い合わせ、商談、契約を別々に測定する。
