import { useCallback, useMemo, useReducer } from "react";
import type { GameResult, SessionAction, SessionState } from "../types";

export function initialSession(): SessionState {
  return { phase: "idle", result: null, round: 0 };
}

/**
 * どのゲームにも共通の「始まる・終わる・やり直す」だけを持つ状態機械。
 * ゲーム固有の状態はゲーム側の reducer が持つ。
 */
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "start":
      return { phase: "playing", result: null, round: state.round + 1 };
    case "finish":
      if (state.phase === "finished") return state;
      return { ...state, phase: "finished", result: action.result };
    case "reset":
      return { phase: "playing", result: null, round: state.round + 1 };
    default:
      return assertNever(action, "未知の SessionAction です");
  }
}

export function useGameSession(options: { autoStart?: boolean; onFinish?: (result: GameResult) => void } = {}) {
  const { autoStart = true, onFinish } = options;
  const [session, dispatch] = useReducer(
    sessionReducer,
    autoStart ? { phase: "playing", result: null, round: 1 } : initialSession(),
  );

  const start = useCallback(() => dispatch({ type: "start" }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);
  const finish = useCallback(
    (result: GameResult) => {
      dispatch({ type: "finish", result });
      onFinish?.(result);
    },
    [onFinish],
  );

  return useMemo(
    () => ({
      session,
      round: session.round,
      isPlaying: session.phase === "playing",
      isFinished: session.phase === "finished",
      result: session.result,
      start,
      finish,
      reset,
    }),
    [session, start, finish, reset],
  );
}

/**
 * switch の網羅漏れをコンパイル時に見つけるための関数。
 * case を1つ書き忘れると、ここで型エラーになる。
 */
export function assertNever(value: never, message = "到達しないはずの分岐です"): never {
  throw new Error(`[card-arcade] ${message}: ${JSON.stringify(value)}`);
}
