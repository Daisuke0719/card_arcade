# ババ抜き（babanuki）

| 項目             | 値                    |
| ---------------- | --------------------- |
| ゲームID         | `babanuki`            |
| 担当             | 担当1                 |
| 難易度           | 初級                  |
| ブランチ         | `feature/babanuki`    |
| フォルダ         | `src/games/babanuki/` |
| コンポーネント名 | `BabanukiGame`        |

この文書に記載したルールを実装します。記載のないローカルルールは追加しません。

## ゲームの概要

53枚（52枚 + 赤いジョーカー1枚）を4人で分け合い、同じ数字が2枚そろったら捨てていくゲームです。
手札を先に無くした順に上がりとなり、最後までジョーカーを持っていた1人が最下位になります。

## プレイ構成

- **人数**: 4人固定。プレイヤー1人 + CPU 3人（`createSoloVsCpu(3)`）。
- **使うカード**: 53枚。`createDeckWithJokers(1)` が返す 52枚 + 赤いジョーカー1枚。
- **配り方**: シャッフルしたあと4人へ**配り切り**ます。端数は先頭のプレイヤーから1枚多くなるので、
  プレイヤーが14枚、CPU 1 / CPU 2 / CPU 3が13枚ずつです（`deal(deck, 4)` の既定の挙動）。
- **配札直後**: 各自の手札から同じ数字のペアを**自動で**捨てた状態でゲームが始まります。
  そのため、開始直後の手札は14枚 / 13枚より少なくなります。

## 採用するルール

このリポジトリでは、次のルールを採用します。

- ジョーカーは赤1枚だけを使用し、黒のジョーカーは使用しません。
- ペアの条件は「同じランクが2枚」です。スート（マーク）と色は問いません。
  たとえば、♠7 と ♥7 はペアになります。
- 同じランクが**3枚**あるときは、**先頭の2枚だけ**を捨てて1枚を手札に残します。
- 同じランクが**4枚**あるときは、**2ペアとも**捨てて0枚にします。
- ジョーカーはどのカードともペアにならず、いずれかのプレイヤーの手札に残ります。
- 手番のプレイヤーは、**左隣**のプレイヤーの手札から**裏向きの1枚**を引きます。
  引く方向は左隣に固定し、方向や相手は選択できません。
  画面には引く向きが分かる矢印を出します。
- 引いた結果ペアがそろったら、その場で2枚とも捨てます。
- 引く相手がすでに上がっていた場合は、その次の残っているプレイヤーから引きます
  （`neighborId(state.turn)` が上がった人を自動で飛ばします）。
- 手札が0枚になったプレイヤーは、その時点で上がりです。
  以降、手番も回ってこず、引かれる対象にもなりません。
- 順位は**上がった順**です。1位・2位・3位が上がった人、
  最後に残った1人（ジョーカーを持っているプレイヤー）が4位（最下位）です。
- 生存者が1人になった時点でゲーム終了です。最後の1人はジョーカー1枚を持った状態で残ります。
- 引かれた側の手札は内部でシャッフルされます（どこを引いたか分からないようにするため）。
  画面上のカードの位置が入れ替わるアニメーションは作りません。

## 今回は実装しないルール

今回採用しないローカルルールを次に示します。

| ローカルルール                                     | 今回の扱い                                           |
| -------------------------------------------------- | ---------------------------------------------------- |
| ジョーカー2枚（赤・黒）を入れる                    | 不採用。赤1枚のみ                                    |
| 同じ色（赤同士・黒同士）でないとペアにできない     | 不採用。ランクが同じなら色は問わない                 |
| 同じランク3枚を3枚まとめて捨てる                   | 不採用。先頭2枚だけ捨てて1枚残す                     |
| 引く相手や引く方向を自分で選ぶ                     | 不採用。左隣に固定                                   |
| 引く前に相手の手札の位置をシャッフルして見せる演出 | 不採用。内部で入れ替えるだけ                         |
| 引いたカードを相手に見せない（自分だけ見る）       | 不採用。引いたカードは1枚だけ画面に表示する          |
| ジョーカーを引かせるための駆け引き（表情・出し方） | 不採用。CPU は乱数で1枚引くだけ                      |
| 上がったあとも観戦扱いで手番を回す                 | 不採用。上がった人は手番からも引かれる対象からも外す |
| 最下位だけを決めて他の順位を付けない               | 不採用。上がった順に1位〜4位まで付ける               |
| 複数回戦・持ち越しスコア                           | 不採用。1回で完結                                    |

## 必須要件（Issue にそのまま載る）

- [ ] 53枚（52枚 + 赤ジョーカー1枚）を4人へ配り切る（プレイヤー14枚 / CPU各13枚）
- [ ] 配札直後に、各プレイヤーの手札から同じランクのペアが自動で捨てられている
- [ ] 手番のプレイヤーは左隣の手札から裏向きの1枚を引ける（プレイヤーの手番では裏向きのカードをクリックして引く）
- [ ] 引いた結果ペアがそろったら、その場で2枚とも捨てられる
- [ ] 引く相手がすでに上がっているときは、その人を飛ばして次の生存者から引く
- [ ] 手札が0枚になったプレイヤーは上がりになり、手番からも引かれる対象からも外れる
- [ ] 生存者が1人になったらゲームが終了し、上がった順の順位が `ResultModal` に出る
- [ ] 他プレイヤーの手札は裏向き（`face="down"`）で表示され、中身が DOM に出ない
- [ ] CPU の手番は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] 下の「必須テスト」6件が `logic.test.ts` にあり、`npm run verify` が成功する

## 実装の進め方

最初に、ゲームを最後まで操作できる状態を作ります。
その後、ブラウザで動作を確認しながら、残りの要件を実装します。
進行状況は Issue のチェックリストで確認し、不明点があれば講師に相談してください。

### 第1段階 — ゲームを最後まで操作できる状態にする

ルールは `logic.ts` に純粋関数として書き、画面は `BabanukiGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. `Phase` / `BabanukiState` / `BabanukiAction` の型を決める
2. `createInitialState(seed)`: `createDeckWithJokers(1)` → `shuffle(deck, createRng(seed))` → `deal(deck, 4)` → 各手札に `discardPairs`
3. `discardPairs(hand)` を書き、テストを3件（2枚 / 3枚 / ジョーカー）足す
4. `drawCard(state, index)` と `nextAlivePlayer(state)` を書く
5. `reduce` / `pendingDelayMs` / `isGameOver` をつなぐ
6. `GameShell` で囲み、プレイヤーの手札を `Hand`（`face="up"`）で表示する
7. 他のプレイヤーの手札を `Hand`（`face="down"`）で表示し、左隣に引く向きの矢印を添える
8. プレイヤーの手番だけ、左隣の裏向きカードに `onCardClick` を設定する
9. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行だけ記述する

ブラウザを再読み込みし、最初から最後まで1回操作できることを確認したら、第1段階は完了です。
`logic.ts` に関数を追加したら、`logic.test.ts` にもテストを追加し、`it(` を3件以上にします。

### 第2段階 — 残りの要件を実装する

1. 上がり処理（`finishPlayer`）と順位（`rankByFinishOrder`）、`ResultModal` の表示
2. 残りの必須テスト2件（上がった人のスキップ / 順位）
3. 異常系テスト: CPU の手番中にプレイヤーがクリックしても状態が変わらないこと
4. `index.ts` の `status` を `"ready"` にする
5. `npm run verify` を実行し、成功を確認する

## 状態の設計（雛形）

`logic.ts` に置く型と関数のシグネチャを示します。各関数の実装は含まれていません。

```ts
import {
  createDeckWithJokers,
  createRng,
  createSoloVsCpu,
  createTurnState,
  deal,
  shuffle,
} from "@core";
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

- `phase === "finished"`: `null`
- `phase === "revealing"`: `REVEAL_DELAY_MS`
- 手番が CPU: `CPU_DRAW_DELAY_MS`
- プレイヤーの手番: `null`（クリック待ちなのでタイマーを動かさない）

CPU がどのカードを引くかは `cpu.ts` に分けます。

```ts
// cpu.ts
import type { Rng } from "@core";

/** 相手の手札の枚数から、引く位置を1つ選ぶ。 */
export function chooseDrawIndex(handSize: number, rng: Rng): number;
```

`logic.ts` の中で乱数が必要になったら、`createRng(state.seed + state.drawCount)` のように
状態から決まるseedで作ります（`Math.random()` はESLintがエラーとして検出します）。

## 使う @core / @ui

`src/core/index.ts` と `src/components/index.ts` にあるものだけを使います。

### @core

| 名前                                                        | 用途                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| `createDeckWithJokers`                                      | 52枚 + 赤ジョーカー1枚の53枚を作る                       |
| `shuffle` / `createRng`                                     | seed を固定して、毎回同じ配りを再現できるようにする      |
| `deal`                                                      | 4人へ配り切る（先頭が1枚多い 14/13/13/13）               |
| `createSoloVsCpu`                                           | 「プレイヤー + CPU 3人」の一覧を作る                     |
| `createTurnState`                                           | 手番・向き・上がった順をまとめて持つ                     |
| `neighborId`                                                | 左隣に残っているプレイヤーを求める（上がった人は対象外） |
| `nextTurn`                                                  | 次の手番へ進める                                         |
| `finishPlayer`                                              | 手札が0枚になった人を上がりにする                        |
| `alivePlayers` / `isFinished` / `isOver`                    | 残っている人・上がった人・終了の判定                     |
| `partitionJokers`                                           | 手札をジョーカーとそれ以外に分けてからペアを探す         |
| `groupByRank`                                               | 同じランクごとにまとめてペアを見つける                   |
| `rankByFinishOrder`                                         | 上がった順の順位表を作る（最後の1人は最下位になる）      |
| `useCpuTurn`                                                | 画面側で待ち時間を設けて CPU の処理を実行する            |
| `card` / `joker`                                            | テストで手札を組み立てる                                 |
| 型 `AnyCard` / `PlayerId` / `TurnState` / `Ranking` / `Rng` | 状態の型付け                                             |
| 型 `GameComponentProps` / `GameManifest`                    | 画面と `index.ts` の型付け                               |

### @ui

| 名前               | 用途                                                         |
| ------------------ | ------------------------------------------------------------ |
| `GameShell`        | ゲーム画面の共通レイアウト                                   |
| `Hand`             | 自分の手札（`face="up"`）と、引く相手の手札（`face="down"`） |
| `Card`             | 直前に引いたカードを1枚だけ表示する                          |
| `ScoreBoard`       | 4人の残り枚数と現在の手番を表示する                          |
| `ResultModal`      | 決着後の順位表                                               |
| `Button`           | 「もう一度」など補助の操作                                   |
| `GameInstructions` | 遊び方の短い説明を画面に置く（任意）                         |

## 必須テスト

`logic.test.ts` に、次の6件を記載の名前で作成します。

| `it` の文字列                                          | 確認する内容                                               |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| `"同じランクが2枚あると両方とも捨てられる"`            | ペア判定の基本。スートが違っても同ランクならペアになること |
| `"同じランクが3枚なら1組だけ捨てて1枚残る"`            | 3枚のうち2枚だけが捨てられること                           |
| `"ジョーカーはペアにならず手札に残る"`                 | ジョーカーが手札に残ること                                 |
| `"引いた結果ペアがそろったら即座に捨てられる"`         | 引く処理とペア掃除がつながっていること                     |
| `"上がった人は手番からも引く相手からもスキップされる"` | 手札が0枚のプレイヤーが手番と引く相手から外れること        |
| `"上がった順に順位が付く"`                             | 最後に残った1人が最下位になること                          |

必須テストの完了後、次の異常系も追加できます。

- CPU の手番中に `{ type: "draw" }` を送っても状態が変わらない（連打で先に進めない）
- 同じ seed で `createInitialState` を2回呼ぶと、同じ配りになる

## 発展課題

必須要件を満たし、`npm run verify` が成功してから発展課題に着手します。いずれも `src/games/babanuki/` の中で実装できます。

- `sortCards` で自分の手札をランク順に並べて表示する
- `LogPanel` に「プレイヤーが CPU 1 から1枚引きました」「CPU 2 が上がりました」の経過を表示する
- 引かれた側の手札を引かれるたびにシャッフルし直す（`shuffle` に状態から作った `Rng` を渡す）
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で「1位になった回数」または「最短決着時間」を保存する
- CPU が、直前に自分のカードを引かれた位置を避けるようにする
- `BabanukiGame.module.css` を追加し、プレイヤーの手番に手札を強調表示する

## 時間が足りないときの省略順

時間が足りない場合は、講師が進行状況を確認し、次の順に実装対象から外します。

1. 発展課題を省略する（並べ替え表示・ログ・記録保存・タイマー・独自 CSS）
2. 引いたカードを表示する演出を省略する。`Phase` から `"revealing"` を外し、`pendingDelayMs` は
   「手番が CPU なら `CPU_DRAW_DELAY_MS`、それ以外は `null`」だけにする
3. `ScoreBoard` を省略し、残り枚数をテキストで表示する
4. CPU を3人から1人に減らす（プレイヤー1人 + CPU 1人の2人対戦。27枚 / 26枚）。
   ルールも `logic.ts` の構造も変わりません。`index.ts` の `minPlayers` / `maxPlayers` を変更するため、
   変更前に講師へ確認する
5. ジョーカーを使わず、「52枚からスペードのAを1枚抜いた51枚」方式にする。
   孤立した1枚がババになるので、遊び方も画面も同じままです。
   `createDeckWithJokers(1)` を、`createDeck()` からスペードのAを1枚除外する処理に置き換えます

実装を省略した場合も必須テスト6件を残し、`npm run verify` が成功する状態にします。
テストがない実装は評価対象になりません。
