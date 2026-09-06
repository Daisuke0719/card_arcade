# 七並べ（shichinarabe）

担当: **担当7** / 難易度: **中級** / ブランチ: `feature/shichinarabe` / フォルダ: `src/games/shichinarabe/`

実装するルールは以下のとおりです。記載のないローカルルールは追加しません。
GitHub Issueの本文も、このページをもとに作成されています。

## ゲームの概要

同じスートの7を起点に、場に置かれたカードの隣（±1）のカードを1枚ずつ並べていくゲームです。
置けるカードが無いときだけパスでき、パスを使いきると脱落します。手札を先に出し切った人が上位になります。

## プレイ構成

- 人数は4人。**あなた（人間）1人 + CPU 3人**です。
- 使うカードは**52枚**（ジョーカーは使いません）。`createDeck()` で作ります。
- 山札をよく切って、4人に**13枚ずつ配り切ります**（`deal(deck, 4, 13)`）。余りは出ません。
- 配り終わった直後に、4枚の7（スペード・ハート・ダイヤ・クラブ）を全員の手札から抜いて、自動で場に置きます。
  そのため開始時の手札は、7を何枚持っていたかによって **9〜13枚**になります。

## 採用するルール

トランプゲームにはさまざまなローカルルールがありますが、このゲームでは次のルールを採用します。

### 配札と開始

- 52枚を4人に13枚ずつ配り切る。配りは `shuffle(createDeck(), createRng(seed))` で行い、同じ seed なら毎回同じ配りになる。
- 配り終わったら4枚の7をすべて自動で場に置く。プレイヤーが7を手で置く操作は無い。
- **ダイヤの7を配られた人が先手**。以降は `players` の並び順（あなた → CPU1 → CPU2 → CPU3）で手番が回る。

### 場に置く

- 自分の手番でできることは「**1枚置く**」か「**パス**」のどちらか1つだけ。行動すると手番は次の人へ移る。
- 置けるのは、**同じスートで、場に置かれているカードのランクの ±1** のカードだけ。
- ランクは **A=1、2=2、…、10=10、J=11、Q=12、K=13 の直線**として扱う。
  A の下にも K の上にも何も無く、**K の次に A は繋がらない**（`cycleRank` は使わない）。
- 1手番に置けるのは1枚だけ。複数枚をまとめて置くことはできない。
- 一度置いたカードは動かない。取り戻すこともできない。

### パスと脱落

- **置けるカードが1枚でもあるときはパスできない**（必ず置く）。このときパスボタンは画面に出さない。
- 置けるカードが1枚も無いときだけパスできる。パスすると手番は次の人へ移る。
- **パスは1人につき3回まで**（`MAX_PASSES = 3`）。
- 3回使いきった人がもう一度パスする状況になったら、その場で**脱落**する（＝4回目のパスで脱落）。
- 脱落した人は、**手札を全部そのまま場に置く**。場と繋がっていないカード（飛び地）もそのまま置く。
- 脱落した人は以降の手番から飛ばされる。復帰はしない。

### 終了と順位

- 手札が0枚になった人から**上がり**。上がった人も以降の手番から飛ばされる。
- 「まだ上がっても脱落してもいない人」が1人以下になった時点でゲーム終了。
- 順位は上から次の順に並べる。
  1. 手札を出し切った人（出し切った順）
  2. 終了時に手札が残っていた人（最後の1人）
  3. 脱落した人（**脱落が遅い人ほど上**。最初に脱落した人が最下位）

### CPU と待ち時間

- CPU 3人は、置けるカードがあればその中から1枚選んで置き、なければパスする。この判断で必須要件を満たせる。
- CPU が1手を指す間隔は `CPU_DELAY_MS`（既定 700ms）。`pendingDelayMs(state)` が返す。
- 画面側は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで時間を扱う。
  `.tsx` に `setTimeout` を書いてはいけない。

## 今回は実装しないルール

以下は世の中でよく使われるローカルルールですが、**この研修では実装しません**。
「このルールが無い」と言われたときは、この表を根拠に「仕様どおり」と説明できます。

| ローカルルール | 今回の扱い |
|---|---|
| 都落ち（上がった人が条件で最下位に落ちる） | 不採用。一度上がったら順位は変わらない |
| 脱落者の手札を全員に公開する | 不採用。脱落時に場へ置くだけで、それ以外の公開はしない |
| A と K が繋がる（循環して並べられる） | 不採用。A=1 と K=13 の直線。`cycleRank` は使わない |
| パス回数を4回以上にする／無制限にする | 不採用。3回で固定（`MAX_PASSES`） |
| 出せるのにあえて出さず、相手を止める駆け引き | 不採用。出せるカードがあるときは必ず出す |
| 6と8も最初に場に置く／7以外から並べ始める | 不採用。最初に場に置くのは4枚の7だけ |
| ジョーカーを入れる | 不採用。52枚のみ |
| 1手番に複数枚まとめて置く | 不採用。1手番に1枚 |
| 脱落者が出た時点でゲームを終了する | 不採用。残った人で最後まで続ける |
| 得点・チップのやり取り、複数回戦 | 不採用。結果は順位だけ |

## 必須要件（Issue にそのまま載る）

- [ ] 52枚を4人（あなた + CPU3人）に13枚ずつ配り、開始時に4枚の7を自動で場に置く
- [ ] ダイヤの7を配られた人が先手になる
- [ ] `canPlace(board, card)` が「場のカードの ±1 だけ置ける」を判定する（A の下・K の上は無い）
- [ ] 自分の手札のうち、今置けるカードだけがクリックできる（置けないカードは押せない）
- [ ] 置けるカードが1枚でもあるときはパスできない。置けないときだけパスできる
- [ ] パスは1人3回まで。4回目のパスで脱落し、手札を全部（飛び地も）場に置いて手番から外れる
- [ ] CPU3人の手番が `pendingDelayMs` と `useCpuTurn` だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] 手札を出し切った順に順位が付き、`ResultModal` に順位表が出る
- [ ] `logic.test.ts` に「必須テスト」6件がある
- [ ] `npm run verify` が成功し、`index.ts` の `status` を `"ready"` にした

## 実装の進め方（まず遊べるところまで → 仕上げ）

最初から作り込まず、**最後まで遊べる状態**を先に作ります。
遊べるようになってから、ブラウザで操作しながら足りないところを足していきます。
進み具合は Issue のチェックリストで確認してください。
進め方が分からない場合は、講師に相談してください。

### 第1段階 — 最後まで遊べるところまで

ルールは `logic.ts` に純粋関数として書き、画面は `ShichinarabeGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. `Board` 型（`Record<Suit, boolean[]>`、index 0..12 が A..K）と `createInitialState(seed)` を書く
   （配る → 4枚の7を場に置く → ダイヤの7を持っていた人を先手にする）
2. `canPlace(board, card)` と `legalMoves(board, hand)` を書く
3. `canPlace` を見るテスト3件（7の隣・離れたカード・A の下と K の上）を足す
4. `place` / `passTurn` / `dropOut` を書く
5. `reduce(state, action)` と `pendingDelayMs(state)` でつなぐ
6. `GameShell` で包み、盤面を4スート×13マスで並べる
   （置かれていないマスは `Card` の `placeholder` で空きスロットにする）
7. 自分の手札を `Hand` で出し、`disabledIds` に「今置けないカード」を入れる
8. 他プレイヤーは `Hand variant="hidden"` で枚数だけ出す
9. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く

ブラウザを再読み込みして、**最初から最後まで1回遊べること**を確認したら第1段階は完了です。
`logic.ts` に関数を足したら `logic.test.ts` にもテストを足し、`it(` が3件以上ある状態にしてください。

### 第2段階 — 遊びながら仕上げる

1. パスボタン（置けないときだけ出す）とパス残り回数の表示
2. 脱落の反映、`ScoreBoard` の手番表示、`ResultModal` の順位表
3. 残りの必須テストと異常系テスト（手番でないときの `place` が無視される / 脱落した人が手番から飛ばされる）
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` に変える
5. `npm run verify` を実行して成功させる

## 状態の設計（雛形）

`logic.ts` に置く型と関数の形です。**実装の中身は自分たちで書きます**（ここにあるのはシグネチャだけ）。

```ts
import type { CardId, PlayerId, PlayingCard, Ranking, Suit, TurnState } from "@core";

/** CPU が1手を指すまでの待ち時間。画面はこの値を参照するだけ。 */
export const CPU_DELAY_MS = 700;

/** 1人が使えるパスの回数。これを使いきったあとのパスで脱落する。 */
export const MAX_PASSES = 3;

export type Phase = "playing" | "finished";

/**
 * 場。index 0..12 が A..K に対応し、true なら置かれている。
 * 7の位置は rankToNumber("7") - 1 === 6。
 */
export type Board = Record<Suit, boolean[]>;

export type ShichinarabeState = {
  readonly board: Board;
  /** プレイヤーIDごとの手札。 */
  readonly hands: Record<PlayerId, readonly PlayingCard[]>;
  /** 手番と「上がった順」。@core の TurnState をそのまま使う。 */
  readonly turn: TurnState;
  /** プレイヤーIDごとの、これまでに使ったパスの回数。 */
  readonly passes: Record<PlayerId, number>;
  /** 脱落した人。脱落した順に入る。 */
  readonly droppedIds: readonly PlayerId[];
  readonly phase: Phase;
  /** LogPanel に渡す進行ログ（新しいものが先頭）。 */
  readonly log: readonly string[];
  readonly seed: number;
};

export type ShichinarabeAction =
  | { readonly type: "place"; readonly cardId: CardId }
  | { readonly type: "pass" }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/** 最初の状態。seed を固定すると毎回同じ配りになる（テスト用）。 */
export function createInitialState(seed?: number): ShichinarabeState;

/** その1枚を今の場に置けるか。同じスートで ±1 の隣が置かれているときだけ true。 */
export function canPlace(board: Board, card: PlayingCard): boolean;

/** 手札のうち今置けるカードだけを返す。0件のときだけパスできる。 */
export function legalMoves(board: Board, hand: readonly PlayingCard[]): PlayingCard[];

/** 1枚置いて次の人へ手番を移す。置けないカードを渡されたら state をそのまま返す。 */
export function place(
  state: ShichinarabeState,
  playerId: PlayerId,
  card: PlayingCard,
): ShichinarabeState;

/** パスして次の人へ。置けるカードがあるときは state をそのまま返す。 */
export function passTurn(state: ShichinarabeState, playerId: PlayerId): ShichinarabeState;

/** 脱落。手札を全部（飛び地も）場に置き、手番から外す。 */
export function dropOut(state: ShichinarabeState, playerId: PlayerId): ShichinarabeState;

/** 順位表。上がった順 → 残った人 → 脱落した人（脱落が早い人ほど下）。 */
export function getRanking(state: ShichinarabeState): Ranking;

/** null は人間の入力待ち。CPU の手番のときだけ待ち時間を返す。 */
export function pendingDelayMs(state: ShichinarabeState): number | null;

/** 状態 + 行動 -> 新しい状態。ルールはすべてここに集まる。 */
export function reduce(
  state: ShichinarabeState,
  action: ShichinarabeAction,
): ShichinarabeState;

export function isGameOver(state: ShichinarabeState): boolean;
```

CPU を `cpu.ts` に分けるときは、乱数を引数で受け取る薄い層にします。

```ts
import type { PlayingCard, Rng } from "@core";

/** 置ける候補から1枚選ぶ。候補が空なら null（＝パス）。 */
export function chooseCard(moves: readonly PlayingCard[], rng: Rng): PlayingCard | null;
```

`pendingDelayMs` は、次の3つの条件で定義します。

- `phase` が `"finished"` なら `null`
- 今の手番が CPU なら `CPU_DELAY_MS`
- それ以外（プレイヤーの手番）は `null`

## 使う @core / @ui

`src/core/index.ts` と `src/components/index.ts` にある名前だけを使います。ここに無いものは「無い」と考えてください。

### @core

| 名前 | 何のために使うか |
|---|---|
| `createDeck` | 52枚の山札を作る |
| `createRng` / `shuffle` | seed を固定して同じ配りを再現する |
| `deal` | 4人に13枚ずつ配る（`deal(deck, 4, 13)`） |
| `createSoloVsCpu` | あなた + CPU3人の `Player[]` を作る |
| `createTurnState` | 先手（ダイヤの7の人）を指定して手番を作る |
| `nextTurn` | 手番を次の人へ移す（上がった人は自動で飛ばされる） |
| `finishPlayer` | 上がった人・脱落した人を手番から外す |
| `isFinished` / `alivePlayers` / `isOver` | 生存者の判定とゲーム終了の判定 |
| `isCurrent` | そのプレイヤーが今の手番か（画面の強調に使う） |
| `SUITS` | 盤面を4スート分まわす |
| `rankToNumber` / `numberToRank` | ランクと 1..13 の相互変換（盤面の index に使う） |
| `sortCards` / `groupBySuit` | 手札をスート・ランク順に並べて見やすくする |
| `cardLabel` / `SUIT_SYMBOL` / `SUIT_NAME_JA` | 表示とログの文字列 |
| `rankByFinishOrder` | 上がった順から `Ranking` を作る |
| `useCpuTurn` | `pendingDelayMs` と組にして CPU の手番を進める（画面側だけ） |
| `card` / `hand` | テストでカードを作る（`card("hearts", "8")`） |

型は `PlayingCard` / `CardId` / `Suit` / `PlayerId` / `TurnState` / `Ranking` / `Rng` /
`GameManifest` / `GameComponentProps` を使います。

**`cycleRank` は使いません。** K の次に A が繋がってしまい、このゲームのルールと矛盾します。

### @ui

| 名前 | 何のために使うか |
|---|---|
| `GameShell` | 画面の外枠。必ずこれで包む |
| `Card` | 盤面の1マス。置かれていないマスは `placeholder` で空きスロットにする |
| `Hand` | 自分の手札（`disabledIds` で置けないカードを押せなくする）／他プレイヤーは `variant="hidden"` で枚数だけ |
| `Button` | パス、もう一度 |
| `ScoreBoard` | 4人の残り枚数・パス残り回数・今の手番（`isCurrent` / `isFinished`） |
| `LogPanel` | 「CPU2 がパスしました（残り1回）」などの進行ログ |
| `ResultModal` | 終了時の順位表（`ranking` に `getRanking(state)` を渡す） |

`GameInstructions` は `GameShell` が `manifest.howToPlay` から自動で表示するので、自分で置く必要はありません。

## 必須テスト

`logic.test.ts` に、この6件を**この文言で**書いてください。評価の対象です。

| `it` の文字列 | 何を守っているか |
|---|---|
| `7の隣（6と8）は置ける` | `canPlace` の基本。±1 が置けること |
| `場から離れたカードは置けない` | 既存の列から離れた位置へカードを置けないこと（ルールの中心） |
| `A の下と K の上には置けない` | 直線であること。K→A の循環が紛れ込んでいないことの検出 |
| `出せるカードがあるときはパスできない` | 「出せるなら必ず出す」の強制。ここが緩むとゲームが終わらなくなる |
| `3回パスしたあと、4回目のパスで脱落し手札が全部場に出る` | 脱落の境界値。飛び地も含めて場に出ること |
| `手札を出し切った順に順位が付く` | 上がり順が `Ranking` に正しく反映されること |

余裕があれば、第2段階で次の異常系も足してください。

- `自分の手番でないときの place は無視される`
- `脱落した人は以降の手番から飛ばされる`
- `開始時に4枚の7が場に置かれている`
- `ダイヤの7を配られた人が先手になる`
- `同じ seed なら同じ配りになる`

## 発展課題

発展課題は、必須要件を満たして `npm run verify` が成功したあとに着手します。いずれも `src/games/shichinarabe/` の中で実装できます。

- CPU を少し賢くする（自分の手札が続いているスートを優先する／端に近いカードから出す）。
  判断は `cpu.ts` の純粋関数に置き、テストを書く。
- `LogPanel` に「CPU2 がパスしました（残り1回）」「CPU3 が脱落しました」を出す。
- `ScoreBoard` の `detail` に「残り7枚 / パス残り2回」を出す。
- `ShichinarabeGame.module.css` を追加して、直前に置かれたカードを一瞬ハイライトする。
- 次に置けるマス（各スートの両端）の空きスロットだけ枠を光らせる。
- `useHighScore` と `gameKey` で「1位になった回数」を保存して表示する。
- 画面の隅に `seed` を表示し、同じ配りをやり直せるようにする。

## 時間が足りないときの省略順

時間が足りない場合は、次の順に実装対象から外します。1〜3は参加者の判断で省略できます。4と5は必須要件が減るため、
省略する前に講師へ確認してください。

1. **進行ログと演出** — `LogPanel` と、置いたときのハイライト。動作には影響しません。
2. **CPU の賢さ** — `legalMoves` の先頭をそのまま出すだけにする。ゲームは最後まで進みます。
3. **パス残り回数の表示** — 画面表示だけ省略し、`passes` のカウントとルールは残す。
4. **順位の並べ替え** — 脱落した人を下に回す処理をやめ、上がった順だけを `ResultModal` に出す。
   （必須要件1件と、順位に関する一部のテストが対象外になります）
5. **脱落ルールそのもの** — パスを無制限にする。「出せるカードがあるときは必ず出す」を守っていれば、
   場の端に置けるカードは必ず誰かの手札にあり、その人の手番で必ず置かれます。
   つまり**脱落が無くてもゲームは必ず終わります**。
   （必須テスト1件と必須要件1件が対象外になるため、ほかの項目を省略しても間に合わない場合に限ります）

`npm run verify` を成功させることを優先します。必要に応じて省略できる要件を減らし、検証が成功するPull Requestを提出してください。
