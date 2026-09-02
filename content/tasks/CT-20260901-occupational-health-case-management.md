---
task_id: CT-20260901-occupational-health-case-management
title: 産業医面談・意見書・再評価を管理する方法
project: kdk-wordpress
channel: web-article
domain: employment
risk_tier: S
status: owner-review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/occupational-health-case-management.html
exact_version: 2026-09-01-v1
exact_version_sha256: ef7b280d49fa75e34013a0f540d6b4ceb00b680c4ca0ac0200abf5f6d57c1b7a
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- 面談予約だけでなく、資料、医師意見、会社決定、実施、再評価を一つの案件として管理する基準を示し、自社運用が必要な企業をCASETRAの導入相談へつなぐ。

## Audience and action

- Audience: 産業医面談や意見書をメール・表計算で管理し、担当分散、期限、再評価、健康情報の権限に課題がある人事・労務・産業保健担当者
- Main question or job: メール・表計算を続けられる条件と、案件管理へ切り替える基準を知る
- Desired next action: 自社の人事・既存産業医で運用する場合は `/service/cloud/`、選任・定例業務も委託する場合は `/service/sangyoui/` で適合を確認する
- Non-goals: 表計算を違法・危険と断定すること、システム導入だけで法令遵守や漏れ防止を保証すること、CASETRAの未確認機能や成果を訴求すること

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 自社の人事・既存産業医で案件・期限・証跡を運用する企業はCASETRA、選任・定例業務も含めて委託する場合はKIDUKI Retain。KIDUKIの専門業務とCASETRAは別契約・別請求。
- Approved terminology: 案件、会社決定、実施、再評価日、解除条件、証跡、産業衛生DX・CASETRA
- Constraints and boundaries: システムは医学判断や会社決定を代行しない。健康情報の利用目的、取扱者、権限、範囲、安全管理を事業場側で定める。個別の法務・セキュリティ適合を断定しない。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| https://laws.e-gov.go.jp/law/347AC0000000057 | 2026-09-01 | 医師意見、事業者の措置、心身情報の取扱いという法的工程 | 特定システムの適合性、CASETRAの性能 |
| https://jsite.mhlw.go.jp/okayama-roudoukyoku/newpage_00155.html | 2026-09-01 | 健康情報の目的、取扱者、権限、範囲、安全管理体制、規程化 | メール・表計算の一律禁止、CASETRAのセキュリティ認証 |
| https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000055195_00005.html | 2026-09-01 | 復職前後の複数工程とフォローアップ | 全産業保健案件の必須ワークフロー、CASETRAの商品適合 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/source/wordpress/page-166-cloud.html | 2026-09-01 | 現行公開のCASETRA役割、予約・資料・意見・会社決定・再評価、契約境界 | 個別機能の実機受入、導入成果、契約実績 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/industrial-physician-scheduling.html | 2026-09-01 | 日程調整という個別工程の記事役割 | メール往復数の一般化、CASETRA導入効果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/after-the-physician-opinion.html | 2026-09-01 | 意見受領後の会社決定という個別工程 | 全案件管理の設計、契約成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/work-restriction-release-management.html | 2026-09-01 | 再評価日と解除管理という個別工程 | CASETRAが必要になる件数基準、導入成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/pricing-growth-canonical.md | 2026-09-01 | CASETRA/KIDUKI契約境界 | 法務・情報セキュリティ、検索需要 |

### Unresolved points

- `産業医 意見書 管理`、`産業医 面談 管理 システム` は戦略上の検索仮説。Search Console実測と検索ボリュームは未取得。
- CASETRAの公開ページで確認できる範囲を超え、監査ログ、権限粒度、通知、保存期間等の機能を断定しない。
- 既存3記事との検索意図重複は、公開前にtitle/meta/内部リンクを含む独立SEOレビューで再確認する。
- post ID、公開日、7/28/90日レビュー日は未決定。

## Outline

1. メール・表計算でも一案件として追えれば運用できると先に答える
2. 受付から再評価までの6工程と管理項目を示す
3. 表計算を続けられる条件と案件管理へ切り替える目安を分ける
4. メール、表計算、案件管理システムの役割と限界を比較する
5. 既存3記事へ工程別リンクを張り、CASETRAを主CTA、Retainを副CTAにする

## Draft requirements

- Voice: 道具ありきで煽らず、現在の運用を棚卸しできる実務的な説明。
- Required points: 一案件としての完了条件、担当、期限、医師意見、会社決定、実施、再評価、健康情報の権限、切替基準
- Forbidden claims or wording: 「Excelは危険」「メールは違法」「完全自動」「漏れゼロ」「必ず効率化」「法令遵守を保証」「健康情報を一元管理」
- Channel limits: WordPress記事。1記事1検索意図。本文にH1を置かない。既存3記事の工程別検索意図を奪わず、管理方法の選定記事にする。
- CTA or next action: CASETRAを主着地、Retainを副着地にする。

## Review plan

- Source and fact reviewer: e-Gov、厚生労働省、page 166、CASETRA/KIDUKI正本の整合
- Safety or compliance reviewer: 健康情報、雇用判断、情報セキュリティ、未確認機能・成果、検索カニバリゼーション
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | 記事の前提 | 表計算を問題そのものと描くと、根拠のない恐怖訴求と商品優位性になる | content-production / core-thesis | 表計算でも成立する条件を先に明示し、正本・担当・期限が分散する状態を問題にする | accepted / repaired in draft |
| High | CASETRA説明 | 公開ページで未確認の監査ログ・権限機能・効果を推測すると商品事実を超える | page 166 / pricing正本 | 公開確認済みの案件・期限・記録の役割に限定し、個別機能名と成果数値を出さない | accepted / repaired in draft |
| Medium | 健康情報 | 進捗一覧へ診断名等を載せる読み方を防ぐ必要がある | 岡山労働局手引き | 就業措置に必要な情報と医学情報詳細を分け、閲覧権限を管理項目へ追加 | accepted / repaired in draft |
| Medium | SEO重複 | 日程、意見後、解除管理の3記事と広く重複する | seo-contract-funnel / 既存記事 | 本稿を「管理方法の選定」に限定し、詳細は既存3記事へ送る | accepted / repaired in draft |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/occupational-health-case-management.html`
- Automated checks: `npm run verify:occupational-health-case-management-exact`、`npm run verify:occupational-health-case-management-create`、`npm run verify:future-article-review-plan` 合格。本文hash `33539eeb60d77bce0d4229082254b883846735bfbe22f7364de6f3415ce22f54`、4正本hash、title/meta、主・副CTA、必須境界、禁止語、exactと作成config・承認ticket・公開時刻待ち計画の拘束を照合。WordPress live read-only dry-runはslug一致0件、`status: draft`、category 46/47、`persistentWrites: false`
- Human approval: 未取得
- Schedule record: `content/future-article-review-plan.json` に週次キュー、公開後月次導線レビュー、7/28/90日offsetを登録。post ID・公開時刻・calendar event IDは実公開readback前なので未設定
- Published verification: 未公開
- Measurement source and period: 公開後にWordPress URL-prefix Search Console、GA4、第一者問い合わせ、商談、契約を別測定
- Remaining gates: 宮部大輔によるexact v1のowner/physician approval記録、別のWordPress下書き作成権限、backup付きcreate、API readback、公開前のmeta・画像・内部リンク・PC/スマホ確認、別の公開権限、実公開時刻を起点にした7/28/90日calendar登録、公開後ライブ・計測確認

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | Ticket created |
| 2026-09-01 | backlog | review | 共通content-productionマニュアル、KIDUKI商品正本、厚生労働省一次資料に基づき初稿を作成。CASETRAを主導線、Retainを副導線に固定 |
| 2026-09-01 20:56 JST | review | owner-review | 事実、商品境界、健康情報、未確認機能、雇用判断、既存記事との検索意図を役割分離して再確認。本文・title・meta・CTAと4正本をexact v1へ固定し、verifier合格。未承認・未公開 |
| 2026-09-01 | owner-review | owner-review | exact v1・本文・承認ticketに拘束した下書き作成configを検証。WordPress live read-only dry-runでslug一致0件、draft、category 46/47、書込み0を確認。ticketがapprovedでないapplyはWordPress接続前に拒否する。公開時刻待ちの7/28/90日計画へ登録 |
