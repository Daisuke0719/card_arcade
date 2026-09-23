import { card } from "@core";
import type { Rank } from "@core";
import {
  createInitialState,
  isBluff,
  nextDeclaredRank,
  reduce,
  resolveDoubt,
  toPublicState,
} from "./logic";

function decisionState(playCard: ReturnType<typeof card>, declaredRank: Rank = "A") {
  const initial = createInitialState(23);
  const actor = "cpu-1";
  const priorCard = card("hearts", "5");
  return {
    ...initial,
    turn: { ...initial.turn, currentId: actor },
    hands: {
      ...initial.hands,
      [actor]: [],
      you: [card("clubs", "9")],
    },
    pile: [priorCard, playCard],
    declaredRank,
    lastPlay: { playerId: actor, declaredRank, cards: [playCard] },
    phase: "doubt-decision" as const,
    deciderId: "you",
  };
}

describe("ダウトの判定", () => {
  it("宣言と実体が一致していればダウトは外れ", () => {
    expect(isBluff([card("spades", "A"), card("hearts", "A")], "A")).toBe(false);
  });

  it("宣言と違うカードが混ざっていればダウトは当たり", () => {
    expect(isBluff([card("spades", "A"), card("hearts", "2")], "A")).toBe(true);
  });

  it("ダウトが当たると出した人が場札を全部引き取る", () => {
    const start = decisionState(card("spades", "2"));
    const result = resolveDoubt(start, "you");
    expect(result.takerId).toBe("cpu-1");
    expect(result.hands["cpu-1"]).toHaveLength(start.pile.length);
    expect(result.pile).toHaveLength(0);
  });

  it("ダウトが外れるとダウトした人が場札を全部引き取る", () => {
    const start = decisionState(card("spades", "A"));
    const result = resolveDoubt(start, "you");
    expect(result.takerId).toBe("you");
    expect(result.hands.you).toHaveLength(1 + start.pile.length);
    expect(result.turn.finishedIds).toContain("cpu-1");
  });

  it("解決後は宣言が A に戻る", () => {
    const start = decisionState(card("spades", "7"), "7");
    expect(start.declaredRank).toBe("7");
    const result = resolveDoubt(start, "you");
    expect(result.declaredRank).toBe("A");
    expect(result.pile).toHaveLength(0);
    expect(result.phase).toBe("revealing");
  });

  it("toPublicState に他人の手札が含まれない", () => {
    const result = toPublicState(createInitialState(9), "you");
    expect(result.you).toHaveLength(13);
    expect(result.opponents).toHaveLength(3);
    expect(result.opponents.every((player) => !("hand" in player) && !("cards" in player))).toBe(true);
    expect(result).not.toHaveProperty("hands");
  });

  it("4人に13枚ずつ配り、あなたから始める", () => {
    const result = createInitialState(77);
    expect(result.turn.currentId).toBe("you");
    expect(result.turn.players).toHaveLength(4);
    expect(Object.values(result.hands).map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
    expect(result.declaredRank).toBe("A");
  });

  it("Kの次の宣言ランクはA", () => {
    expect(nextDeclaredRank("K")).toBe("A");
  });

  it("判断中は手番のプレイヤーが出そうとしても状態が変わらない", () => {
    const state = decisionState(card("spades", "2"));
    expect(reduce(state, { type: "play", cardIds: ["clubs-9"] })).toBe(state);
  });

  it("出した直後に手札が0でも、ダウトが当たって引き取れば上がらない", () => {
    const start = decisionState(card("spades", "2"));
    expect(start.hands["cpu-1"]).toHaveLength(0);
    const result = resolveDoubt(start, "you");
    expect(result.takerId).toBe("cpu-1");
    expect(result.hands["cpu-1"].length).toBeGreaterThan(0);
    expect(result.turn.finishedIds).not.toContain("cpu-1");
  });

  it("上がった人にはダウトを聞かない", () => {
    const initial = createInitialState(5);
    const state = {
      ...initial,
      turn: { ...initial.turn, currentId: "you", finishedIds: ["cpu-1"] },
      hands: { ...initial.hands, you: [card("clubs", "9")], "cpu-1": [] },
    };
    const played = reduce(state, { type: "play", cardIds: ["clubs-9"] });
    expect(played.phase).toBe("doubt-decision");
    expect(played.deciderId).toBe("cpu-2");
  });
});
