# ポーカー（poker）

| 項目 | 値 |
|---|---|
| ゲームID | `poker` |
| 担当 | 担当4 |
| 難易度 | 上級 |
| ブランチ | `feature/poker` |
| フォルダ | `src/games/poker/` |
| コンポーネント名 | `PokerGame` |

実装するルールは以下のとおりです。記載のないローカルルールは追加しません。
ここに書いていないことは「実装しない」を選びます。

## ゲームの概要

ファイブカードドローです。52枚から5枚ずつ配り、**一度だけ**好きな枚数を交換して、
できた役の強さで CPU と勝負します。

このゲームの難しさは **`evaluateHand` の1点に集中しています。** 手札5枚から役を判定する純粋関数さえ
書ければ、あとは配って・交換して・比べるだけです。上級ですが、大富豪と違って**状態遷移は単純**で、
「配る → 交換 → 判定」の3段で終わります。難所が1つしかないので**時間の見積もりが立てやすい**題材です。

9本の中でもっとも**純粋関数のテストが書きやすく、かつ網羅が要る**ゲームです。
`evaluateHand` は入力（5枚）と出力（役）がはっきりしているので、**テストを先に書く**練習に使ってください。

## プレイ構成

- **人数**: 2人固定。あなた1人 + CPU 1人（`createSoloVsCpu(1)`）。プレイヤーIDは `"you"` と `"cpu-1"` です。
- **使うカード**: 52枚。`createDeck()`。**ジョーカーは使いません。**
- **配り方**: シャッフルしたあと**5枚ずつ**配ります（`deal(deck, 2, 5)`）。残り42枚が山札になります。
- **見え方**: あなたの手札は最初から**表向き**、CPU の手札は決着まで**伏せたまま**です。
- **1回の勝負で終わり**です。チップも賭けもありません。

## 採用するルール

トランプゲームは家庭ごとにルールが違います。**このリポジトリでは次のルールで固定します。**

### 交換

- 交換は **1回だけ**です。捨てる枚数は **0枚から5枚**まで、好きに選べます。
- 手札のカードをクリックして選び、もう一度クリックすると選択が外れます。
  「交換する」を押した瞬間に確定し、そのあとは選び直せません。
- 捨てたカードは**山札に戻しません**。補充は山札の上から順に取ります。
- **CPU も同じタイミングで一度だけ交換します。** あなたが「交換する」を押したら、その処理の中で CPU の交換も済ませます。
- 交換が終わったら、そのまま判定へ進みます。**2周目はありません。**

### 判定する役（弱い順）

| 役 | `HandRank` | 条件 | `tiebreak` に入れる値（強い順） |
|---|---|---|---|
| ハイカード | `high-card` | 何も揃わない | 5枚の数値を強い順に5つ |
| ワンペア | `one-pair` | 同じ数字が2枚 | ペアの数字 |
| ツーペア | `two-pair` | 同じ数字2枚が2組 | 強いほうのペア、弱いほうのペア |
| スリーカード | `three-of-a-kind` | 同じ数字が3枚 | 3枚組の数字 |
| ストレート | `straight` | 数字が5枚とも連続 | 最も高い数字 |
| フラッシュ | `flush` | スートが5枚とも同じ | 5枚の数値を強い順に5つ |
| フルハウス | `full-house` | 3枚組 + 2枚組 | 3枚組の数字、2枚組の数字 |
| フォーカード | `four-of-a-kind` | 同じ数字が4枚 | 4枚組の数字 |
| ストレートフラッシュ | `straight-flush` | ストレート かつ フラッシュ | 最も高い数字 |

**ロイヤルストレートフラッシュは作りません。** 10-J-Q-K-A は「最も高い数字がAのストレートフラッシュ」として
自動的に最強になります。独立した役として表示したいときは発展課題です。

### 同じ役どうしの比較

- **役を構成するカードの強さ**で比べます。上の表の `tiebreak` を**先頭から順に**比べ、
  最初に差が付いたところで勝敗が決まります。
- 全部同じなら**引き分け**にします。**キッカー（余りのカード）の厳密な比較は発展課題**です。
  例: ワンペアどうしでペアの数字が同じなら、残り3枚を見ずに引き分けにします。

### A の扱い

- A は原則 **14（最強）** です。K より強く、2 より強い。
- **ストレートのときだけ2つの並びを認めます。**
  - **A-2-3-4-5** … A を 1 として扱う。`tiebreak` は **5**（最も弱いストレート）
  - **10-J-Q-K-A** … A を 14 として扱う。`tiebreak` は **14**（最も強いストレート）
- **特別扱いはこの2つだけ**です。ほかの場面で A を 1 として読むことはありません。
- 数値は `createRankStrength(RANK_ORDER_ACE_HIGH)(rank) + 2` で 2〜14 が得られます。
  `rankToNumber` は **A が 1** を返すため、そのままでは使えません。この違いに注意してください。

### CPU の交換

CPUの強さは評価対象ではないため、次の単純なルールで要件を満たせます。

- 手札に**同じ数字が2枚以上ある組**があれば、その組を残して**それ以外を全部捨てる**。
  （ワンペアなら3枚捨て、ツーペアなら1枚捨て、スリーカードなら2枚捨て、フォーカードなら1枚捨て）
- 何も揃っていなければ、**強い2枚を残して3枚捨てる**。
- **乱数は使いません。** 同じ手札なら必ず同じ判断になります（だからテストが書けます）。

## 今回は実装しないルール

「このルールが無い」と誤解されないよう、**意図的に外したもの**を明示します。

| ローカルルール | 今回の扱い |
|---|---|
| ロイヤルストレートフラッシュを独立した役にする | 不採用。10-J-Q-K-A のストレートフラッシュとして最強になる |
| キッカーまで厳密に比較する | 不採用。役を構成するカードで決まらなければ引き分け |
| ベット / レイズ / コール / フォールド / チップ | 不採用。賭けの要素は一切入れない |
| 交換を2回以上できる | 不採用。1人1回だけ |
| 交換できるのは4枚まで（5枚交換の禁止） | 不採用。0枚から5枚まで自由 |
| 3人以上で遊ぶ | 不採用。あなた + CPU 1人の2人固定 |
| ジョーカーをワイルドカードにする | 不採用。52枚のみ |
| 捨てたカードを山札に戻して混ぜ直す | 不採用。捨て札は戻さない |
| スートに強弱を付ける（スペードが最強など） | 不採用。スートの強弱は無い |
| 交換前に CPU の手札をちらっと見せる演出 | 不採用。決着まで伏せたまま |
| 複数回戦・持ち越しスコア | 不採用。1回で完結 |

## 必須要件（Issue にそのまま載る）

- [ ] 52枚をシャッフルして、あなたと CPU に5枚ずつ配る（`deal(deck, 2, 5)`。残り42枚が山札）
- [ ] あなたの手札は表向き、CPU の手札は決着まで伏せたまま表示される
- [ ] 手札のカードをクリックして交換するカードを選べる（0〜5枚。もう一度クリックで選択が外れる）
- [ ] 「交換する」を押すと選んだ枚数だけ山札から補充され、**交換は一度で終わる**（2回目は押せない）
- [ ] CPU も同じタイミングで一度だけ交換する（ペア以上があればそれ以外を捨て、無ければ3枚捨てる）
- [ ] `evaluateHand(cards)` が9種類の役を `{ rank, tiebreak }` の形で返す
- [ ] `compareHands(a, b)` が同じ役どうしを `tiebreak` で比較し、それでも並んだら引き分けになる
- [ ] A-2-3-4-5 と 10-J-Q-K-A の**両方**をストレートとして認める
- [ ] 決着すると両者の手札が表向きになり、**役名と勝敗**が `ResultModal` に出る
- [ ] 交換が終わるまで CPU の手札の中身が DOM に出ない（`face="down"`）
- [ ] CPU の交換と役の公開は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで進む（`.tsx` に `setTimeout` を書かない）
- [ ] 下の「必須テスト」8件が `logic.test.ts` にあり、`npm run verify` が成功する

## 実装の進め方（まず遊べるところまで → 仕上げ）

最初から作り込まず、**最後まで遊べる状態**を先に作ります。
遊べるようになってから、ブラウザで操作しながら足りないところを足していきます。
進み具合は Issue のチェックリストで確認してください。
進め方が分からない場合は、講師に相談してください。

### 第1段階 — 最後まで遊べるところまで

このゲームは**時間の大半を `evaluateHand` に使います。** 画面は最後に足せば間に合います。
ルールは `logic.ts` に純粋関数として書き、画面は `PokerGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

**(1) 役の判定**

1. `HandRank` / `HAND_ORDER` / `HandValue` / `Phase` / `PokerState` / `PokerAction` の型を決める
2. `cardValue(card)` を書く … `createRankStrength(RANK_ORDER_ACE_HIGH)(rank) + 2` で 2〜14 になる
3. `logic.test.ts` に**役の判定テストを先に7件書く**（この時点では全部失敗して構いません）
4. `evaluateHand(cards)` を書いて、7件を上から順に成功させていく
5. A-2-3-4-5 のストレートを通す

**(2) 比較と交換**

1. `compareHands(a, b)` … `HAND_ORDER` の添字を比べ、同じなら `tiebreak` を先頭から比べる
2. 必須テストの8件目「同じ役は tiebreak で比較する」を成功させる
3. `createInitialState(seed)` … `createDeck()` → `shuffle(deck, createRng(seed))` → `deal(deck, 2, 5)`
4. `cpu.ts` に `chooseDiscardIds(hand)` を書く
5. `exchange(state, selectedIds)` … あなたと CPU のぶんをまとめて処理し、`phase` を `"showdown"` にする
6. `reduce` / `pendingDelayMs` / `isGameOver` をつなぐ

**(3) 画面**

1. `GameShell` で包み、自分の手札を `Hand`（`face="up"`）で出す
2. `useState<string[]>` で選択中のIDを持ち、`selectedIds` と `onCardClick` を `Hand` に渡して**ゲーム側でトグル**する
3. CPU の手札を `Hand`（`face="down"`）で出し、決着後だけ `face="up"` に変える
4. 「交換する」を `Button` で置く（`phase !== "exchanging"` のときは `disabled`）
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く

ブラウザを再読み込みして、**最初から最後まで1回遊べること**を確認したら第1段階は完了です。
`logic.ts` に関数を足したら `logic.test.ts` にもテストを足し、`it(` が3件以上ある状態にしてください。

### 第2段階 — 遊びながら仕上げる

1. `ScoreBoard` に両者の役名を出し、`ResultModal` に勝敗と `Ranking`（`getRanking`）を出す
2. 異常系テスト … 交換したあとにもう一度 `{ type: "exchange" }` を送っても状態が変わらないこと
3. `README.md` に「遊び方 / 採用したルール / 実装メモ」を書く
4. `index.ts` の `status` を `"ready"` にする
5. `npm run verify` を実行して成功させる

## 状態の設計（雛形）

`logic.ts` に置く型と関数の**シグネチャだけ**を示します。中身は自分で書いてください。

```ts
import { RANK_ORDER_ACE_HIGH, createDeck, createRankStrength, createRng } from "@core";
import { createSoloVsCpu, deal, drawMany, groupByRank, groupBySuit, shuffle } from "@core";
import type { CardId, PlayerId, PlayingCard, Ranking } from "@core";

// CPU の交換と役を見せている時間。UI はこの値を参照するだけ。
export const SHOWDOWN_DELAY_MS = 900;

export type Phase = "exchanging" | "showdown" | "finished";

export type HandRank =
  | "high-card" | "one-pair" | "two-pair" | "three-of-a-kind" | "straight"
  | "flush" | "full-house" | "four-of-a-kind" | "straight-flush";

// 弱い順。強さは配列の添字で決まる（createRankStrength と同じ考え方）。
export const HAND_ORDER: readonly HandRank[] = [
  "high-card", "one-pair", "two-pair", "three-of-a-kind", "straight",
  "flush", "full-house", "four-of-a-kind", "straight-flush",
];

// 画面に出す日本語名。ここに持たせておくと .tsx に条件分岐が増えない。
export const HAND_NAME_JA: Readonly<Record<HandRank, string>>;

export type HandValue = {
  readonly rank: HandRank;
  // 役を構成するカードの数値を強い順に並べたもの。同じ役どうしはここで比べる。
  readonly tiebreak: readonly number[];
};

export type Outcome = "you" | "cpu" | "draw";

export type PokerState = {
  readonly deck: readonly PlayingCard[];
  // id は "you" / "cpu-1"。createSoloVsCpu(1) が返す並び。
  readonly hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>;
  // 交換で捨てた枚数。画面の「CPU は3枚交換しました」に使う。
  readonly exchanged: Readonly<Record<PlayerId, number>>;
  readonly phase: Phase;
  // 判定結果。showdown に入ってから入る。
  readonly values: Readonly<Record<PlayerId, HandValue>> | null;
  readonly outcome: Outcome | null;
  readonly seed: number;
};

export type PokerAction =
  | { readonly type: "exchange"; readonly cardIds: readonly CardId[] }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

// 最初の状態。5枚ずつ配って交換待ちにする。
export function createInitialState(seed?: number): PokerState;

// ポーカーでの数値。A は 14、K は 13、2 は 2。
export function cardValue(card: PlayingCard): number;

// このゲームの中心。5枚から役を判定する。
export function evaluateHand(cards: readonly PlayingCard[]): HandValue;

// a が強ければ正、b が強ければ負、並んだら 0（引き分け）。
export function compareHands(a: HandValue, b: HandValue): number;

// 選んだカードを捨てて山札から補充する。CPU のぶんもここでまとめて処理する。
export function exchange(state: PokerState, selectedIds: readonly CardId[]): PokerState;

// 勝った側が1位、負けた側が2位。引き分けは両方1位。
export function getRanking(state: PokerState): Ranking;

// 状態 + 行動 -> 新しい状態。ルールはすべてここに集める。
export function reduce(state: PokerState, action: PokerAction): PokerState;

// 今、何ms後に自動処理が要るか。null は人間の入力待ち。
export function pendingDelayMs(state: PokerState): number | null;

export function isGameOver(state: PokerState): boolean;
```

`pendingDelayMs` の考え方（`babanuki` や `speed` と同じ形にそろえます）。

- `phase === "exchanging"` … `null`（あなたが選んでボタンを押すまで、タイマーを動かさない）
- `phase === "showdown"` … `SHOWDOWN_DELAY_MS`
- `phase === "finished"` … `null`

`evaluateHand` は**この順番**で組み立てると分岐が減ります。

1. `groupByRank(cards)` で同じ数字ごとにまとめ、**枚数の多い順 → 数値の強い順**に並べ替える
2. その並びの枚数パターン（4+1 / 3+2 / 3+1+1 / 2+2+1 / 2+1+1+1 / 1が5つ）でペア系の役を決める
3. ペア系が付かなかったときだけ、フラッシュ（`groupBySuit` の組が1つ）とストレート（連番）を調べる
4. 両方成立していたらストレートフラッシュ
5. `tiebreak` は「判定する役」の表のとおりに詰める

ストレートの判定は、**数値を昇順に並べて隣との差がすべて1か**を見ます。
A-2-3-4-5 は `[2,3,4,5,14]` になるので差が1になりません。**A を 1 に読み替えた `[1,2,3,4,5]` でもう一度だけ**試してください。
この読み替えは**ここ1か所だけ**です。ほかに広げると、ワンペアの比較などが一斉に壊れます。

CPU の交換は `cpu.ts` に分けます。

```ts
// cpu.ts
import type { CardId, PlayingCard } from "@core";

// 捨てるカードのID。ペア以上があればそれ以外、無ければ弱い3枚。
export function chooseDiscardIds(hand: readonly PlayingCard[]): CardId[];
```

このゲームのCPUは乱数を使いません。同じ手札から同じ結果を得られるようにし、`Rng` は引数に取りません。
乱数を使うのは `createInitialState` のシャッフル1か所だけで、そこは `createRng(seed)` で固定します
（`Math.random()` は ESLint がエラーにします。画面側で `createInitialState(Math.floor(Math.random() * 100000))` と渡します）。

## 使う @core / @ui

`src/core/index.ts` と `src/components/index.ts` にあるものだけを使います。

### @core

| 名前 | 何のために使うか |
|---|---|
| `createDeck` | ジョーカー抜きの52枚を作る |
| `shuffle` / `createRng` | seed を固定して、毎回同じ配りを再現できるようにする |
| `deal` | 2人へ5枚ずつ配る（`deal(deck, 2, 5)`。残りが `rest`） |
| `drawMany` | 交換ぶんを山札の上からまとめて取る |
| `createRankStrength` / `RANK_ORDER_ACE_HIGH` | A を最強にした数値を作る（`+ 2` で 2〜14 になる） |
| `groupByRank` | ペア系の役（ワンペア〜フォーカード）を数える起点 |
| `groupBySuit` | フラッシュ判定（組が1つだけならフラッシュ） |
| `sortCards` | 手札の表示順を安定させる |
| `createSoloVsCpu` | 「あなた + CPU 1人」のプレイヤー一覧を作る |
| `rankByScore` | 勝ち1点 / 負け0点で `Ranking` を作る（引き分けは同点なので両方1位になる） |
| `useCpuTurn` | 画面側で待ち時間つきの自動処理を回す（使うのは1行だけ） |
| `card` / `hand` | テストで手札を組み立てる（`hand("spades-A","hearts-A","clubs-5","diamonds-9","spades-J")`） |
| 型 `PlayingCard` / `CardId` / `PlayerId` / `Ranking` / `Rng` | 状態の型付け |
| 型 `GameComponentProps` / `GameManifest` | 画面と `index.ts` の型付け |

`createTurnState` / `nextTurn` / `finishPlayer` は**使いません。** このゲームに手番の巡回はありません。
`rankToNumber` も**使いません**（A が 1 になるため）。数値は必ず `cardValue` を通します。

### @ui

| 名前 | 何のために使うか |
|---|---|
| `GameShell` | 画面の外枠。必ずこれで包む |
| `Hand` | 自分の手札（`selectedIds` と `onCardClick` で交換するカードを選ぶ）と、CPU の手札（`face="down"`） |
| `DeckPile` | 山札の残り枚数を出す |
| `Button` | 「交換する」。0枚選択でも押せる（＝交換しない） |
| `ScoreBoard` | 両者の役名（決着後）と、今どの段階かの表示 |
| `ResultModal` | 勝敗と `Ranking` |
| `GameInstructions` | `manifest.howToPlay` をそのまま渡す（任意） |

複数選択の UI は `src/games/CLAUDE.md` の「複数枚を選ぶ UI」と同じ形です。
`Hand` は選択状態を持ちません。**トグルはゲーム側の `useState` で行い、`selectedIds` に渡します。**

## 必須テスト

`logic.test.ts` に、この8件を**この名前で**書きます。カードは `hand(...)` で組み立てます。

| `it` の文字列 | 何を守っているか |
|---|---|
| `"ハイカードを判定できる"` | 何も揃わない5枚が `high-card` になること。ここが `one-pair` になると全部ずれる |
| `"ワンペアを判定できる"` | 同じ数字2枚を数えられること。`tiebreak` にペアの数字が入ること |
| `"ツーペアを判定できる"` | 2組を数え違えないこと。`tiebreak` が強いペア → 弱いペアの順であること |
| `"スリーカードを判定できる"` | 3枚組をツーペアと取り違えないこと |
| `"ストレートを判定できる"` | 連番の判定。`tiebreak` が最も高い数字であること |
| `"フラッシュを判定できる"` | スート5枚が同じこと。ペア系の判定より後に見ていること |
| `"A-2-3-4-5 をストレートと判定できる"` | Aを1として扱う例外。見落としやすいため、`tiebreak` が5になることも確認する |
| `"同じ役は tiebreak で比較する"` | ワンペアどうしで、ペアの数字が強いほうが勝つこと |

`10-J-Q-K-A` も忘れずに確認してください。「ストレートを判定できる」の中に1件足すのがおすすめです。

### 余裕があれば足すテスト（任意）

第2段階で時間が余ったら足してください。必須ではありません。**評価されるのはここです。**

- `"フルハウスを判定できる"` … 3枚組 + 2枚組をスリーカードと取り違えないこと
- `"フォーカードを判定できる"` … 4枚組をフルハウスと取り違えないこと
- `"ストレートフラッシュを判定できる"` … ストレートとフラッシュが同時に立つこと
- `"tiebreak まで同じなら引き分けになる"` … `compareHands` が 0 を返すこと
- `"交換したあとにもう一度交換しても状態が変わらない"` … 連打で2回交換できないこと
- `"0枚交換を選ぶと手札が変わらない"` … 山札も減らないこと
- `"同じ seed なら同じ配りになる"` … テストが不安定にならないこと
- `"CPU はペアを残して3枚捨てる"` … `chooseDiscardIds` が乱数なしで決まること

**フルハウス・フォーカード・ストレートフラッシュを必須テストに入れていないのは意図的です。**
時間が足りない場合は、この3つを省略できます（下の「省略順」の3番）。

## 発展課題

発展課題は、必須要件を満たして `npm run verify` が成功したあとに着手します。すべて `src/games/poker/` の中で実装できます。

- **ロイヤルストレートフラッシュ** … 10-J-Q-K-A のストレートフラッシュを `royal-flush` として独立表示する。`HAND_ORDER` の末尾に足すだけで済む
- **キッカーの厳密な比較** … ワンペアなら残り3枚も強い順に `tiebreak` へ足す。引き分けがほとんど起きなくなる
- `LogPanel` に「あなたは2枚交換しました」「CPU は3枚交換しました」の経過を出す
- 交換する前に「今の役」を表示する（`evaluateHand` を交換前の手札にも当てるだけ）
- **CPU を少し賢くする** … 同じスートが4枚あれば1枚だけ交換する、ストレートまであと1枚なら1枚だけ交換する。`cpu.ts` は純粋関数のまま保つこと
- `sortCards` で自分の手札をランク順に並べて表示する
- `useHighScore` と `gameKey` で「これまでに出した最強の役」を保存する
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- 複数回戦にして勝敗を積み上げる（`reduce` に `"next-round"` アクションを足す）
- `PokerGame.module.css` を足して、役を構成しているカードだけを光らせる

## 時間が足りないときの省略順

時間が足りない場合は、次の順に実装対象から外します。講師は進み具合を見て判断してください。

1. **発展課題を省略する。** 必須要件が終わるまでは、発展課題に着手しません。
2. **同じ役どうしの比較（`tiebreak`）を省略し、引き分けとして扱う。**
   `compareHands` は `HAND_ORDER` の添字だけを見て、同じ役なら 0 を返します。
   `HandValue` から `tiebreak` を外してよく、必須テスト「同じ役は tiebreak で比較する」も外します。
3. **ストレートフラッシュとフォーカードを省略する。** `HAND_ORDER` を `full-house` までの7種類にします。
   フルハウスまで実装すれば、ゲームとして成立します。必須テスト8件は変更しません。
4. **CPU の交換判断を「必ず3枚捨てる」に固定する。** `chooseDiscardIds` は手札の先頭3枚のIDを返すだけになります。
   `cpu.ts` の中身が3行で済み、CPU のテストも要らなくなります。
5. **`showdown` の演出を省略する。** `Phase` から `"showdown"` を外し、`pendingDelayMs` は常に `null` を返します。
   交換した瞬間に結果が出ます。`useCpuTurn` の1行は**そのまま残してください**（消すと形が崩れます）。
6. **`index.ts` の `status` を `"coming-soon"` のまま Pull Request を出す。**
   未完成でも Pull Request を出すこと自体に価値があります。この判断は講師が行います。

実装を省略した場合も、必須テスト8件を残し、`npm run verify` が成功する状態にしてください。
テストがない実装は評価されません。省略したルールは `README.md` の「実装しなかったこと」に記載してください。
書いてあれば、「バグ」ではなく「意図した割り切り」として読めます。
