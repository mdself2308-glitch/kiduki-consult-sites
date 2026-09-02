---
task_id: CT-20260901-consult-search-discovery-audit
title: consult検索発見と契約導線の公開監査
project: kdk-wordpress
channel: internal
domain: employment
risk_tier: S
status: review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/consult-search-discovery-audit-2026-09-01.md
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- consultのPack・SPOT申込面について、クロール可否、サイトマップ、canonical、公開内部リンク、Search Console実績を分離して監査し、検索語から契約までの導線欠落を特定する。

## Audience and action

- Audience: KIDUKI owner、SEO・WordPress・static運用者
- Main question or job: Pack・SPOTが検索と公開導線から発見される構造か判断する
- Desired next action: WordPress商用ページと静的トップのリンク修正を別exact成果物として承認キューへ載せる
- Non-goals: URL検査未実施のURLを登録済み/未登録と断定する、未承認の本文更新やstatic pushを行う

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: Pack・SPOT申込面は公開中。商用ページと静的トップからの直接リンクは公開HTMLで0件。
- Approved terminology: クロール可能、インデックス登録、内部リンク、申込面、valid inquiry、商談、契約
- Constraints and boundaries: sitemap掲載、URL検査、表示、クリック、問い合わせ、契約を別成果として扱う。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| https://consult.kdkconslt-sngyouijm.com/robots.txt / sitemap.xml / return-to-work-pack/ / return-to-work-spot/ / https://kdkconslt-sngyouijm.com/service/return-to-work-support/ | 2026-09-01 | HTTP応答、canonical、明示noindex不在、内部リンク有無 | Googleの登録状態、順位改善 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/measurement-live-audit-2026-09-01.json | 2026-09-01 | consult用Search Consoleの観測値 | SPOTのURL検査、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-contract-funnel.md | 2026-09-01 | 検索語、判断ページ、商品、測定境界 | owner approval、production権限 |

### Unresolved points

- Pack・SPOTのSearch Console URL検査はGoogle再ログインが必要で未実施。
- 静的トップのリンク候補文言は別exact成果物が必要。

## Outline

1. robots・sitemap・HTTP・canonicalを確認する
2. 静的トップとWordPress商用ページの公開リンクを確認する
3. Search Console観測値とURL検査未確認を分ける
4. WordPress商用ページ、静的トップ、公開後測定の順を定める

## Draft requirements

- Voice: 事実と未確認を分離した内部監査
- Required points: 公開URL、確認日時、内部リンク0、Search Console観測値、修正順、停止条件
- Forbidden claims or wording: インデックスされていない、SEO効果がない、順位が上がる、契約につながる、の未確認断定
- Channel limits: 内部用。公開本文ではない。
- CTA or next action: exact approval後に公開導線を修正する

## Review plan

- Source and fact reviewer: 公開HTMLとローカルsourceの照合
- Safety or compliance reviewer: index・検索・契約成果の誤認防止
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | 公開内部リンク | sitemap掲載済みだが静的トップとWordPress商用ページからPack・SPOTへの直接リンクが0件 | 2026-09-01公開HTML | 商用ページv2と静的トップを別exact成果物で修正 | queued; production pending |
| Medium | URL検査 | Search Console performanceにPack 1表示はあるがSPOTのURL検査は未確認 | consult用URL-prefix観測値とGoogleセッション状態 | 再ログイン後にURL検査し、登録状態を別証拠として記録 | pending |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/consult-search-discovery-audit-2026-09-01.md`
- Automated checks: 公開curl/HTML照合、content task validator、`git diff --check`
- Human approval:
- Schedule record: 公開後7日・28日・90日
- Published verification: なし。監査のみで外部変更なし
- Measurement source and period: Search Console consult用URL-prefix、3か月選択のチャート期間2026-08-13〜2026-08-29
- Remaining gates: URL検査、exact approval、WordPress/static production権限

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | consultの表示がWordPress用Site Kitに含まれないため個別監査を開始 |
| 2026-09-01 | backlog | review | 公開robots/sitemap/HTTP/canonical/内部リンクとSearch Console観測値を分離して記録 |
