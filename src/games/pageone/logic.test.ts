/**
 * ページワン のテスト。
 *
 * 時間を扱わない純粋関数だけを相手にするので、setTimeout は出てきません。
 * 配りに左右されるテストを避けるため、手札・場札・山札を組み立てた状態を作って reduce に渡します。
 */
import { card, hand } from "@core";
import type { PlayingCard } from "@core";
import {
  canPlay,
  createInitialState,
  fieldTop,
  getRanking,
  isGameOver,
  legalMoves,
  reduce,
} from "./logic";
import type { PageOneState } from "./logic";

/** 配りの結果に左右されないよう、必要な部分だけ差し替えた状態を作る。 */
function makeState(patch: Partial<PageOneState>): PageOneState {
  return { ...createInitialState(1), ...patch };
}

/** 4人分の手札をまとめて作る。CPU の手札は影響しないよう1枚ずつにしておく。 */
function handsOf(you: PlayingCard[]): Record<string, PlayingCard[]> {
  return {
    you,
    "cpu-1": hand("spades-2"),
    "cpu-2": hand("spades-3"),
    "cpu-3": hand("spades-4"),
  };
}

/** 山札 + 場札 + 全員の手札の合計。 */
function totalCards(state: PageOneState): number {
  const inHands = Object.values(state.hands).reduce((sum, cards) => sum + cards.length, 0);
  return state.deck.length + state.field.length + inHands;
}

describe("ページワン", () => {
  it("同じマークなら出せる", () => {
    expect(canPlay(card("hearts", "3"), card("hearts", "9"))).toBe(true);
  });

  it("同じ数字なら出せる", () => {
    expect(canPlay(card("clubs", "7"), card("hearts", "7"))).toBe(true);
  });

  it("マークも数字も違うカードは出せない", () => {
    expect(canPlay(card("clubs", "7"), card("hearts", "9"))).toBe(false);
  });

  it("出せるカードが無いときは山札から1枚引く", () => {
    const state = makeState({
      hands: handsOf(hand("clubs-3", "spades-5")),
      field: [card("hearts", "9")],
      deck: hand("clubs-4", "diamonds-6"),
    });

    const next = reduce(state, { type: "draw" });

    expect(next.hands.you).toHaveLength(3);
    expect(next.deck).toHaveLength(1);
  });

  it("8を出すと次の人が飛ばされる", () => {
    const state = makeState({
      hands: handsOf(hand("hearts-8", "clubs-3")),
      field: [card("hearts", "9")],
    });

    const next = reduce(state, { type: "play", cardId: "hearts-8" });

    expect(next.turn.currentId).toBe("cpu-2");
  });

  it("Aを出すともう一度出せる", () => {
    const state = makeState({
      hands: handsOf(hand("hearts-A", "clubs-3")),
      field: [card("hearts", "9")],
    });

    const next = reduce(state, { type: "play", cardId: "hearts-A" });

    expect(next.turn.currentId).toBe("you");
    expect(next.hands.you).toHaveLength(1);
  });

  it("手札が0枚になったら上がりで、その時点でゲームが終わる", () => {
    const state = makeState({
      hands: handsOf(hand("hearts-3")),
      field: [card("hearts", "9")],
    });

    const next = reduce(state, { type: "play", cardId: "hearts-3" });

    expect(next.phase).toBe("finished");
    expect(next.winnerId).toBe("you");
    expect(isGameOver(next)).toBe(true);
    expect(getRanking(next)[0]).toMatchObject({ rank: 1, name: "あなた" });
  });

  it("出せるカードがあるときは山札から引けない", () => {
    const state = makeState({
      hands: handsOf(hand("hearts-3", "clubs-5")),
      field: [card("hearts", "9")],
      deck: hand("clubs-4"),
    });

    expect(reduce(state, { type: "draw" })).toBe(state);
  });

  it("自分の手番でないときに出そうとしても無視される", () => {
    const base = createInitialState(1);
    const state = makeState({
      hands: handsOf(hand("hearts-3", "clubs-5")),
      field: [card("hearts", "9")],
      turn: { ...base.turn, currentId: "cpu-1" },
    });

    expect(reduce(state, { type: "play", cardId: "hearts-3" })).toBe(state);
  });

  it("引いたカードが出せるときは、その場で出て手札が増えない", () => {
    const state = makeState({
      hands: handsOf(hand("spades-5")),
      field: [card("hearts", "9")],
      deck: hand("hearts-2", "clubs-4"),
    });

    const next = reduce(state, { type: "draw" });

    expect(next.hands.you).toHaveLength(1);
    expect(fieldTop(next).id).toBe("hearts-2");
  });

  it("山札が尽きたら場札の一番上だけを残し、残りを混ぜて山札に戻す", () => {
    const state = makeState({
      hands: handsOf(hand("spades-5", "spades-6")),
      field: [...hand("clubs-2", "clubs-3", "clubs-4"), card("hearts", "9")],
      deck: [],
    });

    const next = reduce(state, { type: "draw" });

    expect(next.field).toHaveLength(1);
    expect(next.field[0].id).toBe("hearts-9");
    expect(next.deck).toHaveLength(2);
    expect(next.hands.you).toHaveLength(3);
  });

  it("進行中はいつでも合計52枚のままになる", () => {
    let state = createInitialState(7);
    expect(totalCards(state)).toBe(52);

    for (let step = 0; step < 40 && !isGameOver(state); step += 1) {
      if (state.turn.currentId === "you") {
        const moves = legalMoves(state.hands.you, fieldTop(state));
        state = moves[0]
          ? reduce(state, { type: "play", cardId: moves[0].id })
          : reduce(state, { type: "draw" });
      } else {
        state = reduce(state, { type: "tick" });
      }
      expect(totalCards(state)).toBe(52);
    }
  });

  it("最初は4人に5枚ずつ配り、山札から1枚めくって場札にする", () => {
    const state = createInitialState(1);

    expect(state.hands.you).toHaveLength(5);
    expect(state.hands["cpu-3"]).toHaveLength(5);
    expect(state.field).toHaveLength(1);
    expect(state.deck).toHaveLength(31);
  });

  it("同じ seed なら同じ配りになる（テストが不安定にならない）", () => {
    const a = createInitialState(42);
    const b = createInitialState(42);
    expect(a.hands.you.map((c) => c.id)).toEqual(b.hands.you.map((c) => c.id));
    expect(a.deck.map((c) => c.id)).toEqual(b.deck.map((c) => c.id));
  });

  it("リセットすると最初の状態に戻る", () => {
    const state = reduce(createInitialState(1), { type: "reset", seed: 3 });

    expect(state.phase).toBe("playing");
    expect(state.hands.you).toHaveLength(5);
    expect(state.winnerId).toBeNull();
  });
});
