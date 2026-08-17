# Codex Quickstart

## 1. 先に構成を判定する

変更対象がどちらかを必ず判断します。

| 対象 | 正本 | 公開方法 |
|---|---|---|
| トップページ | `consult/index.html` | `main` push後、Azure Static Web Apps |
| 無料相談ページ | `reserve/index.html` | `main` push後、Azure Static Web Apps |
| 下層固定ページ | WordPress REST API | `push-wordpress-content.mjs` |
| 投稿 | WordPress REST API | `push-wordpress-content.mjs` |

`https://kdkconslt-sngyouijm.com/` のWordPress固定ページID 18は本文がほぼ空です。公開トップは `consult/index.html` なので、固定ページID 18へトップ本文を送らないでください。

## 2. 作業開始時

```sh
git status --short --branch
npm run verify
npm run wp:check
```

WordPress認証情報はmacOS Keychainから読みます。標準ログインパスワードやCookieには依存しません。

## 3. WordPress編集

対象を取得します。

```sh
node tools/pull-wordpress-content.mjs --type page --id 24
```

編集ファイル:

```text
source/wordpress/page-24-office.html
```

反映前確認:

```sh
node tools/push-wordpress-content.mjs \
  --type page \
  --id 24 \
  --content source/wordpress/page-24-office.html \
  --dry-run
```

明示的な公開依頼がある場合だけ:

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

反映後:

```sh
npm run verify
```

見た目を変更した場合は、PC幅とスマホ幅でブラウザ確認します。

## 4. 静的トップ編集

編集対象:

```text
consult/index.html
```

確認:

```sh
npm run verify:static
```

`main` pushは本番デプロイです。ユーザーが公開まで依頼した場合だけ、意図した差分をcommitしてpushします。

## 5. 戻し方

WordPress更新前の完全レスポンスは `backups/` に保存されます。復元時も、復元前の状態をもう一度バックアップします。

```sh
node tools/push-wordpress-content.mjs \
  --type page \
  --id 24 \
  --from-backup backups/wp-page-24-before-YYYY-MM-DDTHH-MM-SS-sssZ.json \
  --apply \
  --backup \
  --backup-confirmed
```

静的トップはGitの履歴から戻しますが、ユーザーの他の変更を巻き戻さないよう対象ファイルだけを扱います。

## 6. やってはいけないこと

- パスワードやApplication Passwordを表示・保存・commitしない。
- dry-runなしでWordPressを更新しない。
- バックアップなしでWordPressを更新しない。
- WordPress固定ページID 18を静的トップの代わりとして更新しない。
- Emanon Premiumやプラグイン本体を直接編集しない。
- 公開依頼なしに`main`へpushしない。
