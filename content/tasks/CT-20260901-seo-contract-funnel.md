---
task_id: CT-20260901-seo-contract-funnel
title: KIDUKI SEOから契約までの導線設計
project: kdk-wordpress
channel: internal
domain: employment
risk_tier: S
status: review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-contract-funnel.md
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
---

# Content Task

## Goal

- Search Console上の表示やクリックを、課題別サービス、問い合わせ、商談、契約、継続契約まで追えるKIDUKIのSEO運用方針を定める。

## Audience and action

- Audience: KIDUKIの経営者、コンテンツ制作者、SEO・WordPress運用者
- Main question or job: どの検索語を、どのページと商品で受け、どの順番で契約まで進めるか決める
- Desired next action: 記事別CTA修正と契約直前クラスターの制作を、個別チケットで開始する
- Non-goals: 検索ボリュームや順位を未取得のまま断定すること、医療成果をSEO成果として扱うこと、未実装商品を売ること

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 現在の月額なし入口は復職・両立支援単発。復職支援Packは正本に存在するがP-01/P-02未実施のため、受入PASSまで公開CTA・比較記事・静的分岐・初回商品から除外する。継続はBasic/Retain、自社運用はCASETRA。一般SPOTを復活させない。
- Approved terminology: 1件の完了、会社決定、再評価日、解除条件、証跡、初回のご相談
- Constraints and boundaries: 商品・料金は pricing-growth-canonical、公開文言と禁止語は site-copy、決定と医療の境界は bpo-scope-boundary を正とする。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/core-thesis.md | 2026-09-01 | 新記事の3問、1件完了と証跡の事業原理 | 検索需要・順位 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/pricing-growth-canonical.md | 2026-09-01 | 商品、料金、契約境界、拡張先 | 現在の検索クエリ |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/copy/site-copy.md | 2026-09-01 | 確定文言、肩書き、禁止語、医療広告境界 | 商談・契約実績 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/article-plan.json | 2026-09-01 | 現行12記事、公開日時、記事別導線 | 検索・契約成果 |
| https://kdkconslt-sngyouijm.com/wp-json/wp/v2/posts?slug=night-shift-sleep-management | 2026-09-01 | 1本目の公開状態 | インデックス、順位、クリック |
| Site Kit dashboard / Search Console URL-prefix `https://kdkconslt-sngyouijm.com/` | 2026-09-01 | 18:09 JST時点の過去28日間246表示、10クリック、9検索訪問、主要イベント0、上位クエリCTR | `consult`サブドメイン、商談・契約実績 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/measurement-live-audit-2026-09-01.json | 2026-09-01 | consult専用Search Console実測、GA4 generate_lead受信・キー指定・導線ディメンション、Flamingo期間別件数、匿名公開タグ | 個別問い合わせ内容との一致、発火源、商談、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/search-console-dual-property-snapshot-2026-09-01.json | 2026-09-01 | 認証済みSearch Consoleの両URL-prefix・28日選択、実日付範囲、query×page、consultページ別値 | 問い合わせ、商談、契約、自動取得経路 |
| WordPress public posts API | 2026-09-01 | 公開37記事のtitle、slug、excerpt、公開日と、復職面談post 1809の現行本文 | 非公開/予約記事、Search Console成果、契約寄与 |

### Unresolved points

- Search ConsoleにはWordPress用・consult用の2つのURL-prefixが存在し、ドメインプロパティは確認できなかった。両URL-prefixを同じ選択期間・別表で比較する。
- 28日選択の認証済み読取は確認できたが、WordPress側は実データ2026-08-02〜29、consult側は2026-08-13〜29で開始日が異なる。期間差を残し、合算しない。
- GA4は `generate_lead` 5回・2ユーザーを受信しキーイベント指定済みだが、FlamingoはGA4期間内0件だった。consultのPack/単発フォームもCasetra Leads保存成功後に同イベントを送るため、両第一者システムを先に期間別集計する。従って実問い合わせ5件とはみなさない。
- `スポット産業医` は2026-08-05〜2026-08-31に53表示・1クリック・CTR 1.9%・平均掲載順位26.2、`産業医 スポット` は94表示・0クリック・平均掲載順位26.9で、表示ページはいずれも旧URL `/service/spot/` だった。新URLへの改稿後に再クロールとquery×page移行を確認する。
- 問い合わせから契約までを結ぶ同一リードIDまたは台帳は未確認。
- 2025年の個人向け・広範な健康記事を含む公開37記事は、query×pageと被リンクを取得するまで一括削除・noindexせず、個別の改稿・統合・維持判断が必要。

## Outline

1. 事業上の最初の売り物を「1件の完了」に固定する
2. 検索語群を現在受入可能な単発、Basic、Retain、CASETRAへ分け、Packを受入PASSまで隔離する
3. 記事ごとの主サービスとCTAを1つに絞る
4. 問い合わせ、商談、契約、拡張の測定境界を定める
5. 直近の制作順と承認ゲートを定める

## Draft requirements

- Voice: 経営判断に使える簡潔な内部方針。事実、戦略仮説、未検証を分ける。
- Required points: 1件完了、商品別の入口、検索語群、着地ページ、CTA、契約後拡張、KPI、Tier S承認ゲート
- Forbidden claims or wording: 順位保証、効果保証、検索需要の未確認断定、一般SPOTの復活、未実装CASETRA機能
- Channel limits: 内部用。公開サイト本文ではなく、各公開成果物のブリーフとして使う。
- CTA or next action: 予約中11記事のCTA修正版を個別チケットで作成し、exact versionの承認へ回す。

## Review plan

- Source and fact reviewer: 商品・料金正本と現行WordPress状態の再照合
- Safety or compliance reviewer: 医療・雇用・医療広告境界の確認
- Editorial reviewer: 宮部 大輔
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | 現在の入口商品 | strategy初稿はPackを現在の初回商品・比較導線・拡張KPIへ含めたが、P-01/P-02は未実施 | CASETRA test-company audit / owner-review v6 | 単発を現在の入口に固定し、Packを受入PASSまで全公開導線から除外 | accepted / repaired locally |
| High | スポット産業医SERP | 旧URLの古い逆向きスニペットと静的トップが検索結果に残り、新URLの現行商品説明が主表示になっていない | `content/evidence/spot-serp-audit-2026-09-01.md` | exact v2反映後に旧・新URL検査と再クロール要求、query×page移行を追う | accepted / read access confirmed then session expired / exact approval and publication pending |
| Medium | consult内部リンク | 初回監査は静的トップから新WordPress商用ページへの直接リンクなしとしたが、公開readbackではリンク済みだった | live consult HTML line 1597 | 証拠を訂正し、Pack/SPOT申込面へのリンク不在と商用ページへのリンク済みを分ける | accepted / repaired |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/seo-contract-funnel.md`
- Automated checks: content task validator（draft、warnings 0）、`npm run verify:seo-content-map`（12記事のslug・title・検索意図、CTA v6状態、復職クラスター4記事、新規候補、サービスページのlanding、Pack公開停止の整合）、`npm run verify:search-console-snapshot`
- Human approval:
- Schedule record:
- Published verification:
- Measurement source and period: 認証済みSearch Console、両URL-prefix、28日選択。WordPress実データ2026-08-02〜29、consult実データ2026-08-13〜29。別表・非合算
- Remaining gates: A〜C・F・Gのexact approval、対象別production権限、対象権限のあるSearch Consoleへの再ログイン、新28日選択と同期間の端末別、exact反映後の旧・新URL検査・再クロール、公開後7/28/90日測定、Pack P-01/P-02 PASS

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | Ticket created |
| 2026-09-01 | backlog | review | 初版の導線設計を作成し、商品・料金正本とWordPress公開/予約状態を照合 |
| 2026-09-01 | review | review | 18:09 JSTのSite Kit実測へ更新し、契約に近い案件語、工程語、専門性語、広すぎる保留語の優先順を明文化 |
| 2026-09-01 | review | review | 公開37記事をAPI監査。復職クラスターでサービス、手続き、睡眠評価、単発vsPack、制限解除の検索意図を分離し、新規比較記事から既存手続き記事への内部リンクを追加。旧個人向け・広範記事はGSC取得前に一括削除しない整理レーンへ分離 |
| 2026-09-01 | review | review | 現行SERP・公開HTTP・consult HTMLを再監査。旧URLの逆向きスニペットを発見し、PackをP-01/P-02 PASSまで現行導線から除外。静的トップ→新WordPress商用ページの公開リンクは存在すると証拠訂正。再クロールはGoogleパスキー待ち |
| 2026-09-01 | review | review | 認証済みSearch Consoleで両URL-prefixを28日選択へそろえて再取得。WordPressは11クリック・241表示、consultは1クリック・16表示。実データ開始日が異なるため別表・非合算とし、再クロールは認証待ちではなくexact反映待ちへ更新 |
