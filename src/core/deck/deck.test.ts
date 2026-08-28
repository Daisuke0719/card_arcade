import { isJoker } from "../cards";
import { createDeck, createDeckWithJokers, deal, draw, drawMany, requireCard, returnToDeck } from ".";

describe("createDeck", () => {
  it("52枚できる", () => {
    expect(createDeck()).toHaveLength(52);
  });

  it("id が重複しない", () => {
    const ids = new Set(createDeck().map((c) => c.id));
    expect(ids.size).toBe(52);
  });
});

describe("createDeckWithJokers", () => {
  it("ジョーカー1枚を足すと53枚になる（ババ抜き）", () => {
    const deck = createDeckWithJokers(1);
    expect(deck).toHaveLength(53);
    expect(deck.filter(isJoker)).toHaveLength(1);
  });
});

describe("draw", () => {
  it("1枚引くと残りが1枚減る", () => {
    const { card, rest } = draw(createDeck());
    expect(card).toBeDefined();
    expect(rest).toHaveLength(51);
  });

  it("空の山札から引いても例外にならない", () => {
    const { card, rest } = draw([]);
    expect(card).toBeUndefined();
    expect(rest).toEqual([]);
  });
});

describe("drawMany", () => {
  it("足りない場合はあるだけ返す", () => {
    const { cards, rest } = drawMany(createDeck().slice(0, 3), 5);
    expect(cards).toHaveLength(3);
    expect(rest).toEqual([]);
  });
});

describe("deal", () => {
  it("枚数を指定すると人数分だけ配って残りを返す", () => {
    const { hands, rest } = deal(createDeck(), 4, 5);
    expect(hands).toHaveLength(4);
    expect(hands.every((hand) => hand.length === 5)).toBe(true);
    expect(rest).toHaveLength(32);
  });

  it("枚数を省略すると配り切り、端数は先頭から1枚多くなる", () => {
    const { hands, rest } = deal(createDeckWithJokers(1), 4);
    expect(hands.map((hand) => hand.length)).toEqual([14, 13, 13, 13]);
    expect(rest).toEqual([]);
  });
});

describe("returnToDeck", () => {
  it("山札の底に戻せる", () => {
    const deck = createDeck().slice(0, 2);
    const returned = returnToDeck(deck.slice(0, 1), deck.slice(1), "bottom");
    expect(returned[returned.length - 1]).toEqual(deck[1]);
  });
});

describe("requireCard", () => {
  it("undefined なら分かりやすいメッセージで落ちる", () => {
    expect(() => requireCard(undefined, "山札が空です")).toThrow("山札が空です");
  });
});
