# CARD ARCADE

日本のトランプゲームを参加者9名で手分けして作り、Pull Request で1つのゲームセンターに統合する研修用リポジトリです。
チーム開発ではなく、**1人が1ゲームを調査から実装・テスト・PR・レビューまで最後まで担当**します。

**Claude Code × GitHub 共同開発ハンズオン — みんなでつくる CARD ARCADE**

```text
CARD ARCADE

[ ババ抜き     ]   [ 大富豪       ]   [ 神経衰弱     ]
[ ポーカー     ]   [ ぶたのしっぽ ]   [ スピード     ]
[ 七並べ       ]   [ ダウト       ]   [ ページワン   ]
```

研修開始時点では、9枚すべてが `[ COMING SOON ]` です。
各担当の Pull Request がマージされるたびに、実際に遊べるゲームへ変わります。

## 5分で始める

```powershell
git clone https://github.com/Daisuke0719/card_arcade.git
cd card_arcade
npm ci
npm run doctor    # 環境チェック（全部 OK になれば準備完了）
npm run dev       # http://localhost:5173 が開きます
```

Node.js 22 以上が必要です。`npm install` ではなく **`npm ci`** を使ってください。

## いちばん大事な1行

> **編集してよいのは `src/games/<自分のゲームID>/` の中だけ。**

例外はありません。範囲の外を編集しようとすると、その場でフックが止め、
Pull Request では CI が落ちてマージできません。
共通基盤の変更が必要だと思ったときは、自分で直さずに講師へ相談してください。

## 担当

| ゲームID | ゲーム | 担当 | 難易度 | Issue | ブランチ |
|---|---|---|---|---|---|
| `babanuki` | ババ抜き | 担当1 | 初級 | #1 | `feature/babanuki` |
| `daifugo` | 大富豪 | 担当2 | 上級 | #6 | `feature/daifugo` |
| `shinkeisuijaku` | 神経衰弱 | 担当3 | 初級 | #2 | `feature/shinkeisuijaku` |
| `poker` | ポーカー | 担当4 | 上級 | #8 | `feature/poker` |
| `butanoshippo` | ぶたのしっぽ | 担当5 | 初級 | #9 | `feature/butanoshippo` |
| `speed` | スピード | 担当6 | 中級 | #3 | `feature/speed` |
| `shichinarabe` | 七並べ | 担当7 | 中級 | #4 | `feature/shichinarabe` |
| `doubt` | ダウト | 担当8 | 中級 | #5 | `feature/doubt` |
| `pageone` | ページワン | 担当9 | 中級 | #10 | `feature/pageone` |

内訳は初級3・中級4・上級2です。担当の割り当ては `harness/config.json` が唯一の真実源で、
Issue・ラベル・雛形・画面の並び順はすべてそこから作られます。

お手本は `src/games/example-game/`（ハイ＆ロー）です。**実装を始める前に必ず読んでください。**

## 相互レビューはリング（1対1）

自分の Pull Request を見るのは1人だけ、自分も1人分だけをレビューします。

| 担当 | レビューする相手 | 自分をレビューする人 |
|---|---|---|
| 担当1（ババ抜き） | 担当2（大富豪） | 担当9 |
| 担当2（大富豪） | 担当3（神経衰弱） | 担当1 |
| 担当3（神経衰弱） | 担当4（ポーカー） | 担当2 |
| 担当4（ポーカー） | 担当5（ぶたのしっぽ） | 担当3 |
| 担当5（ぶたのしっぽ） | 担当6（スピード） | 担当4 |
| 担当6（スピード） | 担当7（七並べ） | 担当5 |
| 担当7（七並べ） | 担当8（ダウト） | 担当6 |
| 担当8（ダウト） | 担当9（ページワン） | 担当7 |
| 担当9（ページワン） | 担当1（ババ抜き） | 担当8 |

この輪は意図してこの順に組んであります。
**上級（大富豪・ポーカー）の担当がレビューするのは初級のゲーム**にして、実装が重い人のレビュー負担を下げています。
逆に**上級のゲームをレビューするのは、早く実装が終わる初級の担当**です。
レビューは差分を眺めるだけでは足りません。`gh pr checkout` で相手のブランチを取ってきて、
**実際に1回遊んでから**コメントします。手順は [docs/review-guide.md](docs/review-guide.md) にあります。

## 覚えるコマンドは3つ

```powershell
npm run dev      # 開発サーバー
npm test         # テスト
npm run verify   # 提出前の全部入りチェック（CI とまったく同じ内容）
```

`npm run verify` が緑になって初めて「できた」と言えます。

そのほか:

```powershell
npm run scaffold -- --game <ゲームID>   # 担当フォルダの雛形を作る
npm run scope                            # 担当範囲からはみ出していないか調べる
npm run doctor                           # 環境チェック
npm run status                           # 9人の進み具合（講師用）
```

1人開発なので、詰まっていることに気づけるのは自分と講師だけです。
15分進まなかったら Claude Code の `/stuck` で状況を整理し、そのまま講師に見せてください。
講師は中間チェックポイントで `npm run status` を投影して、遅れている人に個別に入ります。

## ドキュメント

| 読むもの | いつ |
|---|---|
| [docs/handson-steps.md](docs/handson-steps.md) | **当日はこれを上から順に** |
| [docs/game-plugin-guide.md](docs/game-plugin-guide.md) | ゲームを実装するとき（主教材） |
| [docs/games/](docs/games/) | ルールの正典。仕様で迷ったらここ |
| [docs/architecture.md](docs/architecture.md) | リポジトリの地図（15分） |
| [docs/github-workflow.md](docs/github-workflow.md) | Git / GitHub の操作と巻き戻し集 |
| [docs/claude-code-guide.md](docs/claude-code-guide.md) | Claude Code の使い方 |
| [docs/review-guide.md](docs/review-guide.md) | 相互レビューのとき |
| [docs/harness.md](docs/harness.md) | 「なぜ止められたのか」が分からないとき |
| [docs/troubleshooting.md](docs/troubleshooting.md) | エラーで詰まったとき（T-01〜） |
| [docs/instructor-guide.md](docs/instructor-guide.md) | 講師用 |
| [CLAUDE.md](CLAUDE.md) | Claude Code が毎回読む決まり |

## 構成

```text
src/
├─ core/          カード・山札・シャッフル・ターン・スコア（運営管理）
├─ components/    共通の画面部品（運営管理）
├─ app/           ルーティングとゲームの自動検出（運営管理）
├─ pages/         アーケード一覧とゲーム画面（運営管理）
└─ games/
   ├─ example-game/   お手本（運営管理）
   └─ <ゲームID>/     ← ここが自分の担当フォルダ

docs/       教材（運営管理）
tests/      契約テスト（運営管理）
scripts/    ハーネスと運営ツール（運営管理）
harness/    config.json = 担当とゲームの単一の真実源
```

## 技術

React 19 / TypeScript / Vite / Vitest / Testing Library / ESLint / GitHub Actions / GitHub Pages。
ランタイムの依存は `react` と `react-dom` だけです。**依存を追加しないでください。**

## ライセンス

社内研修用。
