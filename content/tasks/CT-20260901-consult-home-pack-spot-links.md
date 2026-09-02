---
task_id: CT-20260901-consult-home-pack-spot-links
title: consult静的トップからPack・SPOTへの分岐リンク
project: kdk-wordpress
channel: website
domain: employment
risk_tier: S
status: review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/consult-home-pack-spot-links.md
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- consult静的トップの復職・単発説明から、案件全体のPackと不足する1回のSPOTへ直接進める分岐を作る。

## Audience and action

- Audience: 復職案件を外部へ依頼したい企業の人事・労務担当者
- Main question or job: 案件全体を任せるか、不足する面談・意見・再評価だけを補うか判断する
- Desired next action: 適合するPackまたはSPOT申込面を確認する
- Non-goals: 既存産業医を否定する、診断・治療を勧誘する、未確認の料金・成果・スピードを訴求する

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 両申込面は公開中だが、静的トップとWordPress商用ページから直接リンクされていない。Pack実機受入・履行可能性は別ゲートが残る。
- Approved terminology: 復職支援Pack、SPOT、不足する面談・意見・再評価、会社決定
- Constraints and boundaries: 商品・料金・期間は正本を変更せず、Pack受入前に新しい目立つリンクを公開しない。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/consult-search-discovery-audit-2026-09-01.md | 2026-09-01 | 公開内部リンク0、修正順 | Pack実機受入、owner approval |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/pricing-growth-canonical.md | 2026-09-01 | 商品・料金・契約境界 | 現在の検索順位、受入完了 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/bpo-scope-boundary.md | 2026-09-01 | 会社決定、医療・受託範囲の境界 | SEO成果 |
| https://consult.kdkconslt-sngyouijm.com/return-to-work-pack/ / https://consult.kdkconslt-sngyouijm.com/return-to-work-spot/ | 2026-09-01 | 現行の公開申込面と用語 | 実機受入、契約実績 |
| /Users/dmmac/casetra_active/docs/operations/CASETRA_PRETEST_LAUNCH_STATUS_2026-08-25.md | 2026-09-01 | Casetraの最新記録済み一般ローンチNO-GO、テスト企業最終受入待ち | 2026-09-01時点の新しいPASS証拠 |
| /Users/dmmac/casetra_active/docs/operations/CASETRA_TEST_COMPANY_AUDIT_SHEET_JA.md | 2026-09-01 | P-01/P-02の受入欄が空欄 | Pack受入PASS |

### Unresolved points

- Pack実機受入・履行可能性の証拠が未確認。
- 公開候補の独立Tier Sレビューとexact化、静的トップの実装hash bindingが未完了。

## Outline

1. 既存サービス概要リンクを残す
2. 案件全体のPackと不足する1回のSPOTを2択で示す
3. 会社決定・診断治療・受診先の境界を維持する
4. 非PIIの内部遷移を計測する

## Draft requirements

- Voice: 短く、選択条件を先に示す企業向けサービス導線
- Required points: 案件全体、1回単位、既存産業医体制の維持、Pack受入ゲート、非PII計測
- Forbidden claims or wording: 普通の産業医はできない、必ず、最短、無料、診断、治療、復職成功、ワンストップ、一気通貫
- Channel limits: 静的トップ。PC・スマホで2リンクが区別でき、CTA過多にならないこと。
- CTA or next action: 適合する申込面を確認する

## Review plan

- Source and fact reviewer: pricing-growth-canonical、Pack/SPOT公開面、受入証拠
- Safety or compliance reviewer: 医療広告、雇用判断、既存産業医を下げない表現、個人情報計測
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | Packリンク | 最新の一般ローンチ判定はNO-GOで、P-01/P-02のテスト企業受入欄が空欄 | `CASETRA_PRETEST_LAUNCH_STATUS_2026-08-25.md`、`CASETRA_TEST_COMPANY_AUDIT_SHEET_JA.md` | P-01/P-02 PASSまでPackを新しい目立つ導線で公開しない | pending; do not publish |
| High | 内部UTM | 同一サイト内UTMはOrganic Search等の流入元を上書きし、SEO→契約の帰属を壊す | measurement spec | clean URLと非PII `service_contact_click` に変更 | repaired in candidate |
| High | 会社決定境界 | 「会社決定まで進める」はKIDUKIが会社決定を代行するように読める | bpo-scope-boundary、Pack仕様 | 「会社が決定する工程」に修正 | repaired in candidate |
| Medium | SPOTラベル | 「意見」だけでは産業医意見と会社決定の区別が弱い | product正本 | 「産業医意見」に修正 | repaired in candidate |
| Medium | GA4 | 申込面への内部遷移と問い合わせ完了を同じ成果にすると契約導線を誤認する | measurement spec | `service_contact_click` とCasetra Leadsのvalid inquiryを分離 | repaired in candidate |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/consult-home-pack-spot-links.md`
- Automated checks: content task validator、公開URL/read-only source照合、`npm run verify:consult-home-service-paths`、`git diff --check`
- Human approval:
- Schedule record: 公開後7日・28日・90日
- Published verification: なし。`consult/index.html` 未変更、static push未実施
- Measurement source and period: 公開後にGA4内部クリック、Casetra Leads、商談、契約を別々に記録
- Remaining gates: Pack受入、Tier S再レビュー、exact owner/physician approval、static production権限

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | 公開内部リンク0件を監査で確認 |
| 2026-09-01 | backlog | review | 2択文言、医療・会社決定境界、計測境界、Pack受入ゲートを候補化。未反映 |
| 2026-09-01 | review | review | Tier Sレビューで内部UTM、会社決定境界、産業医意見ラベルを修正。Pack P-01/P-02はNOT TESTEDのため公開停止を維持 |
