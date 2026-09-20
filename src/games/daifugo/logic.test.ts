import { card, createSoloVsCpu, createTurnState, rankByFinishOrder } from "@core";
import type { PlayerId } from "@core";
import {
  TITLES,
  applyPlay,
  createInitialState,
  isGameOver,
  isLegalPlay,
  passTurn,
  reduce,
} from "./logic";
import type { DaifugoState, Field } from "./logic";

/** テスト用の最小 DaifugoState を作る。 */
function makeState(overrides: Partial<DaifugoState>): DaifugoState {
  const players = createSoloVsCpu(3);
  const turn = createTurnState(players, { startId: "you" });
  return {
    hands: { you: [], "cpu-1": [], "cpu-2": [], "cpu-3": [] },
    field: null,
    turn,
    isRevolution: false,
    passedIds: [],
    phase: "playing",
    log: [],
    seed: 1,
    ...overrides,
  };
}

describe("大富豪", () => {
  it("52枚が4人に13枚ずつ配られる", () => {
    const state = createInitialState(1);
    const total = Object.values(state.hands).reduce((sum, h) => sum + h.length, 0);
    expect(total).toBe(52);
    for (const h of Object.values(state.hands)) {
      expect(h).toHaveLength(13);
    }
    expect(isGameOver(state)).toBe(false);
  });

  it("同じ seed なら同じ配りになる", () => {
    const a = createInitialState(42);
    const b = createInitialState(42);
    expect(a.hands["you"].map(c => c.id)).toEqual(b.hands["you"].map(c => c.id));
  });

  it("リセットすると最初の状態に戻る", () => {
    const state = reduce(createInitialState(1), { type: "reset" });
    expect(state.phase).toBe("playing");
  });

  // 必須テスト7件

  it("枚数が違うと出せない", () => {
    const field: Field = {
      cards: [card("spades", "5"), card("hearts", "5")],
      count: 2,
      ownerId: "cpu-1" as PlayerId,
    };

    // 1枚（枚数不足）
    expect(isLegalPlay([card("clubs", "7")], field, false)).toBe(false);
    // 3枚（枚数超過）
    expect(
      isLegalPlay(
        [card("clubs", "7"), card("diamonds", "7"), card("spades", "7")],
        field,
        false,
      ),
    ).toBe(false);
  });

  it("場より弱いランクは出せない", () => {
    const field: Field = {
      cards: [card("spades", "7")],
      count: 1,
      ownerId: "cpu-1" as PlayerId,
    };

    // 5 < 7 なので出せない
    expect(isLegalPlay([card("hearts", "5")], field, false)).toBe(false);
    // 同じランク（7）は「より強い」を満たさないので出せない
    expect(isLegalPlay([card("clubs", "7")], field, false)).toBe(false);
  });

  it("同じ枚数で強ければ出せる", () => {
    const field: Field = {
      cards: [card("spades", "5")],
      count: 1,
      ownerId: "cpu-1" as PlayerId,
    };

    // 7 > 5 なので出せる
    expect(isLegalPlay([card("hearts", "7")], field, false)).toBe(true);
    // 2 は最強なので出せる
    expect(isLegalPlay([card("clubs", "2")], field, false)).toBe(true);
  });

  it("革命中は強弱が反転する", () => {
    const field: Field = {
      cards: [card("spades", "7")],
      count: 1,
      ownerId: "cpu-1" as PlayerId,
    };

    // 通常: 5 < 7 → 出せない
    expect(isLegalPlay([card("hearts", "5")], field, false)).toBe(false);
    // 革命中: 5 > 7（反転）→ 出せる
    expect(isLegalPlay([card("hearts", "5")], field, true)).toBe(true);

    // 通常: A > 7 → 出せる
    expect(isLegalPlay([card("hearts", "A")], field, false)).toBe(true);
    // 革命中: A < 7（反転）→ 出せない
    expect(isLegalPlay([card("hearts", "A")], field, true)).toBe(false);
  });

  it("8を含む組を出すと場が流れる", () => {
    const players = createSoloVsCpu(3);
    const field: Field = {
      cards: [card("spades", "5")],
      count: 1,
      ownerId: "cpu-1" as PlayerId,
    };
    const turn = createTurnState(players, { startId: "you" });

    const state = makeState({
      hands: {
        // 8 以外にもカードを持たせる（上がりにならないようにする）
        you: [card("hearts", "8"), card("clubs", "3")],
        "cpu-1": [card("diamonds", "K")],
        "cpu-2": [card("clubs", "Q")],
        "cpu-3": [card("spades", "J")],
      },
      field,
      turn,
    });

    const after = applyPlay(state, [card("hearts", "8")]);
    // 8切りで場が流れる
    expect(after.field).toBeNull();
    // 上がっていないので同じプレイヤーがもう一度出す
    expect(after.turn.currentId).toBe("you");
  });

  it("全員がパスすると場が流れる", () => {
    const players = createSoloVsCpu(3);
    // cpu-1 が出した場（ownerId = cpu-1）
    const field: Field = {
      cards: [card("spades", "5")],
      count: 1,
      ownerId: "cpu-1" as PlayerId,
    };
    // players の順番は [you, cpu-1, cpu-2, cpu-3]
    // cpu-1 が出した直後なので次は cpu-2 の番
    const turn = createTurnState(players, { startId: "cpu-2" });

    const state = makeState({
      hands: {
        you: [card("hearts", "3")],
        "cpu-1": [card("diamonds", "K")],
        "cpu-2": [card("clubs", "3")],
        "cpu-3": [card("spades", "3")],
      },
      field,
      turn,
    });

    const s1 = passTurn(state); // cpu-2 パス → cpu-3 の番
    expect(s1.field).not.toBeNull();
    const s2 = passTurn(s1); // cpu-3 パス → you の番
    expect(s2.field).not.toBeNull();
    const s3 = passTurn(s2); // you パス → 全員パス → 場流れ
    expect(s3.field).toBeNull();
    // field.ownerId（cpu-1）から再開
    expect(s3.turn.currentId).toBe("cpu-1");
  });

  it("出し切った順に称号が付く", () => {
    const players = createSoloVsCpu(3);
    const turn = createTurnState(players, { startId: "you" });

    // あなたが最後の1枚を持っている状態
    const state = makeState({
      hands: {
        you: [card("spades", "A")],
        "cpu-1": [card("hearts", "K"), card("clubs", "Q")],
        "cpu-2": [card("diamonds", "J"), card("spades", "10")],
        "cpu-3": [card("clubs", "9"), card("hearts", "8")],
      },
      field: null,
      turn,
    });

    const after = applyPlay(state, [card("spades", "A")]);

    // 1番目に上がった人が finishedIds の先頭
    expect(after.turn.finishedIds[0]).toBe("you");

    // 称号の割り当てを確認
    const ranking = rankByFinishOrder(
      after.turn.finishedIds,
      after.turn.players,
      p => TITLES[after.turn.finishedIds.indexOf(p.id)] ?? TITLES[3],
    );
    // RankingRow は { rank, name, detail } — id フィールドはない
    const youRow = ranking.find(r => r.name === "あなた");
    expect(youRow?.rank).toBe(1);
    expect(youRow?.detail).toBe("大富豪");

    // TITLES 配列が正しい順になっている
    expect(TITLES[0]).toBe("大富豪");
    expect(TITLES[1]).toBe("富豪");
    expect(TITLES[2]).toBe("貧民");
    expect(TITLES[3]).toBe("大貧民");
  });
});
