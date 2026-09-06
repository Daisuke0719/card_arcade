# 大富豪（daifugo）

> 担当2 / 難易度: 上級 / ブランチ: `feature/daifugo` / フォルダ: `src/games/daifugo/`
>
> 実装するルールは以下のとおりです。Issueとこのファイルに記載のないローカルルールは追加しません。

## ゲームの概要

手札を早く出し切った人が勝ちのゲームです。場に出ているカードより強い組を、同じ枚数だけ重ねて出していき、出し切った順に 大富豪 / 富豪 / 貧民 / 大貧民 の称号が付きます。

## プレイ構成

- **人数**: あなた1人 + CPU3人の合計4人（`createSoloVsCpu(3)`）
- **使うカード**: ジョーカー抜きの52枚（`createDeck()`）
- **配り方**: 4人に13枚ずつ配り切り。山札は残りません（`deal(deck, 4, 13)`）
- **先手**: ダイヤの3（`diamonds-3`）を持っている人
- **他プレイヤーの手札**: 枚数だけを表示します（`Hand variant="hidden"`）

## 採用するルール

必須で実装するのは **基本ルール + 8切り + 革命** の3つだけです。

### カードの強さ

- 弱いほうから `3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2` の順です。**3 が最弱、2 が最強**です。
- この順序は `createRankStrength()` にゲーム側で並びを渡して作ります。`@core` の既定の強さ（A が最弱）ではありません。
- スート（マーク）による強弱はありません。**ランクだけで比べます。**

### 場に出す

- 場が空のとき（ゲーム開始直後、場が流れた直後）は、**同じランクで揃った1〜4枚**を好きに出せます。
- 場にカードがあるときは、**場と同じ枚数**で、**場より強いランク**の組だけ出せます。
- 同じランクは出せません（強さが同じなので「より強い」を満たしません）。
- 枚数が違う組は出せません。2枚出しの場に1枚は出せませんし、3枚も出せません。
- 1つの組に違うランクを混ぜることはできません（階段は不採用です）。

### パスと場流れ

- 出せるカードがあってもパスできます。
- パスした人は、場が流れるまでその回に出せません。
- **場に出した人以外の全員がパスしたら場が流れます。** 場札は捨てられ、最後に出した人から再開します。
- 場が流れた時点でパスの記録はリセットされます。
- 最後に出した人がすでに上がっていた場合は、その次の生存者から再開します。

### 8切り

- **8 を1枚でも含む組を出したら、その瞬間に場が流れます。**
- 場が流れた後、**同じ人がもう一度出します**（手番は移りません）。
- 8切りで上がった場合は、次の生存者から再開します。
- 8切りに枚数の条件はありません。8の1枚出しでも、8を含む2枚出し（8のペア）でも流れます。

### 革命

- **同じランクを4枚同時に出すと革命が起きます。**
- 革命中は強さがすべて反転します。`2 < A < K < ... < 4 < 3` となり、**3 が最強、2 が最弱**になります。
- 革命中にもう一度4枚出すと革命が終わり、強さは元に戻ります（革命返し）。
- 革命は**次の革命が起きるまで続きます**。場が流れても終わりません。
- 4枚出しは 8 を含むこともあります。その場合は**革命が起きたうえで場も流れます**（8切りが同時に発動します）。

### 上がりと順位

- 手札が0枚になったらその人は上がりです。以降の手番からは外れます。
- 上がった順に 1位=大富豪 / 2位=富豪 / 3位=貧民 / 4位=大貧民 の称号が付きます。
- 最後の1人が残った時点でゲーム終了です（最後の1人は自動的に大貧民）。
- 結果は `ResultModal` に順位表として出します。

## 今回は実装しないルール

大富豪にはさまざまなローカルルールがありますが、次の表にあるルールは実装しません。

| ローカルルール | 今回の扱い |
|---|---|
| 階段（同じスートの連番3枚以上） | 実装しない。組は必ず同一ランク |
| しばり（同じスートが続くと縛られる） | 実装しない |
| 5飛ばし / 6跳ね | 実装しない |
| 7渡し（7を出したら手札を渡す） | 実装しない |
| 10捨て（10を出したら手札を捨てる） | 実装しない |
| 9リバース（順番が逆回りになる） | 実装しない |
| Jバック（イレブンバック） | 実装しない |
| スペードの3返し | 実装しない。ジョーカーが無いので出番もない |
| ジョーカー / ジョーカー単騎 | 実装しない。52枚のみ（`createDeck()`） |
| 都落ち | 実装しない |
| 複数回戦とカード交換（大富豪と大貧民の手札交換） | 実装しない。1回戦で終了 |
| 反則上がり（2や8で上がると最下位） | 実装しない。何で上がってもよい |
| スートによる強弱 | 実装しない。ランクだけで比べる |
| 革命中は8切り無効 | 実装しない。革命中でも8切りは発動する |
| 数字を伏せて出す（ダウト的な要素） | 実装しない。出した組は常に表向き |

## 必須要件（Issue にそのまま載る）

- [ ] 52枚を4人（あなた + CPU3人）に13枚ずつ配り切り、**ダイヤの3**を持っている人が先手になる
- [ ] カードの強さが `3 < 4 < ... < K < A < 2` になっている（`createRankStrength` で作る）
- [ ] 場が空のときは、同じランクで揃った1〜4枚を出せる
- [ ] 場にカードがあるときは、**同じ枚数**かつ**より強いランク**の組だけ出せる（`isLegalPlay`）
- [ ] パスができ、**出した人以外の全員がパスしたら場が流れて**最後に出した人から再開する
- [ ] **8切り**: 8 を含む組を出すと即座に場が流れ、同じ人がもう一度出す
- [ ] **革命**: 同じランク4枚を出すと強さが反転し、次の4枚出しで元に戻る
- [ ] CPU3人が自動で手を選ぶ（`getLegalPlays` から選ぶ単純なルール。`.tsx` に `setTimeout` を書かない）
- [ ] 手札を出し切った順に 大富豪 / 富豪 / 貧民 / 大貧民 の称号が付き、`ResultModal` に出る
- [ ] `logic.test.ts` に下の**必須テスト7件**があり、`npm run verify` が成功する

## 実装の進め方（まず遊べるところまで → 仕上げ）

最初から作り込まず、**最後まで遊べる状態**を先に作ります。
遊べるようになってから、ブラウザで操作しながら足りないところを足していきます。
進み具合は Issue のチェックリストで確認してください。
進め方が分からない場合は、講師に相談してください。

### 第1段階 — 最後まで遊べるところまで

大富豪は実装項目が多いため、ルールを3つに分け、各項目のテストが成功してから次へ進みます。
ルールは `logic.ts` に純粋関数として書き、画面は `DaifugoGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

**(1) 出せる判定**

- 強さ表を作る … `createRankStrength(["3","4", ... ,"A","2"])`
- 型を決める … `Phase` / `Field` / `DaifugoState` / `DaifugoAction`
- `createInitialState(seed)` … 13枚ずつ配り、ダイヤの3を持つ人を先手にする
- `isLegalPlay(play, field, isRevolution)` … 枚数一致・同一ランク・強さの3条件
- `getLegalPlays(hand, field, isRevolution)` … 出せる組の一覧
- `applyPlay` / `passTurn` の骨格（8切りと革命はまだ入れない）
- テスト4件 … 枚数が違うと出せない / 場より弱いランクは出せない / 同じ枚数で強ければ出せる / 全員がパスすると場が流れる

**(2) 8切り**

- `applyPlay` に「出した組に 8 が含まれていたら場を流し、手番を移さない」を足す
- テスト1件 … 8を含む組を出すと場が流れる

**(3) 革命**

- `applyPlay` に「4枚出しなら `isRevolution` を反転する」を足す
- `isLegalPlay` が `isRevolution` を見て強さの比較を逆にする
- テスト1件 … 革命中は強弱が反転する

ここで時間が足りない場合は、**革命を省略して**画面の実装へ進みます
（「時間が足りないときの省略順」の2番）。

**(4) 画面**

- `DaifugoGame.tsx` を `GameShell` で包む
- 自分の手札は `Hand`（`selectedIds` で複数選択）、CPU3人は `Hand variant="hidden"` で枚数だけ
- 場札は `DeckPile`（`top` に組の先頭のカードを渡す）
- 「出す」「パス」は `Button`。出せない選択のときは `disabled`
- 時間の扱いは**この1行だけ** … `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))`
- `cpu.ts` に `chooseMove(state, rng)` を書く。`getLegalPlays` から最も弱い組を選ぶ単純な実装でよい

ブラウザを再読み込みして、**最初から最後まで1回遊べること**を確認したら第1段階は完了です。
`logic.ts` に関数を足したら `logic.test.ts` にもテストを足し、`it(` が3件以上ある状態にしてください。

### 第2段階 — 遊びながら仕上げる

- 称号（大富豪 / 富豪 / 貧民 / 大貧民）を `ResultModal` に出す
- `LogPanel` に「CPU1 が 8 を出しました（場が流れます）」のような進行ログを出す
- 異常系のテストを足す（後述の「余裕があれば足すテスト」）
- `index.ts` の `status` を `"ready"` に変える
- `npm run verify` を実行して成功させる

## 状態の設計（雛形）

`logic.ts` に置く型のかたちです。**中身は自分で書いてください。** ここにあるのは型とシグネチャだけです。

```ts
import type { PlayerId, PlayingCard, TurnState } from "@core";

/** 大富豪の強さの並び。3 が最弱・2 が最強。createRankStrength に渡す。 */
export const DAIFUGO_RANK_ORDER = [
  "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2",
] as const;

/** CPU が1手を出すまでの待ち時間。UI はこの値を参照するだけ。 */
export const CPU_INTERVAL_MS = 900;

export type Phase = "playing" | "finished";

/** 場に出ている組。null なら場は空（同ランクで揃っていれば何でも出せる）。 */
export type Field = {
  readonly cards: readonly PlayingCard[];
  /** cards.length と同じ。枚数の比較を読みやすくするために持つ。 */
  readonly count: number;
  /** この組を出した人。全員パスのときはここから再開する。 */
  readonly ownerId: PlayerId;
} | null;

export type DaifugoState = {
  /** プレイヤーIDごとの手札。 */
  readonly hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>;
  readonly field: Field;
  /** 手番・向き・上がった順は @core の TurnState に任せる。 */
  readonly turn: TurnState;
  /** true なら強さが反転している。 */
  readonly isRevolution: boolean;
  /** 今の場でパス済みの人。場が流れたら空にする。 */
  readonly passedIds: readonly PlayerId[];
  readonly phase: Phase;
  /** 新しいものが先頭。LogPanel にそのまま渡す。 */
  readonly log: readonly string[];
  readonly seed: number;
};

export type DaifugoAction =
  /** 人間が選んだカードを出す。cardIds は Hand の selectedIds をそのまま渡す。 */
  | { readonly type: "play"; readonly cardIds: readonly string[] }
  | { readonly type: "pass" }
  /** CPU の手番を1つ進める。useCpuTurn から呼ばれる。 */
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/** 配って、ダイヤの3を持っている人を先手にする。seed を固定すると毎回同じ配りになる。 */
export function createInitialState(seed?: number): DaifugoState;

/** その組を場に出せるか。枚数一致・同一ランク・強さの3条件を見る。 */
export function isLegalPlay(
  play: readonly PlayingCard[],
  field: Field,
  isRevolution: boolean,
): boolean;

/**
 * 手札から出せる組を列挙する。
 * groupByRank で同ランクにまとめ、各グループから必要枚数を1通りだけ取る。
 * 13枚の手札でも候補はせいぜい13通りなので、組み合わせ爆発はしない。
 * すべての組み合わせを作ろうとしないこと。
 */
export function getLegalPlays(
  hand: readonly PlayingCard[],
  field: Field,
  isRevolution: boolean,
): PlayingCard[][];

/** 組を出した後の状態。8切り・革命・上がりの判定もここで行う。 */
export function applyPlay(state: DaifugoState, play: readonly PlayingCard[]): DaifugoState;

/** パスする。出した人以外の全員がパスしていたら場を流す。 */
export function passTurn(state: DaifugoState): DaifugoState;

/**
 * 「今、何ミリ秒後に自動で次へ進めるべきか」を返す。null は人間の入力待ち。
 *   finished なら null / 手番が CPU なら CPU_INTERVAL_MS / 人間の手番なら null
 */
export function pendingDelayMs(state: DaifugoState): number | null;

/** 状態 + 行動 -> 新しい状態。ルールはここから呼ばれる純粋関数に書く。 */
export function reduce(state: DaifugoState, action: DaifugoAction): DaifugoState;

export function isGameOver(state: DaifugoState): boolean;
```

場が流れたことは `log` の文言で伝えます。**演出用のフェーズ（`"flowing"` など）は作らないでください。** 実装が増えるだけで、必須要件は1つも増えません。

## 使う @core / @ui

`@core` からは次のものだけを使います。**ここに無い関数は `@core` にありません。**

| 名前 | 何のために使うか |
|---|---|
| `createDeck` | ジョーカー抜きの52枚を作る |
| `shuffle` / `createRng` | seed を固定できる形で山札を混ぜる |
| `deal` | 4人に13枚ずつ配る（`deal(deck, 4, 13)`） |
| `createRankStrength` | `3 < ... < A < 2` の強さ表を作る。革命中は比較を逆に読む |
| `groupByRank` | 手札を同ランクにまとめて `getLegalPlays` の候補を作る |
| `sameRank` | 出した組が同一ランクで揃っているか調べる |
| `sortCards` | 手札の表示順を安定させる |
| `createSoloVsCpu` | あなた + CPU3人の `Player[]` を作る |
| `createTurnState` | ダイヤの3を持つ人を `startId` にして手番を作る |
| `nextTurn` | 手番を次の生存者へ移す（上がった人は自動で飛ばされる） |
| `finishPlayer` | 手札0枚の人を上がりにする。上がった順が `finishedIds` に残る |
| `alivePlayers` | まだ上がっていない人を数える |
| `isOver` | 残り1人以下になったらゲーム終了 |
| `isCurrent` / `isFinished` | 画面で「今この人の番」「もう上がった」を出す |
| `rankByFinishOrder` | 上がった順から `Ranking` を作る（称号の文字はゲーム側で足す） |
| `formatRank` | 称号を省略したときに「1位」「2位」を出す |
| `useCpuTurn` | 待ち時間を設けてCPUの処理を実行するためのフック |
| `card` / `hand` | テストでカードを作る（`hand("spades-3","hearts-3")`） |

`@ui` からは次のものを使います。

| 名前 | 何のために使うか |
|---|---|
| `GameShell` | 画面の外枠。必ずこれで包む |
| `Hand` | 自分の手札（`selectedIds` で複数選択）と、CPU の手札（`variant="hidden"` で枚数だけ） |
| `DeckPile` | 場札。`top` に組の先頭のカードを渡す |
| `Button` | 「出す」「パス」。出せない選択のときは `disabled` |
| `LogPanel` | 「CPU2 がパスしました」「革命！」などの進行ログ |
| `ScoreBoard` | 各プレイヤーの残り枚数と、今だれの番かの表示 |
| `ResultModal` | 大富豪 / 富豪 / 貧民 / 大貧民 の結果 |
| `GameInstructions` | `manifest.howToPlay` をそのまま渡す |

## 必須テスト

`logic.test.ts` に次の7件を書きます。`it` の文字列はそのまま使ってかまいません。

| `it` の文字列 | 何を守っているか |
|---|---|
| `"枚数が違うと出せない"` | 2枚出しの場に1枚や3枚を出せないこと。特に不具合が起きやすい境界 |
| `"場より弱いランクは出せない"` | 強さの比較の向きが逆になっていないこと |
| `"同じ枚数で強ければ出せる"` | 正常系。上の2件と合わせて `isLegalPlay` の3条件が揃う |
| `"革命中は強弱が反転する"` | `isRevolution` が `isLegalPlay` に効いていること |
| `"8を含む組を出すと場が流れる"` | 8切りが発動し、`field` が `null` に戻ること |
| `"全員がパスすると場が流れる"` | パスの数え方と、最後に出した人から再開すること |
| `"出し切った順に称号が付く"` | 上がり順が `finishedIds` に正しく積まれ、称号に変換できること |

### 余裕があれば足すテスト（任意）

第2段階で時間が余ったら足してください。必須ではありません。

- `"同じランクは出せない"` … 強さが等しい組を弾く（`>` と `>=` の取り違え）
- `"違うランクを混ぜた組は出せない"` … 階段や適当な組み合わせを弾く
- `"革命が2回起きると強さが元に戻る"` … 革命返し
- `"上がった人は手番に入らない"` … `nextTurn` が上がった人を飛ばすこと
- `"同じ seed なら同じ配りになる"` … テストが不安定にならないこと

## 発展課題

発展課題は、必須要件を満たして `npm run verify` が成功したあとに着手します。
**共通基盤（`src/core/` と `src/components/`）を変更せずに作れるものだけ**を挙げています。

- **9リバース** … 9 を出したら順番が逆回りになる。`reverseDirection` で `TurnState` の向きを変えるだけで作れます
- **しばり** … 同じスートが2回続いたらそのスートに縛られる。`sameSuit` が使えます
- **階段** … 同じスートの連番3枚以上。`rankToNumber` で連番を判定します。`isLegalPlay` の枚数条件を触るので影響範囲は大きめです
- **ジョーカー** … `createDeckWithJokers(1)` で53枚にし、`isJoker` / `partitionJokers` でワイルドカード扱いにする
- **複数回戦とカード交換** … 前回の大貧民が大富豪に強いカードを2枚渡す。`reduce` に `"next-round"` アクションを足します
- **CPU を強くする** … 「場が空なら弱い組から出す」「1人になったら強い組を温存する」など。`cpu.ts` は「確率や評価値を返す純粋関数」と「`Rng` と比べる薄い層」に分けたままにすること
- **最高順位の保存** … `useHighScore` と `gameKey` で「これまでの最高順位」を残す（`localStorage` を直接触らないこと）

## 時間が足りないときの省略順

省略の優先度が高い順に並べています。講師の指示に従って実装対象から外してください。

1. **発展課題を省略する。** 必須要件が終わるまでは、発展課題に着手しません。
2. **革命を省略する。** `isRevolution` は `false` で固定し、4枚出しは通常の4枚出しとして扱います。テスト「革命中は強弱が反転する」も外します。第1段階の (3) は不要になります。
3. **CPU を「1枚出しのみ」に切り替える。** CPU は手札から出せる1枚を探すだけになり、`getLegalPlays` が実質不要になります。人間は今までどおり複数枚出せます。
4. **8切りを省略する。** この段階では、基本ルール（同じ枚数で強い組を出す / 全員パスで場が流れる / 出し切った順に順位）のみを実装します。この状態でもゲームは成立します。
5. **称号を省略して順位だけにする。** 大富豪 / 富豪 / 貧民 / 大貧民 の代わりに `formatRank` の「1位」「2位」を出します。
6. **`index.ts` の `status` を `"coming-soon"` のままPull Requestを作成する。** この判断は講師が行います。

省略したルールは `README.md` の「実装しなかったこと」に記載してください。記載があれば、意図した変更であることが分かります。
