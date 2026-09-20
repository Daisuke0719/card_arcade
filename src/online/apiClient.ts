export type OnlineSession = { readonly token: string; readonly playerId: string };
export type RoomInfo = { readonly roomId: string; readonly token: string; readonly websocketPath: string };

async function requestError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = await response.json() as { error?: string };
    return new Error(body.error || fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function createSession(baseUrl: string, name: string): Promise<OnlineSession> {
  const response = await fetch(`${baseUrl}/v1/session`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
  if (!response.ok) throw await requestError(response, "オンラインセッションを作成できませんでした");
  return response.json() as Promise<OnlineSession>;
}
export async function createRoom(baseUrl: string, session: OnlineSession, gameId = "pageone"): Promise<RoomInfo> {
  const response = await fetch(`${baseUrl}/v1/rooms`, { method: "POST", headers: { authorization: `Bearer ${session.token}`, "content-type": "application/json" }, body: JSON.stringify({ gameId }) });
  if (!response.ok) throw await requestError(response, "ルームを作成できませんでした");
  return response.json() as Promise<RoomInfo>;
}
export async function joinRoom(baseUrl: string, session: OnlineSession, roomId: string): Promise<RoomInfo> {
  const response = await fetch(`${baseUrl}/v1/rooms/${encodeURIComponent(roomId)}/join`, { method: "POST", headers: { authorization: `Bearer ${session.token}` } });
  if (!response.ok) throw await requestError(response, "ルームに参加できませんでした");
  return response.json() as Promise<RoomInfo>;
}
