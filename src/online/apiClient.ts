export type OnlineSession = { readonly token: string; readonly playerId: string };
export type RoomInfo = { readonly roomId: string; readonly token: string; readonly websocketPath: string };
export type OnlineApiErrorKind = "network" | "cors" | "http";
export class OnlineApiError extends Error {
  constructor(public readonly kind: OnlineApiErrorKind, message: string, public readonly status?: number) {
    super(message);
    this.name = "OnlineApiError";
  }
}

async function requestError(response: Response, fallback: string): Promise<OnlineApiError> {
  try {
    const body = await response.json() as { error?: string };
    return new OnlineApiError("http", body.error || fallback, response.status);
  } catch {
    return new OnlineApiError("http", fallback, response.status);
  }
}

async function requestJson<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    const kind = typeof navigator !== "undefined" && !navigator.onLine ? "network" : "cors";
    const detail = error instanceof Error ? error.message : "接続に失敗しました";
    throw new OnlineApiError(kind, detail);
  }
  if (!response.ok) throw await requestError(response, fallback);
  try {
    return await response.json() as T;
  } catch {
    throw new OnlineApiError("http", "APIの応答形式が正しくありません", response.status);
  }
}

export async function createSession(baseUrl: string, name: string): Promise<OnlineSession> {
  return requestJson<OnlineSession>(`${baseUrl}/v1/session`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }, "オンラインセッションを作成できませんでした");
}
export async function createRoom(baseUrl: string, session: OnlineSession, gameId = "pageone"): Promise<RoomInfo> {
  return requestJson<RoomInfo>(`${baseUrl}/v1/rooms`, { method: "POST", headers: { authorization: `Bearer ${session.token}`, "content-type": "application/json" }, body: JSON.stringify({ gameId }) }, "ルームを作成できませんでした");
}
export async function joinRoom(baseUrl: string, session: OnlineSession, roomId: string): Promise<RoomInfo> {
  return requestJson<RoomInfo>(`${baseUrl}/v1/rooms/${encodeURIComponent(roomId)}/join`, { method: "POST", headers: { authorization: `Bearer ${session.token}` } }, "ルームに参加できませんでした");
}
