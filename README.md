# CARD ARCADE

日本のトランプゲームを6チームで手分けして作り、Pull Request で1つのゲームセンターに統合する研修用リポジトリです。

**Claude Code × GitHub 共同開発ハンズオン — みんなでつくる CARD ARCADE**

```text
CARD ARCADE

[ ババ抜き ]   [ 神経衰弱 ]
[ スピード ]   [ 七並べ ]
[ ダウト ]     [ 大富豪 ]
```

研修開始時点では、6枚すべてが `[ COMING SOON ]` です。
各チームの Pull Request がマージされるたびに、実際に遊べるゲームへ変わります。

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

| ゲームID | ゲーム | 担当 | 難易度 | ブランチ |
|---|---|---|---|---|
| `babanuki` | ババ抜き | Team A | 初級 | `feature/babanuki` |
| `shinkeisuijaku` | 神経衰弱 | Team B | 初級 | `feature/shinkeisuijaku` |
| `speed` | スピード | Team C | 中級 | `feature/speed` |
| `shichinarabe` | 七並べ | Team D | 中級 | `feature/shichinarabe` |
| `doubt` | ダウト | Team E | 中級 | `feature/doubt` |
| `daifugo` | 大富豪 | Team F | 上級 | `feature/daifugo` |

お手本は `src/games/example-game/`（ハイ＆ロー）です。**実装を始める前に必ず読んでください。**

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
npm run status                           # 6チームの進み具合（講師用）
```

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
   └─ <ゲームID>/     ← ここが各チームの担当

docs/       教材（運営管理）
tests/      契約テスト（運営管理）
scripts/    ハーネスと運営ツール（運営管理）
harness/    config.json = チームとゲームの単一の真実源
```

## 技術

React 19 / TypeScript / Vite / Vitest / Testing Library / ESLint / GitHub Actions / GitHub Pages。
ランタイムの依存は `react` と `react-dom` だけです。**依存を追加しないでください。**

## ライセンス

社内研修用。
