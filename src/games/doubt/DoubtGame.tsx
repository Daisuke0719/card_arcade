import { useReducer, useState } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { Button, Card, DeckPile, GameShell, Hand, LogPanel, ResultModal, ScoreBoard } from "@ui";
import type { ScoreBoardEntry } from "@ui";
import {
  HUMAN_ID,
  MAX_PLAY_CARDS,
  createInitialState,
  currentPlayerName,
  getRanking,
  pendingDelayMs,
  reduce,
} from "./logic";
import type { DoubtState } from "./logic";
import styles from "./DoubtGame.module.css";

/** 今が誰の番で、何を待っているかを表す一文。 */
function statusText(state: DoubtState): string {
  if (state.phase === "playing") return `${currentPlayerName(state, state.turn.currentId)} の手番`;
  if (state.phase === "doubt-decision" && state.deciderId) {
    return `${currentPlayerName(state, state.deciderId)} はダウトしますか？`;
  }
  if (state.phase === "revealing") return "ダウトの結果";
  return "ゲーム終了";
}

/** 手札の選択を切り替える。上限まで選んでいるときは新しい選択を無視する。 */
function nextSelection(current: string[], cardId: string): string[] {
  if (current.includes(cardId)) return current.filter((id) => id !== cardId);
  return current.length < MAX_PLAY_CARDS ? [...current, cardId] : current;
}

/** 各プレイヤーの残り枚数と、今誰が判断しているかを ScoreBoard 用に整える。 */
function toScoreEntries(state: DoubtState): ScoreBoardEntry[] {
  return state.turn.players.map((player) => {
    const finishedIndex = state.turn.finishedIds.indexOf(player.id);
    const isCurrent = state.phase === "doubt-decision"
      ? state.deciderId === player.id
      : state.turn.currentId === player.id;
    return {
      id: player.id,
      name: player.name,
      detail: `残り${state.hands[player.id]?.length ?? 0}枚`,
      isCurrent,
      isFinished: finishedIndex >= 0,
      rankLabel: finishedIndex >= 0 ? `${finishedIndex + 1}位` : undefined,
    };
  });
}

/** ダウトの結果と、公開された直前の組を表示する。 */
function RevealPanel({ state }: { state: DoubtState }) {
  if (state.phase !== "revealing" || !state.lastPlay) return null;
  const doubter = state.doubterId ? `${currentPlayerName(state, state.doubterId)} がダウトしました。` : "";
  const taker = state.takerId ? `${currentPlayerName(state, state.takerId)} が場札を引き取りました。` : "";
  return (
    <div className={styles.reveal} aria-live="polite">
      <p>{doubter}{taker}</p>
      <div>
        {state.lastPlay.cards.map((card) => <Card key={card.id} card={card} face="up" size="sm" />)}
      </div>
    </div>
  );
}

export function DoubtGame({ manifest, onExit }: GameComponentProps) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 1_000_000)),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const canPlay = state.phase === "playing" && state.turn.currentId === HUMAN_ID;
  const isYourDecision = state.phase === "doubt-decision" && state.deciderId === HUMAN_ID;
  const toggleCard = (cardId: string) => {
    setSelectedIds((current) => nextSelection(current, cardId));
  };
  const playSelected = () => {
    dispatch({ type: "play", cardIds: selectedIds });
    setSelectedIds([]);
  };
  const yourHand = state.hands[HUMAN_ID] ?? [];
  const entries: ScoreBoardEntry[] = toScoreEntries(state);

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={() => { setSelectedIds([]); dispatch({ type: "reset" }); }}
      headerRight={<ScoreBoard entries={entries} title="手番 / 残り枚数" />}
    >
      <main className={styles.table}>
        <div className={styles.status}>
          <p className={styles.rank}>宣言ランク <strong>{state.declaredRank}</strong></p>
          <p>{statusText(state)}</p>
        </div>

        <div className={styles.piles}>
          <DeckPile count={state.pile.length} label="場札（裏向き）" placeholder="場" />
          {state.lastPlay ? (
            <div className={styles.lastPlay}>
              <span>{currentPlayerName(state, state.lastPlay.playerId)} が {state.lastPlay.cards.length} 枚出しました</span>
              {state.phase === "revealing" ? <span>公開されたカード</span> : null}
            </div>
          ) : null}
        </div>

        <div className={styles.opponents}>
          {state.turn.players.filter((player) => player.id !== HUMAN_ID).map((player) => (
            <Hand key={player.id} variant="hidden" count={state.hands[player.id]?.length ?? 0} label={player.name} />
          ))}
        </div>

        <Hand
          cards={yourHand}
          label="あなたの手札（1〜4枚を選択）"
          selectedIds={selectedIds}
          disabledIds={canPlay ? [] : yourHand.map((card) => card.id)}
          onCardClick={(card) => toggleCard(card.id)}
        />
        <div className={styles.actions}>
          <Button onClick={playSelected} disabled={!canPlay || selectedIds.length === 0}>
            {selectedIds.length}枚出す
          </Button>
          <Button variant="danger" onClick={() => dispatch({ type: "doubt" })} disabled={!isYourDecision}>
            ダウト！
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: "pass" })} disabled={!isYourDecision}>
            見送る
          </Button>
        </div>
        <LogPanel entries={state.log} title="進行ログ" />
      </main>

      <RevealPanel state={state} />

      <ResultModal
        open={state.phase === "finished"}
        title="ゲーム終了"
        ranking={getRanking(state)}
        onRetry={() => { setSelectedIds([]); dispatch({ type: "reset" }); }}
        onExit={onExit}
      />
    </GameShell>
  );
}
