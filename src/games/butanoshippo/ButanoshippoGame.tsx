import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import type { ScoreBoardEntry } from "@ui";
import { ButanoshippoBoard } from "./ButanoshippoBoard";
import { createInitialState, getRanking, pendingDelayMs, reduce } from "./logic";

export function ButanoshippoGame({ manifest, onExit }: GameComponentProps) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 1_000_000)),
  );

  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const nameOf = (id: string | null) => state.turn.players.find((player) => player.id === id)?.name ?? "";
  const entries: ScoreBoardEntry[] = state.turn.players.map((player) => ({
    id: player.id,
    name: player.name,
    detail: `${state.collected[player.id]}点`,
    isCurrent: state.phase !== "finished" && player.id === state.turn.currentId,
  }));
  const canFlip = state.phase === "playing" && state.turn.currentId === "you";
  const hint = canFlip
    ? "光っている先頭のカードをめくってください。"
    : state.phase === "collecting"
      ? "同じ数字が続きました。場札を引き取ります。"
      : state.phase === "finished"
        ? "ゲーム終了"
        : `${nameOf(state.turn.currentId)} の手番です`;

  return (
    <ButanoshippoBoard
      manifest={manifest}
      onExit={onExit}
      onReset={() => dispatch({ type: "reset" })}
      entries={entries}
      ringCount={state.ring.length}
      pileCount={state.pile.length}
      pileTop={state.pile.at(-1)}
      canFlip={canFlip}
      onFlip={() => dispatch({ type: "flip" })}
      hint={hint}
      collectorName={state.lastCollectorId ? nameOf(state.lastCollectorId) : null}
      finished={state.phase === "finished"}
      ranking={getRanking(state)}
      onRetry={() => dispatch({ type: "reset" })}
    />
  );
}
