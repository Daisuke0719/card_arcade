# ページワン（pageone）

| 項目 | 値 |
|---|---|
| ゲームID | `pageone` |
| 担当 | 担当9 |
| 難易度 | 中級 |
| ブランチ | `feature/pageone` |
| フォルダ | `src/games/pageone/` |
| コンポーネント名 | `PageOneGame` |
| このゲームをレビューする人 | 担当8（ダウト担当） |

**このファイルがルールの正典です。** 迷ったらここに書いてあるとおりに実装してください。
ここに書いていないことは「実装しない」を選びます。

## ゲームの概要

場に出ている1枚に対して、**同じマーク（スート）か同じ数字**のカードを1枚ずつ重ねていくゲームです。
出せるカードが無いときは山札から1枚引きます。手札を先に0枚にした人が勝ちで、残りは手札の枚数で順位が決まります。

特殊カードは **8（次の人を1回飛ばす）** と **A（もう1枚出せる）** の2枚だけ入れます。

## プレイ構成

- **人数**: 4人固定。あなた1人 + CPU 3人（`createSoloVsCpu(3)`）。
- **使うカード**: 52枚。`createDeck()` で作ります。ジョーカーは使いません。
- **配り方**: シャッフルしたあと、4人へ**5枚ずつ**配ります（`deal(deck, 4, 5)`）。残りの32枚が山札です。
- **場札の用意**: 山札から**1枚めくって場札**にします。この時点で山札は31枚です。
- **先手**: **あなた**から始めます（`createTurnState(players)` の既定）。
  以降は `players` の並び順（あなた → CPU 1 → CPU 2 → CPU 3）で回ります。

## 採用するルール

トランプゲームは家庭ごとにルールが違います。**このリポジトリではこのルールで固定します。**

### 出す・引く

- 手番でできることは「**1枚出す**」か「**山札から1枚引く**」のどちらか1つだけです。
- 出せるのは、**場札の一番上と同じマーク**か、**場札の一番上と同じ数字**のカードだけです。
  この判定が `canPlay(card, field)` で、`sameSuit(card, field) || sameRank(card, field)` の1行で書けます。
- **出せるカードが1枚でもあるときは引けません。** 必ず出します。
- 出せるカードが1枚も無いときだけ、山札から1枚引きます。
- **引いたカードがそのまま出せるときは、その場で出します**（自動）。
  出さずに手札へ残す選択はありません。選択肢を1つ増やすと `Phase` と画面がもう1段増えるためです。
- 引いたカードが出せなければ、そのカードを手札に加えて手番を次の人へ渡します。

### 山札が尽きたとき

- 引こうとしたときに山札が空なら、**場札の一番上の1枚だけを場に残し**、
  その下に積まれたカードを全部混ぜて山札に戻します。混ぜたあとで1枚引きます。
- 混ぜるときの乱数は `createRng(state.seed + state.drawCount)` のように**状態から決まる seed** で作ります。
- 場札が1枚しか無くて山札も空のときは、引けるカードがありません。
  この場合は**何もせずに手番を次の人へ渡します**。

### 特殊カード（この2つだけ）

- **8** … 出すと**次の人を1回飛ばす**。飛ばされた人はその1回、何もできません。
- **A** … 出すと**もう1枚出せる**。同じ人の手番が続きます。
- A を出したあとに出せるカードが無ければ、そのまま**山札から1枚引く**流れに入ります（通常の手番と同じ）。
- A は何枚続けて出してもかまいません。出せる限り続きます。
- **最後の1枚が 8 や A でも、効果より上がりが優先**です。手札が0枚になった時点でゲームは終わります。
- **最初にめくった場札が 8 や A でも効果は発動しません。** 誰も出していないためです。

### 終了と順位

- **手札を先に0枚にした人が1位**で、その時点で**ゲーム終了**です。全員が上がるまでは続けません。
- 2位以下は**手札の枚数が少ない順**です。`rankByScore(entries, "lower-is-better")` を使います。
- **枚数が同じ人は同順位**になります（`rankByScore` の既定の挙動。1位・2位・2位・4位のように並びます）。
- 順位表の `detail` は「3点」のように出ます。これは**残り3枚**という意味です。
  表示を変えたい場合は発展課題で直してください。

### CPU と待ち時間

- CPU 3人は、**出せるカードの中からランダムに1枚**選んで出します。出せなければ引きます。
  強い CPU を作る研修ではありません。この単純さで十分です。
- CPU が1手を指す間隔は `CPU_DELAY_MS`（既定 800ms）。`pendingDelayMs(state)` が返します。
- 画面側は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで時間を扱います。
  `.tsx` に `setTimeout` を書いてはいけません。

## 今回は実装しないルール

「このルールが無い」というレビュー指摘を防ぐために、**意図的に外したもの**を明示します。

| ローカルルール | 今回の扱い |
|---|---|
| リバース（手番の向きが反転する） | 不採用。`reverseDirection` は使わない |
| ドロー2 / ドロー4（次の人に引かせる） | 不採用 |
| ワイルドカード（何の上にでも出せるカード） | 不採用 |
| 出したあとにマークを指定する（次のスートを宣言する） | 不採用 |
| 残り1枚のときの宣言義務（言い忘れたらペナルティ） | 不採用 |
| 8 と A 以外の特殊カード（J スキップ・Q リバースなど） | 不採用。特殊は 8 と A の2枚だけ |
| ジョーカーを入れる | 不採用。52枚のみ |
| 引いたカードを出さずに手札へ残す | 不採用。出せるなら必ずその場で出す |
| 同じ数字を複数枚まとめて出す | 不採用。1手番に1枚（A で続けて出す場合を除く） |
| 全員が上がるまで続けて1位から4位まで決める | 不採用。1人上がった時点で終了し、残りは枚数順 |
| 山札が尽きたらゲーム終了にする | 不採用。場札を混ぜて山札に戻し、続ける |
| 得点計算・チップのやり取り・複数回戦 | 不採用。1回で完結 |

**なぜ特殊カードを2枚に絞ったか。** リバース・ドロー2・ワイルド・マーク指定を足すと、UNO と同じ規模になります。
特殊カードごとに `applyPlay` の分岐が増え、画面にも状態（宣言中のマークなど）が増え、テストも枚数分だけ増えます。
研修は180分しかありません。**8 と A の2枚に絞れば、分岐を増やさずに「特殊カード」を体験できます**（実装メモを読んでください）。

## 必須要件（Issue にそのまま載る）

- [ ] 52枚を4人（あなた + CPU 3人）に5枚ずつ配り、山札から1枚めくって場札にする
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
- [ ] 下の「必須テスト」7件が `logic.test.ts` にあり、`npm run verify` が緑になる

## 実装の進め方（Step1 / Step2 / Step3）

時刻はすべて**研修開始からの経過分**です。実装時間は45分から始まります。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面はまだ触りません。`react` を import せずに書けるところだけを作ります。

1. `Phase` / `PageOneState` / `PageOneAction` の型を決める
2. `createInitialState(seed)` … `shuffle(createDeck(), createRng(seed))` → `deal(deck, 4, 5)` →
   残りから1枚めくって場札にする
3. `canPlay(card, field)` と `legalMoves(hand, field)` を書き、**必須テストの最初の3件を先に通す**
4. `advanceTurn(state, steps)` を書く。ここが**このゲームの山場**です（下の実装メモを先に読んでください）
5. `applyPlay` と `drawFromDeck` を書き、`reduce` / `pendingDelayMs` / `isGameOver` でつなぐ

**目安: 65分の時点で `npm test` が緑（必須テスト7件のうち4件以上が通っている）**

### Step2 — 画面（`PageOneGame.tsx`）

`logic.ts` に手を入れずに、状態を表示するだけの画面を作ります。

1. `GameShell` で包み、場札を `DeckPile`（`top` に一番上のカード、`face="up"`）で出す
2. 山札を `DeckPile`（`face="down"`）で出し、残り枚数を見せる
3. 自分の手札を `Hand` で出し、`disabledIds` に「今出せないカード」を入れる
4. 他プレイヤーは `Hand variant="hidden"` で枚数だけ出す
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く
6. `npm run dev` で開き、**最初から最後まで1回通して遊ぶ**

**目安: 85分の時点で、最初から最後まで1回遊び切れる**

### Step3 — 必須要件の残りと異常系テスト

1. 山札を引く操作（出せるカードが無いときだけ押せる）と、山札切れの混ぜ直し
2. `ScoreBoard` で4人の残り枚数と今の手番を出し、`ResultModal` に順位を出す
3. 残りの必須テストと異常系テスト（手番でないときの `play` が無視される / 出せるのに `draw` できない）
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` にする
5. `npm run verify` を実行して緑にする

**目安: 95分（遅くとも105分）の時点で `npm run verify` が緑**

## 状態の設計（雛形）

`logic.ts` に置く型と関数の**シグネチャだけ**を示します。中身は自分で書いてください。

```ts
import {
  createDeck, createRng, createSoloVsCpu, createTurnState,
  deal, last, nextTurn, rankByScore, requireCard, sameRank, sameSuit, shuffle,
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

**このゲームの山場はここです。** 8 と A を「特殊カードごとの分岐」として書き始めると、
`applyPlay` の中に `if (card.rank === "8") { ... } else if (card.rank === "A") { ... }` が積み上がります。
特殊カードが増えるたびに分岐が増え、片方を直すともう片方が壊れます。

そうではなく、**8 も A も「手番を何人分進めるか」の違いでしかない**と見てください。

| 出したカード | 進める人数 | 見え方 |
|---|---|---|
| 8 | **2** | 次の人が飛ばされる |
| A | **0** | 同じ人がもう1枚出せる |
| それ以外 | **1** | 普通に次の人へ |

つまり `applyPlay` は「カードを場に置く → `advanceTurn(state, stepsOf(card))`」の形に収まります。

```ts
/** そのカードを出したあと、手番を何人分進めるか。8 なら2、A なら0、それ以外は1。 */
function stepsOf(card: PlayingCard): number;
```

`advanceTurn` の中身も `nextTurn` を steps 回呼ぶだけです（`steps === 0` なら state をそのまま返します）。
**この形にできているかどうかが、このゲームのレビュー観点です。**

CPU がどのカードを選ぶかは `cpu.ts` に分けます。

```ts
// cpu.ts
import type { PlayingCard, Rng } from "@core";

/** 出せる候補から1枚選ぶ。候補が空なら null（＝山札を引く）。 */
export function chooseCard(moves: readonly PlayingCard[], rng: Rng): PlayingCard | null;
```

`pendingDelayMs` の定義はこれだけです。迷ったらこの3行に戻ってください。

- `phase === "finished"` … `null`
- 今の手番が CPU … `CPU_DELAY_MS`
- 手番があなた … `null`（クリック待ちなのでタイマーを動かさない）

`logic.ts` の中で乱数が必要になったら、`createRng(state.seed + state.drawCount)` のように
**状態から決まる seed** で作ります（`Math.random()` は ESLint がエラーにします）。

## 使う @core / @ui

`src/core/index.ts` と `src/components/index.ts` にあるものだけを使います。

### @core

| 名前 | 何のために使うか |
|---|---|
| `createDeck` | 52枚の山札を作る |
| `shuffle` / `createRng` | seed を固定して、毎回同じ配りを再現できるようにする |
| `deal` | 4人に5枚ずつ配る（`deal(deck, 4, 5)`。`rest` が山札になる） |
| `draw` | 山札から1枚引く（空でも例外を投げない） |
| `createSoloVsCpu` | 「あなた + CPU 3人」のプレイヤー一覧を作る |
| `createTurnState` | 手番をまとめて持つ（自作しない） |
| `nextTurn` | 手番を1人分進める。`advanceTurn` はこれを steps 回呼ぶだけ |
| `isCurrent` | そのプレイヤーが今の手番か（画面の強調に使う） |
| `sameSuit` / `sameRank` | `canPlay` の中身。この2つを `||` でつなぐだけで判定が終わる |
| `last` / `requireCard` | 場札の一番上を取り出す |
| `sortCards` | 自分の手札を並べて見やすくする |
| `cardLabel` / `cardShortLabel` | 表示とログの文字列 |
| `rankByScore` | 残り枚数で順位を作る（`"lower-is-better"` を渡す） |
| `useCpuTurn` | 画面側で待ち時間つきの自動処理を回す（使うのは1行だけ） |
| `card` / `hand` | テストで手札を組み立てる（`card("hearts", "8")`） |
| 型 `PlayingCard` / `CardId` / `PlayerId` / `TurnState` / `Ranking` / `Rng` | 状態の型付け |
| 型 `GameComponentProps` / `GameManifest` | 画面と `index.ts` の型付け |

**`reverseDirection` は使いません。** リバースを入れないので、手番の向きは常に1のままです。
**`rankByFinishOrder` も使いません。** 上がるのは1人だけで、2位以下は残り枚数で決まるためです。

### @ui

| 名前 | 何のために使うか |
|---|---|
| `GameShell` | 画面の外枠。必ずこれで包む |
| `DeckPile` | 場札（`top` に一番上、`face="up"`）と山札（`face="down"`、`onClick` で引く） |
| `Hand` | 自分の手札（`disabledIds` で出せないカードを押せなくする）／他プレイヤーは `variant="hidden"` |
| `Card` | 場札の一番上を大きく見せたいとき |
| `Button` | 「山札から引く」「もう一度」 |
| `ScoreBoard` | 4人の残り枚数と、今が誰の手番かを出す |
| `LogPanel` | 「CPU 2 が ♠8 を出しました（CPU 3 は飛ばされます）」などの進行ログ |
| `ResultModal` | 決着後の順位表（`ranking` に `getRanking(state)` を渡す） |

`GameInstructions` は `GameShell` が `manifest.howToPlay` から自動で表示するので、自分で置く必要はありません。

## 必須テスト

`logic.test.ts` に、この7件を**この文言で**書きます。評価の対象です。

| `it` の文字列 | 何を守っているか |
|---|---|
| `"同じマークなら出せる"` | `canPlay` の基本。数字が違ってもマークが同じなら出せること |
| `"同じ数字なら出せる"` | `canPlay` の基本。マークが違っても数字が同じなら出せること |
| `"マークも数字も違うカードは出せない"` | 何でも出せてしまうバグを止める。ルールの中心 |
| `"出せるカードが無いときは山札から1枚引く"` | 手札が1枚増え、山札が1枚減ること |
| `"8を出すと次の人が飛ばされる"` | 手番が2人分進むこと。特殊カードの片方 |
| `"Aを出すともう一度出せる"` | 手番が進まないこと。特殊カードのもう片方 |
| `"手札が0枚になったら上がりで、その時点でゲームが終わる"` | `phase` が `"finished"` になり、1位が確定すること |

余裕があれば、次の異常系も足してください（評価されるのはここです）。

- 出せるカードがあるときに `{ type: "draw" }` を送っても状態が変わらない（引き逃げできない）
- 自分の手番でないときの `{ type: "play" }` が無視される（CPU の手番中の連打で先に進めない）
- 山札が空のときに引くと、場札の一番上だけが残り、それ以外が混ざって山札になる
- 山札 + 場札 + 全員の手札の合計が、いつでも52枚のままである
- 引いたカードが出せるときは、その場で場に出て手札が増えない
- 同じ seed で `createInitialState` を2回呼ぶと、同じ配りになる

## 発展課題

**必須要件が全部終わってから**手を付けてください。すべて `src/games/pageone/` の中だけで実装できます。

- `sortCards` で自分の手札をマーク順・数字順に並べて表示する
- 出せるカードを `highlightedIds` で緑枠にして、出せないカードと見分けやすくする
- `LogPanel` に「あなたが ♥A を出しました（もう1枚出せます）」「CPU 1 が山札から引きました」を出す
- `ScoreBoard` の `detail` に「残り3枚」を出し、順位表の「3点」表記も残り枚数の言い方に直す
- CPU を少し賢くする（8 と A を後ろに温存する／手札に多いマークを優先して出す）。
  判断は `cpu.ts` の純粋関数に置き、テストを書く
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で「1位になった回数」または「最短決着時間」を保存する
- `PageOneGame.module.css` を足して、直前に出されたカードを一瞬ハイライトする
- 画面の隅に `seed` を表示し、同じ配りをやり直せるようにする

## 時間が足りないときに落とす順番

**上から順に落とします。** 1〜2 は自分の判断で落としてかまいません。
3以降は必須要件が減るので、落とす前に**必ず講師に確認**してください。

1. **発展課題を全部やめる**（並べ替え表示・ハイライト・ログ・記録保存・タイマー・独自 CSS）
2. **`ScoreBoard` と `LogPanel` をやめて、残り枚数を素のテキストで出す**（画面の組み立て時間を削る）
3. **A の効果を落とす**。`stepsOf` から `"A"` の行を消し、A も普通のカードとして1つ進めます。
   ルールが1つ減るだけで、`applyPlay` の形は変わりません。
   （必須要件1件と必須テスト `"Aを出すともう一度出せる"` が落ちます）
4. **8 の効果も落とす**（＝特殊カード無しの基本ルールだけ）。`stepsOf` を消して `advanceTurn(state, 1)` に固定します。
   同じマークか同じ数字を出すだけのゲームになりますが、**最初から最後まで遊べる形は保てます**。
   （必須要件1件と必須テスト `"8を出すと次の人が飛ばされる"` が落ちます）
5. **CPU を3人から1人に減らす**（あなた + CPU 1 の2人対戦）。ルールも `logic.ts` の構造も変わりません。
   `index.ts` の `minPlayers` / `maxPlayers` を触るので、**必ず講師に確認してから**変更してください

ここまで落としても、**残った必須テストと `npm run verify` が緑になることは落としません。**
要件を1つ落としてでも、緑の Pull Request を出してください。テストが無い実装は評価されません。

## レビュアー向けミッション（このゲームの壊れやすい所）

このゲームをレビューするのは **担当8（ダウト担当）** です。`npm run dev` でページワンを開き、次の3つを実際に操作してください。
ページワンの仕様を知らなくても、書いてあるとおりに動かせば判定できます。

### ミッション1: 8 と A を出したあとの手番を見る

**手順**: 自分の手札に 8 か A が来るまで遊び、出したあとの手番の動きを見ます。
CPU が出した場合も、手番の表示で追ってください。

**期待**:

- **8 を出したら次の人が1回飛ばされる**。あなたが出したなら CPU 1 が飛ばされ、CPU 2 の手番になる。
- **A を出したら同じ人の手番が続く**。あなたが出したなら、もう1枚出せる状態のまま止まる。
- A を出したあとに出せるカードが1枚も無いときは、**山札を引くだけ**で手番が次の人へ移る。
- A を出しても手番が進んでしまう、8 を出しても誰も飛ばされない、A を出したあと手番が固まって進まない、
  のどれかが起きたら不合格です。

**なぜ壊れやすいか**: 8 と A の効果を「手番を何人分進めるか」ではなく個別の分岐で書くと、
片方を直したときにもう片方が壊れます。A のときに手番を進めない処理を書き忘れると、
上がりの判定まで飛ばされて画面が止まります。

### ミッション2: 山札を最後まで引き切る

**手順**: 山札の残り枚数を見ながら遊び続け、山札が0枚になった瞬間の画面を見ます。
1回で起きなければリセットして2〜3回試してください。

**期待**:

- 山札が0枚になっても**ゲームが止まらない**。場札が混ぜられて山札に戻り、また引ける状態になる。
- 混ぜ直したあとも、**場札の一番上は直前と同じカードのまま**（急に別のカードへ変わらない）。
- 混ぜ直したあとの「出せる・出せない」の判定が、そのままの場札に対して正しく効いている。

**なぜ壊れやすいか**: 場札を全部山札に戻してしまうと、場札が消えて `canPlay` の相手がいなくなります。
逆に一番上を残し忘れると、直前に出したカードがもう一度山札から出てきます。

### ミッション3: 出せるのに引く／出せないのに出す、を試す

**手順**: 自分の手番で、次の3つを試します。

1. 手札に**押せる（明るい）カードがある**状態で、**山札をクリック**する
2. 手札の**押せない（暗い）カード**を何度もクリックする
3. CPU の手番中に、自分の手札と山札を**連打**する

**期待**:

- 1 では何も起きない（出せるカードがあるときは引けない）
- 2 でも何も起きない（場札とマークも数字も違うカードは場に出ない）
- 3 でも何も起きない。自分の手番が回ってきたときに、押した分がまとめて反映されたり2枚同時に出たりしない

**なぜ壊れやすいか**: 手番と合法手のチェックを画面側の `disabled` だけに頼っていると、
連打やタイミング次第ですり抜けます。判定は必ず `reduce` の中に置いてください。

---

**関連ドキュメント**: `CLAUDE.md`（絶対に守る5条） / `src/games/CLAUDE.md`（@core・@ui の早見表） /
`src/games/example-game/`（お手本） / `docs/troubleshooting.md`（詰まったとき）
