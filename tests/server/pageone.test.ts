import { describe, expect, it } from "vitest";
import { createPageOneState, validatePageOne } from "../../server/pageone";

describe("server pageone rules", () => {
  const players = [
    { id: "a", name: "A", connected: true },
    { id: "b", name: "B", connected: true },
  ];

  it("creates five cards per player", () => {
    const state = createPageOneState(1, players);
    expect(state.hands.a).toHaveLength(5);
    expect(state.hands.b).toHaveLength(5);
  });

  it("rejects an action from the wrong player", () => {
    const state = createPageOneState(1, players);
    expect(validatePageOne(state, { type: "draw_card" }, "b")).toEqual({ ok: false, reason: "あなたの手番ではありません" });
  });

  it("rejects a card that is not in the hand", () => {
    const state = createPageOneState(1, players);
    expect(validatePageOne(state, { type: "play_card", cardId: "spades-A" }, "a").ok).toBe(false);
  });
});
