import type { Player } from "./protocol";

type Card = { id: string; suit: string; rank: string };
export type PageOneAction = { type: "play_card"; cardId: string } | { type: "draw_card" };
export type PageOneState = { deck: Card[]; field: Card[]; hands: Record<string, Card[]>; currentPlayerId: string; finished: boolean; winnerId: string | null };

const suits = ["spades", "hearts", "diamonds", "clubs"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function deck(seed: number): Card[] {
  const cards = suits.flatMap((suit) => ranks.map((rank) => ({ id: `${suit}-${rank}`, suit, rank })));
  for (let i = cards.length - 1; i > 0; i -= 1) { seed = (seed * 1664525 + 1013904223) >>> 0; const j = seed % (i + 1); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards;
}

export function createPageOneState(seed: number, players: readonly Player[]): PageOneState {
  const cards = deck(seed); const hands: Record<string, Card[]> = {};
  players.forEach((player) => { hands[player.id] = cards.splice(0, 5); });
  return { deck: cards.slice(1), field: [cards[0]], hands, currentPlayerId: players[0]?.id ?? "", finished: false, winnerId: null };
}

export function validatePageOne(state: PageOneState, action: PageOneAction, playerId: string): { ok: boolean; reason?: string } {
  if (state.finished) return { ok: false, reason: "試合は終了しています" };
  if (state.currentPlayerId !== playerId) return { ok: false, reason: "あなたの手番ではありません" };
  const hand = state.hands[playerId] ?? []; const top = state.field[state.field.length - 1];
  if (!top) return { ok: false, reason: "場札がありません" };
  if (action.type === "play_card") {
    const card = hand.find((item) => item.id === action.cardId);
    if (!card) return { ok: false, reason: "そのカードを持っていません" };
    if (card.suit !== top.suit && card.rank !== top.rank) return { ok: false, reason: "場札と同じマークか数字のカードを出してください" };
  } else if (hand.some((card) => card.suit === top.suit || card.rank === top.rank)) return { ok: false, reason: "出せるカードがあるときは先に出してください" };
  return { ok: true };
}

export function reducePageOne(state: PageOneState, action: PageOneAction, players: readonly Player[]): PageOneState {
  const playerIndex = players.findIndex((player) => player.id === state.currentPlayerId);
  const nextPlayer = players[(playerIndex + 1) % Math.max(players.length, 1)]?.id ?? state.currentPlayerId;
  const hand = state.hands[state.currentPlayerId] ?? [];
  if (action.type === "play_card") {
    const card = hand.find((item) => item.id === action.cardId); if (!card) return state;
    const remaining = hand.filter((item) => item.id !== action.cardId); const finished = remaining.length === 0;
    return { ...state, hands: { ...state.hands, [state.currentPlayerId]: remaining }, field: [...state.field, card], currentPlayerId: finished || card.rank === "A" ? state.currentPlayerId : card.rank === "8" ? players[(playerIndex + 2) % players.length]?.id ?? nextPlayer : nextPlayer, finished, winnerId: finished ? state.currentPlayerId : null };
  }
  const [drawn, ...rest] = state.deck; if (!drawn) return { ...state, currentPlayerId: nextPlayer };
  const nextHand = [...hand, drawn]; const canPlay = drawn.suit === state.field[state.field.length - 1]?.suit || drawn.rank === state.field[state.field.length - 1]?.rank;
  if (canPlay) return reducePageOne({ ...state, deck: rest, hands: { ...state.hands, [state.currentPlayerId]: nextHand } }, { type: "play_card", cardId: drawn.id }, players);
  return { ...state, deck: rest, hands: { ...state.hands, [state.currentPlayerId]: nextHand }, currentPlayerId: nextPlayer };
}

export function publicPageOne(state: PageOneState, viewerId: string): unknown {
  return { field: state.field, myHand: state.hands[viewerId] ?? [], opponents: Object.entries(state.hands).filter(([id]) => id !== viewerId).map(([id, hand]) => ({ id, handCount: hand.length })), deckCount: state.deck.length, currentPlayerId: state.currentPlayerId, finished: state.finished, winnerId: state.winnerId };
}
