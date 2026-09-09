/**
 * 神経衰弱 の画面。
 *
 * ここは「見た目」と「時間」だけを担当します。
 * ルールと勝敗の判定は logic.ts に書いてあります
 * （そうしておくと、テストが setTimeout を使わずに書けます）。
 *
 * お手本: src/games/example-game/ExampleGame.tsx
 */
import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { Card, GameShell, ResultModal, ScoreBoard } from "@ui";
import {
  createInitialState,
  isFaceUp,
  isGameOver,
  pendingDelayMs,
  reduce,
} from "./logic";
import styles from "./ShinkeisuijakuGame.module.css";

const newSeed = () => Math.floor(Math.random() * 100000);

export function ShinkeisuijakuGame({ manifest, onExit }: GameComponentProps) {
  // 乱数と時間は画面側で用意する。logic.ts には持ち込まない。
  const [state, dispatch] = useReducer(reduce, undefined, () => createInitialState(newSeed()));

  // 判定中の 800ms だけタイマーが動く。入力待ちの間は pendingDelayMs が null を返して止まる。
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const finished = isGameOver(state);
  const reset = () => dispatch({ type: "reset", seed: newSeed() });

  const hint =
    state.phase === "judging"
      ? "めくった2枚を確認しています…"
      : state.phase === "one-flipped"
        ? "もう1枚めくってください"
        : "同じ数字のカードを2枚めくってください";

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={reset}
      headerRight={<ScoreBoard entries={[{ id: "moves", name: "手数", detail: state.moves + "手" }]} title="成績" />}
    >
      <div className={styles.table}>
        <p className={styles.hint}>{hint}</p>

        <div className={styles.board}>
          {state.board.map((card, index) => {
            const faceUp = isFaceUp(state, index);
            return (
              <Card
                key={card.id}
                card={card}
                face={faceUp ? "up" : "down"}
                size="lg"
                onClick={faceUp ? undefined : () => dispatch({ type: "flip", index })}
              />
            );
          })}
        </div>
      </div>

      <ResultModal
        open={finished}
        title="クリア！"
        score={state.moves + " 手"}
        onRetry={reset}
        onExit={onExit}
      />
    </GameShell>
  );
}
