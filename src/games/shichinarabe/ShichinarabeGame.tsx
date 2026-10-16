import { useReducer } from "react";
import {
  RANKS,
  SUITS,
  SUIT_NAME_JA,
  SUIT_SYMBOL,
  isCurrent,
  isFinished,
  useCpuTurn,
} from "@core";
import type { GameComponentProps, PlayingCard } from "@core";
import { Button, Card, GameShell, Hand, LogPanel, ResultModal, ScoreBoard } from "@ui";
import {
  HUMAN_ID,
  MAX_PASSES,
  createInitialState,
  getRanking,
  legalMoves,
  pendingDelayMs,
  reduce,
} from "./logic";
import styles from "./ShichinarabeGame.module.css";

export function ShichinarabeGame({ manifest, onExit }: GameComponentProps) {
  // 乱数と時間は画面側で用意する。logic.ts には持ち込まない。
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 100000)),
  );

  // pendingDelayMs が数値を返している間だけタイマーが動く
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const isFinishedGame = state.phase === "finished";
  const yourHand = state.hands[HUMAN_ID] ?? [];
  const isYourTurn = !isFinishedGame && isCurrent(state.turn, HUMAN_ID);
  const yourMoves = legalMoves(state.board, yourHand);
  const yourMoveIds = yourMoves.map((c) => c.id);
  const disabledIds = isYourTurn
    ? yourHand.filter((c) => !yourMoveIds.includes(c.id)).map((c) => c.id)
    : yourHand.map((c) => c.id);
  const canPass = isYourTurn && yourMoves.length === 0;
  const yourPasses = state.passes[HUMAN_ID] ?? 0;

  const scoreEntries = state.turn.players.map((player) => ({
    id: player.id,
    name: player.name,
    detail: `残り${(state.hands[player.id] ?? []).length}枚 / パス${state.passes[player.id] ?? 0}回`,
    isCurrent: isCurrent(state.turn, player.id),
    isFinished: isFinished(state.turn, player.id),
  }));

  const ranking = isFinishedGame ? getRanking(state) : undefined;

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={() => dispatch({ type: "reset" })}
      headerRight={<ScoreBoard entries={scoreEntries} title="手番" />}
    >
      <div className={styles.table}>
        <div className={styles.board}>
          {SUITS.map((suit) => (
            <div key={suit} className={styles.suitRow}>
              <span className={styles.suitLabel} aria-label={SUIT_NAME_JA[suit]}>
                {SUIT_SYMBOL[suit]}
              </span>
              <div className={styles.slots}>
                {RANKS.map((rank, index) => {
                  const placed = state.board[suit][index];
                  const card: PlayingCard = { kind: "standard", id: `${suit}-${rank}`, suit, rank };
                  return (
                    <Card
                      key={card.id}
                      card={placed ? card : undefined}
                      size="sm"
                      placeholder={rank}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.players}>
          <div className={styles.otherHands}>
            {state.turn.players
              .filter((player) => player.id !== HUMAN_ID)
              .map((player) => (
                <Hand
                  key={player.id}
                  variant="hidden"
                  count={(state.hands[player.id] ?? []).length}
                  label={player.name}
                />
              ))}
          </div>

          <Hand
            cards={yourHand}
            label="あなたの手札"
            disabledIds={disabledIds}
            highlightedIds={isYourTurn ? yourMoveIds : []}
            onCardClick={(clicked) => dispatch({ type: "place", cardId: clicked.id })}
          />

          <div className={styles.actions}>
            {canPass ? (
              <Button variant="secondary" onClick={() => dispatch({ type: "pass" })}>
                パス
              </Button>
            ) : null}
            <span className={styles.passInfo}>
              パス残り{Math.max(0, MAX_PASSES - yourPasses)}回
            </span>
          </div>
        </div>

        <div className={styles.panels}>
          <LogPanel entries={state.log} title="進行ログ" />
        </div>
      </div>

      <ResultModal
        open={isFinishedGame}
        title="ゲーム終了"
        ranking={ranking}
        onRetry={() => dispatch({ type: "reset" })}
        onExit={onExit}
      />
    </GameShell>
  );
}
