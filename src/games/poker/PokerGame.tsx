import { useReducer, useState } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { Button, DeckPile, GameShell, Hand, ResultModal, ScoreBoard } from "@ui";
import type { ScoreBoardEntry } from "@ui";
import { HAND_NAME_JA, createInitialState, getRanking, pendingDelayMs, reduce } from "./logic";
import styles from "./PokerGame.module.css";

export function PokerGame({ manifest, onExit }: GameComponentProps) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 1_000_000)),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const toggle = (id: string) => {
    if (state.phase !== "exchanging") return;
    setSelectedIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
  };
  const reset = () => {
    setSelectedIds([]);
    dispatch({ type: "reset" });
  };
  const values = state.values;
  const revealResults = state.phase === "finished";
  const scoreEntries: ScoreBoardEntry[] = [
    { id: "you", name: "あなた", detail: revealResults && values ? HAND_NAME_JA[values.you.rank] : "交換待ち" },
    { id: "cpu-1", name: "CPU 1", detail: revealResults && values ? HAND_NAME_JA[values["cpu-1"].rank] : "手札を伏せています" },
  ];
  const resultTitle = state.outcome === "draw" ? "引き分け" : state.outcome === "you" ? "あなたの勝ち" : "CPU 1 の勝ち";

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={reset}
      headerRight={<ScoreBoard entries={scoreEntries} title="役" />}
    >
      <div className={styles.table}>
        <section className={styles.seat} aria-label="CPU 1">
          <h2>CPU 1</h2>
          <Hand cards={state.hands["cpu-1"]} face={state.phase === "finished" ? "up" : "down"} label="CPU の手札" />
          {state.phase !== "exchanging" && <p>{state.exchanged["cpu-1"]}枚交換</p>}
        </section>
        <div className={styles.center}>
          <DeckPile count={state.deck.length} label="山札" size="md" />
          <p>{state.phase === "exchanging" ? "交換するカードを選んでください（0〜5枚）" : state.phase === "showdown" ? "役を判定しました" : "勝負終了"}</p>
        </div>
        <section className={styles.seat} aria-label="あなた">
          <h2>あなた</h2>
          <Hand
            cards={state.hands.you}
            face="up"
            selectedIds={selectedIds}
            onCardClick={card => toggle(card.id)}
            label="あなたの手札"
          />
          {state.phase !== "exchanging" && <p>{state.exchanged.you}枚交換</p>}
          <Button
            onClick={() => { dispatch({ type: "exchange", cardIds: selectedIds }); setSelectedIds([]); }}
            disabled={state.phase !== "exchanging"}
          >
            交換する（{selectedIds.length}枚）
          </Button>
        </section>
      </div>
      <ResultModal
        open={state.phase === "finished"}
        title={resultTitle}
        message={values ? `あなた: ${HAND_NAME_JA[values.you.rank]} / CPU 1: ${HAND_NAME_JA[values["cpu-1"].rank]}` : undefined}
        ranking={getRanking(state)}
        onRetry={reset}
        onExit={onExit}
      />
    </GameShell>
  );
}
