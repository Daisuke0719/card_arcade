/**
 * ダウトのオンライン対戦画面。
 *
 * 外枠・盤面・結果表示は CPU版と同じ DoubtScreen を使う。
 * サーバーが作った公開状態（view）だけを表示し、操作は sendAction で送るだけで画面側では確定しない。
 */
import type { OnlineGameViewProps } from "@core";
import { DoubtScreen } from "./DoubtScreen";
import type { DoubtView, OnlineDoubtAction } from "./onlineAdapter";

export function DoubtOnlineView({
  manifest, view, playerId, canAct, finished, result, sendAction, onExit, onRematch,
}: OnlineGameViewProps<DoubtView, OnlineDoubtAction>) {
  const isActor = canAct && !finished && view.actorId === playerId;

  return (
    <DoubtScreen
      manifest={manifest}
      onExit={onExit}
      view={view}
      canPlay={isActor && view.phase === "playing"}
      canDecide={isActor && view.phase === "doubt-decision"}
      onPlay={(cardIds) => sendAction({ type: "play", cardIds: [...cardIds] })}
      onDoubt={() => sendAction({ type: "doubt" })}
      onPass={() => sendAction({ type: "pass" })}
      onReset={onRematch}
      result={{
        open: finished,
        ranking: result?.ranking,
        message: result?.message,
        onRetry: onRematch,
        retryLabel: "同じルームで再戦",
      }}
    />
  );
}
