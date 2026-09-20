import type { GameResult, Player, ServerGameAdapter } from './types';

/** ブラウザとWorkerで共有する、実行時にも検証できるゲーム契約。 */
export type OnlineGameDefinition<S, A> = ServerGameAdapter<S, A> & {
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly parseAction: (value: unknown) => A | null;
  readonly getResult: (state: S) => GameResult;
};

export function defineOnlineGame<S, A>(game: OnlineGameDefinition<S, A>) { return game; }

/** Workerのゲーム一覧で型の違うゲームを安全に扱うための境界。 */
export function serverGame<S, A>(game: OnlineGameDefinition<S, A>) {
  return {
    gameId: game.gameId, minPlayers: game.minPlayers, maxPlayers: game.maxPlayers,
    create: (seed: number, players: readonly Player[]): unknown => game.createInitialState(seed, players),
    apply: (raw: unknown, value: unknown, playerId: string) => {
      const action = game.parseAction(value);
      if (!action) return { ok: false as const, reason: '操作形式が正しくありません' };
      // 状態はこのゲームのcreate/reduceによってのみ作成され、Worker内に保存される。
      const state = raw as S;
      const check = game.validateAction(state, action, playerId);
      if (!check.ok) return { ok: false as const, reason: check.reason ?? '不正な操作です' };
      const next = game.reduce(state, action, playerId);
      return { ok: true as const, state: next, finished: game.isFinished(next), result: game.getResult(next) };
    },
    view: (state: unknown, viewerId: string) => game.toPublicState(state as S, viewerId),
  };
}
