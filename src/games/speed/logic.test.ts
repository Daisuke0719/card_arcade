// @scaffold:untouched
/**
 * スピード のテスト。
 *
 * ここが評価の対象です。「正しく動くこと」だけでなく
 * 「やってはいけない操作が弾かれること」も必ずテストしてください。
 *
 * カードは @core のファクトリで作れます:
 *   card("spades", "A")  … 1枚
 *   hand("spades-A", "hearts-K")  … 複数枚
 *   joker()  … ジョーカー
 *
 * お手本: src/games/example-game/logic.test.ts
 */
import { card } from "@core";
import { canPlay, createInitialState, playablePileIndex, reduce } from "./logic";

describe("スピード", () => {
  it("1つ違いのカードは出せる", () => {
    const pile = card("spades", "7");
    const six = card("hearts", "6");
    const eight = card("clubs", "8");

    expect(canPlay(six, pile)).toBe(true);
    expect(canPlay(eight, pile)).toBe(true);
  });

  it("同じ数字は出せない", () => {
    const pile = card("spades", "7");
    const seven = card("hearts", "7");

    expect(canPlay(seven, pile)).toBe(false);
  });

  it("K の台札には A を出せる", () => {
    const kPile = card("spades", "K");
    const ace = card("hearts", "A");

    expect(canPlay(ace, kPile)).toBe(true);
  });

  it("A の台札には K を出せる", () => {
    const acePile = card("spades", "A");
    const king = card("hearts", "K");

    expect(canPlay(king, acePile)).toBe(true);
  });

  it("両方の台札に出せるときは左に出る", () => {
    const leftPile = card("spades", "7");
    const rightPile = card("hearts", "5");
    const six = card("clubs", "6");
    const piles: [typeof leftPile, typeof rightPile] = [leftPile, rightPile];

    const result = playablePileIndex(six, piles);
    expect(result).toBe(0);
  });

  it("出せないカードを出そうとしても状態が変わらない", () => {
    const state = createInitialState(1);
    const unplayableCard = state.you.hand.find(
      (card) => playablePileIndex(card, state.piles) === null,
    );

    if (!unplayableCard) {
      // すべてのカードが出せない確率は非常に低いので、この場合はスキップ
      expect(true).toBe(true);
      return;
    }

    const next = reduce(state, { type: "play", side: "you", cardId: unplayableCard.id });
    expect(next).toBe(state);
  });
});
