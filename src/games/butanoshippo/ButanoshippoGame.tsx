import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { Card, DeckPile, GameShell, ResultModal, ScoreBoard } from "@ui";
import type { ScoreBoardEntry } from "@ui";
import { createInitialState, getRanking, pendingDelayMs, reduce } from "./logic";
import styles from "./ButanoshippoGame.module.css";

export function ButanoshippoGame({ manifest, onExit }: GameComponentProps) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 1_000_000)),
  );

  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const scoreEntries: ScoreBoardEntry[] = state.turn.players.map((player) => ({
    id: player.id,
    name: player.name,
    detail: `${state.collected[player.id]}点`,
    isCurrent: state.phase !== "finished" && player.id === state.turn.currentId,
  }));
  const canFlip = state.phase === "playing" && state.turn.currentId === "you";

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={() => dispatch({ type: "reset" })}
      headerRight={<ScoreBoard title="引き取り枚数" entries={scoreEntries} />}
      footer={<p>数字は引き取った枚数です。</p>}
    >
      <main className={styles.game}>
        <section className={styles.ringSection} aria-label="カードの輪">
          <div className={styles.ringHeader}>
            <h2>カードの輪</h2>
            <p>残り {state.ring.length} 枚</p>
          </div>
          <div className={styles.ring}>
            {state.ring.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                face="down"
                size="sm"
                highlighted={index === 0}
                onClick={index === 0 && canFlip ? () => dispatch({ type: "flip" }) : undefined}
                disabled={index === 0 && !canFlip}
              />
            ))}
            {state.ring.length === 0 ? <p className={styles.empty}>輪のカードはありません</p> : null}
          </div>
          <p className={styles.hint}>
            {canFlip ? "光っている先頭のカードをめくってください。" :
              state.phase === "collecting" ? "同じ数字が続きました。場札を引き取ります。" :
                state.phase === "finished" ? "ゲーム終了" : `${state.turn.players.find((p) => p.id === state.turn.currentId)?.name} の手番です`}
          </p>
        </section>

        <section className={styles.field} aria-label="場札">
          <h2>場の中央</h2>
          <DeckPile
            count={state.pile.length}
            top={state.pile.at(-1)}
            face="up"
            label="場札"
            size="lg"
          />
          {state.lastCollectorId ? (
            <p>{state.turn.players.find((player) => player.id === state.lastCollectorId)?.name} が引き取りました</p>
          ) : null}
        </section>
      </main>

      <ResultModal
        open={state.phase === "finished"}
        title="結果"
        ranking={getRanking(state)}
        onRetry={() => dispatch({ type: "reset" })}
        onExit={onExit}
      />
    </GameShell>
  );
}
