import { useMemo, useState } from "react";
import type { GameManifest, OnlineGameEntry } from "@core";
import {
  clearSavedRoom,
  createRoom,
  createSession,
  joinRoom,
  loadSavedRoom,
  OnlineApiError,
  saveRoom,
  useOnlineMatch,
  type OnlineSession,
  type RoomInfo,
} from "../online";
import { GameErrorBoundary } from "../app/GameErrorBoundary";
import { getGame } from "../app/registry/loadGames";
import { NotFoundPage } from "./NotFoundPage";
import endpoints from "../../config/online-endpoints.json";
import styles from "./OnlineLobbyPage.module.css";

const API_URL = import.meta.env.VITE_ONLINE_API_URL ?? endpoints.staging;

type LobbyProps = { gameId: string; onExit: () => void };

/** 全ゲーム共通のルーム作成・参加・待機画面。対戦中の盤面は各ゲームの online.component が描く。 */
export function OnlineLobbyPage({ gameId, onExit }: LobbyProps) {
  const game = getGame(gameId);
  const online = game?.manifest.online;
  if (!game || !online) {
    return <NotFoundPage message={"「" + gameId + "」はオンライン対戦に対応していません。"} onExit={onExit} />;
  }
  return <OnlineLobby manifest={game.manifest} online={online} onExit={onExit} />;
}

function playersLabel(online: OnlineGameEntry): string {
  return online.minPlayers === online.maxPlayers ? `${online.minPlayers}人` : `${online.minPlayers}〜${online.maxPlayers}人`;
}

function errorMessage(caught: unknown): string {
  if (caught instanceof OnlineApiError) {
    if (caught.kind === "connection") return "APIに接続できません。通信状態を確認して再試行してください。";
    if (caught.kind === "network") return "ネットワークに接続できません。通信状態を確認してください。";
    return caught.message;
  }
  return caught instanceof Error ? caught.message : "接続に失敗しました";
}

const connectionLabel = {
  idle: "接続中…",
  connecting: "接続中…",
  connected: "接続済み",
  reconnecting: "再接続中…",
  closed: "切断しました",
  failed: "接続できません。ページを再読み込みしてください",
} as const;

function OnlineLobby({ manifest, online, onExit }: { manifest: GameManifest; online: OnlineGameEntry; onExit: () => void }) {
  const gameId = manifest.id;
  // 再読み込みしても同じプレイヤーとして戻れるよう、タブに保存したルームから再開する。
  const [saved] = useState(() => loadSavedRoom(gameId));
  const [name, setName] = useState(saved?.name ?? "");
  const [roomCode, setRoomCode] = useState("");
  const [session, setSession] = useState<OnlineSession | null>(saved?.session ?? null);
  const [room, setRoom] = useState<RoomInfo | null>(saved?.room ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onlineManifest = useMemo(
    () => ({ ...manifest, minPlayers: online.minPlayers, maxPlayers: online.maxPlayers }),
    [manifest, online],
  );
  const title = `${manifest.icon ?? ""} ${manifest.name}`.trim();

  const connect = async (operation: (activeSession: OnlineSession) => Promise<RoomInfo>) => {
    const trimmedName = name.trim();
    if (!trimmedName) { setError("表示名を入力してください"); return; }
    setBusy(true); setError(null);
    try {
      const activeSession = session ?? await createSession(API_URL, trimmedName);
      setSession(activeSession);
      const nextRoom = await operation(activeSession);
      saveRoom(gameId, { name: trimmedName, session: activeSession, room: nextRoom });
      setRoom(nextRoom);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const wsUrl = useMemo(() => room ? `${API_URL.replace(/^http/, "ws")}${room.websocketPath}?token=${encodeURIComponent(room.token)}` : "", [room]);
  const match = useOnlineMatch<unknown, unknown>({ url: wsUrl, roomId: room?.roomId ?? "", playerId: session?.playerId ?? "", playerName: name, gameId, token: room?.token });

  const backToLobby = () => { clearSavedRoom(gameId); setRoom(null); };
  const leaveRoom = () => { match.leave(); backToLobby(); };

  if (!room || !session) {
    return <main className={styles.page}><section className={styles.panel}>
      <button className={styles.back} onClick={onExit}>← ゲーム選択へ戻る</button>
      <p className={styles.eyebrow}>{title}</p>
      <h1>オンライン対戦</h1>
      <p className={styles.lead}>{playersLabel(online)}で遊べます。代表者はルームを作り、参加者は同じコードを入力してください。</p>
      <label className={styles.label} htmlFor="online-name">あなたの名前</label>
      <input id="online-name" className={styles.input} value={name} onChange={(event) => setName(event.target.value)} maxLength={20} placeholder="例：たろう" />
      <div className={styles.actions}>
        <button className={styles.primary} disabled={busy} onClick={() => void connect((active) => createRoom(API_URL, active, gameId))}>{busy ? "準備中…" : "新しいルームを作る"}</button>
      </div>
      <div className={styles.divider}><span>または</span></div>
      <label className={styles.label} htmlFor="room-code">参加するルームコード</label>
      <div className={styles.joinRow}>
        <input id="room-code" className={styles.input} value={roomCode} onChange={(event) => setRoomCode(event.target.value)} maxLength={12} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="例：a1b2c3d4" />
        <button className={styles.secondary} disabled={busy || !roomCode.trim()} onClick={() => void connect((active) => joinRoom(API_URL, active, roomCode.trim()))}>ルームに参加</button>
      </div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </section></main>;
  }

  // 認証できない、またはルームが閉じたときは、保存したルームを破棄してロビーへ戻す。
  const ended = match.fatalError?.code === "unauthorized" || match.snapshot.status === "closed";
  if (ended) {
    const message = match.fatalError?.message ?? match.snapshot.result?.message ?? "ルームは終了しました";
    return <main className={styles.page}><section className={styles.panel}>
      <p className={styles.eyebrow}>{title}</p>
      <h1>ルームは終了しました</h1>
      <p className={styles.lead}>{message}</p>
      <div className={styles.actions}><button className={styles.primary} onClick={backToLobby}>ロビーへ戻る</button></div>
    </section></main>;
  }

  const snapshot = match.snapshot;
  const isHost = snapshot.hostId === session.playerId;

  if (snapshot.state !== null && snapshot.state !== undefined) {
    const View = online.component;
    const finished = snapshot.status === "finished";
    return <>
      {match.status !== "connected" || match.rejection ? (
        <div className={styles.statusBar} role="status">
          {match.status !== "connected" ? <span>{connectionLabel[match.status]}</span> : null}
          {match.rejection ? <span className={styles.error} role="alert">{match.rejection}</span> : null}
        </div>
      ) : null}
      <GameErrorBoundary gameName={manifest.name} onExit={() => { leaveRoom(); onExit(); }}>
      <View
        manifest={onlineManifest}
        view={snapshot.state}
        playerId={session.playerId}
        players={snapshot.players.map((player) => ({ id: player.id, name: player.name, connected: player.connected }))}
        canAct={match.status === "connected" && snapshot.status === "playing"}
        finished={finished}
        result={snapshot.result}
        sendAction={(action) => { match.sendAction(action); }}
        onExit={() => { leaveRoom(); onExit(); }}
        onRematch={finished && isHost ? () => { match.rematch(); } : undefined}
      />
      </GameErrorBoundary>
    </>;
  }

  const connectedPlayers = snapshot.players.filter((player) => player.connected).length;
  const canStart = snapshot.status === "waiting" && isHost && connectedPlayers >= online.minPlayers && connectedPlayers === snapshot.players.length;
  return <main className={styles.page}><section className={styles.panel}>
    <div className={styles.roomHeader}>
      <div><p className={styles.eyebrow}>{title}</p><h1>オンライン対戦ルーム</h1></div>
      <div className={styles.code}><span>ルームコード</span><strong>{room.roomId}</strong></div>
    </div>
    <p className={styles.connection}>接続状態：{connectionLabel[match.status]}</p>
    <div className={styles.players}>
      <h2>参加者（{snapshot.players.length}/{online.maxPlayers}）</h2>
      {snapshot.players.map((player) => <div className={styles.player} key={player.id}><span>{player.name}{player.id === session.playerId ? "（あなた）" : ""}</span><span>{player.connected ? "接続中" : "待機中"}</span></div>)}
    </div>
    <div className={styles.waiting}>
      <strong>{canStart ? "準備ができました" : "参加者を待っています"}</strong>
      <span>{canStart ? "開始ボタンを押してください。" : `参加者が${online.minPlayers}人以上そろい、全員が接続すると開始できます。`}</span>
      {isHost ? <button className={styles.primary} disabled={!canStart} onClick={() => match.start()}>対戦を開始する</button> : <span>ルーム作成者が対戦を開始します。</span>}
      {match.rejection ? <span className={styles.error} role="alert">{match.rejection}</span> : null}
    </div>
    <button className={styles.back} onClick={leaveRoom}>ルームを退出する</button>
  </section></main>;
}
