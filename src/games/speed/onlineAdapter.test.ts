import { card } from "@core";
import type { Player, PlayingCard } from "@core";
import { onlineAdapter } from "./onlineAdapter";
import type { OnlineSpeedAction, OnlineSpeedState, SpeedView } from "./onlineAdapter";

const alice: Player = { id: "p1", name: "アリス", kind: "human" };
const bob: Player = { id: "p2", name: "ボブ", kind: "human" };

function stateWith(
  parts: {
    aHand?: PlayingCard[];
    aDeck?: PlayingCard[];
    bHand?: PlayingCard[];
    bDeck?: PlayingCard[];
    piles?: [PlayingCard, PlayingCard];
  } = {},
): OnlineSpeedState {
  const base = onlineAdapter.createInitialState(1, [alice, bob]);
  return {
    ...base,
    game: {
      ...base.game,
      you: { hand: parts.aHand ?? base.game.you.hand, deck: parts.aDeck ?? base.game.you.deck },
      cpu: { hand: parts.bHand ?? base.game.cpu.hand, deck: parts.bDeck ?? base.game.cpu.deck },
      piles: parts.piles ?? base.game.piles,
    },
  };
}

function play(state: OnlineSpeedState, playerId: string, cardId: string) {
  const action: OnlineSpeedAction = { type: "play_card", cardId };
  const check = onlineAdapter.validateAction(state, action, playerId);
  return { check, next: check.ok ? onlineAdapter.reduce(state, action, playerId) : state };
}

describe("スピード オンライン: 初期状態", () => {
  it("2人で始まり、手札4枚と山札21枚が配られる", () => {
    const state = onlineAdapter.createInitialState(7, [alice, bob]);
    expect(onlineAdapter.minPlayers).toBe(2);
    expect(onlineAdapter.maxPlayers).toBe(2);
    expect(state.game.you.hand).toHaveLength(4);
    expect(state.game.cpu.hand).toHaveLength(4);
    expect(state.game.you.deck).toHaveLength(21);
    expect(state.game.cpu.deck).toHaveLength(21);
    expect(onlineAdapter.isFinished(state)).toBe(false);
  });

  it("同じ seed なら同じ配りになる", () => {
    expect(onlineAdapter.createInitialState(3, [alice, bob])).toEqual(
      onlineAdapter.createInitialState(3, [alice, bob]),
    );
  });

  it("2人以外や ID が重複する参加者は拒否する", () => {
    expect(() => onlineAdapter.createInitialState(1, [alice])).toThrow();
    expect(() => onlineAdapter.createInitialState(1, [alice, { ...bob, id: alice.id }])).toThrow();
  });
});

describe("スピード オンライン: Action の形式", () => {
  it("正しい形式だけを受け付ける", () => {
    expect(onlineAdapter.parseAction({ type: "play_card", cardId: "spades-7" })).toEqual({
      type: "play_card",
      cardId: "spades-7",
    });
    expect(onlineAdapter.parseAction({ type: "refill_piles", extra: 1 })).toEqual({ type: "refill_piles" });
  });

  it("不正な形式は null を返す", () => {
    expect(onlineAdapter.parseAction(null)).toBeNull();
    expect(onlineAdapter.parseAction("play_card")).toBeNull();
    expect(onlineAdapter.parseAction({ type: "unknown" })).toBeNull();
    expect(onlineAdapter.parseAction({ type: "play_card" })).toBeNull();
    expect(onlineAdapter.parseAction({ type: "play_card", cardId: 7 })).toBeNull();
    expect(onlineAdapter.parseAction({ type: "play_card", cardId: "" })).toBeNull();
    expect(onlineAdapter.parseAction({ type: "play_card", cardId: "x".repeat(21) })).toBeNull();
  });
});

describe("スピード オンライン: 合法操作", () => {
  const piles: [PlayingCard, PlayingCard] = [card("spades", "7"), card("hearts", "J")];

  it("手番に関係なく、どちらの参加者も出せるカードを出せる", () => {
    const state = stateWith({
      aHand: [card("clubs", "8")],
      aDeck: [card("clubs", "2")],
      bHand: [card("clubs", "10")],
      bDeck: [card("clubs", "3")],
      piles,
    });
    const a = play(state, alice.id, "clubs-8");
    expect(a.check.ok).toBe(true);
    expect(a.next.game.piles[0].id).toBe("clubs-8");
    expect(a.next.game.you.hand.map((c) => c.id)).toEqual(["clubs-2"]);

    const b = play(a.next, bob.id, "clubs-10");
    expect(b.check.ok).toBe(true);
    expect(b.next.game.piles[1].id).toBe("clubs-10");
  });

  it("両方の台札に出せるときは左に出る", () => {
    const state = stateWith({
      aHand: [card("clubs", "8")],
      aDeck: [card("clubs", "2")],
      piles: [card("spades", "7"), card("hearts", "9")],
    });
    expect(play(state, alice.id, "clubs-8").next.game.piles[0].id).toBe("clubs-8");
  });

  it("A と K はつながる", () => {
    const state = stateWith({
      aHand: [card("clubs", "A")],
      aDeck: [card("clubs", "2")],
      piles: [card("spades", "K"), card("hearts", "5")],
    });
    expect(play(state, alice.id, "clubs-A").check.ok).toBe(true);
  });

  it("両者とも出せないときは台札を更新できる", () => {
    const state = stateWith({
      aHand: [card("clubs", "2")],
      aDeck: [card("diamonds", "4")],
      bHand: [card("clubs", "3")],
      bDeck: [card("diamonds", "9")],
      piles: [card("spades", "7"), card("hearts", "J")],
    });
    const action: OnlineSpeedAction = { type: "refill_piles" };
    expect(onlineAdapter.validateAction(state, action, alice.id).ok).toBe(true);
    const next = onlineAdapter.reduce(state, action, bob.id);
    expect(next.game.piles.map((c) => c.id)).toEqual(["diamonds-4", "diamonds-9"]);
    expect(next.game.you.deck).toHaveLength(0);
  });
});

describe("スピード オンライン: 不正操作", () => {
  const piles: [PlayingCard, PlayingCard] = [card("spades", "7"), card("hearts", "J")];
  const state = stateWith({
    aHand: [card("clubs", "8"), card("clubs", "7")],
    aDeck: [card("clubs", "2")],
    bHand: [card("clubs", "10")],
    bDeck: [card("clubs", "3")],
    piles,
  });

  it("出せないカードと同じ数字は拒否し、状態を変えない", () => {
    const same = play(state, alice.id, "clubs-7");
    expect(same.check.ok).toBe(false);
    expect(same.next).toBe(state);
  });

  it("相手のカードと存在しないカードは拒否する", () => {
    expect(play(state, alice.id, "clubs-10").check.ok).toBe(false);
    expect(play(state, alice.id, "nothing").check.ok).toBe(false);
  });

  it("参加者以外の操作は拒否する", () => {
    expect(play(state, "stranger", "clubs-8").check.ok).toBe(false);
    expect(onlineAdapter.validateAction(state, { type: "refill_piles" }, "stranger").ok).toBe(false);
  });

  it("出せるカードがあるとき台札は更新できない", () => {
    expect(onlineAdapter.validateAction(state, { type: "refill_piles" }, alice.id).ok).toBe(false);
  });

  it("連打で同じカードを2回出せない", () => {
    const first = play(state, alice.id, "clubs-8");
    expect(first.check.ok).toBe(true);
    expect(play(first.next, alice.id, "clubs-8").check.ok).toBe(false);
  });
});

describe("スピード オンライン: 終了判定", () => {
  it("手札と山札を出し切った参加者が勝つ", () => {
    const state = stateWith({
      aHand: [card("clubs", "8")],
      aDeck: [],
      bHand: [card("clubs", "10")],
      bDeck: [card("clubs", "3")],
      piles: [card("spades", "7"), card("hearts", "J")],
    });
    const { next } = play(state, alice.id, "clubs-8");
    expect(onlineAdapter.isFinished(next)).toBe(true);
    expect(onlineAdapter.getResult(next).message).toBe("アリスの勝ち");
    expect((onlineAdapter.toPublicState(next, bob.id) as SpeedView).winnerId).toBe(alice.id);
  });

  it("両者詰みで山札も空なら、残り枚数が少ないほうが勝つ", () => {
    const state = stateWith({
      aHand: [card("clubs", "2")],
      aDeck: [],
      bHand: [card("clubs", "3"), card("clubs", "4")],
      bDeck: [],
      piles: [card("spades", "7"), card("hearts", "J")],
    });
    const next = onlineAdapter.reduce(state, { type: "refill_piles" }, alice.id);
    expect(onlineAdapter.isFinished(next)).toBe(true);
    expect(onlineAdapter.getResult(next).message).toBe("アリスの勝ち");
  });

  it("両者詰みで残り枚数が同じなら引き分け", () => {
    const state = stateWith({
      aHand: [card("clubs", "2")],
      aDeck: [],
      bHand: [card("clubs", "3")],
      bDeck: [],
      piles: [card("spades", "7"), card("hearts", "J")],
    });
    const next = onlineAdapter.reduce(state, { type: "refill_piles" }, bob.id);
    expect(onlineAdapter.getResult(next).message).toBe("引き分け");
    expect((onlineAdapter.toPublicState(next, alice.id) as SpeedView).winnerId).toBe("draw");
  });

  it("終了後の操作はすべて拒否する", () => {
    const state = stateWith({
      aHand: [card("clubs", "8")],
      aDeck: [],
      bHand: [card("clubs", "10")],
      bDeck: [card("clubs", "3")],
      piles: [card("spades", "7"), card("hearts", "J")],
    });
    const finished = play(state, alice.id, "clubs-8").next;
    expect(play(finished, bob.id, "clubs-10").check.ok).toBe(false);
    expect(onlineAdapter.validateAction(finished, { type: "refill_piles" }, bob.id).ok).toBe(false);
  });
});

describe("スピード オンライン: 非公開情報", () => {
  const state = onlineAdapter.createInitialState(42, [alice, bob]);

  it("相手の手札と山札、seed を公開状態に含めない", () => {
    const view = onlineAdapter.toPublicState(state, alice.id) as SpeedView;
    const json = JSON.stringify(view);

    for (const hidden of [...state.game.cpu.hand, ...state.game.cpu.deck, ...state.game.you.deck]) {
      expect(json).not.toContain(`"${hidden.id}"`);
    }
    expect(json).not.toContain("seed");
    expect(view.myHand).toEqual(state.game.you.hand);
    expect(view.myDeckCount).toBe(21);
    expect(view.opponent).toEqual({ id: bob.id, name: "ボブ", handCount: 4, deckCount: 21 });
  });

  it("参加者ごとに、自分の手札と相手の枚数が入れ替わる", () => {
    const view = onlineAdapter.toPublicState(state, bob.id) as SpeedView;
    expect(view.myHand).toEqual(state.game.cpu.hand);
    expect(view.opponent.id).toBe(alice.id);
    expect(JSON.stringify(view)).not.toContain(`"${state.game.you.hand[0].id}"`);
  });

  it("出せるカードの ID は自分の手札だけから作られる", () => {
    const view = onlineAdapter.toPublicState(state, alice.id) as SpeedView;
    for (const id of view.playableIds) {
      expect(state.game.you.hand.map((c) => c.id)).toContain(id);
    }
  });
});
