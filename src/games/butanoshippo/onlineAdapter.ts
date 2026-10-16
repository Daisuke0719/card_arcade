import { defineOnlineGame } from "@core";
import type { PlayerId, PlayingCard } from "@core";
import {
  COLLECT_DELAY_MS,
  collectPile,
  createGameState,
  flipNext,
  getRanking,
  type ButanoshippoState,
  type Phase,
} from "./logic";

export type OnlineButanoshippoAction = { readonly type: "flip" };

/** 閲覧者に見せてよい情報だけ。輪のカードの中身と順序、seed は含めない。 */
export type ButanoshippoView = {
  readonly ringCount: number;
  readonly pileCount: number;
  /** めくられて公開済みの、場札の一番上。 */
  readonly pileTop: PlayingCard | null;
  readonly players: readonly { readonly id: PlayerId; readonly name: string; readonly collected: number }[];
  readonly currentPlayerId: PlayerId;
  readonly phase: Phase;
  readonly lastCollectorId: PlayerId | null;
  /** 閲覧者本人が、いまカードをめくれるか。 */
  readonly canFlip: boolean;
};

export const onlineAdapter = defineOnlineGame<ButanoshippoState, OnlineButanoshippoAction>({
  gameId: "butanoshippo",
  minPlayers: 2,
  maxPlayers: 4,
  createInitialState(seed, players) {
    if (players.length < 2 || players.length > 4 || new Set(players.map((p) => p.id)).size !== players.length) {
      throw new Error("2〜4人の異なるプレイヤーが必要です");
    }
    return createGameState(seed, players);
  },
  parseAction(value) {
    if (!value || typeof value !== "object") return null;
    return (value as Record<string, unknown>).type === "flip" ? { type: "flip" } : null;
  },
  validateAction(state, _action, playerId) {
    if (state.phase === "finished") return { ok: false, reason: "試合は終了しています" };
    if (state.phase === "collecting") return { ok: false, reason: "引き取り中です" };
    if (state.turn.currentId !== playerId) return { ok: false, reason: "あなたの手番ではありません" };
    if (state.ring.length === 0) return { ok: false, reason: "輪のカードがありません" };
    return { ok: true };
  },
  reduce: (state) => flipNext(state),
  isFinished: (state) => state.phase === "finished",
  getResult: (state) => ({ outcome: "done", ranking: getRanking(state) }),
  // 一致した札を見せてから引き取る。CPU の待ち時間はオンラインでは使わない。
  pendingDelayMs: (state) => (state.phase === "collecting" ? COLLECT_DELAY_MS : null),
  tick: (state) => collectPile(state),
  toPublicState(state, viewerId): ButanoshippoView {
    return {
      ringCount: state.ring.length,
      pileCount: state.pile.length,
      pileTop: state.pile.at(-1) ?? null,
      players: state.turn.players.map((p) => ({ id: p.id, name: p.name, collected: state.collected[p.id] })),
      currentPlayerId: state.turn.currentId,
      phase: state.phase,
      lastCollectorId: state.lastCollectorId,
      canFlip: state.phase === "playing" && state.turn.currentId === viewerId,
    };
  },
});
