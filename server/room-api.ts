import { games } from './games.generated';
import { HttpError } from './http';
import type { MatchRoom } from './match-room';
import type { Session } from './auth';

export function gameFor(gameId: string) { const game = games[gameId]; if (!game) throw new HttpError(400, '対応していないゲームです'); return game; }
export async function ensureCreate(room: DurableObjectStub<MatchRoom>, roomId: string, gameId: string, session: Session) { const game = gameFor(gameId); return room.create(roomId, gameId, game.maxPlayers, session); }
