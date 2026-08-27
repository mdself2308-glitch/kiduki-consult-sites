# Site Overview

Last verified: 2026-08-27

## Architecture

```text
https://kdkconslt-sngyouijm.com/
  └─ 301 -> https://consult.kdkconslt-sngyouijm.com/
              └─ Azure Static Web Apps
                  └─ GitHub main / consult/

https://kdkconslt-sngyouijm.com/{other-path}/
  └─ WordPress / Emanon Premium
```

## Static Web Apps

### Main consultation homepage

- Azure resource: `kiduki-consult-swa`
- Resource group: `rg-kiduki-consult-sites`
- SKU: Free
- Default hostname: `gentle-pond-00de74b00.2.azurestaticapps.net`
- Custom domain: `consult.kdkconslt-sngyouijm.com`
- GitHub repository: `mdself2308-glitch/kiduki-consult-sites`
- Branch: `main`
- Source directory: `consult`
- Workflow: `.github/workflows/azure-static-web-apps-gentle-pond-00de74b00.yml`

### Free consultation page

- Source directory: `reserve`
- Workflow: `.github/workflows/azure-static-web-apps-delightful-rock-0b1b91000.yml`
- Public URL: `https://reserve.kdkconslt-sngyouijm.com/`

## WordPress

- Origin: `https://kdkconslt-sngyouijm.com`
- Theme: Emanon Premium
- Public fixed pages observed: 18
- Public posts observed: 36
- Front page placeholder: page ID 18, slug `home`
- Main page IDs:
  - 24: 事務所について
  - 29: サービス｜睡眠に特化した産業医業務と産業衛生DX
  - 31: 睡眠に特化した産業医業務
  - 37: 旧お問い合わせ（`/contact/`へ301）
  - 39: よくあるご質問
  - 43: 代表者紹介｜宮部大輔
  - 160: 睡眠に特化した嘱託産業医
  - 162: 既存の産業医体制に加える睡眠支援
  - 164: 単発相談｜睡眠課題・復職判定面談
  - 166: 産業衛生DX・Casetra
  - 250: POLICY
  - 332: 事務所概要
  - 1030: 記事｜睡眠×産業衛生DX
  - 1038: News 新着情報

## Operational Boundary

- Top page copy/design changes: edit Git source.
- WordPress page/post changes: use authenticated REST scripts.
- Menus, widgets, Emanon settings, snippets, plugins, users, and server settings
  are outside routine content updates and require a specific request.
- Primary navigation and footer use the same six labels: 事務所について、
  睡眠に特化した産業医業務、産業衛生DX・Casetra、単発相談、記事、
  お問い合わせ。
