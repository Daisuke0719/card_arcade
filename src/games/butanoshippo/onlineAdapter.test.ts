import { card } from "@core";
import type { Player } from "@core";
import { COLLECT_DELAY_MS } from "./logic";
import { onlineAdapter as game } from "./onlineAdapter";
import type { ButanoshippoView } from "./onlineAdapter";
import type { ButanoshippoState } from "./logic";

const viewOf = (state: ButanoshippoState, viewerId: string) => game.toPublicState(state, viewerId) as ButanoshippoView;

const players: Player[] = [
  { id: "a", name: "アリス", kind: "human" },
  { id: "b", name: "ボブ", kind: "human" },
  { id: "c", name: "キャロル", kind: "human" },
];

const start = () => game.createInitialState(1, players);

describe("ぶたのしっぽのオンライン対戦", () => {
  it("2〜4人で開始でき、先頭の参加者から始まる", () => {
    const state = start();
    expect(state.ring).toHaveLength(52);
    expect(state.turn.currentId).toBe("a");
    expect(Object.values(state.collected)).toEqual([0, 0, 0]);
    expect(game.createInitialState(1, players.slice(0, 2)).turn.players).toHaveLength(2);
  });

  it("1人・5人・同じIDの重複では開始できない", () => {
    expect(() => game.createInitialState(1, players.slice(0, 1))).toThrow();
    const five = ["a", "b", "c", "d", "e"].map((id): Player => ({ id, name: id, kind: "human" }));
    expect(() => game.createInitialState(1, five)).toThrow();
    expect(() => game.createInitialState(1, [players[0], players[0]])).toThrow();
  });

  it("同じseedと参加者から同じ初期状態ができる", () => {
    expect(start()).toEqual(start());
  });

  it("手番の人のflipで輪が1枚減り、不一致なら次の人へ手番が移る", () => {
    const state = { ...start(), ring: [card("spades", "3"), card("hearts", "9")], pile: [card("clubs", "A")] };
    expect(game.validateAction(state, { type: "flip" }, "a")).toEqual({ ok: true });
    const next = game.reduce(state, { type: "flip" }, "a");
    expect(next.ring).toHaveLength(1);
    expect(next.pile).toHaveLength(2);
    expect(next.turn.currentId).toBe("b");
    expect(next.phase).toBe("playing");
  });

  it("同じ数字が出ると引き取り演出に入り、tickで引き取って次の人から再開する", () => {
    const state = { ...start(), ring: [card("hearts", "7"), card("clubs", "2")], pile: [card("spades", "7")] };
    const flipped = game.reduce(state, { type: "flip" }, "a");
    expect(flipped.phase).toBe("collecting");
    expect(game.pendingDelayMs?.(flipped)).toBe(COLLECT_DELAY_MS);

    const collected = game.tick?.(flipped);
    expect(collected?.collected.a).toBe(2);
    expect(collected?.pile).toEqual([]);
    expect(collected?.turn.currentId).toBe("b");
    expect(collected?.phase).toBe("playing");
    expect(game.pendingDelayMs?.(collected!)).toBeNull();
  });

  it("手番外の操作を拒否する", () => {
    expect(game.validateAction(start(), { type: "flip" }, "b")).toEqual({
      ok: false,
      reason: "あなたの手番ではありません",
    });
  });

  it("引き取り演出中の連打を拒否する", () => {
    const state = { ...start(), ring: [card("hearts", "7")], pile: [card("spades", "7")] };
    const collecting = game.reduce(state, { type: "flip" }, "a");
    expect(game.validateAction(collecting, { type: "flip" }, "a").ok).toBe(false);
    expect(game.validateAction(collecting, { type: "flip" }, "b").ok).toBe(false);
  });

  it("試合終了後の操作を拒否する", () => {
    const state = { ...start(), ring: [], phase: "finished" as const };
    expect(game.validateAction(state, { type: "flip" }, "a")).toEqual({
      ok: false,
      reason: "試合は終了しています",
    });
  });

  it("parseActionは形式が正しいflipだけを受け付ける", () => {
    expect(game.parseAction({ type: "flip" })).toEqual({ type: "flip" });
    expect(game.parseAction({ type: "flip", cardId: "x" })).toEqual({ type: "flip" });
    expect(game.parseAction({ type: "tick" })).toBeNull();
    expect(game.parseAction({ type: "reset" })).toBeNull();
    expect(game.parseAction("flip")).toBeNull();
    expect(game.parseAction(null)).toBeNull();
  });

  it("最後の1枚が一致したら、tickで引き取りを済ませて終了し、少ない順に順位が付く", () => {
    const state = {
      ...start(),
      ring: [card("hearts", "7")],
      pile: [card("spades", "7")],
      collected: { a: 0, b: 3, c: 5 },
    };
    const collecting = game.reduce(state, { type: "flip" }, "a");
    expect(game.isFinished(collecting)).toBe(false);

    const finished = game.tick!(collecting);
    expect(game.isFinished(finished)).toBe(true);
    expect(finished.collected.a).toBe(2);
    expect(game.pendingDelayMs?.(finished)).toBeNull();

    const result = game.getResult(finished);
    expect(result.outcome).toBe("done");
    expect(result.ranking?.map((row) => row.name)).toEqual(["アリス", "ボブ", "キャロル"]);
  });

  it("公開状態に輪の未公開カードとseedを含めない", () => {
    const state = start();
    const view = viewOf(state, "b");
    const text = JSON.stringify(view);

    expect(view.ringCount).toBe(52);
    expect(view.pileTop).toBeNull();
    expect(Object.keys(view)).not.toContain("ring");
    expect(Object.keys(view)).not.toContain("seed");
    for (const hidden of state.ring) expect(text).not.toContain(hidden.id);
  });

  it("めくった札は公開され、まだ輪にある札は公開されない", () => {
    const state = { ...start(), ring: [card("spades", "3"), card("hearts", "9")], pile: [] };
    const next = game.reduce(state, { type: "flip" }, "a");
    const text = JSON.stringify(viewOf(next, "c"));

    expect(text).toContain(card("spades", "3").id);
    expect(text).not.toContain(card("hearts", "9").id);
  });

  it("canFlipは手番の本人にだけtrueになる", () => {
    const state = start();
    expect(viewOf(state, "a").canFlip).toBe(true);
    expect(viewOf(state, "b").canFlip).toBe(false);
    expect(viewOf({ ...state, phase: "collecting" }, "a").canFlip).toBe(false);
  });
});
