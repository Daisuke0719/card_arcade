import { useCallback, useEffect, useRef, useState } from "react";
import { RoomClient } from "./roomClient";
import type { ConnectionStatus, OnlineMatchSnapshot, ServerMessage } from "./protocol";

export function useOnlineMatch<TState, TAction>(options: Omit<ConstructorParameters<typeof RoomClient<TState, TAction>>[0], "onMessage" | "onStatus" | "onSnapshot">) {
  const clientRef = useRef<RoomClient<TState, TAction> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [snapshot, setSnapshot] = useState<OnlineMatchSnapshot<TState>>({ revision: 0, roomId: options.roomId, gameId: options.gameId, hostId: "", state: null, players: [], status: "waiting", result: null, maxPlayers: 4 });
  const [lastMessage, setLastMessage] = useState<ServerMessage<TState> | null>(null);
  const { url, roomId, playerId, playerName, gameId } = options;

  useEffect(() => {
    if (!url) return;
    const client = new RoomClient<TState, TAction>({ url, roomId, playerId, playerName, gameId, token: options.token, onStatus: setStatus, onSnapshot: setSnapshot, onMessage: setLastMessage });
    clientRef.current = client;
    client.connect();
    return () => { client.disconnect(); clientRef.current = null; };
  }, [url, roomId, playerId, playerName, gameId, options.token]);

  const sendAction = useCallback((action: TAction) => clientRef.current?.sendAction(action) ?? null, []);
  const start = useCallback(() => clientRef.current?.start() ?? null, []);
  const rematch = useCallback(() => clientRef.current?.rematch() ?? null, []);
  const leave = useCallback(() => clientRef.current?.leave(), []);
  return { status, snapshot, lastMessage, sendAction, start, rematch, leave };
}
