import { createSoloVsCpu } from "../players";
import { formatDuration, formatRank, rankByFinishOrder, rankByScore } from ".";

describe("rankByScore", () => {
  it("点数が高い順に並ぶ", () => {
    const ranking = rankByScore([
      { id: "a", name: "A", score: 3 },
      { id: "b", name: "B", score: 9 },
    ]);
    expect(ranking[0].name).toBe("B");
    expect(ranking[0].rank).toBe(1);
  });

  it("小さいほど良い指定にできる（神経衰弱の手数など）", () => {
    const ranking = rankByScore(
      [
        { id: "a", name: "A", score: 12 },
        { id: "b", name: "B", score: 8 },
      ],
      "lower-is-better",
    );
    expect(ranking[0].name).toBe("B");
  });

  it("同点は同じ順位になり、次の順位が飛ぶ", () => {
    const ranking = rankByScore([
      { id: "a", name: "A", score: 5 },
      { id: "b", name: "B", score: 5 },
      { id: "c", name: "C", score: 1 },
    ]);
    expect(ranking.map((row) => row.rank)).toEqual([1, 1, 3]);
  });
});

describe("rankByFinishOrder", () => {
  it("上がった順に順位がつき、上がれなかった人が最下位になる", () => {
    const players = createSoloVsCpu(3);
    const ranking = rankByFinishOrder(["cpu-2", "you", "cpu-1"], players);
    expect(ranking.map((row) => row.name)).toEqual(["CPU 2", "あなた", "CPU 1", "CPU 3"]);
    expect(ranking[3].rank).toBe(4);
    expect(ranking[3].detail).toBe("最下位");
  });
});

describe("formatDuration / formatRank", () => {
  it("1分未満は秒で表示する", () => {
    expect(formatDuration(12345)).toBe("12.3秒");
  });

  it("1分以上は分秒で表示する", () => {
    expect(formatDuration(83000)).toBe("1分23秒");
  });

  it("順位を日本語にする", () => {
    expect(formatRank(1)).toBe("1位");
  });
});
