import type { OnlineSession, RoomInfo } from "./apiClient";

/** 再読み込み後に同じプレイヤーとしてルームへ戻るための記録。 */
export type SavedRoom = { readonly name: string; readonly session: OnlineSession; readonly room: RoomInfo };

// タブごとに別のプレイヤーとして参加できるよう、localStorage ではなく sessionStorage を使う。
const keyOf = (gameId: string) => `card-arcade:online:${gameId}`;

function storage(): Storage | null {
  try { return typeof sessionStorage === "undefined" ? null : sessionStorage; } catch { return null; }
}

export function loadSavedRoom(gameId: string): SavedRoom | null {
  try {
    const raw = storage()?.getItem(keyOf(gameId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<SavedRoom>;
    const valid = typeof value.name === "string"
      && typeof value.session?.token === "string" && typeof value.session.playerId === "string"
      && typeof value.room?.roomId === "string" && typeof value.room.token === "string" && typeof value.room.websocketPath === "string";
    return valid ? value as SavedRoom : null;
  } catch { return null; }
}

export function saveRoom(gameId: string, saved: SavedRoom): void {
  try { storage()?.setItem(keyOf(gameId), JSON.stringify(saved)); } catch { /* 保存できなくても対戦は続けられる */ }
}

export function clearSavedRoom(gameId: string): void {
  try { storage()?.removeItem(keyOf(gameId)); } catch { /* 削除できなくても次回の認証失敗で破棄される */ }
}
