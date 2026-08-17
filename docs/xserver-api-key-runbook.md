# XServer APIキー発行手順（院長向け・1枚）

作成日: 2026-07-28
所要時間: 約5分

## 目的

Phase 1で、`kdkconslt-sngyouijm.com` のメールアカウント、DNS、DKIM、SPFだけをXServer公式API/MCPから操作するための一時APIキーを発行します。

## 発行手順

1. [XServerアカウント](https://secure.xserver.ne.jp/)へログイン
2. サービスメニューの **「APIキー管理」** を開く
3. **「APIキー追加」** をクリック
4. 次の内容で設定
   - キー名: `kiduki-phase1`
   - 対象サーバーアカウント: `kdk202308.xsrv.jp`
   - 有効期限: Phase 1完了予定日から数日後までの、選択可能な最短期間
   - 権限: **「カスタム」**
     - サーバー情報: 読み取り
     - DNSレコード設定: 読み取り・追加・変更
     - メールアカウント設定: 読み取り・追加
     - DKIM設定: 読み取り・更新
     - SPF設定: 読み取り・追加・更新
     - 上記以外: 付与しない
5. **「追加」／「発行」** を実行
6. 発行時に一度だけ表示される `xs_` で始まるAPIキーを安全に保存

## 受け渡し

- APIキーをチャット、メール、Git、スクリーンショットへ貼らない
- リポジトリ直下のGit除外済み `.env` に、次の変数名だけで保存する

```dotenv
XSERVER_API_KEY=発行された値
XSERVER_SERVERNAME=kdk202308.xsrv.jp
```

- `XSERVER_SERVERNAME` は `kdk202308.xsrv.jp` のまま変更しない。SPFに表示されるSMTPホスト名とは別物
- 保存後は「設定済み」とだけ連絡し、値は共有しない

## 発行後にCodexが最初に行うこと

1. APIキー情報と対象サーバー名を読み取りで検証
2. `kdkconslt-sngyouijm.com` のDNS・メール・DKIM・SPFを再取得
3. 各変更について変更前後の差分を提示
4. 院長の個別承認後にだけ変更を適用

## Phase 1完了後

XServerアカウントの **「APIキー管理」** で `kiduki-phase1` の3点メニューから **「削除」** を選び、利用終了後に失効させます。

## 公式資料

- [XServer APIマニュアル](https://www.xserver.ne.jp/manual/man_tool_api.php)
- [XServer MCP Serverマニュアル](https://www.xserver.ne.jp/manual/man_tool_mcp.php)
- [XServer APIリファレンス](https://developer.xserver.ne.jp/api/server/)
