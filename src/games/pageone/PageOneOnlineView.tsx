/**
 * ページワンのオンライン対戦画面。
 *
 * 盤面は CPU 版と同じ PageOneTable を使い、外枠も同じ GameShell を使う。
 * 状態はサーバーが作った公開状態（PageOneView）だけを表示し、画面側では確定しない。
 */
import type { OnlineGameViewProps } from "@core";
import { GameShell, ResultModal, ScoreBoard } from "@ui";
import type { OnlinePageOneAction, PageOneView } from "./onlineAdapter";
import { PageOneTable } from "./PageOneTable";

export function PageOneOnlineView({
  manifest, view, playerId, players, canAct, finished, result, sendAction, onExit, onRematch,
}: OnlineGameViewProps<PageOneView, OnlinePageOneAction>) {
  const isYourTurn = canAct && view.currentPlayerId === playerId;
  const nameOf = (id: string | null) => players.find((player) => player.id === id)?.name ?? "";

  const disabledIds = view.myHand
    .map((card) => card.id)
    .filter((id) => !isYourTurn || !view.playableIds.includes(id));

  const scoreEntries = [
    { id: playerId, name: nameOf(playerId) || "あなた", count: view.myHand.length },
    ...view.opponents.map((player) => ({ id: player.id, name: player.name, count: player.handCount })),
  ].map((entry) => ({
    id: entry.id,
    name: entry.name,
    detail: `残り${entry.count}枚`,
    isCurrent: !finished && view.currentPlayerId === entry.id,
    isFinished: view.winnerId === entry.id,
  }));

  const turnMessage = finished
    ? "決着しました"
    : view.currentPlayerId === playerId
      ? "あなたの番です"
      : `${nameOf(view.currentPlayerId)}の番です`;

  const hintMessage = !isYourTurn
    ? "相手が考えています"
    : view.canDraw
      ? "出せるカードがありません。山札から1枚引いてください"
      : "場札と同じマークか同じ数字のカードを選んでください";

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={onRematch}
      headerRight={<ScoreBoard entries={scoreEntries} title="残り枚数" />}
    >
      <PageOneTable
        opponents={view.opponents}
        field={view.field}
        deckCount={view.deckCount}
        hand={view.myHand}
        disabledIds={disabledIds}
        canDraw={view.canDraw && canAct}
        canDeclare={view.canDeclare && canAct}
        turnMessage={turnMessage}
        hintMessage={hintMessage}
        log={view.log}
        onPlay={(cardId) => sendAction({ type: "play_card", cardId })}
        onDraw={() => sendAction({ type: "draw_card" })}
        onDeclare={() => sendAction({ type: "call_page_one" })}
      />

      <ResultModal
        open={finished}
        title={view.winnerId === playerId ? "あなたの勝ち！" : "あなたの負け"}
        message={result?.message}
        ranking={result?.ranking}
        onRetry={onRematch}
        retryLabel="同じルームで再戦"
        onExit={onExit}
      />
    </GameShell>
  );
}
