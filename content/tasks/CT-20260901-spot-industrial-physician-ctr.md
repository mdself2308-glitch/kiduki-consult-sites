---
task_id: CT-20260901-spot-industrial-physician-ctr
title: スポット産業医サービスページCTR改善
project: kdk-wordpress
channel: website
domain: medical
risk_tier: S
status: owner-review
owner_decision: pending
created: 2026-09-01
last_verified: 2026-09-01
draft_reference: /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/spot-industrial-physician-ctr.md
approval_owner: 宮部 大輔
approval_evidence:
physician_approval:
publication_url:
published_verified_at:
exact_version: 2026-09-01-v2
exact_version_sha256: a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9
---

# Content Task

## Goal

- `スポット産業医` の検索結果で、法人向け・1件から・対応範囲を明確にし、検索意図とサービスページの一致を改善する。

## Audience and action

- Audience: 月額契約のない企業で、目前の復職案件、復職後の再評価、就業制限の変更・解除を相談したい人事・労務担当者
- Main question or job: 単発で何を依頼でき、診療や選任産業医業務との境界がどこにあるかを知る
- Desired next action: サービス範囲を確認し、初回の相談へ進む
- Non-goals: 一般的な何でも対応のSPOT商品を復活させること、個人の診療相談を集めること、CTRだけで契約成果を断定すること

## Project truth

- Canonical project guide: ../README.md
- Current product or service state: 一般SPOTと月額0円Casetra SPOTは廃止。現在の非契約企業向け入口は、範囲固定の復職・両立支援単発。復職支援Packは正本に存在するがP-01/P-02未実施のため、受入PASSまで本成果物の公開CTA・契約導線から除外する。非復職の単発研修・レビューはサイト上で相談可能だが、正式SKU・料金・履行条件は未確定。
- Approved terminology: スポット産業医、単発相談、法人1件から、復職判定面談、再評価、就業制限の変更・解除に必要な評価・意見、初回のご相談（15分）
- Constraints and boundaries: 診断・治療は行わない。特定医療機関への誘導をしない。選任が必要な事業場の継続業務を単発相談で代替しない。費用・効果を誇張しない。

## Source pack

| Source | Verified date | Supports | Does not support |
|---|---|---|---|
| Search Console URL-prefix `https://kdkconslt-sngyouijm.com/` | 2026-09-01 | 2026-08-05〜2026-08-31の `スポット産業医` は53表示・1クリック・CTR 1.9%・平均順位26.2、`産業医 スポット` は94表示・0クリック・CTR 0%・平均順位26.9。表示ページはいずれも旧URL `/service/spot/` | 個別契約寄与、公開後の改善 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/search-console-dual-property-snapshot-2026-09-01.json | 2026-09-01 | 28日選択・実データ2026-08-02〜29の `スポット産業医` 56表示・1クリック・CTR 1.8%・平均順位26.0、`産業医 スポット` 91表示・0クリック・CTR 0%・平均順位27.2。両方とも旧URL | exact公開後の改善、問い合わせ、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/spot-wordpress-dry-run-2026-09-01.json | 2026-09-01 | 21:45 JSTのlive WordPress baseline、modified・slug・status・本文SHA lock一致、候補差分、書込みなし | owner approval、apply、公開、検索成果 |
| Search Console URL inspection / public headers | 2026-09-01 | 旧URLは新URLへ301。旧検査は2026-07-26の自己canonical、新URLは2026-08-18クロール・インデックス登録済み・新URL canonical | 次回クロール日時、query×page移行完了時期 |
| 求人ジャーナル、エムスリーキャリア、アセッサ、ミーデンの現行公開サービスページ | 2026-09-01 | 検索結果集合で `スポット産業医`、必要時、1件/1回、月額契約なし、復職面談が使われること | KIDUKIの順位、検索ボリューム、各社と同じ料金・速度・提供範囲 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/pricing-growth-canonical.md | 2026-09-01 | 一般SPOT廃止、範囲固定の単発、Pack、Basic/Retain/CASETRA境界 | 検索需要、CTR改善 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/docs/copy/site-copy.md | 2026-09-01 | 確定用語、医療広告規律、CTA統一表記 | 本exact案の承認 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/source/wordpress/page-164-return-to-work-support.html | 2026-09-01 | 現行本文、対応範囲、役割分担、CTA | 公開HTMLとSearch Consoleの成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/config/seo-indexing-recovery-2026-08-31.json | 2026-09-01 | 現行title、excerpt、meta description | 今後の順位、CTR、契約 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/kiduki/config/seo-spot-ctr-2026-09-01-v2.json | 2026-09-01 | exact payload、現行本文、候補本文、WordPress post ID・modifiedのapply binding | owner/physician approval、公開、検索成果 |
| /Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/evidence/spot-serp-audit-2026-09-01.md | 2026-09-01 | 現行SERPの購入判断語、旧URLの古い逆向きスニペット、301、新URLcanonical、静的トップから新URLへの公開リンク | 再クロール完了、順位・CTR改善、契約成果 |
| /Users/dmmac/casetra_active/docs/operations/CASETRA_TEST_COMPANY_AUDIT_SHEET_JA.md | 2026-09-01 | Pack P-01/P-02欄が未実施 | 将来のPASS、Pack販売可能性 |

### Unresolved points

- CTRの低さの一部は平均掲載順位26台と説明できるが、タイトル・snippet変更の独立効果は未確定。
- 旧URLのquery×page表示が新URLへ移る時期は未確定。301と新URL canonicalは維持する。
- 先行期間2026-08-05〜31の端末別は取得済みだが、新しい28日選択2026-08-02〜29と同期間の端末別は未取得。期間を混ぜず、次回補完する。
- exact案は宮部大輔による事実・医師・編集承認が未完了。

## Outline

1. 企業向け・1件から・代表的な対応範囲をtitle/metaで明示する
2. 商品境界を変えず、受診勧奨の必須境界文1段落だけを本文へ追加する
3. master-firstで承認済み文言を反映する
4. 7日・28日・90日で検索、問い合わせ、商談、契約を分けて判定する

## Draft requirements

- Voice: 企業担当者へ、依頼できる範囲とできない範囲を短く具体的に伝える
- Required points: 法人向け、1件から、目的と対象を固定、診断・治療ではない、選任業務の代替ではない
- Forbidden claims or wording: 一般SPOT、何でも対応、睡眠専門医、無料、必ず、治療、クリニック連携、CTRや順位の改善断定
- Channel limits: title、H1、meta、excerpt、CTAと、受診勧奨の必須境界文1段落だけをexact対象とする。それ以外の現行本文は変更しない。
- CTA or next action: 初回のご相談（15分）

## Review plan

- Source and fact reviewer: 商品・料金正本と現行WordPressソースの照合
- Safety or compliance reviewer: 医療広告、個人診療への誤誘導、選任業務との境界
- Editorial reviewer: 宮部 大輔（exact versionの医師・オーナー承認）
- Maximum repair cycles: 2

## Review findings

| Severity | Location | Finding | Evidence | Required repair | Disposition |
|---|---|---|---|---|---|
| High | title/meta | `スポット産業医` は含むが、検索結果上で法人向け・1件からがtitleに出ない | 現行titleとSite Kitの約1.9% CTR | 法人向け・1件からをtitle/metaで明示するexact案を作る | repaired in draft / approval pending |
| High | 商品境界 | v1は非復職の研修・SAS・夜勤・運転レビューを初回商品に含めたが、商品正本でSKU・料金・履行条件が未確定 | 独立Tier Sレビュー / pricing-growth-canonical.md / site-copy.md | exact導線を復職・両立支援単発とPackに限定 | repaired in v2 / approval pending |
| High | CTA | 現行ボタンがサイト文言マスターの統一CTAと一致しない | site-copy.mdとpage 164 source | `初回のご相談（15分）` へ合わせる | repaired in draft / approval pending |
| High | 受診勧奨 | 現行本文は受診勧奨を記載するが、本人が受診先を選ぶこと、特定医療機関を指定・紹介しないことの併記がない | 独立Tier Sレビュー / site-copy.md | 必須境界文をexact payloadへ追加 | repaired in v2 / approval pending |
| High | 効果判定 | Site KitのCTRだけでは順位・表示ページが不明だった | Search Console URL-prefix実測 | 2クエリの表示・クリック・CTR・平均順位・ページ・端末を取得し、前後28日を同条件比較 | repaired / baseline fixed |
| Medium | exact hash | v1は提案書全体をハッシュし、実装文字列だけの決定的payloadではなかった | 独立Tier Sレビュー | 変更文字列だけのJSON payloadを作成してハッシュ | repaired in v2 / `a3607427…016d9` |
| Medium | excerpt境界 | v2初稿のexcerptはKIDUKIが就業制限の変更・解除を決定するようにも読めた | 独立Tier S再レビュー / bpo-scope-boundary.md | 「変更・解除に必要な評価・意見」とし、会社の最終決定をmetaで明示 | accepted / repaired in v2 payload |
| High | 契約帰属 | page 164への直接検索流入は記事CTA用IDがなく、ページ起点の契約寄与を第一者照合できなかった | 独立Tier S再レビュー / measurement code | page 164の問い合わせCTAにsource_pageと仮名化IDを設定し、クエリ個別帰属は主張しない | accepted / deployed 2026-09-01; actual event reception pending |
| Medium | search-result intent | 現行結果集合では、企業向けの必要時対応、1件/1回、月額契約なし、復職面談を明示するサービスページが目立つ | 2026-09-01の4社現行公開ページ | v2の `法人1件から`、`復職面談・再評価`、metaの `月額契約のない企業向け` を維持し、未確認の速度・全国対応・無料・価格は足さない | accepted / exact payload unchanged / owner approval pending |
| Medium | `単発` の語面 | 復職系複合クエリの結果では `単発` を直接使うtitle/snippetもあるが、v2は `法人1件から` と `月額契約のない企業向け` で購入条件を表現している | 独立search-intent review / current v2 payload / GSC average position 26台 | 実snippetの差より平均順位と旧URL集計の影響が大きいため、語を足してv3を作らずv2を維持する | accepted / no change / compare after publish |
| Medium | 表示ページ | Search Consoleでは2クエリとも旧URL `/service/spot/` に集計されていた | Search Console query×page / URL inspection / public 301 | 旧URLへ戻さず、新URLexact反映後に再クロールとquery×page移行を確認 | accepted / measured / post-publish follow-up |
| High | Pack商品境界 | strategy初稿はPackを現在の初回商品に数えたが、P-01/P-02は未実施 | CASETRAテスト企業監査、owner review v6 | 現在の初回商品を復職・両立支援単発に限定し、Packを受入PASSまで公開導線から除外 | accepted / repaired locally; exact payload unchanged |
| High | 古い検索スニペット | 旧URLの約10か月前の検索データに、個別面談を対応しないという現行商品と逆向きの本文が残る | current SERP、旧URL公開301、新URLcanonical | exact v2反映後に旧・新URLをURL検査し、再クロール要求とquery×page移行を記録 | accepted / read access confirmed then session expired / exact approval and publication pending |

## Completion evidence

- Local artifact: `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress/content/exact/spot-industrial-physician-ctr-2026-09-01-v2.json`
- Automated checks: content task validator、exact payload SHA-256 `a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9` 再一致、`npm run verify:seo-review` 122 checks、`npm run verify:spot-ctr-approval-binding` で `masterFirstReady: true`、誤SHA-256のapply拒否、21:45 JSTのWordPress read-only dry-runで現行modified/hash一致・`persistentWrites: false`、`npm run verify:spot-wordpress-dry-run-evidence`、`npm run verify:search-console-snapshot`、`git diff --check`
- Human approval: pending
- Schedule record: `content/seo-review-schedule.md` の公開7日・28日・90日、週次・月次
- Published verification: 現行page ID 164を2026-09-01にWordPress APIとソースで照合。exact版は未公開。
- Measurement source and period: 認証済みSearch Console URL-prefix `https://kdkconslt-sngyouijm.com/`、28日選択、実データ2026-08-02〜29。先行の2026-08-05〜31基準と期間別に保持
- Remaining gates: 宮部大輔のexact owner/physician承認、別のWordPress apply権限、バックアップ付き反映、PC/スマホ・公開HTML確認、対象権限のあるSearch Consoleへの再ログイン、新28日選択と同期間の端末別、公開後の旧・新URL検査・再クロール要求・query×page移行

## State history

| Time | From | To | Evidence or actor |
|---|---|---|---|
| 2026-09-01 | — | backlog | Ticket created |
| 2026-09-01 | backlog | review | CTR改善の最小exact案を作成。商品・医療広告・公開境界のレビューとowner approval待ち |
| 2026-09-01 | review | review | 独立Tier SレビューのHighを受け、復職商品へ限定、受診先境界文、決定的payloadを含むv2へ改訂 |
| 2026-09-01 | review | review | Site Kitを17:25 JSTに再確認しCTR 1.89%を記録。現行検索結果の4社比較ではv2の商用意図整合を確認したが、表示回数・順位・表示ページは未取得のためpayloadは変更せずowner-review待ち |
| 2026-09-01 | review | review | 独立search-intent reviewで15結果を比較。`単発` の語面と静的トップ表示の診断材料を記録したが、GSC証拠不足のためv2 exact payloadを維持 |
| 2026-09-01 | review | owner-review | 現行WordPress本文hashと候補本文hashをexact v2へ結合。候補が承認対象の1段落挿入・CTAラベル以外を含む場合に停止する検証を追加し、誤SHA-256を接続前に拒否。WordPress dry-runでtitle・excerpt・本文だけの差分を確認。未公開 |
| 2026-09-01 | owner-review | owner-review | 19:03 JSTにログイン済みSite KitでCTR 1.89%と過去28日集計を再確認。Search Console本体は別ログインを要求したため認証情報へ触れず停止し、表示回数・順位・表示ページを未解決ゲートとして維持 |
| 2026-09-01 | owner-review | owner-review | 19:09 JSTに既存GoogleログインでSearch Console本体を確認。`スポット産業医` 53表示・1クリック・平均順位26.2、`産業医 スポット` 94表示・0クリック・平均順位26.9、いずれも旧URL `/service/spot/`。新URLはインデックス登録済みのためv2を維持し、公開後の再クロールとURL移行を追加 |
| 2026-09-01 | owner-review | owner-review | site-copy masterへexact v2を「公開候補・未承認・未反映」として先行記録し、approval bindingの `masterFirstReady: true` を確認。WordPress未反映 |
| 2026-09-01 | owner-review | owner-review | 現行SERPで旧URLの逆向きスニペットと静的トップ表示を確認。公開301・新URLcanonical・静的トップ→新URLリンクをlive readbackし、PackをP-01/P-02 PASSまで現行導線から除外。exact v2文字列とhashは変更なし。再クロールはGoogleパスキー待ち |
| 2026-09-01 | owner-review | owner-review | 認証済みSearch Consoleの28日選択で `スポット産業医` 56表示・1クリック・CTR 1.8%・平均順位26.0、`産業医 スポット` 91表示・0クリック・平均順位27.2を取得。両方とも旧URLで、v2は変更せず、再クロールをexact反映後の操作へ更新 |
| 2026-09-01 | owner-review | owner-review | 先行期間2026-08-05〜31の端末別は既存正本で取得済みと再確認。新しい28日選択と同期間のdevice行は、対象権限のあるChromeセッション期限切れ・別セッション権限なしで未取得。認証情報入力・アクセス申請・権限変更をせず、期間差と次回取得を証拠へ固定 |
| 2026-09-01 | owner-review | owner-review | 21:45 JSTにKeychain認証のWordPress live dry-runを再実行。page 164のmodified・slug・status・現行本文SHAがlockと一致し、候補差分はtitle・excerpt・本文だけ、書込み0を確認。構造化証拠とverifierへ固定 |
