import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { PokerScreen } from "./PokerScreen";
import { createInitialState, getRanking, pendingDelayMs, reduce, toCpuView } from "./logic";

/** CPU対戦。ローカルの状態を公開状態に変えて、オンライン版と同じ画面へ渡す。 */
export function PokerGame({ manifest, onExit }: GameComponentProps) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 1_000_000)),
  );
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const reset = () => dispatch({ type: "reset" });

  return (
    <PokerScreen
      // リセットで配り直したら、選択中のカードも含めて画面を作り直す。
      key={state.seed}
      manifest={manifest}
      onExit={onExit}
      view={toCpuView(state)}
      canExchange={state.phase === "exchanging"}
      onExchange={cardIds => dispatch({ type: "exchange", cardIds })}
      onReset={reset}
      result={{ open: state.phase === "finished", ranking: getRanking(state), onRetry: reset }}
    />
  );
}
