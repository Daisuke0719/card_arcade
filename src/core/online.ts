import type { ComponentType } from 'react';
import type { GameManifest, GameResult, Player, PlayerId, ServerGameAdapter } from './types';

/** ブラウザとWorkerで共有する、実行時にも検証できるゲーム契約。 */
export type OnlineGameDefinition<S, A> = ServerGameAdapter<S, A> & {
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly parseAction: (value: unknown) => A | null;
  readonly getResult: (state: S) => GameResult;
  /**
   * 時間が経ったら自動で進める処理があるとき、何ms後に tick を呼ぶかを返す。
   * CPU版の pendingDelayMs と同じ考え方で、不要なときは null を返す。
   * 例: 神経衰弱でめくった2枚を数秒見せてから裏に戻す。
   */
  readonly pendingDelayMs?: (state: S) => number | null;
  /** pendingDelayMs の時間が経ったときにサーバーが呼ぶ。状態を1段階進めて返す。 */
  readonly tick?: (state: S) => S;
};

/** サーバーが待つ時間の上限。これより長い値は切り詰める。 */
export const MAX_PENDING_DELAY_MS = 60_000;

export function defineOnlineGame<S, A>(game: OnlineGameDefinition<S, A>) { return game; }

/** オンライン対戦の参加者。接続状態は共通ロビーが管理する。 */
export type OnlinePlayer = { readonly id: PlayerId; readonly name: string; readonly connected: boolean };

/**
 * オンライン対戦画面が共通ロビーから受け取る値。
 * V は onlineAdapter.toPublicState の戻り値、A は送信する Action。
 */
export type OnlineGameViewProps<V, A> = {
  /** 人数表示をオンライン用に置き換えた manifest。GameShell へそのまま渡す。 */
  readonly manifest: GameManifest;
  /** サーバーが自分向けに作った公開状態。 */
  readonly view: V;
  readonly playerId: PlayerId;
  readonly players: readonly OnlinePlayer[];
  /** 接続中かつ対戦中のときだけ true。false の間は操作を無効にする。 */
  readonly canAct: boolean;
  readonly finished: boolean;
  readonly result: GameResult | null;
  /** 操作をサーバーへ送る。結果はサーバーから届く view で確定する。 */
  readonly sendAction: (action: A) => void;
  readonly onExit: () => void;
  /** 試合終了後、ルーム作成者だけに渡される同室再戦。 */
  readonly onRematch?: () => void;
};

/** manifest の online に登録する値。defineOnlineView で作る。 */
export type OnlineGameEntry = {
  readonly gameId: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly component: ComponentType<OnlineGameViewProps<unknown, unknown>>;
};

/**
 * onlineAdapter とオンライン対戦画面を組にして、manifest の online に登録する。
 * 人数は onlineAdapter の minPlayers / maxPlayers を使う。
 */
export function defineOnlineView<S, A, V>(
  adapter: OnlineGameDefinition<S, A>,
  component: ComponentType<OnlineGameViewProps<V, A>>,
): OnlineGameEntry {
  return {
    gameId: adapter.gameId,
    minPlayers: adapter.minPlayers,
    maxPlayers: adapter.maxPlayers,
    // 公開状態の型はゲームごとに違うため、共通ロビーとの境界でだけ型を消す。
    component: component as unknown as ComponentType<OnlineGameViewProps<unknown, unknown>>,
  };
}

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
    /** 自動処理までの待ち時間。tick が無いゲーム、または不要なときは null。 */
    delay: (state: unknown): number | null => {
      if (!game.tick || !game.pendingDelayMs) return null;
      const ms = game.pendingDelayMs(state as S);
      if (ms === null || !Number.isFinite(ms)) return null;
      return Math.min(Math.max(0, ms), MAX_PENDING_DELAY_MS);
    },
    tick: (state: unknown) => {
      if (!game.tick) return null;
      const next = game.tick(state as S);
      return { state: next, finished: game.isFinished(next), result: game.getResult(next) };
    },
  };
}
