# ダウト（doubt）

担当: Team E / 難易度: 中級 / ブランチ: `feature/doubt` / フォルダ: `src/games/doubt/`

このページが**ルールの正典**です。実装・レビュー・Issue の記述で食い違いが出たときは、
このページの記述を正しいものとして扱ってください。

## ゲームの概要

宣言されたランクのカードを裏向きで出し合い、うそを見抜いた人が得をする心理戦です。
うそを見抜けば出した人に場札を押しつけ、見抜けなければ自分が場札を全部引き取ります。

## プレイ構成

| 項目 | 内容 |
|---|---|
| 人数 | 4人（あなた1人 + CPU3人）。`createSoloVsCpu(3)` で作る |
| 使うカード | 52枚（ジョーカーなし）。`createDeck()` |
| 配り方 | 4人に13枚ずつ配り切る。`deal(deck, 4, 13)` |
| 先手 | 必ず「あなた」（`you`）から始める |
| 手番の回り | `you` → `cpu-1` → `cpu-2` → `cpu-3` → `you` … の一方向 |

配り方に乱数を使うので、`createInitialState(seed)` で seed を固定できるようにします。
テストでは必ず seed を渡してください。

## 採用するルール

- **宣言ランクは自動で決まる。** ゲーム開始時は `A`。誰もダウトしなければ、次の人の宣言は1つ上がります
  （`A` → `2` → … → `K` → `A` → …）。`cycleRank(rank, 1)` で循環します。**プレイヤーは宣言ランクを選べません。**
- **手番の人は、手札から1〜4枚を選んで裏向きに場へ出します。** 出すカードは何でもかまいません
  （宣言ランクと違うカードを混ぜてもよい ＝ うそをつける）。
- **手番の人は必ず出します。** パスはできません。手札が1枚しかなければ1枚出します。
- **出した直後、他のプレイヤーが手番順に1人ずつ「ダウトするか」を決めます。**
  順番は出した人の左隣から。**最初にダウトした1人でその場は確定**し、それより後ろの人には聞きません。
  すでに上がった人には聞きません。
- **ダウトが起きたら、直前に出された組だけを表向きに公開します。**
  - 公開したカードが**1枚でも宣言ランクと違えば「ダウト当たり」** → **出した人**が場札を全部引き取る
  - **全部が宣言ランクと一致していれば「ダウト外れ」** → **ダウトした人**が場札を全部引き取る
- **引き取りは常に場札の全部**です。一部だけ引き取ることはありません。
- **引き取りが起きたら場札は空になり、宣言ランクは `A` にリセット**されます。
  次の手番は**引き取った人の次の人**から始まります。
- **誰もダウトしなければ**、出されたカードは裏向きのまま場札に積まれ、宣言ランクが1つ進み、次の人の手番になります。
- **他プレイヤーの手札は枚数だけを表示します。** `Hand variant="hidden"` を使い、実カードを DOM に入れません。
- **手札が0枚になった人が上がりです。** ただし上がりの確定は**その場の決着がついてから**です。
  出した直後に手札が0になっても、ダウトが当たって場札を引き取った場合は上がりになりません。
- **上がった人は、以後の手番からもダウト判断からも外れます**（`finishPlayer` と `neighborId` が自動で飛ばします）。
- **残り1人になったらゲーム終了。** 最後まで残った1人が最下位です。上がった順がそのまま順位になります。
- **CPU の判断は単純なルールベース**です。「宣言ランクのカードを自分が何枚持っているか」と「場札の枚数」だけを見ます。
  凝った推論や履歴の記憶は作りません。

## 今回は実装しないルール

| ローカルルール | 今回の扱い |
|---|---|
| 複数人が同時にダウトを宣言する（早い者勝ち） | **実装しない。** 手番順に1人ずつ聞き、最初にダウトした1人で確定 |
| 宣言ランクを自分で自由に選べる | **実装しない。** `A` から昇順に自動で循環する |
| 手番でパスして何も出さない | **実装しない。** 手番の人は必ず1〜4枚出す |
| 一度に5枚以上まとめて出す | **実装しない。** 1回に出せるのは1〜4枚 |
| ジョーカーをワイルドカードとして使う | **実装しない。** 52枚のみ（ジョーカーなし） |
| 場札を一部だけ引き取る | **実装しない。** 引き取りは常に全部 |
| 場札が一定枚数を超えたら自動で流す | **実装しない。** 場札はダウトの決着でしか動かない |
| ダウトが外れた人に追加ペナルティ（1回休みなど） | **実装しない。** 引き取りだけがペナルティ |
| 上がった人もゲームに残ってダウトだけ宣言できる | **実装しない。** 上がった人は完全に抜ける |
| 1人が上がった時点でゲーム終了 | **実装しない。** 残り1人になるまで続ける |

## 必須要件（Issue にそのまま載る）

- [ ] 52枚を4人（あなた + CPU3人）に13枚ずつ配り切り、あなたの手番から始まる
- [ ] 宣言ランクが `A` から昇順に自動で循環する（`K` の次は `A`）
- [ ] 手番のとき、手札から1〜4枚を選んで裏向きに出せる（宣言ランクと違うカードも出せる）
- [ ] 出した後、出した人の左隣から順に、他のプレイヤーが1人ずつダウトするかを決める（最初の1人で確定）
- [ ] ダウトが当たれば出した人が、外れればダウトした人が、場札を**全部**引き取る
- [ ] 誰もダウトしなければ場札はそのまま積まれ、宣言ランクが1つ進んで次の人の手番になる
- [ ] 引き取りが起きたら場札が0枚になり、宣言ランクが `A` に戻り、引き取った人の次の人から再開する
- [ ] 他プレイヤーの手札は枚数だけ表示される（`Hand variant="hidden"` を使い、中身を DOM に出さない）
- [ ] 手札0枚で上がり、上がった順に順位が出る（最後に残った1人が最下位）
- [ ] `npm run verify` が緑になり、下の「必須テスト」6件が通る

## 実装の進め方（Step1 / Step2 / Step3）

時刻は**研修開始からの経過分**です。実装は45〜95分、検証は95〜110分の枠を想定しています。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）｜ 65分までに終わっていれば順調

画面は一切さわりません。ここが終われば、あとは表示を貼るだけになります。

1. `Phase` / `DoubtState` / `DoubtAction` の型を決める（下の雛形をそのまま使ってかまいません）
2. `createInitialState(seed)` … 13枚ずつ配り、`you` を先手にし、`declaredRank` を `"A"` にする
3. `isBluff(cards, declaredRank)` … 1枚でもランクが違えば `true`
4. `nextDeclaredRank(rank)` … `cycleRank(rank, 1)` を包むだけ
5. `resolveDoubt(state, doubterId)` … 当たり/外れを判定し、場札の引き取り先を決める
6. 必須テスト6件のうち、`isBluff` と `resolveDoubt` に関わる5件を先に書く

### Step2 — 画面（`DoubtGame.tsx`）｜ 85分までに終わっていれば順調

1. `ComingSoonPanel` を消す
2. 自分の手札を `Hand`（複数選択）で出す。選んだIDを `useState<string[]>` に持ち、「出す」ボタンで `dispatch`
3. 他プレイヤーは `Hand variant="hidden" count={...}` で枚数だけ
4. 場札は `DeckPile`、`revealing` 中の公開カードは `Card`（または `Hand face="up"`）
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行だけ書く
6. `npm run dev` で最初から最後まで1回通してプレイする

### Step3 — 必須要件の残りと異常系テスト｜ 95分までに終わっていれば順調

1. `toPublicState` を書き、他人の手札が型として存在しないことをテストする
2. 上がりと順位（`finishPlayer` / `rankByFinishOrder` / `ResultModal`）
3. 異常系テスト（手番でない人の操作、判断中の二重クリック、上がった人への問い合わせ）
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` に変える
5. `README.md` を埋める
6. `npm run verify` が緑になったら `/pr`

## 状態の設計（雛形）

`logic.ts` に置く型とシグネチャです。**実装本体は自分で書いてください。**

```ts
import { createDeck, createRng, cycleRank, deal, shuffle } from "@core";
import type { PlayerId, PlayingCard, Rank, TurnState } from "@core";

/** 公開したカードを見せている時間。 */
export const REVEAL_DELAY_MS = 1200;
/** CPU が1回考える時間。 */
export const CPU_THINK_MS = 900;
/** 1回に出せる枚数の上限。 */
export const MAX_PLAY_CARDS = 4;

export type Phase = "playing" | "doubt-decision" | "revealing" | "finished";

/** 直前に出された組。裏向きのまま場札に積まれる。 */
export type Play = {
  readonly playerId: PlayerId;
  readonly declaredRank: Rank;
  readonly cards: readonly PlayingCard[];
};

export type DoubtState = {
  readonly turn: TurnState;
  /** プレイヤーIDごとの手札。ここは絶対にそのまま画面へ渡さない。 */
  readonly hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>;
  /** 場に積まれた裏向きのカード。 */
  readonly pile: readonly PlayingCard[];
  readonly declaredRank: Rank;
  readonly lastPlay: Play | null;
  /** 今ダウトするかを聞かれている人。playing 中は null。 */
  readonly deciderId: PlayerId | null;
  /** ダウトを宣言した人。revealing 中だけ入る。 */
  readonly doubterId: PlayerId | null;
  /** 場札を引き取った人。revealing 中だけ入る。 */
  readonly takerId: PlayerId | null;
  readonly phase: Phase;
  readonly log: readonly string[];
  readonly seed: number;
};

export type DoubtAction =
  | { readonly type: "play"; readonly cardIds: readonly string[] }
  | { readonly type: "doubt" }
  | { readonly type: "pass" }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/** 画面と CPU に渡してよい情報だけを持つ型。他人の手札のフィールドが存在しない。 */
export type PublicPlayer = {
  readonly id: PlayerId;
  readonly name: string;
  readonly cardCount: number;
  readonly isFinished: boolean;
};

export type PublicState = {
  readonly you: readonly PlayingCard[];
  readonly opponents: readonly PublicPlayer[];
  readonly pileCount: number;
  readonly declaredRank: Rank;
  readonly lastPlayCount: number;
  readonly phase: Phase;
  readonly currentId: PlayerId;
};

export function createInitialState(seed?: number): DoubtState;

/** 1枚でも宣言ランクと違えば true（＝うそ）。 */
export function isBluff(cards: readonly PlayingCard[], declaredRank: Rank): boolean;

/** 次の宣言ランク。K の次は A。 */
export function nextDeclaredRank(rank: Rank): Rank;

/** ダウトの決着をつけ、場札の引き取りまで済ませた状態を返す。 */
export function resolveDoubt(state: DoubtState, doubterId: PlayerId): DoubtState;

/** 画面と CPU に渡す情報。他人の手札は枚数だけになる。 */
export function toPublicState(state: DoubtState, viewerId: PlayerId): PublicState;

/**
 * 今、何ミリ秒後に自動で次へ進めるべきか。null は人間の入力待ち。
 *   finished           -> null
 *   revealing          -> REVEAL_DELAY_MS
 *   手番/判断が CPU     -> CPU_THINK_MS
 *   手番/判断が あなた   -> null
 */
export function pendingDelayMs(state: DoubtState): number | null;

export function reduce(state: DoubtState, action: DoubtAction): DoubtState;

export function isGameOver(state: DoubtState): boolean;
```

CPU の判断は `cpu.ts` に分けます（確率を返す純粋関数 + 乱数と比べる薄い層）。

```ts
import type { PlayingCard, Rank, Rng } from "@core";

/** 今ダウトすべき確率。手札にそのランクが何枚あるかと、場札の枚数だけで決める。 */
export function doubtProbability(
  hand: readonly PlayingCard[],
  declaredRank: Rank,
  playedCount: number,
  pileCount: number,
): number;

/** ダウトするかどうか。 */
export function shouldDoubt(
  hand: readonly PlayingCard[],
  declaredRank: Rank,
  playedCount: number,
  pileCount: number,
  rng: Rng,
): boolean;

/** 何を出すか。宣言ランクを持っていればそれを、無ければ弱いカードでうそをつく。 */
export function choosePlay(
  hand: readonly PlayingCard[],
  declaredRank: Rank,
  rng: Rng,
): PlayingCard[];
```

## 使う @core / @ui

### @core

| 名前 | 何のために使うか |
|---|---|
| `createDeck` | 52枚の山札を作る |
| `createRng` / `shuffle` | seed を固定できる乱数で山札を混ぜる |
| `deal` | 4人に13枚ずつ配る（`deal(deck, 4, 13)`） |
| `createSoloVsCpu` | あなた + CPU3人のプレイヤー一覧を作る |
| `createTurnState` | 手番の状態を作る（`you` を先手にする） |
| `nextTurn` | 次の人へ手番を移す（上がった人は自動で飛ばす） |
| `neighborId` | ダウトを聞く順番（左隣から）を求める |
| `finishPlayer` | 手札0枚になった人を上がりにする |
| `alivePlayers` / `isOver` | まだ上がっていない人の一覧と、終了判定 |
| `cycleRank` | 宣言ランクを1つ進める（`K` の次は `A`） |
| `groupByRank` | CPU が「宣言ランクを何枚持っているか」を数える |
| `sortCards` | 自分の手札を見やすい順に並べる |
| `cardLabel` | ログに「スペードの7」のように書く（画面側） |
| `rankByFinishOrder` | 上がった順から順位表を作る |
| `useCpuTurn` | 画面で待ち時間を扱う唯一の手段 |
| `card` / `hand` | テストでカードを作る（`hand("spades-A", "hearts-A")`） |
| `PlayingCard` / `Rank` / `PlayerId` / `TurnState` / `Rng` / `GameComponentProps` / `GameManifest` | 型注釈に使う |

### @ui

| 名前 | 何のために使うか |
|---|---|
| `GameShell` | 画面の外枠。必ずこれで包む |
| `Hand`（`variant="open"`） | 自分の手札。`selectedIds` で複数選択する |
| `Hand`（`variant="hidden"`） | 他プレイヤーの手札を枚数だけ表示する（情報漏れ防止の要） |
| `DeckPile` | 場札の山（裏向き・枚数表示） |
| `Card` | `revealing` 中に公開されたカードを見せる |
| `Button` | 「出す」「ダウト！」「見送る」 |
| `LogPanel` | 「CPU 2 がダウトを宣言しました」などの進行ログ |
| `ScoreBoard` | 各プレイヤーの残り枚数と、今が誰の番か |
| `ResultModal` | 終了時の順位表示（`ranking` に `rankByFinishOrder` の結果を渡す） |

## 必須テスト

`logic.test.ts` に、この `it` の文字列をそのまま書いてください
（雛形に最初から入っている3件はそのまま残します）。

| `it` の文字列 | 何を守っているか |
|---|---|
| `宣言と実体が一致していればダウトは外れ` | `isBluff` が本当のときに `false` を返す。ここが逆だと全部が逆転する |
| `宣言と違うカードが混ざっていればダウトは当たり` | 「1枚でも違えばうそ」という判定の境界 |
| `ダウトが当たると出した人が場札を全部引き取る` | 罰の向き。場札は必ず**全部**移る |
| `ダウトが外れるとダウトした人が場札を全部引き取る` | 罰の向きの反対側。両方書いて初めて意味がある |
| `解決後は宣言が A に戻る` | 引き取り後の再開条件。場札が0枚になることも同時に確認する |
| `toPublicState に他人の手札が含まれない` | 情報隠蔽。ここが壊れると心理戦が成立しない |

余力があれば、Step3 で次の異常系も足してください。

- `手番でない人が出そうとしても状態が変わらない`
- `ダウト判断中に出そうとしても状態が変わらない`
- `上がった人にはダウトを聞かない`
- `出した直後に手札が0でも、ダウトが当たって引き取れば上がらない`
- `1回に5枚以上は出せない`

テストが仕様を確認できているかは、**アサーションを1つわざと逆にして赤くなるのを見る**まで分かりません。1回やってください。

## 発展課題

必須要件が全部終わってから手を出してください。すべて `src/games/doubt/` の中だけで実装できます。

- CPU の `doubtProbability` を改良する（場札が多いほど慎重になる、直前に自分が出したランクを避ける など）
- 「うそを通した回数」「ダウトを当てた回数」を数え、`useHighScore` と `gameKey` で保存する
- `LogPanel` にダウトの結果（誰が何枚引き取ったか）を履歴として残す
- 宣言ランクと一致する手札を `highlightedIds` で光らせ、うそをつく判断を助ける
- 「宣言ランクを全部出す」ボタン（`groupByRank` で該当カードをまとめて選択状態にする）
- CPU ごとに性格（うそをつきやすい / ダウトしやすい）を持たせる

## 時間が足りないときに落とす順番

**上から順に落とします。** 下に行くほどルールに影響するので、4番以降は必ず講師に相談してください。

1. **`LogPanel` の進行ログ** … 表示だけ。ルールには一切影響しない
2. **`revealing` の演出時間** … `REVEAL_DELAY_MS` を待たずに即決着させる。`pendingDelayMs` は CPU の手番だけを扱えばよくなる
3. **CPU の乱数判断** … `shouldDoubt` を「場札が3枚以下、かつ宣言ランクを2枚以上持っていればダウト」のような固定ルールにする。`Rng` 引数が不要になり、`cpu.ts` のテストも減る
4. **出せる枚数を1枚固定にする** … `Hand` の複数選択と「出す」ボタンが不要になり、画面が大幅に軽くなる。ルールの記述は1行変わる
5. **ダウトできるのを「あなた」だけにする** … CPU はダウトしない。心理戦が半分になるので**最終手段**

`index.ts` の `id` / `name` / `team` / `difficulty` / `minPlayers` / `maxPlayers` は、
どれだけ時間が無くても変更しないでください（契約テストと CI が落ちます）。

## レビュアー向けミッション（このゲームの壊れやすい所）

Team F の人が `feature/doubt` を `npm run dev` で動かし、次の3つを実際に操作してください。
仕様を知らなくても、書いてあるとおりに押せば判定できます。

### ミッション1 — うそが暴かれたときの罰の向き

1. 自分の手番で、**画面に出ている宣言ランクとは違うカード**をわざと2枚選んで出す
2. CPU の誰かがダウトしたら、公開されたカードが**自分が選んだ2枚と同じ**であることを確認する
3. **自分の手札が増える**こと（場札を全部引き取る）を確認する。ダウトした CPU の枚数は変わらないはず
4. 4人の手札枚数と場札の枚数を足して、**52枚**になっているか数える

→ 罰が逆向き（ダウトした人が引き取る）になっていたら不具合です。枚数の合計が52枚から動いたら、カードの複製か消失です。

### ミッション2 — 誰もダウトしないときの宣言の進み方とリセット

1. 宣言ランクどおりのカードを持っているときだけ出し、誰もダウトしない状態で数周まわす
2. 宣言が `A` → `2` → `3` … と1つずつ進み、**`K` の次が `A` に戻る**ことを確認する
3. その間、場札の枚数が**減らずに積み上がり続ける**ことを確認する
4. どこかで1回ダウトを起こし、**場札が0枚に戻り、宣言が `A` に戻り、引き取った人の次の人から手番が始まる**ことを確認する

→ 宣言がリセットされない、場札が中途半端に残る、手番が引き取った人自身から始まる、はいずれも不具合です。

### ミッション3 — 情報が漏れていないか / 上がりの確定タイミング

1. ブラウザの開発者ツール（F12）で Elements を開き、CPU の手札の表示部分を調べる
2. カードのランクやスート（`spades`、`A` など）が**どこにも出ていない**ことを確認する。出ているのは枚数だけのはず
3. 場札の山（`DeckPile`）も同様に、裏向きのカードの実体が DOM に出ていないことを確認する
4. 自分の手札が残り2枚のときにうそで2枚出し、**ダウトが当たって引き取った場合に「上がり」になっていない**ことを確認する

→ DOM にランクが出ていたら、CPU の手札を `Hand variant="hidden"` ではなく `face="down"` で描いている可能性が高いです。
