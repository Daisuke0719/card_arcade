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
import { GameShell, Hand, DeckPile, ResultModal, Card } from "@ui";
import {
  createInitialState,
  pendingDelayMs,
  reduce,
  playablePileIndex,
} from "./logic";
import styles from "./SpeedGame.module.css";

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
    <GameShell manifest={manifest} onExit={onExit} onReset={() => dispatch({ type: "reset" })}>
      <div className={styles.container}>
        <div className={styles.cpuArea}>
          <DeckPile label="CPU の山札" count={state.cpu.deck.length} />
          <Hand variant="hidden" count={state.cpu.hand.length} />
        </div>

        <div className={styles.center}>
          <div className={styles.piles}>
            <div className={styles.pileSlot}>
              <span className={styles.pileLabel}>左の台札</span>
              <Card card={state.piles[0]} face="up" size="lg" />
            </div>
            <div className={styles.pileSlot}>
              <span className={styles.pileLabel}>右の台札</span>
              <Card card={state.piles[1]} face="up" size="lg" />
            </div>
          </div>
        </div>

        <div className={styles.playerArea}>
          <DeckPile label="あなたの山札" count={state.you.deck.length} />
          <Hand
            cards={state.you.hand}
            highlightedIds={highlightedIds}
            onCardClick={(card) => dispatch({ type: "play", side: "you", cardId: card.id })}
          />
        </div>
      </div>

      <ResultModal
        open={isFinished}
        title={resultTitle}
        score={`${state.you.hand.length + state.you.deck.length} 対 ${state.cpu.hand.length + state.cpu.deck.length}`}
        ranking={ranking}
        onRetry={() => dispatch({ type: "reset" })}
        onExit={onExit}
      />
    </GameShell>
  );
}
