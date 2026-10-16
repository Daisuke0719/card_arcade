import { describe, expect, it } from "vitest";
import { MAX_PENDING_DELAY_MS, defineOnlineGame, serverGame } from "../../src/core/online";

type State = { readonly step: number; readonly waiting: boolean };
type Action = { readonly type: "flip" };

const base = {
  gameId: "tick-game", minPlayers: 2, maxPlayers: 2,
  createInitialState: (): State => ({ step: 0, waiting: false }),
  parseAction: (value: unknown) => (value && typeof value === "object" && (value as Action).type === "flip" ? { type: "flip" as const } : null),
  validateAction: (state: State) => (state.waiting ? { ok: false, reason: "判定中です" } : { ok: true }),
  reduce: (state: State): State => ({ ...state, waiting: true }),
  isFinished: (state: State) => state.step >= 2,
  getResult: () => ({ outcome: "done" as const }),
  toPublicState: (state: State) => state,
};

describe("サーバーの時間経過による自動処理", () => {
  it("pendingDelayMs と tick を持たないゲームは待たない", () => {
    const game = serverGame(defineOnlineGame<State, Action>(base));
    expect(game.delay({ step: 0, waiting: true })).toBeNull();
    expect(game.tick({ step: 0, waiting: true })).toBeNull();
  });

  it("判定中は待ち時間を返し、tick で状態を1段階進める", () => {
    const game = serverGame(defineOnlineGame<State, Action>({
      ...base,
      pendingDelayMs: (state) => (state.waiting ? 2000 : null),
      tick: (state) => ({ step: state.step + 1, waiting: false }),
    }));
    const flipped = game.apply({ step: 0, waiting: false }, { type: "flip" }, "p1");
    expect(flipped.ok).toBe(true);
    if (!flipped.ok) return;
    expect(game.delay(flipped.state)).toBe(2000);
    expect(game.apply(flipped.state, { type: "flip" }, "p1")).toEqual({ ok: false, reason: "判定中です" });

    const ticked = game.tick(flipped.state);
    expect(ticked?.state).toEqual({ step: 1, waiting: false });
    expect(ticked?.finished).toBe(false);
    expect(game.delay(ticked?.state)).toBeNull();
  });

  it("tick で終了条件を満たしたら finished を返す", () => {
    const game = serverGame(defineOnlineGame<State, Action>({
      ...base,
      pendingDelayMs: () => 0,
      tick: (state) => ({ step: state.step + 1, waiting: false }),
    }));
    expect(game.tick({ step: 1, waiting: true })?.finished).toBe(true);
  });

  it("待ち時間は 0 から上限までに切り詰める", () => {
    const make = (ms: number) => serverGame(defineOnlineGame<State, Action>({ ...base, pendingDelayMs: () => ms, tick: (s) => s }));
    expect(make(-5).delay({ step: 0, waiting: true })).toBe(0);
    expect(make(10 * 60_000).delay({ step: 0, waiting: true })).toBe(MAX_PENDING_DELAY_MS);
    expect(make(Number.NaN).delay({ step: 0, waiting: true })).toBeNull();
  });
});
