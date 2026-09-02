# consult検索発見・契約導線監査

Status: Review complete / production changes pending  
Last verified: 2026-09-01 20:15 JST  
Scope: `https://consult.kdkconslt-sngyouijm.com/`

## 結論

Pack・SPOT申込面は技術的にはクロール可能だが、公開中の静的トップとWordPressのスポット産業医ページから直接リンクされていない。サイトマップだけに依存するため、検索エンジンの発見、ページ評価、利用者の契約導線がいずれも弱い。

この状態は「noindexで検索されない」問題ではない。robotsは全許可、両URLはHTTP 200、自己canonical、サイトマップ掲載済みである。一方、Search Consoleのconsult用URL-prefixで確認できた実績は、トップ16表示・1クリック、Pack 1表示・0クリック、SPOTは確認したページ表に行がなかった。SPOTの行がないことだけでは未登録を証明しないため、URL検査は別の未確認項目として残す。

## 公開状態の証拠

| 対象 | 2026-09-01の公開確認 | 判定 |
|---|---|---|
| `/robots.txt` | HTTP 200、`User-agent: *`、`Allow: /`、consult sitemapを指定 | クロール許可 |
| `/sitemap.xml` | トップ、Pack、SPOTの3URLを掲載 | 発見経路あり。ただし内部リンクの代替にはしない |
| `/return-to-work-pack/` | HTTP 200、自己canonical、title/H1あり、明示noindexなし | index可能。登録状態はURL検査未確認 |
| `/return-to-work-spot/` | HTTP 200、自己canonical、title/H1あり、明示noindexなし | index可能。登録状態はURL検査未確認 |
| 静的トップ | Pack・SPOTへの直接リンク0件 | 人間・クローラー双方の導線が弱い |
| WordPress `/service/return-to-work-support/` | 公開HTMLにPack・SPOTへのリンク0件 | 商用検索ページから申込面へ進めない |
| Search Console consult用URL-prefix | 3か月選択のチャート期間2026-08-13〜2026-08-29でトップ16表示・1クリック、Pack 1表示・0クリック | 表示はあるが契約直前ページの発見・評価はごく小さい |

## 修正順

1. `スポット産業医` exact v2を承認・反映し、WordPress商用ページからPackとSPOTへ、案件全体か不足する1回かで分岐できるリンクを公開する。
2. 静的トップにも、単発サービスの説明箇所からPackとSPOTへ直接進める2択を別exact成果物として作る。GA4プライバシー修正の2ファイル限定リリースには混ぜない。
3. 公開後に両URLのURL検査を行い、登録状態、最終クロール、Google選択canonicalを記録する。必要な場合だけインデックス登録をリクエストし、リクエスト自体を登録・順位改善とみなさない。
4. 7日でクロール・index、28日でquery×page・記事/サービス→申込面遷移、90日で有効問い合わせ・商談・契約を別々に評価する。

## 契約導線への影響

検索語とページの役割は次のように固定する。

| 検索意図 | 入口 | 判断ページ | 申込面 | 計測 |
|---|---|---|---|---|
| `スポット産業医`、`産業医 スポット` | `/service/return-to-work-support/` | 対応範囲と法人1件からの適合を確認 | 案件全体はPack、不足する面談・意見・再評価だけならSPOT | query×page → 申込面クリック → Casetra Leads → 商談 → 契約 |
| `復職可能 診断書 会社対応`等 | 復職工程記事 | 同サービスページまたは単発vsPack比較記事 | 適合する1面だけ | 同上 |

公開前のローカルリンクやサイトマップ掲載を契約導線の完成とはみなさない。

## 未確認・停止条件

- Google Search Console本体は現在のブラウザでGoogle再ログインが必要で、Pack・SPOTのURL検査は今回未実施。
- exact owner/physician approvalとproduction権限がない状態では、WordPress本文更新もstatic `main` pushも行わない。
- Packの実機受入・期間説明が未確定のまま、比較記事を公開しない。
