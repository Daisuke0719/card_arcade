/**
 * ぶたのしっぽのオンライン対戦画面。
 *
 * 盤面と外枠は CPU 版と同じ ButanoshippoBoard を使い、
 * サーバーが作った公開状態（ButanoshippoView）だけを表示する。
 */
import type { OnlineGameViewProps } from "@core";
import type { ScoreBoardEntry } from "@ui";
import { ButanoshippoBoard } from "./ButanoshippoBoard";
import type { ButanoshippoView, OnlineButanoshippoAction } from "./onlineAdapter";

export function ButanoshippoOnlineView({
  manifest, view, playerId, canAct, finished, result, sendAction, onExit, onRematch,
}: OnlineGameViewProps<ButanoshippoView, OnlineButanoshippoAction>) {
  const nameOf = (id: string | null) => view.players.find((player) => player.id === id)?.name ?? "";
  const canFlip = canAct && view.canFlip;

  const entries: ScoreBoardEntry[] = view.players.map((player) => ({
    id: player.id,
    name: player.id === playerId ? `${player.name}（あなた）` : player.name,
    detail: `${player.collected}点`,
    isCurrent: !finished && player.id === view.currentPlayerId,
  }));

  const hint = finished
    ? "ゲーム終了"
    : view.phase === "collecting"
      ? "同じ数字が続きました。場札を引き取ります。"
      : canFlip
        ? "光っている先頭のカードをめくってください。"
        : `${nameOf(view.currentPlayerId)} の手番です`;

  return (
    <ButanoshippoBoard
      manifest={manifest}
      onExit={onExit}
      onReset={onRematch}
      entries={entries}
      ringCount={view.ringCount}
      pileCount={view.pileCount}
      pileTop={view.pileTop ?? undefined}
      canFlip={canFlip}
      onFlip={() => sendAction({ type: "flip" })}
      hint={hint}
      collectorName={view.lastCollectorId ? nameOf(view.lastCollectorId) : null}
      finished={finished}
      ranking={result?.ranking}
      onRetry={onRematch}
      retryLabel="同じルームで再戦"
    />
  );
}
