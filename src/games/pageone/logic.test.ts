/**
 * ページワン のテスト。
 *
 * 8 や A を狙って出す状況は初期配りからは作れないため、
 * card / hand で PageOneState を直接組み立てて reduce を呼びます。
 */
import { card, createSoloVsCpu, createTurnState, hand } from "@core";
import type { PlayingCard } from "@core";
import {
  CPU_DELAY_MS,
  HUMAN_ID,
  canPlay,
  createInitialState,
  fieldTop,
  getRanking,
  handOf,
  isGameOver,
  legalMoves,
  pendingDelayMs,
  reduce,
} from "./logic";
import type { PageOneState } from "./logic";

const players = createSoloVsCpu(3);

/** 場札は ♥5、手番はプレイヤー。各テストで必要な部分だけ上書きする。 */
function stateWith(overrides: Partial<PageOneState> = {}): PageOneState {
  return {
    deck: hand("clubs-2", "clubs-3", "clubs-4"),
    field: hand("hearts-5"),
    hands: {
      you: hand("hearts-9", "spades-5"),
      "cpu-1": hand("clubs-9"),
      "cpu-2": hand("clubs-10"),
      "cpu-3": hand("clubs-J"),
    },
    turn: createTurnState(players),
    phase: "playing",
    winnerId: null,
    log: [],
    drawCount: 0,
    seed: 1,
    ...overrides,
  };
}

function countCards(state: PageOneState): number {
  const inHands = state.turn.players.reduce(
    (total, player) => total + handOf(state, player.id).length,
    0,
  );
  return state.deck.length + state.field.length + inHands;
}

/** 決着まで自動で進める。プレイヤーは出せる最初の1枚を出し、無ければ引く。 */
function playOut(seed: number): PageOneState {
  let state = createInitialState(seed);
  for (let step = 0; step < 2000 && !isGameOver(state); step += 1) {
    if (state.turn.currentId !== HUMAN_ID) {
      state = reduce(state, { type: "tick" });
      continue;
    }
    const moves: PlayingCard[] = legalMoves(handOf(state, HUMAN_ID), fieldTop(state));
    state =
      moves.length > 0
        ? reduce(state, { type: "play", cardId: moves[0].id })
        : reduce(state, { type: "draw" });
  }
  return state;
}

describe("出せるかどうかの判定", () => {
  it("同じマークなら出せる", () => {
    expect(canPlay(card("hearts", "2"), card("hearts", "9"))).toBe(true);
  });

  it("同じ数字なら出せる", () => {
    expect(canPlay(card("spades", "9"), card("hearts", "9"))).toBe(true);
  });

  it("マークも数字も違うカードは出せない", () => {
    expect(canPlay(card("clubs", "3"), card("hearts", "9"))).toBe(false);
  });
});

describe("出す・引く", () => {
  it("出せるカードが無いときは山札から1枚引く", () => {
    const state = stateWith({
      hands: {
        you: hand("clubs-2", "diamonds-9"),
        "cpu-1": hand("clubs-9"),
        "cpu-2": hand("clubs-10"),
        "cpu-3": hand("clubs-J"),
      },
      deck: hand("spades-7", "clubs-3"),
    });

    const next = reduce(state, { type: "draw" });

    expect(handOf(next, HUMAN_ID)).toHaveLength(3);
    expect(next.deck).toHaveLength(1);
    expect(next.turn.currentId).toBe("cpu-1");
  });

  it("引いたカードが出せるときは、その場で場に出て手札が増えない", () => {
    const state = stateWith({
      hands: {
        you: hand("clubs-2", "spades-9"),
        "cpu-1": hand("clubs-9"),
        "cpu-2": hand("clubs-10"),
        "cpu-3": hand("clubs-J"),
      },
      deck: hand("hearts-K", "clubs-3"),
    });

    const next = reduce(state, { type: "draw" });

    expect(handOf(next, HUMAN_ID)).toHaveLength(2);
    expect(fieldTop(next).id).toBe("hearts-K");
    expect(next.deck).toHaveLength(1);
  });

  it("山札が空のときに引くと、場札の一番上だけが残って残りが山札になる", () => {
    const state = stateWith({
      deck: [],
      field: hand("hearts-5", "spades-2", "clubs-7", "diamonds-4"),
      hands: {
        you: hand("clubs-2", "spades-9"),
        "cpu-1": hand("clubs-9"),
        "cpu-2": hand("clubs-10"),
        "cpu-3": hand("clubs-J"),
      },
    });

    const next = reduce(state, { type: "draw" });

    expect(next.field).toHaveLength(1);
    expect(fieldTop(next).id).toBe("diamonds-4");
    expect(next.deck).toHaveLength(2);
    expect(handOf(next, HUMAN_ID)).toHaveLength(3);
    expect(countCards(next)).toBe(countCards(state));
  });
});

describe("特殊カード", () => {
  it("8を出すと次の人が飛ばされる", () => {
    const state = stateWith({
      hands: {
        you: hand("hearts-8", "clubs-2"),
        "cpu-1": hand("clubs-9"),
        "cpu-2": hand("clubs-10"),
        "cpu-3": hand("clubs-J"),
      },
    });

    const next = reduce(state, { type: "play", cardId: "hearts-8" });

    expect(next.turn.currentId).toBe("cpu-2");
  });

  it("Aを出すともう一度出せる", () => {
    const state = stateWith({
      hands: {
        you: hand("hearts-A", "clubs-2"),
        "cpu-1": hand("clubs-9"),
        "cpu-2": hand("clubs-10"),
        "cpu-3": hand("clubs-J"),
      },
    });

    const next = reduce(state, { type: "play", cardId: "hearts-A" });

    expect(next.turn.currentId).toBe(HUMAN_ID);
    expect(handOf(next, HUMAN_ID)).toHaveLength(1);
  });
});

describe("終了と順位", () => {
  it("手札が0枚になったら上がりで、その時点でゲームが終わる", () => {
    const state = stateWith({
      hands: {
        you: hand("hearts-9"),
        "cpu-1": hand("clubs-9", "clubs-2"),
        "cpu-2": hand("clubs-10"),
        "cpu-3": hand("clubs-J"),
      },
    });

    const next = reduce(state, { type: "play", cardId: "hearts-9" });

    expect(next.phase).toBe("finished");
    expect(isGameOver(next)).toBe(true);
    expect(next.winnerId).toBe(HUMAN_ID);

    const ranking = getRanking(next);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[0].name).toBe("あなた");
  });

  it("最後の1枚が8でも、上がった時点で終わり手番は進まない", () => {
    const state = stateWith({
      hands: {
        you: hand("hearts-8"),
        "cpu-1": hand("clubs-9"),
        "cpu-2": hand("clubs-10"),
        "cpu-3": hand("clubs-J"),
      },
    });

    const next = reduce(state, { type: "play", cardId: "hearts-8" });

    expect(next.phase).toBe("finished");
    expect(next.turn.currentId).toBe(HUMAN_ID);
  });
});

describe("受け付けない操作", () => {
  it("出せるカードがあるときは山札から引けない", () => {
    const state = stateWith();

    expect(reduce(state, { type: "draw" })).toBe(state);
  });

  it("自分の手番でないときの play は無視される", () => {
    const state = stateWith({
      turn: createTurnState(players, { startId: "cpu-1" }),
    });

    expect(reduce(state, { type: "play", cardId: "hearts-9" })).toBe(state);
  });

  it("出せないカードを指定しても場札は変わらない", () => {
    const state = stateWith({
      hands: {
        you: hand("hearts-9", "clubs-2"),
        "cpu-1": hand("clubs-9"),
        "cpu-2": hand("clubs-10"),
        "cpu-3": hand("clubs-J"),
      },
    });

    expect(reduce(state, { type: "play", cardId: "clubs-2" })).toBe(state);
  });
});

describe("配りと進行", () => {
  it("52枚を4人に5枚ずつ配り、1枚めくって場札にする", () => {
    const state = createInitialState(1);

    expect(handOf(state, HUMAN_ID)).toHaveLength(5);
    expect(handOf(state, "cpu-3")).toHaveLength(5);
    expect(state.field).toHaveLength(1);
    expect(state.deck).toHaveLength(31);
    expect(countCards(state)).toBe(52);
  });

  it("同じ seed なら同じ配りになる", () => {
    const a = createInitialState(42);
    const b = createInitialState(42);

    expect(handOf(a, HUMAN_ID).map((item) => item.id)).toEqual(
      handOf(b, HUMAN_ID).map((item) => item.id),
    );
    expect(fieldTop(a).id).toBe(fieldTop(b).id);
  });

  it("CPU の手番だけ待ち時間が発生する", () => {
    const yourTurn = stateWith();
    const cpuTurn = stateWith({ turn: createTurnState(players, { startId: "cpu-1" }) });

    expect(pendingDelayMs(yourTurn)).toBeNull();
    expect(pendingDelayMs(cpuTurn)).toBe(CPU_DELAY_MS);
    expect(pendingDelayMs(stateWith({ phase: "finished" }))).toBeNull();
  });

  it("最後まで進めると決着し、カードは52枚のまま残る", () => {
    const state = playOut(7);

    expect(isGameOver(state)).toBe(true);
    expect(state.winnerId).not.toBeNull();
    expect(countCards(state)).toBe(52);
  });
});
