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
  const selected = new Set(selectedIds);
  const youDiscard = state.hands[YOU].filter(card => selected.has(card.id));
  const cpuDiscardIds = new Set(chooseDiscardIds(state.hands[CPU]));
  const cpuDiscard = state.hands[CPU].filter(card => cpuDiscardIds.has(card.id));
  const youKeep = state.hands[YOU].filter(card => !selected.has(card.id));
  const cpuKeep = state.hands[CPU].filter(card => !cpuDiscardIds.has(card.id));
  const { cards: replacements, rest: deck } = drawMany(state.deck, youDiscard.length + cpuDiscard.length);
  const youDrawn = replacements.slice(0, youDiscard.length);
  const cpuDrawn = replacements.slice(youDiscard.length);
  const hands = {
    [YOU]: [...youKeep, ...youDrawn],
    [CPU]: [...cpuKeep, ...cpuDrawn],
  };
  const values = { [YOU]: evaluateHand(hands[YOU]), [CPU]: evaluateHand(hands[CPU]) };
  const comparison = compareHands(values[YOU], values[CPU]);
  return {
    ...state,
    deck,
    hands,
    exchanged: { [YOU]: youDiscard.length, [CPU]: cpuDiscard.length },
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
