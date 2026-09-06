/**
 * ページワン の画面。
 *
 * ここは「見た目」と「時間」だけを担当します。
 * ルールと勝敗の判定は logic.ts の純粋関数に置いてあります。
 */
import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { Button, DeckPile, GameShell, Hand, ResultModal, ScoreBoard } from "@ui";
import {
  HUMAN_ID,
  canPlay,
  createInitialState,
  fieldTop,
  getRanking,
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

  // pendingDelayMs が数値を返している間だけタイマーが動く（CPU の手番）
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const finished = isGameOver(state);
  const top = fieldTop(state);
  const myHand = state.hands[HUMAN_ID];
  const myTurn = !finished && state.turn.currentId === HUMAN_ID;
  const myMoves = legalMoves(myHand, top);
  const canDraw = myTurn && myMoves.length === 0;

  // 自分の手番でないとき、出せないときは、そのカードを押せなくする
  const disabledIds = myHand
    .filter((card) => !myTurn || !canPlay(card, top))
    .map((card) => card.id);

  const opponents = state.turn.players.filter((player) => player.id !== HUMAN_ID);
  const currentName =
    state.turn.players.find((player) => player.id === state.turn.currentId)?.name ?? "";
  const winnerName =
    state.turn.players.find((player) => player.id === state.winnerId)?.name ?? "";

  const scoreEntries = state.turn.players.map((player) => ({
    id: player.id,
    name: player.name,
    detail: `残り${state.hands[player.id].length}枚`,
    isCurrent: !finished && state.turn.currentId === player.id,
  }));

  const message = finished
    ? `${winnerName}が手札を出し切りました`
    : myTurn
      ? myMoves.length > 0
        ? "出せるカードを選んでください"
        : "出せるカードがありません。山札から1枚引いてください"
      : `${currentName}の手番です`;

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
              count={state.hands[player.id].length}
              label={player.name}
            />
          ))}
        </div>

        <div className={styles.piles}>
          <DeckPile
            count={state.deck.length}
            face="down"
            label="山札"
            size="lg"
            disabled={!canDraw}
            highlighted={canDraw}
            onClick={() => dispatch({ type: "draw" })}
          />
          <DeckPile count={state.field.length} top={top} face="up" label="場札" size="lg" />
        </div>

        <p className={styles.message}>
          {finished ? message : <span className={styles.turn}>{message}</span>}
        </p>

        <Hand
          cards={myHand}
          label="あなたの手札"
          disabledIds={disabledIds}
          onCardClick={(card) => dispatch({ type: "play", cardId: card.id })}
          emptyText="手札はありません"
        />

        <div className={styles.actions}>
          <Button onClick={() => dispatch({ type: "draw" })} disabled={!canDraw}>
            山札から引く
          </Button>
        </div>
      </div>

      <ResultModal
        open={finished}
        title={state.winnerId === HUMAN_ID ? "あなたの勝ち！" : `${winnerName}の勝ち`}
        message="2位以下は手札の残り枚数が少ない順です"
        ranking={getRanking(state)}
        onRetry={() => dispatch({ type: "reset" })}
        onExit={onExit}
      />
    </GameShell>
  );
}
