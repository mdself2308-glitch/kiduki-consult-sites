---
task_id: CT-20260901-seo-exact-owner-review
title: KIDUKI SEO exact owner・医師レビュー束
project: kdk-wordpress
channel: internal
domain: medical
risk_tier: S
status: owner-review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-exact-owner-review-2026-09-01.md
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- 現在の公開baselineに一致するSEO exact候補だけを、宮部大輔が文言・医療広告・商品導線単位で判断できる一つのレビュー束にする。

## Audience and action

- Audience: KIDUKI owner / physician 宮部大輔
- Main question or job: どのexact版を承認・修正・保留し、どの候補は商品受入待ちとして承認対象外にするか
- Desired next action: A〜C・F・Gをexact versionとSHA-256単位で個別判断し、Dのstatic本番権限とE-A〜E-CおよびF・GのWordPress作成・公開権限は別に判断する
- Non-goals: この資料自体を承認記録にすること、WordPress/staticへ反映すること、Pack未受入を解除すること、公開・測定済みとみなすこと

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 復職・両立支援単発、Basic、Retain、CASETRAはCTA候補。PackはP-01/P-02未実施のため新しい公開CTAから除外する。
- Approved terminology: exact version、SHA-256、owner-review、owner approval、physician approval、production permission、not applied
- Constraints and boundaries: exact承認、医師承認、WordPress apply、static main push、公開確認、計測を分離する。未受入商品と本番権限を一括承認へ混ぜない。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/.agents/skills/content-production/SKILL.md | 2026-09-02 | MyBrain全体の制作、Tier S、承認・公開状態境界 | KIDUKI個別商品の受入 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/spot-industrial-physician-ctr-2026-09-01-v2.json | 2026-09-01 | Spot v2のexact文言 | owner/physician approval、公開成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/article-cta-owner-review-2026-09-01-v6.json | 2026-09-01 | 12記事CTA v6、Pack除外、商品・approval gate | owner/physician approval、公開成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/article-cta-wordpress-dry-run-2026-09-01.json | 2026-09-01 | 21:47 JSTの12記事live baseline、公開1・予約11、11 CTA-only＋SAS full-body 1、書込み0 | owner/physician approval、apply、公開、検索成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/seo-goal-completion-audit-2026-09-01.json | 2026-09-01 | exact承認・production権限を含む目標19要件と未完了状態 | 将来の人間承認、公開後成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/stresscheck-small-workplace-2028-2026-09-01-v3.json | 2026-09-01 | ストレスチェック記事v3の法令・医療・広告review済みexact | owner/physician approval、公開成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/existing-industrial-physician-specialist-support-2026-09-01-v1.json | 2026-09-01 | 既存産業医を維持した専門補完記事v1の事実・安全・医療広告review済みexact | 検索需要、owner/physician approval、WordPress post、公開成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/occupational-health-case-management-2026-09-01-v1.json | 2026-09-01 | 面談・意見・会社決定・再評価の管理方法記事v1の事実・安全・商品review済みexact | 検索需要、owner/physician approval、WordPress post、公開成果 |
| /Users/dmmac/casetra_active/docs/operations/CASETRA_PRETEST_LAUNCH_STATUS_2026-08-25.md | 2026-09-01 | 最新記録の一般ローンチNO-GO | Pack P-01/P-02のPASS |
| /Users/dmmac/casetra_active/docs/operations/CASETRA_TEST_COMPANY_AUDIT_SHEET_JA.md | 2026-09-01 | Pack P-01/P-02未実施 | 将来の受入完了 |
| 2026-09-01 20:37 JST WordPress read-only dry-runs / schedule audit / static live-before verify | 2026-09-01 | post ID、slug、status、日時、本文lock、公開静的hashの現在一致 | human approval、公開成果、GA4受信、契約 |

### Unresolved points

- A〜C・F・Gの宮部大輔によるexact owner/physician approvalは未記録。
- A〜CのWordPress apply権限、F・GのWordPress作成・公開権限、Dのstatic production権限は未記録。
- Pack P-01/P-02は未実施で、比較記事とconsultトップPack分岐は承認対象外。
- 公開後のSearch Console、GA4、問い合わせ、商談、契約は未測定。

## Outline

1. 判断可能なA〜C・F・Gをexact version/hashで分ける
2. 12記事CTAの全文と着地を一表で見せる
3. Dのstatic production permissionとE-A〜E-CのWordPress permissionをコンテンツ承認から分ける
4. Pack受入待ち候補と外部書込みを承認対象外にする
5. exact承認、公開、測定の状態境界を明記する

## Draft requirements

- Voice: 経営者・医師が一読で承認範囲と未承認範囲を区別できる内部判断資料
- Required points: exact version、SHA-256、全文または本文参照、baseline、Pack gate、承認用固定文字列、production分離
- Forbidden claims or wording: approved、published、measured、Pack販売可能、全部一括承認の推測
- Channel limits: 内部資料。公開ページではなく、承認記録そのものでもない。
- CTA or next action: A〜C・F・Gの個別exact判断、DとE-A〜E-CおよびF・Gの個別production判断

## Review plan

- Source and fact reviewer: exact payload、記事台帳、公開WordPress/static baseline、CASETRA受入記録
- Safety or compliance reviewer: 医療広告、会社決定、受診先選択、未受入Pack、個人情報、承認と公開の分離
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| Blocker | 12記事CTA v5 | 未受入Packを7件のtarget offerと2件の公開CTAで明示し、owner-reviewへ進んでいた | v5 bundle、pricing正本、P-01/P-02未実施 | Packを除外したv6を作り、bundle生成時にPack混入を拒否 | accepted / repaired in v6 |
| High | 承認範囲 | exact承認とproduction permissionを一つの「全部実行」にまとめると未承認公開になる | content-production state rule、static main push境界 | A〜C・F・Gの文言承認、Dのstatic本番権限、WordPress apply・新規post作成を分離 | accepted / repaired |
| High | 12記事CTA apply gate | v6 bundle SHAとplanだけでは、12個別成果物ticketのowner/physician approval evidenceと別のWordPress反映権限が接続前に強制されない | content-productionの1成果物1ticket・状態境界、`update-wordpress-article-ctas.mjs` | 12ticketのapproved、owner decision、同一version/source SHA、approval evidence、physician approvalを全件照合し、別の `--wordpress-apply-authority-confirmed` を必須化。更新後は各postをAPI再取得 | accepted / repaired locally; approval pending |
| High | blocked候補 | 比較記事とconsultトップPack分岐をready候補と同列にすると、P-01/P-02未実施が見落とされる | CASETRA launch/audit records | 「現在は承認対象に入れない」表へ隔離 | accepted / repaired |
| Medium | baseline | 過去dry-runだけでは承認時点のWordPress状態を保証できない | project release rules | 2026-09-01 20:37 JSTと21:47 JSTに既存全対象をread-only再確認し、直前にも再実行する。F・Gはpost未作成として固定する | accepted / current read verified |
| High | F・G新規記事 | 検索仮説だけで公開すると、需要未確認の量産と商品・医療境界の逸脱が起こり得る | Search Console未取得、一次資料、KIDUKI商品正本 | 1成果物1チケット、Tier Sレビュー、exact hash、主副CTA、未作成状態を固定し、公開後7/28/90日で継続判断する | accepted / repaired locally |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-exact-owner-review-2026-09-01.md`
- Automated checks: v6 canonical bundle、apply binding、12記事plan、SEO content map、Spot/Stress/F/G exact・approval binding、`verify:article-cta-wordpress-dry-run-evidence`、`verify:seo-goal-completion-audit`、WordPress live read-only dry-runs、article schedule audit、static live-before、content task validator、`git diff --check`。21:47 JSTの12記事CTA再dry-runでCTA-only 11件・reviewed full body 1件・書込み0を確認。反映権限なしと個別ticket承認なしのapplyをそれぞれWordPress接続前に拒否し、成功時のpost別API readbackを実装
- Human approval:
- Schedule record: 既存の週次・月次および各記事7/28/90日計画。実反映時刻を基準に更新する。
- Published verification: なし。A〜Gは今回未反映。F・GはWordPress post未作成。
- Measurement source and period: 既存のSearch Console/GA4監査を参照。今回のv6公開後成果は未測定。
- Remaining gates: A〜C・F・Gのexact owner/physician approval、DとWordPressの対象別production権限、F・Gのpost ID・公開日、直前dry-run、backup、apply、readback、PC/スマホ、7/28/90日計測

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | review | ready候補とblocked候補を一つの判断資料へ整理開始 |
| 2026-09-01 | review | review | v5の未受入Pack混入をBlockerと判定し、v6へ修正。12件のhash・CTA・着地を再固定 |
| 2026-09-01 | review | owner-review | WordPress/staticのread-only baseline再確認後、A〜Cだけを個別exact判断へ進め、Dとblocked候補を分離 |
| 2026-09-01 | owner-review | owner-review | 全体content-productionマニュアルに従いF・Gを1成果物1チケット、Tier S、exact v1へ固定。post未作成・検索需要未確認のまま個別判断対象へ追加 |
| 2026-09-01 | owner-review | owner-review | 12記事CTA v6のlive dry-runを再実行し11 CTA-only＋SAS full-body 1、書込み0、状態・日時維持を確認。12個別ticketのowner/physician approvalと別のWordPress反映権限を接続前必須にし、post別API readbackを追加。未承認・未反映 |
| 2026-09-01 | owner-review | owner-review | 21:47 JSTにKeychain認証の12記事live dry-runを再実行。公開1・予約11のID・status・日時を維持し、11 CTA-only＋SAS full-body 1、書込み0を確認。構造化証拠とverifierへ固定 |
