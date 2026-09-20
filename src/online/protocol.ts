import type { GameResult, Player } from '../core/types';
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed' | 'failed';
export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'closed';
export type PublicPlayer = Player & { readonly connected: boolean };
export type ClientMessage<A = unknown> =
  | { type: 'authenticate'; token: string }
  | { type: 'action'; actionId: string; expectedRevision: number; action: A }
  | { type: 'start'; actionId: string; expectedRevision: number }
  | { type: 'leave'; actionId: string; expectedRevision: number };
export type OnlineMatchSnapshot<S = unknown> = {
  revision: number; roomId: string; gameId: string; hostId: string;
  state: S | null; players: readonly PublicPlayer[]; status: RoomStatus;
  result: GameResult | null; maxPlayers: number;
};
export type ServerMessage<S = unknown> =
  | ({ type: 'room_state' } & OnlineMatchSnapshot<S>)
  | { type: 'action_accepted'; actionId: string; revision: number }
  | { type: 'action_rejected'; actionId?: string; reason: string }
  | { type: 'match_finished'; result: GameResult }
  | { type: 'error'; code: string; message: string };
