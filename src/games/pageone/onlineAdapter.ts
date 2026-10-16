import { createDeck, createRng, shuffle, deal, draw, createTurnState, defineOnlineGame } from '@core';
import type { Player, PlayingCard } from '@core';
import { applyPlay, drawFromDeck, fieldTop, getRanking, handOf, legalMoves, type PageOneState } from './logic';

export type OnlinePageOneAction =
  | { readonly type: 'play_card'; readonly cardId: string }
  | { readonly type: 'draw_card' }
  | { readonly type: 'call_page_one' };
export type OnlinePageOneState = PageOneState & { readonly declared: readonly string[] };
export type PageOneView = {
  readonly myHand: readonly PlayingCard[];
  readonly field: readonly PlayingCard[];
  readonly opponents: readonly { id: string; name: string; handCount: number }[];
  readonly deckCount: number;
  readonly currentPlayerId: string;
  readonly phase: 'playing' | 'finished';
  readonly winnerId: string | null;
  readonly canDraw: boolean;
  readonly canDeclare: boolean;
  readonly playableIds: readonly string[];
  readonly log: readonly string[];
};

function initial(seed: number, players: readonly Player[]): OnlinePageOneState {
  if (players.length < 2 || players.length > 4 || new Set(players.map(p => p.id)).size !== players.length) throw new Error('2〜4人の異なるプレイヤーが必要です');
  const { hands, rest } = deal(shuffle(createDeck(), createRng(seed)), players.length, 5);
  const { card, rest: deck } = draw(rest);
  return { deck, field: [card!], hands: Object.fromEntries(players.map((p, i) => [p.id, hands[i]])), turn: createTurnState(players), phase: 'playing', winnerId: null, log: [], drawCount: 0, seed, declared: [] };
}

export const onlineAdapter = defineOnlineGame<OnlinePageOneState, OnlinePageOneAction>({
  gameId: 'pageone', minPlayers: 2, maxPlayers: 4,
  createInitialState: initial,
  parseAction(value) {
    if (!value || typeof value !== 'object') return null;
    const a = value as Record<string, unknown>;
    if (a.type === 'play_card' && typeof a.cardId === 'string' && a.cardId.length <= 20) return { type: a.type, cardId: a.cardId };
    if (a.type === 'draw_card' || a.type === 'call_page_one') return { type: a.type };
    return null;
  },
  validateAction(state, action, playerId) {
    if (state.phase !== 'playing') return { ok: false, reason: '試合は終了しています' };
    if (state.turn.currentId !== playerId) return { ok: false, reason: 'あなたの手番ではありません' };
    const hand = handOf(state, playerId);
    const moves = legalMoves(hand, fieldTop(state));
    if (action.type === 'play_card' && !moves.some(c => c.id === action.cardId)) return { ok: false, reason: 'そのカードは出せません' };
    if (action.type === 'draw_card' && moves.length) return { ok: false, reason: '出せるカードがあります' };
    if (action.type === 'call_page_one' && (hand.length !== 1 || state.declared.includes(playerId))) return { ok: false, reason: '残り1枚のとき一度だけ宣言できます' };
    return { ok: true };
  },
  reduce(state, action) {
    const actor = state.turn.currentId;
    if (action.type === 'call_page_one') return { ...state, declared: [...state.declared, actor], log: [`${state.turn.players.find(p => p.id === actor)?.name}がページワンを宣言しました`, ...state.log].slice(0, 30) };
    const next = action.type === 'play_card'
      ? applyPlay(state, actor, handOf(state, actor).find(c => c.id === action.cardId)!)
      : drawFromDeck(state, actor);
    return { ...next, log: next.log.slice(0, 30), declared: state.declared.filter(id => handOf(next, id).length === 1) };
  },
  isFinished: state => state.phase === 'finished',
  getResult: state => ({ outcome: 'done', ranking: getRanking(state), message: state.winnerId ? `${state.turn.players.find(p => p.id === state.winnerId)?.name}の勝ち` : undefined }),
  toPublicState(state, viewerId): PageOneView {
    const mine = state.turn.currentId === viewerId && state.phase === 'playing';
    const moves = mine ? legalMoves(handOf(state, viewerId), fieldTop(state)) : [];
    return {
      myHand: handOf(state, viewerId), field: state.field, deckCount: state.deck.length,
      opponents: state.turn.players.filter(p => p.id !== viewerId).map(p => ({ id: p.id, name: p.name, handCount: handOf(state, p.id).length })),
      currentPlayerId: state.turn.currentId, phase: state.phase, winnerId: state.winnerId,
      canDraw: mine && moves.length === 0, canDeclare: mine && handOf(state, viewerId).length === 1 && !state.declared.includes(viewerId),
      playableIds: moves.map(c => c.id), log: state.log,
    };
  },
});
