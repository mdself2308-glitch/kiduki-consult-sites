---
task_id: CT-20260901-existing-industrial-physician-specialist-support
title: 既存産業医を替えずに睡眠・復職支援を追加する方法
project: kdk-wordpress
channel: web-article
domain: medical
risk_tier: S
status: owner-review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/existing-industrial-physician-specialist-support.html
exact_version: 2026-09-01-v1
exact_version_sha256: c524ae175125c8be963b2ed3fc1cdc2b8ffb6e8e1213db0f1bcae4e023234fc4
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- 既存の選任産業医を下げたり交代を前提にしたりせず、睡眠・勤務リスク・休復職の専門支援を追加する役割分担を説明し、KIDUKI Basicの適合確認へつなぐ。

## Audience and action

- Audience: 選任産業医または既存の産業保健体制はあるが、睡眠・夜勤・運転・SAS・休復職の反復相談に不足を感じる人事・労務・産業保健担当者
- Main question or job: 既存産業医を替えず、特定領域の外部支援だけをどう追加すれば役割が重ならないか
- Desired next action: 継続的な専門補完は `/service/komon/`、目前の復職・再評価1件は `/service/return-to-work-support/` で適合範囲を確認する
- Non-goals: 既存産業医の能力比較、選任義務の代替、一般SPOTの復活、個人への診断・治療、特定医療機関への誘導、効果保証

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 既存体制を維持した継続的な専門補完はKIDUKI Basic。復職・再評価等の目的を1件に固定できる場合は復職・両立支援単発。選任・法定・定例業務まで委託する場合はKIDUKI Retain。PackはP-01/P-02未実施のため公開CTAへ含めない。
- Approved terminology: 既存産業医、専門補完、就業上の意見、会社決定、再評価、睡眠に特化した産業医支援
- Constraints and boundaries: 診断・治療は医療機関、受診先は本人が選択、特定医療機関を指定・紹介しない。就業上の最終決定と実施は会社。健康情報は目的・取扱者・権限・範囲を定め必要最小限にする。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| https://anzeninfo.mhlw.go.jp/yougo/yougo04_1.html | 2026-09-01 | 事業場内スタッフと事業場外資源を含む4つのケア、個人情報への配慮 | KIDUKI Basicの商品適合、既存産業医との個別契約分担 |
| https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000055195_00005.html | 2026-09-01 | 休業開始から復職後フォローまでの段階、事業場の体制整備 | 睡眠領域の外部支援、KIDUKIの契約・成果 |
| https://jsite.mhlw.go.jp/okayama-roudoukyoku/newpage_00155.html | 2026-09-01 | 健康情報の目的、取扱者、権限、範囲、規程化 | 特定システムの適法性、KIDUKIの安全管理実装 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/source/wordpress/page-162-komon.html | 2026-09-01 | 現行Basic公開文面、既存体制を維持する専門補完、単発・Retainとの分岐 | 検索需要、契約実績、owner approval |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/pricing-growth-canonical.md | 2026-09-01 | Basic・Retain・単発・CASETRAの商品境界 | 医療・法令事実、検索成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/bpo-scope-boundary.md | 2026-09-01 | 医師、会社、医療の責任分界 | 個別契約の法的結論、検索需要 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/copy/site-copy.md | 2026-09-01 | 医療広告境界、肩書き、禁止語、受診先本人選択 | Basicの検索成果、契約実績 |

### Unresolved points

- `既存産業医 睡眠`、`既存産業医 復職 対応できない` は戦略上の検索仮説であり、対象URLのSearch Console実測は未取得。
- 既存産業医と外部支援の契約・責任分担は事業場ごとに異なるため、一般的な適法性を断定しない。
- post ID、公開日、内部リンク元、7/28/90日レビュー日は未決定。

## Outline

1. 既存体制を維持した外部支援は、担当範囲の文書化から始める
2. 対象、入口、意見共有、会社決定、再評価の5点を決める
3. 健康情報の共有範囲と意見相違時の整理方法を示す
4. 単発、Basic、Retainを状況で分ける
5. 復職後フォローと医療広告境界を明示し、Basicを主CTAにする

## Draft requirements

- Voice: 産業医としての実務的な説明。既存産業医への敬意を保ち、結論先行で役割と手順を具体化する。
- Required points: 外部支援の目的、既存産業医を置き換えないこと、共有範囲、会社決定、再評価、単発/Basic/Retainの分岐、受診先本人選択
- Forbidden claims or wording: 「普通の産業医はできない」「睡眠専門医」「セカンドオピニオンなら安全」「必ず」「絶対」「治る」「当院では」「クリニックと連携」
- Channel limits: WordPress記事。1記事1検索意図。本文にH1を置かない。Packを公開CTAへ含めない。価格は主質問でないため掲載しない。
- CTA or next action: Basicを主着地、復職・両立支援単発を副着地にする。

## Review plan

- Source and fact reviewer: 厚生労働省3資料、現行商品正本、page 162との整合
- Safety or compliance reviewer: 医療広告、健康情報、雇用判断、既存産業医との責任分担
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | 記事全体 | 外部支援を追加できることを一般的な法的結論として断定すると、選任状況・契約差を無視する | Tier S法務・雇用境界 / bpo-scope-boundary | 「追加する場合」の実務設計として書き、個別契約・事業場条件の確認を明記 | accepted / repaired in draft |
| High | 商品分岐 | 未受入Packを継続支援の選択肢へ含めると現行商品ゲートに反する | Pack P-01/P-02 NOT TESTED | 公開本文とCTAからPackを除外し、単発/Basic/Retainだけにする | accepted / repaired in draft |
| Medium | 健康情報 | 医師間・人事への情報共有範囲が抽象的だと詳細情報の過剰共有を招く | 岡山労働局手引き / site-copy | 目的、共有先、保管・閲覧権限を開始前確認へ追加 | accepted / repaired in draft |
| Medium | 医療広告 | 受診勧奨を記す場合に本人選択・特定医療機関非指定/非紹介が必要 | site-copy | 独立見出しでexact文言を追加 | accepted / repaired in draft |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/articles/existing-industrial-physician-specialist-support.html`
- Automated checks: `npm run verify:existing-physician-specialist-exact`、`npm run verify:existing-physician-specialist-create`、`npm run verify:future-article-review-plan` 合格。本文hash `46f87f401fc660a14c7da8e51c195a351495c74eb838db4ae8c7884d79eaacd5`、4正本hash、title/meta、主・副CTA、必須境界、禁止語、exactと作成config・承認ticket・公開時刻待ち計画の拘束を照合。WordPress live read-only dry-runはslug一致0件、`status: draft`、category 45/47、`persistentWrites: false`
- Human approval: 未取得
- Schedule record: `content/future-article-review-plan.json` に週次キュー、公開後月次導線レビュー、7/28/90日offsetを登録。post ID・公開時刻・calendar event IDは実公開readback前なので未設定
- Published verification: 未公開
- Measurement source and period: 公開後にWordPress URL-prefix Search Console、GA4、第一者問い合わせ、商談、契約を別測定
- Remaining gates: 宮部大輔によるexact v1のowner/physician approval記録、別のWordPress下書き作成権限、backup付きcreate、API readback、公開前のmeta・画像・内部リンク・PC/スマホ確認、別の公開権限、実公開時刻を起点にした7/28/90日calendar登録、公開後ライブ・計測確認

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | Ticket created |
| 2026-09-01 | backlog | review | 共通content-productionマニュアル、KIDUKI商品正本、厚生労働省一次資料に基づき初稿を作成。Packを除外し、Basicを主導線に固定 |
| 2026-09-01 20:56 JST | review | owner-review | 事実、商品境界、健康情報、医療広告、雇用判断、検索意図を役割分離して再確認。本文・title・meta・CTAと4正本をexact v1へ固定し、verifier合格。未承認・未公開 |
| 2026-09-01 20:56 JST | owner-review | owner-review | 対象一次資料がメンタルヘルス対策の事業場外資源を支持する範囲に限定し、既存産業医の責任移転をKIDUKIの商品境界として表現。医師間共有に本人説明・必要な同意を補い、exact v1を再固定 |
| 2026-09-01 | owner-review | owner-review | exact v1・本文・承認ticketに拘束した下書き作成configを検証。WordPress live read-only dry-runでslug一致0件、draft、category 45/47、書込み0を確認。ticketがapprovedでないapplyはWordPress接続前に拒否する。公開時刻待ちの7/28/90日計画へ登録 |
