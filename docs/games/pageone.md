# ページワン（pageone）

| 項目 | 値 |
|---|---|
| ゲームID | `pageone` |
| 担当 | 担当9 |
| 難易度 | 中級 |
| ブランチ | `feature/pageone` |
| フォルダ | `src/games/pageone/` |
| コンポーネント名 | `PageOneGame` |

実装するルールは以下のとおりです。記載のないローカルルールは追加しません。
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
  CPUの強さは評価対象ではないため、この単純な判断で要件を満たせます。
- CPU が1手を指す間隔は `CPU_DELAY_MS`（既定 800ms）。`pendingDelayMs(state)` が返します。
- 画面側は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで時間を扱います。
  `.tsx` に `setTimeout` を書いてはいけません。

## 今回は実装しないルール

「このルールが無い」と誤解されないよう、**意図的に外したもの**を明示します。

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
研修で使える時間では作りきれません。**8 と A の2枚に絞れば、分岐を増やさずに「特殊カード」を体験できます**（実装メモを読んでください）。

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
- [ ] 下の「必須テスト」7件が `logic.test.ts` にあり、`npm run verify` が成功する

## 実装の進め方（まず遊べるところまで → 仕上げ）

最初から作り込まず、**最後まで遊べる状態**を先に作ります。
遊べるようになってから、ブラウザで操作しながら足りないところを足していきます。
進み具合は Issue のチェックリストで確認してください。
進め方が分からない場合は、講師に相談してください。

### 第1段階 — 最後まで遊べるところまで

ルールは `logic.ts` に純粋関数として書き、画面は `PageOneGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. `Phase` / `PageOneState` / `PageOneAction` の型を決める
2. `createInitialState(seed)` … `shuffle(createDeck(), createRng(seed))` → `deal(deck, 4, 5)` →
   残りから1枚めくって場札にする
3. `canPlay(card, field)` と `legalMoves(hand, field)` を書き、**必須テストの最初の3件を先に通す**
4. `advanceTurn(state, steps)` を書く。手番処理の注意点は、下の実装メモを先に確認してください
5. `applyPlay` と `drawFromDeck` を書き、`reduce` / `pendingDelayMs` / `isGameOver` でつなぐ
6. `GameShell` で包み、場札を `DeckPile`（`top` に一番上のカード、`face="up"`）で出す
7. 山札を `DeckPile`（`face="down"`）で出し、残り枚数を見せる
8. 自分の手札を `Hand` で出し、`disabledIds` に「今出せないカード」を入れる
9. 他プレイヤーは `Hand variant="hidden"` で枚数だけ出す
10. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く

ブラウザを再読み込みして、**最初から最後まで1回遊べること**を確認したら第1段階は完了です。
`logic.ts` に関数を足したら `logic.test.ts` にもテストを足し、`it(` が3件以上ある状態にしてください。

### 第2段階 — 遊びながら仕上げる

1. 山札を引く操作（出せるカードが無いときだけ押せる）と、山札切れの混ぜ直し
2. `ScoreBoard` で4人の残り枚数と今の手番を出し、`ResultModal` に順位を出す
3. 残りの必須テストと異常系テスト（手番でないときの `play` が無視される / 出せるのに `draw` できない）
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` にする
5. `npm run verify` を実行して成功させる

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

手番処理では、8とAを「特殊カードごとの分岐」として書き始めると、
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
**この形にできているかどうかが、このゲームの要点です。**

CPU がどのカードを選ぶかは `cpu.ts` に分けます。

```ts
// cpu.ts
import type { PlayingCard, Rng } from "@core";

/** 出せる候補から1枚選ぶ。候補が空なら null（＝山札を引く）。 */
export function chooseCard(moves: readonly PlayingCard[], rng: Rng): PlayingCard | null;
```

`pendingDelayMs` は、次の3つの条件で定義します。

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
| `sameSuit` / `sameRank` | `canPlay` の中身。この2つを `\|\|` でつないで判定する |
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

- 出せるカードがあるときに `{ type: "draw" }` を送っても状態が変わらない（カードを出せるときは山札から引けない）
- 自分の手番でないときの `{ type: "play" }` が無視される（CPU の手番中の連打で先に進めない）
- 山札が空のときに引くと、場札の一番上だけが残り、それ以外が混ざって山札になる
- 山札 + 場札 + 全員の手札の合計が、いつでも52枚のままである
- 引いたカードが出せるときは、その場で場に出て手札が増えない
- 同じ seed で `createInitialState` を2回呼ぶと、同じ配りになる

## 発展課題

発展課題は、必須要件を満たして `npm run verify` が成功したあとに着手します。すべて `src/games/pageone/` の中で実装できます。

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

## 時間が足りないときの省略順

時間が足りない場合は、次の順に実装対象から外します。1〜2は参加者の判断で省略できます。
3以降は必須要件が減るため、省略する前に講師へ確認してください。

1. **発展課題を省略する**（並べ替え表示・ハイライト・ログ・記録保存・タイマー・独自CSS）
2. **`ScoreBoard` と `LogPanel` を省略し、残り枚数をテキストで表示する**
3. **A の効果を省略する**。`stepsOf` から `"A"` の行を消し、Aも通常のカードとして1つ進めます。
   ルールが1つ減るだけで、`applyPlay` の形は変わりません。
   （必須要件1件と必須テスト `"Aを出すともう一度出せる"` が対象外になります）
4. **8 の効果も省略する**（特殊カードのない基本ルールのみ）。`stepsOf` を消して `advanceTurn(state, 1)` に固定します。
   同じマークか同じ数字を出すだけのゲームになりますが、**最初から最後まで遊べる形は保てます**。
   （必須要件1件と必須テスト `"8を出すと次の人が飛ばされる"` が対象外になります）
5. **CPU を3人から1人に減らす**（あなた + CPU 1 の2人対戦）。ルールも `logic.ts` の構造も変わりません。
   `index.ts` の `minPlayers` / `maxPlayers` を触るので、**必ず講師に確認してから**変更してください

実装を省略した場合も、残りの必須テストを維持し、`npm run verify` が成功する状態にしてください。
必要に応じて省略できる要件を減らし、検証が成功するPull Requestを提出してください。テストのない実装は評価されません。
