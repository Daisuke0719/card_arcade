/**
 * 神経衰弱 の画面。
 *
 * ここは「見た目」と「時間」だけを担当します。
 * ペアの判定や終了条件は logic.ts にあります。
 *
 * お手本: src/games/example-game/ExampleGame.tsx
 */
import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { Card, GameShell, ResultModal, ScoreBoard } from "@ui";
import { createInitialState, isFaceUp, isGameOver, pendingDelayMs, reduce } from "./logic";
import styles from "./ShinkeisuijakuGame.module.css";

const newSeed = () => Math.floor(Math.random() * 100000);

export function ShinkeisuijakuGame({ manifest, onExit }: GameComponentProps) {
  // 乱数と時間は画面側で用意する。logic.ts には持ち込まない。
  const [state, dispatch] = useReducer(reduce, undefined, () => createInitialState(newSeed()));

  // pendingDelayMs が数値を返している間だけタイマーが動く
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const finished = isGameOver(state);
  const restart = () => dispatch({ type: "reset", seed: newSeed() });

  const message = (() => {
    if (finished) return "全部そろいました";
    if (state.phase === "judging") return "判定中…";
    if (state.phase === "one-flipped") return "もう1枚めくってください";
    return "カードを2枚めくってください";
  })();

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={restart}
      headerRight={
        <ScoreBoard
          title="成績"
          entries={[
            { id: "moves", name: "手数", detail: `${state.moves}手`, isCurrent: !finished },
            {
              id: "pairs",
              name: "そろったペア",
              detail: `${state.matched.length / 2}組`,
            },
          ]}
        />
      }
    >
      <div className={styles.table}>
        <p className={styles.message}>{message}</p>

        <div className={styles.board}>
          {state.board.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              face={isFaceUp(state, index) ? "up" : "down"}
              highlighted={state.matched.includes(index)}
              onClick={() => dispatch({ type: "flip", index })}
            />
          ))}
        </div>
      </div>

      <ResultModal
        open={finished}
        title="クリア！"
        score={`${state.moves}手`}
        onRetry={restart}
        onExit={onExit}
      />
    </GameShell>
  );
}
