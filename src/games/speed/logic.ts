// @scaffold:untouched
/**
 * スピード のルール。
 *
 * このファイルには「純粋な処理」だけを書きます。
 *   - react を import しない
 *   - Math.random() / Date.now() / setTimeout を使わない
 *   - 乱数が必要なら引数で Rng を受け取る（テストで createRng(seed) を渡せるようにする）
 * これらは ESLint がエラーにするので、うっかり書いても CI の前に気づけます。
 *
 * お手本: src/games/example-game/logic.ts
 */
import { createDeck, createRng, shuffle, cycleRank } from "@core";
import type { PlayingCard, Rng, CardId } from "@core";

/** CPU が1枚出す間隔。 */
export const CPU_INTERVAL_MS = 1200;
/** 両者が詰んだときに台札を足すまでの待ち時間。 */
export const REFILL_DELAY_MS = 700;
/** 手札の枚数。常にこの枚数に補充する。 */
export const HAND_SIZE = 4;

export type Phase = "playing" | "finished";
export type Side = "you" | "cpu";
export type PileIndex = 0 | 1;
export type Piles = readonly [PlayingCard, PlayingCard];

export type SpeedSide = {
  readonly hand: readonly PlayingCard[];
  readonly deck: readonly PlayingCard[];
};

export type SpeedState = {
  readonly you: SpeedSide;
  readonly cpu: SpeedSide;
  readonly piles: Piles;
  readonly phase: Phase;
  readonly winner: Side | "draw" | null;
  readonly seed: number;
};

export type SpeedAction =
  | { readonly type: "play"; readonly side: Side; readonly cardId: CardId }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/** この台札にこのカードを出せるか。1つ違いだけ true（同ランクは false、A と K は繋がる）。 */
export function canPlay(card: PlayingCard, pile: PlayingCard): boolean {
  if (card.rank === pile.rank) return false;
  return cycleRank(pile.rank, 1) === card.rank || cycleRank(pile.rank, -1) === card.rank;
}

/** 出す先の台札。左右どちらにも出せるときは必ず 0（左）を返す。出せなければ null。 */
export function playablePileIndex(card: PlayingCard, piles: Piles): PileIndex | null {
  const canLeft = canPlay(card, piles[0]);
  const canRight = canPlay(card, piles[1]);
  if (canLeft) return 0;
  if (canRight) return 1;
  return null;
}

/** その陣営に出せるカードが1枚でもあるか。 */
export function hasPlayableCard(side: SpeedSide, piles: Piles): boolean {
  return side.hand.some((card) => playablePileIndex(card, piles) !== null);
}

/** 両者が詰んだとき、各自の山札から1枚ずつ台札に足す。足せなければ finished にする。 */
export function refillPiles(state: SpeedState): SpeedState {
  const youHasDeck = state.you.deck.length > 0;
  const cpuHasDeck = state.cpu.deck.length > 0;

  if (!youHasDeck && !cpuHasDeck) {
    return { ...state, phase: "finished" };
  }

  const newPiles: Piles = [
    youHasDeck ? state.you.deck[0] : state.piles[0],
    cpuHasDeck ? state.cpu.deck[0] : state.piles[1],
  ];

  const newYou: SpeedSide = youHasDeck
    ? { ...state.you, deck: state.you.deck.slice(1) }
    : state.you;

  const newCpu: SpeedSide = cpuHasDeck
    ? { ...state.cpu, deck: state.cpu.deck.slice(1) }
    : state.cpu;

  return {
    ...state,
    you: newYou,
    cpu: newCpu,
    piles: newPiles,
  };
}

/**
 * 今、何ミリ秒後に自動処理が必要か。null は「人間の入力待ち」。
 *   finished         -> null
 *   CPU が出せる     -> CPU_INTERVAL_MS
 *   両者とも出せない -> REFILL_DELAY_MS
 *   それ以外         -> null
 */
export function pendingDelayMs(state: SpeedState): number | null {
  if (state.phase === "finished") return null;

  const cpuCanPlay = hasPlayableCard(state.cpu, state.piles);
  if (cpuCanPlay) return CPU_INTERVAL_MS;

  const youCanPlay = hasPlayableCard(state.you, state.piles);
  if (!youCanPlay && !cpuCanPlay) return REFILL_DELAY_MS;

  return null;
}

/** 最初の状態を作る。seed を固定すると毎回同じ配りになる（テスト用）。 */
export function createInitialState(seed: number): SpeedState {
  const rng: Rng = createRng(seed);
  const deck = shuffle(createDeck(), rng);

  const yourCards = deck.slice(0, 26);
  const cpuCards = deck.slice(26, 52);

  return {
    you: {
      hand: yourCards.slice(0, 4),
      deck: yourCards.slice(5, 26),
    },
    cpu: {
      hand: cpuCards.slice(0, 4),
      deck: cpuCards.slice(5, 26),
    },
    piles: [yourCards[4], cpuCards[4]],
    phase: "playing",
    winner: null,
    seed,
  };
}

/** 片方のプレイヤーのカードを補充する。 */
function refillHand(side: SpeedSide, hand: readonly PlayingCard[]): SpeedSide {
  const needed = HAND_SIZE - hand.length;
  if (needed <= 0) return side;

  const drawn = side.deck.slice(0, needed);
  const remaining = side.deck.slice(needed);
  return {
    hand: [...hand, ...drawn],
    deck: remaining,
  };
}

/** 片方のプレイヤーがカードを出す。 */
function playCard(
  state: SpeedState,
  side: Side,
  cardId: CardId,
): SpeedState {
  const player = side === "you" ? state.you : state.cpu;

  const cardIndex = player.hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = player.hand[cardIndex];
  const pileIdx = playablePileIndex(card, state.piles);
  if (pileIdx === null) return state;

  const newHand = player.hand.filter((_, i) => i !== cardIndex);
  const newPiles: Piles = [
    pileIdx === 0 ? card : state.piles[0],
    pileIdx === 1 ? card : state.piles[1],
  ];

  const refilled = refillHand(player, newHand);

  const newState: SpeedState = {
    ...state,
    you: side === "you" ? refilled : state.you,
    cpu: side === "cpu" ? refilled : state.cpu,
    piles: newPiles,
  };

  if (newState.you.hand.length === 0 && newState.you.deck.length === 0) {
    return { ...newState, phase: "finished", winner: "you" };
  }
  if (newState.cpu.hand.length === 0 && newState.cpu.deck.length === 0) {
    return { ...newState, phase: "finished", winner: "cpu" };
  }

  return newState;
}

/** CPU がカードを出す（最初に出せるカードを選ぶ）。 */
function cpuTurn(state: SpeedState): SpeedState {
  const playable = state.cpu.hand.filter((card) => playablePileIndex(card, state.piles) !== null);
  if (playable.length === 0) return state;
  return playCard(state, "cpu", playable[0].id);
}

/** 状態 + 行動 -> 新しい状態。ゲームのルールはすべてここに書きます。 */
export function reduce(state: SpeedState, action: SpeedAction): SpeedState {
  switch (action.type) {
    case "reset": {
      const seed = action.seed ?? state.seed;
      return createInitialState(seed);
    }
    case "play":
      return playCard(state, action.side, action.cardId);
    case "tick": {
      const cpuCanPlay = hasPlayableCard(state.cpu, state.piles);
      const youCanPlay = hasPlayableCard(state.you, state.piles);

      if (cpuCanPlay) {
        return cpuTurn(state);
      }

      if (!youCanPlay && !cpuCanPlay) {
        return refillPiles(state);
      }

      return state;
    }
    default:
      return state;
  }
}

/** ゲームが終わったかどうか。 */
export function isGameOver(state: SpeedState): boolean {
  return state.phase === "finished";
}
