import { card } from "@core";
import type { Player, PlayingCard } from "@core";
import type { DoubtState, DoubtView } from "./logic";
import { onlineAdapter } from "./onlineAdapter";
import type { OnlineDoubtAction } from "./onlineAdapter";

/** サーバーが viewerId に送る公開状態。 */
function viewOf(state: DoubtState, viewerId: string): DoubtView {
  return onlineAdapter.toPublicState(state, viewerId) as DoubtView;
}

function players(count: number): Player[] {
  return ["a", "b", "c", "d"].slice(0, count).map((id) => ({ id, name: id.toUpperCase(), kind: "human" }));
}

/** 2人戦で、手札を指定した A の手番の状態を作る。 */
function twoPlayerState(handA: PlayingCard[], handB: PlayingCard[]): DoubtState {
  const initial = onlineAdapter.createInitialState(1, players(2));
  return { ...initial, hands: { a: handA, b: handB } };
}

/** サーバーと同じく、検証に通ったときだけ状態を進める。 */
function apply(state: DoubtState, action: OnlineDoubtAction, playerId: string): DoubtState {
  const check = onlineAdapter.validateAction(state, action, playerId);
  expect(check).toEqual({ ok: true });
  return onlineAdapter.reduce(state, action, playerId);
}

function rejectReason(state: DoubtState, action: OnlineDoubtAction, playerId: string): string | undefined {
  const check = onlineAdapter.validateAction(state, action, playerId);
  expect(check.ok).toBe(false);
  return check.reason;
}

describe("ダウトのオンライン初期状態", () => {
  it("ゲームIDと2〜4人の人数を公開する", () => {
    expect(onlineAdapter.gameId).toBe("doubt");
    expect(onlineAdapter.minPlayers).toBe(2);
    expect(onlineAdapter.maxPlayers).toBe(4);
  });

  it.each([
    [2, [26, 26]],
    [3, [18, 17, 17]],
    [4, [13, 13, 13, 13]],
  ])("%i人に52枚を配り切る", (count, expected) => {
    const state = onlineAdapter.createInitialState(7, players(count));
    const hands = players(count).map((player) => state.hands[player.id]);
    expect(hands.map((hand) => hand.length)).toEqual(expected);
    expect(new Set(hands.flat().map((c) => c.id)).size).toBe(52);
    expect(state.turn.currentId).toBe("a");
    expect(state.declaredRank).toBe("A");
    expect(state.phase).toBe("playing");
  });

  it("同じ seed と参加者なら同じ初期状態になる", () => {
    expect(onlineAdapter.createInitialState(42, players(3))).toEqual(onlineAdapter.createInitialState(42, players(3)));
  });

  it("CPU として渡された参加者も人間として扱う", () => {
    const state = onlineAdapter.createInitialState(1, [...players(1), { id: "x", name: "X", kind: "cpu" }]);
    expect(state.turn.players.every((player) => player.kind === "human")).toBe(true);
  });

  it("1人、5人、IDの重複した参加者では始められない", () => {
    expect(() => onlineAdapter.createInitialState(1, players(1))).toThrow();
    expect(() => onlineAdapter.createInitialState(1, [...players(4), { id: "e", name: "E", kind: "human" }])).toThrow();
    expect(() => onlineAdapter.createInitialState(1, [...players(1), ...players(1)])).toThrow();
  });
});

describe("ダウトのオンライン Action の形式", () => {
  it("正しい形式の Action を受け付ける", () => {
    expect(onlineAdapter.parseAction({ type: "play", cardIds: ["spades-A"] })).toEqual({ type: "play", cardIds: ["spades-A"] });
    expect(onlineAdapter.parseAction({ type: "doubt" })).toEqual({ type: "doubt" });
    expect(onlineAdapter.parseAction({ type: "pass", extra: 1 })).toEqual({ type: "pass" });
  });

  it("形式の違う Action とクライアントから送れない Action を拒否する", () => {
    for (const value of [
      null, "play", { type: "unknown" }, { type: "tick" }, { type: "reset" },
      { type: "play", cardIds: "spades-A" }, { type: "play", cardIds: [1] },
      { type: "play", cardIds: ["a", "b", "c", "d", "e"] }, { type: "play", cardIds: ["x".repeat(21)] },
    ]) {
      expect(onlineAdapter.parseAction(value)).toBeNull();
    }
  });
});

describe("ダウトのオンライン合法操作", () => {
  it("出すと次の人がダウトを判断し、見送ると宣言が進んで次の人の手番になる", () => {
    const start = twoPlayerState([card("spades", "A"), card("hearts", "3")], [card("clubs", "9"), card("clubs", "10")]);
    const played = apply(start, { type: "play", cardIds: ["hearts-3"] }, "a");
    expect(played.phase).toBe("doubt-decision");
    expect(played.deciderId).toBe("b");
    const passed = apply(played, { type: "pass" }, "b");
    expect(passed.phase).toBe("playing");
    expect(passed.turn.currentId).toBe("b");
    expect(passed.declaredRank).toBe("2");
    expect(passed.pile).toHaveLength(1);
  });

  it("うそを見抜かれたら出した人が場札を引き取り、公開後にダウトした人の番になる", () => {
    const start = twoPlayerState([card("spades", "A"), card("hearts", "3")], [card("clubs", "9")]);
    const played = apply(start, { type: "play", cardIds: ["hearts-3"] }, "a");
    const doubted = apply(played, { type: "doubt" }, "b");
    expect(doubted.phase).toBe("revealing");
    expect(doubted.takerId).toBe("a");
    expect(doubted.hands.a).toHaveLength(2);
    expect(onlineAdapter.pendingDelayMs?.(doubted)).toBe(1200);
    const next = onlineAdapter.tick!(doubted);
    expect(next.phase).toBe("playing");
    expect(next.turn.currentId).toBe("b");
    expect(next.declaredRank).toBe("A");
  });

  it("正直に出したのにダウトされたら、ダウトした人が場札を引き取る", () => {
    const start = twoPlayerState([card("spades", "A"), card("hearts", "3")], [card("clubs", "9")]);
    const played = apply(start, { type: "play", cardIds: ["spades-A"] }, "a");
    const doubted = apply(played, { type: "doubt" }, "b");
    expect(doubted.takerId).toBe("b");
    expect(doubted.hands.b.map((c) => c.id)).toEqual(["clubs-9", "spades-A"]);
    expect(onlineAdapter.tick!(doubted).turn.currentId).toBe("a");
  });

  it("公開中でなければ時間経過で状態を進めない", () => {
    const start = twoPlayerState([card("spades", "A")], [card("clubs", "9")]);
    expect(onlineAdapter.pendingDelayMs?.(start)).toBeNull();
    expect(onlineAdapter.tick!(start)).toBe(start);
  });
});

describe("ダウトのオンライン不正操作", () => {
  const start = twoPlayerState([card("spades", "A"), card("hearts", "3")], [card("clubs", "9")]);

  it("手番でない人は出せない", () => {
    expect(rejectReason(start, { type: "play", cardIds: ["clubs-9"] }, "b")).toBe("あなたの手番ではありません");
  });

  it("手札にないカード、0枚、5枚、同じカードの重複は出せない", () => {
    expect(rejectReason(start, { type: "play", cardIds: ["clubs-9"] }, "a")).toBe("手札にないカードは出せません");
    expect(rejectReason(start, { type: "play", cardIds: [] }, "a")).toBe("1〜4枚を選んでください");
    expect(rejectReason(start, { type: "play", cardIds: ["spades-A", "hearts-3", "x", "y", "z"] }, "a")).toBe("1〜4枚を選んでください");
    expect(rejectReason(start, { type: "play", cardIds: ["spades-A", "spades-A"] }, "a")).toBe("同じカードを重ねて選べません");
  });

  it("ダウトを聞かれていない人はダウトも見送りもできない", () => {
    expect(rejectReason(start, { type: "doubt" }, "b")).toBe("いまはダウトを判断する番ではありません");
    const played = apply(start, { type: "play", cardIds: ["spades-A"] }, "a");
    expect(rejectReason(played, { type: "doubt" }, "a")).toBe("いまはダウトを判断する番ではありません");
    expect(rejectReason(played, { type: "pass" }, "a")).toBe("いまはダウトを判断する番ではありません");
    expect(rejectReason(played, { type: "play", cardIds: ["hearts-3"] }, "a")).toBe("あなたの手番ではありません");
  });

  it("ダウトの結果を表示している間は操作できない", () => {
    const played = apply(start, { type: "play", cardIds: ["hearts-3"] }, "a");
    const doubted = apply(played, { type: "doubt" }, "b");
    expect(rejectReason(doubted, { type: "play", cardIds: ["clubs-9"] }, "b")).toBe("ダウトの結果を表示しています");
  });

  it("検証を通さずに reduce を呼んでも、手番外の操作では状態が変わらない", () => {
    expect(onlineAdapter.reduce(start, { type: "play", cardIds: ["clubs-9"] }, "b")).toBe(start);
    expect(onlineAdapter.reduce(start, { type: "doubt" }, "b")).toBe(start);
  });
});

describe("ダウトのオンライン終了判定", () => {
  it("最後の1枚を出して見送られると上がり、残り1人で試合が終わる", () => {
    const start = twoPlayerState([card("spades", "A")], [card("clubs", "9")]);
    const played = apply(start, { type: "play", cardIds: ["spades-A"] }, "a");
    expect(onlineAdapter.isFinished(played)).toBe(false);
    const finished = apply(played, { type: "pass" }, "b");
    expect(onlineAdapter.isFinished(finished)).toBe(true);
    const result = onlineAdapter.getResult(finished);
    expect(result.outcome).toBe("done");
    expect(result.ranking?.[0]?.name).toBe("A");
    expect(result.message).toBe("Aが1位");
  });

  it("試合終了後の操作はすべて拒否する", () => {
    const start = twoPlayerState([card("spades", "A")], [card("clubs", "9")]);
    const finished = apply(apply(start, { type: "play", cardIds: ["spades-A"] }, "a"), { type: "pass" }, "b");
    for (const [action, id] of [
      [{ type: "play", cardIds: ["clubs-9"] }, "b"],
      [{ type: "doubt" }, "b"],
      [{ type: "pass" }, "a"],
    ] as const) {
      expect(rejectReason(finished, action, id)).toBe("試合は終了しています");
    }
    expect(onlineAdapter.pendingDelayMs?.(finished)).toBeNull();
  });
});

describe("ダウトのオンライン公開状態", () => {
  it("自分の手札だけを含め、他の人は枚数だけにする", () => {
    const state = onlineAdapter.createInitialState(3, players(3));
    const view = viewOf(state, "a");
    expect(view.myHand).toEqual(state.hands.a);
    expect(view.players.map((player) => player.cardCount)).toEqual([18, 17, 17]);
    expect(view).not.toHaveProperty("hands");
    expect(view).not.toHaveProperty("seed");
    const json = JSON.stringify(view);
    for (const other of [...state.hands.b, ...state.hands.c]) expect(json).not.toContain(`"${other.id}"`);
  });

  it("ダウトの判断中は、出されたカードの中身を誰にも見せない", () => {
    const start = twoPlayerState([card("spades", "A"), card("hearts", "3")], [card("clubs", "9")]);
    const played = apply(start, { type: "play", cardIds: ["hearts-3"] }, "a");
    const view = viewOf(played, "b");
    expect(view.lastPlay).toEqual({ playerId: "a", declaredRank: "A", count: 1 });
    expect(view.pileCount).toBe(1);
    expect(JSON.stringify(view)).not.toContain('"hearts-3"');
  });

  it("ダウト後の公開中は直前の組だけを見せ、それより前の場札は見せない", () => {
    const start = twoPlayerState([card("spades", "A"), card("hearts", "3")], [card("clubs", "9"), card("clubs", "10")]);
    const first = apply(apply(start, { type: "play", cardIds: ["spades-A"] }, "a"), { type: "pass" }, "b");
    const second = apply(first, { type: "play", cardIds: ["clubs-10"] }, "b");
    const doubted = apply(second, { type: "doubt" }, "a");
    const view = viewOf(doubted, "a");
    expect(view.reveal?.cards.map((c) => c.id)).toEqual(["clubs-10"]);
    expect(JSON.stringify(view)).not.toContain('"spades-A"');
  });
});
