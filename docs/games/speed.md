# スピード（speed）

| 項目 | 値 |
|---|---|
| ゲームID | `speed` |
| 担当 | 担当6 |
| 難易度 | 中級 |
| ブランチ | `feature/speed` |
| フォルダ | `src/games/speed/` |
| コンポーネント名 | `SpeedGame` |
| このゲームをレビューする人 | 担当5（ぶたのしっぽ担当） |

## ゲームの概要

中央に置かれた2枚の台札に対して、手札から「1つ違いの数字」のカードを次々に出していく早さ勝負です。
CPU と同時進行で出し合い、先に手札と山札を出し切ったほうが勝ちます。

## プレイ構成

- **人数**: あなた1人 + CPU1人（`minPlayers: 2` / `maxPlayers: 2`）
- **使うカード**: `createDeck()` の52枚。ジョーカーは使いません
- **配り方**: 52枚をシャッフルして26枚ずつに分けます。各自の26枚は次のように使います
  - 上から4枚 … **手札**（常に4枚を保つ）
  - 次の1枚 … **台札**として中央に表向きで置く（2人ぶんで台札は2枚）
  - 残り21枚 … **山札**（裏向き。手札の補充と台札の補充に使う）

```text
        CPU の山札(21)   [ CPU の手札 4枚 ]
             中央: [ 台札 左 ] [ 台札 右 ]
        あなたの山札(21) [ あなたの手札 4枚 ]
```

## 採用するルール

**これが正典です。** ここに書いていないルールは実装しません。

1. 手札のカードは、**どちらかの台札と数字が1つ違い**のときだけ出せます。
2. **同じ数字は出せません**（台札が `7` のとき、手札の `7` は出せない）。
3. **A と K は繋がります。** K の台札には A を、A の台札には K を出せます。判定には `@core` の `cycleRank` を使います。
   - 出せる条件は「`cycleRank(pile.rank, 1) === card.rank` または `cycleRank(pile.rank, -1) === card.rank`」です。
4. **スート（マーク）は一切関係ありません。** 数字だけで判定します。
5. 出せるカードは、手札の中で**常時ハイライト**されます（`Hand` の `highlightedIds`）。
6. **クリック1回で出します。** 出す台札は選びません。
   - 左右どちらにも出せるときは、**必ず左の台札**に出します（曖昧さを残さないための固定ルール）。
   - 出せないカードをクリックしても、何も起きません（状態は変わりません）。
7. カードを出したら、自分の山札から1枚引いて**手札を4枚に戻します**。山札が空なら手札はそのまま減っていきます。
8. **CPU は `CPU_INTERVAL_MS`（1200ms）ごとに1回だけ**、出せるカードを探して出します。人間の入力速度とは無関係に、一定の間隔で動きます。
9. **両者とも出せるカードが1枚も無いとき（デッドロック）** は、`REFILL_DELAY_MS`（700ms）後に、
   **各自の山札から1枚ずつ台札に足して**新しい台札にします（左はあなたの山札から、右は CPU の山札から）。
   - 片方の山札が空なら、その側の台札は変わりません。
   - **両方の山札が空**で、両者とも出せるカードが無いときは、そこでゲーム終了です。
10. **決着条件**
    - どちらかの**手札と山札が両方0枚**になった時点で、その人の勝ちです。
    - 上の9で終了した場合は、**残り枚数（手札 + 山札）が少ないほうの勝ち**です。同数なら引き分けです。
11. 乱数は `createRng(seed)` で固定できるようにします。`logic.ts` と `cpu.ts` で `Math.random()` は使いません。

## 今回は実装しないルール

スピードは家庭ごとの差が大きいゲームです。以下は**すべて「実装しない」が正解**です。
レビューで「このルールが無い」と指摘しないでください。

| ローカルルール | 今回の扱い |
|---|---|
| 手札を5枚以上にする | 実装しない。**手札4枚固定** |
| 台札を3枚以上にする | 実装しない。**台札2枚固定** |
| 人間 vs 人間、オンライン対戦 | 実装しない。**人間1 + CPU1 のみ** |
| ドラッグ&ドロップで台札を選んで出す | 実装しない。**クリック1回・両方出せるときは左固定** |
| 同時に出したときの取り合い（速いほうが勝つ） | 実装しない。人間の入力と CPU のタイマーは互いに独立に処理する |
| 「せーの」の掛け声で同時スタートする演出 | 実装しない。開始直後からすぐ出せる |
| ジョーカーをワイルドカードとして使う | 実装しない。`createDeck()` の52枚のみ |
| スート（マーク）の縛り・同じマークのボーナス | 実装しない。**数字だけで判定** |
| 山札が切れたら相手の山札から借りる | 実装しない |
| 出せないときのペナルティやタイムアウト | 実装しない |
| 「詰みました」を自分で宣言するボタン | 実装しない。デッドロックは `pendingDelayMs` が自動で検出する |
| 複数回戦・スコアの持ち越し | 実装しない。1回で決着 |

## 必須要件（Issue にそのまま載る）

- [ ] 52枚をシャッフルして26枚ずつに分け、手札4枚 / 台札1枚 / 山札21枚 で開始する
- [ ] `canPlay(card, pile)` が「1つ違いなら出せる・同じ数字は出せない・A と K は繋がる」を判定する
- [ ] 出せるカードが手札の中で常時ハイライトされる（`Hand` の `highlightedIds`）
- [ ] 手札のカードをクリック1回で出せる。両方の台札に出せるときは左の台札に出る
- [ ] 出せないカードをクリックしても状態が変わらない（連打しても2枚出ない）
- [ ] カードを出したら自分の山札から補充し、手札を4枚に保つ
- [ ] 両者が出せないとき `pendingDelayMs` が `REFILL_DELAY_MS` を返し、`tick` で台札が2枚とも入れ替わる
- [ ] CPU が `CPU_INTERVAL_MS` ごとに1枚だけ出す（画面側は `useCpuTurn` の1行だけ）
- [ ] 決着（手札と山札が両方0 / 両者詰み）で `ResultModal` に勝敗が出る
- [ ] `logic.test.ts` の必須テスト6件が緑になり、`npm run verify` が緑になる

## 実装の進め方（Step1 / Step2 / Step3）

調査から実装・テスト・PR まで1人で進めます。**下の目安時刻と Issue のチェックリストが、
進み具合を測る唯一の材料**です。講師は中間チェックポイントで `npm run status` を見て個別に声をかけます。
15分粘っても動かないときは、抱え込まずに `/stuck` を実行してください。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面は一切書きません。まず「出せるかどうか」をテストで固めます。

1. 定数（`CPU_INTERVAL_MS` / `REFILL_DELAY_MS` / `HAND_SIZE`）と型（`Phase` / `SpeedState` / `SpeedAction`）を書く
2. `canPlay(card, pile)` を書き、必須テストの上から4件（1つ違い / 同ランク / K→A / A→K）を緑にする
3. `createInitialState(seed)` で26枚ずつに分けるところまで作る
4. `hasPlayableCard` と `pendingDelayMs` を書き、必須テスト5件目を緑にする
5. `reduce` の `play` と `tick` を書き、必須テスト6件目（決着）を緑にする

> **ここまで終わっていれば順調: 開始から 70分**（実装時間の折り返し）

### Step2 — 画面（`SpeedGame.tsx`）

`logic.ts` には手を入れません。状態を表示するだけです。

1. `GameShell` で包み、`Hand` と `DeckPile` を並べる
2. 出せるカードの `id` を集めて `Hand` の `highlightedIds` に渡す
3. `onCardClick` で `dispatch({ type: "play", side: "you", cardId: card.id })` する
4. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く
5. `npm run dev` で最初から最後まで1回プレイする

> **ここまで終わっていれば順調: 開始から 90分**

### Step3 — 必須要件の残りと異常系テスト

1. `ResultModal` で勝敗を出す（`rankByScore` に残り枚数を渡し `"lower-is-better"` で並べると楽）
2. 「出せないカードをクリックしても状態が変わらない」を `expect(next).toBe(state)` でテストする
3. 山札が空のときの補充と、両者詰みのテストを足す
4. `index.ts` の `status` を `"ready"` に変える（テスト3件以上と、実際に描画できることが必要）
5. `npm run verify` を緑にする

> **ここまで終わっていれば順調: 開始から 105分**（`npm run verify` が緑）

## 状態の設計（雛形）

`logic.ts` に置く型と関数のシグネチャです。**中身は書いていません。自分で実装してください。**

```ts
import type { CardId, PlayingCard } from "@core";

/** CPU が1枚出す間隔。 */
export const CPU_INTERVAL_MS = 1200;
/** 両者が詰んだときに台札を足すまでの待ち時間。 */
export const REFILL_DELAY_MS = 700;
/** 手札の枚数。常にこの枚数に補充する。 */
export const HAND_SIZE = 4;

export type Phase = "playing" | "finished";

/** どちらの陣営か。 */
export type Side = "you" | "cpu";

/** 台札は2枚固定。0 が左、1 が右。 */
export type PileIndex = 0 | 1;
export type Piles = readonly [PlayingCard, PlayingCard];

/** 片方のプレイヤーが持つもの。あなたと CPU で同じ形にする。 */
export type SpeedSide = {
  readonly hand: readonly PlayingCard[];
  readonly deck: readonly PlayingCard[];
};

export type SpeedState = {
  readonly you: SpeedSide;
  readonly cpu: SpeedSide;
  readonly piles: Piles;
  readonly phase: Phase;
  /** 決着後だけ入る。引き分けは "draw"。 */
  readonly winner: Side | "draw" | null;
  readonly seed: number;
};

export type SpeedAction =
  | { readonly type: "play"; readonly side: Side; readonly cardId: CardId }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/** 最初の状態。seed を固定すると毎回同じ配りになる。 */
export function createInitialState(seed?: number): SpeedState;

/** この台札にこのカードを出せるか。1つ違いだけ true（同ランクは false、A と K は繋がる）。 */
export function canPlay(card: PlayingCard, pile: PlayingCard): boolean;

/** 出す先の台札。左右どちらにも出せるときは必ず 0（左）を返す。出せなければ null。 */
export function playablePileIndex(card: PlayingCard, piles: Piles): PileIndex | null;

/** その陣営に出せるカードが1枚でもあるか。 */
export function hasPlayableCard(side: SpeedSide, piles: Piles): boolean;

/** 両者が詰んだとき、各自の山札から1枚ずつ台札に足す。足せなければ finished にする。 */
export function refillPiles(state: SpeedState): SpeedState;

/**
 * 今、何ミリ秒後に自動処理が必要か。null は「人間の入力待ち」。
 *   finished         -> null
 *   CPU が出せる     -> CPU_INTERVAL_MS
 *   両者とも出せない -> REFILL_DELAY_MS
 *   それ以外         -> null
 */
export function pendingDelayMs(state: SpeedState): number | null;

/** 状態 + 行動 -> 新しい状態。ルールはすべてここに集める。 */
export function reduce(state: SpeedState, action: SpeedAction): SpeedState;

export function isGameOver(state: SpeedState): boolean;
```

`cpu.ts` は任意ですが、分けておくと CPU の判断だけをテストできます。

```ts
import type { CardId, Rng } from "@core";
import type { Piles, SpeedSide } from "./logic";

/** 出せるカードの中から1枚選ぶ。1枚も無ければ null。乱数は引数で受け取る。 */
export function chooseCard(side: SpeedSide, piles: Piles, rng: Rng): CardId | null;
```
