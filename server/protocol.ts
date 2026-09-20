export type Player = { id: string; name: string; connected: boolean };
export type RoomStatus = "waiting" | "playing" | "finished" | "closed";
export type RoomState = { roomId: string; gameId: string; revision: number; status: RoomStatus; players: Player[]; state: unknown };
export type ClientMessage =
  | { type: "join"; roomId: string; playerId: string; playerName: string; gameId: string }
  | { type: "action"; actionId: string; expectedRevision: number; action: unknown }
  | { type: "leave" };
export type ServerMessage =
  | { type: "room_state"; revision: number; state: unknown; players: Player[]; status: RoomStatus }
  | { type: "action_accepted"; actionId: string; revision: number }
  | { type: "action_rejected"; actionId?: string; reason: string }
  | { type: "player_joined"; player: Player }
  | { type: "player_left"; playerId: string }
  | { type: "match_finished"; result: unknown }
  | { type: "error"; code: string; message: string };

export function json<T>(value: T, init?: ResponseInit): Response {
  return Response.json(value, { headers: { "content-type": "application/json; charset=utf-8", ...(init?.headers ?? {}) }, ...init });
}
