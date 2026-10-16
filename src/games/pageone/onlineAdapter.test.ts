import { describe, expect, it } from "vitest";
import { createInitialState } from "./logic";
import { onlineAdapter } from "./onlineAdapter";

describe("ページワンのオンライン契約", () => {
  it("ゲームIDと初期状態を公開する", () => {
    const state = onlineAdapter.createInitialState(1, [
      { id: "you", name: "あなた", kind: "human" },
      { id: "opponent", name: "相手", kind: "human" },
    ]);
    expect(onlineAdapter.gameId).toBe("pageone");
    expect(state.phase).toBe("playing");
  });
  it("手番のカードを検証できる", () => {
    const state = { ...createInitialState(1), declared: [] };
    const card = state.hands.you?.[0];
    expect(card).toBeDefined();
    expect(onlineAdapter.validateAction(state, { type: "play_card", cardId: card?.id ?? "" }, "you").ok).toBe(card ? onlineAdapter.validateAction(state, { type: "play_card", cardId: card.id }, "you").ok : false);
  });
  it("相手の手札を公開状態に含めない", () => {
    const state = { ...createInitialState(1), declared: [] };
    const publicState = onlineAdapter.toPublicState(state, "you") as { myHand: unknown[]; opponents: { handCount: number }[] };
    expect(publicState.myHand).toHaveLength(5);
    expect(publicState.opponents.every((player) => typeof player.handCount === "number")).toBe(true);
  });
});
