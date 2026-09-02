# 手順書01 静的トップページを公開する（Runボタンを1回押すだけ）

作成: 2026-09-02 ／ 所要時間: 1分（＋公開まで約3分待つ）

## 何のため

トップページ（https://consult.kdkconslt-sngyouijm.com/ ）の新しいタイトル、見出し、「実務記事」のブロックを公開するためです。中身はもう出来ていて、パソコンの中にあります。**push（＝作った変更を公開用のサーバーへ送ること）**だけが残っています。

## やること

1. Claude Code のチャット画面で、私（Claude）が送った**黒い箱（コマンド）**を探します。箱の右上に **「Run」** というボタンがあります。
2. 「Run」を **1回だけ** 押します。
3. 文字がいくつか流れます。**最後の方に `main -> main` という文字が出れば成功**です。10〜20秒かかります。
4. チャットに **「押した」** と一言返してください。約3分後に、私が公開されたことを確認して報告します。

## 押す黒い箱（コマンド）

チャットで送ったものと同じです。ここから押しても構いません。

```bash
cd "/Users/dmmac/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyBrain/00-Projects/kdk-wordpress" && git add -A && git reset -q -- consult/return-to-work-pack/index.html consult/return-to-work-spot/index.html .claude/launch.json && git commit -q -F content/exact/commit-message-2026-09-02.txt && git push origin main
```

## うまくいかないとき

- 赤い文字で `rejected`、`Permission denied`、`Authentication failed`、`nothing to commit` などが出た場合は、**その文字をそのままコピーして、チャットに貼ってください。** 私が原因を調べて、次の一手を書きます。
- 「Run」ボタンが見えない場合は、黒い箱の上にマウスを乗せると出てきます。それでも無い場合は「Runが無い」と返してください。別の方法を書きます。

## これで何が変わるか

- 検索結果に出るトップページのタイトルが「東京の睡眠に特化した産業医事務所｜嘱託産業医・単発相談・産業衛生DX｜KIDUKIコンサルティング産業医事務所」になります。
- トップページの大きな見出しの下に「東京の、睡眠に特化した産業医事務所」の1行が入ります。
- 「よくあるご質問」の上に、記事4本へのリンク（実務記事）が並びます。
