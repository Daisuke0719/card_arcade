/**
 * スピードのオンライン対戦画面。
 *
 * 盤面と外枠は CPU 版と同じ SpeedBoard を使う。
 * サーバーが作った公開状態（SpeedView）だけを表示し、画面側では手札も勝敗も確定しない。
 */
import type { OnlineGameViewProps } from "@core";
import { SpeedBoard } from "./SpeedBoard";
import type { OnlineSpeedAction, SpeedView } from "./onlineAdapter";

export function SpeedOnlineView({
  manifest,
  view,
  playerId,
  players,
  canAct,
  finished,
  result,
  sendAction,
  onExit,
  onRematch,
}: OnlineGameViewProps<SpeedView, OnlineSpeedAction>) {
  const myName = players.find((player) => player.id === playerId)?.name ?? "あなた";
  const active = canAct && view.phase === "playing";

  const highlightedIds = active ? view.playableIds : [];
  const disabledIds = view.myHand
    .map((card) => card.id)
    .filter((id) => !active || !view.playableIds.includes(id));

  const myCount = view.myHand.length + view.myDeckCount;
  const opponentCount = view.opponent.handCount + view.opponent.deckCount;
  const opponentName = view.opponent.name;

  const resultTitle =
    view.winnerId === playerId ? "あなたの勝ち！" : view.winnerId === "draw" ? "引き分け" : "あなたの負け";

  return (
    <SpeedBoard
      manifest={manifest}
      onExit={onExit}
      onReset={onRematch}
      opponentName={opponentName}
      opponentDeckCount={view.opponent.deckCount}
      opponentHandCount={view.opponent.handCount}
      piles={view.piles}
      myName={myName}
      myDeckCount={view.myDeckCount}
      myHand={view.myHand}
      highlightedIds={highlightedIds}
      disabledIds={disabledIds}
      onPlay={(cardId) => sendAction({ type: "play_card", cardId })}
      onRefill={active && view.canRefill ? () => sendAction({ type: "refill_piles" }) : undefined}
      finished={finished}
      resultTitle={resultTitle}
      resultScore={`${myCount} 対 ${opponentCount}`}
      ranking={result?.ranking ?? []}
      onRetry={onRematch}
      retryLabel="同じルームで再戦"
    />
  );
}
