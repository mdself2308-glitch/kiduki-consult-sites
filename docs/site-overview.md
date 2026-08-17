# Site Overview

Last verified: 2026-07-28

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
- Public fixed pages observed: 16
- Public posts observed: 34
- Front page placeholder: page ID 18, slug `home`
- Main page IDs:
  - 24: 事務所について
  - 29: Support
  - 31: 当事務所の特色について
  - 37: お問い合わせ
  - 39: よくあるご質問
  - 43: ご挨拶
  - 160: 産業医委任
  - 162: 顧問医委任
  - 164: スポット産業医
  - 166: クラウド産業衛生
  - 250: POLICY
  - 332: 事務所概要
  - 1030: コラム／Column記事
  - 1038: News 新着情報

## Operational Boundary

- Top page copy/design changes: edit Git source.
- WordPress page/post changes: use authenticated REST scripts.
- Menus, widgets, Emanon settings, snippets, plugins, users, and server settings
  are outside routine content updates and require a specific request.
