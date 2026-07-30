# KIDUKIコンサルティング産業医事務所 サイト管理

このリポジトリは、事務所サイトの静的トップページとWordPress下層ページを安全に管理する作業フォルダです。

## 現在の構成

- 入口URL: `https://kdkconslt-sngyouijm.com/`
- 静的トップ: `https://consult.kdkconslt-sngyouijm.com/`
- 静的トップのソース: `consult/index.html`
- WordPress管理画面: `https://kdkconslt-sngyouijm.com/wp-admin/`
- WordPressテーマ: Emanon Premium
- 無料相談ページのソース: `reserve/index.html`

トップページだけはWordPressではありません。入口URLからAzure Static Web Appsの静的トップへ転送されています。投稿と下層固定ページはWordPressが管理します。

## 最初に実行する確認

```sh
npm run verify
npm run wp:check
```

`wp:check` はmacOS Keychainの専用アプリケーションパスワードを実行時に読みます。パスワードは標準出力へ表示しません。

## WordPressページの取得

```sh
node tools/pull-wordpress-content.mjs --type page --id 24
node tools/pull-wordpress-content.mjs --type post --id 1598
```

取得した編集用HTMLは `source/wordpress/`、取得時点の完全バックアップは `backups/` に保存されます。`backups/` はGit管理外です。

## WordPressページの更新

必ず最初にdry-runします。

```sh
node tools/push-wordpress-content.mjs \
  --type page \
  --id 24 \
  --content source/wordpress/page-24-office.html \
  --dry-run
```

公開反映は、ユーザーの明示依頼があるときだけ行います。

```sh
node tools/push-wordpress-content.mjs \
  --type page \
  --id 24 \
  --content source/wordpress/page-24-office.html \
  --status publish \
  --apply \
  --backup \
  --backup-confirmed
```

`--apply --backup --backup-confirmed` の3つが揃わない限り、WordPressへ書き込みません。

## 静的トップページの更新

`consult/index.html` を編集し、ローカル検証とブラウザ確認を行います。ローカルコミットだけでは本番へ反映されませんが、`main` へのpushはGitHub Actions経由でAzure本番へ自動デプロイされます。

```sh
npm run verify:static
```

`verify:static` はローカルHTMLの必須要素と公開先の応答を確認します。現在の公開HTMLと完全一致することまで確認する場合は `npm run verify:live-match` を使います。

本番反映を依頼されていない場合は、commitやpushを行いません。

## 認証情報

- WordPressのログインパスワードは使いません。
- Codex専用の取り消し可能なWordPressアプリケーションパスワードを使います。
- 保存先はmacOS Keychainです。
- サービス名: `codex.wordpress.kdkconslt-sngyouijm.com`
- リポジトリ、`~/.codex/config.toml`、チャットには保存しません。
- クリニック側のWordPress認証も同じ方式へ移行し、MCP起動時に両サイトをキーチェーンから読みます。

詳しい手順は `docs/codex-quickstart.md` を参照してください。

## 問い合わせフォームの定期確認

- 毎週月曜に `/contact/` からテスト送信を1件行い、FlamingoへのDB保存、通知メール2宛先への着信、自動返信の着信を確認します。
- 月1回、Flamingoの受信メッセージ件数と通知メールの受信件数を突き合わせ、欠落がないことを確認します。
- フォームが停止している場合も、ページ下部の `info@kdkconslt-sngyouijm.com` への直通メール案内は常設します。
