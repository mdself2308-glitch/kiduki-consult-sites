# consult静的トップ Pack・SPOT分岐リンク候補

Status: Tier S review / not applied  
Last verified: 2026-09-01  
Target: `consult/index.html` の「単発でお引き受けするもの」

## 目的

静的トップからWordPressの概要ページだけへ送る現行導線を補い、復職案件の依頼範囲が決まっている企業が、案件全体のPackまたは不足する1回のSPOTへ直接進めるようにする。

## 公開候補

既存の「スポット産業医・単発相談の詳細」は残し、その直後に次の2リンクを追加する。

1. **復職案件全体を相談する（復職支援Pack）**  
   `/return-to-work-pack/`
2. **不足する面談・産業医意見・再評価を1回単位で相談する（SPOT）**  
   `/return-to-work-spot/`

補助文は次に固定する。

> 資料整理から産業医意見、会社が決定する工程、再評価まで案件全体を進めたい場合はPack、既存の産業医体制を維持したまま不足する面談・産業医意見・再評価だけを補いたい場合はSPOTをご確認ください。

## 境界

- KIDUKIは診断・治療を行わず、就業上の最終決定と実施は会社が行う。
- 受診が必要な場合も、受診先は本人が選び、特定医療機関を指定・紹介しない。
- PackとSPOTの料金、回数、期間、履行範囲は各商品正本と公開申込面を変更しない。
- Packの実機受入・履行可能性が確認されるまでは、Packへの新しい目立つリンクを公開しない。
- この候補は `consult/index.html` へ未反映であり、static `main` pushの権限を含まない。

## 計測

- リンククリックは `service_contact_click` とし、`source_page=consult-home`、`target_offer=return-to-work-pack` または `return-to-work-spot`、`cta_role=service-path` を送る候補とする。
- 同一サイト内リンクへUTMを付けない。UTMでOrganic Search等の流入元を上書きせず、GA4イベントの集計項目だけで内部遷移を区別する。
- URLとGA4イベントに第一者ID、会社名、相談理由、自由記述を含めない。
- 公開後7日でリンクとクロール、28日で申込面到達、90日でvalid inquiry・商談・契約を別々に確認する。

## 公開ゲート

1. 商品・料金・Pack実機受入の正本確認
2. Tier Sの事実・医療広告・雇用境界レビュー
3. 宮部大輔によるexact version承認
4. `consult/index.html` の現在hashを固定した実装manifest
5. static production権限、PC/スマホ確認、公開後readback

## Tier Sレビュー

| Severity | Location | Finding | Evidence | Repair | Result |
|---|---|---|---|---|---|
| High | 2つの内部リンク | 内部UTMがOrganic Search等の流入元を上書きし、検索から契約までの帰属を壊す | `seo-measurement-spec.md` の第一者帰属・イベント境界 | clean URLと非PII `service_contact_click` に変更 | repaired |
| High | Pack公開 | Casetra一般ローンチはNO-GOで、P-01/P-02がNOT TESTED | `CASETRA_PRETEST_LAUNCH_STATUS_2026-08-25.md`、テスト企業監査シート | Pack受入を公開停止条件として維持 | unresolved publication gate |
| High | 補助文 | 「会社決定まで進める」はKIDUKIが会社決定を代行するように読める | `bpo-scope-boundary.md`、Pack仕様 | 「会社が決定する工程」に修正 | repaired |
| Medium | SPOTラベル | 「意見」だけでは医学的意見と会社決定の区別が弱い | pricing/product正本 | 「産業医意見」に修正 | repaired |
