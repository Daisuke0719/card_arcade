import { useReducer } from "react";
import { rankByScore, useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { Button, Card, DeckPile, GameShell, ResultModal, ScoreBoard } from "@ui";
import {
  TOTAL_ROUNDS,
  createInitialState,
  judge,
  pendingDelayMs,
  reduce,
} from "./logic";
import styles from "./ExampleGame.module.css";

const guessLabel = { high: "HIGH", low: "LOW" } as const;

/**
 * お手本ゲーム: ハイ＆ロー（CPU 対戦・10ラウンド）。
 *
 * この1本に、6ゲームすべてで使う型が入っている。
 *   - ルール判定は logic.ts の純粋関数（React も時間も出てこない）
 *   - 時間は useCpuTurn(pendingDelayMs(state), ...) の1行だけ
 *   - CPU の判断は cpu.ts（確率を返す純粋関数 + 乱数と比べる薄い層）
 *   - 画面は @ui の共通コンポーネントだけで組む
 */
export function ExampleGame({ manifest, onExit }: GameComponentProps) {
  // 乱数と時間は UI 側で作る。logic.ts には持ち込まない。
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 100000)),
  );

  // 判定待ちの間だけタイマーが動く。入力待ちのときは pendingDelayMs が null を返すので止まる。
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const isRevealing = state.phase === "revealing";
  const isFinished = state.phase === "finished";
  const answer = state.next ? judge(state.current, state.next) : null;

  const message = (() => {
    if (!isRevealing || !answer) return "次のカードは高い？ 低い？";
    if (answer === "draw") return "同じ数字なので引き分けです";
    return state.humanGuess === answer ? "当たり！" : "はずれ…";
  })();

  const scoreEntries = [
    { id: "you", name: "あなた", detail: state.humanScore + "点", isCurrent: !isFinished },
    { id: "cpu", name: "CPU", detail: state.cpuScore + "点" },
  ];

  const ranking = rankByScore([
    { id: "you", name: "あなた", score: state.humanScore },
    { id: "cpu", name: "CPU", score: state.cpuScore },
  ]);

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={() => dispatch({ type: "reset" })}
      headerRight={<ScoreBoard entries={scoreEntries} title="スコア" />}
    >
      <div className={styles.table}>
        <p className={styles.round}>
          ROUND {Math.min(state.round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
        </p>

        <div className={styles.cards}>
          <div className={styles.slot}>
            <span className={styles.slotLabel}>いまのカード</span>
            <Card card={state.current} face="up" size="lg" />
          </div>

          <span className={styles.arrow} aria-hidden="true">
            →
          </span>

          <div className={styles.slot}>
            <span className={styles.slotLabel}>次のカード</span>
            {state.next ? (
              <Card card={state.next} face="up" size="lg" />
            ) : (
              <DeckPile count={state.deck.length} label="" size="lg" />
            )}
          </div>
        </div>

        <p className={styles.message + " " + (answer && state.humanGuess === answer ? styles.hit : styles.miss)}>
          {message}
        </p>

        {isRevealing && state.humanGuess && state.cpuGuess ? (
          <div className={styles.guesses}>
            <span>あなた: {guessLabel[state.humanGuess]}</span>
            <span>CPU: {guessLabel[state.cpuGuess]}</span>
          </div>
        ) : null}

        <div className={styles.actions}>
          <Button
            size="lg"
            onClick={() => dispatch({ type: "guess", guess: "high" })}
            disabled={state.phase !== "guessing"}
          >
            HIGH ↑
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => dispatch({ type: "guess", guess: "low" })}
            disabled={state.phase !== "guessing"}
          >
            LOW ↓
          </Button>
        </div>
      </div>

      <ResultModal
        open={isFinished}
        title={
          state.humanScore > state.cpuScore
            ? "あなたの勝ち！"
            : state.humanScore < state.cpuScore
              ? "CPU の勝ち"
              : "引き分け"
        }
        score={state.humanScore + " 対 " + state.cpuScore}
        ranking={ranking}
        onRetry={() => dispatch({ type: "reset" })}
        onExit={onExit}
      />
    </GameShell>
  );
}
