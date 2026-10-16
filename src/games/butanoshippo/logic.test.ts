import { card } from "@core";
import {
  COLLECT_DELAY_MS,
  CPU_INTERVAL_MS,
  collectPile,
  createInitialState,
  flipNext,
  getRanking,
  isGameOver,
  isMatch,
  pendingDelayMs,
  reduce,
} from "./logic";

describe("ぶたのしっぽのルール", () => {
  it("同じ数字が続いたら場札を全部引き取る", () => {
    const initial = createInitialState(1);
    const beforeMatch = {
      ...initial,
      ring: [card("hearts", "7")],
      pile: [card("spades", "7")],
      turn: { ...initial.turn, currentId: "you" },
    };
    const matched = flipNext(beforeMatch);
    expect(isMatch(card("spades", "7"), card("hearts", "7"))).toBe(true);
    expect(matched.phase).toBe("collecting");
    expect(collectPile(matched).collected.you).toBe(2);
    expect(isMatch(undefined, card("hearts", "7"))).toBe(false);
  });

  it("違う数字なら場に積まれるだけで引き取りは起きない", () => {
    const initial = createInitialState(2);
    const state = {
      ...initial,
      ring: [card("hearts", "8")],
      pile: [card("spades", "7")],
      turn: { ...initial.turn, currentId: "you" },
    };
    const next = flipNext(state);
    expect(next.pile.map((item) => item.id)).toEqual(["spades-7", "hearts-8"]);
    expect(next.phase).toBe("finished");
    expect(next.collected.you).toBe(0);
  });

  it("引き取りのあと場が空になる", () => {
    const initial = createInitialState(3);
    const state = {
      ...initial,
      ring: [card("hearts", "7")],
      pile: [card("spades", "7"), card("clubs", "4")],
      turn: { ...initial.turn, currentId: "you" },
      phase: "collecting" as const,
    };
    const next = collectPile(state);
    expect(next.pile).toEqual([]);
    expect(next.collected.you).toBe(2);
  });

  it("輪のカードが尽きたらゲームが終了する", () => {
    const initial = createInitialState(4);
    const lastFlip = {
      ...initial,
      ring: [card("clubs", "4")],
      pile: [card("spades", "2")],
      turn: { ...initial.turn, currentId: "you" },
    };
    expect(flipNext(lastFlip).phase).toBe("finished");
  });

  it("引き取った枚数が一番少ない人が1位になる", () => {
    const initial = createInitialState(5);
    const state = {
      ...initial,
      collected: { you: 4, "cpu-1": 0, "cpu-2": 4, "cpu-3": 2 },
    };
    expect(getRanking(state)).toEqual([
      { rank: 1, name: "CPU 1", detail: "0点" },
      { rank: 2, name: "CPU 3", detail: "2点" },
      { rank: 3, name: "あなた", detail: "4点" },
      { rank: 3, name: "CPU 2", detail: "4点" },
    ]);
  });

  it("引き取った人の次の人から再開する", () => {
    const initial = createInitialState(6);
    const state = {
      ...initial,
      ring: [card("hearts", "9")],
      pile: [card("spades", "9")],
      turn: { ...initial.turn, currentId: "cpu-2" },
      phase: "collecting" as const,
    };
    const collected = reduce(state, { type: "tick" });
    expect(collected.lastCollectorId).toBe("cpu-2");
    expect(collected.turn.currentId).toBe("cpu-3");
  });

  it("CPUの手番や引き取り演出中はプレイヤーのめくり操作を受け付けない", () => {
    const initial = createInitialState(7);
    const cpuTurn = { ...initial, turn: { ...initial.turn, currentId: "cpu-1" } };
    expect(reduce(cpuTurn, { type: "flip" })).toBe(cpuTurn);
    const collecting = { ...initial, phase: "collecting" as const };
    expect(reduce(collecting, { type: "flip" })).toBe(collecting);
  });

  it("最後の1枚で一致したときは引き取りを済ませてから終了する", () => {
    const initial = createInitialState(8);
    const state = {
      ...initial,
      ring: [card("hearts", "5")],
      pile: [card("clubs", "9"), card("spades", "5")],
      turn: { ...initial.turn, currentId: "you" },
    };

    const flipped = flipNext(state);
    expect(flipped.ring).toEqual([]);
    expect(flipped.phase).toBe("collecting");
    expect(isGameOver(flipped)).toBe(false);

    const finished = reduce(flipped, { type: "tick" });
    expect(finished.collected.you).toBe(3);
    expect(finished.pile).toEqual([]);
    expect(isGameOver(finished)).toBe(true);
  });

  it("CPUの手番はtickで1枚めくって進み、待ち時間はpendingDelayMsが返す", () => {
    const initial = createInitialState(9);
    const cpuTurn = { ...initial, turn: { ...initial.turn, currentId: "cpu-1" } };

    expect(pendingDelayMs(initial)).toBeNull();
    expect(pendingDelayMs(cpuTurn)).toBe(CPU_INTERVAL_MS);
    expect(pendingDelayMs({ ...initial, phase: "collecting" as const })).toBe(COLLECT_DELAY_MS);
    expect(pendingDelayMs({ ...initial, phase: "finished" as const })).toBeNull();

    const afterTick = reduce(cpuTurn, { type: "tick" });
    expect(afterTick.ring).toHaveLength(51);
    expect(afterTick.pile).toHaveLength(1);
    expect(afterTick.turn.currentId).toBe("cpu-2");
  });
});
