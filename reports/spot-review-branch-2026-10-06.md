# SPOT公開準備ブランチの分離と検証

確認日: 2026-10-06（Asia/Tokyo）
ブランチ: `codex/spot-launch-20261008`
分離元: `main` / `36810d3afd0eb815cbb3d0b95b346bd1787a5dd5`
案件票: [CT-20261006](../content/tasks/CT-20261006-kiduki-spot-self-service-booking.md)

今回のSPOT予約UI、利用条件、home/既存単発ページの導線、WordPress164のローカル本文、検証、関連文書と合成データのQA証跡を明示したallowlistで別worktreeへ移した。公開、本番受付、実予約・決済・メール、WordPress反映を示す記録ではない。

## 分離時に保持したもの

- 元チェックアウトのブランチ・既存変更・ステージ状態は変更せず、ファイル単位のハッシュを確認してコピーした。
- homeは既存HEADの非同期Google Fonts読込とfooter文字色を保持。owner READMEは新SPOT項目だけを追加し、9月の承認・公開状態はHEADを維持。
- page160、旧SEO記事台帳・9月案件票・過去SEO報告、PHP、未関連ファイル、workflowは含めていない。
- 新SEO報告書にある過去のmilestone/growthレポート参照は元作業フォルダ内の履歴資料であり、今回の分離ブランチへ本文を移していない。実装・validatorの実行依存はない。
- 移植後に発見した既存home validatorのURL誤検出を修正。旧WordPress originのみを検査し、正しいconsultサブドメインの `/spot/` を拒否しない。元チェックアウトへも同じ1行だけ反映した。

## 検証

| 確認 | 結果 |
| --- | --- |
| 新SPOT launch/source + 隔離VM runtime | 30項目PASS。専用GA4未設定を明示し `releaseReady=false` |
| conversion source | 39項目PASS |
| SPOT source | 17項目PASS |
| homeの既存contact runtime | 5項目PASS |
| 既存conversion runtime | 8項目PASS |
| home source + 公開GET | 20項目PASS、公開HTTP200。ソース一致・新版公開の確認ではない |
| Tier S案件票 draft検証 | PASS、review状態維持 |
| 独立文言レビュー | funnel担当が対象5面・中央catalog・JSを照合しP1/P2指摘なし |
| 秘密値の混入確認 | 追加・対象テキストの資格情報パターン照合で候補なし。画像は公開画面または合成データ |
| diff check | PASS |

homeは390/860/1440px、利用条件は390/1440pxで表示確認し、横はみ出しなし。homeの予約CTAから `/spot/` への遷移も確認した。ローカル確認用CSPで外部スクリプト/API通信を遮断し、予約画面のAPI取得失敗時は未申込の説明と再読込操作が表示された。カタログ・入力・確定の成功系は既存の[完全mock QA](casetra-calcom-audit-evidence-2026-10-06/spot-ui/results.json)および[計測回帰](casetra-calcom-audit-evidence-2026-10-06/spot-analytics/results.json)を参照する。

画面: [home 390](casetra-calcom-audit-evidence-2026-10-06/isolation-ui/home-390.png)、[home 860](casetra-calcom-audit-evidence-2026-10-06/isolation-ui/home-860.png)、[home 1440](casetra-calcom-audit-evidence-2026-10-06/isolation-ui/home-1440.png)、[terms 390](casetra-calcom-audit-evidence-2026-10-06/isolation-ui/terms-390.png)、[terms 1440](casetra-calcom-audit-evidence-2026-10-06/isolation-ui/terms-1440.png)。

## 公開との境界

既存のサイトworkflowはmain pushとPRイベントでAzure Static Web Appsへ配信する。今回の許可範囲は専用ブランチのpushまでで、サイトPR作成・main merge・workflow dispatch・deployは行わない。API/PortalのPRとは動作が異なり、draft PRでも公開previewを作り得る。

WordPress164はローカルソースを含めたのみ。実反映は既存のdry-run・backup・apply・公開読戻しの工程で別に扱う。専用Cal設定、Stripe/バックエンド接続、医師記録から意見書送付までの実環境受入、任意GA4設定・実受信は親タスクの引継ぎで追跡する。
