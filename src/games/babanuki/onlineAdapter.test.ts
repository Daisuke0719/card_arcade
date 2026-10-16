import { card, joker } from "@core";
import type { AnyCard, Player } from "@core";
import type { BabanukiState, BabanukiView } from "./logic";
import { onlineAdapter } from "./onlineAdapter";
import type { OnlineBabanukiAction } from "./onlineAdapter";

/** サーバーが viewerId に送る公開状態。 */
function viewOf(state: BabanukiState, viewerId: string): BabanukiView {
  return onlineAdapter.toPublicState(state, viewerId) as BabanukiView;
}

function players(count: number): Player[] {
  return ["a", "b", "c", "d"].slice(0, count).map((id) => ({ id, name: id.toUpperCase(), kind: "human" }));
}

/** 参加者 a, b, ... の手札を指定した、a の手番の状態を作る。 */
function stateWith(...hands: AnyCard[][]): BabanukiState {
  const initial = onlineAdapter.createInitialState(1, players(hands.length));
  return { ...initial, hands: Object.fromEntries(hands.map((hand, i) => [players(4)[i].id, hand])) };
}

/** サーバーと同じく、検証に通ったときだけ状態を進める。 */
function apply(state: BabanukiState, action: OnlineBabanukiAction, playerId: string): BabanukiState {
  const check = onlineAdapter.validateAction(state, action, playerId);
  expect(check).toEqual({ ok: true });
  return onlineAdapter.reduce(state, action, playerId);
}

function rejectReason(state: BabanukiState, action: OnlineBabanukiAction, playerId: string): string | undefined {
  const check = onlineAdapter.validateAction(state, action, playerId);
  expect(check.ok).toBe(false);
  return check.reason;
}

describe("ババ抜きのオンライン初期状態", () => {
  it("ゲームIDと2〜4人の人数を公開する", () => {
    expect(onlineAdapter.gameId).toBe("babanuki");
    expect(onlineAdapter.minPlayers).toBe(2);
    expect(onlineAdapter.maxPlayers).toBe(4);
  });

  it.each([2, 3, 4])("%i人に53枚を配り切り、配った直後のペアを捨てた状態から始める", (count) => {
    const state = onlineAdapter.createInitialState(7, players(count));
    const hands = players(count).map((player) => state.hands[player.id]);
    const all = hands.flat();

    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
    expect(all.filter((c) => c.kind === "joker")).toHaveLength(1);
    for (const hand of hands) {
      const ranks = hand.flatMap((c) => (c.kind === "standard" ? [c.rank] : []));
      expect(new Set(ranks).size).toBe(ranks.length);
    }
    expect(state.turn.currentId).toBe("a");
    expect(state.phase).toBe("playing");
  });

  it("同じ seed と参加者なら同じ初期状態になる", () => {
    expect(onlineAdapter.createInitialState(42, players(3))).toEqual(onlineAdapter.createInitialState(42, players(3)));
  });

  it("CPU として渡された参加者も人間として扱い、時間経過で勝手に引かない", () => {
    const state = onlineAdapter.createInitialState(1, [...players(1), { id: "x", name: "X", kind: "cpu" }]);
    expect(state.turn.players.every((player) => player.kind === "human")).toBe(true);
    expect(onlineAdapter.pendingDelayMs?.({ ...state, turn: { ...state.turn, currentId: "x" } })).toBeNull();
  });

  it("1人、5人、IDの重複した参加者では始められない", () => {
    expect(() => onlineAdapter.createInitialState(1, players(1))).toThrow();
    expect(() => onlineAdapter.createInitialState(1, [...players(4), { id: "e", name: "E", kind: "human" }])).toThrow();
    expect(() => onlineAdapter.createInitialState(1, [...players(1), ...players(1)])).toThrow();
  });
});

describe("ババ抜きのオンライン Action の形式", () => {
  it("位置を指定した draw を受け付ける", () => {
    expect(onlineAdapter.parseAction({ type: "draw", index: 0 })).toEqual({ type: "draw", index: 0 });
    expect(onlineAdapter.parseAction({ type: "draw", index: 3, extra: 1 })).toEqual({ type: "draw", index: 3 });
  });

  it("形式の違う Action と、クライアントから送れない Action を拒否する", () => {
    for (const value of [
      null, "draw", { type: "unknown" }, { type: "tick" }, { type: "reset" },
      { type: "draw" }, { type: "draw", index: "0" }, { type: "draw", index: -1 },
      { type: "draw", index: 1.5 }, { type: "draw", index: Number.NaN }, { type: "draw", index: 53 },
      { type: "draw", cardId: "spades-A" },
    ]) {
      expect(onlineAdapter.parseAction(value)).toBeNull();
    }
  });
});

describe("ババ抜きのオンライン合法操作", () => {
  it("引いたカードでペアがそろえば捨て、見せ終わったら引かれた人の手番になる", () => {
    const start = stateWith(
      [card("spades", "7"), card("clubs", "2")],
      [card("hearts", "7"), card("clubs", "5")],
      [card("diamonds", "9")],
    );
    const drawn = apply(start, { type: "draw", index: 0 }, "a");

    expect(drawn.phase).toBe("revealing");
    expect(drawn.hands.a.map((c) => c.id)).toEqual(["clubs-2"]);
    expect(drawn.hands.b.map((c) => c.id)).toEqual(["clubs-5"]);
    expect(onlineAdapter.pendingDelayMs?.(drawn)).toBe(700);

    const next = onlineAdapter.tick!(drawn);
    expect(next.phase).toBe("playing");
    expect(next.turn.currentId).toBe("b");
    expect(onlineAdapter.pendingDelayMs?.(next)).toBeNull();
  });

  it("2人戦では交互に相手から引く", () => {
    const start = stateWith([card("spades", "2"), card("spades", "3")], [card("hearts", "4"), card("hearts", "5")]);
    const afterA = onlineAdapter.tick!(apply(start, { type: "draw", index: 1 }, "a"));
    expect(afterA.turn.currentId).toBe("b");
    expect(afterA.hands.a).toHaveLength(3);

    const afterB = onlineAdapter.tick!(apply(afterA, { type: "draw", index: 2 }, "b"));
    expect(afterB.turn.currentId).toBe("a");
    expect(afterB.hands.b).toHaveLength(2);
  });

  it("引く相手が上がっていれば、その次に残っている人から引く", () => {
    const start = stateWith([card("spades", "2")], [], [card("hearts", "4")]);
    const skipped = { ...start, turn: { ...start.turn, finishedIds: ["b"] } };
    const drawn = apply(skipped, { type: "draw", index: 0 }, "a");
    expect(drawn.hands.a).toHaveLength(2);
    expect(drawn.hands.c).toHaveLength(0);
  });

  it("公開中でなければ時間経過で状態を進めない", () => {
    const start = stateWith([card("spades", "2")], [card("hearts", "4")]);
    expect(onlineAdapter.pendingDelayMs?.(start)).toBeNull();
    expect(onlineAdapter.tick!(start)).toBe(start);
  });
});

describe("ババ抜きのオンライン不正操作", () => {
  const start = stateWith([card("spades", "2")], [card("hearts", "4"), card("hearts", "5")], [joker()]);

  it("手番でない人は引けない", () => {
    expect(rejectReason(start, { type: "draw", index: 0 }, "b")).toBe("あなたの手番ではありません");
    expect(rejectReason(start, { type: "draw", index: 0 }, "z")).toBe("あなたの手番ではありません");
  });

  it("引く相手の枚数を超える位置は引けない", () => {
    expect(rejectReason(start, { type: "draw", index: 2 }, "a")).toBe("その位置にはカードがありません");
  });

  it("引いたカードを見せている間は、続けて引けない（連打を拒否する）", () => {
    const drawn = apply(start, { type: "draw", index: 0 }, "a");
    expect(rejectReason(drawn, { type: "draw", index: 0 }, "a")).toBe("引いたカードを確認しています");
    expect(rejectReason(drawn, { type: "draw", index: 0 }, "b")).toBe("引いたカードを確認しています");
  });

  it("検証を通さずに reduce を呼んでも、手番外の操作では状態が変わらない", () => {
    expect(onlineAdapter.reduce(start, { type: "draw", index: 0 }, "b")).toBe(start);
    expect(onlineAdapter.reduce(start, { type: "draw", index: 0 })).toBe(start);
  });
});

describe("ババ抜きのオンライン終了判定", () => {
  /** a が b の最後のペアを引いて上がり、b も 0 枚になって、ジョーカーを持つ c だけが残る。 */
  const start = stateWith([card("spades", "7")], [card("hearts", "7")], [joker()]);

  it("残りが1人になったら試合を終え、上がった順に順位を付ける", () => {
    const finished = apply(start, { type: "draw", index: 0 }, "a");

    expect(onlineAdapter.isFinished(finished)).toBe(true);
    expect(onlineAdapter.pendingDelayMs?.(finished)).toBeNull();
    const result = onlineAdapter.getResult(finished);
    expect(result.outcome).toBe("done");
    expect(result.ranking?.map((entry) => entry.name)).toEqual(["A", "B", "C"]);
    expect(result.message).toBe("Aが1位");
  });

  it("試合終了後の操作は拒否する", () => {
    const finished = apply(start, { type: "draw", index: 0 }, "a");
    for (const id of ["a", "b", "c"]) {
      expect(rejectReason(finished, { type: "draw", index: 0 }, id)).toBe("試合は終了しています");
    }
  });

  it("試合が続いている間は終了と判定しない", () => {
    expect(onlineAdapter.isFinished(start)).toBe(false);
  });
});

describe("ババ抜きのオンライン公開状態", () => {
  it("自分の手札だけを含め、他の人の手札はカードIDもランクも含めず枚数だけにする", () => {
    const state = onlineAdapter.createInitialState(3, players(3));
    const view = viewOf(state, "a");

    expect(view.myHand).toEqual(state.hands.a);
    expect(view.seats.map((seat) => seat.handCount)).toEqual([state.hands.a.length, state.hands.b.length, state.hands.c.length]);
    expect(view).not.toHaveProperty("hands");
    expect(view).not.toHaveProperty("seed");
    expect(view).not.toHaveProperty("drawCount");

    const json = JSON.stringify(view);
    for (const other of [...state.hands.b, ...state.hands.c]) expect(json).not.toContain(`"${other.id}"`);
    // ランクが入っているのは自分の手札のカードだけ
    const ownStandards = state.hands.a.filter((c) => c.kind === "standard").length;
    expect(json.match(/"rank":/g) ?? []).toHaveLength(ownStandards);
  });

  it("引く側には、引く相手の枚数と位置を選ぶための情報だけを渡す", () => {
    const state = stateWith([card("spades", "2")], [card("hearts", "4"), joker()]);
    const view = viewOf(state, "a");
    expect(view.targetId).toBe("b");
    expect(view.seats.find((seat) => seat.id === "b")?.handCount).toBe(2);

    const json = JSON.stringify(view);
    expect(json).not.toContain("hearts-4");
    expect(json).not.toContain("joker");
  });

  it("引いたカードは引いた本人にだけ見せる", () => {
    const start = stateWith([card("spades", "2")], [card("hearts", "4"), card("hearts", "5")], [card("clubs", "9")]);
    const drawn = apply(start, { type: "draw", index: 0 }, "a");

    expect(viewOf(drawn, "a").lastDrawn?.id).toBe("hearts-4");
    for (const id of ["b", "c"]) {
      const view = viewOf(drawn, id);
      expect(view.lastDrawn).toBeNull();
      expect(view.lastDrawerId).toBe("a");
      expect(JSON.stringify(view)).not.toContain("spades-2");
    }
  });
});
