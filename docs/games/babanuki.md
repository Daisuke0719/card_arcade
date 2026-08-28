# ババ抜き（babanuki）

| 項目 | 値 |
|---|---|
| ゲームID | `babanuki` |
| 担当 | Team A |
| 難易度 | 初級 |
| ブランチ | `feature/babanuki` |
| フォルダ | `src/games/babanuki/` |
| コンポーネント名 | `BabanukiGame` |
| このゲームをレビューするチーム | Team F |

**このファイルがルールの正典です。** 迷ったらここに書いてあるとおりに実装してください。
ここに書いていないことは「実装しない」を選びます。

## ゲームの概要

53枚（52枚 + 赤いジョーカー1枚）を4人で分け合い、同じ数字が2枚そろったら捨てていくゲームです。
手札を先に無くした順に上がりとなり、最後までジョーカーを持っていた1人が最下位になります。

## プレイ構成

- **人数**: 4人固定。あなた1人 + CPU 3人（`createSoloVsCpu(3)`）。
- **使うカード**: 53枚。`createDeckWithJokers(1)` が返す 52枚 + 赤いジョーカー1枚。
- **配り方**: シャッフルしたあと4人へ**配り切り**ます。端数は先頭のプレイヤーから1枚多くなるので、
  **あなたが14枚、CPU 1 / CPU 2 / CPU 3 が13枚ずつ**です（`deal(deck, 4)` の既定の挙動）。
- **配札直後**: 各自の手札から同じ数字のペアを**自動で**捨てた状態でゲームが始まります。
  そのため、開始直後の手札は14枚 / 13枚より少なくなります。

## 採用するルール

トランプゲームは家庭ごとにルールが違います。**このリポジトリでは次のルールで固定します。**

- ジョーカーは**赤1枚だけ**。黒のジョーカーは使いません。
- **ペアの条件は「同じランクが2枚」だけ**です。スート（マーク）も色も一切関係ありません。
  つまり ♠7 と ♥7 はペアになります。
- 同じランクが**3枚**あるときは、**先頭の2枚だけ**を捨てて1枚を手札に残します。
- 同じランクが**4枚**あるときは、**2ペアとも**捨てて0枚にします。
- **ジョーカーはどのカードともペアになりません。** 必ず誰かの手札に残り続けます。
- 手番のプレイヤーは、**左隣**のプレイヤーの手札から**裏向きの1枚**を引きます。
  引く方向は**左隣に固定**です（プレイヤーが方向や相手を選ぶことはできません）。
  画面には引く向きが分かる矢印を出します。
- 引いた結果ペアがそろったら、**その場で即座に**2枚とも捨てます。
- 引く相手が**すでに上がっていたら飛ばして**、その次の生存者から引きます
  （`neighborId(state.turn)` が上がった人を自動で飛ばします）。
- 手札が**0枚**になったプレイヤーはその時点で**上がり**です。
  以降、手番も回ってこず、引かれる対象にもなりません。
- 順位は**上がった順**です。1位・2位・3位が上がった人、
  **最後に残った1人（＝ジョーカーを持っている人）が4位（最下位）**です。
- 生存者が1人になった時点でゲーム終了です。最後の1人はジョーカー1枚を持った状態で残ります。
- 引かれた側の手札は内部でシャッフルされます（どこを引いたか分からないようにするため）。
  画面上のカードの位置が入れ替わるアニメーションは作りません。

## 今回は実装しないルール

「このルールが無い」というレビュー指摘を防ぐために、**意図的に外したもの**を明示します。

| ローカルルール | 今回の扱い |
|---|---|
| ジョーカー2枚（赤・黒）を入れる | 不採用。赤1枚のみ |
| 同じ色（赤同士・黒同士）でないとペアにできない | 不採用。ランクが同じなら色は問わない |
| 同じランク3枚を3枚まとめて捨てる | 不採用。先頭2枚だけ捨てて1枚残す |
| 引く相手や引く方向を自分で選ぶ | 不採用。左隣に固定 |
| 引く前に相手の手札の位置をシャッフルして見せる演出 | 不採用。内部で入れ替えるだけ |
| 引いたカードを相手に見せない（自分だけ見る） | 不採用。引いたカードは1枚だけ画面に表示する |
| ジョーカーを引かせるための駆け引き（表情・出し方） | 不採用。CPU は乱数で1枚引くだけ |
| 上がったあとも観戦扱いで手番を回す | 不採用。上がった人は手番からも引かれる対象からも外す |
| 最下位だけを決めて他の順位を付けない | 不採用。上がった順に1位〜4位まで付ける |
| 複数回戦・持ち越しスコア | 不採用。1回で完結 |

## 必須要件（Issue にそのまま載る）

- [ ] 53枚（52枚 + 赤ジョーカー1枚）を4人へ配り切る（あなた14枚 / CPU 各13枚）
- [ ] 配札直後に、各プレイヤーの手札から同じランクのペアが自動で捨てられている
- [ ] 手番のプレイヤーは左隣の手札から裏向きの1枚を引ける（あなたの手番は裏向きのカードをクリックして引く）
- [ ] 引いた結果ペアがそろったら、その場で2枚とも捨てられる
- [ ] 引く相手がすでに上がっているときは、その人を飛ばして次の生存者から引く
- [ ] 手札が0枚になったプレイヤーは上がりになり、手番からも引かれる対象からも外れる
- [ ] 生存者が1人になったらゲームが終了し、上がった順の順位が `ResultModal` に出る
- [ ] 他プレイヤーの手札は裏向き（`face="down"`）で表示され、中身が DOM に出ない
- [ ] CPU の手番は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] 下の「必須テスト」6件が `logic.test.ts` にあり、`npm run verify` が緑になる

## 実装の進め方（Step1 / Step2 / Step3）

時刻はすべて**研修開始からの経過分**です。実装時間は 45分〜95分に割り当てられています。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面はまだ触りません。`react` を import せずに書けるところだけを作ります。

1. `Phase` / `BabanukiState` / `BabanukiAction` の型を決める
2. `createInitialState(seed)` … `createDeckWithJokers(1)` → `shuffle(deck, createRng(seed))` → `deal(deck, 4)` → 各手札に `discardPairs`
3. `discardPairs(hand)` を書き、テスト3件（2枚 / 3枚 / ジョーカー）を先に通す
4. `drawCard(state, index)` と `nextAlivePlayer(state)` を書く
5. `reduce` / `pendingDelayMs` / `isGameOver` をつなぐ

**目安: 70分の時点で `npm test` が緑（必須テスト6件のうち4件以上が通っている）**

### Step2 — 画面（`BabanukiGame.tsx`）

`logic.ts` に手を入れずに、状態を表示するだけの画面を作ります。

1. `GameShell` で包み、自分の手札を `Hand`（`face="up"`）で出す
2. 他プレイヤーの手札を `Hand`（`face="down"`）で出し、左隣に引く向きの矢印を添える
3. 自分の手番のときだけ、左隣の裏向きカードに `onCardClick` を付ける
4. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く
5. `npm run dev` で開き、**最初から最後まで1回通して遊ぶ**

**目安: 85分の時点で、最初から最後まで1回遊び切れる**

### Step3 — 必須要件の残りと異常系テスト

1. 上がり処理（`finishPlayer`）と順位（`rankByFinishOrder`）、`ResultModal` の表示
2. 残りの必須テスト2件（上がった人のスキップ / 順位）
3. 異常系テスト … CPU の手番中に自分がクリックしても状態が変わらないこと
4. `index.ts` の `status` を `"ready"` にする
5. `npm run verify` を実行して緑にする

**目安: 95分の時点で `npm run verify` が緑**

## 状態の設計（雛形）

`logic.ts` に置く型と関数の**シグネチャだけ**を示します。中身は自分で書いてください。

```ts
import { createDeckWithJokers, createRng, createSoloVsCpu, createTurnState, deal, shuffle } from "@core";
import type { AnyCard, PlayerId, Ranking, Rng, TurnState } from "@core";

/** CPU が1枚引くまでの待ち時間。UI はこの値を参照するだけ。 */
export const CPU_DRAW_DELAY_MS = 900;

/** 引いたカードを見せている時間。 */
export const REVEAL_DELAY_MS = 700;

export type Phase = "playing" | "revealing" | "finished";

export type BabanukiState = {
  /** プレイヤーIDごとの手札。id は "you" / "cpu-1" / "cpu-2" / "cpu-3"。 */
  readonly hands: Readonly<Record<PlayerId, readonly AnyCard[]>>;
  /** 手番と上がった順は @core の TurnState に持たせる（自作しない）。 */
  readonly turn: TurnState;
  readonly phase: Phase;
  /** 直前に引かれたカード。revealing の間だけ入る。 */
  readonly lastDrawn: AnyCard | null;
  /** これまでに引いた回数。CPU 用の Rng を作る種に使う。 */
  readonly drawCount: number;
  readonly seed: number;
};

export type BabanukiAction =
  | { readonly type: "draw"; readonly index: number }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/** 最初の状態。配り切ったあとペアを捨てた状態を返す。 */
export function createInitialState(seed?: number): BabanukiState;

/** 手札から同ランクのペアを取り除く。3枚なら1枚残る。ジョーカーは必ず残る。 */
export function discardPairs(hand: readonly AnyCard[]): AnyCard[];

/** 手番のプレイヤーが、左隣の index 番目のカードを引く。 */
export function drawCard(state: BabanukiState, index: number): BabanukiState;

/** 今の手番から見た「引く相手」。生存者が自分だけなら undefined。 */
export function nextAlivePlayer(state: BabanukiState): PlayerId | undefined;

/** 上がった順の順位。最後の1人は最下位として並ぶ。 */
export function getRanking(state: BabanukiState): Ranking;

/** 状態 + 行動 -> 新しい状態。ルールはすべてここに集める。 */
export function reduce(state: BabanukiState, action: BabanukiAction): BabanukiState;

/** 今、何ms後に自動処理が要るか。null は人間の入力待ち。 */
export function pendingDelayMs(state: BabanukiState): number | null;

export function isGameOver(state: BabanukiState): boolean;
```

`pendingDelayMs` の考え方（`speed` や `daifugo` と同じ形にそろえます）。

- `phase === "finished"` … `null`
- `phase === "revealing"` … `REVEAL_DELAY_MS`
- 手番が CPU … `CPU_DRAW_DELAY_MS`
- 手番があなた … `null`（クリック待ちなのでタイマーを動かさない）

CPU がどのカードを引くかは `cpu.ts` に分けます。

```ts
// cpu.ts
import type { Rng } from "@core";

/** 相手の手札の枚数から、引く位置を1つ選ぶ。 */
export function chooseDrawIndex(handSize: number, rng: Rng): number;
```

`logic.ts` の中で乱数が必要になったら、`createRng(state.seed + state.drawCount)` のように
**状態から決まる seed** で作ります（`Math.random()` は ESLint がエラーにします）。

## 使う @core / @ui

`src/core/index.ts` と `src/components/index.ts` にあるものだけを使います。

### @core

| 名前 | 何のために使うか |
|---|---|
| `createDeckWithJokers` | 52枚 + 赤ジョーカー1枚の53枚を作る |
| `shuffle` / `createRng` | seed を固定して、毎回同じ配りを再現できるようにする |
| `deal` | 4人へ配り切る（先頭が1枚多い 14/13/13/13） |
| `createSoloVsCpu` | 「あなた + CPU 3人」のプレイヤー一覧を作る |
| `createTurnState` | 手番・向き・上がった順をまとめて持つ |
| `neighborId` | 「左隣の生存者」を1行で求める（上がった人は自動で飛ばす） |
| `nextTurn` | 次の手番へ進める |
| `finishPlayer` | 手札が0枚になった人を上がりにする |
| `alivePlayers` / `isFinished` / `isOver` | 残っている人・上がった人・終了の判定 |
| `partitionJokers` | 手札をジョーカーとそれ以外に分けてからペアを探す |
| `groupByRank` | 同じランクごとにまとめてペアを見つける |
| `rankByFinishOrder` | 上がった順の順位表を作る（最後の1人は最下位になる） |
| `useCpuTurn` | 画面側で待ち時間つきの自動処理を回す（使うのは1行だけ） |
| `card` / `joker` | テストで手札を組み立てる |
| 型 `AnyCard` / `PlayerId` / `TurnState` / `Ranking` / `Rng` | 状態の型付け |
| 型 `GameComponentProps` / `GameManifest` | 画面と `index.ts` の型付け |

### @ui

| 名前 | 何のために使うか |
|---|---|
| `GameShell` | 画面の外枠。必ずこれで包む |
| `Hand` | 自分の手札（`face="up"`）と、引く相手の手札（`face="down"`） |
| `Card` | 直前に引いたカードを1枚だけ見せる |
| `ScoreBoard` | 4人の残り枚数と、今が誰の手番かを出す |
| `ResultModal` | 決着後の順位表 |
| `Button` | 「もう一度」など補助の操作 |
| `GameInstructions` | 遊び方の短い説明を画面に置く（任意） |

## 必須テスト

`logic.test.ts` に、この6件を**この名前で**書きます。

| `it` の文字列 | 何を守っているか |
|---|---|
| `"同じランクが2枚あると両方とも捨てられる"` | ペア判定の基本。スートが違っても同ランクならペアになること |
| `"同じランクが3枚なら1組だけ捨てて1枚残る"` | 境界値。3枚を全部消してしまうバグを止める |
| `"ジョーカーはペアにならず手札に残る"` | ジョーカーが消えると勝負がつかなくなる |
| `"引いた結果ペアがそろったら即座に捨てられる"` | 引く処理とペア掃除がつながっていること |
| `"上がった人は手番からも引く相手からもスキップされる"` | 手札0枚の相手から引こうとして固まる事故を止める |
| `"上がった順に順位が付く"` | 最後に残った1人が最下位になること |

余裕があれば、次の異常系も足してください（評価されるのはここです）。

- CPU の手番中に `{ type: "draw" }` を送っても状態が変わらない（連打で先に進めない）
- 同じ seed で `createInitialState` を2回呼ぶと、同じ配りになる

## 発展課題

**必須要件が全部終わってから**手を付けてください。すべて `src/games/babanuki/` の中だけで実装できます。

- `sortCards` で自分の手札をランク順に並べて表示する
- `LogPanel` に「あなたが CPU 1 から1枚引きました」「CPU 2 が上がりました」の経過を出す
- 引かれた側の手札を引かれるたびにシャッフルし直す（`shuffle` に状態から作った `Rng` を渡す）
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で「1位になった回数」または「最短決着時間」を保存する
- CPU の引き方を少し賢くする（直前に自分が引かれた位置を避ける、など）
- `BabanukiGame.module.css` を足して、自分の手番のときに手札を光らせる

## 時間が足りないときに落とす順番

**上から順に落とします。** 講師が進み具合を見て判断するための材料です。

1. **発展課題を全部やめる**（並べ替え表示・ログ・記録保存・タイマー・独自 CSS）
2. **引いたカードを見せる演出をやめる**。`Phase` から `"revealing"` を外し、`pendingDelayMs` は
   「手番が CPU なら `CPU_DRAW_DELAY_MS`、それ以外は `null`」だけにする
3. **`ScoreBoard` をやめて、残り枚数を素のテキストで出す**（画面の組み立て時間を削る）
4. **CPU を3人から1人に減らす**（あなた + CPU 1 の2人対戦。27枚 / 26枚）。
   ルールも `logic.ts` の構造も変わりません。`index.ts` の `minPlayers` / `maxPlayers` を触るので、
   **必ず講師に確認してから**変更してください
5. **ジョーカーをやめて「52枚からスペードのAを1枚抜いた51枚」方式にする**。
   孤立した1枚がババになるので、遊び方も画面も同じままです。
   `createDeckWithJokers(1)` を `createDeck()` + スペードのAを1枚除外に差し替えるだけで済みます

ここまで落としても、**必須テスト6件と `npm run verify` が緑になることは落としません。**
テストが無い実装は評価されません。

## レビュアー向けミッション（このゲームの壊れやすい所）

このゲームをレビューするのは **Team F** です。`npm run dev` でババ抜きを開き、次の3つを実際に操作してください。
ババ抜きの仕様を知らなくても、書いてあるとおりに動かせば判定できます。

### ミッション1: 配札直後のペア掃除を5回試す

ゲームを開き、やり直し（リセット）を**5回**繰り返します。毎回、開始直後の**自分の手札**を見て、
**同じ数字が2枚以上並んでいないこと**を確認してください。

- 同じ数字が2枚残っていたら、配札直後の自動ペア捨てが漏れています。
- 同じ数字が1枚だけ残っているのは**正しい状態**です（3枚あったうちの1枚）。

### ミッション2: 誰かが上がった直後の手番を見る

CPU が1人上がるまで進め、その直後の**自分の手番**で次を確認してください。

- 上がった CPU の手札欄が**空**になり、そこから引けないこと（クリックしても何も起きない）。
- 引く向きの矢印が、**上がった人を飛ばして次の生存者**を指していること。
- CPU の手番中に相手の手札を**連打**しても、自分の番が来る前に引けてしまわないこと。

画面が固まる・上がった人から1枚引けてしまう、が典型的なバグです。

### ミッション3: 最後まで遊び切って順位を確認する

決着（生存者が1人になるまで）まで遊び、結果画面を確認してください。

- 順位が**上がった順**に1位・2位・3位と並んでいること。
- **最後に残った1人が4位**として表示され、その人の手札が**ジョーカー1枚**であること。
- 4位の人が「上がった」扱いになっていないこと（4人全員が上がった表示になっていたら誤りです）。
