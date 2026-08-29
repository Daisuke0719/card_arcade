// @scaffold:untouched
/**
 * ぶたのしっぽ のテスト。
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
import { createInitialState, isGameOver, reduce } from "./logic";

describe("ぶたのしっぽ", () => {
  it("最初は52枚の山札から始まる", () => {
    const state = createInitialState(1);
    expect(state.deck).toHaveLength(52);
    expect(isGameOver(state)).toBe(false);
  });

  it("同じ seed なら同じ配りになる（テストが不安定にならない）", () => {
    const a = createInitialState(42);
    const b = createInitialState(42);
    expect(a.deck.map((card) => card.id)).toEqual(b.deck.map((card) => card.id));
  });

  it("リセットすると最初の状態に戻る", () => {
    const state = reduce(createInitialState(1), { type: "reset" });
    expect(state.phase).toBe("playing");
  });

  // TODO: Issue の必須要件それぞれに対応するテストを足してください
});
