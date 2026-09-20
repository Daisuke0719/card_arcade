/**
 * ババ抜き の画面。
 *
 * ここは「見た目」と「時間」だけを担当する。
 * 勝ち負けの判断やルールは logic.ts にある
 * （そうしておくと、テストが setTimeout を使わずに書ける）。
 */
import { useReducer } from "react";
import { useCpuTurn } from "@core";
import type { GameComponentProps } from "@core";
import { Card, GameShell, Hand, ResultModal, ScoreBoard } from "@ui";
import type { ScoreBoardEntry } from "@ui";
import { createInitialState, getRanking, nextAlivePlayer, pendingDelayMs, reduce } from "./logic";

export function BabanukiGame({ manifest, onExit }: GameComponentProps) {
  // 乱数と時間は画面側で用意する。logic.ts には持ち込まない。
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 1_000_000)),
  );

  // pendingDelayMs が数値を返している間だけタイマーが動く
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  const players = state.turn.players;
  const others = players.filter((player) => player.id !== "you");
  const targetId = nextAlivePlayer(state);
  const canDraw = state.turn.currentId === "you" && state.phase === "playing";

  const scoreEntries: ScoreBoardEntry[] = players.map((player) => {
    const finishedIndex = state.turn.finishedIds.indexOf(player.id);
    return {
      id: player.id,
      name: player.name,
      detail: `残り${state.hands[player.id].length}枚`,
      isCurrent: state.phase !== "finished" && player.id === state.turn.currentId,
      isFinished: finishedIndex >= 0,
      rankLabel: finishedIndex >= 0 ? `${finishedIndex + 1}位` : undefined,
    };
  });

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={() => dispatch({ type: "reset" })}
      headerRight={<ScoreBoard title="残り枚数" entries={scoreEntries} />}
    >
      <div>
        {others.map((player) => {
          const isTarget = player.id === targetId;
          return (
            <div key={player.id}>
              <Hand
                cards={state.hands[player.id]}
                face="down"
                label={player.name}
                onCardClick={
                  canDraw && isTarget
                    ? (_card, index) => dispatch({ type: "draw", index })
                    : undefined
                }
              />
              {isTarget && state.phase !== "finished" ? (
                <p aria-hidden="true">← ここから引きます</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {state.phase === "revealing" && state.lastDrawn ? (
        <div>
          <p>引いたカード</p>
          <Card card={state.lastDrawn} face="up" />
        </div>
      ) : null}

      <Hand cards={state.hands.you} face="up" label="あなたの手札" />

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
