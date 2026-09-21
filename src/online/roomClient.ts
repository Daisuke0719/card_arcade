import type { ClientMessage, ConnectionStatus, OnlineMatchSnapshot, ServerMessage } from "./protocol";

export type RoomClientOptions<TState, TAction> = {
  readonly url: string;
  readonly roomId: string;
  readonly playerId: string;
  readonly playerName: string;
  readonly gameId: string;
  readonly token?: string;
  readonly onMessage?: (message: ServerMessage<TState>) => void;
  readonly onStatus?: (status: ConnectionStatus) => void;
  readonly onSnapshot?: (snapshot: OnlineMatchSnapshot<TState>) => void;
  readonly WebSocketImpl?: typeof WebSocket;
  readonly reconnect?: boolean;
  readonly reconnectAttempts?: number;
  readonly reconnectDelayMs?: number;
  readonly _actionType?: TAction;
};

export class RoomClient<TState, TAction> {
  private socket: WebSocket | null = null;
  private attempts = 0;
  private closedByUser = false;
  private actionIds = new Set<string>();
  private snapshot: OnlineMatchSnapshot<TState> = { revision: 0, roomId: "", gameId: "", hostId: "", state: null, players: [], status: "waiting", result: null, maxPlayers: 4 };

  constructor(private readonly options: RoomClientOptions<TState, TAction>) {}

  connect(): void {
    if (this.closedByUser) return;
    const Impl = this.options.WebSocketImpl ?? WebSocket;
    this.options.onStatus?.(this.attempts === 0 ? "connecting" : "reconnecting");
    this.socket = new Impl(this.options.url);
    this.socket.addEventListener("open", () => {
      this.attempts = 0;
      this.options.onStatus?.("connected");
      this.send({ type: "authenticate", token: this.options.token ?? "" });
    });
    this.socket.addEventListener("message", (event) => this.receive(event.data));
    this.socket.addEventListener("close", () => this.handleClose());
    this.socket.addEventListener("error", () => this.options.onStatus?.("reconnecting"));
  }

  sendAction(action: TAction): string | null {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return null;
    const actionId = crypto.randomUUID();
    if (this.actionIds.has(actionId)) return null;
    this.actionIds.add(actionId);
    this.send({ type: "action", actionId, expectedRevision: this.snapshot.revision, action });
    return actionId;
  }
  start(): string | null {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return null;
    const actionId = crypto.randomUUID(); this.send({ type: "start", actionId, expectedRevision: this.snapshot.revision }); return actionId;
  }

  rematch(): string | null {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return null;
    const actionId = crypto.randomUUID();
    this.send({ type: "rematch", actionId, expectedRevision: this.snapshot.revision });
    return actionId;
  }

  leave(): void {
    this.closedByUser = true;
    this.send({ type: "leave", actionId: crypto.randomUUID(), expectedRevision: this.snapshot.revision });
    this.socket?.close(1000, "left");
    this.options.onStatus?.("closed");
  }

  disconnect(): void {
    this.closedByUser = true;
    this.socket?.close(1000, "disconnected");
  }

  getSnapshot(): OnlineMatchSnapshot<TState> { return this.snapshot; }

  private send(message: ClientMessage<TAction>): void { if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message)); }

  private receive(raw: string | ArrayBuffer): void {
    if (typeof raw !== "string") return;
    let message: ServerMessage<TState>;
    try { message = JSON.parse(raw) as ServerMessage<TState>; } catch { return; }
    if (message.type === "room_state") {
      this.snapshot = { revision: message.revision, roomId: message.roomId, gameId: message.gameId, hostId: message.hostId, state: message.state, players: message.players, status: message.status, result: message.result, maxPlayers: message.maxPlayers };
      this.options.onSnapshot?.(this.snapshot);
    }
    if (message.type === "action_accepted" && message.actionId) this.actionIds.delete(message.actionId);
    if (message.type === "action_rejected" && message.actionId) this.actionIds.delete(message.actionId);
    this.options.onMessage?.(message);
  }

  private handleClose(): void {
    if (this.closedByUser) return;
    const max = this.options.reconnectAttempts ?? 8;
    if (this.attempts >= max) { this.options.onStatus?.("failed"); return; }
    const delay = Math.min((this.options.reconnectDelayMs ?? 500) * 2 ** this.attempts, 8000);
    this.attempts += 1;
    this.options.onStatus?.("reconnecting");
    globalThis.setTimeout(() => this.connect(), delay);
  }
}
