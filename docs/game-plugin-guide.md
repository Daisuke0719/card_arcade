# ゲームの作り方

担当ゲームを実装している間、いちばん開くファイルです。
**上から順にやれば、`npm run verify` が緑になるところまで一本道**で進みます。

先に読んでおくもの（このファイルはその続きです）。

- `CLAUDE.md` … 絶対に守る5条とコマンド
- `src/games/CLAUDE.md` … ファイルの役割と `@core` / `@ui` の早見表
- `docs/games/<ゲームID>.md` … あなたのゲームのルールの正典
- **`src/games/example-game/`** … お手本。このページのコードはすべてそこの実物です

ルールで迷ったら `docs/games/<ゲームID>.md`、**作り方で迷ったらこのページ**です。

## 担当とゲームID

参加者は9人。**1人が1ゲームを最後まで担当します。**
調査・実装・テスト・Pull Request・レビューを、途中で交代せずに1人でやります。

| 担当 | ゲームID | ゲーム | 難易度 | Issue | ブランチ |
|---|---|---|---|---|---|
| 担当1 | `babanuki` | ババ抜き | 初級 | #1 | `feature/babanuki` |
| 担当2 | `daifugo` | 大富豪 | 上級 | #6 | `feature/daifugo` |
| 担当3 | `shinkeisuijaku` | 神経衰弱 | 初級 | #2 | `feature/shinkeisuijaku` |
| 担当4 | `poker` | ポーカー | 上級 | #8 | `feature/poker` |
| 担当5 | `butanoshippo` | ぶたのしっぽ | 初級 | #9 | `feature/butanoshippo` |
| 担当6 | `speed` | スピード | 中級 | #3 | `feature/speed` |
| 担当7 | `shichinarabe` | 七並べ | 中級 | #4 | `feature/shichinarabe` |
| 担当8 | `doubt` | ダウト | 中級 | #5 | `feature/doubt` |
| 担当9 | `pageone` | ページワン | 中級 | #10 | `feature/pageone` |

この表の正は `harness/config.json` です。ゲームID・難易度・Issue 番号・雛形の中身は
すべてそこから作られているので、迷ったらそのファイルを見てください。

**9ゲームとも、下に書いてある同じ手順で作れます。** ゲームごとに特別な作り方はありません。

## 全体像

```text
   git switch -c feature/<ゲームID>
            |
   npm run scaffold -- --game <ゲームID>
            |   5ファイルの雛形ができる（この時点で npm test は通る）
            v
 (1) logic.ts        State と Action を決めて reduce を書く   <- いちばん大事
            |        待ち時間は pendingDelayMs(state) で表す
            v
 (2) logic.test.ts   reduce を順番に呼ぶだけでテストが書ける
            |        正常系 / 境界値 / 異常系
            |
            +---> ルールを直したら (1) に戻る。ここを何周かする
            v
 (3) <Xxx>Game.tsx   GameShell で包み、@ui の部品を並べる
            |        時間の扱いは useCpuTurn の1行だけ
            v
 (4) index.ts        howToPlay を書く / 最後に status を "ready" に
            |
            v
 (5) npm run dev で最後まで1回遊ぶ  ->  npm run verify が緑
```

大事なのは **(1) と (2) を先にやり切ってから (3) に進む**ことです。
画面から作り始めると、勝敗の判定が `.tsx` に混ざってテストが書けなくなります。

## 1. 雛形を作る

### ブランチを先に作る

`main` のまま実装を始めてはいけません。

```powershell
git switch -c feature/babanuki
```

`feature/<ゲームID>` の形にします。範囲チェックはこのブランチ名を見て、
「あなたが触ってよいフォルダ」を判断します。

### 雛形を生成する

```powershell
npm run scaffold -- --game babanuki
```

`--` を忘れないでください（`npm` に引数を渡すための区切りです）。
何が作られるか先に見たいときは `--dry-run` を足します。

```powershell
npm run scaffold -- --game babanuki --dry-run
```

ゲームIDを忘れたら、引数なしで実行すると9ゲームの一覧が出ます。

```powershell
npm run scaffold
```

### 生成される5ファイル

`src/games/<ゲームID>/` に次の5つができます。役割は混ぜません。

| ファイル | 何を書くか | 書いてはいけないもの |
|---|---|---|
| `logic.ts` | ルール・状態遷移（純粋関数） | react / 乱数 / 時間 / DOM |
| `logic.test.ts` | ロジックのテスト。**ここが評価対象** | — |
| `<Xxx>Game.tsx` | 画面と時間（`useCpuTurn`） | 勝敗の判定 |
| `index.ts` | `export const game: GameManifest` だけ | 関数・JSX |
| `README.md` | 遊び方 / 採用したルール / 実装メモ | — |

必要なら `cpu.ts`（CPU の判断）、`types.ts`、`<Xxx>Game.module.css` を足してかまいません。
**この5つは消さないでください。**契約テストが存在を確認しています。

各ファイルの先頭には `@scaffold:untouched` という印が入っています。
実装を始めたらこの行は消してかまいません（消したファイルは `--force` でも上書きされません）。

### 生成直後にテストが通ることを確認する

```powershell
npm test
```

雛形の `logic.test.ts` には最初から3件のテストが入っていて、**この時点で緑になります**。

```ts
it("最初は52枚の山札から始まる", () => {
  const state = createInitialState(1);
  expect(state.deck).toHaveLength(52);
  expect(isGameOver(state)).toBe(false);
});
```

ここが赤いなら、環境の問題です。先に `npm run doctor` を実行してください。
緑を確認できたら、**この3件を書き換えながら**自分のゲームのテストにしていきます。
