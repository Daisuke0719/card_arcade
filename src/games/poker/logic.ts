import {
  RANK_ORDER_ACE_HIGH,
  createDeck,
  createRankStrength,
  createRng,
  createSoloVsCpu,
  deal,
  drawMany,
  groupByRank,
  groupBySuit,
  shuffle,
} from "@core";
import type { CardId, PlayerId, PlayingCard, Ranking } from "@core";
import { chooseDiscardIds } from "./cpu";

export const SHOWDOWN_DELAY_MS = 900;

export type Phase = "exchanging" | "showdown" | "finished";
export type HandRank =
  | "high-card"
  | "one-pair"
  | "two-pair"
  | "three-of-a-kind"
  | "straight"
  | "flush"
  | "full-house"
  | "four-of-a-kind"
  | "straight-flush";

export const HAND_ORDER: readonly HandRank[] = [
  "high-card",
  "one-pair",
  "two-pair",
  "three-of-a-kind",
  "straight",
  "flush",
  "full-house",
  "four-of-a-kind",
  "straight-flush",
];

export const HAND_NAME_JA: Readonly<Record<HandRank, string>> = {
  "high-card": "ハイカード",
  "one-pair": "ワンペア",
  "two-pair": "ツーペア",
  "three-of-a-kind": "スリーカード",
  straight: "ストレート",
  flush: "フラッシュ",
  "full-house": "フルハウス",
  "four-of-a-kind": "フォーカード",
  "straight-flush": "ストレートフラッシュ",
};

export type HandValue = { readonly rank: HandRank; readonly tiebreak: readonly number[] };
export type Outcome = "you" | "cpu" | "draw";
export type PokerState = {
  readonly deck: readonly PlayingCard[];
  readonly hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>;
  readonly exchanged: Readonly<Record<PlayerId, number>>;
  readonly phase: Phase;
  readonly values: Readonly<Record<PlayerId, HandValue>> | null;
  readonly outcome: Outcome | null;
  readonly seed: number;
};
export type PokerAction =
  | { readonly type: "exchange"; readonly cardIds: readonly CardId[] }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

const YOU: PlayerId = "you";
const CPU: PlayerId = "cpu-1";
const cardStrength = createRankStrength(RANK_ORDER_ACE_HIGH);

export function cardValue(card: PlayingCard): number {
  return cardStrength(card.rank) + 2;
}

function isStraight(values: readonly number[]): number | null {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length !== 5 || new Set(sorted).size !== 5) return null;
  if (sorted.every((value, index) => index === 0 || value - sorted[index - 1] === 1)) {
    return sorted[4];
  }
  if (sorted.join(",") === "2,3,4,5,14") return 5;
  return null;
}

function descending(values: readonly number[]): number[] {
  return [...values].sort((a, b) => b - a);
}

export function evaluateHand(cards: readonly PlayingCard[]): HandValue {
  const groups = [...groupByRank(cards).values()].sort(
    (a, b) => b.length - a.length || cardValue(b[0]) - cardValue(a[0]),
  );
  const counts = groups.map(group => group.length);
  const groupValues = groups.map(group => cardValue(group[0]));
  const values = cards.map(cardValue);
  const flush = groupBySuit(cards).size === 1;
  const straightHigh = isStraight(values);

  if (straightHigh !== null && flush) return { rank: "straight-flush", tiebreak: [straightHigh] };
  if (counts[0] === 4) return { rank: "four-of-a-kind", tiebreak: [groupValues[0]] };
  if (counts[0] === 3 && counts[1] === 2) {
    return { rank: "full-house", tiebreak: [groupValues[0], groupValues[1]] };
  }
  if (flush) return { rank: "flush", tiebreak: descending(values) };
  if (straightHigh !== null) return { rank: "straight", tiebreak: [straightHigh] };
  if (counts[0] === 3) return { rank: "three-of-a-kind", tiebreak: [groupValues[0]] };
  if (counts[0] === 2 && counts[1] === 2) {
    return { rank: "two-pair", tiebreak: [groupValues[0], groupValues[1]] };
  }
  if (counts[0] === 2) return { rank: "one-pair", tiebreak: [groupValues[0]] };
  return { rank: "high-card", tiebreak: descending(values) };
}

export function compareHands(a: HandValue, b: HandValue): number {
  const rankDifference = HAND_ORDER.indexOf(a.rank) - HAND_ORDER.indexOf(b.rank);
  if (rankDifference !== 0) return rankDifference;
  const length = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (a.tiebreak[index] ?? 0) - (b.tiebreak[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/** 画面に渡す1人分の席。CPU版とオンライン版で同じ形を使う。 */
export type PokerSeatView = {
  readonly id: PlayerId;
  readonly name: string;
  /** 見せてよいときだけ中身を入れる。伏せている間は null。 */
  readonly cards: readonly PlayingCard[] | null;
  readonly cardCount: number;
  /** 交換した枚数。まだ交換していない、または表示しない間は null。 */
  readonly exchangedCount: number | null;
  /** 判定後に公開する役。それまでは null。 */
  readonly handRank: HandRank | null;
};

/** 画面に渡す公開状態。CPU版はローカル状態から、オンライン版はサーバーが作る。 */
export type PokerView = {
  readonly phase: Phase;
  readonly me: PokerSeatView;
  readonly opponent: PokerSeatView;
  readonly deckCount: number;
  /** 勝った人。決着前と引き分けでは null。 */
  readonly winnerId: PlayerId | null;
};

/** 手札から指定したカードを捨て、同じ枚数を山札の上から補充する。 */
export function replaceCards(
  hand: readonly PlayingCard[],
  deck: readonly PlayingCard[],
  discardIds: readonly CardId[],
): { readonly hand: PlayingCard[]; readonly deck: PlayingCard[]; readonly discarded: number } {
  const selected = new Set(discardIds);
  const keep = hand.filter(card => !selected.has(card.id));
  const discarded = hand.length - keep.length;
  const { cards, rest } = drawMany(deck, discarded);
  return { hand: [...keep, ...cards], deck: [...rest], discarded };
}

export function createInitialState(seed = 1): PokerState {
  const deck = shuffle(createDeck(), createRng(seed));
  const players = createSoloVsCpu(1);
  const { hands: dealt, rest } = deal(deck, players.length, 5);
  return {
    deck: rest,
    hands: { [YOU]: dealt[0], [CPU]: dealt[1] },
    exchanged: { [YOU]: 0, [CPU]: 0 },
    phase: "exchanging",
    values: null,
    outcome: null,
    seed,
  };
}

export function exchange(state: PokerState, selectedIds: readonly CardId[]): PokerState {
  if (state.phase !== "exchanging") return state;
  // プレイヤーが先に山札から補充し、続けて CPU が補充する。
  const you = replaceCards(state.hands[YOU], state.deck, selectedIds);
  const cpu = replaceCards(state.hands[CPU], you.deck, chooseDiscardIds(state.hands[CPU]));
  const hands = { [YOU]: you.hand, [CPU]: cpu.hand };
  const values = { [YOU]: evaluateHand(hands[YOU]), [CPU]: evaluateHand(hands[CPU]) };
  const comparison = compareHands(values[YOU], values[CPU]);
  return {
    ...state,
    deck: cpu.deck,
    hands,
    exchanged: { [YOU]: you.discarded, [CPU]: cpu.discarded },
    phase: "showdown",
    values,
    outcome: comparison > 0 ? "you" : comparison < 0 ? "cpu" : "draw",
  };
}

export function getRanking(state: PokerState): Ranking {
  if (!state.outcome) return [];
  if (state.outcome === "draw") {
    return [
      { rank: 1, name: "あなた", detail: HAND_NAME_JA[state.values![YOU].rank] },
      { rank: 1, name: "CPU 1", detail: HAND_NAME_JA[state.values![CPU].rank] },
    ];
  }
  const winner = state.outcome === "you" ? YOU : CPU;
  const loser = winner === YOU ? CPU : YOU;
  const names = { [YOU]: "あなた", [CPU]: "CPU 1" };
  return [
    { rank: 1, name: names[winner], detail: HAND_NAME_JA[state.values![winner].rank] },
    { rank: 2, name: names[loser], detail: HAND_NAME_JA[state.values![loser].rank] },
  ];
}

export function reduce(state: PokerState, action: PokerAction): PokerState {
  switch (action.type) {
    case "exchange":
      return exchange(state, action.cardIds);
    case "tick":
      return state.phase === "showdown" ? { ...state, phase: "finished" } : state;
    case "reset":
      return createInitialState(action.seed ?? state.seed + 1);
  }
}

export function pendingDelayMs(state: PokerState): number | null {
  return state.phase === "showdown" ? SHOWDOWN_DELAY_MS : null;
}

export function isGameOver(state: PokerState): boolean {
  return state.phase === "finished";
}

/** CPU版のローカル状態を、オンライン版と同じ公開状態の形に変える。 */
export function toCpuView(state: PokerState): PokerView {
  const exchangedShown = state.phase !== "exchanging";
  const finished = state.phase === "finished";
  const seat = (id: PlayerId, name: string, revealCards: boolean): PokerSeatView => ({
    id,
    name,
    cards: revealCards ? state.hands[id] : null,
    cardCount: state.hands[id].length,
    exchangedCount: exchangedShown ? state.exchanged[id] : null,
    handRank: finished && state.values ? state.values[id].rank : null,
  });
  return {
    phase: state.phase,
    me: seat(YOU, "あなた", true),
    opponent: seat(CPU, "CPU 1", finished),
    deckCount: state.deck.length,
    winnerId: state.outcome === "you" ? YOU : state.outcome === "cpu" ? CPU : null,
  };
}
