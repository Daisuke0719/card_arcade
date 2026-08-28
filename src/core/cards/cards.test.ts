import { card, joker } from "../testing";
import {
  RANK_ORDER_ACE_HIGH,
  compareRank,
  createRankStrength,
  cycleRank,
  groupByRank,
  isJoker,
  partitionJokers,
  rankToNumber,
  sameRank,
  sortCards,
} from ".";

describe("rankToNumber", () => {
  it("A は 1、K は 13 になる", () => {
    expect(rankToNumber("A")).toBe(1);
    expect(rankToNumber("10")).toBe(10);
    expect(rankToNumber("K")).toBe(13);
  });
});

describe("cycleRank", () => {
  it("K の次は A に戻る（スピードの A-K 接続）", () => {
    expect(cycleRank("K", 1)).toBe("A");
  });

  it("A の前は K になる", () => {
    expect(cycleRank("A", -1)).toBe("K");
  });

  it("2つ以上動かしても循環する", () => {
    expect(cycleRank("Q", 3)).toBe("2");
  });
});

describe("sameRank", () => {
  it("同じランクなら true", () => {
    expect(sameRank(card("spades", "7"), card("hearts", "7"))).toBe(true);
  });

  it("ジョーカーが混ざると常に false（＝ペアにならない）", () => {
    expect(sameRank(joker(), card("hearts", "7"))).toBe(false);
    expect(sameRank(joker(), joker("black"))).toBe(false);
  });
});

describe("partitionJokers", () => {
  it("通常カードとジョーカーに分けられる", () => {
    const { standards, jokers } = partitionJokers([card("spades", "A"), joker(), card("clubs", "5")]);
    expect(standards).toHaveLength(2);
    expect(jokers).toHaveLength(1);
    expect(isJoker(jokers[0])).toBe(true);
  });
});

describe("createRankStrength", () => {
  it("順序を渡すと強さの関数になる（大富豪の 3 が最弱・2 が最強）", () => {
    const strength = createRankStrength([
      "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2",
    ]);
    expect(strength("3")).toBeLessThan(strength("A"));
    expect(strength("A")).toBeLessThan(strength("2"));
  });

  it("既定は A が最弱", () => {
    expect(compareRank("A", "K")).toBeLessThan(0);
  });

  it("ACE_HIGH を渡すと A が最強になる", () => {
    expect(compareRank("A", "K", RANK_ORDER_ACE_HIGH)).toBeGreaterThan(0);
  });
});

describe("sortCards / groupByRank", () => {
  it("ランク順に並べ替えられる", () => {
    const sorted = sortCards([card("spades", "K"), card("hearts", "3"), card("clubs", "7")]);
    expect(sorted.map((c) => c.rank)).toEqual(["3", "7", "K"]);
  });

  it("同じランクをまとめられる", () => {
    const groups = groupByRank([card("spades", "5"), card("hearts", "5"), card("clubs", "9")]);
    expect(groups.get("5")).toHaveLength(2);
    expect(groups.get("9")).toHaveLength(1);
  });
});
