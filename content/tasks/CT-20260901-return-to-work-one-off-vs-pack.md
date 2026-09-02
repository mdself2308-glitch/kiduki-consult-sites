---
task_id: CT-20260901-return-to-work-one-off-vs-pack
title: 復職面談は単発とPackのどちらを選ぶか
project: kdk-wordpress
channel: web-article
domain: medical
risk_tier: S
status: review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/return-to-work-one-off-vs-pack.html
exact_version: 2026-09-01-v3
exact_version_sha256: 207ea3080c15648f5b4f621e8f01ac1caeb4b2274353cfbfa7c1e64f27bc3204
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- `復職面談 単発`、`産業医 復職面談 スポット` の契約直前意図に答え、月額契約のない企業が復職・両立支援単発と復職支援Packを必要範囲で選べるようにする。

## Audience and action

- Audience: 目前の復職案件について外部産業医への単発依頼を検討している企業の人事・労務担当者
- Main question or job: 1回の単発で足りる案件と、復職後まで含むPackが必要な案件をどう分けるか
- Desired next action: `/service/return-to-work-support/` で範囲を確認し、初回の相談で案件適合を整理する
- Non-goals: 個人向け医療相談、一般SPOT商品の復活、最安訴求、効果保証、特定医療機関への誘導、月額Casetra契約との混同

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 月額なしの入口は範囲固定の復職・両立支援単発または復職支援Pack。一般SPOTと月額0円Casetra SPOTは廃止。企業向け案件画面はサービス履行用で、独立したSaaS利用権ではない。
- Approved terminology: 1件の完了、復職・両立支援単発、復職支援Pack、会社決定、再評価日、解除条件、証跡、初回のご相談
- Constraints and boundaries: 診断・治療は医療機関、評価・意見までがKIDUKI、最終決定と実施は会社。商品・料金はpricing-growth-canonical、公開文言と医療広告はsite-copyを正とする。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/pricing-growth-canonical.md | 2026-09-01 | 単発・Packの価格、範囲、期間、Casetra契約境界 | 医療事実、検索成果、公開承認 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/bpo-scope-boundary.md | 2026-09-01 | KIDUKI、会社、医療機関の役割分担 | 商品価格、検索需要 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/copy/site-copy.md | 2026-09-01 | 肩書き、CTA、医療広告、禁止語 | 商品の適合、検索成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/spot-industrial-physician-ctr.md | 2026-09-01 | 単発・1件・復職面談が検索結果で反復する購入前意図 | KIDUKIの順位、検索需要量、契約実績 |
| [厚生労働省 職場復帰支援の手引き](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000055195_00005.html) | 2026-09-01 | 復職可否判断、支援プラン、事業者の最終決定、復職後フォローの段階 | KIDUKIの商品適合、料金、契約成果 |
| [公開中の復職支援Pack相談面](https://consult.kdkconslt-sngyouijm.com/return-to-work-pack/) | 2026-09-01 | 150,000円、面談3回、意見書3通、契約開始から最長6か月、Pack画面と月額契約の分離の現行表示 | 実機受入、受注実績、article exactの承認 |
| [復職面談の進め方](https://kdkconslt-sngyouijm.com/return-to-work-interview-process-roles/) / WordPress post 1809 | 2026-09-01 | 診断書受領から復職後再評価までの8工程と4者の役割 | 単発とPackの商品適合、検索成果 |

### Unresolved points

- Search Consoleでは `スポット産業医` と `産業医 スポット` の商用語実測を取得済みだが、本記事の主仮説 `復職面談 単発` と副仮説のquery×page、表示回数、順位、端末別CTRは未観測。
- 公開タイトル、meta description、本文、料金表は宮部大輔のexact owner/physician approvalが必要。
- 料金表示は費用だけを強調せず、範囲比較の一項目として医療広告レビューする。
- Pack正本の「復職日から3か月または措置解除までの早い方」と公開相談面の「契約開始から最長6か月」は、復職後フォロー期間とサービス全体期間として両立し得るが、公開前に正本へ関係を明記する必要がある。
- Pack実機受入チェックリストに未完了項目が残る。公開相談面の存在を、実機受入・販売開始・履行可能性の証拠へ読み替えない。
- 新規記事のWordPress post ID、公開日、URL、カレンダー予定は未設定。

## Outline

1. 単発とPackは回数ではなく完了範囲で選ぶと冒頭回答する
2. 単発に合う案件と含む範囲を示す
3. Packに合う案件と含む範囲を示す
4. 範囲・期間・料金・Casetra境界を一表で比較する
5. 会社、産業医、医療機関の責任を分ける
6. 復職・両立支援ページへ進む

## Draft requirements

- Voice: 宮部大輔の産業医・医師としての実務的な説明。企業担当者が範囲を選べるよう結論先行にする。
- Required points: 1案件完了、単発とPackの標準範囲、期間、税別料金、会社決定、診断・治療の境界、案件画面とCasetra月額の分離
- Forbidden claims or wording: 「最安」「お得」「今すぐ」「無料」「睡眠専門医」「必ず」「絶対」「治る」「一気通貫」「当院では」、一般SPOT、特定医療機関の指定・紹介
- Channel limits: WordPress記事。本文にH1を置かない。1記事1意図。公開前にtitle/meta/body/CTAを一つのexact versionへ固定する。
- CTA or next action: `/service/return-to-work-support/` で範囲と進め方を確認する

### Proposed search result copy

- Title / H1: `復職面談は単発とPackのどちら？産業医へ依頼する範囲の決め方`
- Meta description: `企業向け。月額契約のない会社が、復職面談1回の単発と、復職後の再評価・措置解除まで含む復職支援Packを選ぶ基準を、範囲・期間・料金・会社の決定責任で整理します。`
- Primary query hypothesis: `復職面談 単発`
- Secondary query hypotheses: `産業医 復職面談 スポット`、`復職面談 産業医 費用`
- Cannibalization boundary: `/service/return-to-work-support/` は依頼範囲と相談を受ける商用ページ、本記事は単発とPackの選択質問へ答える比較記事とし、同じtitle/H1を使わない。

## Review plan

- Source and fact reviewer: 商品・料金・期間・標準範囲と厚生労働省手引きの照合
- Safety or compliance reviewer: 医療・雇用・医療広告・会社決定・受診先選択の境界
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| Medium | 既存記事との境界 | 公開済み記事1809は「面談1回では完了しない」と説明しており、新規記事の単発適合が矛盾して読まれる可能性 | WordPress公開本文 / 新規初稿 | 復職手続き全体と外部依頼範囲を分け、会社・既存体制が前後工程を管理できる場合の単発適合を明記して内部リンク | accepted / repaired locally |
| Medium | 冒頭 | 「迷う企業は少なくありません」は頻度根拠のない一般化 | Tier S evidence rule | 読者が決める必要のある比較質問へ直接書き換える | accepted / repaired in v2 |
| Medium | 執筆者表記 | `代表医師` は公開代表表記・資格マスターより曖昧で、資格のE-E-A-T情報も落ちる | `site-copy.md` / 事務所概要 | `代表／内科専門医・心療内科専門医・労働衛生コンサルタント` に統一 | accepted / repaired in v2 |
| High | Pack公開可能状態 | 正本はPack画面の受入条件を販売前ゲートとし、実機受入チェックリストには未完了項目が残る | `pricing-growth-canonical.md` 4.1 / `strategy/return-to-work-pack-casetra-workflow-2026-08-17.md` 7章 | article公開前に実機受入・履行可能性を別証拠で確認する。公開相談面の存在だけで完了扱いしない | unresolved publication gate |
| Medium | 期間表示 | 正本は復職後3か月または措置解除まで、公開相談面は契約開始から最長6か月と表示 | pricing正本 / 公開Pack相談面 | 復職後フォロー期間とサービス全体期間の関係を正本へ明記し、articleと相談面を同じ説明へ揃える | unresolved owner decision |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/return-to-work-one-off-vs-pack.html`
- Automated checks: content task validator（draft、warnings 0）。H1なし、primary CTA 1件、secondary CTAなし、現行価格4値、会社決定、診断・治療、受診先選択、Casetra月額境界、厚生労働省リンクの9 checksと、主要HTMLタグの開始・終了数一致に合格。`npm run verify:return-to-work-comparison-exact` でv3 exact SHA `207ea3080c15648f5b4f621e8f01ac1caeb4b2274353cfbfa7c1e64f27bc3204`、本文 SHA `904aa2361507797b74787b144c595c2694bb0f9619571456b9b4b08acf06bfd6`、title/meta長、CTA、必須・禁止語、3正本hashを検証
- Human approval:
- Schedule record:
- Published verification:
- Measurement source and period:
- Remaining gates: Pack実機受入証拠、期間正本と公開面の関係確定、exact v3の宮部大輔によるowner/physician approval、WordPress反映権限、post ID・公開日・7/28/90日レビュー予定、公開後のSearch Console・GA4・契約計測

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | SEO契約導線の直近制作順から1成果物1チケットを作成 |
| 2026-09-01 | backlog | review | 商品・料金・責任境界と厚生労働省手引きに基づくローカル初稿を作成。未公開・未予約 |
| 2026-09-01 | review | review | 公開済みpost 1809との検索意図・論理境界を確認し、全工程と外部依頼範囲の違いを補足。title/meta/body/CTAと3正本hashをexact v1へ固定。独立Tier Sレビュー待ち |
| 2026-09-01 | review | review | Tier S事実・安全・医療広告レビューで、根拠のない頻度表現と曖昧な肩書きを修正してexact v2へ更新。Pack実機受入未完了と期間説明の正本・公開面差を公開ゲートとして記録 |
| 2026-09-01 | review | review | スポット産業医v2のmaster-first追記に伴う `site-copy.md` hash更新をexact v3へ再固定。比較記事のcopyと公開ゲートはv2から変更なし |
