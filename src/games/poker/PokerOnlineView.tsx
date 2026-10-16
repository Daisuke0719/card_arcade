/**
 * ポーカーのオンライン対戦画面。
 *
 * 外枠・盤面・結果表示は CPU版と同じ PokerScreen を使う。
 * サーバーが作った公開状態（view）だけを表示し、操作は sendAction で送るだけで画面側では確定しない。
 */
import type { OnlineGameViewProps } from "@core";
import { PokerScreen } from "./PokerScreen";
import type { OnlinePokerAction, PokerView } from "./onlineAdapter";

export function PokerOnlineView({
  manifest, view, playerId, canAct, finished, result, sendAction, onExit, onRematch,
}: OnlineGameViewProps<PokerView, OnlinePokerAction>) {
  const canExchange = canAct
    && !finished
    && view.phase === "exchanging"
    && view.me.id === playerId
    && view.me.exchangedCount === null;

  return (
    <PokerScreen
      manifest={manifest}
      onExit={onExit}
      view={view}
      canExchange={canExchange}
      onExchange={cardIds => sendAction({ type: "exchange", cardIds: [...cardIds] })}
      onReset={onRematch}
      result={{
        open: finished,
        ranking: result?.ranking,
        onRetry: onRematch,
        retryLabel: "同じルームで再戦",
      }}
    />
  );
}
