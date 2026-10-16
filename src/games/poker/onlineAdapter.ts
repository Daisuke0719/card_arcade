/**
 * ポーカーのオンライン対戦。役判定と比較、交換は logic.ts をそのまま使い、
 * ここでは Action の検証、2人分の交換の進行、参加者ごとの公開状態だけを書く。
 */
import { createDeck, createRng, deal, defineOnlineGame, shuffle } from "@core";
import type { CardId, Player, PlayerId, PlayingCard, Ranking } from "@core";
import { HAND_NAME_JA, compareHands, evaluateHand, replaceCards } from "./logic";
import type { HandValue, PokerSeatView, PokerView } from "./logic";

export const ONLINE_PLAYERS = 2;
const HAND_SIZE = 5;
const MAX_CARD_ID_LENGTH = 20;

export type OnlinePokerAction = { readonly type: "exchange"; readonly cardIds: readonly CardId[] };
export type { PokerView };

export type OnlinePokerState = {
  readonly players: readonly { readonly id: PlayerId; readonly name: string }[];
  readonly deck: readonly PlayingCard[];
  readonly hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>;
  /** 交換した枚数。まだ交換していない人は null。 */
  readonly exchanged: Readonly<Record<PlayerId, number | null>>;
  readonly phase: "exchanging" | "finished";
  /** 2人とも交換を終えたあとの役。それまでは null。 */
  readonly values: Readonly<Record<PlayerId, HandValue>> | null;
  /** 勝った人。決着前と引き分けでは null。 */
  readonly winnerId: PlayerId | null;
  readonly seed: number;
};

function createState(seed: number, players: readonly Player[]): OnlinePokerState {
  if (players.length !== ONLINE_PLAYERS || new Set(players.map(player => player.id)).size !== ONLINE_PLAYERS) {
    throw new Error("2人の異なるプレイヤーが必要です");
  }
  const { hands, rest } = deal(shuffle(createDeck(), createRng(seed)), ONLINE_PLAYERS, HAND_SIZE);
  return {
    players: players.map(player => ({ id: player.id, name: player.name })),
    deck: rest,
    hands: Object.fromEntries(players.map((player, index) => [player.id, hands[index]])),
    exchanged: Object.fromEntries(players.map(player => [player.id, null])),
    phase: "exchanging",
    values: null,
    winnerId: null,
    seed,
  };
}

function exchangeProblem(state: OnlinePokerState, cardIds: readonly CardId[], playerId: PlayerId): string | null {
  if (state.phase === "finished") return "試合は終了しています";
  if (!state.players.some(player => player.id === playerId)) return "この試合の参加者ではありません";
  if (state.exchanged[playerId] !== null) return "交換は1回だけです";
  if (new Set(cardIds).size !== cardIds.length) return "同じカードが重複しています";
  const hand = state.hands[playerId];
  if (!cardIds.every(id => hand.some(card => card.id === id))) return "手札にないカードは交換できません";
  return null;
}

/** 2人とも交換を終えていれば役を比べて試合を終える。 */
function finishIfAllExchanged(state: OnlinePokerState): OnlinePokerState {
  if (state.players.some(player => state.exchanged[player.id] === null)) return state;
  const [first, second] = state.players;
  const values = {
    [first.id]: evaluateHand(state.hands[first.id]),
    [second.id]: evaluateHand(state.hands[second.id]),
  };
  const comparison = compareHands(values[first.id], values[second.id]);
  const winnerId = comparison > 0 ? first.id : comparison < 0 ? second.id : null;
  return { ...state, phase: "finished", values, winnerId };
}

function applyExchange(state: OnlinePokerState, cardIds: readonly CardId[], playerId: PlayerId): OnlinePokerState {
  if (exchangeProblem(state, cardIds, playerId)) return state;
  const next = replaceCards(state.hands[playerId], state.deck, cardIds);
  return finishIfAllExchanged({
    ...state,
    deck: next.deck,
    hands: { ...state.hands, [playerId]: next.hand },
    exchanged: { ...state.exchanged, [playerId]: next.discarded },
  });
}

export function getOnlineRanking(state: OnlinePokerState): Ranking {
  if (state.phase !== "finished" || !state.values) return [];
  const values = state.values;
  const rankOf = (id: PlayerId) => (state.winnerId === null || state.winnerId === id ? 1 : 2);
  return [...state.players]
    .sort((a, b) => rankOf(a.id) - rankOf(b.id))
    .map(player => ({ rank: rankOf(player.id), name: player.name, detail: HAND_NAME_JA[values[player.id].rank] }));
}

/** viewerId に見せてよい情報だけを集める。相手の手札は決着まで含めない。 */
export function toOnlineView(state: OnlinePokerState, viewerId: PlayerId): PokerView {
  const finished = state.phase === "finished";
  const seat = (id: PlayerId, name: string): PokerSeatView => ({
    id,
    name,
    cards: finished || id === viewerId ? state.hands[id] : null,
    cardCount: state.hands[id].length,
    exchangedCount: state.exchanged[id],
    handRank: finished && state.values ? state.values[id].rank : null,
  });
  // 参加者でない閲覧者には、席順の1人目を自分の席として見せ、手札は伏せる。
  const me = state.players.find(player => player.id === viewerId) ?? state.players[0];
  const opponent = state.players.find(player => player.id !== me.id)!;
  return {
    phase: state.phase,
    me: seat(me.id, me.name),
    opponent: seat(opponent.id, opponent.name),
    deckCount: state.deck.length,
    winnerId: state.winnerId,
  };
}

function isCardIdList(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= HAND_SIZE
    && value.every(id => typeof id === "string" && id.length <= MAX_CARD_ID_LENGTH);
}

export const onlineAdapter = defineOnlineGame<OnlinePokerState, OnlinePokerAction>({
  gameId: "poker",
  minPlayers: ONLINE_PLAYERS,
  maxPlayers: ONLINE_PLAYERS,
  // オンラインでは CPU は参加しないので、渡された参加者を全員人間として扱う。
  createInitialState: createState,
  parseAction(value) {
    if (!value || typeof value !== "object") return null;
    const action = value as Record<string, unknown>;
    if (action.type === "exchange" && isCardIdList(action.cardIds)) return { type: "exchange", cardIds: [...action.cardIds] };
    return null;
  },
  validateAction(state, action, playerId) {
    const problem = exchangeProblem(state, action.cardIds, playerId);
    return problem ? { ok: false, reason: problem } : { ok: true };
  },
  reduce(state, action, playerId) {
    return playerId ? applyExchange(state, action.cardIds, playerId) : state;
  },
  isFinished: state => state.phase === "finished",
  getResult(state) {
    const ranking = getOnlineRanking(state);
    if (state.phase !== "finished") return { outcome: "done", ranking };
    const winner = state.players.find(player => player.id === state.winnerId);
    return { outcome: "done", ranking, message: winner ? `${winner.name}の勝ち` : "引き分け" };
  },
  toPublicState: (state, viewerId): PokerView => toOnlineView(state, viewerId),
});
