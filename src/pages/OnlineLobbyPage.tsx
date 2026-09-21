import { useMemo, useState } from "react";
import { createRoom, createSession, joinRoom, OnlineApiError, type OnlineSession, type RoomInfo, useOnlineMatch } from "../online";
import type { PlayingCard } from "@core";
import { PageOneTable } from "../games/pageone/PageOneTable";
import { game as pageOneManifest } from "../games/pageone";
import { GameShell, ScoreBoard } from "@ui";
import endpoints from "../../config/online-endpoints.json";
import styles from "./OnlineLobbyPage.module.css";

const API_URL = import.meta.env.VITE_ONLINE_API_URL ?? endpoints.staging;
type OnlineView = {
  myHand?: PlayingCard[];
  field?: PlayingCard[];
  currentPlayerId?: string;
  canDraw?: boolean;
  canDeclare?: boolean;
  playableIds?: string[];
  winnerId?: string | null;
  deckCount?: number;
  opponents?: { id: string; name: string; handCount: number }[];
  log?: string[];
};

export function OnlineLobbyPage({ gameId, onExit }: { gameId: string; onExit: () => void }) {
  const [name, setName] = useState(""); const [roomCode, setRoomCode] = useState(""); const [session, setSession] = useState<OnlineSession | null>(null); const [room, setRoom] = useState<RoomInfo | null>(null); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const connect = async (operation: (activeSession: OnlineSession) => Promise<RoomInfo>) => { const trimmedName = name.trim(); if (!trimmedName) { setError("表示名を入力してください"); return; } setBusy(true); setError(null); try { const activeSession = session ?? await createSession(API_URL, trimmedName); setSession(activeSession); setRoom(await operation(activeSession)); } catch (caught) { if (caught instanceof OnlineApiError) { setError(caught.kind === "connection" ? "APIに接続できません。通信状態を確認して再試行してください。" : caught.kind === "network" ? "ネットワークに接続できません。通信状態を確認してください。" : caught.message); } else { setError(caught instanceof Error ? caught.message : "接続に失敗しました"); } } finally { setBusy(false); } };
  const wsUrl = useMemo(() => room ? `${API_URL.replace(/^http/, "ws")}${room.websocketPath}?token=${encodeURIComponent(room.token)}` : "", [room]);
  const match = useOnlineMatch<unknown, unknown>({ url: wsUrl, roomId: room?.roomId ?? "", playerId: session?.playerId ?? "", playerName: name, gameId, token: room?.token });
  if (!room || !session) return <main className={styles.page}><section className={styles.panel}><button className={styles.back} onClick={onExit}>← ゲーム選択へ戻る</button><p className={styles.eyebrow}>1️⃣ ページワン</p><h1>オンライン対戦</h1><p className={styles.lead}>2〜4人で遊べます。代表者はルームを作り、参加者は同じコードを入力してください。</p><label className={styles.label} htmlFor="online-name">あなたの名前</label><input id="online-name" className={styles.input} value={name} onChange={(event) => setName(event.target.value)} maxLength={20} placeholder="例：たろう" /><div className={styles.actions}><button className={styles.primary} disabled={busy} onClick={() => void connect((active) => createRoom(API_URL, active, gameId))}>{busy ? "準備中…" : "新しいルームを作る"}</button></div><div className={styles.divider}><span>または</span></div><label className={styles.label} htmlFor="room-code">参加するルームコード</label><div className={styles.joinRow}><input id="room-code" className={styles.input} value={roomCode} onChange={(event) => setRoomCode(event.target.value)} maxLength={12} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="例：a1b2c3d4" /><button className={styles.secondary} disabled={busy || !roomCode.trim()} onClick={() => void connect((active) => joinRoom(API_URL, active, roomCode.trim()))}>ルームに参加</button></div>{error ? <p className={styles.error} role="alert">{error}</p> : null}</section></main>;
  const state = match.snapshot.state as OnlineView | null; const connectedPlayers = match.snapshot.players.filter((player) => player.connected).length; const canStart = match.snapshot.status === "waiting" && match.snapshot.hostId === session.playerId && connectedPlayers >= 2; const canAct = match.status === "connected" && match.snapshot.status === "playing";
  const table = state ? <PageOneTable opponents={state.opponents ?? []} field={state.field ?? []} deckCount={state.deckCount ?? 0} hand={state.myHand ?? []} disabledIds={(state.myHand ?? []).map((card) => card.id).filter((id) => !canAct || state.currentPlayerId !== session.playerId || !(state.playableIds ?? []).includes(id))} canDraw={Boolean(state.canDraw) && canAct} canDeclare={Boolean(state.canDeclare) && canAct} turnMessage={state.currentPlayerId === session.playerId ? "あなたの番です" : match.snapshot.status === "finished" ? "決着しました" : "相手の番です"} hintMessage={state.currentPlayerId === session.playerId ? "場札と同じマークか同じ数字のカードを選んでください" : "相手が考えています"} log={state.log ?? []} onPlay={(cardId) => match.sendAction({ type: "play_card", cardId })} onDraw={() => match.sendAction({ type: "draw_card" })} onDeclare={() => match.sendAction({ type: "call_page_one" })} /> : null;
  if (state) {
    const scoreEntries = [{ id: session.playerId, name: name || "あなた", detail: `残り${state.myHand?.length ?? 0}枚`, isCurrent: match.snapshot.status !== "finished" && state.currentPlayerId === session.playerId, isFinished: state.winnerId === session.playerId }, ...(state.opponents ?? []).map((player) => ({ id: player.id, name: player.name, detail: `残り${player.handCount}枚`, isCurrent: match.snapshot.status !== "finished" && state.currentPlayerId === player.id, isFinished: state.winnerId === player.id }))];
    return <GameShell manifest={pageOneManifest} onExit={() => { match.leave(); setRoom(null); onExit(); }} onReset={match.snapshot.status === "finished" && match.snapshot.hostId === session.playerId ? () => match.rematch() : undefined} headerRight={<ScoreBoard entries={scoreEntries} title="残り枚数" />}>
      {table}
      {match.lastMessage?.type === "action_rejected" ? <p className={styles.error} role="alert">{match.lastMessage.reason}</p> : null}
    </GameShell>;
  }
  return <main className={styles.page}><section className={styles.panel}><div className={styles.roomHeader}><div><p className={styles.eyebrow}>1️⃣ ページワン</p><h1>オンライン対戦ルーム</h1></div><div className={styles.code}><span>ルームコード</span><strong>{room.roomId}</strong></div></div><p className={styles.connection}>接続状態：{match.status === "connected" ? "接続済み" : match.status === "reconnecting" ? "再接続中…" : "接続中…"}</p><div className={styles.players}><h2>参加者（{match.snapshot.players.length}/4）</h2>{match.snapshot.players.map((player) => <div className={styles.player} key={player.id}><span>{player.name}{player.id === session.playerId ? "（あなた）" : ""}</span><span>{player.connected ? "接続中" : "待機中"}</span></div>)}</div><div className={styles.waiting}><strong>{canStart ? "準備ができました" : "参加者を待っています"}</strong><span>{canStart ? "開始ボタンを押してください。" : "参加者が2人以上そろうと開始できます。"}</span>{match.snapshot.hostId === session.playerId ? <button className={styles.primary} disabled={!canStart} onClick={() => match.start()}>対戦を開始する</button> : <span>ルーム作成者が対戦を開始します。</span>}</div><button className={styles.back} onClick={() => { match.leave(); setRoom(null); }}>ルームを退出する</button></section></main>;
}
