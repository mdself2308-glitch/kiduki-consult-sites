# SEO funnel ledger template

`seo-funnel-ledger.csv` は、検索後の記事・サービス遷移から、問い合わせ、初回相談、見積、契約までを分離する列定義だけのテンプレートです。

- このリポジトリへ実際の問い合わせ、会社名、氏名、メールアドレス、健康情報、相談内容、契約金額を入力しない。
- 実運用時は、列だけを権限管理された営業台帳へ複製する。
- `source_system` は `wordpress_flamingo` または `casetra_leads` とし、どの第一者記録を正本にするかを明示する。
- `inquiry_record_id` は、WordPressでは `lead_tracking_id`、consultのPack/単発フォームではCasetra Leadsの `lead_id` を権限管理された台帳で照合する。どちらもGA4へ送らない。
- Search Consoleの検索クエリは集計値であり、個別リード行へ転記しない。
- `source_article` と `source_page` は、許容されたslugまたは `direct` / `unknown` のみを使用する。静的トップ直通は `source_page=consult-home` とする。
- `target_offer=general-inquiry` は静的トップからの一般問い合わせを示す計測分類であり、商品SKUや契約商品として扱わない。
- `initial_revenue_tax_exclusive` は権限管理された実台帳だけに保存し、Git上のテンプレートはヘッダー1行のまま維持する。

## Casetra Leads count-only aggregate

`casetra-leads-aggregate.example.json` は、consultのPack/単発フォームとGA4 `generate_lead` を個人情報なしで期間照合するための空テンプレートです。

- Lead ID、氏名、会社名、メール、電話、相談本文、健康情報、レコード配列を追加しない。
- `unique_records_created`、`unique_records_latest_touched`、`successful_api_responses` を別指標にする。既存Lead更新でもAPI成功イベントが発火するため、これらの件数一致を前提にしない。
- テンプレート確認は `npm run verify:casetra-leads-aggregate-template`、権限のある環境から出した実件数は `node tools/verify-casetra-leads-aggregate.mjs --input <count-only-json>` で確認する。
- 実集計の証拠参照には、権限管理された集計実行または監査記録だけを指定し、元レコードをGitへコピーしない。
