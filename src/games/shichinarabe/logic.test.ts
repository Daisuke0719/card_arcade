import { card } from "@core";
import {
  MAX_PASSES,
  canPlace,
  createInitialState,
  dropOut,
  getRanking,
  isGameOver,
  passTurn,
  place,
  reduce,
} from "./logic";
import type { Board, ShichinarabeState } from "./logic";

function emptyBoard(): Board {
  return {
    spades: new Array(13).fill(false),
    hearts: new Array(13).fill(false),
    diamonds: new Array(13).fill(false),
    clubs: new Array(13).fill(false),
  };
}

describe("七並べ", () => {
  it("最初は4枚の7が場に置かれ、13枚ずつ配られる", () => {
    const state = createInitialState(1);
    expect(state.board.spades[6]).toBe(true);
    expect(state.board.hearts[6]).toBe(true);
    expect(state.board.diamonds[6]).toBe(true);
    expect(state.board.clubs[6]).toBe(true);

    const totalCards = Object.values(state.hands).reduce((sum, hand) => sum + hand.length, 0);
    expect(totalCards).toBe(52 - 4);
    expect(isGameOver(state)).toBe(false);
  });

  it("7の隣（6と8）は置ける", () => {
    const board = emptyBoard();
    board.hearts[6] = true;
    expect(canPlace(board, card("hearts", "6"))).toBe(true);
    expect(canPlace(board, card("hearts", "8"))).toBe(true);
  });

  it("場から離れたカードは置けない", () => {
    const board = emptyBoard();
    board.hearts[6] = true;
    expect(canPlace(board, card("hearts", "9"))).toBe(false);
    expect(canPlace(board, card("hearts", "4"))).toBe(false);
  });

  it("A の下と K の上には置けない", () => {
    const withAceOnly = emptyBoard();
    withAceOnly.clubs[0] = true;
    expect(canPlace(withAceOnly, card("clubs", "2"))).toBe(true);
    expect(canPlace(withAceOnly, card("clubs", "K"))).toBe(false);

    const withKingOnly = emptyBoard();
    withKingOnly.clubs[12] = true;
    expect(canPlace(withKingOnly, card("clubs", "Q"))).toBe(true);
    expect(canPlace(withKingOnly, card("clubs", "A"))).toBe(false);
  });

  it("出せるカードがあるときはパスできない", () => {
    const initial = createInitialState(1);
    const board = emptyBoard();
    board.spades[6] = true;
    const state: ShichinarabeState = {
      ...initial,
      board,
      hands: { ...initial.hands, you: [card("spades", "8")] },
      turn: { ...initial.turn, currentId: "you" },
    };

    const next = passTurn(state, "you");
    expect(next).toBe(state);
  });

  it("3回パスしたあと、4回目のパスで脱落し手札が全部場に出る", () => {
    const initial = createInitialState(1);
    const board = emptyBoard();
    board.spades[6] = true;

    let state: ShichinarabeState = {
      ...initial,
      board,
      hands: { ...initial.hands, you: [card("spades", "2"), card("hearts", "5")] },
      turn: { ...initial.turn, currentId: "you" },
    };

    for (let i = 0; i < MAX_PASSES; i += 1) {
      state = passTurn(state, "you");
      state = { ...state, turn: { ...state.turn, currentId: "you" } };
    }
    expect(state.passes.you).toBe(MAX_PASSES);
    expect(state.droppedIds).not.toContain("you");

    state = passTurn(state, "you");
    expect(state.droppedIds).toContain("you");
    expect(state.hands.you).toHaveLength(0);
    expect(state.board.spades[1]).toBe(true);
    expect(state.board.hearts[4]).toBe(true);
  });

  it("手札を出し切った順に順位が付く", () => {
    const initial = createInitialState(1);
    const state: ShichinarabeState = {
      ...initial,
      turn: { ...initial.turn, finishedIds: ["cpu-2", "you", "cpu-1", "cpu-3"] },
      droppedIds: ["cpu-1", "cpu-3"],
    };

    const order = getRanking(state).map((row) => row.name);
    expect(order).toEqual(["CPU 2", "あなた", "CPU 3", "CPU 1"]);
  });

  it("プレイヤーの手番でないときの place は無視される", () => {
    const initial = createInitialState(1);
    const board = emptyBoard();
    board.spades[6] = true;
    const state: ShichinarabeState = {
      ...initial,
      board,
      hands: { ...initial.hands, you: [card("spades", "8")] },
      turn: { ...initial.turn, currentId: "cpu-1" },
    };

    const next = place(state, "you", card("spades", "8"));
    expect(next).toBe(state);
  });

  it("脱落した人は以降の手番から飛ばされる", () => {
    const initial = createInitialState(1);
    const board = emptyBoard();
    board.spades[6] = true;
    const state: ShichinarabeState = {
      ...initial,
      board,
      hands: { ...initial.hands, you: [card("hearts", "2")] },
      turn: { ...initial.turn, currentId: "you" },
    };

    const dropped = dropOut(state, "you");
    expect(dropped.turn.currentId).not.toBe("you");
    expect(dropped.turn.finishedIds).toContain("you");
  });

  it("同じ seed なら同じ配りになる（テストが不安定にならない）", () => {
    const a = createInitialState(42);
    const b = createInitialState(42);
    expect(a.hands.you.map((c) => c.id)).toEqual(b.hands.you.map((c) => c.id));
  });

  it("判定中でない reduce の未知のアクションは状態を変えない", () => {
    const state = createInitialState(1);
    // @ts-expect-error 想定外のアクションでも state をそのまま返すことを確認する
    expect(reduce(state, { type: "unknown" })).toBe(state);
  });
});
