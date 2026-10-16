/**
 * ババ抜き の CPU対戦。
 *
 * ここは「状態」と「時間」だけを担当する。
 * ローカルの状態を公開状態に変えて、オンライン版と同じ BabanukiScreen へ渡す。
 * 勝ち負けの判断やルールは logic.ts にある
 * （そうしておくと、テストが setTimeout を使わずに書ける）。
 */
import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { BabanukiScreen } from "./BabanukiScreen";
import { createInitialState, getRanking, pendingDelayMs, reduce, toPublicState } from "./logic";

const HUMAN_ID = "you";

export function BabanukiGame({ manifest, onExit }: GameComponentProps) {
  // 乱数と時間は画面側で用意する。logic.ts には持ち込まない。
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 1_000_000)),
  );

  // pendingDelayMs が数値を返している間だけタイマーが動く
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const view = toPublicState(state, HUMAN_ID);
  const reset = () => dispatch({ type: "reset" });

  return (
    <BabanukiScreen
      manifest={manifest}
      onExit={onExit}
      view={view}
      canDraw={view.phase === "playing" && view.currentPlayerId === HUMAN_ID}
      onDraw={(index) => dispatch({ type: "draw", index })}
      onReset={reset}
      result={{ open: state.phase === "finished", ranking: getRanking(state), onRetry: reset }}
    />
  );
}
