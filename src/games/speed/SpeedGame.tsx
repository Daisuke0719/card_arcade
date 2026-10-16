// @scaffold:untouched
/**
 * スピード の画面。
 *
 * ここは「見た目」と「時間」だけを担当します。
 * 勝ち負けの判断やルールは logic.ts に書いてください
 * （そうしておくと、テストが setTimeout を使わずに書けます）。
 *
 * お手本: src/games/example-game/ExampleGame.tsx
 */
import { useReducer } from "react";
import { useCpuTurn, rankByScore } from "@core";
import type { GameComponentProps } from "@core";
import {
  createInitialState,
  pendingDelayMs,
  reduce,
  playablePileIndex,
} from "./logic";
import { SpeedBoard } from "./SpeedBoard";

export function SpeedGame({ manifest, onExit }: GameComponentProps) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 100000)),
  );

  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const highlightedIds = state.you.hand
    .filter((card) => playablePileIndex(card, state.piles) !== null)
    .map((card) => card.id);

  const isFinished = state.phase === "finished";

  const ranking = rankByScore(
    [
      {
        id: "you",
        name: "あなた",
        score: state.you.hand.length + state.you.deck.length,
      },
      {
        id: "cpu",
        name: "CPU",
        score: state.cpu.hand.length + state.cpu.deck.length,
      },
    ],
    "lower-is-better",
  );

  const resultTitle =
    state.winner === "you" ? "あなたの勝ち！" : state.winner === "cpu" ? "CPU の勝ち" : "引き分け";

  return (
    <SpeedBoard
      manifest={manifest}
      onExit={onExit}
      onReset={() => dispatch({ type: "reset" })}
      opponentName="CPU"
      opponentDeckCount={state.cpu.deck.length}
      opponentHandCount={state.cpu.hand.length}
      piles={state.piles}
      myName="あなた"
      myDeckCount={state.you.deck.length}
      myHand={state.you.hand}
      highlightedIds={highlightedIds}
      onPlay={(cardId) => dispatch({ type: "play", side: "you", cardId })}
      finished={isFinished}
      resultTitle={resultTitle}
      resultScore={`${state.you.hand.length + state.you.deck.length} 対 ${state.cpu.hand.length + state.cpu.deck.length}`}
      ranking={ranking}
      onRetry={() => dispatch({ type: "reset" })}
    />
  );
}
