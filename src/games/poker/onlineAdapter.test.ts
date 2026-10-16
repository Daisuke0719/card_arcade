import { hand } from "@core";
import type { Player, PlayingCard } from "@core";
import { describe, expect, it } from "vitest";
import { onlineAdapter } from "./onlineAdapter";
import type { OnlinePokerAction, OnlinePokerState, PokerView } from "./onlineAdapter";

const PLAYERS: Player[] = [
  { id: "a", name: "A", kind: "human" },
  { id: "b", name: "B", kind: "human" },
];

const PAIR_OF_ACES = hand("spades-A", "hearts-A", "clubs-9", "diamonds-6", "spades-2");
const KING_HIGH = hand("clubs-K", "diamonds-Q", "hearts-7", "spades-5", "clubs-3");

/** 手札を指定した交換前の状態を作る。 */
function stateWith(handA: PlayingCard[], handB: PlayingCard[]): OnlinePokerState {
  return { ...onlineAdapter.createInitialState(1, PLAYERS), hands: { a: handA, b: handB } };
}

function viewOf(state: OnlinePokerState, viewerId: string): PokerView {
  return onlineAdapter.toPublicState(state, viewerId) as PokerView;
}

/** サーバーと同じく、検証に通ったときだけ状態を進める。 */
function apply(state: OnlinePokerState, action: OnlinePokerAction, playerId: string): OnlinePokerState {
  expect(onlineAdapter.validateAction(state, action, playerId)).toEqual({ ok: true });
  return onlineAdapter.reduce(state, action, playerId);
}

function rejectReason(state: OnlinePokerState, action: OnlinePokerAction, playerId: string): string | undefined {
  const check = onlineAdapter.validateAction(state, action, playerId);
  expect(check.ok).toBe(false);
  return check.reason;
}

const exchange = (...cardIds: string[]): OnlinePokerAction => ({ type: "exchange", cardIds });

describe("ポーカーのオンライン初期状態", () => {
  it("ゲームIDと2人固定の人数を公開する", () => {
    expect(onlineAdapter.gameId).toBe("poker");
    expect(onlineAdapter.minPlayers).toBe(2);
    expect(onlineAdapter.maxPlayers).toBe(2);
  });

  it("seed と参加者から5枚ずつ配り、残り42枚を山札にする", () => {
    const state = onlineAdapter.createInitialState(7, PLAYERS);
    expect(state.hands.a).toHaveLength(5);
    expect(state.hands.b).toHaveLength(5);
    expect(state.deck).toHaveLength(42);
    expect(state.exchanged).toEqual({ a: null, b: null });
    expect(state.phase).toBe("exchanging");
    expect(onlineAdapter.createInitialState(7, PLAYERS)).toEqual(state);
  });

  it("2人以外や同じIDの参加者では始めない", () => {
    expect(() => onlineAdapter.createInitialState(1, PLAYERS.slice(0, 1))).toThrow();
    expect(() => onlineAdapter.createInitialState(1, [...PLAYERS, { id: "c", name: "C", kind: "human" }])).toThrow();
    expect(() => onlineAdapter.createInitialState(1, [PLAYERS[0], PLAYERS[0]])).toThrow();
  });
});

describe("ポーカーのオンライン操作の形式", () => {
  it("交換する Action だけを受け付ける", () => {
    expect(onlineAdapter.parseAction({ type: "exchange", cardIds: ["spades-A"] })).toEqual(exchange("spades-A"));
    expect(onlineAdapter.parseAction({ type: "exchange", cardIds: [] })).toEqual(exchange());
  });

  it.each([
    null,
    "exchange",
    { type: "draw" },
    { type: "exchange" },
    { type: "exchange", cardIds: "spades-A" },
    { type: "exchange", cardIds: [1] },
    { type: "exchange", cardIds: ["a", "b", "c", "d", "e", "f"] },
    { type: "exchange", cardIds: ["x".repeat(21)] },
  ])("形式が正しくない操作 %j は null を返す", (value) => {
    expect(onlineAdapter.parseAction(value)).toBeNull();
  });
});

describe("ポーカーのオンライン交換", () => {
  it("1人が交換しても、もう1人が交換するまで試合は続く", () => {
    const start = onlineAdapter.createInitialState(3, PLAYERS);
    const discarded = start.hands.a.slice(0, 2).map((c) => c.id);
    const next = apply(start, exchange(...discarded), "a");

    expect(next.hands.a).toHaveLength(5);
    expect(next.hands.a.map((c) => c.id)).not.toContain(discarded[0]);
    expect(next.hands.a.slice(3)).toEqual(start.deck.slice(0, 2));
    expect(next.deck).toHaveLength(40);
    expect(next.exchanged).toEqual({ a: 2, b: null });
    expect(next.phase).toBe("exchanging");
    expect(onlineAdapter.isFinished(next)).toBe(false);
  });

  it("手番の順番はなく、後から交換した人も先に交換した人の残りから補充する", () => {
    const start = onlineAdapter.createInitialState(5, PLAYERS);
    const afterB = apply(start, exchange(start.hands.b[0].id), "b");
    const afterA = apply(afterB, exchange(start.hands.a[0].id), "a");
    expect(afterB.hands.b[4]).toEqual(start.deck[0]);
    expect(afterA.hands.a[4]).toEqual(start.deck[1]);
    expect(afterA.deck).toHaveLength(40);
  });

  it("2回目の交換、手札にないカード、重複したカード、参加者以外を拒否する", () => {
    const start = stateWith(PAIR_OF_ACES, KING_HIGH);
    expect(rejectReason(start, exchange("clubs-K"), "a")).toBe("手札にないカードは交換できません");
    expect(rejectReason(start, exchange("spades-2", "spades-2"), "a")).toBe("同じカードが重複しています");
    expect(rejectReason(start, exchange(), "c")).toBe("この試合の参加者ではありません");

    const exchanged = apply(start, exchange("spades-2"), "a");
    expect(rejectReason(exchanged, exchange(), "a")).toBe("交換は1回だけです");
  });

  it("検証を通らない操作を reduce に渡しても状態は変わらない", () => {
    const start = stateWith(PAIR_OF_ACES, KING_HIGH);
    expect(onlineAdapter.reduce(start, exchange("clubs-K"), "a")).toBe(start);
    expect(onlineAdapter.reduce(start, exchange(), undefined)).toBe(start);
  });
});

describe("ポーカーのオンライン終了判定", () => {
  it("2人とも交換を終えたら役を比べて試合を終える", () => {
    const finished = apply(apply(stateWith(PAIR_OF_ACES, KING_HIGH), exchange(), "a"), exchange(), "b");

    expect(onlineAdapter.isFinished(finished)).toBe(true);
    expect(finished.winnerId).toBe("a");
    expect(finished.values?.a.rank).toBe("one-pair");
    expect(finished.values?.b.rank).toBe("high-card");
    expect(onlineAdapter.getResult(finished)).toEqual({
      outcome: "done",
      message: "Aの勝ち",
      ranking: [
        { rank: 1, name: "A", detail: "ワンペア" },
        { rank: 2, name: "B", detail: "ハイカード" },
      ],
    });
  });

  it("役と tiebreak が同じなら引き分けにする", () => {
    const sameRank = hand("clubs-A", "diamonds-A", "hearts-K", "clubs-Q", "diamonds-J");
    const finished = apply(apply(stateWith(PAIR_OF_ACES, sameRank), exchange(), "b"), exchange(), "a");

    expect(finished.winnerId).toBeNull();
    expect(onlineAdapter.getResult(finished).message).toBe("引き分け");
    expect(onlineAdapter.getResult(finished).ranking?.map((entry) => entry.rank)).toEqual([1, 1]);
  });

  it("試合終了後の操作を拒否する", () => {
    const finished = apply(apply(stateWith(PAIR_OF_ACES, KING_HIGH), exchange(), "a"), exchange(), "b");
    expect(rejectReason(finished, exchange(), "a")).toBe("試合は終了しています");
    expect(rejectReason(finished, exchange(), "b")).toBe("試合は終了しています");
  });
});

describe("ポーカーのオンライン公開状態", () => {
  it("決着前は相手の手札と山札の中身を含めず、枚数だけを渡す", () => {
    const start = stateWith(PAIR_OF_ACES, KING_HIGH);
    const view = viewOf(start, "a");

    expect(view.me.cards).toEqual(PAIR_OF_ACES);
    expect(view.opponent).toMatchObject({ id: "b", cards: null, cardCount: 5, handRank: null });
    expect(view.deckCount).toBe(42);
    // 手札だけを差し替えた状態なので、山札には自分の手札と同じカードが残っている。それは除いて確かめる。
    const myIds = new Set(PAIR_OF_ACES.map((c) => c.id));
    const hiddenIds = [...KING_HIGH, ...start.deck].map((c) => c.id).filter((id) => !myIds.has(id));
    const json = JSON.stringify(view);
    for (const id of hiddenIds) expect(json).not.toContain(`"${id}"`);
  });

  it("自分だけ交換を終えた段階でも、相手の手札は伏せたまま交換枚数だけを見せる", () => {
    const afterA = apply(stateWith(PAIR_OF_ACES, KING_HIGH), exchange("spades-2"), "a");

    const forB = viewOf(afterA, "b");
    expect(forB.opponent).toMatchObject({ id: "a", cards: null, exchangedCount: 1 });
    expect(JSON.stringify(forB)).not.toContain("spades-A");
    expect(viewOf(afterA, "a").me.exchangedCount).toBe(1);
  });

  it("2人とも交換を終えたら両者の手札と役を公開する", () => {
    const finished = apply(apply(stateWith(PAIR_OF_ACES, KING_HIGH), exchange(), "a"), exchange(), "b");
    const view = viewOf(finished, "b");

    expect(view.phase).toBe("finished");
    expect(view.me).toMatchObject({ id: "b", cards: KING_HIGH, handRank: "high-card" });
    expect(view.opponent).toMatchObject({ id: "a", cards: PAIR_OF_ACES, handRank: "one-pair" });
    expect(view.winnerId).toBe("a");
  });

  it("参加者以外の閲覧者には、どちらの手札も見せない", () => {
    const view = viewOf(stateWith(PAIR_OF_ACES, KING_HIGH), "c");
    expect(view.me.cards).toBeNull();
    expect(view.opponent.cards).toBeNull();
  });
});
