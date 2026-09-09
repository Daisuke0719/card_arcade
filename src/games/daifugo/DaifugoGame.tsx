import { useReducer, useState } from "react";
import { isCurrent, isFinished, rankByFinishOrder, useCpuTurn } from "@core";
import type { GameComponentProps, PlayingCard } from "@core";
import { Button, DeckPile, GameShell, Hand, LogPanel, ResultModal, ScoreBoard } from "@ui";
import {
  TITLES,
  createInitialState,
  isLegalPlay,
  pendingDelayMs,
  reduce,
} from "./logic";
import styles from "./DaifugoGame.module.css";

export function DaifugoGame({ manifest, onExit }: GameComponentProps) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 100000)),
  );
  const [selected, setSelected] = useState<string[]>([]);

  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const isPlayerTurn = state.turn.currentId === "you" && state.phase === "playing";

  const selectedCards = selected
    .map(id => state.hands["you"].find(c => c.id === id))
    .filter((c): c is PlayingCard => c !== undefined);

  const canPlay = isPlayerTurn && isLegalPlay(selectedCards, state.field, state.isRevolution);
  const canPass = isPlayerTurn;

  const toggle = (id: string) => {
    if (!isPlayerTurn) return;
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleReset = () => {
    setSelected([]);
    dispatch({ type: "reset" });
  };

  const players = state.turn.players;
  const cpus = players.filter(p => p.id !== "you");

  const scoreEntries = players.map(p => {
    const finishIndex = state.turn.finishedIds.indexOf(p.id);
    return {
      id: p.id,
      name: p.name,
      detail: `${state.hands[p.id].length}枚`,
      isCurrent: isCurrent(state.turn, p.id),
      isFinished: isFinished(state.turn, p.id),
      rankLabel: finishIndex >= 0 ? TITLES[finishIndex] : undefined,
    };
  });

  const ranking = rankByFinishOrder(
    state.turn.finishedIds,
    players,
    p => {
      const idx = state.turn.finishedIds.indexOf(p.id);
      return idx >= 0 ? TITLES[idx] : TITLES[3];
    },
  );

  const youFinishIndex = state.turn.finishedIds.indexOf("you");
  const resultTitle =
    youFinishIndex === 0
      ? "大富豪！おめでとう"
      : youFinishIndex === 1
        ? "富豪でゴール"
        : youFinishIndex === 2
          ? "貧民でゴール"
          : "大貧民…";

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={handleReset}
      headerRight={<ScoreBoard entries={scoreEntries} title="残り枚数" />}
    >
      <div className={styles.table}>
        {/* CPU の手札（枚数だけ表示） */}
        <div className={styles.cpuRow}>
          {cpus.map(p => (
            <div key={p.id} className={styles.cpuSlot}>
              <span
                className={`${styles.playerLabel} ${isCurrent(state.turn, p.id) ? styles.currentLabel : ""}`}
              >
                {p.name}
                {isCurrent(state.turn, p.id) ? " ▶" : ""}
              </span>
              <Hand variant="hidden" count={state.hands[p.id].length} />
            </div>
          ))}
        </div>

        {/* 場札 */}
        <div className={styles.fieldRow}>
          {state.isRevolution && <span className={styles.revolution}>革命中</span>}
          <span className={styles.fieldLabel}>場</span>
          {state.field ? (
            <DeckPile top={state.field.cards[0] as PlayingCard} count={state.field.count} face="up" />
          ) : (
            <DeckPile count={0} label="場なし" />
          )}
        </div>

        {/* プレイヤーの手札 */}
        <div className={styles.playerSection}>
          <span
            className={`${styles.playerLabel} ${isPlayerTurn ? styles.currentLabel : ""}`}
          >
            あなたの手札
            {isPlayerTurn ? " ▶" : ""}
          </span>
          <Hand
            cards={state.hands["you"] as PlayingCard[]}
            selectedIds={selected}
            onCardClick={c => toggle(c.id)}
          />
          <div className={styles.actions}>
            <Button
              onClick={() => {
                dispatch({ type: "play", cardIds: selected });
                setSelected([]);
              }}
              disabled={!canPlay}
            >
              出す
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: "pass" })}
              disabled={!canPass}
            >
              パス
            </Button>
          </div>
        </div>

        <LogPanel entries={state.log} title="進行ログ" />
      </div>

      <ResultModal
        open={state.phase === "finished"}
        title={resultTitle}
        ranking={ranking}
        onRetry={handleReset}
        onExit={onExit}
      />
    </GameShell>
  );
}
