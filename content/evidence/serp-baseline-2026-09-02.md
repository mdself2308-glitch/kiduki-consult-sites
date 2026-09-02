# 検索結果の基準値（SERPベースライン）2026-09-02

## 結論（先に3行）

- Google検索ページの直接取得（WebFetch）は **12クエリすべて未取得**。GoogleがCAPTCHA（＝人間か確認する画面）を返した。
- 代わりに WebSearch（Claude内蔵の検索API）で **12クエリすべて代替取得**。ただし順位はGoogle日本の実順位ではなく「目安」。広告本数・AI概要の有無は **未取得**。
- KIDUKIのサイト（kdkconslt-sngyouijm.com）は **「KIDUKI 産業医」でのみ出現（代替結果の6位）**。他11クエリでは上位に出現なし。consult.kdkconslt-sngyouijm.com は全クエリで出現なし。

## 取得方法と注意

| 項目 | 内容 |
|---|---|
| 一次手段 | `https://www.google.com/search?q=…&hl=ja&gl=jp&pws=0` を WebFetch → 全件ブロック（未取得） |
| 代替手段 | WebSearch ツール（米国拠点の検索API、日本語クエリ）。記録の `source` は「代替（WebSearch）」 |
| 順位の意味 | WebSearch が返した並び順。Google実順位ではない（推定） |
| 広告本数 | 未取得（代替手段では判別不可） |
| AI概要 | 未取得（代替手段では判別不可） |
| JSON正本 | `content/evidence/serp-baseline-2026-09-02.json` |

## クエリ別サマリー

| # | クエリ | 取得元 | 件数 | 上位の傾向（1〜3位のドメイン） | KIDUKI出現 |
|---|---|---|---|---|---|
| 1 | スポット産業医 | 代替 | 5 | sangyoui.m3career.com, career-lab.m3.com, www.journal.co.jp | なし |
| 2 | 産業医 スポット | 代替 | 9 | meetsmore.com, sangyoui.m3career.com, doctor-trust.co.jp | なし |
| 3 | 復職 診断書 会社 対応 | 代替 | 5 | service.firstcall.md, www.mhlw.go.jp, mediment.jp | なし |
| 4 | 産業医 意見書 会社 対応 | 代替 | 7 | www.journal.co.jp, mediment.jp, www.avenir-executive.co.jp | なし |
| 5 | 産業医 就業制限 解除 | 代替 | 7 | go100.jp, note.com, sanpomichi-dt.jp | なし |
| 6 | 就業上の措置 記録 | 代替 | 8 | www.mhlw.go.jp, www.city.yanagawa.fukuoka.jp, www.armg.jp | なし |
| 7 | 産業医 面談 日程調整 | 代替 | 6 | t-pec.jp, mediment.jp, www.phchd.com | なし |
| 8 | 衛生委員会 議事録 保管期間 | 代替 | 7 | service.firstcall.md, ohp.carely.jp, hss.wellcoms.jp | なし |
| 9 | 東京 嘱託産業医 | 代替 | 6 | www.sakurajyuji-healthcare.jp, career.m3.com, www.tokyo.med.or.jp | なし |
| 10 | 産業医 港区 | 代替 | 7 | minatokuishikai.or.jp, sanchie.net, www.tokyo-sangyoui.com | なし |
| 11 | 産業衛生 DX | 代替 | 8 | www.hyogos.johas.go.jp, nara-sangyoui.sakura.ne.jp, sampolab-ad.com | なし |
| 12 | KIDUKI 産業医 | 代替 | 8 | en.wikipedia.org, jsish.jp, jsish.jp | あり（6位・代替順位） |

## 上位結果の一覧（クエリごと）

### スポット産業医

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [スポット産業医サービス「産業医エクスプレス」 | エムスリーキャリアの産業医サービス](https://sangyoui.m3career.com/service/spot/)
2. [「スポット産業医」とは？働き方とはじめ方 | キャリアデザインラボ | m3.com](https://career-lab.m3.com/categories/guide/series/company/articles/699)
3. [企業向け スポット産業医サービス- 求人ジャーナル 産業医サポート](https://www.journal.co.jp/sangyoui/enterprise/spot)
4. [【スポット産業医】株式会社メディカル・サーバント| 健康診断の意見聴取](https://medicalservant.co.jp/service)
5. [スポット産業医＆産業看護職紹介サービス | リモート産業保健](https://sanchie.net/price/spot/)

### 産業医 スポット

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [産業医スポット契約は高い？費用相場とおすすめサービス3選【比較表付】](https://meetsmore.com/product-services/industrial-physician-introduction/media/249397)
2. [スポット産業医サービス「産業医エクスプレス」 | エムスリーキャリアの産業医サービス](https://sangyoui.m3career.com/service/spot/)
3. [産業医のスポット契約、費用、契約の流れ｜ドクタートラスト](https://doctor-trust.co.jp/sangyoui/service/spot.html)
4. [産業医のスポット契約とは？報酬相場や契約メリットを解説](https://www.avenir-executive.co.jp/sangyoui/column-list/column-8-07/)
5. [産業医のスポット契約｜活用方法や費用相場、メリットを解説](https://sanpo-navi.jp/column/industrial-physician-spot/)
6. [【スポット産業医】株式会社メディカル・サーバント| 健康診断の意見聴取](https://medicalservant.co.jp/service)
7. [産業医のスポット契約とは？メリットや費用相場、選び方を解説 | さんぎょうい株式会社](https://www.sangyoui.co.jp/useful/useful-6709/)
8. [産業医のスポット(単発)契約とは？費用相場や依頼できる業務、探し方を解説！リモート産業保健](https://sanchie.net/media/sangyoui-supot/)
9. [産業医のスポット契約って実際どうなの？現役産業医の見方とは？ | さんぽちゃーと](https://sampo-chart.com/sangyoui-spot/618/)

### 復職 診断書 会社 対応

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [復職診断書は必要？会社が行うべき手続きとトラブル回避のコツ](https://service.firstcall.md/blog/235)
2. [厚生労働省 中央労働災害防止協会 〜メンタルヘルス対策における職場復帰支援〜 改訂](https://www.mhlw.go.jp/new-info/kobetu/roudou/gyousei/anzen/dl/101004-1.pdf)
3. [復職時に診断書は必要？ 様式例や例文・意見書との違い・判断時の注意点などを解説](https://mediment.jp/blog/certificate-of-return-to-work)
4. [復職時の診断書完全ガイド｜取得方法から注意点まで人事担当者が知っておくべきこと | ミーデン株式会社](https://meden.co.jp/column/mentalhealth-eap/%E5%BE%A9%E8%81%B7%E6%99%82%E3%81%AE%E8%A8%BA%E6%96%AD%E6%9B%B8%E5%AE%8C%E5%85%A8%E3%82%AC%E3%82%A4%E3%83%89%EF%BD%9C%E5%8F%96%E5%BE%97%E6%96%B9%E6%B3%95%E3%81%8B%E3%82%89%E6%B3%A8%E6%84%8F%E7%82%B9/)
5. [復職診断書はどこでもらえる？すぐもらえる？期間・費用・注意点を解説](https://mencli.ashitano.clinic/33215)

### 産業医 意見書 会社 対応

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [産業医意見書の法的効力と企業の義務｜無視した場合のリスクと実務のポイントを完全解説 | 求人ジャーナル産業医サポートコラム](https://www.journal.co.jp/sangyoui/articles/post-1136/)
2. [産業医の意見書は面談によって違う？意見書の効力やフォーマットについて解説！](https://mediment.jp/blog/industrial-physician-written-opinion)
3. [【産業医の意見書とは】記載内容と注意点を人事向けに解説｜診断書との違いも紹介](https://www.avenir-executive.co.jp/sangyoui/column-list/news250801/)
4. [産業医意見書とは？法的効力や診断書との違い、企業の活用法を解説 | ワーカーズドクターズ](https://www.workersdoctors.co.jp/column/knowledge/6652/)
5. [産業医の意見書とは？ 効力についても紹介](https://www.medical-tt.co.jp/1970)
6. [産業医の意見書とは？作成される場面や記載内容、法的効力の有無について解説 | さんぎょうい株式会社](https://www.sangyoui.co.jp/useful/useful-5917/)
7. [産業医の意見書や診断書はどこまで従うべき？会社の判断との関係を実務目線で解説 | 原産業医事務所](https://adaptation.h-ohp.com/leave-return/1648/)

### 産業医 就業制限 解除

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [就業判定における産業医の役割とは？主治医との優先順位と実務対応 | GO100](https://go100.jp/column/employment-judgment-industrialphysician/)
2. [「就業制限が必要」と産業医に言われたら？｜産業医のトリセツ](https://note.com/sangyoitorisetsu/n/nc8cf3b816959)
3. [【精神保健福祉士執筆】産業医の就業制限を無視したらどうなる？ | さんぽみち](https://sanpomichi-dt.jp/sanngyoui-musi/)
4. [【保健師監修】産業医の意見書に効力はある？権限の範囲や強制力を解説 | さんぽみち](https://sanpomichi-dt.jp/written-opinion/)
5. [就業制限の基準と強制力とは？判断手順と対象疾患を産業医が解説｜サンポチャート](https://sampo-chart.com/sangyoui-syuugyouseigen-kyouseiryoku/806/)
6. [ドクターストップとは？就業制限の判断基準・手続き・法的効力を産業医が解説｜サンポチャート](https://sampo-chart.com/sangyoui-drstop/1421/)
7. [医師のための就業判定支援NAVI ～労働者が安心して働けるために～](https://kenshin.dohcuoeh.com/shugyohantei/ruikei.html)

### 就業上の措置 記録

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [一般健康診断結果を用いた就業措置区分の判定について（厚労省検討会資料）](https://www.mhlw.go.jp/file/05-Shingikai-11201000-Roudoukijunkyoku-Soumuka/0000117190.pdf)
2. [職務に関する働きかけの記録等に関する取扱要綱（柳川市）](https://www.city.yanagawa.fukuoka.jp/reiki_int/reiki_honbun/r203RG00000811.html)
3. [就業判定とは？就業判定までの流れや事業者に義務付けられる健康診断後の措置、注意点を解説 | アドバンテッジJOURNAL](https://www.armg.jp/journal/399-2/)
4. [健康診断結果に基づき事業者が講ずべき措置に関する指針（厚労省）](https://www.mhlw.go.jp/hourei/doc/kouji/K170417K0020.pdf)
5. [職務に関する働きかけの記録等取扱規程（福井市）](https://www1.g-reiki.net/city.fukui/reiki_honbun/s500RG00000190.html)
6. [就業判定を実施する流れや健康診断後に事業者へ義務付けられている措置とは？](https://hss.wellcoms.jp/blog/n0106)
7. [解雇に向けた記録整備の基本とは？｜若林 忠旨](https://note.com/machikadosr/n/n1fe46aa69f7d)
8. [健康診断とは？労働安全衛生法に基づく種類・内容・事後措置を人事労務担当者向けに解説](https://www.stresscheckmark.jp/health-checkup-types-legal-requirements-guide/)

### 産業医 面談 日程調整

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [ストレスチェック後に実施する産業医の面談（面接指導）の流れとは？注意点についても解説](https://t-pec.jp/work-work/article/335)
2. [産業医面談とは？対象となる基準・内容・人事労務担当者の対応ポイントなどを解説！](https://mediment.jp/blog/Industrial-physician-interview)
3. [産業医面談とは？内容やメリット・注意点を解説 | メディコム](https://www.phchd.com/jp/medicom/park/idea/healthmanage-interview)
4. [産業医面談とは？日程調整時の注意点や予約システム活用について解説 | ChoiceRESERVE](https://yoyaku-package.com/useful/detail/industrial-dr-consultation/)
5. [産業医面談の義務とは？対象者や実施内容・罰則を医師が解説 | エムスリーヘルスデザイン](https://m3hd.co.jp/blog/Nj_GdXIl)
6. [産業医の面接指導とは？対象者と流れ、内容やオンライン面接を解説 | リモート産業保健](https://sanchie.net/media/flows-of-the-sangyoui-interviews/)

### 衛生委員会 議事録 保管期間

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [安全衛生委員会の議事録に記載する項目とは？作成のポイントや保存期間のルールを解説](https://service.firstcall.md/blog/273)
2. [【テンプレあり】衛生委員会の議事録はどう書く？実際のサンプルで初心者向けに解説 ｜Carely産業医紹介](https://ohp.carely.jp/column/health-committee-minutes/)
3. [安全衛生委員会の議事録とは？無料テンプレートサイトもご紹介](https://hss.wellcoms.jp/blog/n0059)
4. [衛生委員会の議事録に記載する内容は？保存期限や周知方法も解説 | エムスリーキャリア](https://sangyoui.m3career.com/service/blog/09005/)
5. [衛生委員会「議事録」の作成法・保管等のルールを紹介](https://www.medical-tt.co.jp/2470)
6. [【フォーマットあり】衛生委員会「議事録」の書き方・保管や周知の義務について解説](https://sanpo-navi.jp/column/health-committee-minutes/)
7. [衛生委員会開催後の周知・記録について | 衛生委員会ハンドブック｜ドクタートラスト運営](https://aneiho.com/iinkai/iinkai5)

### 東京 嘱託産業医

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [産業医・産業保健師 | 東京桜十字](https://www.sakurajyuji-healthcare.jp/business/occupational-health/)
2. [東京都・嘱託産業医医師求人情報一覧｜m3.com CAREER](https://career.m3.com/feature/sangyoui/prefecture/tokyo/parttime)
3. [産業医情報 | 公益社団法人 東京都医師会](https://www.tokyo.med.or.jp/sangyoi)
4. [産業医とは | 公益社団法人 東京都医師会](https://www.tokyo.med.or.jp/sangyoi/whats)
5. [東京産業医事務所 | 港区、千代田区、中央区で産業医のご紹介](https://www.tokyo-sangyoui.com/)
6. [東京の産業医紹介サービス・産業医事情まとめ｜産業医総研ONLINE](https://www.sangyoui-souken.com/industrial_physician/tokyo.html)

### 産業医 港区

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [産業保健センター | 港区医師会](https://minatokuishikai.or.jp/industry/)
2. [港区の産業医事情をご紹介！報酬相場や探し方も解説 | リモート産業保健](https://sanchie.net/media/sangyoui-minato-city-how-to-find/)
3. [東京産業医事務所 | 港区、千代田区、中央区で産業医のご紹介](https://www.tokyo-sangyoui.com/)
4. [産業医のご紹介(東京港区、千代田区、中央区など)｜芝メンタルクリニック](https://www.shiba-mental.com/sangyoui.html)
5. [産業医なら東京港区・渋谷区の産業保健サービス株式会社](https://www.sangyouhoken.com/)
6. [産業医とは｜産業保健サービス株式会社](https://sangyouhoken.com/kensa/index.html)
7. [港区の産業医なら港三田クリニックへ｜三田・田町](https://www.minatomitaclinic.net/industrial_physician/)

### 産業衛生 DX

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 出現なし

1. [産業保健における ICTの活用 特集（兵庫産業保健総合支援センター No.118）](https://www.hyogos.johas.go.jp/sanpo/wp-content/uploads/2025/06/118.pdf)
2. [産業保健DX支援 | 健康経営・労働衛生のデジタル化 | 奈良・山内産業医事務所](https://nara-sangyoui.sakura.ne.jp/dx.html)
3. [産業医・保健師の業務が劇的に変わる！産業保健における DX ...](https://sampolab-ad.com/announcements/qsmtnbawd4wqf75c)
4. [mediment、「産業保健業務のDX推進ポイント」調査レポートを公開 | メディフォン株式会社](https://prtimes.jp/main/html/rd/p/000000037.000154534.html)
5. [オンデマンド_JMDCが考える産業保健業務DXの進め方 ～健康診断と面談管理編～](https://stories.jmdc.co.jp/20250226)
6. [産業保健の現場とAI導入のリアル：メンタルケアのDX | Medi Face](https://medi-face.co.jp/events/8yaDOftkXYET)
7. [産業保健 | 健康経営・健康管理コラム（健診DXラボ）| メディクラ](https://medicloud.jp/healthcare-dx-lab/category/occupational-health/page/2/)
8. [shigoto.mhlw.go.jp（職業情報提供サイト）](https://shigoto.mhlw.go.jp/User/Occupation/Detail/324)

### KIDUKI 産業医

- 取得元: 代替（WebSearch） ／ Google直接: 未取得 ／ 広告本数: 未取得 ／ AI概要: 未取得 ／ KIDUKI: 第6位（代替順位）

1. [Sueichi Kido](https://en.wikipedia.org/wiki/Sueichi_Kido)
2. [患者急変対応KIDUKIプロバイダー/ファシリテーターコース | JSISHサイト 日本医療教授システム学会](https://jsish.jp/eduwp/?page_id=1714)
3. [患者急変対応KIDUKIプロバイダー/ファシリテーターコース | 日本医療教授システム学会](https://jsish.jp/seminar-info/regular-course/kidukiprovider-facilitator/)
4. [Washizu Kidō](https://en.wikipedia.org/wiki/Washizu_Kid%C5%8D)
5. [Koki Kido](https://en.wikipedia.org/wiki/Koki_Kido)
6. [KIDUKIコンサルティング産業医事務所 | プロフェッショナルな産業衛生コンサルティングサービス](https://kdkconslt-sngyouijm.com/)
7. [産業医をお探しの方へ | 公益社団法人 東京都医師会](https://www.tokyo.med.or.jp/sangyoi/search)
8. [気づきの経営計画](https://kiduki.co.jp/)

## 観察メモ（推定を含む）

- 「スポット産業医」「産業医 スポット」: エムスリーキャリア、ドクタートラスト、リモート産業保健、さんぎょうい、求人ジャーナルなど産業医紹介会社の商品ページと費用解説コラムが並ぶ。比較記事（meetsmore）も入る。
- 「復職 診断書 会社 対応」「産業医 意見書 会社 対応」: 厚労省の職場復帰支援の手引きPDFと、紹介会社系コラムが中心。「会社が最終判断」という論点は複数サイトが既に書いている。
- 「産業医 就業制限 解除」: 「解除」そのものを主題にした上位ページは見当たらず、就業制限の基準・強制力・無視した場合の解説が並ぶ（解除条件・再評価日の切り口は空いている可能性。推定）。
- 「就業上の措置 記録」: 厚労省の指針・検討会資料と、無関係な自治体規程（職務に関する働きかけの記録）が混在。検索意図が定まっていないクエリと見える（推定）。
- 「産業医 面談 日程調整」: 面談の流れ解説が中心。日程調整そのものを扱うのは予約システム会社（ChoiceRESERVE）1件。
- 「衛生委員会 議事録 保管期間」: 「3年（安衛則23条4項）」を各社コラムが同じ形で解説。差別化は難しいが確度の高い回答型クエリ。
- 「東京 嘱託産業医」「産業医 港区」: 東京都医師会・港区医師会、東京産業医事務所、区内クリニックの産業医ページが並ぶ。地域名＋産業医は個別事務所ページが上位に入り得る。
- 「産業衛生 DX」: 「産業保健DX」の言い換えで解釈されている。JOHAS資料、mediment、JMDC など。「産業衛生」表記での上位ページは少ない。
- 「KIDUKI 産業医」: 同名（KIDUKIコース、Kido姓のWikipedia、気づきの経営計画）と混在。自社サイトは代替結果で6位。指名検索の取り切りは今後の確認点。

## 次にやること

1. Google日本の実SERP（順位・広告本数・AI概要）は、シークレットモードのブラウザで手動検索して同じJSONの `ads_count` / `ai_overview` を埋める（この作業では未取得）。
2. Search Console のクエリ別「平均掲載順位」で、12クエリの実順位を補完する。
3. 次回の取得時は同じ12クエリ・同じ手順で記録し、このファイルと差分を比べる。
