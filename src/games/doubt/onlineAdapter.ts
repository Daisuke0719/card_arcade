/**
 * ダウトのオンライン対戦。ルール本体は logic.ts をそのまま使い、
 * ここでは Action の検証、参加者ごとの公開状態、時間経過による進行だけを書く。
 */
import { defineOnlineGame } from "@core";
import type { Player } from "@core";
import {
  MAX_PLAYERS,
  MAX_PLAY_CARDS,
  MIN_PLAYERS,
  REVEAL_DELAY_MS,
  applyPlayerAction,
  createStateForPlayers,
  finishRevealIfDone,
  getRanking,
  playProblem,
  toPublicState,
} from "./logic";
import type { DoubtState, DoubtView, PlayerAction } from "./logic";

export type OnlineDoubtAction = PlayerAction;
export type { DoubtView };

const MAX_CARD_ID_LENGTH = 20;

function isCardIdList(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= MAX_PLAY_CARDS
    && value.every((id) => typeof id === "string" && id.length <= MAX_CARD_ID_LENGTH);
}

export const onlineAdapter = defineOnlineGame<DoubtState, OnlineDoubtAction>({
  gameId: "doubt",
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,
  // オンラインでは CPU は参加しないので、全員を人間として扱う。
  createInitialState: (seed, players: readonly Player[]) =>
    createStateForPlayers(seed, players.map((player) => ({ ...player, kind: "human" as const }))),
  parseAction(value) {
    if (!value || typeof value !== "object") return null;
    const action = value as Record<string, unknown>;
    if (action.type === "play" && isCardIdList(action.cardIds)) return { type: "play", cardIds: [...action.cardIds] };
    if (action.type === "doubt" || action.type === "pass") return { type: action.type };
    return null;
  },
  validateAction(state, action, playerId) {
    if (state.phase === "finished") return { ok: false, reason: "試合は終了しています" };
    if (state.phase === "revealing") return { ok: false, reason: "ダウトの結果を表示しています" };
    if (action.type === "play") {
      if (state.phase !== "playing" || state.turn.currentId !== playerId) {
        return { ok: false, reason: "あなたの手番ではありません" };
      }
      const problem = playProblem(state.hands[playerId] ?? [], action.cardIds);
      return problem ? { ok: false, reason: problem } : { ok: true };
    }
    if (state.phase !== "doubt-decision" || state.deciderId !== playerId) {
      return { ok: false, reason: "いまはダウトを判断する番ではありません" };
    }
    return { ok: true };
  },
  reduce(state, action, playerId) {
    return playerId ? applyPlayerAction(state, playerId, action) : state;
  },
  isFinished: (state) => state.phase === "finished",
  getResult(state) {
    const ranking = getRanking(state);
    const winner = ranking[0];
    return { outcome: "done", ranking, message: winner ? `${winner.name}が1位` : undefined };
  },
  toPublicState: (state, viewerId): DoubtView => toPublicState(state, viewerId),
  pendingDelayMs: (state) => (state.phase === "revealing" ? REVEAL_DELAY_MS : null),
  tick: finishRevealIfDone,
});
