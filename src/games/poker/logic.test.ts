import { hand } from "@core";
import { describe, expect, it } from "vitest";
import { compareHands, createInitialState, evaluateHand, reduce } from "./logic";
import { chooseDiscardIds } from "./cpu";

describe("poker hand evaluation", () => {
  it("ハイカードを判定できる", () => {
    expect(evaluateHand(hand("spades-A", "hearts-K", "clubs-9", "diamonds-6", "spades-2"))).toEqual({ rank: "high-card", tiebreak: [14, 13, 9, 6, 2] });
  });
  it("ワンペアを判定できる", () => {
    expect(evaluateHand(hand("spades-A", "hearts-A", "clubs-9", "diamonds-6", "spades-2"))).toEqual({ rank: "one-pair", tiebreak: [14] });
  });
  it("ツーペアを判定できる", () => {
    expect(evaluateHand(hand("spades-A", "hearts-A", "clubs-9", "diamonds-9", "spades-2"))).toEqual({ rank: "two-pair", tiebreak: [14, 9] });
  });
  it("スリーカードを判定できる", () => {
    expect(evaluateHand(hand("spades-A", "hearts-A", "clubs-A", "diamonds-9", "spades-2")).rank).toBe("three-of-a-kind");
  });
  it("ストレートを判定できる", () => {
    expect(evaluateHand(hand("spades-10", "hearts-J", "clubs-Q", "diamonds-K", "spades-A"))).toEqual({ rank: "straight", tiebreak: [14] });
    expect(evaluateHand(hand("spades-2", "hearts-3", "clubs-4", "diamonds-5", "spades-6")).tiebreak).toEqual([6]);
  });
  it("フラッシュを判定できる", () => {
    expect(evaluateHand(hand("spades-A", "spades-10", "spades-8", "spades-5", "spades-2")).rank).toBe("flush");
  });
  it("A-2-3-4-5 をストレートと判定できる", () => {
    expect(evaluateHand(hand("spades-A", "hearts-2", "clubs-3", "diamonds-4", "spades-5"))).toEqual({ rank: "straight", tiebreak: [5] });
  });
  it("同じ役は tiebreak で比較する", () => {
    const acePair = evaluateHand(hand("spades-A", "hearts-A", "clubs-9", "diamonds-6", "spades-2"));
    const kingPair = evaluateHand(hand("spades-K", "hearts-K", "clubs-A", "diamonds-Q", "spades-J"));
    expect(compareHands(acePair, kingPair)).toBeGreaterThan(0);
  });
  it("フルハウス、フォーカード、ストレートフラッシュを判定できる", () => {
    expect(evaluateHand(hand("spades-A", "hearts-A", "clubs-A", "diamonds-K", "spades-K")).rank).toBe("full-house");
    expect(evaluateHand(hand("spades-A", "hearts-A", "clubs-A", "diamonds-A", "spades-K")).rank).toBe("four-of-a-kind");
    expect(evaluateHand(hand("spades-9", "spades-10", "spades-J", "spades-Q", "spades-K")).rank).toBe("straight-flush");
  });
  it("tiebreakまで同じなら引き分けになる", () => {
    const a = evaluateHand(hand("spades-A", "hearts-A", "clubs-9", "diamonds-6", "spades-2"));
    const b = evaluateHand(hand("clubs-A", "diamonds-A", "hearts-K", "clubs-Q", "diamonds-J"));
    expect(compareHands(a, b)).toBe(0);
  });
});

describe("poker exchange", () => {
  it("同じseedなら同じ配りになり残りは42枚", () => {
    const first = createInitialState(7);
    expect(first.deck).toHaveLength(42);
    expect(first.hands.you).toHaveLength(5);
    expect(first.hands["cpu-1"]).toEqual(createInitialState(7).hands["cpu-1"]);
  });
  it("CPUはペアを残し、役がなければ強い2枚を残す", () => {
    const onePair = hand("spades-A", "hearts-A", "clubs-9", "diamonds-6", "spades-2");
    expect(chooseDiscardIds(onePair)).toEqual(["clubs-9", "diamonds-6", "spades-2"]);
    expect(chooseDiscardIds(onePair)).toEqual(chooseDiscardIds(onePair));
    expect(chooseDiscardIds(hand("spades-A", "hearts-K", "clubs-9", "diamonds-6", "spades-2"))).toEqual([
      "clubs-9",
      "diamonds-6",
      "spades-2",
    ]);
    expect(chooseDiscardIds(hand("spades-A", "hearts-A", "clubs-9", "diamonds-9", "spades-2"))).toEqual(["spades-2"]);
    expect(chooseDiscardIds(hand("spades-A", "hearts-A", "clubs-A", "diamonds-6", "spades-2"))).toEqual([
      "diamonds-6",
      "spades-2",
    ]);
    expect(chooseDiscardIds(hand("spades-A", "hearts-A", "clubs-A", "diamonds-A", "spades-2"))).toEqual(["spades-2"]);
  });
  it("一度交換した後の再交換は状態を変えない", () => {
    const exchanged = reduce(createInitialState(2), { type: "exchange", cardIds: [] });
    expect(exchanged.phase).toBe("showdown");
    expect(reduce(exchanged, { type: "exchange", cardIds: [exchanged.hands.you[0].id] })).toBe(exchanged);
  });
  it("自分が0枚交換でもCPUの交換は行われる", () => {
    const initial = createInitialState(4);
    const result = reduce(initial, { type: "exchange", cardIds: [] });
    expect(result.hands.you).toEqual(initial.hands.you);
    expect(result.exchanged.you).toBe(0);
    expect(result.phase).toBe("showdown");
    expect(result.exchanged["cpu-1"]).toBeGreaterThan(0);
    expect(result.deck.length).toBe(initial.deck.length - result.exchanged["cpu-1"]);
  });
});
