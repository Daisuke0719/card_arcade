/**
 * ページワン のテスト。
 *
 * 必須テスト7件（docs/games/pageone.md の「必須テスト」）に加えて、
 * 必須要件1件ずつに対応するテストと、やってはいけない操作を弾くテストを置く。
 *
 * 時間は一切テストしない。reduce と純粋関数を順番に呼ぶだけで書けるのは、
 * 待ち時間を pendingDelayMs（数値を返すだけ）に閉じ込めているため。
 */
import { card, createTurnState, hand } from "@core";
import type { PlayerId, PlayingCard, TurnState } from "@core";
import {
  CPU_DELAY_MS,
  applyPlay,
  canPlay,
  createInitialState,
  drawFromDeck,
  fieldTop,
  getRanking,
  isGameOver,
  legalMoves,
  pendingDelayMs,
  reduce,
} from "./logic";
import type { PageOneState } from "./logic";

const PLAYER_IDS: PlayerId[] = ["you", "cpu-1", "cpu-2", "cpu-3"];

/** 4人分の手札。指定しなかった人は空にせず、出せないカードを1枚持たせる。 */
function handsOf(
  partial: Partial<Record<PlayerId, PlayingCard[]>>,
): Record<PlayerId, readonly PlayingCard[]> {
  const hands: Record<PlayerId, readonly PlayingCard[]> = {};
  for (const id of PLAYER_IDS) hands[id] = partial[id] ?? [];
  return hands;
}

/** 手番だけを差し替えた TurnState。 */
function turnAt(playerId: PlayerId): TurnState {
  return createTurnState(createInitialState(1).turn.players, { startId: playerId });
}

/** 必要なところだけを差し替えた盤面を作る。 */
function stateWith(overrides: Partial<PageOneState>): PageOneState {
  return { ...createInitialState(1), ...overrides };
}

/** 山札 + 場札 + 全員の手札。 */
function countAll(state: PageOneState): number {
  const inHands = PLAYER_IDS.reduce((sum, id) => sum + (state.hands[id] ?? []).length, 0);
  return state.deck.length + state.field.length + inHands;
}

/** あなたの手番を1手だけ進める（出せるなら出す、出せないなら引く）。 */
function playOrDraw(state: PageOneState): PageOneState {
  const moves = legalMoves(state.hands.you ?? [], fieldTop(state));
  return moves.length > 0
    ? reduce(state, { type: "play", cardId: moves[0].id })
    : reduce(state, { type: "draw" });
}

describe("ページワン", () => {
  /* ---------- 必須テスト（docs/games/pageone.md の文言そのまま） ---------- */

  it("同じマークなら出せる", () => {
    expect(canPlay(card("spades", "9"), card("spades", "5"))).toBe(true);
  });

  it("同じ数字なら出せる", () => {
    expect(canPlay(card("hearts", "5"), card("spades", "5"))).toBe(true);
  });

  it("マークも数字も違うカードは出せない", () => {
    expect(canPlay(card("hearts", "9"), card("spades", "5"))).toBe(false);
  });

  it("出せるカードが無いときは山札から1枚引く", () => {
    const state = stateWith({
      field: hand("spades-5"),
      hands: handsOf({ you: hand("hearts-2", "clubs-3") }),
      deck: hand("diamonds-9", "clubs-7"),
    });

    const next = drawFromDeck(state, "you");

    expect(next.hands.you).toHaveLength(3);
    expect(next.deck).toHaveLength(1);
    expect(next.turn.currentId).toBe("cpu-1");
  });

  it("8を出すと次の人が飛ばされる", () => {
    const state = stateWith({
      field: hand("spades-5"),
      hands: handsOf({ you: hand("spades-8", "hearts-2") }),
    });

    const next = applyPlay(state, "you", card("spades", "8"));

    expect(next.turn.currentId).toBe("cpu-2");
  });

  it("Aを出すともう一度出せる", () => {
    const state = stateWith({
      field: hand("spades-5"),
      hands: handsOf({ you: hand("spades-A", "hearts-2") }),
    });

    const next = applyPlay(state, "you", card("spades", "A"));

    expect(next.turn.currentId).toBe("you");
  });

  it("手札が0枚になったら上がりで、その時点でゲームが終わる", () => {
    const state = stateWith({
      field: hand("spades-5"),
      hands: handsOf({ you: hand("spades-9"), "cpu-1": hand("hearts-2", "hearts-3") }),
    });

    const next = applyPlay(state, "you", card("spades", "9"));

    expect(next.phase).toBe("finished");
    expect(next.winnerId).toBe("you");
    expect(isGameOver(next)).toBe(true);
    expect(next.hands["cpu-1"]).toHaveLength(2);
  });

  /* ---------- 必須要件に1対1で対応するテスト ---------- */

  it("4人に5枚ずつ配り、場札を1枚めくって山札は31枚になる", () => {
    const state = createInitialState(1);

    for (const id of PLAYER_IDS) expect(state.hands[id], id + " の手札").toHaveLength(5);
    expect(state.field).toHaveLength(1);
    expect(state.deck).toHaveLength(31);
    expect(state.turn.currentId).toBe("you");
    expect(state.phase).toBe("playing");
  });

  it("legalMovesは今出せるカードだけを返す", () => {
    const moves = legalMoves(
      hand("spades-9", "hearts-5", "clubs-2", "diamonds-7"),
      card("spades", "5"),
    );

    expect(moves.map((item) => item.id)).toEqual(["spades-9", "hearts-5"]);
  });

  it("2位以下は手札の枚数が少ない順に並び、同じ枚数は同順位になる", () => {
    const state = stateWith({
      phase: "finished",
      winnerId: "you",
      hands: handsOf({
        you: [],
        "cpu-1": hand("hearts-2", "hearts-3"),
        "cpu-2": hand("clubs-4"),
        "cpu-3": hand("diamonds-5", "diamonds-6"),
      }),
    });

    const ranking = getRanking(state);

    expect(ranking.map((row) => row.rank)).toEqual([1, 2, 3, 3]);
    expect(ranking[0].name).toBe("あなた");
    expect(ranking[1].name).toBe("CPU 2");
  });

  it("CPUの手番では800を返し、あなたの手番ではnullを返す", () => {
    expect(pendingDelayMs(createInitialState(1))).toBeNull();
    expect(pendingDelayMs(stateWith({ turn: turnAt("cpu-1") }))).toBe(CPU_DELAY_MS);
    expect(pendingDelayMs(stateWith({ phase: "finished", turn: turnAt("cpu-1") }))).toBeNull();
  });

  it("tickでCPUが1手を打ち、手番が次へ進む", () => {
    const state = stateWith({
      field: hand("spades-5"),
      hands: handsOf({
        you: hand("hearts-2"),
        "cpu-1": hand("spades-9", "hearts-4"),
      }),
      turn: turnAt("cpu-1"),
    });

    const next = reduce(state, { type: "tick" });

    expect(next.hands["cpu-1"]).toHaveLength(1);
    expect(next.field).toHaveLength(2);
    expect(next.turn.currentId).toBe("cpu-2");
  });

  /* ---------- やってはいけない操作 ---------- */

  it("出せるカードがあるときに引こうとしても状態が変わらない", () => {
    const state = stateWith({
      field: hand("spades-5"),
      hands: handsOf({ you: hand("spades-9", "hearts-2") }),
      deck: hand("clubs-4"),
    });

    expect(drawFromDeck(state, "you")).toBe(state);
    expect(reduce(state, { type: "draw" })).toBe(state);
  });

  it("自分の手番でないときのplayは無視される", () => {
    const state = stateWith({
      field: hand("spades-5"),
      hands: handsOf({ you: hand("spades-9"), "cpu-1": hand("hearts-2") }),
      turn: turnAt("cpu-1"),
    });

    expect(reduce(state, { type: "play", cardId: "spades-9" })).toBe(state);
  });

  it("終了後のplayとdrawは無視される", () => {
    const state = stateWith({
      phase: "finished",
      winnerId: "you",
      field: hand("spades-5"),
      hands: handsOf({ you: hand("spades-9") }),
      deck: hand("clubs-4"),
    });

    expect(reduce(state, { type: "play", cardId: "spades-9" })).toBe(state);
    expect(reduce(state, { type: "draw" })).toBe(state);
    expect(reduce(state, { type: "tick" })).toBe(state);
  });

  /* ---------- 境界（山札0枚・最後の1枚） ---------- */

  it("山札が空のとき場札の一番上だけを残して混ぜ直す", () => {
    const state = stateWith({
      deck: [],
      field: hand("spades-5", "hearts-2", "clubs-3", "diamonds-9"),
      hands: handsOf({ you: hand("hearts-4", "clubs-6") }),
    });

    const next = drawFromDeck(state, "you");

    expect(next.field).toHaveLength(1);
    expect(next.field[0].id).toBe("diamonds-9");
    expect(next.deck).toHaveLength(2);
    expect(next.hands.you).toHaveLength(3);
  });

  it("山札も場札の残りも無いときは何もせず手番が次へ移る", () => {
    const state = stateWith({
      deck: [],
      field: hand("spades-5"),
      hands: handsOf({ you: hand("hearts-2", "clubs-3") }),
    });

    const next = drawFromDeck(state, "you");

    expect(next.hands.you).toHaveLength(2);
    expect(next.deck).toHaveLength(0);
    expect(next.field).toHaveLength(1);
    expect(next.turn.currentId).toBe("cpu-1");
  });

  it("引いたカードが出せるときはその場で場に出て手札が増えない", () => {
    const state = stateWith({
      field: hand("spades-5"),
      hands: handsOf({ you: hand("hearts-2", "clubs-3") }),
      deck: hand("spades-9", "hearts-7"),
    });

    const next = drawFromDeck(state, "you");

    expect(next.hands.you).toHaveLength(2);
    expect(next.field.map((item) => item.id)).toContain("spades-9");
    expect(next.deck).toHaveLength(1);
  });

  it("最後の1枚が8でも効果より上がりが優先される", () => {
    const state = stateWith({
      field: hand("spades-5"),
      hands: handsOf({ you: hand("spades-8"), "cpu-1": hand("hearts-2") }),
    });

    const next = applyPlay(state, "you", card("spades", "8"));

    expect(next.phase).toBe("finished");
    expect(next.winnerId).toBe("you");
    expect(next.turn.currentId).toBe("you");
  });

  /* ---------- 不変条件・決定性 ---------- */

  it("カードの合計はいつでも52枚のまま", () => {
    let state = createInitialState(7);
    expect(countAll(state)).toBe(52);

    for (let step = 0; step < 300 && !isGameOver(state); step += 1) {
      state =
        state.turn.currentId === "you" ? playOrDraw(state) : reduce(state, { type: "tick" });
      expect(countAll(state), step + "手目").toBe(52);
    }

    expect(isGameOver(state)).toBe(true);
  });

  it("同じseedなら同じ配りになる", () => {
    const a = createInitialState(42);
    const b = createInitialState(42);

    expect(a.deck.map((item) => item.id)).toEqual(b.deck.map((item) => item.id));
    expect(a.hands.you.map((item) => item.id)).toEqual(b.hands.you.map((item) => item.id));
    expect(a.field[0].id).toBe(b.field[0].id);
  });
});
