/**
 * 神経衰弱 のテスト。
 *
 * ここが評価の対象です。「正しく動くこと」だけでなく
 * 「やってはいけない操作が弾かれること」も確認します。
 *
 * カードは @core のファクトリで作れます:
 *   card("spades", "7")            … 1枚
 *   hand("spades-7", "hearts-7")   … 複数枚（id は "<suit>-<rank>"）
 *
 * お手本: src/games/example-game/logic.test.ts
 */
import { hand } from "@core";
import {
  PAIR_COUNT,
  createInitialState,
  flipCard,
  isGameOver,
  reduce,
} from "./logic";
import type { ShinkeisuijakuState } from "./logic";

/** 指定した盤面で、まだ何もめくっていない初期状態を作る。 */
function stateWithBoard(ids: string[]): ShinkeisuijakuState {
  return {
    board: hand(...ids),
    flipped: [],
    matched: [],
    phase: "idle",
    moves: 0,
    seed: 1,
  };
}

/** 先頭が同じランクのペア、その後ろに別ランクを並べた盤面。 */
const pairFirstBoard = () =>
  stateWithBoard(["spades-7", "hearts-7", "spades-K", "clubs-Q"]);

describe("神経衰弱", () => {
  it("裏向きのカードをめくると表になる", () => {
    const state = flipCard(pairFirstBoard(), 0);
    expect(state.flipped).toEqual([0]);
    expect(state.phase).toBe("one-flipped");
  });

  it("2枚めくった判定中は3枚目をめくれない", () => {
    const two = reduce(reduce(pairFirstBoard(), { type: "flip", index: 0 }), {
      type: "flip",
      index: 1,
    });
    expect(two.phase).toBe("judging");

    const third = reduce(two, { type: "flip", index: 2 });
    expect(third).toBe(two); // 状態がまったく変わらない
    expect(third.flipped).toEqual([0, 1]);
  });

  it("ペア成立済みのカードとめくり済みのカードは選べない", () => {
    // ペアを成立させてから、その位置をもう一度めくろうとする
    const afterPair = reduce(
      reduce(reduce(pairFirstBoard(), { type: "flip", index: 0 }), { type: "flip", index: 1 }),
      { type: "tick" },
    );
    expect(afterPair.matched).toEqual([0, 1]);
    expect(reduce(afterPair, { type: "flip", index: 0 })).toBe(afterPair);

    // 同じ場所を2回クリックしても2枚目にはならない
    const onlyOne = reduce(pairFirstBoard(), { type: "flip", index: 0 });
    const again = reduce(onlyOne, { type: "flip", index: 0 });
    expect(again).toBe(onlyOne);
    expect(again.flipped).toEqual([0]);
  });

  it("2枚めくると手数が1増える", () => {
    const one = reduce(pairFirstBoard(), { type: "flip", index: 0 });
    expect(one.moves).toBe(0); // 1枚目だけでは増えない

    const two = reduce(one, { type: "flip", index: 1 });
    expect(two.moves).toBe(1);
  });

  it("同じランクの2枚はペアになって表のまま残る", () => {
    // スートが違っても、ランクが同じならペア（ハートの7とスペードの7）
    const resolved = reduce(
      reduce(reduce(pairFirstBoard(), { type: "flip", index: 0 }), { type: "flip", index: 1 }),
      { type: "tick" },
    );
    expect(resolved.matched).toEqual([0, 1]);
    expect(resolved.flipped).toEqual([]);
    expect(resolved.phase).toBe("idle");
  });

  it("違うランクの2枚は両方とも裏に戻る", () => {
    // index 2(K) と 3(Q) は別ランク
    const resolved = reduce(
      reduce(reduce(pairFirstBoard(), { type: "flip", index: 2 }), { type: "flip", index: 3 }),
      { type: "tick" },
    );
    expect(resolved.matched).toEqual([]);
    expect(resolved.flipped).toEqual([]);
    expect(resolved.phase).toBe("idle");
  });

  it("8ペアすべてそろうとゲームが終わる", () => {
    // 0-1 が A ペア、2-3 が 2 ペア … 14-15 が 8 ペア
    const ids = ["A", "2", "3", "4", "5", "6", "7", "8"].flatMap((rank) => [
      `spades-${rank}`,
      `hearts-${rank}`,
    ]);
    // 7ペア(14枚)まで成立済み、最後のペアを判定中にした状態
    const almost: ShinkeisuijakuState = {
      board: hand(...ids),
      flipped: [14, 15],
      matched: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      phase: "judging",
      moves: 8,
      seed: 1,
    };
    expect(isGameOver(almost)).toBe(false);

    const done = reduce(almost, { type: "tick" });
    expect(done.matched).toHaveLength(PAIR_COUNT * 2);
    expect(isGameOver(done)).toBe(true);
  });

  it("同じ seed なら同じ配置になる（テストが不安定にならない）", () => {
    const a = createInitialState(42);
    const b = createInitialState(42);
    expect(a.board.map((c) => c.id)).toEqual(b.board.map((c) => c.id));
    expect(a.board).toHaveLength(PAIR_COUNT * 2);
  });

  it("リセットすると手数が0の初期状態に戻る", () => {
    const played = reduce(reduce(pairFirstBoard(), { type: "flip", index: 0 }), {
      type: "flip",
      index: 1,
    });
    const reset = reduce(played, { type: "reset", seed: 7 });
    expect(reset.moves).toBe(0);
    expect(reset.matched).toEqual([]);
    expect(reset.flipped).toEqual([]);
    expect(reset.phase).toBe("idle");
  });
});
