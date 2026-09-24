import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { DoubtScreen } from "./DoubtScreen";
import { HUMAN_ID, createInitialState, getRanking, pendingDelayMs, reduce, toPublicState } from "./logic";

/** CPU対戦。ローカルの状態を公開状態に変えて、オンライン版と同じ画面へ渡す。 */
export function DoubtGame({ manifest, onExit }: GameComponentProps) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 1_000_000)),
  );
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const view = toPublicState(state, HUMAN_ID);
  const reset = () => dispatch({ type: "reset" });

  return (
    <DoubtScreen
      // リセットで配り直したら、選択中のカードも含めて画面を作り直す。
      key={state.seed}
      manifest={manifest}
      onExit={onExit}
      view={view}
      canPlay={view.phase === "playing" && view.actorId === HUMAN_ID}
      canDecide={view.phase === "doubt-decision" && view.actorId === HUMAN_ID}
      onPlay={(cardIds) => dispatch({ type: "play", cardIds })}
      onDoubt={() => dispatch({ type: "doubt" })}
      onPass={() => dispatch({ type: "pass" })}
      onReset={reset}
      result={{ open: state.phase === "finished", ranking: getRanking(state), onRetry: reset }}
    />
  );
}
