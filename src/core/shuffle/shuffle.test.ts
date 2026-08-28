import { createDeck } from "../deck";
import { createRng, pickRandom, shuffle } from ".";

describe("createRng", () => {
  it("同じ seed なら必ず同じ並びになる（テストが不安定にならない鍵）", () => {
    const a = shuffle(createDeck(), createRng(42)).map((c) => c.id);
    const b = shuffle(createDeck(), createRng(42)).map((c) => c.id);
    expect(a).toEqual(b);
  });

  it("違う seed なら並びが変わる", () => {
    const a = shuffle(createDeck(), createRng(1)).map((c) => c.id);
    const b = shuffle(createDeck(), createRng(2)).map((c) => c.id);
    expect(a).not.toEqual(b);
  });

  it("文字列の seed も使える", () => {
    const a = shuffle(createDeck(), createRng("team-a")).map((c) => c.id);
    const b = shuffle(createDeck(), createRng("team-a")).map((c) => c.id);
    expect(a).toEqual(b);
  });
});

describe("shuffle", () => {
  it("元の配列を書き換えない", () => {
    const deck = createDeck();
    const before = deck.map((c) => c.id);
    shuffle(deck, createRng(7));
    expect(deck.map((c) => c.id)).toEqual(before);
  });

  it("枚数は変わらない", () => {
    expect(shuffle(createDeck(), createRng(7))).toHaveLength(52);
  });
});

describe("pickRandom", () => {
  it("空配列なら undefined", () => {
    expect(pickRandom([], createRng(1))).toBeUndefined();
  });
});
