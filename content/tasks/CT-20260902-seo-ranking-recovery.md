---
task_id: CT-20260902-seo-ranking-recovery
title: KIDUKI 検索順位回復計画（構造・title/meta・内部リンク・旧記事・E-E-A-T）
project: kdk-wordpress
channel: internal
domain: employment
risk_tier: S
status: published
owner_decision: approved
created: 2026-09-02
last_verified: 2026-09-02
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-ranking-recovery-plan-2026-09-02.md
approval_owner: 宮部 大輔
approval_evidence: content/evidence/seo-recovery-approval-2026-09-02.json
physician_approval: 宮部 大輔（代表医師本人の承認、同上）
publication_url: https://kdkconslt-sngyouijm.com/service/return-to-work-support/ ほか（S1子テーマ、S3、S4、S6はWordPress反映済み。S2/S5は main push後に確定）
published_verified_at:
---

# Content Task

## Goal

- KIDUKIサイトが非指名の商用検索（`スポット産業医`、`産業医 スポット`、復職・就業制限の工程語）で3ページ目に留まっている原因を証拠で分解し、文言の確定稿を変えない技術修正をローカルで実装・検証し、文言や公開状態を変える修正は exact 候補として承認シートにまとめる。

## Audience and action

- Audience: 宮部 大輔（承認者・代表医師）、KIDUKIサイト運用者
- Main question or job: どこを直せば検索で選ばれる位置に近づくか。何を承認すれば何が本番へ出るか
- Desired next action: 承認シート S1〜S6 の各行を承認・修正・保留し、承認した行だけ dry-run→backup→apply で反映する。Search Console ドメインプロパティと Google ビジネスプロフィールを先生の操作で登録する
- Non-goals: 順位・クリック・問い合わせの保証、料金や商品の変更、復職支援Packの公開導線化、クリニックサイトとの相互リンク、承認なしの本番反映

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 月額なしの入口は復職・両立支援単発。PackはP-01/P-02未実施のため公開導線に数えない。継続はBasic/Retain、自社運用はCASETRA（`kiduki/docs/pricing-growth-canonical.md`）
- Approved terminology: 1件の完了、会社決定、再評価日、解除条件、証跡、初回のご相談（15分）、内科専門医・心療内科専門医・労働衛生コンサルタント
- Constraints and boundaries: 文言の確定稿は `kiduki/docs/copy/site-copy.md`（Codexは改変せず提案として報告）。医療広告規律（特定医療機関の非指定・非紹介、受診先は本人が選ぶ）。禁止語（無料、併設、クリニック、一気通貫、睡眠専門医、効果の断定）。WordPress書き込みは dry-run→backup→apply、`main` push は明示依頼時のみ

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/search-console-dual-property-snapshot-2026-09-01.json | 2026-09-02 | 両URL-prefixの28日実測（241表示・11クリック・21.1位／16表示・1クリック）、スポット2語の順位26位台と旧URL表示 | 2026-09以降の変化、consult側クエリの内訳 |
| https://kdkconslt-sngyouijm.com/wp-json/wp/v2/posts?per_page=100 と各公開HTML | 2026-09-02 | 公開37記事のID・slug・公開日・文字数・カテゴリ、タイトル区切り、meta descriptionの署名行混入、Article構造化データの内容 | 非公開・予約記事、Search Console成果 |
| https://kdkconslt-sngyouijm.com/service/return-to-work-support/ ほかサービス・事務所ページ公開HTML | 2026-09-02 | 商用ページの本文量（461〜1,088字）と内部リンク数（1〜6本）、canonical、H1、構造化データの不在 | 順位、CTR |
| https://kdkconslt-sngyouijm.com/office/office-info/ ・ /office/greeting/ | 2026-09-02 | 構造化データに使った住所・設立・資格・学歴・所属学会の公開値 | 未公開の経歴 |
| https://wp-emanon.jp/emanon-premium/do-action/ | 2026-09-02 | Emanon公式フック `emanon_custom_description` の存在と使い方 | Article構造化データの日付形式を直すフック（未確認） |
| https://casetra.jp/ | 2026-09-02 | 被リンク1本（フッター→静的トップ） | 他サイトからの被リンク数（ツール未使用） |
| https://meden.co.jp/spot-interview/ ・ https://medwork-sangyoui.jp/service/spot/ ・ https://sangyoui.m3career.com/service/spot/ | 2026-09-02 | 競合スポットページの構成（料金・FAQ・場面・流れ）と文字量の目安 | 各社の順位、KIDUKIへの移植可否 |
| https://laws.e-gov.go.jp/law/347AC0000000057 ・ https://laws.e-gov.go.jp/law/347CO0000000318 | 2026-09-02 | 産業医の選任義務（安衛法13条、施行令5条: 常時50人以上）、就業上の措置の決定は事業者（66条の5） | 個別事業場の該当判断 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/pricing-growth-canonical.md ・ bpo-scope-boundary.md ・ copy/site-copy.md | 2026-09-02 | v3本文の商品境界、会社決定・医療の境界、確定文言と禁止語 | 料金の公開可否（金額は載せない方針を維持） |

### Unresolved points

- `site:` でのインデックス数は今回のツールで取得できず、Search Console で確認する。
- 被リンクは専用ツールを使っておらず、casetra.jp 以外は未確認。
- Emanon が出す Article 構造化データの `datePublished` が `2026-9-1` 形式（ISO 8601 ではない）。子テーマから直すフックは未確認で、テーマ設定または作者への確認が必要。
- 旧記事19本の Search Console query×page は未取得。決定前に noindex・301 を実行しない。
- ホスト分割（トップが `consult.` サブドメイン）の解消は設計メモのみで未実装。WordPress側のリダイレクト設定がリポジトリ外にある。
- `document_title_separator` の差し替えは、Emanon が WordPress 標準 title-tag を使っている前提（公開HTMLの `<title>` 出力位置から推定）。反映後に実HTMLで確認する。

## Outline

1. 結論（方向は正しい、土台と量が不足）
2. 検索で起きていることの証拠表
3. ローカルで直した技術変更 T1〜T6 と検証ハッシュ
4. 承認シート S1〜S6 と反映コマンド
5. 4本柱（商用ページ厚み、内部リンク、旧記事整理、外部評価）と90日の順番
6. トップページ文言提案、旧記事整理表、ホスト分割の判断メモ、測り方、次にやること

## Draft requirements

- Voice: 中学生でも分かる言葉。結論を先に。専門用語には短い説明を添える
- Required points: 証拠と提案の分離、承認対象のハッシュ、反映コマンド、順位非保証、医療広告境界の維持
- Forbidden claims or wording: 順位・効果の保証、料金の金額、無料、Packの公開導線化、クリニックへの誘引、他社の非公開情報の断定
- Channel limits: 内部文書。公開サイト本文はこの文書から直接コピーしない（exact候補ファイルを正とする）
- CTA or next action: 承認シートの承認文字列を返す → 承認行だけ dry-run→backup→apply

## Review plan

- Source and fact reviewer: 公開HTML・REST・一次法令との再照合（本チケット内で実施）
- Safety or compliance reviewer: 医療広告境界・禁止語・商品境界の確認（v3本文の自動チェック＋目視）
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | functions.php `kiduki_seo_document_title` | `trim()` はバイト単位のため全角「｜」を文字リストに入れると隣接文字を壊す恐れ | PHP `trim` 仕様 | `preg_replace('/^｜+|｜+$/u')` に変更 | accepted / repaired |
| High | functions.php `kiduki_seo_clean_description` | CSS除去の正規表現 `[^{}]*\{` が本文の日本語まで巻き込む恐れ | 正規表現の左側が無制限 | セレクタ部分をASCIIのセレクタ文字に限定 | accepted / repaired |
| Medium | v3本文 FAQ「受診先の紹介」 | 必須境界文と同じ文を二重に置くと読みにくい | site-copy 医療広告規律 | カード側に必須文、FAQ側は同義の別表現＋主治医連携は本人同意 | accepted / repaired |
| Medium | v3本文 関連記事 | 予約中記事へのリンクは公開前に置かない | seo-contract-funnel 内部リンク規律 | 公開済み4本のみ。9/18・10/2公開後に7日レビューで追加 | accepted / repaired |
| Medium | 記事ハブ v1 | `latest-posts` ブロックの見た目は本番テーマでしか確認できない | ローカルにEmanon無し | apply後にPC/スマホ目視、崩れたらカテゴリ一覧リンクへ戻す条件を明記 | accepted / documented |
| Low | 静的トップ JSON-LD | `sameAs` に自サイトURLを入れるのは意味が薄い | schema.org 定義 | 外部プロフィールが確定するまで `sameAs` を置かない | accepted / repaired |
| Info | 外部施策 | クリニックサイトとの相互リンクは医療広告規律に抵触 | site-copy 医療広告規律 | 施策から除外し「やらないこと」に明記 | accepted |

## Completion evidence

- `npm run verify:seo-hardening` 合格（2026-09-02）
- `npm run verify:internal-link-candidates` 合格（2026-09-02）
- `npm run verify:spot-page-v3-binding` 合格・`masterFirstReady: true`（2026-09-02）
- `npm run verify:static` 合格（ローカル。live一致は未反映のため不一致で正常）
- `npm run verify:conversion-tracking` 合格
- `php -l`（Docker php:8.3-cli）で functions.php 構文OK
- exact: `content/exact/spot-industrial-physician-page-2026-09-02-v3.json` SHA-256 `82c8b53101a967b951a658e0960718c09d270d7a275a1af94e1551c47631adf4`
- exact: `content/exact/internal-link-pages-2026-09-02-v1.json` SHA-256 `e6097acd916667a88005bb13b05e79b979d9e36332320a48b5ae4f3b17b95996`
- 本番反映・公開・インデックス・順位・問い合わせの証拠は無し（未実施）

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-02 07:30 JST | — | backlog | Ticket created (`new_content_task.py`) |
| 2026-09-02 07:35 JST | backlog | researching | 公開HTML・REST・Search Console既存証拠・競合ページ・Emanonフックの読取 |
| 2026-09-02 07:55 JST | researching | drafting | 子テーマ・静的トップの技術修正、スポットv3本文、内部リンク候補、計画書の作成 |
| 2026-09-02 08:20 JST | drafting | review | 正規表現の安全性2件、FAQ重複、予約記事リンク、latest-posts表示、sameAs、クリニック相互リンク除外を修正・記録 |
| 2026-09-02 08:40 JST | review | owner-review | `verify:seo-hardening` / `verify:internal-link-candidates` / `verify:spot-page-v3-binding` / `verify:static` / `verify:conversion-tracking` / `verify`（live）合格、`php -l` OK。宮部大輔の承認待ち。本番反映なし |
| 2026-09-02 09:03 JST | owner-review | approved | 宮部大輔「全て承認します」（新橋は外す）。証拠 `evidence/seo-recovery-approval-2026-09-02.json`。本番反映はこの後に別手順で実施 |
| 2026-09-02 09:09 JST | approved | published (WordPress側) | S1 子テーマ4ファイル反映（backup `wp-kiduki-child-before-2026-09-02T00-05-52-152Z.json`）、S3 page 164 v3反映＋meta（`wp-seo-release-2026-09-02T00-05-55-341Z`、`wp-seo-meta-before-2026-09-02T00-07-30-640Z.json`）、S4 page 1030/160/162/166反映（各 `wp-page-*-before-2026-09-02T00-05-59〜06-05Z.json`）、S6 noindex 19本・301 3本が公開HTMLで確認済み。`npm run verify`・`verify:spot-page-v3-live` 合格。S2/S5 静的トップは commit/push 前 |
| 2026-09-02 09:26 JST | published (WordPress側) | published (WordPress側) / S2・S5 push待ち | 静的トップの title・meta・H1・実務記事・sitemap lastmod をローカル反映し `verify:static` 合格、PC幅と狭幅の描画を確認。git add/commit/push は権限で停止し、commit文 `exact/commit-message-2026-09-02.txt` を用意 |
