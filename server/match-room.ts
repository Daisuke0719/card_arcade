import { DurableObject } from 'cloudflare:workers';
import type { GameResult, Player } from '../src/core/types';
import type { OnlineMatchSnapshot, ServerMessage, RoomStatus } from '../src/online/protocol';
import { games } from './games.generated';
import { verifySession, type Session } from './auth';
import { HttpError } from './http';
import type { Env } from './env';

type Seat = Player & { disconnectedAt: number | null };
type Room = {
  roomId: string; gameId: string; maxPlayers: number; hostId: string;
  status: RoomStatus; revision: number; players: Seat[]; state: unknown;
  result: GameResult | null; processed: string[]; createdAt: number;
  startedAt: number | null; finishedAt: number | null; touchedAt: number;
  syncVersion: number; syncedVersion: number;
};
type Attachment = { playerId?: string; expiresAt: number; count: number; window: number };

export class MatchRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  private load(): Room | null {
    const rows = this.ctx.storage.sql.exec<{ data: string }>('SELECT data FROM room WHERE id=1').toArray();
    return rows.length ? JSON.parse(rows[0].data) as Room : null;
  }
  private save(room: Room, sync = false): void {
    if (sync) room.syncVersion++;
    this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room (id,data) VALUES (1,?)', JSON.stringify(room));
    this.ctx.waitUntil(this.ctx.storage.setAlarm(Date.now() + 1000));
  }
  private required(): Room {
    const room = this.load(); if (!room) throw new HttpError(404, 'ルームが見つかりません'); return room;
  }
  private connected(playerId: string): boolean {
    return this.ctx.getWebSockets().some(ws => { const attachment = ws.deserializeAttachment() as Attachment; return attachment.playerId === playerId && ws.readyState === 1 && attachment.expiresAt > Date.now(); });
  }
  private snapshot(room: Room, playerId: string): OnlineMatchSnapshot {
    return { roomId: room.roomId, gameId: room.gameId, revision: room.revision, hostId: room.hostId,
      status: room.status, maxPlayers: room.maxPlayers, result: room.result,
      players: room.players.map(p => ({ id: p.id, name: p.name, kind: 'human', connected: this.connected(p.id) })),
      state: room.state ? games[room.gameId].view(room.state, playerId) : null };
  }
  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === 1) { try { ws.send(JSON.stringify(message)); } catch { ws.close(1011, 'send failed'); } }
  }
  private broadcast(room: Room): void {
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as Attachment;
      if (a.playerId && room.players.some(p => p.id === a.playerId)) {
        this.send(ws, { type: 'room_state', ...this.snapshot(room, a.playerId) });
        if (room.status === 'finished' && room.result) this.send(ws, { type: 'match_finished', result: room.result });
      }
    }
  }
  create(roomId: string, gameId: string, maxPlayers: number, session: Session): OnlineMatchSnapshot {
    if (this.load()) throw new HttpError(409, 'ルームが既に存在します');
    const now = Date.now();
    const room: Room = { roomId, gameId, maxPlayers, hostId: session.playerId, status: 'waiting', revision: 0,
      players: [{ id: session.playerId, name: session.name, kind: 'human', disconnectedAt: now }],
      state: null, result: null, processed: [], createdAt: now, touchedAt: now, startedAt: null, finishedAt: null, syncVersion: 0, syncedVersion: 0 };
    this.save(room, true); return this.snapshot(room, session.playerId);
  }
  join(session: Session): OnlineMatchSnapshot {
    const room = this.required();
    if (room.status === 'closed') throw new HttpError(410, 'ルームは終了しました');
    if (!room.players.some(p => p.id === session.playerId)) {
      if (room.status !== 'waiting') throw new HttpError(409, '試合が始まっています');
      if (room.players.length >= room.maxPlayers) throw new HttpError(409, 'ルームは満員です');
      room.players.push({ id: session.playerId, name: session.name, kind: 'human', disconnectedAt: Date.now() });
      room.revision++; room.touchedAt = Date.now(); this.save(room, true); this.broadcast(room);
    }
    return this.snapshot(room, session.playerId);
  }
  view(playerId: string): OnlineMatchSnapshot {
    const room = this.required();
    if (!room.players.some(p => p.id === playerId)) throw new HttpError(403, 'ルームに参加してください');
    return this.snapshot(room, playerId);
  }
  override fetch(request: Request): Response {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return Response.json({ error: 'WebSocket接続が必要です' }, { status: 426 });
    if (!this.load()) return Response.json({ error: 'ルームが見つかりません' }, { status: 404 });
    if (this.ctx.getWebSockets().length >= 12) return Response.json({ error: '接続数の上限です' }, { status: 429 });
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ expiresAt: Date.now() + 10_000, count: 0, window: Date.now() } satisfies Attachment);
    this.ctx.waitUntil(this.ctx.storage.setAlarm(Date.now() + 1000));
    return new Response(null, { status: 101, webSocket: client });
  }
  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    let a = ws.deserializeAttachment() as Attachment;
    if (a.expiresAt <= Date.now()) { ws.close(4001, 'session expired'); return; }
    if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 4096) { ws.close(1009, 'message too large'); return; }
    if (Date.now() - a.window > 1000) { a.window = Date.now(); a.count = 0; }
    a.count++; ws.serializeAttachment(a);
    if (a.count > 20) { ws.close(1008, 'rate limit'); return; }
    let msg: Record<string, unknown>;
    try {
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
      msg = value as Record<string, unknown>;
    } catch { this.send(ws, { type: 'error', code: 'invalid_json', message: 'JSON形式が正しくありません' }); return; }
    if (!a.playerId) {
      try {
        if (msg.type !== 'authenticate' || typeof msg.token !== 'string') throw new HttpError(401, '認証が必要です');
        const session = await verifySession(msg.token, this.env.SESSION_SECRET);
        const room = this.required();
        const seat = room.players.find(p => p.id === session.playerId);
        if (!seat || room.status === 'closed') throw new HttpError(403, 'このルームに参加できません');
        // 同じセッションの古い接続は新しい接続で置き換える。
        for (const old of this.ctx.getWebSockets()) {
          if (old !== ws && (old.deserializeAttachment() as Attachment).playerId === session.playerId) old.close(4002, 'replaced');
        }
        a = { playerId: session.playerId, expiresAt: session.expiresAt, count: 0, window: Date.now() };
        ws.serializeAttachment(a); seat.disconnectedAt = null;
        this.save(room); this.broadcast(room);
      } catch { this.send(ws, { type: 'error', code: 'unauthorized', message: '認証できません。ロビーから入り直してください' }); ws.close(4001, 'unauthorized'); }
      return;
    }
    const room = this.required(); const actor = a.playerId;
    if (!room.players.some(p => p.id === actor)) { ws.close(4003, 'not a member'); return; }
    const actionId = typeof msg.actionId === 'string' && /^[a-zA-Z0-9-]{1,64}$/.test(msg.actionId) ? msg.actionId : undefined;
    const reject = (reason: string) => { this.send(ws, { type: 'action_rejected', actionId, reason }); this.send(ws, { type: 'room_state', ...this.snapshot(room, actor) }); };
    if (!actionId || !Number.isSafeInteger(msg.expectedRevision)) { reject('操作形式が正しくありません'); return; }
    const dedupe = `${actor}:${actionId}`;
    if (room.processed.includes(dedupe)) { this.send(ws, { type: 'action_accepted', actionId, revision: room.revision }); this.send(ws, { type: 'room_state', ...this.snapshot(room, actor) }); return; }
    if (room.revision !== msg.expectedRevision) { reject('画面を最新状態に更新しました。もう一度操作してください'); return; }
    if (room.status === 'closed' || room.status === 'finished') { reject('試合は終了しています'); return; }
    let sync = false;
    if (msg.type === 'start') {
      if (room.status !== 'waiting' || room.hostId !== actor || room.players.length < games[room.gameId].minPlayers || room.players.some(p => !this.connected(p.id))) { reject('ホストが、全員の接続後に開始してください'); return; }
      room.state = games[room.gameId].create(crypto.getRandomValues(new Uint32Array(1))[0], room.players);
      room.status = 'playing'; room.startedAt = Date.now(); sync = true;
    } else if (msg.type === 'leave') {
      if (room.status === 'waiting') {
        room.players = room.players.filter(p => p.id !== actor);
        if (room.hostId === actor) room.hostId = room.players[0]?.id ?? '';
        if (!room.players.length) room.status = 'closed';
      } else this.abort(room, '参加者が退出したため試合を終了しました');
      sync = true;
    } else if (msg.type === 'action') {
      if (room.status !== 'playing') { reject('試合を開始してください'); return; }
      const applied = games[room.gameId].apply(room.state, msg.action, actor);
      if (!applied.ok) { reject(applied.reason); return; }
      room.state = applied.state;
      if (applied.finished) { room.status = 'finished'; room.result = applied.result; room.finishedAt = Date.now(); sync = true; }
    } else { reject('未知の操作です'); return; }
    room.revision++; room.touchedAt = Date.now(); room.processed = [...room.processed, dedupe].slice(-256);
    // 同期SQL書き込みが完了した後にのみ成功応答する。
    this.save(room, sync);
    this.send(ws, { type: 'action_accepted', actionId, revision: room.revision }); this.broadcast(room);
    if (msg.type === 'leave') ws.close(4003, 'left');
  }
  private abort(room: Room, message: string): void {
    room.status = 'closed'; room.finishedAt = Date.now(); room.result = { outcome: 'done', message };
  }
  override webSocketClose(ws: WebSocket): void { this.disconnected(ws); }
  override webSocketError(ws: WebSocket): void { ws.close(1011, 'connection error'); this.disconnected(ws); }
  private disconnected(ws: WebSocket): void {
    const a = ws.deserializeAttachment() as Attachment; const room = this.load();
    if (!a.playerId || !room) return;
    const another = this.ctx.getWebSockets().some(other => other !== ws && other.readyState === 1 && (other.deserializeAttachment() as Attachment).playerId === a.playerId);
    if (!another) { const seat = room.players.find(p => p.id === a.playerId); if (seat) { seat.disconnectedAt = Date.now(); this.save(room); } }
    this.broadcast(room);
  }
  override async alarm(): Promise<void> {
    let room = this.load(); if (!room) return;
    const now = Date.now();
    for (const ws of this.ctx.getWebSockets()) {
      if ((ws.deserializeAttachment() as Attachment).expiresAt <= now) ws.close(4001, 'session expired');
    }
    if (room.status === 'playing' && room.players.some(p => p.disconnectedAt !== null && now - p.disconnectedAt > 60_000)) {
      this.abort(room, '切断から60秒が経過したため試合を終了しました'); room.revision++; this.save(room, true); this.broadcast(room);
    }
    if (room.status === 'waiting') {
      const remaining = room.players.filter(p => p.disconnectedAt === null || now - p.disconnectedAt <= 60_000);
      if (remaining.length !== room.players.length) {
        room.players = remaining; if (!remaining.some(p => p.id === room.hostId)) room.hostId = remaining[0]?.id ?? '';
        if (!remaining.length) this.abort(room, '参加者がいないため終了しました');
        room.revision++; this.save(room, true); this.broadcast(room);
      }
    }
    if ((room.status === 'playing' || room.status === 'waiting') && now - room.touchedAt > 30 * 60_000) {
      this.abort(room, '30分間操作がないため終了しました'); room.revision++; this.save(room, true); this.broadcast(room);
    }
    if (room.syncVersion !== room.syncedVersion) {
      const version = room.syncVersion;
      try {
        await this.syncD1(room);
        room = this.required(); room.syncedVersion = version;
        this.ctx.storage.sql.exec('UPDATE room SET data=? WHERE id=1', JSON.stringify(room));
      } catch { console.error(JSON.stringify({ event: 'result_sync_failed', roomId: room.roomId })); }
    }
    // 接続の期限、再接続猶予、D1の再試行を再起動後も処理する。
    if (room.syncVersion !== room.syncedVersion || room.status === 'waiting' || room.status === 'playing' || this.ctx.getWebSockets().some(ws => ws.readyState === 1)) await this.ctx.storage.setAlarm(Date.now() + 30_000);
  }
  private async syncD1(room: Room): Promise<void> {
    const statements = [this.env.DB.prepare('INSERT INTO matches (id,game_id,status,rules_version,max_players,created_by,created_at,started_at,finished_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,started_at=excluded.started_at,finished_at=excluded.finished_at')
      .bind(room.roomId, room.gameId, room.status, 'v1', room.maxPlayers, room.hostId, room.createdAt, room.startedAt, room.finishedAt)];
    room.players.forEach((p, seat) => {
      statements.push(this.env.DB.prepare('INSERT INTO users (id,display_name,created_at,last_seen_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen_at=excluded.last_seen_at').bind(p.id, p.name, room.createdAt, Date.now()));
      statements.push(this.env.DB.prepare('INSERT INTO match_players (match_id,player_id,seat,display_name,joined_at,result) VALUES (?,?,?,?,?,?) ON CONFLICT(match_id,player_id) DO UPDATE SET result=excluded.result').bind(room.roomId, p.id, seat, p.name, room.createdAt, room.result ? JSON.stringify(room.result) : null));
    });
    statements.push(this.env.DB.prepare('INSERT OR IGNORE INTO match_events (match_id,revision,player_id,action_type,created_at) VALUES (?,?,?,?,?)').bind(room.roomId, room.revision, null, room.status, Date.now()));
    await this.env.DB.batch(statements);
  }
}
