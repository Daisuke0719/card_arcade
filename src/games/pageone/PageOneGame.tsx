/**
 * ページワン の画面。
 *
 * ここは「見た目」と「時間」だけを担当する。
 * 出せるかどうか・誰の手番か・上がったかどうかの判断はすべて logic.ts にあり、
 * この画面はその結果を表示に変換しているだけ。
 *
 * setTimeout は書かない。時間を扱うのは useCpuTurn の1行だけ。
 */
import { useReducer } from "react";
import { findPlayer, useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { Button, DeckPile, GameShell, Hand, LogPanel, ResultModal, ScoreBoard } from "@ui";
import {
  createInitialState,
  fieldTop,
  getRanking,
  isGameOver,
  legalMoves,
  pendingDelayMs,
  reduce,
} from "./logic";
import styles from "./PageOneGame.module.css";

const HUMAN_ID = "you";

export function PageOneGame({ manifest, onExit }: GameComponentProps) {
  // 乱数と時間は画面側で用意する。logic.ts には持ち込まない。
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 100000)),
  );

  // CPU の手番のあいだだけタイマーが動く（pendingDelayMs が数値を返している間だけ）
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const finished = isGameOver(state);
  const top = fieldTop(state);
  const myHand = state.hands[HUMAN_ID] ?? [];
  const myTurn = !finished && state.turn.currentId === HUMAN_ID;

  // 出せるカードの判定は logic.ts の legalMoves が持っている。ここでは表示に変換するだけ
  const playableIds = legalMoves(myHand, top).map((card) => card.id);
  const canDraw = myTurn && playableIds.length === 0;
  const disabledIds = myHand
    .filter((card) => !myTurn || !playableIds.includes(card.id))
    .map((card) => card.id);

  const currentName = findPlayer(state.turn.players, state.turn.currentId)?.name ?? "";
  const winner = state.winnerId ? findPlayer(state.turn.players, state.winnerId) : undefined;

  const message = (() => {
    if (finished) return "決着しました";
    if (!myTurn) return currentName + " の番です";
    if (playableIds.length === 0) return "出せるカードがありません。山札から1枚引いてください";
    return "光っているカードを選んで出してください";
  })();

  const scoreEntries = state.turn.players.map((player) => ({
    id: player.id,
    name: player.name,
    detail: "残り" + (state.hands[player.id] ?? []).length + "枚",
    isCurrent: !finished && state.turn.currentId === player.id,
    isFinished: state.winnerId === player.id,
  }));

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={() => dispatch({ type: "reset" })}
      headerRight={<ScoreBoard entries={scoreEntries} title="残り枚数" />}
      footer={<LogPanel entries={state.log} title="進行ログ" />}
    >
      <div className={styles.table}>
        <div className={styles.opponents}>
          {state.turn.players
            .filter((player) => player.id !== HUMAN_ID)
            .map((player) => (
              <Hand
                key={player.id}
                variant="hidden"
                count={(state.hands[player.id] ?? []).length}
                label={
                  player.name + (!finished && state.turn.currentId === player.id ? "（手番）" : "")
                }
              />
            ))}
        </div>

        <div className={styles.center}>
          <div className={styles.pile}>
            <DeckPile count={state.field.length} top={top} face="up" label="場札" size="lg" />
          </div>

          <div className={styles.pile}>
            <DeckPile
              count={state.deck.length}
              face="down"
              label="山札"
              size="lg"
              disabled={!canDraw}
              onClick={() => dispatch({ type: "draw" })}
            />
            <Button variant="secondary" disabled={!canDraw} onClick={() => dispatch({ type: "draw" })}>
              山札から1枚引く
            </Button>
          </div>
        </div>

        <p className={styles.message}>{message}</p>

        <div className={styles.mine}>
          <Hand
            cards={myHand}
            label="あなたの手札"
            disabledIds={disabledIds}
            onCardClick={(card) => dispatch({ type: "play", cardId: card.id })}
            emptyText="手札はありません"
          />
        </div>
      </div>

      <ResultModal
        open={finished}
        title={winner?.id === HUMAN_ID ? "あなたの勝ち！" : (winner?.name ?? "") + " の勝ち"}
        message="2位以下は残った手札の少ない順です"
        ranking={getRanking(state)}
        onRetry={() => dispatch({ type: "reset" })}
        onExit={onExit}
      />
    </GameShell>
  );
}
