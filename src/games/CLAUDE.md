# ゲームを実装するときの決まり

このフォルダの下で作業します。**編集してよいのは `src/games/<自分のゲームID>/` の中だけ**です。

まず `src/games/example-game/` を読んでください。9ゲームすべてがこの形に落ちるように作ってあります。

## ファイルの役割（混ぜない）

| ファイル | 書くもの | 書いてはいけないもの |
|---|---|---|
| `index.ts` | `export const game: GameManifest` だけ | 関数・JSX |
| `logic.ts` | ルール・状態遷移（純粋関数） | react / 乱数 / 時間 / DOM |
| `cpu.ts` | CPU の判断（純粋関数 + `Rng` 引数） | 同上 |
| `<Xxx>Game.tsx` | 画面と時間（`useCpuTurn`） | 勝敗の判定ロジック |
| `logic.test.ts` | ロジックのテスト | — |
| `README.md` | 遊び方 / 採用したルール / 実装メモ | — |

「勝ったかどうか」を `.tsx` の中で計算し始めたら、それは `logic.ts` に移すサインです。

## GameManifest

```ts
export const game: GameManifest = {
  id: "babanuki",          // フォルダ名と一致（変更禁止）
  name: "ババ抜き",         // 20文字以内（変更禁止）
  description: "...",      // 60文字以内
  difficulty: "easy",      // 変更禁止
  owner: "participant-1",  // 担当者。harness/config.json の値（変更禁止）
  status: "coming-soon",   // 完成したら "ready" に変える
  minPlayers: 4,
  maxPlayers: 4,
  icon: "🃏",
  issueNumber: 1,
  howToPlay: ["...", "..."],   // 3〜6行
  component: BabanukiGame,
};
```

`owner` は担当者を表す文字列で、雛形を作った時点で `harness/config.json` の値が入っています。
自分で書き換えないでください（画面の並び順と契約テストがこの値を見ています）。

`status` を `"ready"` にすると、契約テストが**テスト3件以上**と**実際に描画できること**を要求します。
必須要件が終わって `npm run verify` が緑になってから変えてください。

## @core の早見表

```ts
import {
  // カード
  SUITS, RANKS, SUIT_SYMBOL, SUIT_COLOR, SUIT_NAME_JA,
  cardId, cardLabel, cardShortLabel, sameRank, sameSuit,
  isStandard, isJoker, partitionJokers,
  rankToNumber, numberToRank, cycleRank,          // cycleRank: K の次は A
  RANK_ORDER_ACE_LOW, RANK_ORDER_ACE_HIGH,
  createRankStrength, compareRank, compareCard,   // 強さの順序は自分で作れる
  sortCards, groupByRank, groupBySuit,

  // 山札
  createDeck,              // 52枚
  createDeckWithJokers,    // 52枚 + ジョーカー（ババ抜き用）
  createJokers,
  draw, drawMany, deal, returnToDeck,
  first, last, requireCard,

  // 乱数（テストで固定できる）
  createRng, shuffle, pickRandom, pickRandomIndex,

  // プレイヤーとターン
  createSoloVsCpu,         // あなた + CPU n人
  createPlayers, findPlayer,
  createTurnState, nextTurn, finishPlayer, reverseDirection,
  neighborId,              // 左隣の人（上がった人は自動で飛ばす）
  alivePlayers, isCurrent, isFinished, isOver,

  // スコア
  rankByScore, rankByFinishOrder, formatRank, formatDuration,

  // 保存
  useHighScore, gameKey,

  // 画面から使うフック
  useCpuTurn,              // 待ち時間つきの自動処理はこれ1本
  useElapsedMs, useCountdown, useGameSession,

  // テスト用
  card, hand, joker,       // card("spades","A") / hand("spades-A","hearts-K")
  assertNever,
} from "@core";
```

型も同じ入口から取ります。

```ts
import type {
  AnyCard, PlayingCard, JokerCard, Suit, Rank, CardId, Deck,
  Rng, Player, PlayerId, TurnState, Ranking, GameResult,
  GameManifest, GameComponentProps,
} from "@core";
```

ここに無いものが必要になったら `src/core/index.ts` を見てください。そこにも無ければ「無い」です。
自分で作らず、講師に相談します。

## @ui の早見表

```ts
import {
  Card,        // 1枚。face="down" にすると中身は DOM に出ない
  Hand,        // 手札。variant="hidden" なら枚数だけ（他プレイヤー用）
  DeckPile,    // 山札・捨て札・場札
  GameShell,   // 画面の外枠。必ずこれで包む
  Button, ScoreBoard, Timer, ResultModal, GameInstructions, LogPanel,
  ComingSoonPanel,
} from "@ui";
```

### 複数枚を選ぶ UI（大富豪・ダウト・ポーカー）

```tsx
const [selected, setSelected] = useState<string[]>([]);

const toggle = (id: string) =>
  setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

<Hand
  cards={state.hands.you}
  selectedIds={selected}
  onCardClick={(card) => toggle(card.id)}
/>
<Button onClick={() => dispatch({ type: "play", cardIds: selected })} disabled={selected.length === 0}>
  出す
</Button>
```

## CPU の作り方

**単純なルールベースで十分**です。強い CPU を作る研修ではありません。

```ts
// cpu.ts
export function playableProbability(...): number { ... }   // 純粋関数（テストするのはこちら）
export function chooseMove(state, rng: Rng) { ... }        // 乱数と比べる薄い層
```

CPU の手番は `pendingDelayMs()` が待ち時間を返すことで自然に直列化されます。
`.tsx` の中で `setTimeout` を書かないでください。

## よくある失敗

| 症状 | 原因 | 直し方 |
|---|---|---|
| 一覧に自分のゲームが出ない | `export const game` になっていない / id とフォルダ名が違う | `index.ts` を確認 |
| CPU が1回しか動かない | `useCpuTurn` に渡す関数を `useCallback` で固定した | インラインの関数で渡す |
| テストが時々落ちる | `Math.random()` を使っている | `createRng(seed)` を引数で渡す |
| lint が「@ui は使えません」と言う | `logic.ts` で画面のものを import した | 画面の処理は `.tsx` へ移す |
| 範囲チェックで落ちる | 担当フォルダの外を触った | `npm run scope` が出す `git restore` をそのまま実行 |
| 契約テストが owner で落ちる | `index.ts` の `owner` を書き換えた | `harness/config.json` の値に戻す |

## 進め方

必須要件が全部終わるまで、発展課題に手を出さないでください。
時間が足りないときは、発展課題ではなく**必須要件の削り方**を講師に相談します。

1人で作っているので、詰まったことに気づけるのは自分だけです。
15分手が止まったら `/stuck` で状況を整理して講師に見せてください。
Issue のチェックリストを1つずつ埋めていくことが、外から見える唯一の進捗になります。
