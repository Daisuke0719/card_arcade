/**
 * スピードのオンライン対戦。ルール本体は logic.ts をそのまま使い、
 * ここでは Action の検証、参加者ごとの公開状態、勝敗の結果だけを書く。
 *
 * 手番は無く、2人とも好きなときに Action を送る。サーバーにはタイマーが無いため、
 * 両者とも出せないときの台札の更新は refill_piles の Action で受け付ける。
 */
import { defineOnlineGame, rankByScore } from "@core";
import type { Player, PlayingCard } from "@core";
import {
  createInitialState,
  hasPlayableCard,
  playablePileIndex,
  reduce,
  refillPiles,
  remainingCount,
} from "./logic";
import type { Side, SpeedSide, SpeedState } from "./logic";

export type OnlineSpeedAction =
  | { readonly type: "play_card"; readonly cardId: string }
  | { readonly type: "refill_piles" };

export type OnlineSpeedState = {
  readonly game: SpeedState;
  /** [0] が logic.ts の you、[1] が cpu に対応する。 */
  readonly players: readonly [Player, Player];
};

/** 相手の手札と山札は枚数だけを公開する。seed は配りを再現できるため含めない。 */
export type SpeedView = {
  readonly myHand: readonly PlayingCard[];
  readonly myDeckCount: number;
  readonly opponent: {
    readonly id: string;
    readonly name: string;
    readonly handCount: number;
    readonly deckCount: number;
  };
  readonly piles: readonly [PlayingCard, PlayingCard];
  readonly playableIds: readonly string[];
  readonly canRefill: boolean;
  readonly phase: "playing" | "finished";
  /** 勝者の ID。引き分けは "draw"、決着前は null。 */
  readonly winnerId: string | null;
};

const MAX_CARD_ID_LENGTH = 20;

function sideOf(state: OnlineSpeedState, playerId: string): Side | null {
  if (state.players[0].id === playerId) return "you";
  if (state.players[1].id === playerId) return "cpu";
  return null;
}

function sideState(state: SpeedState, side: Side): SpeedSide {
  return side === "you" ? state.you : state.cpu;
}

function canRefill(game: SpeedState): boolean {
  return (
    game.phase === "playing" && !hasPlayableCard(game.you, game.piles) && !hasPlayableCard(game.cpu, game.piles)
  );
}

function winnerIdOf(state: OnlineSpeedState): string | null {
  const { winner } = state.game;
  if (winner === null) return null;
  if (winner === "draw") return "draw";
  return winner === "you" ? state.players[0].id : state.players[1].id;
}

export const onlineAdapter = defineOnlineGame<OnlineSpeedState, OnlineSpeedAction>({
  gameId: "speed",
  minPlayers: 2,
  maxPlayers: 2,
  // オンラインでは CPU は参加しない。参加者2人をそのまま陣営に割り当てる。
  createInitialState(seed, players) {
    if (players.length !== 2 || new Set(players.map((p) => p.id)).size !== 2) {
      throw new Error("2人の異なるプレイヤーが必要です");
    }
    return {
      game: createInitialState(seed),
      players: [players[0], players[1]],
    };
  },
  parseAction(value) {
    if (!value || typeof value !== "object") return null;
    const action = value as Record<string, unknown>;
    if (
      action.type === "play_card" &&
      typeof action.cardId === "string" &&
      action.cardId.length > 0 &&
      action.cardId.length <= MAX_CARD_ID_LENGTH
    ) {
      return { type: "play_card", cardId: action.cardId };
    }
    if (action.type === "refill_piles") return { type: "refill_piles" };
    return null;
  },
  validateAction(state, action, playerId) {
    if (state.game.phase === "finished") return { ok: false, reason: "試合は終了しています" };
    const side = sideOf(state, playerId);
    if (side === null) return { ok: false, reason: "この試合の参加者ではありません" };

    if (action.type === "play_card") {
      const card = sideState(state.game, side).hand.find((c) => c.id === action.cardId);
      if (!card) return { ok: false, reason: "そのカードは手札にありません" };
      if (playablePileIndex(card, state.game.piles) === null) {
        return { ok: false, reason: "そのカードは出せません" };
      }
      return { ok: true };
    }

    if (!canRefill(state.game)) return { ok: false, reason: "出せるカードがあるため台札は更新できません" };
    return { ok: true };
  },
  reduce(state, action, playerId) {
    if (action.type === "refill_piles") return { ...state, game: refillPiles(state.game) };
    const side = playerId === undefined ? null : sideOf(state, playerId);
    if (side === null) return state;
    return { ...state, game: reduce(state.game, { type: "play", side, cardId: action.cardId }) };
  },
  isFinished: (state) => state.game.phase === "finished",
  getResult(state) {
    const [first, second] = state.players;
    const ranking = rankByScore(
      [
        { id: first.id, name: first.name, score: remainingCount(state.game.you) },
        { id: second.id, name: second.name, score: remainingCount(state.game.cpu) },
      ],
      "lower-is-better",
    );
    const winnerId = winnerIdOf(state);
    const winner = state.players.find((p) => p.id === winnerId);
    return {
      outcome: "done",
      ranking,
      message: winner ? `${winner.name}の勝ち` : winnerId === "draw" ? "引き分け" : undefined,
    };
  },
  toPublicState(state, viewerId): SpeedView {
    // 参加者以外が見る場合は、1人目の視点で表示する。
    const side = sideOf(state, viewerId) ?? "you";
    const mine = sideState(state.game, side);
    const other = sideState(state.game, side === "you" ? "cpu" : "you");
    const opponentPlayer = state.players[side === "you" ? 1 : 0];
    return {
      myHand: mine.hand,
      myDeckCount: mine.deck.length,
      opponent: {
        id: opponentPlayer.id,
        name: opponentPlayer.name,
        handCount: other.hand.length,
        deckCount: other.deck.length,
      },
      piles: state.game.piles,
      playableIds:
        state.game.phase === "playing"
          ? mine.hand.filter((c) => playablePileIndex(c, state.game.piles) !== null).map((c) => c.id)
          : [],
      canRefill: canRefill(state.game),
      phase: state.game.phase,
      winnerId: winnerIdOf(state),
    };
  },
});
