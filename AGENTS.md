# KIDUKI Sites Agent Rules

This repository manages two different production surfaces.

## Production Surfaces

- Static homepage:
  - Source: `consult/index.html`
  - Public URL: `https://consult.kdkconslt-sngyouijm.com/`
  - Entry URL: `https://kdkconslt-sngyouijm.com/` redirects here.
  - Deployment: GitHub `main` -> Azure Static Web Apps.
- WordPress:
  - Admin/API origin: `https://kdkconslt-sngyouijm.com`
  - Theme: Emanon Premium.
  - Owns posts and non-home fixed pages.

Do not assume that a WordPress homepage edit changes the static homepage.

## Mandatory Safety Rules

- Never print, copy, commit, or store WordPress passwords, application
  passwords, cookies, Azure deployment tokens, or GitHub secrets in this
  repository.
- WordPress credentials must be read at runtime from macOS Keychain or an
  explicitly provided temporary environment variable.
- WordPress writes must use a repository script, start with a dry run, and
  create a pre-change backup.
- Do not push `main` unless the user explicitly requests production
  deployment. A push to `main` deploys both Azure Static Web Apps workflows.
- Do not edit WordPress core, Emanon Premium core files, or plugin files.
- Preserve unrelated changes. Do not use destructive Git commands.
- For visual changes, verify desktop and mobile rendering before reporting
  completion.

## First Read

Read these files before making site changes:

- `README.md`
- `docs/codex-quickstart.md`
- `docs/site-overview.md`
- `docs/codex-handoff.md`
