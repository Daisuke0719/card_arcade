import { card, createRng, shuffle, createDeck } from "@core";
import { chooseGuess, highProbability } from "./cpu";
import {
  TOTAL_ROUNDS,
  createInitialState,
  isGameOver,
  judge,
  pendingDelayMs,
  reduce,
} from "./logic";
import type { ExampleState } from "./logic";

/** テスト用に「次に必ずこのカードが出る」状態を作る。 */
function stateWith(current: ReturnType<typeof card>, deck: ReturnType<typeof card>[]): ExampleState {
  return { ...createInitialState(1), current, deck };
}

describe("judge", () => {
  it("次のカードが大きければ high が正解", () => {
    expect(judge(card("spades", "5"), card("hearts", "9"))).toBe("high");
  });

  it("次のカードが小さければ low が正解", () => {
    expect(judge(card("spades", "9"), card("hearts", "5"))).toBe("low");
  });

  it("同じランクは引き分け", () => {
    expect(judge(card("spades", "7"), card("hearts", "7"))).toBe("draw");
  });

  it("A は最小として扱う", () => {
    expect(judge(card("spades", "A"), card("hearts", "2"))).toBe("high");
  });
});

describe("reduce: guess", () => {
  it("予想するとカードがめくられ、判定待ちになる", () => {
    const next = reduce(stateWith(card("spades", "5"), [card("hearts", "9")]), {
      type: "guess",
      guess: "high",
    });
    expect(next.phase).toBe("revealing");
    expect(next.next).not.toBeNull();
    expect(next.cpuGuess).not.toBeNull();
  });

  it("判定中にもう一度予想しても状態が変わらない（連打で先に進めない）", () => {
    const revealing = reduce(stateWith(card("spades", "5"), [card("hearts", "9"), card("clubs", "2")]), {
      type: "guess",
      guess: "high",
    });
    const again = reduce(revealing, { type: "guess", guess: "low" });
    expect(again).toBe(revealing);
  });

  it("山札が空なら予想した時点で終了する", () => {
    const next = reduce(stateWith(card("spades", "5"), []), { type: "guess", guess: "high" });
    expect(next.phase).toBe("finished");
    expect(isGameOver(next)).toBe(true);
  });
});

describe("reduce: tick", () => {
  it("当たると自分の得点が増える", () => {
    let state = stateWith(card("spades", "5"), [card("hearts", "9"), card("clubs", "3")]);
    state = reduce(state, { type: "guess", guess: "high" });
    state = reduce(state, { type: "tick" });
    expect(state.humanScore).toBe(1);
  });

  it("外すと得点は増えない", () => {
    let state = stateWith(card("spades", "5"), [card("hearts", "9"), card("clubs", "3")]);
    state = reduce(state, { type: "guess", guess: "low" });
    state = reduce(state, { type: "tick" });
    expect(state.humanScore).toBe(0);
  });

  it("引き分けのときは誰も得点しない", () => {
    let state = stateWith(card("spades", "7"), [card("hearts", "7"), card("clubs", "3")]);
    state = reduce(state, { type: "guess", guess: "high" });
    state = reduce(state, { type: "tick" });
    expect(state.humanScore).toBe(0);
    expect(state.cpuScore).toBe(0);
    expect(state.lastOutcome).toBe("none");
  });

  it("めくったカードが次の基準になる", () => {
    let state = stateWith(card("spades", "5"), [card("hearts", "9"), card("clubs", "3")]);
    state = reduce(state, { type: "guess", guess: "high" });
    state = reduce(state, { type: "tick" });
    expect(state.current.rank).toBe("9");
    expect(state.next).toBeNull();
  });

  it("判定待ちでないときの tick は無視される", () => {
    const state = stateWith(card("spades", "5"), [card("hearts", "9")]);
    expect(reduce(state, { type: "tick" })).toBe(state);
  });
});

describe("ゲーム終了", () => {
  it("10ラウンドで終了する", () => {
    let state = createInitialState(1);
    for (let i = 0; i < TOTAL_ROUNDS; i += 1) {
      state = reduce(state, { type: "guess", guess: "high" });
      state = reduce(state, { type: "tick" });
    }
    expect(state.phase).toBe("finished");
    expect(state.humanScore + state.cpuScore).toBeGreaterThanOrEqual(0);
  });
});

describe("pendingDelayMs", () => {
  it("入力待ちのときは null（＝タイマーを動かさない）", () => {
    expect(pendingDelayMs(createInitialState(1))).toBeNull();
  });

  it("判定待ちのときは待ち時間を返す", () => {
    const state = reduce(createInitialState(1), { type: "guess", guess: "high" });
    expect(pendingDelayMs(state)).toBeGreaterThan(0);
  });
});

describe("seed", () => {
  it("同じ seed なら同じ展開になる（テストが安定する）", () => {
    const a = createInitialState(42);
    const b = createInitialState(42);
    expect(a.current.id).toBe(b.current.id);
    expect(a.deck.map((c) => c.id)).toEqual(b.deck.map((c) => c.id));
  });

  it("shuffle は seed を渡せば決定的", () => {
    const first = shuffle(createDeck(), createRng(7))[0];
    const second = shuffle(createDeck(), createRng(7))[0];
    expect(first.id).toBe(second.id);
  });
});

describe("CPU", () => {
  it("大きいカードのときは high の確率が下がる", () => {
    expect(highProbability(card("spades", "K"))).toBeLessThan(highProbability(card("spades", "2")));
  });

  it("K のあとに high はほぼ選ばない", () => {
    expect(highProbability(card("spades", "K"))).toBe(0);
  });

  it("乱数を固定すれば選択も決まる", () => {
    const guess1 = chooseGuess(card("spades", "5"), createRng(3));
    const guess2 = chooseGuess(card("spades", "5"), createRng(3));
    expect(guess1).toBe(guess2);
  });
});
