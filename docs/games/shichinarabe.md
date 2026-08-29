# 七並べ（shichinarabe）

担当: **担当7** / 難易度: **中級** / ブランチ: `feature/shichinarabe` / フォルダ: `src/games/shichinarabe/`

このページが七並べの**ルールの正典**です。研修中に「このルールはどうなってる？」と迷ったら、
実装やレビューではなくこのページの記述に従ってください。GitHub Issue の本文もここから転記されています。

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

トランプゲームは家庭ごとにルールが違います。**このゲームでは以下が唯一の正解**です。

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

- CPU 3人は、置けるカードがあればその中から1枚選んで置き、無ければパスする。単純なルールで十分。
- CPU が1手を指す間隔は `CPU_DELAY_MS`（既定 700ms）。`pendingDelayMs(state)` が返す。
- 画面側は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで時間を扱う。
  `.tsx` に `setTimeout` を書いてはいけない。

## 今回は実装しないルール

以下は世の中でよく使われるローカルルールですが、**この研修では実装しません**。
「このルールが無い」というレビュー指摘は、この表を根拠に「仕様どおり」と返してください。

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
- [ ] `npm run verify` が緑になり、`index.ts` の `status` を `"ready"` にした

## 実装の進め方（Step1 / Step2 / Step3）

時刻は**研修開始からの経過分**です。実装時間は45分から始まります。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面は一切さわりません。`npm test` だけで進めます。

1. `Board` 型（`Record<Suit, boolean[]>`、index 0..12 が A..K）と `createInitialState(seed)` を書く
   （配る → 4枚の7を場に置く → ダイヤの7を持っていた人を先手にする）
2. `canPlace(board, card)` と `legalMoves(board, hand)` を書く
3. `place` / `passTurn` / `dropOut` を書く
4. `reduce(state, action)` と `pendingDelayMs(state)` でつなぐ
5. 必須テストのうち `canPlace` を見る3件（7の隣・離れたカード・A の下と K の上）を先に書く

**目安: 65分。** ここで `npm test` が緑で、必須テスト6件のうち4件以上が書けていれば順調です。

### Step2 — 画面（`ShichinarabeGame.tsx`）

1. `GameShell` で包む
2. 盤面を4スート×13マスで並べる（置かれていないマスは `Card` の `placeholder` で空きスロットにする）
3. 自分の手札を `Hand` で出し、`disabledIds` に「今置けないカード」を入れる
4. 他プレイヤーは `Hand variant="hidden"` で枚数だけ出す
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行書く

**目安: 85分。** ここで `npm run dev` を開き、**最初から最後まで1回自分でプレイできれば**順調です。

### Step3 — 必須要件の残りと異常系テスト

1. パスボタン（置けないときだけ出す）とパス残り回数の表示
2. 脱落の反映、`ScoreBoard` の手番表示、`ResultModal` の順位表
3. 異常系のテスト（手番でないときの `place` が無視される／脱落した人が手番から飛ばされる など）
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` に変える
5. `npm run verify`

**目安: 95分（遅くとも105分）。** 110分から Pull Request 作成に入るので、それまでに verify を緑にします。

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

`pendingDelayMs` の定義はこれだけです。迷ったらこの3行に戻ってください。

- `phase` が `"finished"` なら `null`
- 今の手番が CPU なら `CPU_DELAY_MS`
- それ以外（人間の手番）は `null`

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
| `場から離れたカードは置けない` | 飛び地を勝手に置けないこと（ルールの中心） |
| `A の下と K の上には置けない` | 直線であること。K→A の循環が紛れ込んでいないことの検出 |
| `出せるカードがあるときはパスできない` | 「出せるなら必ず出す」の強制。ここが緩むとゲームが終わらなくなる |
| `3回パスしたあと、4回目のパスで脱落し手札が全部場に出る` | 脱落の境界値。飛び地も含めて場に出ること |
| `手札を出し切った順に順位が付く` | 上がり順が `Ranking` に正しく反映されること |

余裕があれば、次の異常系も足してください（Step3）。

- `自分の手番でないときの place は無視される`
- `脱落した人は以降の手番から飛ばされる`
- `開始時に4枚の7が場に置かれている`
- `ダイヤの7を配られた人が先手になる`
- `同じ seed なら同じ配りになる`

## 発展課題

**必須要件が全部終わってから**手を付けてください。いずれも `src/games/shichinarabe/` の中だけで完結します。

- CPU を少し賢くする（自分の手札が続いているスートを優先する／端に近いカードから出す）。
  判断は `cpu.ts` の純粋関数に置き、テストを書く。
- `LogPanel` に「CPU2 がパスしました（残り1回）」「CPU3 が脱落しました」を出す。
- `ScoreBoard` の `detail` に「残り7枚 / パス残り2回」を出す。
- `ShichinarabeGame.module.css` を追加して、直前に置かれたカードを一瞬ハイライトする。
- 次に置けるマス（各スートの両端）の空きスロットだけ枠を光らせる。
- `useHighScore` と `gameKey` で「1位になった回数」を保存して表示する。
- 画面の隅に `seed` を表示し、同じ配りをやり直せるようにする。

## 時間が足りないときに落とす順番

**上から順に落とします。** 1〜3 は自分の判断で落としてかまいません。4 と 5 は必須要件が減るので、
落とす前に**講師に確認**してください。

1. **進行ログと演出** — `LogPanel` と、置いたときのハイライト。動作には影響しません。
2. **CPU の賢さ** — `legalMoves` の先頭をそのまま出すだけにする。ゲームは最後まで進みます。
3. **パス残り回数の表示** — 画面表示だけ落とし、`passes` のカウントとルールは残す。
4. **順位の並べ替え** — 脱落した人を下に回す処理をやめ、上がった順だけを `ResultModal` に出す。
   （必須要件が1件と、順位まわりのテストの一部が落ちます）
5. **脱落ルールそのもの** — パスを無制限にする。「出せるカードがあるときは必ず出す」を守っていれば、
   場の端に置けるカードは必ず誰かの手札にあり、その人の手番で必ず置かれます。
   つまり**脱落が無くてもゲームは必ず終わります**。
   （必須テスト1件と必須要件1件が落ちるので、これは最後の手段です）

`npm run verify` を緑にすることが最優先です。要件を1つ落としてでも、緑の Pull Request を出してください。

## レビュアー向けミッション（このゲームの壊れやすい所）

七並べをレビューするのは **担当6（スピード担当）** です。
仕様を知らなくても意味のある検証ができるよう、次の3つを実機（`npm run dev`）で試してください。

### 1. CPU の手番中に自分の手札を連打する

**手順**: 自分が1枚置いた直後、CPU3人が動いている間に、自分の手札を何度もクリックする。

**期待**: 何も起きない。自分の手番が回ってきたときに、押した分がまとめて反映されたり、
2枚同時に場へ出たりしない。自分の手番で押した1枚だけが場に出る。

**なぜ壊れやすいか**: 手番のチェックを `reduce` ではなく画面側の `disabled` だけに頼っていると、
連打やタイミング次第ですり抜けます。

### 2. パスできる条件を確かめる

**手順**: 自分の手番のたびに、手札の中に**押せる（明るい）カードがあるか**を見る。

**期待**:

- 押せるカードが1枚でもあるとき → **パスボタンが出ていない**（押せない）
- 押せるカードが1枚も無いとき → **パスボタンが出ていて押せる**
- 「出せるのにパスできる」「出せないのにパスできない」のどちらにもならない

**なぜ壊れやすいか**: 「出せるなら必ず出す」が緩むと、全員がパスし続けてゲームが終わらなくなります。

### 3. 誰かを脱落させて、そのあとの盤面と順位を見る

**手順**: 同じ人（自分でも CPU でもよい）が**4回目のパス**をするまで進める。パスの残り回数は画面に出ています。

**期待**:

- 脱落した瞬間、その人の手札が**全部**場に出る。7から離れた飛び地（例: ハートは7〜9しか無いのにハートの K）も出る
- 脱落した人には以降の手番が回ってこない
- ゲーム終了後の順位表で、**脱落した人が、手札を出し切った人より上に来ていない**

**なぜ壊れやすいか**: 脱落は「手札が0枚になる」点で上がりとよく似ていますが、順位では逆の扱いです。
まとめて `finishedIds` に入れてしまうと、脱落した人が1位になります。

---

**関連ドキュメント**: `CLAUDE.md`（絶対に守る5条） / `src/games/CLAUDE.md`（@core・@ui の早見表） /
`src/games/example-game/`（お手本） / `docs/troubleshooting.md`（詰まったとき）
