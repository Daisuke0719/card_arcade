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

/** CPU が出したあとの判断中の状態。出した人と判断者を指定できる。 */
function roundState(deciderId: string, actor = "cpu-1", declaredRank: Rank = "5") {
  const initial = createInitialState(31);
  const played = card("spades", "5");
  return {
    ...initial,
    turn: { ...initial.turn, currentId: actor },
    hands: { ...initial.hands, [actor]: initial.hands[actor].slice(1) },
    pile: [played],
    declaredRank,
    lastPlay: { playerId: actor, declaredRank, cards: [played] },
    phase: "doubt-decision" as const,
    deciderId,
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
    const state = createInitialState(9);
    const result = toPublicState(state, "you");
    expect(result.myHand).toHaveLength(13);
    expect(result.players).toHaveLength(4);
    expect(result.players.every((player) => !("hand" in player) && !("cards" in player))).toBe(true);
    expect(result).not.toHaveProperty("hands");
    const json = JSON.stringify(result);
    for (const other of state.hands["cpu-1"]) expect(json).not.toContain(`"${other.id}"`);
  });

  it("判断中の公開状態には出したカードの中身が含まれない", () => {
    const state = decisionState(card("spades", "2"));
    const result = toPublicState(state, "you");
    expect(result.lastPlay).toEqual({ playerId: "cpu-1", declaredRank: "A", count: 1 });
    expect(result.reveal).toBeNull();
    expect(result.pileCount).toBe(2);
    expect(JSON.stringify(result)).not.toContain('"spades-2"');
  });

  it("ダウトで公開中は直前の組だけを公開状態に含める", () => {
    const result = toPublicState(resolveDoubt(decisionState(card("spades", "2")), "you"), "you");
    expect(result.reveal?.cards.map((c) => c.id)).toEqual(["spades-2"]);
    expect(result.reveal?.doubterId).toBe("you");
    expect(result.reveal?.takerId).toBe("cpu-1");
    expect(JSON.stringify(result)).not.toContain('"hearts-5"');
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

  it("見送りが一周したら宣言が1つ進んで次の人の手番になる", () => {
    const state = roundState("you");
    const result = reduce(state, { type: "pass" });
    expect(result.phase).toBe("playing");
    expect(result.deciderId).toBeNull();
    expect(result.declaredRank).toBe("6");
    expect(result.turn.currentId).toBe("cpu-2");
    expect(result.pile).toHaveLength(1);
  });

  it("まだ聞いていない人が残っていれば見送りで次の人に移る", () => {
    const state = roundState("you", "cpu-3");
    const result = reduce(state, { type: "pass" });
    expect(result.phase).toBe("doubt-decision");
    expect(result.deciderId).toBe("cpu-1");
    expect(result.declaredRank).toBe("5");
  });
});
