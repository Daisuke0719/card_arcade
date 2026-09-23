/** ぶたのしっぽのルール。状態遷移はすべてここに置く。 */
import {
  createDeck,
  createRng,
  createSoloVsCpu,
  createTurnState,
  draw,
  last,
  nextTurn,
  rankByScore,
  requireCard,
  sameRank,
  shuffle,
} from "@core";
import type { PlayerId, PlayingCard, Ranking, TurnState } from "@core";

/** CPU が1枚めくるまでの待ち時間。 */
export const CPU_INTERVAL_MS = 900;
/** 引き取りを見せている時間。 */
export const COLLECT_DELAY_MS = 700;

export type Phase = "playing" | "collecting" | "finished";

export type ButanoshippoState = {
  readonly ring: readonly PlayingCard[];
  readonly pile: readonly PlayingCard[];
  readonly collected: Readonly<Record<PlayerId, number>>;
  readonly turn: TurnState;
  readonly phase: Phase;
  readonly lastCollectorId: PlayerId | null;
  readonly seed: number;
};

export type ButanoshippoAction =
  | { readonly type: "flip" }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

function isCpuTurn(state: ButanoshippoState): boolean {
  return state.turn.players.find((player) => player.id === state.turn.currentId)?.kind === "cpu";
}

export function createInitialState(seed = 1): ButanoshippoState {
  const players = createSoloVsCpu(3);
  return {
    ring: shuffle(createDeck(), createRng(seed)),
    pile: [],
    collected: Object.fromEntries(players.map((player) => [player.id, 0])) as Record<PlayerId, number>,
    turn: createTurnState(players),
    phase: "playing",
    lastCollectorId: null,
    seed,
  };
}

export function isMatch(prev: PlayingCard | undefined, next: PlayingCard): boolean {
  return prev !== undefined && sameRank(prev, next);
}

/** 先頭をめくり、合致時には引き取り演出フェーズへ移る。 */
export function flipNext(state: ButanoshippoState): ButanoshippoState {
  if (state.phase !== "playing" || state.ring.length === 0) return state;
  const { card: flipped, rest } = draw(state.ring);
  const nextCard = requireCard(flipped, "輪にカードがありません");
  const pile = [...state.pile, nextCard];

  if (isMatch(last(state.pile), nextCard)) {
    return { ...state, ring: rest, pile, phase: "collecting", lastCollectorId: null };
  }

  return {
    ...state,
    ring: rest,
    pile,
    turn: nextTurn(state.turn),
    phase: rest.length === 0 ? "finished" : "playing",
    lastCollectorId: null,
  };
}

/** 場札を手番の人が受け取り、次の人へ手番を渡す。 */
export function collectPile(state: ButanoshippoState): ButanoshippoState {
  if (state.phase !== "collecting") return state;
  const collectorId = state.turn.currentId;
  const collected = {
    ...state.collected,
    [collectorId]: state.collected[collectorId] + state.pile.length,
  };
  return {
    ...state,
    collected,
    pile: [],
    turn: nextTurn(state.turn),
    phase: state.ring.length === 0 ? "finished" : "playing",
    lastCollectorId: collectorId,
  };
}

export function getRanking(state: ButanoshippoState): Ranking {
  return rankByScore(
    state.turn.players.map((player) => ({
      id: player.id,
      name: player.name,
      score: state.collected[player.id],
    })),
    "lower-is-better",
  );
}

export function reduce(state: ButanoshippoState, action: ButanoshippoAction): ButanoshippoState {
  switch (action.type) {
    case "reset":
      return createInitialState(action.seed ?? state.seed + 1);
    case "flip":
      return state.phase === "playing" && state.turn.currentId === "you" ? flipNext(state) : state;
    case "tick":
      if (state.phase === "collecting") return collectPile(state);
      if (state.phase === "playing" && isCpuTurn(state)) return flipNext(state);
      return state;
  }
}

export function pendingDelayMs(state: ButanoshippoState): number | null {
  if (state.phase === "finished") return null;
  if (state.phase === "collecting") return COLLECT_DELAY_MS;
  return isCpuTurn(state) ? CPU_INTERVAL_MS : null;
}

export function isGameOver(state: ButanoshippoState): boolean {
  return state.phase === "finished";
}
