/**
 * ババ抜きのオンライン対戦画面。
 *
 * 外枠・盤面・結果表示は CPU版と同じ BabanukiScreen を使う。
 * サーバーが作った公開状態（view）だけを表示し、操作は sendAction で送るだけで画面側では確定しない。
 */
import type { OnlineGameViewProps } from "@core";
import { BabanukiScreen } from "./BabanukiScreen";
import type { BabanukiView, OnlineBabanukiAction } from "./onlineAdapter";

export function BabanukiOnlineView({
  manifest, view, playerId, canAct, finished, result, sendAction, onExit, onRematch,
}: OnlineGameViewProps<BabanukiView, OnlineBabanukiAction>) {
  const canDraw = canAct && !finished && view.phase === "playing" && view.currentPlayerId === playerId;

  return (
    <BabanukiScreen
      manifest={manifest}
      onExit={onExit}
      view={view}
      canDraw={canDraw}
      onDraw={(index) => sendAction({ type: "draw", index })}
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
