# 営業資料 生成スクリプト

`KIDUKI_service_guide_202608.pptx` / `CASETRA_platform_guide_202608.pptx` の生成元。
文言の微修正はPowerPointで直接行えばよい。構成やレイアウトを大きく変える場合はここから再生成する。

## 使い方

```bash
npm install pptxgenjs
node kiduki.js      # KIDUKI_service_guide_202608.pptx を生成
node casetra.js     # CASETRA_platform_guide_202608.pptx を生成
python3 fix_ea_fonts.py KIDUKI_service_guide_202608.pptx CASETRA_platform_guide_202608.pptx
```

`fix_ea_fonts.py` は日本語（East Asian）フォント指定をテーマに補うための後処理。

## 設計ルール

- 色はブランドサイト準拠（KIDUKI: 深緑 `1D3A30`/`35664F`・金 `A97724`、CASETRA: `0F3D2E`/`1A4D3A`/`B45309`）
- フォント: 見出し=ヒラギノ明朝 ProN、本文=ヒラギノ角ゴ ProN
- 内部用語（二重請求・含有時間・充当・併売 等）を顧客向け文言に使わない
- KIDUKI資料でCASETRAを商品として説明しない（業務運用の一部としての言及と、FAQでの独立契約案内のみ）
- 価格・数値は `../../pricing-growth-canonical.md` が正本。変更時は README の規律に従う
