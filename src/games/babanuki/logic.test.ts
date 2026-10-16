/**
 * ババ抜き のテスト。
 *
 * カードは @core のファクトリで作る:
 *   card("spades", "A")  … 1枚
 *   hand("spades-A", "hearts-K")  … 複数枚
 *   joker()  … ジョーカー
 */
import { card, joker } from "@core";
import { createInitialState, discardPairs, drawCard, getRanking, nextAlivePlayer, reduce } from "./logic";

describe("discardPairs", () => {
  it("同じランクが2枚あると両方とも捨てられる", () => {
    const result = discardPairs([card("spades", "7"), card("hearts", "7"), card("clubs", "5")]);
    expect(result.map((c) => c.id)).toEqual(["clubs-5"]);
  });

  it("同じランクが3枚なら1組だけ捨てて1枚残る", () => {
    const result = discardPairs([card("spades", "7"), card("hearts", "7"), card("clubs", "7")]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("clubs-7");
  });

  it("ジョーカーはペアにならず手札に残る", () => {
    const result = discardPairs([card("spades", "7"), card("hearts", "7"), joker()]);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("joker");
  });
});

describe("drawCard / reduce", () => {
  it("引いた結果ペアがそろったら即座に捨てられる", () => {
    const initial = createInitialState(1);
    const state = {
      ...initial,
      hands: {
        ...initial.hands,
        you: [card("spades", "7")],
        "cpu-1": [card("hearts", "7"), card("clubs", "5")],
      },
    };

    const result = drawCard(state, 0);

    expect(result.hands.you).toHaveLength(0);
    expect(result.hands["cpu-1"].map((c) => c.id)).toEqual(["clubs-5"]);
    expect(result.lastDrawn?.id).toBe("hearts-7");
  });

  it("上がった人は手番からも引く相手からもスキップされる", () => {
    const initial = createInitialState(1);
    const state = { ...initial, turn: { ...initial.turn, finishedIds: ["cpu-1"] } };

    // currentId は "you"。左隣の cpu-1 は上がっているので、その次の cpu-2 から引く。
    expect(nextAlivePlayer(state)).toBe("cpu-2");
  });

  it("CPUの手番中に draw を送っても状態が変わらない", () => {
    const initial = createInitialState(1);
    const cpuTurnState = { ...initial, turn: { ...initial.turn, currentId: "cpu-1" } };

    const result = reduce(cpuTurnState, { type: "draw", index: 0 });

    expect(result).toBe(cpuTurnState);
  });
});

describe("getRanking", () => {
  it("上がった順に順位が付く", () => {
    const initial = createInitialState(1);
    const finishedState = {
      ...initial,
      turn: { ...initial.turn, finishedIds: ["cpu-2", "you", "cpu-1"] },
    };

    const ranking = getRanking(finishedState);

    expect(ranking).toEqual([
      { rank: 1, name: "CPU 2", detail: undefined },
      { rank: 2, name: "あなた", detail: undefined },
      { rank: 3, name: "CPU 1", detail: undefined },
      { rank: 4, name: "CPU 3", detail: "最下位" },
    ]);
  });
});
