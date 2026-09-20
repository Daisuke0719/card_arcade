import { useMemo, useState } from "react";
import { createRoom, createSession, joinRoom, type OnlineSession, type RoomInfo, useOnlineMatch } from "../online";
import { Card } from "@ui";
import type { PlayingCard } from "@core";

const API_URL = import.meta.env.VITE_ONLINE_API_URL ?? "http://localhost:8787";

export function OnlineLobbyPage({ gameId, onExit }: { gameId: string; onExit: () => void }) {
  const [name, setName] = useState("ゲスト");
  const [roomCode, setRoomCode] = useState("");
  const [session, setSession] = useState<OnlineSession | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connect = async (operation: (activeSession: OnlineSession) => Promise<RoomInfo>) => { try { setError(null); const nextSession = session ?? await createSession(API_URL, name); setSession(nextSession); setRoom(await operation(nextSession)); } catch (caught) { setError(caught instanceof Error ? caught.message : "接続に失敗しました"); } };
  const wsUrl = useMemo(() => room ? `${API_URL.replace(/^http/, "ws")}${room.websocketPath}?token=${encodeURIComponent(room.token)}` : "", [room]);
  const match = useOnlineMatch<unknown, unknown>({ url: wsUrl, roomId: room?.roomId ?? "", playerId: session?.playerId ?? "", playerName: name, gameId, token: room?.token });
  if (!room || !session) return <main><h1>{gameId} オンライン対戦</h1><label>名前 <input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} /></label><button onClick={() => void connect((activeSession) => createRoom(API_URL, activeSession, gameId))}>ルームを作る</button><label>ルームコード <input value={roomCode} onChange={(event) => setRoomCode(event.target.value)} /></label><button onClick={() => void connect((activeSession) => joinRoom(API_URL, activeSession, roomCode))}>参加する</button><button onClick={onExit}>戻る</button>{error ? <p role="alert">{error}</p> : null}</main>;
  const state = match.snapshot.state as { myHand?: PlayingCard[]; field?: PlayingCard[]; currentPlayerId?: string; canDraw?: boolean; canDeclare?: boolean; playableIds?: string[]; winnerId?: string | null } | null;
  const canAct = match.status === "connected" && match.snapshot.status === "playing";
  return <main><h1>ページワン オンライン</h1><p>ルームコード: <strong>{room.roomId}</strong></p><p>接続状態: {match.status}</p><p>参加者: {match.snapshot.players.map((player) => `${player.name}${player.connected ? "" : "（切断）"}`).join("、") || "接続待ち"}</p><p>試合状態: {match.snapshot.status}</p>{match.snapshot.status === "waiting" && match.snapshot.hostId === session.playerId ? <button onClick={() => match.start()}>試合を始める</button> : null}{state ? <><p>手番: {state.currentPlayerId === session.playerId ? "あなた" : "相手"}</p><div>{state.field?.map((card) => <Card key={card.id} card={card} size="lg" />)}</div><div>{state.myHand?.map((card) => <Card key={card.id} card={card} disabled={!canAct || state.currentPlayerId !== session.playerId || !(state.playableIds ?? []).includes(card.id)} onClick={() => match.sendAction({ type: "play_card", cardId: card.id })} />)}</div>{state.canDraw ? <button disabled={!canAct} onClick={() => match.sendAction({ type: "draw_card" })}>山札から引く</button> : null}{state.canDeclare ? <button disabled={!canAct} onClick={() => match.sendAction({ type: "call_page_one" })}>ページワン宣言</button> : null}{state.winnerId ? <p>勝者: {state.winnerId}</p> : null}</> : null}{match.lastMessage?.type === "action_rejected" ? <p role="alert">{match.lastMessage.reason}</p> : null}<button onClick={() => { match.leave(); setRoom(null); }}>退出する</button></main>;
}
