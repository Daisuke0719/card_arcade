/**
 * ババ抜きのオンライン対戦。ルール本体は logic.ts をそのまま使い、
 * ここでは Action の検証、参加者ごとの公開状態、時間経過による進行だけを書く。
 */
import { defineOnlineGame } from "@core";
import type { Player } from "@core";
import {
  createStateForPlayers,
  getRanking,
  nextAlivePlayer,
  pendingDelayMs,
  reduce,
  toPublicState,
} from "./logic";
import type { BabanukiState, BabanukiView } from "./logic";

/** クライアントから送れる Action。引く位置は相手の手札の位置（0始まり）で送る。 */
export type OnlineBabanukiAction = { readonly type: "draw"; readonly index: number };
export type { BabanukiView };

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

/** 53枚を2人で分けても手札は27枚まで。それより大きい位置は形式の段階で拒否する。 */
const MAX_DRAW_INDEX = 52;

export const onlineAdapter = defineOnlineGame<BabanukiState, OnlineBabanukiAction>({
  gameId: "babanuki",
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,
  createInitialState(seed, players: readonly Player[]) {
    const ids = new Set(players.map((player) => player.id));
    if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS || ids.size !== players.length) {
      throw new Error("2〜4人の異なるプレイヤーが必要です");
    }
    // オンラインでは CPU は参加しないので、全員を人間として扱う。
    return createStateForPlayers(seed, players.map((player) => ({ ...player, kind: "human" as const })));
  },
  parseAction(value) {
    if (!value || typeof value !== "object") return null;
    const action = value as Record<string, unknown>;
    if (action.type !== "draw") return null;
    const { index } = action;
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index > MAX_DRAW_INDEX) return null;
    return { type: "draw", index };
  },
  validateAction(state, action, playerId) {
    if (state.phase === "finished") return { ok: false, reason: "試合は終了しています" };
    if (state.phase === "revealing") return { ok: false, reason: "引いたカードを確認しています" };
    if (state.turn.currentId !== playerId) return { ok: false, reason: "あなたの手番ではありません" };
    const targetId = nextAlivePlayer(state);
    const targetCount = targetId ? (state.hands[targetId]?.length ?? 0) : 0;
    if (action.index >= targetCount) return { ok: false, reason: "その位置にはカードがありません" };
    return { ok: true };
  },
  reduce(state, action, playerId) {
    // 検証を通さずに呼ばれても、手番の人以外の操作では状態を変えない。
    if (playerId !== state.turn.currentId) return state;
    return reduce(state, action);
  },
  isFinished: (state) => state.phase === "finished",
  getResult(state) {
    const ranking = getRanking(state);
    const winner = ranking[0];
    return { outcome: "done", ranking, message: winner ? `${winner.name}が1位` : undefined };
  },
  toPublicState: (state, viewerId): BabanukiView => toPublicState(state, viewerId),
  // 引いたカードを見せている間だけ待つ。CPU がいないので、それ以外は待たない。
  pendingDelayMs,
  tick: (state) => reduce(state, { type: "tick" }),
});
