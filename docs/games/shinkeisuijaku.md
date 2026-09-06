# 神経衰弱（shinkeisuijaku）

| 項目             | 値                          |
| ---------------- | --------------------------- |
| ゲームID         | `shinkeisuijaku`            |
| 担当             | 担当3                       |
| 難易度           | 初級                        |
| ブランチ         | `feature/shinkeisuijaku`    |
| フォルダ         | `src/games/shinkeisuijaku/` |
| コンポーネント名 | `ShinkeisuijakuGame`        |

編集できるのは `src/games/shinkeisuijaku/` の中だけです。

この文書に記載したルールを実装します。記載のないローカルルールは追加しません。

## ゲームの概要

裏向きに並んだ16枚のカードを2枚ずつめくり、同じ数字のペアをすべてそろえるソロゲームです。
何回でそろえられたか（手数）が成績になります。

## プレイ構成

- **人数**: 1人（ソロ）。CPU も対戦相手もいません。`minPlayers` / `maxPlayers` はどちらも `1` です。
- **使うカード**: 52枚（`createDeck()`）のうち **8ランク × 2枚 = 16枚**だけを使います。ジョーカーは使いません。
- **配り方**: 13種類のランクからランダムに8ランクを選び、選んだランクごとにカードを2枚ずつ取り出します。
  その16枚をシャッフルして、**4列 × 4行**に裏向きで並べます（位置は 0〜15、左上から右へ数えます）。
- 山札と手札はなく、場に並んだ16枚がゲームの盤面です。

## 採用するルール

- 開始時、16枚はすべて裏向きです。
- プレイヤーは裏向きのカードを1枚クリックしてめくります。1回にめくれるのは2枚までです。
- 2枚めくった直後は**判定中**になり、`REVEAL_DELAY_MS = 800`（ミリ秒）の間、次のカードをめくれません。
  この間のクリックは無視し、状態を変更しません。
- 判定中が明けたとき、
  - 2枚が同じランクならペア成立です。その2枚は表向きのまま場に残り、以後は選べません。
  - 2枚が違うランクなら、両方とも裏向きに戻します。
- **ペアが成立したときも、しなかったときも、同じ 800ms だけ判定中になります。**
  ペアの場合だけ待ち時間を省く分岐は作りません。
- ペア判定は**ランクだけ**で行います。スートや色は関係ありません（ハートの7とスペードの7はペアです）。
- 次のカードは選べません。クリックしても何も起きません。
  - すでにペアが成立して表向きになっているカード
  - いま自分がめくったばかりのカード（1枚目と同じ場所をもう一度クリックする操作）
  - 盤面の範囲外（0〜15 以外）の位置
- **手数**は、2枚めくった時点で1増えます。1枚目をめくっただけでは増えません。
- 8ペアすべてがそろった時点でゲーム終了です。結果に**手数**を表示します。
- 「もう一度」を押すとランクを選び直して配置し直し、手数を0に戻します。
  `reset` のたびにseedを変えます。

## 今回は実装しないルール

今回採用しないローカルルールを次に示します。

| ローカルルール                                     | 今回の扱い                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| スート（マーク）まで一致して初めてペア             | **実装しない。** ペアは同じランクなら成立。色・スートは無関係       |
| 同じ色のペアだけ有効（赤同士・黒同士）             | **実装しない。** 上と同じ理由                                       |
| ペアを取ったら続けてもう一度めくれる（連続めくり） | **実装しない。** ソロなので手番の概念がなく、常に「2枚めくって1手」 |
| 2人以上で交互にめくり、取った枚数を競う            | **実装しない。** ソロ専用                                           |
| CPU と対戦する                                     | **実装しない。** 発展課題（`cpu.ts` は必須ファイルではありません）  |
| 52枚（26組）すべてを並べる                         | **実装しない。** 8組16枚に固定                                      |
| ジョーカーを混ぜる                                 | **実装しない。** `createDeck()` の52枚からのみ選びます              |
| 制限時間つき・タイムアタック                       | **必須にしない。** 経過時間の表示は発展課題                         |
| 3枚めくって3枚同ランクを狙う                       | **実装しない。** 1回にめくれるのは常に2枚まで                       |
| 開始時に全部を一瞬だけ見せる（お試し表示）         | **実装しない。** 最初から全部裏向き                                 |

## 必須要件（Issue にそのまま載る）

- [ ] `createInitialState(seed)` が、8ランク × 2枚 = 16枚をシャッフルして裏向きに並べた初期状態を返す
- [ ] 16枚が画面に **4列 × 4行**で裏向きに並ぶ
- [ ] 裏向きのカードをクリックすると表向きになる
- [ ] 2枚めくると判定中になり、**3枚目はめくれない**（連打しても状態が変わらない）
- [ ] 同じランクの2枚はペアが成立し、表向きのまま場に残る
- [ ] 違うランクの2枚は `REVEAL_DELAY_MS`（800ms）後に両方とも裏向きに戻る
- [ ] ペア成立済みのカードと、めくったばかりのカードはクリックしても何も起きない
- [ ] 2枚めくるごとに手数が1増え、画面に表示される
- [ ] 8ペアすべてがそろうとゲームが終わり、手数を含む結果が表示される
- [ ] `logic.test.ts` に「必須テスト」7件があり、`npm run verify` が成功する

## 実装の進め方

最初に、ゲームを最後まで操作できる状態を作ります。
その後、ブラウザで動作を確認しながら、残りの要件を実装します。
進行状況は Issue のチェックリストで確認し、不明点があれば講師に相談してください。

### 第1段階 — ゲームを最後まで操作できる状態にする

ルールは `logic.ts` に純粋関数として書き、画面は `ShinkeisuijakuGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. 定数と型を置く: `REVEAL_DELAY_MS` / `PAIR_COUNT` / `Phase` / `ShinkeisuijakuState` / `ShinkeisuijakuAction`
2. `createInitialState(seed)`: 8ランクを選んで16枚を作り、シャッフルして並べる
3. `flipCard(state, index)`: 1枚めくる。選べないカードの場合は `state` をそのまま返す
4. `resolveFlip(state)`: 判定中を解決する。ペアなら `matched` へ、違えば裏に戻す
5. `isGameOver(state)` / `pendingDelayMs(state)` / `reduce(state, action)`
6. `useReducer(reduce, undefined, () => createInitialState(...))` で状態を持つ
7. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));` を1行だけ記述する
8. 16枚を `Card` で4列に並べ、`face` を1枚ごとに切り替える
9. 手数を表示し、終了したら `ResultModal` を出す

ブラウザを再読み込みし、最初から最後まで1回操作できることを確認したら、第1段階は完了です。
`logic.ts` に関数を追加したら、`logic.test.ts` にもテストを追加し、`it(` を3件以上にします。

### 第2段階 — 残りの要件を実装する

1. 「必須テスト」に挙げた7件をすべて書く
2. 無効な操作のテストを追加する（判定中の3枚目 / ペア済みの再クリック / 同じ場所の2回クリック）
3. `README.md` を書く（遊び方 / 採用したルール / 実装メモ）
4. `index.ts` の `status` を `"ready"` にする
5. `npm run verify` を実行し、成功を確認する

## 状態の設計（雛形）

`logic.ts` に置く型と関数のシグネチャを示します。各関数の実装は含まれていません。

```ts
import type { PlayingCard, Rng } from "@core";

/** 2枚めくってから確定するまでの時間。UI はこの値を参照するだけ。 */
export const REVEAL_DELAY_MS = 800;

/** そろえるペアの数。8組16枚。 */
export const PAIR_COUNT = 8;

/**
 * idle        … 0枚めくっている（入力待ち）
 * one-flipped … 1枚めくっている（入力待ち）
 * judging     … 2枚めくって判定中（この間の入力はすべて無視する）
 */
export type Phase = "idle" | "one-flipped" | "judging";

export type ShinkeisuijakuState = {
  /** 4x4 に並べた16枚。index 0..15 が左上から右下。 */
  readonly board: readonly PlayingCard[];
  /** いまめくっている札の位置。0個 / 1個 / 2個。 */
  readonly flipped: readonly number[];
  /** ペアが成立して表のまま残っている札の位置。 */
  readonly matched: readonly number[];
  readonly phase: Phase;
  /** 2枚めくるたびに1増える。 */
  readonly moves: number;
  readonly seed: number;
};

export type ShinkeisuijakuAction =
  | { readonly type: "flip"; readonly index: number }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/** 8ランクを選んで各2枚、計16枚を作ってシャッフルする。乱数は引数で受け取る。 */
export function createBoard(rng: Rng): PlayingCard[];

/** 最初の状態。seed を固定すると毎回同じ配置になる（テスト用）。 */
export function createInitialState(seed?: number): ShinkeisuijakuState;

/** 1枚めくる。選べない位置なら state をそのまま返す。 */
export function flipCard(state: ShinkeisuijakuState, index: number): ShinkeisuijakuState;

/** 判定中を解決する。ペアなら matched へ、違えば両方を裏に戻す。 */
export function resolveFlip(state: ShinkeisuijakuState): ShinkeisuijakuState;

/** 8ペアそろったか。 */
export function isGameOver(state: ShinkeisuijakuState): boolean;

/** 今、何ミリ秒後に自動処理が要るか。null は人間の入力待ち。 */
export function pendingDelayMs(state: ShinkeisuijakuState): number | null;

/** 状態 + 行動 -> 新しい状態。 */
export function reduce(
  state: ShinkeisuijakuState,
  action: ShinkeisuijakuAction,
): ShinkeisuijakuState;
```

### 判定待ちの状態を実装する

判定中に3枚目をめくれないようにするには、`flipCard` の先頭で状態を確認します。

```ts
if (state.phase === "judging") return state;
```

この条件をテストし、判定中に状態が変わらないことを確認します。
判定は `.tsx` 側の `disabled` だけに任せず、`logic.ts` に記述します。

`pendingDelayMs` は次の1行でかまいません。

```ts
return state.phase === "judging" ? REVEAL_DELAY_MS : null;
```

## 使う @core / @ui

`@core` と `@ui` で公開されているAPIを使用します。

### @core

| 名前                                                          | 用途                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| `createDeck`                                                  | 52枚を作る。ここから8ランク分だけ取り出す                     |
| `RANKS`                                                       | 13種類のランク一覧。ここからランダムに8つ選ぶ                 |
| `groupByRank`                                                 | 52枚をランクごとにまとめ、各ランクから2枚だけ取り出すのに使う |
| `createRng`                                                   | seed からの乱数を作る。同じ seed なら同じ配置になる           |
| `shuffle`                                                     | 16枚を並べ替える。第2引数に `createRng(seed)` を渡す          |
| `sameRank`                                                    | めくった2枚が同じランクかを判定する                           |
| `useCpuTurn`                                                  | `pendingDelayMs` の値だけ待って `tick` を送る                 |
| `card` / `hand`                                               | テスト用の盤面を作る（`card("spades", "7")`）                 |
| `PlayingCard` / `Rng` / `GameManifest` / `GameComponentProps` | 型                                                            |

### @ui

| 名前          | 用途                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| `GameShell`   | ゲーム画面の共通レイアウト（遊び方は `manifest.howToPlay` から自動表示される） |
| `Card`        | 場札1枚。`face="down"` のときはカードの内容をDOMに含めない                     |
| `ScoreBoard`  | 手数の表示。`GameShell` の `headerRight` に差し込む                            |
| `ResultModal` | クリア時の結果表示。`score` に「12手」を渡す                                   |
| `Button`      | 追加の操作が要るときだけ（「もう一度」は `GameShell` の `onReset` で出ます）   |

### 4x4 の並べ方についての注意

`Hand` の `layout="grid"` は**16枚すべてに同じ `face` を渡す**作りです。
神経衰弱では表向きと裏向きのカードが混在するため、`Hand` ではなく `Card` を16個並べます。

```tsx
<div className={styles.board}>
  {state.board.map((c, index) => (
    <Card
      key={c.id}
      card={c}
      face={isFaceUp(state, index) ? "up" : "down"}
      onClick={() => dispatch({ type: "flip", index })}
    />
  ))}
</div>
```

4列にするのは `ShinkeisuijakuGame.module.css` の
`display: grid; grid-template-columns: repeat(4, max-content);` だけで足ります。
色や余白には `src/styles/tokens.css` の `--ca-*` を使用します。

## 必須テスト

`logic.test.ts` に、次の7件を記載の名前で作成します。

```ts
it("裏向きのカードをめくると表になる");
it("2枚めくった判定中は3枚目をめくれない");
it("ペア成立済みのカードとめくり済みのカードは選べない");
it("2枚めくると手数が1増える");
it("同じランクの2枚はペアになって表のまま残る");
it("違うランクの2枚は両方とも裏に戻る");
it("8ペアすべてそろうとゲームが終わる");
```

| テスト                                             | 確認する内容                                           |
| -------------------------------------------------- | ------------------------------------------------------ |
| 裏向きのカードをめくると表になる                   | 基本操作。`flipCard` が `flipped` に位置を追加すること |
| 2枚めくった判定中は3枚目をめくれない               | 判定待ちの状態で入力を受け付けないこと                 |
| ペア成立済みのカードとめくり済みのカードは選べない | ペア成立済みや選択済みのカードを再度選べないこと       |
| 2枚めくると手数が1増える                           | 手数の数え方（1枚目では増えない）。成績の正しさ        |
| 同じランクの2枚はペアになって表のまま残る          | ペア判定がランクだけで行われ、スートに影響されないこと |
| 違うランクの2枚は両方とも裏に戻る                  | ペアが成立しない場合に2枚とも裏向きへ戻ること          |
| 8ペアすべてそろうとゲームが終わる                  | 8ペアがそろった時点で終了すること                      |

テスト作成時の注意:

- 判定中の解決は `reduce(state, { type: "tick" })` を呼びます。`setTimeout` 自体はテストしません。
- 盤面は `createInitialState(1)` でseedを固定するか、`card("spades", "7")` で明示的に作成します。
- 必須テストの完了後、「同じ seed なら同じ配置になる」も追加できます。

## 発展課題

必須要件を満たし、`npm run verify` が成功してから発展課題に着手します。いずれも共通基盤を変更せずに実装できます。

- **経過時間の表示**: `useElapsedMs(running)` の値を `Timer` に渡す
- **ベスト手数の保存**: `useHighScore(manifest.id, "lower-is-better")` を使う。手数が少ない記録を上位として扱う
  （`localStorage` の直接利用は禁止です）
- **難易度の切り替え**: `PAIR_COUNT` を 6 / 8 / 10 から選べるようにする（列数も合わせて変える）
- **めくり演出**: CSS Modules の `transform: rotateY(180deg)` でカードが回るようにする
- **ミスの記録**: 同じ場所を複数回めくった回数を数えて `LogPanel` に表示する
- **結果メッセージ**: 手数に応じたメッセージを `ResultModal` の `message` に表示する
- **CPU 対戦**: `cpu.ts` に、一定の確率でめくった場所を記憶する CPU を実装する
  （記憶率は `Rng` で表現し、純粋関数に保つ）

## 時間が足りないときの省略順

時間が足りない場合は、講師が進行状況を確認し、次の順に実装対象から外します。

1. 見た目の作り込み（めくり演出・独自CSS）。`Card` の既定の表示を使用する
2. 経過時間の表示（`useElapsedMs` + `Timer`）
3. ベスト手数の保存（`useHighScore`）
4. `ResultModal`。「クリア！ 12手」の1行を画面に表示する
5. 手数の常時表示。終了時だけ手数を表示する
6. ほかの項目を省略しても間に合わない場合（講師の判断が必要）: `PAIR_COUNT` を8から6に下げる（12枚・3列 × 4行）。
   ルールも状態遷移も変わらないので、影響は定数1つと `README.md` の記述だけです

「判定中は3枚目をめくれない」と `logic.test.ts` は評価対象のため、省略できません。
この2点は、画面の演出より優先して実装します。
