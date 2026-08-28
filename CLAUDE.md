# CARD ARCADE

日本のトランプゲームを6チームで手分けして作り、Pull Request で1つのアーケードに統合する研修用リポジトリです。

## 絶対に守る5条

1. **編集してよいのは `src/games/<自分のゲームID>/` の中だけ。** 例外はありません。
2. **依存を追加しない。** `npm install <パッケージ>` は使いません。必要なものは `@core` と `@ui` に揃っています。
3. **他のチームのゲームフォルダを変更しない。**
4. **`src/core/` `src/components/` は運営管理。** 読むのは自由ですが、変更はできません。
5. **`npm run verify` が緑になるまで「できました」と言わない。**

範囲外を編集しようとするとフックが止め、Pull Request では CI が落ちてマージできません。
迂回策（`sed -i`、リダイレクト、`cp` での上書きなど）を探さないでください。
共通基盤の変更が必要だと判断した場合は、**手を止めて講師に相談する**のが正しい行動です。

## 自分の担当を知る

作業ブランチの名前が担当を表します。

```
feature/<ゲームID>     例: feature/babanuki
```

| ゲームID | ゲーム | 担当 | 難易度 |
|---|---|---|---|
| `babanuki` | ババ抜き | Team A | 初級 |
| `shinkeisuijaku` | 神経衰弱 | Team B | 初級 |
| `speed` | スピード | Team C | 中級 |
| `shichinarabe` | 七並べ | Team D | 中級 |
| `doubt` | ダウト | Team E | 中級 |
| `daifugo` | 大富豪 | Team F | 上級 |

`main` ブランチのまま実装を始めてはいけません。先に `git switch -c feature/<ゲームID>` を実行してください。

## コマンド（覚えるのはこの3つ）

```
npm run dev      開発サーバーを起動する
npm test         テストを実行する
npm run verify   提出前の全部入りチェック（CI とまったく同じ内容）
```

`npm run verify` は 範囲チェック → lint → 型チェック → テスト → ビルド を順に実行します。
**これが緑になって初めて「できた」と言えます。**

## ゲームフォルダの構成（5ファイル固定）

```
src/games/<ゲームID>/
├─ index.ts            ゲームの公開情報（GameManifest）。完成したら status を "ready" にする
├─ <Xxx>Game.tsx       画面。見た目と「時間」だけを担当する
├─ logic.ts            ルール。純粋関数だけを書く
├─ logic.test.ts       ロジックのテスト。ここが評価対象
└─ README.md           遊び方 / ルール / 実装メモ
```

必要なら `cpu.ts`（CPU の判断）、`types.ts`、`<Xxx>Game.module.css` を足してかまいません。

## いちばん大事な型

待ち時間のあるゲーム（CPU の手番、カードを裏返す演出）は、**必ず**この形にします。

```ts
// logic.ts — 時間の概念を持たない
export function reduce(state: S, action: A): S;
export function pendingDelayMs(state: S): number | null;  // 今、何ms後に自動処理が要るか
```

```tsx
// <Xxx>Game.tsx — 時間だけを担当する
useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
```

こうするとテストは `reduce` を順番に呼ぶだけになり、`setTimeout` を一切テストしなくて済みます。
お手本は `src/games/example-game/` にあります。**まずそこを読んでください。**

## コード規約

- 共通機能は `import { ... } from "@core"` と `import { ... } from "@ui"` だけで読み込む
  （`@core/deck` のような深い指定はできません）
- `logic.ts` と `cpu.ts` では `react` を import しない・`Math.random()` `Date.now()` `setTimeout` を使わない
  （乱数は引数で `Rng` を受け取り、テストでは `createRng(seed)` を渡します）
- 保存は `@core` の `useHighScore` / `gameKey` を使う（`localStorage` の直接利用は禁止）
- スタイルは CSS Modules。色や余白は `src/styles/tokens.css` の `--ca-*` を使い、直書きしない
- CPU は単純なルールベースで十分。凝った探索は作らない

## テストの書き方

正常系だけでなく、**壊れやすいところ**を必ず書きます。

- 境界値（同じ数字、最後の1枚、0枚）
- やってはいけない操作が弾かれること（判定中の二重クリック、出せないカードを出す）
- seed を固定した決定的なテスト

## 迷ったときの判断

- **仕様が曖昧** → Issue に書かれているルールが正です。Issue に無いことは「実装しない」を選びます。
- **共通基盤に手を入れたくなった** → 手を止めて講師に相談します。自分で直しません。
- **時間が足りない** → 発展課題を捨てて、Issue の必須要件だけに絞ります。
- **エラーの直し方が分からない** → `docs/troubleshooting.md` を見てから相談します。

## 実装を進める順番

1. `/kickoff <Issue番号>` … 調査と計画だけ（コードは書きません）
2. 人間が計画をレビューして合意する
3. `/implement` … 計画に沿って実装
4. `/verify` … `npm run verify` と Issue の完了条件の突き合わせ
5. `/pr` … Pull Request の説明文を作る

## 人間（参加者）が必ず自分で確認すること

AI の出力をそのまま信じないでください。次の4点は人間が確認します。

1. **実装計画** が Issue の要件と合っているか
2. **実機で遊べるか**（`npm run dev` で最初から最後まで1回プレイする）
3. **テストが仕様を確認しているか**（アサーションを1つわざと逆にして、赤くなることを見る）
4. **Pull Request の説明** が、自分の言葉で書かれているか
