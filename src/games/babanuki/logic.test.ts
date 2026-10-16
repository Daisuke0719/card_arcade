/**
 * ババ抜き のテスト。
 *
 * カードは @core のファクトリで作る:
 *   card("spades", "A")  … 1枚
 *   hand("spades-A", "hearts-K")  … 複数枚
 *   joker()  … ジョーカー
 */
import { card, joker } from "@core";
import type { PlayingCard } from "@core";
import {
  createInitialState,
  discardPairs,
  drawCard,
  getRanking,
  nextAlivePlayer,
  reduce,
  toPublicState,
} from "./logic";

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

  it("残ったカードは元の並びを保ち、ジョーカーを末尾へ移さない", () => {
    const result = discardPairs([joker(), card("spades", "7"), card("clubs", "5"), card("hearts", "7")]);
    expect(result.map((c) => c.id)).toEqual(["joker-red", "clubs-5"]);
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

  it("引いた人の手札は並びが混ざり、引いたカードが末尾に固定されない", () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 20; seed += 1) {
      const initial = createInitialState(seed);
      const state = {
        ...initial,
        hands: {
          ...initial.hands,
          you: [card("spades", "2"), card("spades", "3"), card("spades", "4"), card("spades", "5")],
          "cpu-1": [joker(), card("clubs", "9")],
        },
      };
      const result = drawCard(state, 0);
      expect(result.hands.you).toHaveLength(5);
      positions.add(result.hands.you.findIndex((c) => c.kind === "joker"));
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it("同じ状態から引けば、混ざった後の並びも同じになる", () => {
    const state = createInitialState(5);
    expect(drawCard(state, 0).hands.you).toEqual(drawCard(state, 0).hands.you);
  });
});

describe("上がったあとの手番", () => {
  /** you が cpu-1 から引く状態。cpu-2 と cpu-3 には手札を残しておく。 */
  function stateWith(you: PlayingCard[], cpu1: PlayingCard[]) {
    const initial = createInitialState(1);
    return {
      ...initial,
      hands: {
        you,
        "cpu-1": cpu1,
        "cpu-2": [card("diamonds", "2"), card("diamonds", "3")],
        "cpu-3": [card("diamonds", "4"), card("diamonds", "5")],
      },
    };
  }

  it("引いた人が上がっても、引かれた人の手番は飛ばされない", () => {
    const drawn = reduce(stateWith([card("spades", "7")], [card("hearts", "7"), card("clubs", "5")]), {
      type: "draw",
      index: 0,
    });
    expect(drawn.turn.finishedIds).toEqual(["you"]);

    const next = reduce(drawn, { type: "tick" });
    expect(next.turn.currentId).toBe("cpu-1");
  });

  it("引いた人と引かれた人が同時に上がると、その次の人の手番になる", () => {
    const drawn = reduce(stateWith([card("spades", "7")], [card("hearts", "7")]), { type: "draw", index: 0 });
    expect(drawn.turn.finishedIds).toEqual(["you", "cpu-1"]);

    const next = reduce(drawn, { type: "tick" });
    expect(next.turn.currentId).toBe("cpu-2");
  });

  it("引かれた人だけが上がると、その人を飛ばして次の人の手番になる", () => {
    const drawn = reduce(stateWith([card("spades", "7"), card("clubs", "5")], [card("hearts", "7")]), {
      type: "draw",
      index: 0,
    });
    expect(drawn.turn.finishedIds).toEqual(["cpu-1"]);

    const next = reduce(drawn, { type: "tick" });
    expect(next.turn.currentId).toBe("cpu-2");
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

describe("toPublicState", () => {
  it("自分の手札だけを見せ、他のプレイヤーの手札は枚数だけにする", () => {
    const state = createInitialState(3);
    const view = toPublicState(state, "you");

    expect(view.myHand).toEqual(state.hands.you);
    expect(view.seats.map((seat) => seat.handCount)).toEqual(
      state.turn.players.map((player) => state.hands[player.id].length),
    );

    const json = JSON.stringify(view);
    for (const id of ["cpu-1", "cpu-2", "cpu-3"]) {
      for (const c of state.hands[id]) expect(json).not.toContain(`"${c.id}"`);
    }
    expect(json).not.toContain('"seed"');
  });

  it("引いたカードは引いた本人にだけ見せる", () => {
    const initial = createInitialState(1);
    const drawn = reduce(initial, { type: "draw", index: 0 });

    expect(drawn.phase).toBe("revealing");
    expect(toPublicState(drawn, "you").lastDrawn).toEqual(drawn.lastDrawn);
    expect(toPublicState(drawn, "cpu-1").lastDrawn).toBeNull();
    expect(toPublicState(drawn, "cpu-1").lastDrawerId).toBe("you");
  });

  it("上がった順と引く相手を公開し、終了後は引く相手を null にする", () => {
    const initial = createInitialState(1);
    const playing = { ...initial, turn: { ...initial.turn, finishedIds: ["cpu-1"] } };
    const view = toPublicState(playing, "you");
    expect(view.seats.find((seat) => seat.id === "cpu-1")?.finishOrder).toBe(1);
    expect(view.targetId).toBe("cpu-2");

    expect(toPublicState({ ...playing, phase: "finished" }, "you").targetId).toBeNull();
  });
});
