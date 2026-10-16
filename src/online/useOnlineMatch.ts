import { useCallback, useEffect, useRef, useState } from "react";
import { RoomClient } from "./roomClient";
import type { ConnectionStatus, OnlineMatchSnapshot, ServerMessage } from "./protocol";

export function useOnlineMatch<TState, TAction>(options: Omit<ConstructorParameters<typeof RoomClient<TState, TAction>>[0], "onMessage" | "onStatus" | "onSnapshot">) {
  const clientRef = useRef<RoomClient<TState, TAction> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [snapshot, setSnapshot] = useState<OnlineMatchSnapshot<TState>>({ revision: 0, roomId: options.roomId, gameId: options.gameId, hostId: "", state: null, players: [], status: "waiting", result: null, maxPlayers: 4 });
  const [lastMessage, setLastMessage] = useState<ServerMessage<TState> | null>(null);
  // 拒否の直後に room_state が届くため、拒否理由は lastMessage とは別に次の成功まで残す。
  const [rejection, setRejection] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<{ code: string; message: string } | null>(null);
  const { url, roomId, playerId, playerName, gameId } = options;

  useEffect(() => {
    if (!url) return;
    const onStatus = (next: ConnectionStatus) => {
      setStatus(next);
      if (next === "connecting") { setFatalError(null); setRejection(null); }
    };
    const onMessage = (message: ServerMessage<TState>) => {
      setLastMessage(message);
      if (message.type === "action_rejected") setRejection(message.reason);
      if (message.type === "action_accepted") setRejection(null);
      if (message.type === "error") setFatalError({ code: message.code, message: message.message });
    };
    const client = new RoomClient<TState, TAction>({ url, roomId, playerId, playerName, gameId, token: options.token, onStatus, onSnapshot: setSnapshot, onMessage });
    clientRef.current = client;
    client.connect();
    return () => { client.disconnect(); clientRef.current = null; };
  }, [url, roomId, playerId, playerName, gameId, options.token]);

  const sendAction = useCallback((action: TAction) => clientRef.current?.sendAction(action) ?? null, []);
  const start = useCallback(() => clientRef.current?.start() ?? null, []);
  const rematch = useCallback(() => clientRef.current?.rematch() ?? null, []);
  const leave = useCallback(() => clientRef.current?.leave(), []);
  return { status, snapshot, lastMessage, rejection, fatalError, sendAction, start, rematch, leave };
}
