/**
 * 神経衰弱 のテスト。
 *
 * 判定中の解決は reduce(state, { type: "tick" }) を呼びます。setTimeout はテストしません。
 * 盤面は createInitialState(seed) でseedを固定するか、hand(...) で明示的に作ります。
 */
import { hand } from "@core";
import type { PlayingCard } from "@core";
import {
  BOARD_SIZE,
  REVEAL_DELAY_MS,
  createInitialState,
  isFaceUp,
  isGameOver,
  pendingDelayMs,
  reduce,
} from "./logic";
import type { ShinkeisuijakuState } from "./logic";

/** 盤面だけを差し替えた状態を作る。ペア判定まわりを固定の並びで確かめるために使う。 */
function stateWithBoard(board: PlayingCard[]): ShinkeisuijakuState {
  return {
    board,
    flipped: [],
    matched: [],
    phase: "idle",
    moves: 0,
    seed: 1,
  };
}

/** 2枚めくって判定まで進める。 */
function playTurn(state: ShinkeisuijakuState, first: number, second: number): ShinkeisuijakuState {
  const flipped = reduce(reduce(state, { type: "flip", index: first }), {
    type: "flip",
    index: second,
  });
  return reduce(flipped, { type: "tick" });
}

describe("神経衰弱", () => {
  it("裏向きのカードをめくると表になる", () => {
    const state = reduce(createInitialState(1), { type: "flip", index: 0 });

    expect(state.flipped).toEqual([0]);
    expect(isFaceUp(state, 0)).toBe(true);
    expect(isFaceUp(state, 1)).toBe(false);
    expect(state.phase).toBe("one-flipped");
  });

  it("2枚めくった判定中は3枚目をめくれない", () => {
    const judging = reduce(reduce(createInitialState(1), { type: "flip", index: 0 }), {
      type: "flip",
      index: 1,
    });

    expect(judging.phase).toBe("judging");
    expect(pendingDelayMs(judging)).toBe(REVEAL_DELAY_MS);

    // 判定中は何回クリックしても状態が変わらない
    const clicked = reduce(reduce(judging, { type: "flip", index: 2 }), {
      type: "flip",
      index: 3,
    });
    expect(clicked).toBe(judging);
  });

  it("ペア成立済みのカードとめくり済みのカードは選べない", () => {
    const board = hand("spades-7", "hearts-7", "clubs-K", "diamonds-3");
    const afterPair = playTurn(stateWithBoard(board), 0, 1);
    expect(afterPair.matched).toEqual([0, 1]);

    // ペア成立済みの位置
    expect(reduce(afterPair, { type: "flip", index: 0 })).toBe(afterPair);

    // いまめくったばかりの位置（同じ場所をもう一度クリックする）
    const oneFlipped = reduce(afterPair, { type: "flip", index: 2 });
    expect(reduce(oneFlipped, { type: "flip", index: 2 })).toBe(oneFlipped);

    // 盤面の範囲外
    expect(reduce(oneFlipped, { type: "flip", index: 99 })).toBe(oneFlipped);
  });

  it("2枚めくると手数が1増える", () => {
    const initial = createInitialState(1);
    expect(initial.moves).toBe(0);

    const one = reduce(initial, { type: "flip", index: 0 });
    expect(one.moves).toBe(0);

    const two = reduce(one, { type: "flip", index: 1 });
    expect(two.moves).toBe(1);

    const next = reduce(reduce(reduce(two, { type: "tick" }), { type: "flip", index: 2 }), {
      type: "flip",
      index: 3,
    });
    expect(next.moves).toBe(2);
  });

  it("同じランクの2枚はペアになって表のまま残る", () => {
    // スートが違ってもランクが同じならペアになる
    const board = hand("spades-7", "hearts-7", "clubs-K", "diamonds-3");
    const state = playTurn(stateWithBoard(board), 0, 1);

    expect(state.matched).toEqual([0, 1]);
    expect(state.flipped).toEqual([]);
    expect(isFaceUp(state, 0)).toBe(true);
    expect(isFaceUp(state, 1)).toBe(true);
    expect(state.phase).toBe("idle");
  });

  it("違うランクの2枚は両方とも裏に戻る", () => {
    const board = hand("spades-7", "hearts-7", "clubs-K", "diamonds-3");
    const state = playTurn(stateWithBoard(board), 2, 3);

    expect(state.matched).toEqual([]);
    expect(state.flipped).toEqual([]);
    expect(isFaceUp(state, 2)).toBe(false);
    expect(isFaceUp(state, 3)).toBe(false);
    expect(state.moves).toBe(1);
  });

  it("8ペアすべてそろうとゲームが終わる", () => {
    let state = createInitialState(1);
    expect(isGameOver(state)).toBe(false);

    // 同じランクの位置どうしを順に取っていく
    const positionsByRank = new Map<string, number[]>();
    state.board.forEach((card, index) => {
      const positions = positionsByRank.get(card.rank) ?? [];
      positions.push(index);
      positionsByRank.set(card.rank, positions);
    });

    expect(positionsByRank.size).toBe(BOARD_SIZE / 2);

    for (const positions of positionsByRank.values()) {
      state = playTurn(state, positions[0], positions[1]);
    }

    expect(state.matched).toHaveLength(BOARD_SIZE);
    expect(state.moves).toBe(BOARD_SIZE / 2);
    expect(isGameOver(state)).toBe(true);
    expect(pendingDelayMs(state)).toBeNull();
  });

  it("同じ seed なら同じ配置になる", () => {
    const a = createInitialState(42);
    const b = createInitialState(42);

    expect(a.board).toHaveLength(BOARD_SIZE);
    expect(a.board.map((card) => card.id)).toEqual(b.board.map((card) => card.id));
  });

  it("リセットすると盤面と手数が初期化される", () => {
    const played = reduce(reduce(createInitialState(1), { type: "flip", index: 0 }), {
      type: "flip",
      index: 1,
    });
    const reset = reduce(played, { type: "reset", seed: 7 });

    expect(reset.moves).toBe(0);
    expect(reset.flipped).toEqual([]);
    expect(reset.matched).toEqual([]);
    expect(reset.phase).toBe("idle");
    expect(reset.seed).toBe(7);
  });
});
