# ページワン（pageone）

| 項目             | 値                   |
| ---------------- | -------------------- |
| ゲームID         | `pageone`            |
| 担当             | 担当9                |
| 難易度           | 中級                 |
| ブランチ         | `feature/pageone`    |
| フォルダ         | `src/games/pageone/` |
| コンポーネント名 | `PageOneGame`        |

この文書に記載したルールを実装します。記載のないローカルルールは追加しません。

## ゲームの概要

場札と**同じマーク（スート）か同じ数字**のカードを、手札から1枚ずつ重ねていくゲームです。
出せるカードが無いときは山札から1枚引きます。手札を先に0枚にした人が勝ちで、残りは手札の枚数で順位が決まります。

特殊カードは **8（次の人を1回飛ばす）** と **A（もう1枚出せる）** の2枚だけ入れます。

## プレイ構成

- **人数**: 4人固定。プレイヤー1人 + CPU 3人（`createSoloVsCpu(3)`）。
- **使うカード**: 52枚。`createDeck()` で作ります。ジョーカーは使いません。
- **配り方**: シャッフルしたあと、4人へ**5枚ずつ**配ります（`deal(deck, 4, 5)`）。残りの32枚が山札です。
- **場札の用意**: 山札から**1枚めくって場札**にします。この時点で山札は31枚です。
- **先手**: プレイヤーから始めます（`createTurnState(players)` の既定）。
  以降は `players` の並び順（プレイヤー → CPU 1 → CPU 2 → CPU 3）で進みます。

## 採用するルール

このリポジトリでは、次のルールを採用します。

### 出す・引く

- 手番では、「1枚出す」か「山札から1枚引く」のどちらかを行います。
- 出せるのは、**場札の一番上と同じマーク**か、**場札の一番上と同じ数字**のカードだけです。
  この判定が `canPlay(card, field)` で、`sameSuit(card, field) || sameRank(card, field)` の1行で書けます。
- 出せるカードが1枚以上ある場合は、山札から引かずにカードを出します。
- 出せるカードが1枚も無いときだけ、山札から1枚引きます。
- 引いたカードを出せる場合は、その場で自動的に出します。
  手札に残す選択肢はありません。
- 引いたカードが出せなければ、そのカードを手札に加えて手番を次の人へ渡します。

### 山札が尽きたとき

- 引こうとしたときに山札が空なら、**場札の一番上の1枚だけを場に残し**、
  その下に積まれたカードを全部混ぜて山札に戻します。混ぜたあとで1枚引きます。
- 混ぜるときの乱数は `createRng(state.seed + state.drawCount)` のように**状態から決まる seed** で作ります。
- 場札が1枚しか無くて山札も空のときは、引けるカードがありません。
  この場合は、カードを引かずに手番を次の人へ移します。

### 特殊カード（この2つだけ）

- **8**: 出すと次の人の手番を1回飛ばします。
- **A**: 出すと、同じプレイヤーがもう1枚出せます。
- A を出したあとに出せるカードが無ければ、そのまま**山札から1枚引く**流れに入ります（通常の手番と同じ）。
- A は何枚続けて出してもかまいません。出せる限り続きます。
- 最後の1枚が8またはAの場合も、手札が0枚になった時点でゲームは終了し、特殊効果は適用しません。
- 最初にめくった場札が8またはAでも、特殊効果は発動しません。

### 終了と順位

- 最初に手札を0枚にしたプレイヤーが1位となり、その時点でゲーム終了です。
- 2位以下は**手札の枚数が少ない順**です。`rankByScore(entries, "lower-is-better")` を使います。
- **枚数が同じ人は同順位**になります（`rankByScore` の既定の挙動。1位・2位・2位・4位のように並びます）。
- 順位表の `detail` には「3点」のように表示されます。この値は残り枚数を表します。
  表示の変更は発展課題で行います。

### CPU と待ち時間

- CPU 3人は、**出せるカードの中からランダムに1枚**選んで出します。出せなければ引きます。
  CPU は、出せるカードから1枚を無作為に選びます。
- CPU が1手を指す間隔は `CPU_DELAY_MS`（既定 800ms）。`pendingDelayMs(state)` が返します。
- 画面側は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで時間を扱います。
  `.tsx` では `setTimeout` を使用しません。

## 今回は実装しないルール

今回採用しないローカルルールを次に示します。

| ローカルルール                                        | 今回の扱い                                     |
| ----------------------------------------------------- | ---------------------------------------------- |
| リバース（手番の向きが反転する）                      | 不採用。`reverseDirection` は使わない          |
| ドロー2 / ドロー4（次の人に引かせる）                 | 不採用                                         |
| ワイルドカード（何の上にでも出せるカード）            | 不採用                                         |
| 出したあとにマークを指定する（次のスートを宣言する）  | 不採用                                         |
| 残り1枚のときの宣言義務（言い忘れたらペナルティ）     | 不採用                                         |
| 8 と A 以外の特殊カード（J スキップ・Q リバースなど） | 不採用。特殊は 8 と A の2枚だけ                |
| ジョーカーを入れる                                    | 不採用。52枚のみ                               |
| 引いたカードを出さずに手札へ残す                      | 不採用。出せるなら必ずその場で出す             |
| 同じ数字を複数枚まとめて出す                          | 不採用。1手番に1枚（A で続けて出す場合を除く） |
| 全員が上がるまで続けて1位から4位まで決める            | 不採用。1人上がった時点で終了し、残りは枚数順  |
| 山札が尽きたらゲーム終了にする                        | 不採用。場札を混ぜて山札に戻し、続ける         |
| 得点計算・チップのやり取り・複数回戦                  | 不採用。1回で完結                              |

リバース、ドロー2、ワイルド、マーク指定を追加すると、`applyPlay` の分岐、画面の状態、テストが増えます。
研修時間内に実装できる範囲として、特殊カードは8とAの2種類に限定します。実装方法は後述の実装メモを参照してください。

## 必須要件（Issue にそのまま載る）

- [ ] 52枚を4人（プレイヤー + CPU 3人）に5枚ずつ配り、山札から1枚めくって場札にする
- [ ] `canPlay(card, field)` が「場札と同じマーク、または同じ数字」を判定する
- [ ] 自分の手札のうち、今出せるカードだけがクリックできる（出せないカードは押せない）
- [ ] 出せるカードが1枚でもあるときは山札を引けない。出せないときだけ引ける
- [ ] 引いたカードが出せるときは、その場で自動的に場に出る
- [ ] 8 を出すと次の人が1回飛ばされる
- [ ] A を出すともう1枚出せる（同じ人の手番が続く）
- [ ] 山札が尽きたら、場札の一番上を残して残りを混ぜ、山札に戻して続けられる
- [ ] 手札が0枚になった人が出た時点でゲームが終わり、`ResultModal` に順位（2位以下は枚数順）が出る
- [ ] 他プレイヤーの手札は `Hand variant="hidden"` で枚数だけ表示され、中身が DOM に出ない
- [ ] CPU 3人の手番が `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] 下の「必須テスト」7件が `logic.test.ts` にあり、`npm run verify` が成功する

## 実装の進め方

最初に、ゲームを最後まで操作できる状態を作ります。
その後、ブラウザで動作を確認しながら、残りの要件を実装します。
進行状況は Issue のチェックリストで確認し、不明点があれば講師に相談してください。

### 第1段階 — ゲームを最後まで操作できる状態にする

ルールは `logic.ts` に純粋関数として書き、画面は `PageOneGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. `Phase` / `PageOneState` / `PageOneAction` の型を決める
2. `createInitialState(seed)`: `shuffle(createDeck(), createRng(seed))` → `deal(deck, 4, 5)` →
   残りから1枚めくって場札にする
3. `canPlay(card, field)` と `legalMoves(hand, field)` を実装し、必須テストの最初の3件が成功することを確認する
4. `advanceTurn(state, steps)` を書く。手番処理の注意点は、後述の実装メモを確認する
5. `applyPlay` と `drawFromDeck` を書き、`reduce` / `pendingDelayMs` / `isGameOver` でつなぐ
6. `GameShell` で囲み、場札を `DeckPile`（`top` に一番上のカード、`face="up"`）で表示する
7. 山札を `DeckPile`（`face="down"`）で表示し、残り枚数を示す
8. プレイヤーの手札を `Hand` で表示し、`disabledIds` に現在出せないカードを指定する
9. 他のプレイヤーは `Hand variant="hidden"` で枚数だけ表示する
10. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行だけ記述する

ブラウザを再読み込みし、最初から最後まで1回操作できることを確認したら、第1段階は完了です。
`logic.ts` に関数を追加したら、`logic.test.ts` にもテストを追加し、`it(` を3件以上にします。

### 第2段階 — 残りの要件を実装する

1. 山札を引く操作（出せるカードが無いときだけ押せる）と、山札切れの混ぜ直し
2. `ScoreBoard` で4人の残り枚数と現在の手番を表示し、`ResultModal` に順位を表示する
3. 残りの必須テストと異常系テスト（手番でないときの `play` が無視される / 出せるのに `draw` できない）
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
  deal,
  last,
  nextTurn,
  rankByScore,
  requireCard,
  sameRank,
  sameSuit,
  shuffle,
} from "@core";
import type { CardId, PlayerId, PlayingCard, Ranking, Rng, TurnState } from "@core";

/** CPU が1手を指すまでの待ち時間。UI はこの値を参照するだけ。 */
export const CPU_DELAY_MS = 800;

/** 1人に配る枚数。 */
export const HAND_SIZE = 5;

export type Phase = "playing" | "finished";

export type PageOneState = {
  /** 山札。先頭から引く。 */
  readonly deck: readonly PlayingCard[];
  /** 場札。出された順に積まれ、末尾が一番上。山札切れのときは末尾以外を混ぜて戻す。 */
  readonly field: readonly PlayingCard[];
  /** プレイヤーIDごとの手札。id は "you" / "cpu-1" / "cpu-2" / "cpu-3"。 */
  readonly hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>;
  /** 手番は @core の TurnState に持たせる（自作しない）。 */
  readonly turn: TurnState;
  readonly phase: Phase;
  /** 上がった人。1人入った時点で終了する。 */
  readonly winnerId: PlayerId | null;
  /** LogPanel に渡す進行ログ（新しいものが先頭）。 */
  readonly log: readonly string[];
  /** これまでに引いた回数。山札を混ぜ直すときの seed に使う。 */
  readonly drawCount: number;
  readonly seed: number;
};

export type PageOneAction =
  | { readonly type: "play"; readonly cardId: CardId }
  | { readonly type: "draw" }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/** 最初の状態。5枚ずつ配り、山札から1枚めくって場札にする。 */
export function createInitialState(seed?: number): PageOneState;

/** 場札の一番上。requireCard(last(state.field), "...") で取り出す。 */
export function fieldTop(state: PageOneState): PlayingCard;

/** その1枚を今の場札に出せるか。同じマークか同じ数字なら true。 */
export function canPlay(card: PlayingCard, field: PlayingCard): boolean;

/** 手札のうち今出せるカードだけを返す。0件のときだけ山札を引ける。 */
export function legalMoves(hand: readonly PlayingCard[], field: PlayingCard): PlayingCard[];

/** 1枚出す。出せないカードや手番でない人を渡されたら state をそのまま返す。 */
export function applyPlay(state: PageOneState, playerId: PlayerId, card: PlayingCard): PageOneState;

/** 山札から1枚引いて手札に加える。山札が空なら場札を混ぜ直してから引く。 */
export function drawFromDeck(state: PageOneState, playerId: PlayerId): PageOneState;

/** 手番を steps 人分進める。0 なら進めない（A）、2 なら1人飛ばす（8）。 */
export function advanceTurn(state: PageOneState, steps: number): PageOneState;

/** 順位。1位は上がった人、2位以下は手札の枚数が少ない順（同数は同順位）。 */
export function getRanking(state: PageOneState): Ranking;

/** 状態 + 行動 -> 新しい状態。ルールはすべてここに集める。 */
export function reduce(state: PageOneState, action: PageOneAction): PageOneState;

/** 今、何ms後に自動処理が要るか。null は人間の入力待ち。 */
export function pendingDelayMs(state: PageOneState): number | null;

export function isGameOver(state: PageOneState): boolean;
```

### 実装メモ: 特殊カードは「手番の進み方」で表現する

手番処理では、8とAを「特殊カードごとの分岐」として書き始めると、
`applyPlay` の中に `if (card.rank === "8") { ... } else if (card.rank === "A") { ... }` が積み上がります。
特殊カードが増えるたびに分岐が増え、変更の影響範囲も広がります。

8とAは、手番を何人分進めるかという値の違いとして扱います。

| 出したカード | 進める人数 | 結果                  |
| ------------ | ---------- | --------------------- |
| 8            | **2**      | 次の人が飛ばされる    |
| A            | **0**      | 同じ人がもう1枚出せる |
| それ以外     | **1**      | 普通に次の人へ        |

`applyPlay` は、「カードを場に置く → `advanceTurn(state, stepsOf(card))`」の順で処理します。

```ts
/** そのカードを出したあと、手番を何人分進めるか。8 なら2、A なら0、それ以外は1。 */
function stepsOf(card: PlayingCard): number;
```

`advanceTurn` の中身も `nextTurn` を steps 回呼ぶだけです（`steps === 0` なら state をそのまま返します）。
この構造にすることで、特殊カードごとの分岐を手番処理にまとめられます。

CPU がどのカードを選ぶかは `cpu.ts` に分けます。

```ts
// cpu.ts
import type { PlayingCard, Rng } from "@core";

/** 出せる候補から1枚選ぶ。候補が空なら null（＝山札を引く）。 */
export function chooseCard(moves: readonly PlayingCard[], rng: Rng): PlayingCard | null;
```

`pendingDelayMs` は、次の3つの条件で定義します。

- `phase === "finished"`: `null`
- 現在の手番が CPU: `CPU_DELAY_MS`
- プレイヤーの手番: `null`（クリック待ちなのでタイマーを動かさない）

`logic.ts` の中で乱数が必要になったら、`createRng(state.seed + state.drawCount)` のように
状態から決まるseedで作ります（`Math.random()` はESLintがエラーとして検出します）。

## 使う @core / @ui

`src/core/index.ts` と `src/components/index.ts` にあるものだけを使います。

### @core

| 名前                                                                       | 用途                                                        |
| -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `createDeck`                                                               | 52枚の山札を作る                                            |
| `shuffle` / `createRng`                                                    | seed を固定して、毎回同じ配りを再現できるようにする         |
| `deal`                                                                     | 4人に5枚ずつ配る（`deal(deck, 4, 5)`。`rest` が山札になる） |
| `draw`                                                                     | 山札から1枚引く（空でも例外を投げない）                     |
| `createSoloVsCpu`                                                          | 「プレイヤー + CPU 3人」の一覧を作る                        |
| `createTurnState`                                                          | 手番をまとめて持つ（自作しない）                            |
| `nextTurn`                                                                 | 手番を1人分進める。`advanceTurn` はこれを steps 回呼ぶだけ  |
| `isCurrent`                                                                | そのプレイヤーが今の手番か（画面の強調に使う）              |
| `sameSuit` / `sameRank`                                                    | `canPlay` の中身。この2つを `\|\|` でつないで判定する       |
| `last` / `requireCard`                                                     | 場札の一番上を取り出す                                      |
| `sortCards`                                                                | プレイヤーの手札を並べて見やすくする                        |
| `cardLabel` / `cardShortLabel`                                             | 表示とログの文字列                                          |
| `rankByScore`                                                              | 残り枚数で順位を作る（`"lower-is-better"` を渡す）          |
| `useCpuTurn`                                                               | 画面側で待ち時間を設けて CPU の処理を実行する               |
| `card` / `hand`                                                            | テストで手札を組み立てる（`card("hearts", "8")`）           |
| 型 `PlayingCard` / `CardId` / `PlayerId` / `TurnState` / `Ranking` / `Rng` | 状態の型付け                                                |
| 型 `GameComponentProps` / `GameManifest`                                   | 画面と `index.ts` の型付け                                  |

`reverseDirection` は使用しません。リバースを実装しないため、手番の向きは常に1です。
`rankByFinishOrder` も使用しません。上がるのは1人だけで、2位以下は残り枚数で決まるためです。

### @ui

| 名前          | 用途                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `GameShell`   | ゲーム画面の共通レイアウト                                                                              |
| `DeckPile`    | 場札（`top` に一番上、`face="up"`）と山札（`face="down"`、`onClick` で引く）                            |
| `Hand`        | プレイヤーの手札（`disabledIds` で出せないカードを選択不可にする）／他のプレイヤーは `variant="hidden"` |
| `Card`        | 場札の一番上を大きく表示するとき                                                                        |
| `Button`      | 「山札から引く」「もう一度」                                                                            |
| `ScoreBoard`  | 4人の残り枚数と現在の手番を表示する                                                                     |
| `LogPanel`    | 「CPU 2 が ♠8 を出しました（CPU 3 は飛ばされます）」などの進行ログ                                      |
| `ResultModal` | 決着後の順位表（`ranking` に `getRanking(state)` を渡す）                                               |

`GameInstructions` は `GameShell` が `manifest.howToPlay` から自動表示するため、個別に配置する必要はありません。

## 必須テスト

`logic.test.ts` に、次の7件を記載の名前で作成します。いずれも評価対象です。

| `it` の文字列                                             | 確認する内容                                               |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| `"同じマークなら出せる"`                                  | `canPlay` の基本。数字が違ってもマークが同じなら出せること |
| `"同じ数字なら出せる"`                                    | `canPlay` の基本。マークが違っても数字が同じなら出せること |
| `"マークも数字も違うカードは出せない"`                    | マークと数字が異なるカードを出せないこと                   |
| `"出せるカードが無いときは山札から1枚引く"`               | 手札が1枚増え、山札が1枚減ること                           |
| `"8を出すと次の人が飛ばされる"`                           | 手番が2人分進むこと。特殊カードの片方                      |
| `"Aを出すともう一度出せる"`                               | 手番が進まないこと。特殊カードのもう片方                   |
| `"手札が0枚になったら上がりで、その時点でゲームが終わる"` | `phase` が `"finished"` になり、1位が確定すること          |

必須テストの完了後、次の異常系も追加できます。

- 出せるカードがあるときに `{ type: "draw" }` を送っても状態が変わらない（カードを出せるときは山札から引けない）
- プレイヤーの手番でないときの `{ type: "play" }` が無視される
- 山札が空のときに引くと、場札の一番上だけが残り、それ以外が混ざって山札になる
- 山札 + 場札 + 全員の手札の合計が、いつでも52枚のままである
- 引いたカードが出せるときは、その場で場に出て手札が増えない
- 同じ seed で `createInitialState` を2回呼ぶと、同じ配りになる

## 発展課題

必須要件を満たし、`npm run verify` が成功してから発展課題に着手します。いずれも `src/games/pageone/` の中で実装できます。

- `sortCards` でプレイヤーの手札をマーク順・数字順に並べて表示する
- 出せるカードを `highlightedIds` で強調表示し、出せないカードと区別する
- `LogPanel` に「プレイヤーが ♥A を出しました（もう1枚出せます）」「CPU 1 が山札から引きました」を表示する
- `ScoreBoard` の `detail` に「残り3枚」を出し、順位表の「3点」表記も残り枚数の言い方に直す
- CPU が8とAを温存し、手札に多いマークを優先して出すようにする。
  判断処理は `cpu.ts` の純粋関数に置き、テストを追加する
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で「1位になった回数」または「最短決着時間」を保存する
- `PageOneGame.module.css` を追加し、直前に出されたカードを一時的に強調表示する
- 画面の隅に `seed` を表示し、同じ配りをやり直せるようにする

## 時間が足りないときの省略順

時間が足りない場合は、次の順に実装対象から外します。1〜2は参加者の判断で省略できます。
3以降は必須要件が減るため、省略する前に講師へ確認します。

1. 発展課題を省略する（並べ替え表示・ハイライト・ログ・記録保存・タイマー・独自 CSS）
2. `ScoreBoard` と `LogPanel` を省略し、残り枚数をテキストで表示する
3. Aの効果を省略する。`stepsOf` から `"A"` の行を削除し、Aも通常のカードとして1つ進めます。
   ルールが1つ減るだけで、`applyPlay` の形は変わりません。
   （必須要件1件と必須テスト `"Aを出すともう一度出せる"` が対象外になります）
4. 8の効果も省略する（特殊カードのない基本ルールのみ）。`stepsOf` を削除して `advanceTurn(state, 1)` に固定します。
   同じマークか同じ数字を出す基本ルールは維持します。
   （必須要件1件と必須テスト `"8を出すと次の人が飛ばされる"` が対象外になります）
5. CPU を3人から1人に減らす（プレイヤー1人 + CPU 1人の2人対戦）。ルールと `logic.ts` の構造は変わりません。
   `index.ts` の `minPlayers` / `maxPlayers` を変更するため、事前に講師へ確認する

実装を省略した場合も残りの必須テストを維持し、`npm run verify` が成功する状態にします。
テストがない実装は評価対象になりません。
