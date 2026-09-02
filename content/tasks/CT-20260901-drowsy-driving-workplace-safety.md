---
task_id: CT-20260901-drowsy-driving-workplace-safety
title: 運転業務の眠気リスク｜ヒヤリハットを個人の不注意で終わらせない
project: kdk-wordpress
channel: web-article
domain: safety
risk_tier: S
status: owner-review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/drowsy-driving-workplace-safety.html
exact_version: 2026-09-01-v6
exact_version_sha256: 44268cc4717bdb7906929d594ffeafd60f7f0c6f19b337ef1649fedadfe07e0d
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- 運転業務の眠気リスクを個人の不注意で終わらせず、会社の評価と就業措置の設計相談へつなぐ。

## Audience and action

- Audience: 運転業務を持つ企業の人事・安全衛生・運行管理担当者
- Main question or job: ヒヤリハット後に勤務記録、健康確認、就業措置をどうつなぐか
- Desired next action: `/service/komon/` で継続支援を確認し、復職・就業制限の個別案件だけ単発/Packへ進む
- Non-goals: 個人への診断・治療指示、効果保証、特定医療機関への誘導、検索語の機械的反復

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 継続的な専門補完はKIDUKI Basic。診断・治療や事故防止の保証は行わない。
- Approved terminology: 眠気リスク、運転業務、就業上の配慮、再評価
- Constraints and boundaries: 診断・治療は医療機関、就業上の最終決定と実施は会社、健康情報は必要最小限。商品・料金は現行正本から変更しない。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/drowsy-driving-workplace-safety.html | 2026-09-01 | 公開/予約版の本文、CTA、記事内根拠 | 検索成果、owner/physician approval |
| https://www.mhlw.go.jp/content/001305530.pdf | 2026-09-01 | 記事内の主要な公的・一次根拠 | KIDUKIの商品適合、契約成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/pricing-growth-canonical.md | 2026-09-01 | 現行商品、料金、単発/Pack/Basic/Retain/CASETRA境界 | 医療事実、検索成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/bpo-scope-boundary.md | 2026-09-01 | KIDUKI、企業、医師、CASETRAの履行境界 | 検索需要、CTR |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/core-thesis.md | 2026-09-01 | 事業原理と契約導線 | 個別CTAの承認、契約実績 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/copy/site-copy.md | 2026-09-01 | 公開用語、医療広告、CTA規律 | 検索順位、owner approval |

### Unresolved points

- Search Consoleの対象クエリ、ページ、表示・クリック・順位は公開後の測定待ち。
- 予約・公開の事実と、owner/physician approval evidence は分けて記録する。

## Outline

1. 検索者の質問へ冒頭で答える
2. 会社、本人、主治医、産業医の役割を分ける
3. 会社が次に確認・決定・記録する内容を示す
4. 医療・法務・商品境界を明示する
5. 主サービス1つと副サービス1つへつなぐ

## Draft requirements

- Voice: 宮部大輔の産業医・医師としての実務的な説明。結論先行で、恐怖や優越性に頼らない。
- Required points: 検索意図への直接回答、就業上の実務、会社決定、再評価、必要な公的根拠
- Forbidden claims or wording: 「睡眠専門医」「普通の産業医はできない」「必ず」「絶対」「治る」「復職を保証」「当院では」
- Channel limits: WordPress記事。1記事1検索意図。公開版のH1はWordPress側に任せ、本文に追加しない。
- CTA or next action: 運転・眠気リスクの評価範囲を相談する

## Review plan

- Source and fact reviewer: 公的根拠、商品・料金正本、現行公開ページの照合
- Safety or compliance reviewer: 医療・安全・雇用・法令・医療広告の該当領域
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | 記事末CTA | 予約版は全記事共通CTAで、運転・眠気リスクの検索意図と最初の商品が一致しない | article-plan.json / service/komon | Basicを主着地、復職・就業制限の個別案件に限り単発/Packへ分岐するexact CTAへ修正 | accepted / repaired locally |
| Medium | 計測 | 記事からサービスへの遷移元を判別できない | seo-measurement-spec.md | article slug、offer、CTA roleを非PIIで付与 | accepted / repaired locally |
| Medium | Source pack | 商品導線を記載しているが商品・BPO・医療広告の正本がSource packになかった | 独立Tier Sレビュー | 4つの現行正本を支持/非支持範囲付きで追加 | accepted / repaired |
| High | 記事末CTA | 「特定の1案件」だけでは一般SPOTも対象に見え、廃止済みの一般SPOTを実質的に復活させる | 独立Tier S再レビュー / pricing-growth-canonical.md 5章 | 副導線を「復職や就業制限の変更・解除など、対象を固定した1案件」に限定 | accepted / repaired in v3 |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/drowsy-driving-workplace-safety.html`
- Automated checks: `npm run verify:article-plan` の対象。2026-09-01 20:37 JSTのv6 dry-runはCTAのみ11件 `would_update`、SAS本文を含む1件 `would_update_reviewed_full_body`、`writes: false`。日付経過後の状態検証はWordPress実状態と分ける。
- Exact CTA approval bundle: `../exact/article-cta-owner-review-2026-09-01-v6.json`（SHA-256 `8a37688634893094c2fc0a6ba7827230dd2eba6797e9dd1183c56482bef1a34a`）。bundle一致・apply binding検証に合格。`owner-review` は承認・公開権限ではない。
- Apply safety: v6反映には本ticketの `status: approved`、`owner_decision: approved`、同一exact version/source SHA、approval evidence、physician approvalに加え、別の `--wordpress-apply-authority-confirmed` が必要。現状態ではWordPress接続前に拒否され、反映時はpostを個別API readbackする
- Human approval: evidence未添付
- Schedule record: WordPress post 1842、2026-09-04 07:00 JST予約を確認
- Post-publication review record: 7d 2026-09-11T08:00:00+09:00（6a1vabkhjk35l7r6d76dsfpiek）、28d 2026-10-02T08:20:00+09:00（76jgek03ihap2tq29eh0mlt86c）、90d 2026-12-03T08:50:00+09:00（6o7mg79p21fcmlsllu3sah0rk0）。Google Calendar APIで2026-09-01に確認
- Published verification:
- Measurement source and period:
- Remaining gates: exact versionのowner/physician approval evidence、公開後のライブ確認、Search Consoleと契約測定

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | Ticket created |
| 2026-09-01 | backlog | scheduled | WordPress post 1842、2026-09-04 07:00 JSTを確認。予約は承認証拠ではない |
| 2026-09-01 | scheduled | owner-review | 予約版を変更せず、CTA exact版 2026-09-01-v1 を作成 |
| 2026-09-01 | owner-review | owner-review | 独立Tier Sレビュー後、商品正本Source packと測定境界を補い、現行exact batchを2026-09-01-v2へ固定 |
| 2026-09-01 | owner-review | owner-review | 一括承認資料の独立Tier Sレビュー指摘を修正。検索意図・CTA未反映状態を明示し、一般SPOT誤認と受診勧奨境界を修正した2026-09-01-v3へ固定 |
| 2026-09-01 | owner-review | owner-review | 再レビューでSAS本文の受診先本人選択・特定医療機関非指定/非紹介を正本どおり補い、2026-09-01-v4へ固定 |
| 2026-09-01 | owner-review | owner-review | full-bodyのscope・理由・変更前WordPressハッシュを承認バンドルSHA-256へ結合し、2026-09-01-v5へ固定 |
| 2026-09-01 | owner-review | owner-review | CASETRA PackのP-01/P-02未実施を再照合。公開CTAとtarget offerからPackを除外した一括bundle 2026-09-01-v6へ再固定し、20:37 JSTのread-only dry-runで現行WordPress baseline一致を確認。未承認・未反映 |
