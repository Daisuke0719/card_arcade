/**
 * ページワン の画面。
 *
 * ここは「見た目」と「時間」だけを担当します。
 * ルールと勝敗の判断は logic.ts にあります。
 * 待ち時間は useCpuTurn の1行だけで扱い、setTimeout は書きません。
 */
import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { Button, DeckPile, GameShell, Hand, LogPanel, ResultModal, ScoreBoard } from "@ui";
import {
  HUMAN_ID,
  createInitialState,
  fieldTop,
  getRanking,
  handOf,
  isGameOver,
  legalMoves,
  pendingDelayMs,
  reduce,
} from "./logic";
import styles from "./PageOneGame.module.css";

export function PageOneGame({ manifest, onExit }: GameComponentProps) {
  // 乱数と時間は画面側で用意する。logic.ts には持ち込まない。
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 100000)),
  );

  // 手番が CPU の間だけ pendingDelayMs が数値を返し、タイマーが動く。
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const finished = isGameOver(state);
  const top = fieldTop(state);
  const yourHand = handOf(state, HUMAN_ID);
  const playable = legalMoves(yourHand, top);
  const isYourTurn = !finished && state.turn.currentId === HUMAN_ID;
  const canDraw = isYourTurn && playable.length === 0;

  const playableIds = playable.map((card) => card.id);
  const disabledIds = isYourTurn
    ? yourHand.filter((card) => !playableIds.includes(card.id)).map((card) => card.id)
    : yourHand.map((card) => card.id);

  const opponents = state.turn.players.filter((player) => player.id !== HUMAN_ID);

  const scoreEntries = state.turn.players.map((player) => ({
    id: player.id,
    name: player.name,
    detail: `残り${handOf(state, player.id).length}枚`,
    isCurrent: !finished && state.turn.currentId === player.id,
    isFinished: state.winnerId === player.id,
  }));

  const turnMessage = finished
    ? "決着しました"
    : isYourTurn
      ? "あなたの番です"
      : `${state.turn.players.find((player) => player.id === state.turn.currentId)?.name ?? ""}の番です`;

  const hintMessage = !isYourTurn
    ? "CPU が考えています"
    : canDraw
      ? "出せるカードがありません。山札から1枚引いてください"
      : "場札と同じマークか同じ数字のカードを選んでください";

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={() => dispatch({ type: "reset" })}
      headerRight={<ScoreBoard entries={scoreEntries} title="残り枚数" />}
    >
      <div className={styles.table}>
        <div className={styles.opponents}>
          {opponents.map((player) => (
            <Hand
              key={player.id}
              variant="hidden"
              count={handOf(state, player.id).length}
              label={player.name}
            />
          ))}
        </div>

        <div className={styles.piles}>
          <DeckPile count={state.field.length} top={top} face="up" label="場札" size="lg" />
          <DeckPile
            count={state.deck.length}
            face="down"
            label="山札"
            size="lg"
            highlighted={canDraw}
            disabled={!canDraw}
            onClick={() => dispatch({ type: "draw" })}
          />
        </div>

        <p className={styles.turn}>{turnMessage}</p>
        <p className={styles.message}>{hintMessage}</p>

        <div className={styles.you}>
          <Hand
            cards={yourHand}
            label="あなたの手札"
            disabledIds={disabledIds}
            onCardClick={(card) => dispatch({ type: "play", cardId: card.id })}
            emptyText="手札はありません"
          />
          <Button onClick={() => dispatch({ type: "draw" })} disabled={!canDraw}>
            山札から引く
          </Button>
        </div>

        <div className={styles.log}>
          <LogPanel entries={state.log} max={6} />
        </div>
      </div>

      <ResultModal
        open={finished}
        title={state.winnerId === HUMAN_ID ? "あなたの勝ち！" : "あなたの負け"}
        message={
          state.winnerId
            ? `${state.turn.players.find((player) => player.id === state.winnerId)?.name ?? ""}が先に手札を出し切りました`
            : undefined
        }
        ranking={getRanking(state)}
        onRetry={() => dispatch({ type: "reset" })}
        onExit={onExit}
      />
    </GameShell>
  );
}
