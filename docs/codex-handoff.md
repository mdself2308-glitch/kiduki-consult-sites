# Codex Handoff

Last updated: 2026-07-28

## Ready State

- Canonical GitHub repository is checked out locally.
- `consult/index.html` matches the live static homepage byte-for-byte at the
  initial setup commit.
- WordPress page and post inventory is available through the public REST API.
- Runtime authentication uses a revocable WordPress Application Password in
  macOS Keychain.
- Codex WordPress MCP v3 is configured with site IDs `clinic` and `kdk`; a new
  Codex task loads the updated server configuration.
- WordPress write scripts refuse to write unless apply, backup, and
  backup-confirmed gates are all present.

## Keychain

- KDK service: `codex.wordpress.kdkconslt-sngyouijm.com`
- KDK account: `kdk-sgj`
- Clinic service: `codex.wordpress.sleeprecovery-bancho.jp`
- Clinic account: `SRCB`
- Secrets: site-specific WordPress Application Passwords

Never display or copy the secret into documentation, `.env`, Codex config, or
chat.

## Known Current Risks Not Changed During Setup

- WordPress reports available updates.
- WordPress reports PHP 7.4.33 and recommends an upgrade.
- BackWPup reports leftover restore files that may contain sensitive database
  credentials.
- Several comments are pending moderation and appear to be spam.

These were observed only. They were not changed because the setup request did
not authorize maintenance, deletion, upgrades, or moderation.

## Next Entry

For a content request:

1. Identify static vs WordPress ownership.
2. Run `npm run verify` and `npm run wp:check`.
3. Pull the WordPress item when applicable.
4. Make the smallest source edit.
5. Dry-run.
6. Apply only when publication is explicitly requested.
7. Verify the public page at desktop and mobile widths.
