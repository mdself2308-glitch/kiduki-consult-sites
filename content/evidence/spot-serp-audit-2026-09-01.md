# `スポット産業医` SERP・公開導線監査

Observed: 2026-09-01 JST  
Scope: 読み取りのみ  
Ticket: `content/tasks/CT-20260901-spot-industrial-physician-ctr.md`

## 結論

低CTRはtitleだけの問題ではない。現在の検索結果では、企業向けの「1件から」「単発」「復職面談」「意見書」が明確なサービスページが並ぶ一方、KIDUKIは次の二つのURL信号が混在している。

1. 静的トップ `https://consult.kdkconslt-sngyouijm.com/` が `スポット産業医` 関連結果へ表示される。
2. 旧URL `https://kdkconslt-sngyouijm.com/service/spot/` の約10か月前の検索スニペットに、「個別の従業員面談や従業員の健康相談はスポットでは対応していない」という現行商品と逆向きの本文が残る。

現行HTTPでは旧URLは新URL `/service/return-to-work-support/` へ301、新URLは自己canonicalである。静的トップから新URLへの直接リンクも公開HTMLに存在する。したがってURLを戻したり新しい類似ページを増やしたりせず、exact v2を新URLへ承認反映した後、旧URLと新URLのURL検査・再クロール要求、query×page移行を一組で実施する。

## 現行SERPの購入判断語

| Result | Current framing | KIDUKIへ使える示唆 | KIDUKIへ移植しないこと |
|---|---|---|---|
| [メドワーク産業医事務所](https://medwork-sangyoui.jp/service/spot/) | 復職前面談、スポット、契約するほどではない案件 | 目前の復職案件を月額なしで相談したい意図 | 精神科医、無料、対応地域、速度 |
| [銀座東産業保健事務所](https://ginzaeast-health.com/spot-sanyoui/) | 1件から、オンライン面談、報告書 | 法人1件からと成果物の明示 | 精神科、価格、全国対応 |
| [ミーデン](https://meden.co.jp/spot-interview/) | 月額契約が難しい、1回単位、休職・復職、就業制限 | `月額契約なし`、`1回`、`復職` | 即応性、対応範囲の一般化 |
| [ドクタートラスト](https://doctor-trust.co.jp/sangyoui/service/spot.html) | スポット契約、単発、メンタル・復職面談 | 商用意図で `スポット産業医` と `単発` が同時に使われる | 他社の機能・成果・価格 |

exact v2の `スポット産業医｜法人1件からの復職面談・再評価`、metaの `月額契約のない企業向け` はこの意図に合う。平均順位26台、旧URL集計、古いスニペットの影響が混在するため、公開前にtitleをさらに変更してv3を作らない。

## 公開状態の読み取り証拠

- 旧URL: HTTP 301
- 転送先: `https://kdkconslt-sngyouijm.com/service/return-to-work-support/`
- 新URL公開title: `スポット産業医・単発相談｜復職判定・睡眠研修`
- 新URLcanonical: 自己canonical
- 静的トップの公開リンク: `スポット産業医・単発相談の詳細` → 新URL
- exact v2: owner-review、未公開
- Search Console再認証: Googleパスキー待ち。URL検査・再クロール要求は未実行

## 公開後の判定順

1. 新URLの公開title、meta、H1、canonical、本文境界、CTAを照合する。
2. 旧URLの301と新URLの自己canonicalを再確認する。
3. Search Consoleで新URLをURL検査し、インデックス登録をリクエストする。
4. 旧URLもURL検査し、301先が認識される状態を確認する。
5. 7日後はクロール・表示ページ、28日後は2クエリの表示・クリック・CTR・平均順位、90日後は問い合わせ・商談・契約を分けて確認する。

再クロール要求は順位や反映時期を保証しない。検索結果の更新確認と改善成果は別に記録する。
