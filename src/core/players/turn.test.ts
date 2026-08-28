import {
  alivePlayers,
  createSoloVsCpu,
  createTurnState,
  finishPlayer,
  isOver,
  neighborId,
  nextTurn,
  reverseDirection,
} from ".";

function setup() {
  const players = createSoloVsCpu(3); // you, cpu-1, cpu-2, cpu-3
  return createTurnState(players);
}

describe("createSoloVsCpu", () => {
  it("あなた + CPU3人が作られる", () => {
    const players = createSoloVsCpu(3);
    expect(players.map((p) => p.id)).toEqual(["you", "cpu-1", "cpu-2", "cpu-3"]);
    expect(players[0].kind).toBe("human");
    expect(players[3].name).toBe("CPU 3");
  });
});

describe("neighborId", () => {
  it("左隣（次の手番の人）を返す", () => {
    expect(neighborId(setup())).toBe("cpu-1");
  });

  it("上がった人は飛ばす（ババ抜きの引く相手選び）", () => {
    const state = finishPlayer(setup(), "cpu-1");
    expect(neighborId(state)).toBe("cpu-2");
  });

  it("逆回りにすると反対隣になる", () => {
    expect(neighborId(reverseDirection(setup()))).toBe("cpu-3");
  });

  it("生存者が自分だけなら undefined", () => {
    let state = setup();
    state = finishPlayer(state, "cpu-1");
    state = finishPlayer(state, "cpu-2");
    state = finishPlayer(state, "cpu-3");
    expect(neighborId(state)).toBeUndefined();
  });
});

describe("nextTurn", () => {
  it("手番が次の人へ移る", () => {
    expect(nextTurn(setup()).currentId).toBe("cpu-1");
  });

  it("一周すると最初の人に戻る", () => {
    let state = setup();
    for (let i = 0; i < 4; i += 1) state = nextTurn(state);
    expect(state.currentId).toBe("you");
  });

  it("上がった人を飛ばして進む", () => {
    let state = finishPlayer(setup(), "cpu-1");
    state = nextTurn(state);
    expect(state.currentId).toBe("cpu-2");
  });
});

describe("finishPlayer", () => {
  it("上がった順が finishedIds に記録される（そのまま順位になる）", () => {
    let state = setup();
    state = finishPlayer(state, "cpu-2");
    state = finishPlayer(state, "you");
    expect(state.finishedIds).toEqual(["cpu-2", "you"]);
  });

  it("手番の人が上がると手番が次へ移る", () => {
    const state = finishPlayer(setup(), "you");
    expect(state.currentId).toBe("cpu-1");
  });

  it("同じ人を二重に上がらせても増えない", () => {
    const state = finishPlayer(finishPlayer(setup(), "you"), "you");
    expect(state.finishedIds).toEqual(["you"]);
  });
});

describe("isOver / alivePlayers", () => {
  it("残り1人になったら終了", () => {
    let state = setup();
    expect(isOver(state)).toBe(false);
    state = finishPlayer(state, "you");
    state = finishPlayer(state, "cpu-1");
    state = finishPlayer(state, "cpu-2");
    expect(alivePlayers(state)).toHaveLength(1);
    expect(isOver(state)).toBe(true);
  });
});
