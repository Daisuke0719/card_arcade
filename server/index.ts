import type { Env } from './env';
import { MatchRoom } from './match-room';
import { games } from './games.generated';
import { readBody, HttpError } from './http';
import { issueSession, verifySession } from './auth';

export { MatchRoom };

function cors(request: Request, response: Response, env: Env): Response {
  const origin = request.headers.get('origin');
  // ALLOWED_ORIGINS は本番で上書きする。未設定時は公開サイトと
  // ローカル開発だけを許可し、任意のOriginを反射しない。
  const configured = (env.ALLOWED_ORIGINS ?? '').split(',').map(v => v.trim()).filter(Boolean);
  const allowed = configured.length > 0 ? configured : ['https://daisuke0719.github.io', 'http://localhost:5173'];
  const headers = new Headers(response.headers);
  if (origin && allowed.includes(origin)) headers.set('access-control-allow-origin', origin);
  headers.set('access-control-allow-credentials', 'true'); headers.set('vary', 'Origin');
  return new Response(response.body, { status: response.status, headers });
}
function out(value: unknown, status = 200) { return Response.json(value, { status, headers: { 'cache-control': 'no-store' } }); }
function auth(request: Request, env: Env) { const url = new URL(request.url); return verifySession(request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? url.searchParams.get('token'), env.SESSION_SECRET); }
function route(path: string) { return path.split('/').filter(Boolean); }

export default { async fetch(request: Request, env: Env): Promise<Response> {
  try {
    if (request.method === 'OPTIONS') return cors(request, new Response(null, { status: 204, headers: { 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' } }), env);
    const path = route(new URL(request.url).pathname);
    if (path.length === 1 && path[0] === 'health') return cors(request, out({ ok: true, service: 'card-arcade-online', version: 'v1' }), env);
    if (path.length === 2 && path[0] === 'v1' && path[1] === 'session' && request.method === 'POST') {
      const body = await readBody(request); const rawName = typeof body.name === 'string' ? body.name.trim() : '';
      if (rawName.length < 1 || rawName.length > 20) throw new HttpError(400, '名前は1〜20文字で入力してください');
      return cors(request, out(await issueSession(rawName, env.SESSION_SECRET)), env);
    }
    if (path[0] === 'v1' && path[1] === 'rooms' && path.length === 2 && request.method === 'POST') {
      const session = await auth(request, env); const body = await readBody(request); const gameId = typeof body.gameId === 'string' ? body.gameId : 'pageone';
      const roomId = crypto.randomUUID().slice(0, 8); const game = games[gameId]; if (!game) throw new HttpError(400, '対応していないゲームです');
      const room = env.MATCH_ROOM.getByName(`match:${roomId}`); const snapshot = await room.create(roomId, gameId, game.maxPlayers, session);
      return cors(request, out({ ...snapshot, websocketPath: `/v1/rooms/${roomId}/ws`, token: request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '' }, 201), env);
    }
    if (path[0] !== 'v1' || path[1] !== 'rooms' || !path[2]) throw new HttpError(404, 'APIが見つかりません');
    const session = await auth(request, env); const roomId = path[2];
    if (path.length === 3 && request.method === 'POST') {
      const body = await readBody(request); const gameId = typeof body.gameId === 'string' ? body.gameId : 'pageone'; const game = games[gameId];
      if (!game) throw new HttpError(400, '対応していないゲームです');
      const room = env.MATCH_ROOM.getByName(`match:${roomId}`);
      const snapshot = await room.create(roomId, gameId, game.maxPlayers, session);
      return cors(request, out({ ...snapshot, websocketPath: `/v1/rooms/${roomId}/ws`, token: request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '' }, 201), env);
    }
    if (path.length === 4 && path[3] === 'join' && request.method === 'POST') {
      const room = env.MATCH_ROOM.getByName(`match:${roomId}`); const snapshot = await room.join(session);
      return cors(request, out({ ...snapshot, websocketPath: `/v1/rooms/${roomId}/ws`, token: request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '' }), env);
    }
    if (path.length === 4 && path[3] === 'ws' && request.method === 'GET') {
      const room = env.MATCH_ROOM.getByName(`match:${roomId}`); const url = new URL(request.url); const upgrade = new Request(url, request); upgrade.headers.set('x-session-player', session.playerId);
      return room.fetch(upgrade);
    }
    if (path.length === 3 && request.method === 'GET') {
      const room = env.MATCH_ROOM.getByName(`match:${roomId}`); return cors(request, out(await room.view(session.playerId)), env);
    }
    throw new HttpError(404, 'APIが見つかりません');
  } catch (error) {
    const known = error instanceof HttpError; const status = known ? error.status : 500; if (!known) console.error(JSON.stringify({ event: 'request_failed', error: String(error) }));
    return cors(request, out({ error: known ? error.message : 'サーバーでエラーが発生しました' }, status), env);
  }
} } satisfies ExportedHandler<Env>;

