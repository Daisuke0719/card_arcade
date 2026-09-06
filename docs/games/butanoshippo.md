# ぶたのしっぽ（butanoshippo）

| 項目             | 値                        |
| ---------------- | ------------------------- |
| ゲームID         | `butanoshippo`            |
| 担当             | 担当5                     |
| 難易度           | 初級                      |
| ブランチ         | `feature/butanoshippo`    |
| フォルダ         | `src/games/butanoshippo/` |
| コンポーネント名 | `ButanoshippoGame`        |

この文書に記載したルールを実装します。記載のないローカルルールは追加しません。

## ゲームの概要

52枚を伏せたまま輪に並べ、手番の人が1枚ずつめくって場の中央に重ねていくゲームです。
めくったカードが**直前にめくられたカードと同じ数字**だったら、
そこまでに積まれた場札を、そのプレイヤーがすべて引き取ります。
輪のカードがなくなったら終了し、引き取った枚数が最も少ないプレイヤーが勝ちます。

## プレイ構成

- **人数**: 4人固定。プレイヤー1人 + CPU 3人（`createSoloVsCpu(3)`）。
- **使うカード**: 52枚。`createDeck()` が返す標準のデッキ。ジョーカーは使いません。
- **並べ方**: シャッフルした52枚を**手札に配らず**、伏せたまま**輪**として場に並べます。
  配る処理（`deal`）は使いません。全員が同じ1つの輪からめくります。
- **画面での輪の見せ方**: 横一列に並べ、幅が足りなければ**折り返し**て構いません。
  ただし「これは輪になっていて、最後まで行ったら終わり」ということが分かるように、
  次にめくるカードに印を付け、残り枚数を必ず表示します。
- **手番の順**: プレイヤー → CPU 1 → CPU 2 → CPU 3の順で繰り返します。

## 採用するルール

このリポジトリでは、次のルールを採用します。

- 手番のプレイヤーは、輪から1枚めくって場の中央に重ねます。
- めくる位置は輪の先頭に固定し、位置は選択できません。
- めくったカードが、**直前にめくられたカードと同じ数字（ランク）**だったら、
  その時点で場に積まれているカードを**全部そのプレイヤーが引き取り**ます。
- 同じ数字かどうかはランクだけで判定し、スート（マーク）と色は問いません。
  たとえば、♠7 の次に ♥7 が出た場合は一致します（`sameRank` を使用できます）。
- 場札が1枚しかないとき（直前のカードがないとき）は、比較するカードがないため一致しません。
- 引き取りが起きたら場を空にし、次にめくったカードを新しい場札の1枚目とします。
- 引き取りの直後は、引き取ったプレイヤーの次の人から再開します。
  引き取った人がもう一度めくることはありません。
- 引き取りが起きなかったときは、そのまま**次の人**へ手番が移ります。
- 輪のカードがなくなったらゲーム終了です。最後の1枚で引き取りが起きた場合は、
  引き取りを処理してから終了します。
- 終了時に場に残ったカードは**誰も引き取りません**。そのまま数えずに終わります。
- 順位は**引き取った枚数が少ない順**です。少ない人が1位、多い人が最下位になります。
  枚数が同じ人は同順位で構いません（`rankByScore` の既定の挙動）。
- 全員の引き取り枚数を常に画面へ表示します。

## 今回は実装しないルール

今回採用しないローカルルールを次に示します。

| ローカルルール                                               | 今回の扱い                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| 全員が同時にカードへ手を伸ばし、早い者勝ちで押し付け合う     | 不採用。ターン制とし、同時操作の判定は実装しない             |
| 一致したとき、最後に手を置いた人が引き取る（最遅ペナルティ） | 不採用。同時操作を行わないため、めくったプレイヤーが引き取る |
| 同じスートが続いても引き取り                                 | 不採用。判定はランクだけ                                     |
| 数字が隣り合う（7 の次に 8）でも引き取り                     | 不採用。同じランクのときだけ                                 |
| ジョーカーを入れて特殊札にする                               | 不採用。52枚ちょうど                                         |
| 引き取ったカードを輪に戻す（終わらない形式）                 | 不採用。引き取ったカードは抜けたままにする                   |
| 輪の好きな位置からめくる                                     | 不採用。先頭に固定                                           |
| 引き取りが多い人だけを負けにして他は順位なし                 | 不採用。少ない順に1位〜4位まで付ける                         |
| 制限時間内にめくらないと取られる                             | 不採用。プレイヤーの手番には制限時間を設けない               |
| 複数回戦・持ち越しスコア                                     | 不採用。1回で完結                                            |

## 必須要件（Issue にそのまま載る）

- [ ] 52枚が伏せたまま輪として並び、次にめくるカードと残り枚数が画面で分かる
- [ ] 手番のプレイヤーが輪から1枚めくり、場の中央に重なる（プレイヤーの手番では先頭のカードをクリック）
- [ ] めくったカードが直前のカードと同じランクなら、場札を全部そのプレイヤーが引き取る
- [ ] 引き取りが起きると場が空になり、**引き取った人の次の人**から再開する
- [ ] 輪のカードが尽きたらゲームが終了する（最後の1枚の引き取りも処理してから終わる）
- [ ] 4人の引き取り枚数が常に画面に出ている（`ScoreBoard`）
- [ ] 引き取り枚数が少ない順の順位が `ResultModal` に出る
- [ ] 輪のカードは裏向き（`face="down"`）で表示され、中身が DOM に出ない
- [ ] CPU の手番は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] CPU の手番中や引き取りの演出中にクリックしても場が進まない
- [ ] 下の「必須テスト」6件が `logic.test.ts` にあり、`npm run verify` が成功する

## 実装の進め方

最初に、ゲームを最後まで操作できる状態を作ります。
その後、ブラウザで動作を確認しながら、残りの要件を実装します。
進行状況は Issue のチェックリストで確認し、不明点があれば講師に相談してください。

### 第1段階 — ゲームを最後まで操作できる状態にする

ルールは `logic.ts` に純粋関数として書き、画面は `ButanoshippoGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. `Phase` / `ButanoshippoState` / `ButanoshippoAction` の型を決める
2. `createInitialState(seed)`: `createDeck()` を `shuffle(deck, createRng(seed))` して `ring` に入れ、
   `pile` は空、`collected` は全員0、`turn` は `createTurnState(createSoloVsCpu(3))`
3. `isMatch(prev, next)` を書き、テストを2件（同じランク / 違うランク）足す
4. `flipNext(state)`: 輪の先頭を1枚めくって `pile` の末尾に積む
5. `collectPile(state)`: `pile` をすべて現在の手番のプレイヤーに加え、`pile` を空にして次の手番へ進める
6. `reduce` / `pendingDelayMs` / `isGameOver` / `getRanking` をつなぐ
7. `GameShell` で包み、`headerRight` に `ScoreBoard`（4人の引き取り枚数と手番）を置く
8. 輪を `Card`（`face="down"`）の並びで表示し、先頭の1枚だけ `highlighted` にする
9. 場の中央を `DeckPile`（`top` に一番上のカード、`face="up"`）で表示する
10. プレイヤーの手番だけ、輪の先頭カードに `onClick` を設定して `{ type: "flip" }` を送る
11. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行だけ記述する

ブラウザを再読み込みし、最初から最後まで1回操作できることを確認したら、第1段階は完了です。
`logic.ts` に関数を追加したら、`logic.test.ts` にもテストを追加し、`it(` を3件以上にします。

### 第2段階 — 残りの要件を実装する

1. 終了処理と `getRanking`、`ResultModal` の表示
2. 残りの必須テスト2件（輪が尽きたら終了 / 引き取った人の次から再開）
3. 異常系テスト: CPU の手番中や引き取りの演出中に `{ type: "flip" }` を送っても状態が変わらないこと
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` にする
5. `npm run verify` を実行し、成功を確認する

## 状態の設計（雛形）

`logic.ts` に置く型と関数のシグネチャを示します。各関数の実装は含まれていません。

```ts
import {
  createDeck,
  createRng,
  createSoloVsCpu,
  createTurnState,
  nextTurn,
  sameRank,
  shuffle,
} from "@core";
import type { PlayerId, PlayingCard, Ranking, TurnState } from "@core";

/** CPU が1枚めくるまでの待ち時間。UI はこの値を参照するだけ。 */
export const CPU_INTERVAL_MS = 900;

/** 引き取りを見せている時間。 */
export const COLLECT_DELAY_MS = 700;

export type Phase = "playing" | "collecting" | "finished";

export type ButanoshippoState = {
  /** まだめくられていない輪のカード。先頭からめくる。 */
  readonly ring: readonly PlayingCard[];
  /** 場の中央に積まれたカード。末尾が一番上（＝直前にめくられた1枚）。 */
  readonly pile: readonly PlayingCard[];
  /** プレイヤーIDごとの引き取り枚数。id は "you" / "cpu-1" / "cpu-2" / "cpu-3"。 */
  readonly collected: Readonly<Record<PlayerId, number>>;
  /** 手番は @core の TurnState に持たせる（自作しない）。 */
  readonly turn: TurnState;
  readonly phase: Phase;
  /** 直前に引き取った人。演出とログに使う。 */
  readonly lastCollectorId: PlayerId | null;
  readonly seed: number;
};

export type ButanoshippoAction =
  | { readonly type: "flip" }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/** 最初の状態。52枚を伏せた輪にして、場は空で始める。 */
export function createInitialState(seed?: number): ButanoshippoState;

/** 直前の1枚と今めくった1枚が同じランクか。ここが引き取り判定の中心。 */
export function isMatch(prev: PlayingCard | undefined, next: PlayingCard): boolean;

/** 輪の先頭を1枚めくって場に積む。一致したら phase を "collecting" にする。 */
export function flipNext(state: ButanoshippoState): ButanoshippoState;

/** 場札を全部いまの手番の人に渡し、場を空にして次の人へ手番を移す。 */
export function collectPile(state: ButanoshippoState): ButanoshippoState;

/** 引き取り枚数が少ない順の順位表。 */
export function getRanking(state: ButanoshippoState): Ranking;

/** 状態 + 行動 -> 新しい状態。ルールはすべてここに集める。 */
export function reduce(state: ButanoshippoState, action: ButanoshippoAction): ButanoshippoState;

/** 今、何ms後に自動処理が要るか。null は人間の入力待ち。 */
export function pendingDelayMs(state: ButanoshippoState): number | null;

export function isGameOver(state: ButanoshippoState): boolean;
```

`pendingDelayMs` の考え方（`babanuki` や `speed` と同じ形にそろえます）。

- `phase === "finished"`: `null`
- `phase === "collecting"`: `COLLECT_DELAY_MS`
- 手番が CPU: `CPU_INTERVAL_MS`
- プレイヤーの手番: `null`（クリック待ちなのでタイマーを動かさない）

`cpu.ts` は作りません。CPU は輪の先頭を1枚めくるだけで、選択処理がないためです。
CPU の手番では、`reduce` から `flipNext(state)` を呼び出します。
乱数を使うのは `createInitialState` の最初のシャッフル1回だけで、そこも `createRng(seed)` で固定します
（`Math.random()` は ESLint がエラーにします）。

`reduce` では、アクションごとに次の処理を行います。

- `"flip"`: `phase === "playing"` かつプレイヤーの手番だけ `flipNext`。それ以外は `state` をそのまま返す
- `"tick"`: `phase === "collecting"` なら `collectPile`、`phase === "playing"` で CPU の手番なら `flipNext`
- `"reset"`: `createInitialState(action.seed ?? state.seed + 1)`

## 使う @core / @ui

`src/core/index.ts` と `src/components/index.ts` にあるものだけを使います。

### @core

| 名前                                                    | 用途                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| `createDeck`                                            | 52枚を作る（ジョーカーは使わない）                                 |
| `shuffle` / `createRng`                                 | seed を固定して、毎回同じ輪の並びを再現できるようにする            |
| `createSoloVsCpu`                                       | 「プレイヤー + CPU 3人」の一覧を作る                               |
| `createTurnState`                                       | 手番をまとめて持つ（自作の `currentIndex` を作らない）             |
| `nextTurn`                                              | めくったあと・引き取ったあとに次の人へ手番を進める                 |
| `isCurrent`                                             | 現在がプレイヤーの手番かを画面とガードで判定する                   |
| `draw`                                                  | 輪の先頭を1枚めくる（`{ card, rest }` が返る）                     |
| `last`                                                  | 場札の一番上（＝直前にめくられた1枚）を取る                        |
| `requireCard`                                           | カードが必要な箇所で `undefined` をエラーにする                    |
| `sameRank`                                              | 同じ数字かどうかの判定。スートと色は見ない                         |
| `rankByScore`                                           | 引き取り枚数で順位を付ける（第2引数に `"lower-is-better"` を渡す） |
| `useCpuTurn`                                            | 画面側で待ち時間を設けて CPU の処理を実行する                      |
| `card`                                                  | テストで輪や場札を組み立てる                                       |
| 型 `PlayingCard` / `PlayerId` / `TurnState` / `Ranking` | 状態の型付け                                                       |
| 型 `GameComponentProps` / `GameManifest`                | 画面と `index.ts` の型付け                                         |

`rankByScore` が返す `detail` は「3点」のような表記です。このゲームでは点数ではなく**引き取り枚数**を扱うため、
画面に「数字は引き取った枚数です」と1行添えてください（「3枚」表記に直すのは発展課題です）。

### @ui

| 名前               | 用途                                                             |
| ------------------ | ---------------------------------------------------------------- |
| `GameShell`        | ゲーム画面の共通レイアウト                                       |
| `Card`             | 輪の1枚（`face="down"`）。次にめくる1枚だけ `highlighted` にする |
| `DeckPile`         | 場の中央の山（`count` に場札の枚数、`top` に一番上のカード）     |
| `ScoreBoard`       | 4人の引き取り枚数と、今が誰の手番か                              |
| `ResultModal`      | 決着後の順位表                                                   |
| `Button`           | 「もう一度」など補助の操作                                       |
| `GameInstructions` | 遊び方の短い説明を画面に置く（任意）                             |

輪は `Card` を52個並べて作ります。`Hand` は手札用なので使いません（輪は誰の手札でもないため）。

## 必須テスト

`logic.test.ts` に、次の6件を記載の名前で作成します。

| `it` の文字列                                        | 確認する内容                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `"同じ数字が続いたら場札を全部引き取る"`             | 引き取り判定の基本。スートが違っても同ランクなら一致すること |
| `"違う数字なら場に積まれるだけで引き取りは起きない"` | 異なるランクでは引き取りが起きないこと                       |
| `"引き取りのあと場が空になる"`                       | 引き取り後に場札が残らないこと                               |
| `"輪のカードが尽きたらゲームが終了する"`             | 輪が空になった時点で終了すること                             |
| `"引き取った枚数が一番少ない人が1位になる"`          | 枚数が少ない順に順位が付くこと                               |
| `"引き取った人の次の人から再開する"`                 | 引き取ったプレイヤーの次の人へ手番が移ること                 |

必須テストの完了後、次の異常系も追加できます。

- CPU の手番中に `{ type: "flip" }` を送っても状態が変わらない（連打で先に進めない）
- `phase === "collecting"` の間に `{ type: "flip" }` を送っても状態が変わらない
- 同じ seed で `createInitialState` を2回呼ぶと、同じ輪の並びになる
- 最後の1枚が一致だったとき、引き取りを済ませてから終了する

## 発展課題

必須要件を満たし、`npm run verify` が成功してから発展課題に着手します。いずれも `src/games/butanoshippo/` の中で実装できます。

- `LogPanel` に「CPU 2 が ♥7 をめくって5枚 引き取りました」の経過を出す
- 順位表の `detail` を「3枚」表記に直す（`rankByScore` を使わず `Ranking` を自分で組み立てる）
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で、プレイヤーの最少引き取り枚数を保存する（少ないほど良い記録）
- `ButanoshippoGame.module.css` を追加し、`transform: rotate()` で輪を円形に並べる
- 引き取りの瞬間、場札が引き取った人の方へ動く演出を付ける
- 「あと何枚で輪が一周するか」と「引き取りが起きた回数」を出す
- 引き取り枚数が最も多いプレイヤーの欄を強調表示する
- `sortCards` で自分が引き取ったカードをランク順に一覧表示する（`collected` を枚数ではなくカード配列で持つ）
- `useCountdown` でプレイヤーの手番に制限時間を設け、時間切れなら自動でめくる
- CPU ごとに待ち時間を変える

## 時間が足りないときの省略順

時間が足りない場合は、講師が進行状況を確認し、次の順に実装対象から外します。

1. 発展課題を省略する（ログ・記録保存・タイマー・円形レイアウト・独自 CSS）
2. 引き取りの演出を省略する。`Phase` から `"collecting"` を外し、`flipNext` の中で即座に引き取る。
   `pendingDelayMs` は「手番が CPU なら `CPU_INTERVAL_MS`、それ以外は `null`」だけにする
3. 輪の52枚表示を省略し、`DeckPile` 1つと「めくる」`Button` に置き換える。
   残り枚数は `DeckPile` の `count` に出るので、ルールは何も変わりません
4. `ScoreBoard` を省略し、4人の引き取り枚数をテキストで表示する
5. CPU を3人から1人に減らす（プレイヤー1人 + CPU 1人の2人対戦）。
   ルールも `logic.ts` の構造も変わりません。`index.ts` の `minPlayers` / `maxPlayers` を変更するため、
   変更前に講師へ確認する
6. 順位表示を省略し、`ResultModal` の `score` にプレイヤーが引き取った枚数だけを表示する。
   `getRanking` を呼ばなくなるので、順位のテストは `collected` の値を直接見る形に書き直します

実装を省略した場合も必須テスト6件を残し、`npm run verify` が成功する状態にします。
テストがない実装は評価対象になりません。
