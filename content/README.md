# KIDUKI Content System

Status: Active  
Last verified: 2026-09-02  
Owner: 宮部 大輔

このファイルは、MyBrain 全体の `content-production` マニュアルを KIDUKI に適用するためのプロジェクト別コンテンツ正本です。事業・商品・料金・法務・公開状態はここへ複製せず、下記の現行正本へリンクします。

## Global mandatory manual

全Projectへ必ず適用する内容作成マニュアルは `/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/.agents/skills/content-production/SKILL.md` である。KIDUKIのコンテンツ制作・改稿・レビュー・公開準備では、毎回このグローバルマニュアルを先に読み、本ファイルをKIDUKI固有の読者・商品・医療広告・契約導線・公開権限へ適用する正本として使う。本ファイルはグローバルマニュアルの代替ではない。

適用順は、対象タスクに対するユーザーの明示指示、グローバルマニュアル、KIDUKIの本ファイルとリンク先の現行正本、個別成果物チケットとする。矛盾や商品・料金・公開状態の不一致がある場合は推測で埋めず、現行正本と承認者を確認する。

## Purpose and audience

- Product or project: KIDUKIコンサルティング産業医事務所のB2Bサイト、SEO記事、サービス説明、営業導線
- Primary audiences:
  - 目前の休職・復職案件を止めずに処理したい人事・労務担当者
  - 既存産業医を替えず、睡眠・夜勤・運転・休復職の専門支援を足したい企業
  - 選任・定例業務を継続して任せる嘱託産業医を探す企業
  - 自社の人事・産業医で案件・期限・会社決定・証跡を運用したい企業
- Audience jobs or questions:
  - 診断書を受け取った後、会社が何を確認・決定・記録すべきか知る
  - 面談だけでなく、意見書、会社決定、再評価、解除条件まで完了させる依頼先を選ぶ
  - 夜勤・運転・SAS・睡眠施策を就業上の措置へ落とす方法を知る
  - 日程調整、資料回収、期限、決定、再評価を一つの案件として管理する
- Desired next actions:
  - 情報記事から、その課題を扱うサービスページへ進む
  - `/contact/` で「初回のご相談」を行う
  - 現在の1案件は復職・両立支援単発、継続支援はKIDUKI Basic／Retain、自社運用はCASETRAを選ぶ
  - 復職支援PackはP-01/P-02が両方PASSになるまで、公開CTA、比較記事、静的トップ分岐、初回商品、拡張KPIに数えない
- Explicit non-goals:
  - 個人向けの診断・治療・セルフケア集客
  - 特定医療機関への受診誘導
  - 一般的なウェルビーイング、健康管理、メンタルケアの総花的メディア化
  - 未実装サービス、未確定料金、実績のない効果の訴求
  - 検索表示、インデックス、順位、クリック、問い合わせ、商談、契約を同じ成果として扱うこと

## Mandatory production workflow

1. 1成果物につき `content/tasks/CT-*.md` を1件使用する。重複チケットを作らない。
2. 公開される医療、労務、安全、法令、料金、資格、比較、成果の主張は Tier S とする。
3. 下書き前に、読者1人、主質問1つ、次の行動1つ、非目標、根拠、承認者を確定する。
4. 根拠収集、単独執筆、独立レビュー、修正、対象箇所の再レビューを分ける。
5. Tier S は事実確認、安全・法務・医療広告確認、宮部大輔による exact version の承認を経る。
6. 承認と、予約投稿と、公開と、インデックスと、検索成果と、問い合わせ・契約を別の状態・証拠として記録する。
7. 予約・公開・本番変更は、対象バージョンに対するタスク固有の権限がある場合だけ行う。

記事CTAの承認対象は `article-plan.json` の `cta_version` と `exact_source_sha256` で固定する。承認時だけ `cta_status: approved`、`cta_approved_by: 宮部 大輔`、`cta_approved_at`、`cta_approval_sha256`、`cta_approval_bundle_sha256` を記録する。最後の値は宮部大輔が確認した一括承認資料そのもののSHA-256でなければならない。反映前は次のdry-runで、非CTA差分がないか、承認資料に固定したSAS本文の1修正だけであることを確認する。

12記事を一括確認する現行exact承認資料は `exact/article-cta-owner-review-2026-09-01-v6.json` とする。各記事の検索意図、主・副商品、CTA全文、リンク、計測offer、記事の公開状態、CTAの未反映状態、変更範囲、記事本文とCTAのSHA-256を収録する。`state: owner-review` は確認待ちを意味し、承認記録またはWordPress反映権限ではない。次の検証で記事台帳・12原稿との完全一致、およびapply時に照合する承認bindingを確認する。v6はPack P-01/P-02が未実施の間、公開CTAへのPack混入を検証で拒否する。

```sh
npm run verify:article-cta-approval-bundle
npm run verify:article-cta-apply-binding
npm run wp:update-article-ctas
```

反映はexact版承認後に限り、`-- --apply --backup --backup-confirmed --wordpress-apply-authority-confirmed --approved-version 2026-09-01-v6 --approval-bundle content/exact/article-cta-owner-review-2026-09-01-v6.json --approved-bundle-sha256 8a37688634893094c2fc0a6ba7827230dd2eba6797e9dd1183c56482bef1a34a --allow-reviewed-full-body` を付ける。スクリプトは公開・予約状態と日時を変えず、原則として非CTA本文にドリフトがあれば停止する。v6ではSAS本文の医療広告境界1箇所だけを `reviewed_full_body` として明示する。apply前にバンドル自体のSHA-256、planとbundleの12 slug完全一致、各記事のversion・source・CTA・scope・変更理由・変更前WordPressハッシュ・post ID、Pack停止ゲートに加え、12件すべての個別ticketが同一version/source SHAで `approved`、owner decision、approval evidence、physician approvalを記録していることを再照合する。`--wordpress-apply-authority-confirmed` はexact承認とは別の本番反映権限である。いずれかが違えばWordPress接続またはバックアップ作成前に停止する。apply後は更新応答だけで完了とせず、各postをAPIで再取得してslug、status、公開日時、本文SHAを照合する。

2026-09-01 20:37 JSTにWordPress実状態を再監査し、公開1本・予約11本のID、slug、status、公開日時が12/12で計画と一致した。21:47 JSTにもv6の `npm run wp:update-article-ctas` を再実行し、CTAのみ11件が `would_update`、SAS本文を含む1件が `would_update_reviewed_full_body`、全件 `writes: false`、`2026-09-01-v6` / `owner-review` だった。構造化証拠は `evidence/article-cta-wordpress-dry-run-2026-09-01.json` に固定した。これは反映可能性の証拠であり、exact版のowner/physician approvalや本番公開の証拠ではない。

同日、独立Tier Sレビューで、v2承認資料の検索意図欠落、運転記事の一般SPOT誤認、SAS CTAの受診勧奨境界、記事公開状態とCTA反映状態の混同リスクを検出した。v3再レビューではSAS本文の必須境界不足、v4再レビューではfull-bodyの変更前WordPressハッシュ等がowner approvalに結び付いていない問題を検出し、v5で修正した。その後の現行商品再照合で、v5は未受入Packを7件のtarget offerと2件の公開CTAで明示していたためsupersededとした。v6はPackを除外し、記事台帳と原稿から再生成した期待値に完全一致する。bundle SHA-256は `8a37688634893094c2fc0a6ba7827230dd2eba6797e9dd1183c56482bef1a34a`。12件とも `2026-09-01-v6` / `owner-review` / `cta_deployment_status: not_applied` であり、承認・WordPress書込みは未実施である。

`スポット産業医` の低CTRに対する承認対象は `exact/spot-industrial-physician-ctr-2026-09-01-v2.json`（SHA-256 `a3607427bfbf1d5e31a562a18af4fa89d73bd5d5bbcf1c6e7afc863f272016d9`）とする。現行WordPress本文と基準ソースはSHA-256 `2030a084b3a72470f00f27a6d88f6f974bc1d7d96c33b5a5b44376d54e8e02ed` で一致し、承認候補本文は `b64bdb234eb4e8aa92a4099f6dc9edb7b8564ebc22953564ff4fde4d4f3516a0` である。`kiduki/docs/copy/site-copy.md` には同じexact copyを公開候補・未承認・未反映として先行記録し、`masterFirstReady: true` を確認した。`npm run verify:spot-ctr-approval-binding` は、title・H1・meta・excerpt、本文1段落、CTAラベル、post ID、現行・候補本文hashを照合する。`npm run wp:update-spot-ctr` は既定でdry-runであり、applyにはbackupに加えexact version・payload path・SHA-256の一致が必要である。21:45 JSTのlive dry-runでも現行modified・slug・status・本文SHAがlockと一致し、`persistentWrites: false` を確認した。現時点は `owner-review`、未公開である。

公開中post 1555のストレスチェック記事は、2025年3月の法案段階の記載、本文内H1、完全なHTML文書、インラインCSS/JavaScript、根拠未確認の広告表現が残るため、法令・医療のTier S修正対象とする。Tier S再レビュー済みの承認候補は `exact/stresscheck-small-workplace-2028-2026-09-01-v3.json`（SHA-256 `6bcbd35e962d235b7344fe0571d9e1ea3907597c78e8df725bdd19fd337610bc`）、候補本文は `a5a8666dcb2d0512b23b6e0796988ee9fec2652bfba86640adf400b60aeec97f` である。公開中の現行raw本文hash `665dff9ab33275a8f564f0f25eb47f72a92de3faa52a08f2dc5111c9b5e6f4c1` とpost ID・slug・modifiedを固定した。現時点は `owner-review`、本番未反映である。v3のcopyはv2と同一で、肩書き、産業医選任要件、同意確認時期、集団分析改正の2027年4月1日施行と改正趣旨を一次資料に合わせ、更新後のサイト文言正本hashへ再拘束した。

契約導線の次段として、`既存産業医を替えずに睡眠・復職支援を追加する方法` と `産業医面談・意見書・再評価を管理する方法` の2本を、共通マニュアルに従う別々のTier Sチケットで作成した。前者はKIDUKI Basicを主導線、復職・両立支援単発を副導線とし、未受入Packを除外した。後者はCASETRAを主導線、Retainを副導線とし、表計算を一律に否定せず、受付から再評価までを一案件で追えるかを切替基準にした。いずれもAIの事実・安全・医療広告・雇用・商品境界レビューを終えた `owner-review` で、WordPress postは未作成、未承認、未公開である。

## Canonical sources

| Topic | Canonical file, system, or URL | Owner | Last verified |
|---|---|---|---|
| 事業原理・新記事の3問 | `../kiduki/docs/core-thesis.md` | 宮部 大輔 | 2026-09-01 |
| 商品・料金・段階展開 | `../kiduki/docs/pricing-growth-canonical.md` | 宮部 大輔 | 2026-09-01 |
| 獲得から契約拡張まで | `../kiduki/docs/integrated-story.md` | 宮部 大輔 | 2026-09-01 |
| 企業・医療・受託範囲の境界 | `../kiduki/docs/bpo-scope-boundary.md` | 宮部 大輔 | 2026-09-01 |
| サイトの確定文言・肩書き・禁止語 | `../kiduki/docs/copy/site-copy.md` | 宮部 大輔 | 2026-09-01 |
| 現行文書の索引 | `../kiduki/docs/README.md` | KIDUKI | 2026-09-01 |
| サイト所有面・主要ページ | `../docs/site-overview.md` | KIDUKI | 2026-09-01 |
| 現行記事台帳 | `article-plan.json` | KIDUKI | 2026-09-01 |
| SEO exact owner / physician判断資料 | `seo-exact-owner-review-2026-09-01.md` | 宮部 大輔（A〜C承認待ち、D本番権限待ち） | 2026-09-01 |
| 12記事CTAのexact一括承認資料 | `exact/article-cta-owner-review-2026-09-01-v6.json` | 宮部 大輔（承認待ち、Pack除外） | 2026-09-01 |
| `スポット産業医` CTR改善exact | `exact/spot-industrial-physician-ctr-2026-09-01-v2.json` | 宮部 大輔（承認待ち） | 2026-09-01 |
| 単発vsPack比較記事exact候補 | `exact/return-to-work-one-off-vs-pack-2026-09-01-v3.json` | Tier Sレビュー中。Pack実機受入・期間説明の整合待ち | 2026-09-01 |
| 50人未満ストレスチェック2028年施行exact候補 | `exact/stresscheck-small-workplace-2028-2026-09-01-v3.json` | 宮部大輔のowner/physician approval待ち | 2026-09-01 |
| 既存産業医への専門補完記事exact候補 | `exact/existing-industrial-physician-specialist-support-2026-09-01-v1.json` | owner-review。SHA-256 `c524ae175125c8be963b2ed3fc1cdc2b8ffb6e8e1213db0f1bcae4e023234fc4`、未承認・未作成・未公開 | 2026-09-01 |
| 産業保健案件管理記事exact候補 | `exact/occupational-health-case-management-2026-09-01-v1.json` | owner-review。SHA-256 `ef7b280d49fa75e34013a0f540d6b4ceb00b680c4ca0ac0200abf5f6d57c1b7a`、未承認・未作成・未公開 | 2026-09-01 |
| SEOから契約までの導線 | `seo-contract-funnel.md` | KIDUKI | 2026-09-01 |
| consult検索発見・内部リンク監査 | `consult-search-discovery-audit-2026-09-01.md` | KIDUKI | 2026-09-01 |
| consult静的トップ Pack・SPOT分岐候補 | `consult-home-pack-spot-links.md` | Tier Sレビュー中。Pack実機受入待ち | 2026-09-01 |
| consult静的トップ Pack・SPOT分岐exact候補 | `exact/consult-home-pack-spot-links-2026-09-01-v1.json` | Tier Sレビュー中。P-01/P-02 NOT TESTED、owner approval未取得 | 2026-09-01 |
| SEO継続レビュー日程 | `seo-review-schedule.md` | KIDUKI | 2026-09-01 |
| Codex SEO自動化の構成証拠 | `evidence/codex-seo-automation-schedule-2026-09-02.json` | KIDUKI。日次マイルストーン、週次改善、月次契約導線の3本がACTIVE | 2026-09-02 |
| SEOマイルストーン処理台帳 | `evidence/seo-milestone-review-ledger.json` | KIDUKI。7日・28日・90日の完了、無データ観測、部分取得、blocked、再試行日を記録 | 2026-09-02 |
| SEO目標の要件別完了監査 | `evidence/seo-goal-completion-audit-2026-09-01.json` | KIDUKI。19要件、overall `not_complete`、未完了11要件 | 2026-09-01 |
| 12記事の7日・28日・90日ローカルmanifest | `seo-article-review-calendar.json` | KIDUKI。日付・slug・milestoneをCodex日次タスクが参照。Google event項目は履歴のみ | 2026-09-02 |
| F・G記事の公開時刻待ちレビュー計画 | `future-article-review-plan.json` | owner-review中。週次キューには含め、実公開readback後にCodex日次タスクが7日・28日・90日を判定 | 2026-09-02 |
| SEOから契約までの計測仕様 | `seo-measurement-spec.md` | KIDUKI | 2026-09-01 |
| exact承認後の本番反映runbook | `seo-release-handoff.md` | 宮部 大輔（承認待ち） | 2026-09-01 |
| Pack・SPOT GA4 privacy exact release | `exact/static-lead-form-ga4-privacy-2026-09-01-v1.json` | 宮部 大輔（production権限待ち） | 2026-09-01 |
| 営業台帳の空列テンプレート | `templates/seo-funnel-ledger.csv` | KIDUKI | 2026-09-01 |
| Casetra Leads件数専用テンプレート | `templates/casetra-leads-aggregate.example.json` | KIDUKI。個人情報なし、新規Lead・最終更新Lead・API成功応答を分離 | 2026-09-01 |
| 公開トップ | <https://consult.kdkconslt-sngyouijm.com/> | KIDUKI | 2026-09-01 |
| WordPress記事・サービス | <https://kdkconslt-sngyouijm.com/> | KIDUKI | 2026-09-01 |
| 検索・行動計測 | Site Kit / Search Console / GA4 の対象プロパティと期間を各チケットへ記録 | 宮部 大輔 | 2026-09-01 |

## Current measurement snapshot

Site Kitの「過去28日間」を2026-09-01 19:03 JSTにログイン済みWordPress画面で読み取り確認した。Search Consoleの接続先はURL-prefixプロパティ `https://kdkconslt-sngyouijm.com/` で、静的トップ `https://consult.kdkconslt-sngyouijm.com/` はこの集計に含まれない。

- 総インプレッション: 246（前期間比 +33%）
- 総クリック: 10（前期間比 +66.7%）
- 検索からのユニーク訪問: 9（前期間比 +800%）
- Site Kit主要イベントウィジェット: 0
- 上位表示クエリ（Site KitのCTR順）:
  - `宮部大輔`: 23.08% CTR
  - `スポット産業医`: 1.89% CTR（2026-09-01 19:03 JST再確認。早い時刻の同日表示は1.96%）
  - `ストレスチェック助成金 廃止`: 0% CTR

この時点では表示とクリックは増えている。指名検索以外の商用クエリでは `スポット産業医` が露出している一方、CTRは低い。Site Kitの主要イベント0はGA4本体と一致しなかったため、問い合わせ0とは扱わない。

2026-09-01 19:50 JSTにGA4本体を確認すると、同じ2026-08-05〜2026-09-01のイベントレポートには `generate_lead` 5回・2ユーザー、トラフィック獲得レポートにはキーイベント1回（Direct 1、Organic Search 0）があった。`generate_lead` はキーイベント指定済みで、契約導線に必要な `source_article`、`source_page`、`target_offer`、`article_cta_role`、`article_slug`、`cta_role` をイベントスコープのカスタムディメンションとして登録・読み戻した。`lead_tracking_id` はGA4へ登録していない。

Flamingoの受信一覧は計5件だったが、全て2026-07-28または2026-07-31で、上記GA4期間中は0件だった。従ってGA4の `generate_lead` 5回を問い合わせ5件とみなさない。consultのPack/単発フォームもCasetra Leads保存成功後に `generate_lead` を送る非Flamingo導線であり、まず権限管理されたCasetra Leadsの期間別集計と照合する。WordPress側ではSite Kitタグと数値のみのGoogle tag設定 `288922294` も併存するが、原因とは断定しない。公開Pack/単発フォームが第一者 `lead_id` をGA4へ送っていた点はローカルで除外済み・未公開である。個人情報と相談内容は取得・保存していない。

静的トップにはWordPressと同じGA4測定IDが入っているが、2026-09-01時点の公開版では、静的トップからWordPress問い合わせへ第一者の導線帰属を渡していない。`consult-home`、`general-inquiry`、CTA位置だけをクリック時に渡し、WordPress到着後に仮名IDを作る修正はローカル検証済みで未公開である。`general-inquiry` は計測上の分類で、商品SKUではない。

同日の `npm run audit:analytics-access` ではSite Kitサイト接続自体は確認できたが、Application Password経由のWordPressユーザーはSite Kit OAuth `authenticated: false` で、Search Consoleクエリ×ページとGA4キーイベントのREST取得は403だった。一方、19:09 JSTには既存のGoogleログインを使ってSearch Console本体を読み取り確認できた。Search Consoleの表示期間2026-08-05〜2026-08-31では、全体が237表示・10クリック・CTR 4.2%・平均掲載順位21.6だった。Site Kitの246表示との差は取得面・更新時刻・表示期間を分けて保持し、一方で他方を上書きしない。

商用語では、`スポット産業医` が53表示・1クリック・CTR 1.9%・平均掲載順位26.2、`産業医 スポット` が94表示・0クリック・CTR 0%・平均掲載順位26.9だった。どちらも表示ページは `/service/spot/` で、前者はモバイル27表示・1クリック／PC26表示・0クリック、後者はPC50表示・0クリック／モバイル44表示・0クリックだった。2語だけで147表示・1クリックのため、現在の弱点はCTRだけでなく平均3ページ目前後の順位である。

同じURL-prefixプロパティの3か月表示（2026-05-30〜2026-08-29）では、全体が716表示・27クリック・CTR 3.8%・平均掲載順位20.8だった。`スポット産業医` は167表示・1クリック、`産業医 スポット` は289表示・0クリック、`産業医スポット` は28表示・0クリックで、非指名商用語の弱さは3か月でも継続している。ページ文字列 `stresschecknew` で絞ると0表示・0クリック・クエリ行なしだったため、Site Kitの別期間に見える `ストレスチェック助成金 廃止` 1表示をpost 1555へ帰属させない。URL検査ではpost 1555はGoogle登録済みで、前回クロールは2026-08-18 20:41:08、スマートフォンGooglebot、取得成功、index許可、自己canonicalだった。未登録が0表示の原因ではなく、post 1555は古い法令情報を修正したうえで新しい検索需要を獲得する候補として扱う。インデックス再登録はリクエストしていない。

Search Consoleのプロパティ一覧には静的トップ専用 `https://consult.kdkconslt-sngyouijm.com/` が既に存在し、ドメインプロパティは確認できなかった。21:35 JSTに両URL-prefixを28日選択へそろえて再取得すると、WordPress側は実データ2026-08-02〜29で11クリック・241表示・CTR 4.6%・平均掲載順位21.1、consult側は実データ2026-08-13〜29で1クリック・16表示・CTR 6.2%・平均掲載順位8.4だった。consultのトップは1クリック・16表示、`/return-to-work-pack/` は0クリック・1表示。選択期間が同じでも実データ開始日は異なるため、両URL-prefixを合算せず、プロパティ・実日付範囲つきの別表で継続評価する。証拠は `evidence/search-console-dual-property-snapshot-2026-09-01.json` に固定した。

同日20:15 JSTの公開監査では、consultのrobotsは全許可、Pack・SPOTはサイトマップ掲載・HTTP 200・自己canonicalだった。21:10 JSTの再確認で、静的トップからWordPress `/service/return-to-work-support/` への直接リンクは公開済みと確認した。一方、Pack・SPOT各申込面への直接リンクは静的トップとWordPress商用ページのどちらにもない。PackはP-01/P-02 PASSまで孤立解消の対象にせず、SPOTも商用ページv2との商品説明一致後に導線を判断する。21:35 JSTにはSearch Console認証済み読取を完了したが、21:42 JSTにはそのセッションが期限切れとなった。次回の本体UI読取には対象権限のあるアカウントでの再ログインが必要である。ページ表に行がないことだけでは未登録と断定せず、URL検査と再クロール要求は再ログイン後かつ承認済みexact v2の本番反映後に行う。

公開状態では `/service/spot/` は301で `/service/return-to-work-support/` へ転送され、転送先のcanonicalも新URLである。Search Consoleの旧URL検査は2026-07-26クロール時の自己canonicalを保持する古い記録で、新URLは2026-08-18にクロール済み・インデックス登録済み・新URLをcanonicalとして認識していた。したがって旧URLへ戻さず、新URLのexact改稿と内部リンクを優先し、公開後に再クロールとquery×page移行を確認する。ブラウザのSite Kit表示、Search Console本体、自動監査の認証状態は別々に記録する。

Site Kitのユーザー別メールレポート設定はREST readbackで `subscribed: false`、`frequency: weekly` を確認した。週次購読を有効にするスクリプトはdry-runで `would_update` まで確認したが、登録メールアドレスへの継続送信に対する明示権限がないためapplyしていない。継続レビューの運用正本はCodex自動化3本であり、Site KitメールやGoogle Calendarに依存しない。

## Voice

- Speaker or author: 宮部 大輔。公開時の資格表記は「内科専門医・心療内科専門医・労働衛生コンサルタント」に固定する。
- Relationship to the audience: 企業の決定を代行するのではなく、医学的評価、就業上の意見、実施手順、再評価、証跡を整える産業医・労働衛生の専門家。
- Tone: 結論先行、具体的、非威圧的。制度説明だけで終わらず、会社が次に行うことを示す。
- Preferred language: 「産業医業務では」「医師として」「会社が決定する」「再評価日」「解除条件」「証跡」。
- Avoid: 「当院では」「睡眠専門医」「睡眠の専門医」「併設」「クリニックと連携」「一気通貫」「無料相談」「必ず」「絶対」「治ります」「普通の産業医はできない」「健康情報の一元管理」「寄り添う」。
- Required boundaries: 診断・治療は医療機関、受診先は本人が選ぶ、就業上の最終決定と実施は会社、会社への健康情報は必要最小限。

## Channels

| Channel | Purpose | Format constraints | Approval owner | Publication authority |
|---|---|---|---|---|
| Website | 商品の対象・範囲・次の行動を明確にする | 静的トップとWordPressの所有面を分ける。PC・スマホ確認必須 | 宮部 大輔 | 対象変更を明示したユーザー依頼 |
| Article or SEO | 検索者の質問へ早く答え、正しいサービスへ送る | 1記事1検索意図。キーワード反復より実務・根拠・内部リンクを優先 | 宮部 大輔（Tier Sは医師承認を兼ねる） | exact version の承認後に別途予約・公開権限 |
| Sales material | 買い手が比較・稟議・契約判断できる状態を作る | 商品・料金正本と契約境界を変更しない | 宮部 大輔 | 外部共有ごとの明示権限 |
| Social / newsletter | 承認済みコンテンツの1論点を届ける | 新しい医療・法務・料金主張を追加しない | 宮部 大輔 | 投稿・送信ごとの明示権限 |

## Claims and evidence

| Claim area | Permitted source | Required reviewer | Prohibited shortcut |
|---|---|---|---|
| 医療・睡眠・安全 | 現行ガイドライン、公的機関、原著・系統的レビュー、確認済みプロジェクト事実 | 事実レビュー＋医療安全レビュー＋宮部大輔 | 検索上位記事だけ、AI要約だけ、個別診断 |
| 法令・雇用・会社責任 | e-Gov、厚生労働省、労働局等の一次資料 | 法令・実務レビュー＋宮部大輔 | 古い解説記事、断定的な法的助言 |
| 商品・料金・提供範囲 | `pricing-growth-canonical.md` と現行公開ページ | 商品境界レビュー＋宮部大輔 | 過去資料、競合価格からの推測、未確定SKU |
| 資格・肩書き・医療広告 | `site-copy.md` と確認済み登録情報 | 医療広告レビュー＋宮部大輔 | 通称の資格、特定医療機関への誘引 |
| 競合・比較 | 競合の現行一次公開情報。非公開部分は不明と明示 | 事実レビュー＋宮部大輔 | 「提供していない」と未確認で断定 |
| SEO成果 | Search Console / GA4 / 問い合わせ台帳 / 契約記録 | 計測境界レビュー | クロール＝順位、クリック＝契約とみなす |

## Current content inventory

| Deliverable | Current source | State | Live reference | Successor or notes |
|---|---|---|---|---|
| 夜勤・交代勤務の睡眠対策 | `articles/night-shift-sleep-management.html` | published | <https://kdkconslt-sngyouijm.com/night-shift-sleep-management/> | 2026-09-01 15:23 JSTに公開APIとWordPressで確認。検索・契約成果は未確認 |
| 運転業務の眠気リスク | `articles/drowsy-driving-workplace-safety.html` | scheduled | WordPress post 1842 / 2026-09-04 07:00 JST | owner/physician approval evidence must be attached |
| 職場のSAS対策 | `articles/sas-screening-at-work.html` | scheduled | WordPress post 1844 / 2026-09-08 07:00 JST | owner/physician approval evidence must be attached |
| 長時間労働者の面接指導と睡眠 | `articles/long-hours-interview-sleep.html` | scheduled | WordPress post 1846 / 2026-09-11 07:00 JST | owner/physician approval evidence must be attached |
| 健康経営の睡眠施策 | `articles/kenko-keiei-sleep-measures.html` | scheduled | WordPress post 1848 / 2026-09-15 07:00 JST | owner/physician approval evidence must be attached |
| 復職時の睡眠評価 | `articles/return-to-work-sleep-assessment.html` | scheduled | WordPress post 1850 / 2026-09-18 07:00 JST | 単発を主導線、Basicを副導線 |
| 衛生委員会議事録の3年保存 | `articles/committee-minutes-three-year-retention.html` | scheduled | WordPress post 1852 / 2026-09-22 07:00 JST | Retain/Casetraへの主導線 |
| 産業医面談の日程調整 | `articles/industrial-physician-scheduling.html` | scheduled | WordPress post 1854 / 2026-09-25 07:00 JST | Casetraへの主導線 |
| 産業医意見後の会社決定 | `articles/after-the-physician-opinion.html` | scheduled | WordPress post 1856 / 2026-09-29 07:00 JST | CASETRAを主導線、単発を副導線 |
| 就業制限の解除管理 | `articles/work-restriction-release-management.html` | scheduled | WordPress post 1858 / 2026-10-02 07:00 JST | 単発を主導線、CASETRAを副導線 |
| 睡眠所見から就業配慮へ | `articles/sleep-findings-to-work-accommodation.html` | scheduled | WordPress post 1860 / 2026-10-06 07:00 JST | Basic/Retainへの主導線 |
| 睡眠の問題が復職判断に変わるとき | `articles/when-sleep-becomes-a-return-to-work-decision.html` | scheduled | WordPress post 1862 / 2026-10-09 07:00 JST | 単発を主導線、Basicを副導線 |
| 復職面談は単発とPackのどちらを選ぶか | `articles/return-to-work-one-off-vs-pack.html` | review | 未公開・未予約 | exact v3を固定。Tier S再レビュー済みだが、Pack実機受入と期間説明のowner decision待ち |
| 50人未満のストレスチェック義務化 | `articles/stresscheck-small-workplace-2028.html` | owner-review | WordPress post 1555 / <https://kdkconslt-sngyouijm.com/stresschecknew/> | 公開中は2025年3月時点の旧本文。2028年4月1日施行へ全面修正するexact v3は未反映・owner/physician approval待ち |
| 既存産業医を替えずに専門支援を追加する方法 | `articles/existing-industrial-physician-specialist-support.html` | owner-review | 未作成・未公開 | exact v1。Basicを主導線、単発を副導線。Pack除外。owner/physician approvalと別の作成・公開権限待ち |
| 産業医面談・意見書・再評価の案件管理 | `articles/occupational-health-case-management.html` | owner-review | 未作成・未公開 | exact v1。CASETRAを主導線、Retainを副導線。既存3記事とは管理方法の選定意図で分離。owner/physician approvalと別の作成・公開権限待ち |

## Measurement boundaries

- Discovery evidence: Search Consoleの対象プロパティ、期間、クエリ、ページ、表示回数、平均掲載順位、インデックス状態。
- Engagement evidence: GA4の対象期間、記事閲覧、サービスページ遷移、CTAクリック、フォーム開始。
- Conversion evidence: `/thanks/` 到達または `generate_lead`、問い合わせ種別、初回相談実施、見積提示、契約締結を別々に記録する。
- Real-world outcome evidence: 契約商品、初回売上、月額転換、継続期間。PackはP-01/P-02受入PASS後に限り完了件数を追加する。匿名化し、医療成果や復職成功率と混同しない。
- Review period: 公開後7日でインデックス、28日で初回評価、90日でクエリ・CTA・契約導線を改訂する。データが少ない場合は期間を延ばし、ゼロを失敗と断定しない。

## 検索順位の回復計画（2026-09-02）

診断・技術修正・承認シートは `seo-ranking-recovery-plan-2026-09-02.md`（チケット `tasks/CT-20260902-seo-ranking-recovery.md`）を正とする。子テーマの検索土台（タイトル区切り、excerptからのmeta description、事務所・サイト構造化データ、noindex受け皿）は `npm run verify:seo-hardening`、内部リンク候補は `npm run verify:internal-link-candidates`、スポットv3の承認bindingは `npm run verify:spot-page-v3-binding` で確認する。いずれもローカル検証であり、本番反映・インデックス・順位の証拠ではない。旧記事の整理候補は `evidence/old-article-triage-2026-09-02.json` に置き、Search Console 確認と宮部大輔の決定前に noindex・301 を実行しない。

2026-09-02以降、宮部大輔の承認は「B OK」のような記号＋OKの一言で受け、`node tools/record-owner-approval.mjs --codes B --message "<先生の発言>"` がその時点のexactファイルのSHA-256・日時を `evidence/owner-approvals-2026-09.json` と各チケットへ記録する。ハッシュは先生に書かせない。承認記録の後に、各applyスクリプトの dry-run→backup→apply→readback を行う。
