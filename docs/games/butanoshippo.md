# ぶたのしっぽ（butanoshippo）

| 項目 | 値 |
|---|---|
| ゲームID | `butanoshippo` |
| 担当 | 担当5 |
| 難易度 | 初級 |
| ブランチ | `feature/butanoshippo` |
| フォルダ | `src/games/butanoshippo/` |
| コンポーネント名 | `ButanoshippoGame` |
| このゲームをレビューする人 | 担当4（ポーカー担当） |

**このファイルがルールの正典です。** 迷ったらここに書いてあるとおりに実装してください。
ここに書いていないことは「実装しない」を選びます。

## ゲームの概要

52枚を伏せたまま輪に並べ、手番の人が1枚ずつめくって場の中央に重ねていくゲームです。
めくったカードが**直前にめくられたカードと同じ数字**だったら、
そこまでに積まれた場札を**全部その人が引き取り**ます。
輪が尽きたら終了で、**引き取った枚数が一番少ない人が勝ち**です。

## プレイ構成

- **人数**: 4人固定。あなた1人 + CPU 3人（`createSoloVsCpu(3)`）。
- **使うカード**: 52枚。`createDeck()` が返す標準のデッキ。ジョーカーは使いません。
- **並べ方**: シャッフルした52枚を**手札に配らず**、伏せたまま**輪**として場に並べます。
  配る処理（`deal`）は使いません。全員が同じ1つの輪からめくります。
- **画面での輪の見せ方**: 横一列に並べ、幅が足りなければ**折り返し**て構いません。
  ただし「これは輪になっていて、最後まで行ったら終わり」ということが分かるように、
  次にめくるカードに印を付け、残り枚数を必ず表示します。
- **手番の順**: あなた → CPU 1 → CPU 2 → CPU 3 → あなた…の固定の一方向です。

## 採用するルール

トランプゲームは家庭ごとにルールが違います。**このリポジトリでは次のルールで固定します。**

- 手番の人は、輪から**1枚**めくって場の中央に重ねます。めくる枚数は必ず1枚です。
- めくる位置は**輪の先頭に固定**です（どこをめくるかは選べません）。
- めくったカードが、**直前にめくられたカードと同じ数字（ランク）**だったら、
  その時点で場に積まれているカードを**全部そのプレイヤーが引き取り**ます。
- **同じ数字の判定はランクだけ**です。スート（マーク）も色も一切関係ありません。
  つまり ♠7 の次に ♥7 が出たら一致です（`sameRank` がそのまま使えます）。
- 場札が**1枚しかない**とき（直前のカードが無いとき）は、比べる相手がいないので一致しません。
- 引き取りが起きたら**場が空になり**、次にめくったカードは「1枚目」からやり直しです。
- 引き取りの直後は、**引き取った人の次の人**から再開します。
  引き取った人がもう一度めくることはありません。
- 引き取りが起きなかったときは、そのまま**次の人**へ手番が移ります。
- **輪のカードが尽きたらゲーム終了**です。最後の1枚で引き取りが起きた場合は、
  **引き取りを済ませてから**終了します（引き取り処理を飛ばして終わらせない）。
- 終了時に場に残ったカードは**誰も引き取りません**。そのまま数えずに終わります。
- 順位は**引き取った枚数が少ない順**です。少ない人が1位、多い人が最下位になります。
  枚数が同じ人は同順位で構いません（`rankByScore` の既定の挙動）。
- 全員の引き取り枚数は**常に画面に出します**（誰が危ないかが見えないと遊びになりません）。

## 今回は実装しないルール

「このルールが無い」というレビュー指摘を防ぐために、**意図的に外したもの**を明示します。

| ローカルルール | 今回の扱い |
|---|---|
| 全員が同時にカードへ手を伸ばし、早い者勝ちで押し付け合う | **不採用。ターン制に簡略化する。** 同時押しの判定は DOM のイベント競合の話になり、カードゲームの学習から外れるため研修の範囲外とする |
| 一致したとき、最後に手を置いた人が引き取る（最遅ペナルティ） | 不採用。同時押しをしないので、**めくった本人**が引き取る |
| 同じスートが続いても引き取り | 不採用。判定はランクだけ |
| 数字が隣り合う（7 の次に 8）でも引き取り | 不採用。同じランクのときだけ |
| ジョーカーを入れて特殊札にする | 不採用。52枚ちょうど |
| 引き取ったカードを輪に戻す（終わらない形式） | 不採用。引き取ったカードは抜けたままにする |
| 輪の好きな位置からめくる | 不採用。先頭に固定 |
| 引き取りが多い人だけを負けにして他は順位なし | 不採用。少ない順に1位〜4位まで付ける |
| 制限時間内にめくらないと取られる | 不採用。人間の手番は待ち時間なしで待つ |
| 複数回戦・持ち越しスコア | 不採用。1回で完結 |

## 必須要件（Issue にそのまま載る）

- [ ] 52枚が伏せたまま輪として並び、次にめくるカードと残り枚数が画面で分かる
- [ ] 手番のプレイヤーが輪から1枚めくり、場の中央に重なる（あなたの手番は先頭のカードをクリック）
- [ ] めくったカードが直前のカードと同じランクなら、場札を全部そのプレイヤーが引き取る
- [ ] 引き取りが起きると場が空になり、**引き取った人の次の人**から再開する
- [ ] 輪のカードが尽きたらゲームが終了する（最後の1枚の引き取りも処理してから終わる）
- [ ] 4人の引き取り枚数が常に画面に出ている（`ScoreBoard`）
- [ ] 引き取り枚数が少ない順の順位が `ResultModal` に出る
- [ ] 輪のカードは裏向き（`face="down"`）で表示され、中身が DOM に出ない
- [ ] CPU の手番は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] CPU の手番中や引き取りの演出中にクリックしても場が進まない
- [ ] 下の「必須テスト」6件が `logic.test.ts` にあり、`npm run verify` が緑になる

## 実装の進め方（Step1 / Step2 / Step3）

時刻はすべて**研修開始からの経過分**です。実装時間は 45分〜95分に割り当てられています。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面はまだ触りません。`react` を import せずに書けるところだけを作ります。

1. `Phase` / `ButanoshippoState` / `ButanoshippoAction` の型を決める
2. `createInitialState(seed)` … `createDeck()` を `shuffle(deck, createRng(seed))` して `ring` に入れ、
   `pile` は空、`collected` は全員0、`turn` は `createTurnState(createSoloVsCpu(3))`
3. `isMatch(prev, next)` を書き、テスト2件（同じランク / 違うランク）を先に通す
4. `flipNext(state)` … 輪の先頭を1枚めくって `pile` の末尾に積む
5. `collectPile(state)` … `pile` を全部いまの手番の人に足し、`pile` を空にして次の人へ渡す
6. `reduce` / `pendingDelayMs` / `isGameOver` / `getRanking` をつなぐ

**目安: 70分の時点で `npm test` が緑（必須テスト6件のうち4件以上が通っている）**

### Step2 — 画面（`ButanoshippoGame.tsx`）

`logic.ts` に手を入れずに、状態を表示するだけの画面を作ります。

1. `GameShell` で包み、`headerRight` に `ScoreBoard`（4人の引き取り枚数と手番）を置く
2. 輪を `Card`（`face="down"`）の並びで出し、**先頭の1枚だけ** `highlighted` にする
3. 場の中央を `DeckPile`（`top` に一番上のカード、`face="up"`）で出す
4. 自分の手番のときだけ、輪の先頭カードに `onClick` を付けて `{ type: "flip" }` を送る
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く
6. `npm run dev` で開き、**最初から最後まで1回通して遊ぶ**

**目安: 85分の時点で、最初から最後まで1回遊び切れる**

### Step3 — 必須要件の残りと異常系テスト

1. 終了処理と `getRanking`、`ResultModal` の表示
2. 残りの必須テスト2件（輪が尽きたら終了 / 引き取った人の次から再開）
3. 異常系テスト … CPU の手番中や引き取りの演出中に `{ type: "flip" }` を送っても状態が変わらないこと
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` にする
5. `npm run verify` を実行して緑にする

**目安: 95分の時点で `npm run verify` が緑**

## 状態の設計（雛形）

`logic.ts` に置く型と関数の**シグネチャだけ**を示します。中身は自分で書いてください。

```ts
import { createDeck, createRng, createSoloVsCpu, createTurnState, nextTurn, sameRank, shuffle } from "@core";
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

- `phase === "finished"` … `null`
- `phase === "collecting"` … `COLLECT_DELAY_MS`
- 手番が CPU … `CPU_INTERVAL_MS`
- 手番があなた … `null`（クリック待ちなのでタイマーを動かさない）

**`cpu.ts` は作りません。** CPU は「輪の先頭を1枚めくる」だけで、選ぶものが何も無いからです。
`reduce` の中で `flipNext(state)` を呼べばそれが CPU の手番になります。
乱数を使うのは `createInitialState` の最初のシャッフル1回だけで、そこも `createRng(seed)` で固定します
（`Math.random()` は ESLint がエラーにします）。

`reduce` の分担は次のとおりです。ここを混ぜると連打で先へ進めるバグになります。

- `"flip"` … `phase === "playing"` かつ**手番があなた**のときだけ `flipNext`。それ以外は `state` をそのまま返す
- `"tick"` … `phase === "collecting"` なら `collectPile`、`phase === "playing"` で**手番が CPU** なら `flipNext`
- `"reset"` … `createInitialState(action.seed ?? state.seed + 1)`

## 使う @core / @ui

`src/core/index.ts` と `src/components/index.ts` にあるものだけを使います。

### @core

| 名前 | 何のために使うか |
|---|---|
| `createDeck` | 52枚を作る（ジョーカーは使わない） |
| `shuffle` / `createRng` | seed を固定して、毎回同じ輪の並びを再現できるようにする |
| `createSoloVsCpu` | 「あなた + CPU 3人」のプレイヤー一覧を作る |
| `createTurnState` | 手番をまとめて持つ（自作の `currentIndex` を作らない） |
| `nextTurn` | めくったあと・引き取ったあとに次の人へ手番を進める |
| `isCurrent` | 「今があなたの手番か」を画面とガードで判定する |
| `draw` | 輪の先頭を1枚めくる（`{ card, rest }` が返る） |
| `last` | 場札の一番上（＝直前にめくられた1枚）を取る |
| `requireCard` | 「ここには必ずカードがある」場所で undefined を弾く |
| `sameRank` | 同じ数字かどうかの判定。スートと色は見ない |
| `rankByScore` | 引き取り枚数で順位を付ける（第2引数に `"lower-is-better"` を渡す） |
| `useCpuTurn` | 画面側で待ち時間つきの自動処理を回す（使うのは1行だけ） |
| `card` | テストで輪や場札を組み立てる |
| 型 `PlayingCard` / `PlayerId` / `TurnState` / `Ranking` | 状態の型付け |
| 型 `GameComponentProps` / `GameManifest` | 画面と `index.ts` の型付け |

`rankByScore` が付ける `detail` は「3点」の形になります。ここでは点ではなく**引き取り枚数**なので、
画面に「数字は引き取った枚数です」と1行添えてください（「3枚」表記に直すのは発展課題です）。

### @ui

| 名前 | 何のために使うか |
|---|---|
| `GameShell` | 画面の外枠。必ずこれで包む |
| `Card` | 輪の1枚（`face="down"`）。次にめくる1枚だけ `highlighted` にする |
| `DeckPile` | 場の中央の山（`count` に場札の枚数、`top` に一番上のカード） |
| `ScoreBoard` | 4人の引き取り枚数と、今が誰の手番か |
| `ResultModal` | 決着後の順位表 |
| `Button` | 「もう一度」など補助の操作 |
| `GameInstructions` | 遊び方の短い説明を画面に置く（任意） |

輪は `Card` を52個並べて作ります。`Hand` は手札用なので使いません（輪は誰の手札でもないため）。

## 必須テスト

`logic.test.ts` に、この6件を**この名前で**書きます。

| `it` の文字列 | 何を守っているか |
|---|---|
| `"同じ数字が続いたら場札を全部引き取る"` | 引き取り判定の基本。スートが違っても同ランクなら一致すること |
| `"違う数字なら場に積まれるだけで引き取りは起きない"` | 何でも引き取ってしまうバグを止める |
| `"引き取りのあと場が空になる"` | 場札の消し忘れ。次のめくりが古い1枚と比べられる事故を止める |
| `"輪のカードが尽きたらゲームが終了する"` | 終了条件。空の輪をめくり続けて固まる事故を止める |
| `"引き取った枚数が一番少ない人が1位になる"` | 順位の向き。多い人が1位になる取り違えを止める |
| `"引き取った人の次の人から再開する"` | 手番の進み方。引き取った人が続けてめくる事故を止める |

余裕があれば、次の異常系も足してください（評価されるのはここです）。

- CPU の手番中に `{ type: "flip" }` を送っても状態が変わらない（連打で先に進めない）
- `phase === "collecting"` の間に `{ type: "flip" }` を送っても状態が変わらない
- 同じ seed で `createInitialState` を2回呼ぶと、同じ輪の並びになる
- 最後の1枚が一致だったとき、引き取りを済ませてから終了する

## 発展課題

**必須要件が全部終わってから**手を付けてください。すべて `src/games/butanoshippo/` の中だけで実装できます。
このゲームは9本の中で最も単純で、必須要件が早く終わります。だから発展課題を厚めに用意しています。

- `LogPanel` に「CPU 2 が ♥7 をめくって5枚 引き取りました」の経過を出す
- 順位表の `detail` を「3枚」表記に直す（`rankByScore` を使わず `Ranking` を自分で組み立てる）
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で「あなたの最少引き取り枚数」を保存する（少ないほど良い記録）
- `ButanoshippoGame.module.css` を足し、`transform: rotate()` で輪を**本物の円形**に並べる
- 引き取りの瞬間、場札が引き取った人の方へ動く演出を付ける
- 「あと何枚で輪が一周するか」と「引き取りが起きた回数」を出す
- 引き取り枚数が最多の人の欄を赤くして、危ない人がひと目で分かるようにする
- `sortCards` で自分が引き取ったカードをランク順に一覧表示する（`collected` を枚数ではなくカード配列で持つ）
- `useCountdown` で人間の手番に制限時間を付け、時間切れなら自動でめくる（本来の反射神経ゲームに一歩近づく）
- CPU ごとに待ち時間を変え、「速い CPU」「慎重な CPU」の個性を出す

## 時間が足りないときに落とす順番

**上から順に落とします。** 講師が進み具合を見て判断するための材料です。

1. **発展課題を全部やめる**（ログ・記録保存・タイマー・円形レイアウト・独自 CSS）
2. **引き取りの演出をやめる**。`Phase` から `"collecting"` を外し、`flipNext` の中で即座に引き取る。
   `pendingDelayMs` は「手番が CPU なら `CPU_INTERVAL_MS`、それ以外は `null`」だけにする
3. **輪の52枚表示をやめて、`DeckPile` 1つと「めくる」`Button` にする**（画面の組み立て時間を削る）。
   残り枚数は `DeckPile` の `count` に出るので、ルールは何も変わりません
4. **`ScoreBoard` をやめて、4人の引き取り枚数を素のテキストで出す**
5. **CPU を3人から1人に減らす**（あなた + CPU 1 の2人対戦）。
   ルールも `logic.ts` の構造も変わりません。`index.ts` の `minPlayers` / `maxPlayers` を触るので、
   **必ず講師に確認してから**変更してください
6. **順位表示をやめて、`ResultModal` の `score` に「あなたが引き取った枚数」だけを出す**。
   `getRanking` を呼ばなくなるので、順位のテストは `collected` の値を直接見る形に書き直します

ここまで落としても、**必須テスト6件と `npm run verify` が緑になることは落としません。**
テストが無い実装は評価されません。

## レビュアー向けミッション（このゲームの壊れやすい所）

このゲームをレビューするのは **担当4（ポーカー担当）** です。`npm run dev` でぶたのしっぽを開き、
次の3つを実際に操作してください。ぶたのしっぽの仕様を知らなくても、書いてあるとおりに動かせば判定できます。

壊れやすいのはこの3か所です。ミッションはそれぞれに対応しています。

1. **「直前の1枚」の取り違え** … 場札の末尾ではなく先頭と比べている / 引き取り後も古い1枚が残っている
2. **引き取り直後の手番** … 引き取った人がもう一度めくる / 1人飛ばして2人先に回る
3. **最後の1枚** … 輪が尽きるときに引き取りが飛ばされ、枚数の合計が合わなくなる

### ミッション1: 引き取りが起きる瞬間を3回見る

同じ数字が2回続くまで進め、その瞬間を**3回**確認してください。

- 一致した瞬間に、**場に積まれていたカードが全部**その人の枚数に足されていること。
- 引き取りの直後、場の中央が**空**になっていること（カードが1枚も残っていない）。
- 空になった直後の1枚目のめくりで、**引き取りが起きない**こと。
  1枚目で引き取りが起きたら、消したはずの古いカードと比べています。

### ミッション2: 引き取った直後の手番を見る

引き取りが起きた直後、次にめくるのが誰かを確認してください。

- **引き取った人の次の人**がめくること。引き取った人が続けてめくったら誤りです。
- 1人飛ばして2人先に回っていないこと（`ScoreBoard` の手番表示で分かります）。
- CPU の手番中や引き取りの演出中に輪を**連打**しても、自分の番より先にめくれてしまわないこと。

### ミッション3: 最後まで遊び切って枚数を確認する

輪が尽きるまで遊び、結果画面を確認してください。

- 順位が**引き取り枚数の少ない順**に1位から4位まで並んでいること（多い人が1位なら逆です）。
- 4人の引き取り枚数の合計と、**場に残ったカードの枚数**を足すと **52枚**になること。
  合わなければ、最後の引き取りが飛ばされたか、二重に数えています。
- 輪が0枚になったあとにクリックしても、何も起きず画面が固まらないこと。
