# ゲームの作り方

担当ゲームを実装している間、いちばん開くファイルです。
**上から順にやれば、`npm run verify` が緑になるところまで一本道**で進みます。

先に読んでおくもの（このファイルはその続きです）。

- `CLAUDE.md` … 絶対に守る5条とコマンド
- `src/games/CLAUDE.md` … ファイルの役割と `@core` / `@ui` の早見表
- `docs/games/<ゲームID>.md` … あなたのゲームのルールの正典
- **`src/games/example-game/`** … お手本。このページのコードはすべてそこの実物です

ルールで迷ったら `docs/games/<ゲームID>.md`、**作り方で迷ったらこのページ**です。

## 全体像

```text
   git switch -c feature/<ゲームID>
            |
   npm run scaffold -- --game <ゲームID>
            |   5ファイルの雛形ができる（この時点で npm test は通る）
            v
 (1) logic.ts        State と Action を決めて reduce を書く   <- いちばん大事
            |        待ち時間は pendingDelayMs(state) で表す
            v
 (2) logic.test.ts   reduce を順番に呼ぶだけでテストが書ける
            |        正常系 / 境界値 / 異常系
            |
            +---> ルールを直したら (1) に戻る。ここを何周かする
            v
 (3) <Xxx>Game.tsx   GameShell で包み、@ui の部品を並べる
            |        時間の扱いは useCpuTurn の1行だけ
            v
 (4) index.ts        howToPlay を書く / 最後に status を "ready" に
            |
            v
 (5) npm run dev で最後まで1回遊ぶ  ->  npm run verify が緑
```

大事なのは **(1) と (2) を先にやり切ってから (3) に進む**ことです。
画面から作り始めると、勝敗の判定が `.tsx` に混ざってテストが書けなくなります。

## 1. 雛形を作る

### ブランチを先に作る

`main` のまま実装を始めてはいけません。

```powershell
git switch -c feature/babanuki
```

`feature/<ゲームID>` の形にします。範囲チェックはこのブランチ名を見て、
「あなたが触ってよいフォルダ」を判断します。

### 雛形を生成する

```powershell
npm run scaffold -- --game babanuki
```

`--` を忘れないでください（`npm` に引数を渡すための区切りです）。
何が作られるか先に見たいときは `--dry-run` を足します。

```powershell
npm run scaffold -- --game babanuki --dry-run
```

ゲームIDを忘れたら、引数なしで実行すると一覧が出ます。

```powershell
npm run scaffold
```

### 生成される5ファイル

`src/games/<ゲームID>/` に次の5つができます。役割は混ぜません。

| ファイル | 何を書くか | 書いてはいけないもの |
|---|---|---|
| `logic.ts` | ルール・状態遷移（純粋関数） | react / 乱数 / 時間 / DOM |
| `logic.test.ts` | ロジックのテスト。**ここが評価対象** | — |
| `<Xxx>Game.tsx` | 画面と時間（`useCpuTurn`） | 勝敗の判定 |
| `index.ts` | `export const game: GameManifest` だけ | 関数・JSX |
| `README.md` | 遊び方 / 採用したルール / 実装メモ | — |

必要なら `cpu.ts`（CPU の判断）、`types.ts`、`<Xxx>Game.module.css` を足してかまいません。
**この5つは消さないでください。**契約テストが存在を確認しています。

各ファイルの先頭には `@scaffold:untouched` という印が入っています。
実装を始めたらこの行は消してかまいません（消したファイルは `--force` でも上書きされません）。

### 生成直後にテストが通ることを確認する

```powershell
npm test
```

雛形の `logic.test.ts` には最初から3件のテストが入っていて、**この時点で緑になります**。

```ts
it("最初は52枚の山札から始まる", () => {
  const state = createInitialState(1);
  expect(state.deck).toHaveLength(52);
  expect(isGameOver(state)).toBe(false);
});
```

ここが赤いなら、環境の問題です。先に `npm run doctor` を実行してください。
緑を確認できたら、**この3件を書き換えながら**自分のゲームのテストにしていきます。

## 2. logic.ts を書く（いちばん大事）

### 純粋関数だけを書く理由

`logic.ts` には **react も時間も乱数も入れません**。理由は3つです。

1. **テストが `reduce` を順番に呼ぶだけで書ける。** `setTimeout` をテストする必要がありません。
2. **同じ入力なら必ず同じ出力になる。** テストが「たまに落ちる」状態になりません。
3. **画面を作り直してもルールが壊れない。** 見た目の調整でテストが赤くなりません。

これは ESLint が実際に止めます。うっかり書いても CI の前に気づけます。

```text
logic.ts と cpu.ts は「純粋なルール」だけを書く場所です。画面のことは <Xxx>Game.tsx に書いてください。
Math.random() は使えません。乱数は引数で Rng を受け取り、テストでは createRng(seed) で固定します。
Date.now() は使えません。時間の扱いは画面側（useCpuTurn）に任せ、ロジックは時間を持たない形にします。
```

### State を決める

**状態は1つのオブジェクトにまとめます。**`useState` を何個も並べません。
お手本の `ExampleState`（`src/games/example-game/logic.ts`）です。

```ts
export type Phase = "guessing" | "revealing" | "finished";

export type ExampleState = {
  readonly deck: readonly PlayingCard[];
  readonly current: PlayingCard;
  /** めくったカード。revealing の間だけ入る。 */
  readonly next: PlayingCard | null;
  readonly phase: Phase;
  readonly round: number;
  readonly humanGuess: Guess | null;
  readonly cpuGuess: Guess | null;
  readonly humanScore: number;
  readonly cpuScore: number;
  readonly lastOutcome: RoundOutcome | null;
  readonly seed: number;
};
```

設計のコツは3つです。

- **`phase` を必ず持つ。** 「今は人間の入力待ち」「今は演出中」「もう終わった」を
  文字列1つで表します。画面はこれを見て表示を変えるだけになります。
- **すべて `readonly`。** 状態を書き換えるのではなく、毎回新しいオブジェクトを返します。
- **`seed` を状態に持つ。** ゲーム中に追加の乱数が要るとき、決定的に作り直せます（後述）。

### Action を決める

Action は「起きうる出来事」の一覧です。**3種類に分けて考えます。**

```ts
export type ExampleAction =
  | { readonly type: "guess"; readonly guess: Guess }   // 人間の操作
  | { readonly type: "tick" }                            // 時間が来た（自動）
  | { readonly type: "reset"; readonly seed?: number };  // やり直し
```

- **人間の操作**（クリック1種類につき1つ）… `guess` / `play` / `flip` / `draw` など
- **`tick`**（必ず1つ）… CPU の手番や演出の待ち時間が明けたときに飛んできます
- **`reset`**（必ず1つ）… `GameShell` の「もう一度」ボタンが使います

### reduce の書き方

```ts
/**
 * 状態 + 行動 -> 新しい状態。
 * ここが純粋関数なので、テストは reduce を順番に呼ぶだけで書ける。
 */
export function reduce(state: ExampleState, action: ExampleAction): ExampleState {
  switch (action.type) {
    case "guess":
      return applyGuess(state, action.guess);
    case "tick":
      return applyTick(state);
    case "reset":
      return createInitialState(action.seed ?? state.seed + 1);
    default:
      return state;
  }
}
```

`reduce` 本体は**振り分けだけ**にして、実際の処理は小さな関数に切り出します。
そうすると1つ1つが短くなり、テストで壊れた場所がすぐ分かります。

各関数の先頭では、**受け付けられない操作を弾きます。**

```ts
/** 予想を受け付けて、次のカードをめくる。 */
function applyGuess(state: ExampleState, guess: Guess): ExampleState {
  // 判定中や終了後のクリックは無視する（連打で先へ進めない）
  if (state.phase !== "guessing") return state;
  ...
}
```

ここで **`state` をそのまま返す**（新しいオブジェクトを作らない）のが大事です。
テストで `expect(after).toBe(before)` と書けて、「本当に何も起きていない」ことを確認できます。

### pendingDelayMs の意味と書き方

**ここがこの教材の山場です。**「時間」をどう扱うかが全ゲーム共通で決まっています。

`pendingDelayMs(state)` は、**今の状態を見て、次の1つだけを答える関数**です。

- `null` … 人間の入力待ち。**タイマーは動かない**
- 数値 … その ミリ秒 後に `dispatch({ type: "tick" })` が**1回だけ**飛んでくる

お手本はこれだけです。

```ts
/** めくったカードを見せている時間。UI はこの値を参照するだけ。 */
export const REVEAL_DELAY_MS = 900;

/**
 * 「今、何ミリ秒後に自動で次へ進めるべきか」を返す。
 * null は「人間の入力待ち」。
 */
export function pendingDelayMs(state: ExampleState): number | null {
  return state.phase === "revealing" ? REVEAL_DELAY_MS : null;
}
```

画面側はこの1行だけです。

```tsx
useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
```

#### なぜこの形なのか

`useCpuTurn`（`@core`）が、アプリの中で**唯一タイマーを持っている場所**です。

```text
state が変わる
   -> pendingDelayMs(state) を計算し直す
   -> null なら何もしない / 数値ならその ms でタイマーを1本張る
   -> 発火したら dispatch({ type: "tick" })
   -> reduce が新しい state を返す
   -> 最初に戻る
```

CPU が3人続けて打つゲームでも、この輪が3周するだけです。
**`.tsx` の中で `setTimeout` を書く必要はまったくありません。**
そしてテストは `reduce(state, { type: "tick" })` を呼ぶだけなので、時間を待たずに済みます。

#### CPU が複数いるゲームの書き方

ババ抜き・七並べ・ダウト・大富豪は、「演出の待ち」と「CPU の思考時間」の2種類があります。
`pendingDelayMs` の中で**上から順に**判定します。

```ts
export const REVEAL_MS = 900;
export const CPU_THINK_MS = 700;

export function pendingDelayMs(state: BabanukiState): number | null {
  if (state.phase === "finished") return null;             // 終わったら必ず止める
  if (state.phase === "revealing") return REVEAL_MS;       // 演出中
  if (state.turn.currentId !== "you") return CPU_THINK_MS; // CPU の手番
  return null;                                             // あなたの入力待ち
}
```

`tick` 側は「**今の手番の人の処理を1回だけ**進める」形にします。

```ts
function applyTick(state: BabanukiState): BabanukiState {
  if (state.phase === "revealing") return finishReveal(state);
  if (state.turn.currentId === "you") return state;  // 人間の手番では何もしない
  return playCpuTurn(state);                         // CPU が1回だけ引く
}
```

プレイヤーの id は `createSoloVsCpu(3)` が `"you"` / `"cpu-1"` / `"cpu-2"` / `"cpu-3"` を作ります。

#### 画面を作る前に必ず確認する3つ

この3つを外すと、画面が固まるか、勝手に暴走します。**テストで先に確認できます。**

| 守ること | 外すとどうなるか |
|---|---|
| 終了状態（`finished`）で必ず `null` を返す | `tick` が永久に飛び続ける |
| 人間の入力待ちで `null` を返す | 操作しないのに勝手に進む |
| `tick` を1回処理したら必ず `state` が変わる | 同じ待ち時間で無限ループする |

```ts
it("終了したらタイマーが止まる", () => {
  const state = { ...createInitialState(1), phase: "finished" as const };
  expect(pendingDelayMs(state)).toBeNull();
});
```

### 乱数は引数で受け取る

最初の配りは `createRng(seed)` を作って `shuffle` に渡します。

```ts
export function createInitialState(seed: number = 1): ExampleState {
  const deck = shuffle(createDeck(), createRng(seed));
  const { cards, rest } = drawMany(deck, 1);
  const current = cards[0];
  ...
}
```

ゲームの途中で乱数が必要になったら、**`state` に持っている `seed` から作り直します。**
お手本の CPU はこうしています。

```ts
cpuGuess: chooseGuess(state.current, createRng(state.seed + state.round)),
```

こうすると「同じ状態からは必ず同じ CPU の手が出る」ので、テストが安定します。
ババ抜きなら `createRng(state.seed + state.turnCount)` のように、
**毎回変わるが状態から決まる値**を足してください。

## 3. テストを書く

`logic.test.ts` が評価対象です。**ルールを1つ決めたら、テストを1つ書く**のが最短です。

### カードは @core のファクトリで作る

テストの中でカードのオブジェクトリテラルを手書きしないでください。

```ts
import { card, hand, joker } from "@core";

card("spades", "A")                      // 1枚。id は "spades-A"
hand("spades-A", "hearts-A", "clubs-5")  // まとめて3枚
joker()                                  // 赤いジョーカー。joker("black") で黒
```

スートは `"spades" | "hearts" | "diamonds" | "clubs"`、
ランクは `"A"` `"2"` … `"10"` `"J"` `"Q"` `"K"` です。

### テスト用の状態を作るヘルパーを1つ置く

「この状況から始めたい」を毎回書くと長くなるので、先頭に小さな関数を置きます。

```ts
/** テスト用に「次に必ずこのカードが出る」状態を作る。 */
function stateWith(current: ReturnType<typeof card>, deck: ReturnType<typeof card>[]): ExampleState {
  return { ...createInitialState(1), current, deck };
}
```

これがあると、1つ1つのテストが3行で書けます。

### 正常系・境界値・異常系の3種類を書く

| 種類 | 何を見るか | お手本の例 |
|---|---|---|
| 正常系 | 想定どおりの操作で、想定どおりに状態が変わる | 「当たると自分の得点が増える」 |
| 境界値 | 同じ数字、最後の1枚、0枚、一番強い/弱いカード | 「同じランクは引き分け」「A は最小として扱う」 |
| 異常系 | **やってはいけない操作が弾かれる** | 「判定中にもう一度予想しても状態が変わらない」 |

**正常系**は `reduce` を続けて呼ぶだけです。

```ts
it("当たると自分の得点が増える", () => {
  let state = stateWith(card("spades", "5"), [card("hearts", "9"), card("clubs", "3")]);
  state = reduce(state, { type: "guess", guess: "high" });
  state = reduce(state, { type: "tick" });
  expect(state.humanScore).toBe(1);
});
```

**境界値**は「同じ」「最後」「0」を狙います。

```ts
it("同じランクは引き分け", () => {
  expect(judge(card("spades", "7"), card("hearts", "7"))).toBe("draw");
});

it("山札が空なら予想した時点で終了する", () => {
  const next = reduce(stateWith(card("spades", "5"), []), { type: "guess", guess: "high" });
  expect(next.phase).toBe("finished");
  expect(isGameOver(next)).toBe(true);
});
```

**異常系**がいちばん忘れられます。連打・順番違い・出せないカードを必ず1件は書いてください。

```ts
it("判定中にもう一度予想しても状態が変わらない（連打で先に進めない）", () => {
  const revealing = reduce(stateWith(card("spades", "5"), [card("hearts", "9"), card("clubs", "2")]), {
    type: "guess",
    guess: "high",
  });
  const again = reduce(revealing, { type: "guess", guess: "low" });
  expect(again).toBe(revealing);
});
```

`toEqual` ではなく **`toBe`** を使っているのがポイントです。
「同じ内容の別オブジェクト」ではなく「まったく同じオブジェクト」＝
**本当に何も起きていない**ことまで確認できます。

### seed を固定する理由

`Math.random()` を使うと、テストが「たまに落ちる」ものになります。
落ちた原因を追えないテストは、無いのと同じです。

```ts
it("同じ seed なら同じ展開になる（テストが安定する）", () => {
  const a = createInitialState(42);
  const b = createInitialState(42);
  expect(a.current.id).toBe(b.current.id);
  expect(a.deck.map((c) => c.id)).toEqual(b.deck.map((c) => c.id));
});
```

CPU の判断も同じです。`Rng` を引数で受け取っておけば、選択まで固定できます。

```ts
it("乱数を固定すれば選択も決まる", () => {
  const guess1 = chooseGuess(card("spades", "5"), createRng(3));
  const guess2 = chooseGuess(card("spades", "5"), createRng(3));
  expect(guess1).toBe(guess2);
});
```

### pendingDelayMs もテストする

時間の扱いは、画面を作る前にここで固めておきます。

```ts
it("入力待ちのときは null（＝タイマーを動かさない）", () => {
  expect(pendingDelayMs(createInitialState(1))).toBeNull();
});

it("判定待ちのときは待ち時間を返す", () => {
  const state = reduce(createInitialState(1), { type: "guess", guess: "high" });
  expect(pendingDelayMs(state)).toBeGreaterThan(0);
});
```

### 書いたテストを1回疑う

AI に書かせたテストは、**通ることだけを目的に書かれていることがあります。**
アサーションを1つわざと逆にして（`toBe(1)` を `toBe(2)` にして）`npm test` を実行し、
**赤くなることを自分の目で見てください。**赤くならないテストは何も守っていません。
確認したら必ず元に戻します。

## 4. 画面を作る

`.tsx` の担当は**見た目と時間だけ**です。「勝ったかどうか」を計算し始めたら、
それは `logic.ts` に移すサインです。

### GameShell で包む

```tsx
export function ExampleGame({ manifest, onExit }: GameComponentProps) {
  // 乱数と時間は UI 側で作る。logic.ts には持ち込まない。
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 100000)),
  );

  // 判定待ちの間だけタイマーが動く。入力待ちのときは pendingDelayMs が null を返すので止まる。
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={() => dispatch({ type: "reset" })}
      headerRight={<ScoreBoard entries={scoreEntries} title="スコア" />}
    >
      {/* ここにゲーム画面 */}
    </GameShell>
  );
}
```

ポイントは5つです。

- `Math.random()` を呼んでよいのは**この初期化の行だけ**です
  （`.tsx` は純粋関数ではないので許されています）。
- `useReducer(reduce, undefined, () => createInitialState(...))` の形で初期化します。
  第2引数に直接書くと、再描画のたびに配り直しになります。
- `onReset` を渡すと「もう一度」ボタンが出ます。渡さないと出ません。
- `headerRight` に `ScoreBoard` や `Timer` を差し込みます。
- **`GameShell` は必須です。**契約テストが `data-testid="game-shell"` を確認しています。
  `manifest.howToPlay` は `GameShell` が画面下部に自動で表示するので、
  `GameInstructions` を自分で置く必要はありません。

### useCpuTurn の1行

```tsx
useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
```

**第2引数は必ずインラインの関数で渡してください。**
`useCallback` で固定すると状態が変わってもタイマーが張り直されず、
**CPU が1回しか動かなくなります**（よくある詰まりの第1位です）。

### @ui のコンポーネントの使い分け

`import { ... } from "@ui"` で読み込みます。ここに無いものはありません。

| 部品 | 使う場面 | よく使う props |
|---|---|---|
| `Card` | 1枚だけ見せる（場札、めくったカード） | `card` `face="up"/"down"` `size` `selected` `highlighted` `disabled` `placeholder` `onClick` |
| `Hand` | 手札・場の並び | `cards` `face` `layout="row"/"fan"/"grid"/"stack"` `columns` `selectedIds` `disabledIds` `highlightedIds` `onCardClick` `label` |
| `DeckPile` | 山札・捨て札・台札（枚数つき） | `count` `top` `face` `label` `highlighted` `onClick` |
| `ScoreBoard` | 得点表・手番表示（`headerRight` に置く） | `entries` `title` |
| `ResultModal` | 終了時の結果 | `open` `title` `score` `message` `ranking` `onRetry` `onExit` |
| `LogPanel` | 「CPU 2 がダウトを宣言しました」の進行ログ | `entries`（新しい順） `title` `max` |
| `Button` | 操作ボタン | `variant` `size` `disabled` `onClick` `fullWidth` |
| `Timer` | 経過時間の表示（数えるのは `@core` のフック） | `ms` `label` `warning` |

使い方の例です。

```tsx
<Card card={state.current} face="up" size="lg" />
<DeckPile count={state.deck.length} label="山札" />
<Hand cards={state.field} layout="grid" columns={4} face="down" />
<Hand cards={state.hands.you} highlightedIds={playableIds} onCardClick={(c) => dispatch({ type: "play", cardId: c.id })} />
```

`ScoreBoard` の `entries` は手番の表示にも使えます。

```tsx
const scoreEntries = [
  { id: "you", name: "あなた", detail: state.humanScore + "点", isCurrent: !isFinished },
  { id: "cpu", name: "CPU", detail: state.cpuScore + "点" },
];
```

`isCurrent` を付けた行に手番マークが出ます。`isFinished` で上がった人を薄くできます。

結果表示は `rankByScore` / `rankByFinishOrder`（`@core`）が作った `Ranking` を渡すだけです。

```tsx
const ranking = rankByScore([
  { id: "you", name: "あなた", score: state.humanScore },
  { id: "cpu", name: "CPU", score: state.cpuScore },
]);

<ResultModal
  open={isFinished}
  title="あなたの勝ち！"
  score={state.humanScore + " 対 " + state.cpuScore}
  ranking={ranking}
  onRetry={() => dispatch({ type: "reset" })}
  onExit={onExit}
/>
```

### 押せないボタンは disabled にする

連打対策は `logic.ts` 側でも弾いていますが、**画面でも押せなくします。**

```tsx
<Button onClick={() => dispatch({ type: "guess", guess: "high" })} disabled={state.phase !== "guessing"}>
  HIGH ↑
</Button>
```

「押せるのに何も起きない」より「押せないと見える」ほうが、遊ぶ人にもレビュアーにも親切です。

### 複数枚を選ぶ UI（大富豪・ダウト向け）

お手本の `example-game` には複数選択がありません。**ここが唯一の見本です。**
選択状態は `.tsx` の `useState` で持ち、`Hand` に `selectedIds` として渡します。

```tsx
const [selected, setSelected] = useState<string[]>([]);

const toggle = (id: string) =>
  setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

<Hand
  cards={state.hands.you}
  selectedIds={selected}
  onCardClick={(card) => toggle(card.id)}
  label="あなたの手札"
/>
<Button
  onClick={() => {
    dispatch({ type: "play", cardIds: selected });
    setSelected([]);              // 出したら選択を空に戻す
  }}
  disabled={selected.length === 0 || state.turn.currentId !== "you"}
>
  出す（{selected.length}枚）
</Button>
```

注意点が3つあります。

- **選択は状態（`logic.ts`）ではなく画面（`.tsx`）に持ちます。**
  「どれを選んだか」はまだルールではないからです。`reduce` に渡すのは確定した `cardIds` だけです。
- **出したあとに `setSelected([])` を忘れない。** 残っていると次の手番で古い id を送ります。
- **「その組み合わせが出せるか」の判定は `logic.ts` に書きます。**
  `canPlay(state, cardIds)` のような純粋関数にすればそのままテストでき、
  ボタンの `disabled` にも使い回せます。

### 他プレイヤーの手札を隠す（ダウト・大富豪向け）

他の人の手札は **`Hand variant="hidden"`** を使います。
このモードは `count` と `label` しか受け取らないので、
**実カードが DOM に一切入りません**（覗いてもカンニングできません）。

```tsx
<Hand variant="hidden" count={state.hands["cpu-1"].length} label="CPU 1" />
<Hand variant="hidden" count={state.hands["cpu-2"].length} label="CPU 2" />
```

`cards` や `face` を渡そうとすると型エラーになります。それが仕様です。

裏向きに**並べたい**とき（ババ抜きで相手の手札から引く、神経衰弱の場札）は
`variant="open"` のまま `face="down"` にします。こちらも中身は DOM に出ません。

```tsx
<Hand
  cards={state.hands["cpu-1"]}
  face="down"
  onCardClick={(_card, index) => dispatch({ type: "draw", index })}
/>
```

`onCardClick` は `(card, index)` を受け取ります。裏向きのときは
**カードの中身ではなく `index` を使う**のが正しい書き方です。
`Card` 単体でも同じで、`face="down"` のときスートもランクも DOM に出ません。

## 5. manifest を仕上げる

`index.ts` には `export const game: GameManifest` **だけ**を書きます（関数も JSX も置きません）。

```ts
export const game: GameManifest = {
  id: "babanuki",          // フォルダ名と一致（変更禁止）
  name: "ババ抜き",         // 20文字以内（変更禁止）
  description: "...",      // 60文字以内
  difficulty: "easy",      // 変更禁止
  team: "team-a",          // 変更禁止
  status: "coming-soon",   // 完成したら "ready" に変える
  minPlayers: 4,
  maxPlayers: 4,
  icon: "🃏",
  issueNumber: 1,
  howToPlay: ["...", "..."],   // 3〜6行
  component: BabanukiGame,
};
```

**変更してよいのは `description` / `howToPlay` / `icon` / `status` の4つだけ**です。
`id` `name` `team` `difficulty` は運営が決めた値で、変えると契約テストと CI が落ちます。

### howToPlay の書き方

`GameShell` が画面下部の「遊び方」に、この配列をそのまま番号つきで表示します。
**ルールの解説ではなく、遊ぶ人の操作の順番**を書いてください。3〜6行です。

お手本（`example-game`）はこうなっています。

```ts
howToPlay: [
  "表向きのカードを見て、次のカードが「高い」か「低い」かを選びます。",
  "CPU も同時に予想します。当たった人だけが1点を獲得します。",
  "同じ数字が出たときは引き分けで、どちらも点になりません。",
  "全10ラウンドを終えて、得点が多いほうが勝ちです。",
],
```

- 1行1文。「〜します」で終える
- 1行目は**最初にする操作**、最後の行は**勝敗の決まり方**
- 実装していないルールを書かない（書くと遊ぶ人が迷います）

`description` は一覧タイルに出る60文字以内の1行です。
`harness/config.json` の値が雛形に入っているので、そのままで問題ありません。

### status を "ready" にするタイミング

これが**完成の宣言**です。Pull Request の差分に1行として現れ、レビュアーはここを見ます。

```ts
status: "ready",
```

`"ready"` に変えると、契約テストが次の2つを要求します。

1. `logic.test.ts` に **`it(` が3件以上**あること（`it.skip` / `describe.skip` があると落ちます）
2. 画面が**例外を出さずに描画でき**、`GameShell` を使っていること

順番を守ってください。

```text
必須要件が全部終わった
   -> npm run verify が緑になった
   -> そこで初めて status を "ready" に変える
   -> もう一度 npm run verify
```

**先に `"ready"` にしないでください。**まだ動かない状態で `"ready"` にすると、
`main` にマージされたときにアーケード全体のテストが落ちます。

## 6. 動作確認

テストが緑でも、**遊べるとは限りません。**必ず自分の手で1回遊びます。

```powershell
npm run dev
```

ターミナルに表示された URL（既定では `http://localhost:5173/`）を開いて、次の順に確認します。

1. アーケードの一覧に**自分のゲームが出ている**
2. タイルを押してゲームが開く
3. **最初から最後まで1回遊び切る**（勝つまで、または負けるまで）
4. 結果画面が出る
5. 「もう一度」で最初からやり直せる
6. 「← アーケードへ」で一覧に戻れる
7. 画面下の「遊び方」が、実際の操作と合っている

遊びながら特に見るところです。

- **CPU の手番が止まらないか**（`pendingDelayMs` が `null` を返し忘れていないか）
- **勝手に進まないか**（自分の入力待ちで数値を返していないか）
- **連打しても壊れないか**（同じボタンを素早く3回押す）
- **終了後にボタンが押せなくなっているか**

問題がなければ、開発サーバーを止めて（`Ctrl + C`）最後にこれを実行します。

```powershell
npm run verify
```

範囲チェック → lint → 型チェック → テスト → ビルド の順に走ります。
**CI とまったく同じ内容**なので、ここが緑なら CI も緑になります。
**これが緑になって初めて「できました」と言えます。**

## よくある詰まり

| 症状 | 原因 | 直し方 |
|---|---|---|
| 一覧に自分のゲームが出ない | `export const game` になっていない / `id` とフォルダ名が違う | `index.ts` を確認する |
| CPU が1回しか動かない | `useCpuTurn` に渡す関数を `useCallback` で固定した | インラインの関数で渡す |
| CPU が止まらない・画面が固まる | 終了状態で `pendingDelayMs` が数値を返している | `phase === "finished"` で `null` を返す |
| 操作していないのに勝手に進む | 人間の入力待ちで `pendingDelayMs` が数値を返している | 手番が `"you"` のときは `null` を返す |
| `tick` が無限に飛ぶ | `tick` を処理しても `state` が変わっていない | `applyTick` が必ず状態を進めるようにする |
| テストが時々落ちる | `Math.random()` を使っている | `createRng(seed)` を引数で渡す |
| lint が「@ui は使えません」と言う | `logic.ts` で画面のものを import した | 画面の処理は `.tsx` へ移す |
| lint が「Math.random() は使えません」と言う | `logic.ts` / `cpu.ts` で乱数を直接呼んだ | `Rng` を引数で受け取る形にする |
| 範囲チェックで落ちる | 担当フォルダの外を触った | `npm run scope` が出す `git restore ...` をそのまま実行する |
| 契約テストが「テストが3件しかありません」と言う | `status: "ready"` にしたのにテストが足りない | `logic.test.ts` に `it(` を3件以上書く |
| 契約テストが「GameShell を使っていません」と言う | 画面を `GameShell` で包んでいない | `<GameShell manifest={manifest} onExit={onExit}>` で包む |
| 契約テストが README の見出しで落ちる | `README.md` の見出しを消した | `## 遊び方` `## ルール` `## 実装メモ` を残す |
| `npm install` したくなった | 依存の追加は禁止 | 必要なものは `@core` / `@ui` にあります |
| 型が合わない・関数が見つからない | `@core` に無い関数を想像した | `src/core/index.ts` に無いものは**無い**。講師に相談する |

詰まって10分たったら、`/stuck` を実行するか講師を呼んでください。
1人で30分溶かすのが、いちばんもったいない使い方です。
