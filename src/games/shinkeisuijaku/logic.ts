/**
 * 神経衰弱 のルール。
 *
 * このファイルには「純粋な処理」だけを書きます。
 *   - react を import しない
 *   - Math.random() / Date.now() / setTimeout を使わない
 *   - 乱数が必要なら引数で Rng を受け取る（テストで createRng(seed) を渡せるようにする）
 *
 * お手本: src/games/example-game/logic.ts
 */
import { RANKS, createDeck, createRng, groupByRank, sameRank, shuffle } from "@core";
import type { PlayingCard, Rng } from "@core";

/** 2枚めくってから確定するまでの時間。UI はこの値を参照するだけ。 */
export const REVEAL_DELAY_MS = 800;

/** そろえるペアの数。8組16枚。 */
export const PAIR_COUNT = 8;

/**
 * idle        … 0枚めくっている（入力待ち）
 * one-flipped … 1枚めくっている（入力待ち）
 * judging     … 2枚めくって判定中（この間の入力はすべて無視する）
 */
export type Phase = "idle" | "one-flipped" | "judging";

export type ShinkeisuijakuState = {
  /** 4x4 に並べた16枚。index 0..15 が左上から右下。 */
  readonly board: readonly PlayingCard[];
  /** いまめくっている札の位置。0個 / 1個 / 2個。 */
  readonly flipped: readonly number[];
  /** ペアが成立して表のまま残っている札の位置。 */
  readonly matched: readonly number[];
  readonly phase: Phase;
  /** 2枚めくるたびに1増える。 */
  readonly moves: number;
  readonly seed: number;
};

export type ShinkeisuijakuAction =
  | { readonly type: "flip"; readonly index: number }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/**
 * 8ランクを選んで各2枚、計16枚を作ってシャッフルする。乱数は引数で受け取る。
 *
 * 13種類のランクからランダムに8つ選び、選んだランクごとに2枚だけ取り出す。
 * ペア判定はランクだけで行うため、スートはどの2枚でもかまわない。
 */
export function createBoard(rng: Rng): PlayingCard[] {
  const chosenRanks = shuffle(RANKS, rng).slice(0, PAIR_COUNT);
  const byRank = groupByRank(createDeck());
  const cards: PlayingCard[] = [];
  for (const rank of chosenRanks) {
    const ofRank = byRank.get(rank) ?? [];
    cards.push(ofRank[0], ofRank[1]);
  }
  return shuffle(cards, rng);
}

/** 最初の状態。seed を固定すると毎回同じ配置になる（テスト用）。 */
export function createInitialState(seed: number = 1): ShinkeisuijakuState {
  const rng: Rng = createRng(seed);
  return {
    board: createBoard(rng),
    flipped: [],
    matched: [],
    phase: "idle",
    moves: 0,
    seed,
  };
}

/** その位置がいま表向きか（めくり中またはペア成立済み）。 */
export function isFaceUp(state: ShinkeisuijakuState, index: number): boolean {
  return state.flipped.includes(index) || state.matched.includes(index);
}

/**
 * 1枚めくる。次の場合は state をそのまま返す（何も起きない）。
 *   - 判定中（2枚めくった直後の待ち時間）
 *   - 盤面の範囲外の位置
 *   - すでにペアが成立して表向きのカード
 *   - いまめくったばかりのカード（同じ場所の2回クリック）
 */
export function flipCard(state: ShinkeisuijakuState, index: number): ShinkeisuijakuState {
  if (state.phase === "judging") return state;
  if (index < 0 || index >= state.board.length) return state;
  if (state.matched.includes(index)) return state;
  if (state.flipped.includes(index)) return state;

  if (state.phase === "idle") {
    return { ...state, flipped: [index], phase: "one-flipped" };
  }

  // one-flipped: 2枚目をめくる。ここで手数が1増え、判定中に入る。
  return {
    ...state,
    flipped: [...state.flipped, index],
    phase: "judging",
    moves: state.moves + 1,
  };
}

/** 判定中を解決する。ペアなら matched へ、違えば両方を裏に戻す。 */
export function resolveFlip(state: ShinkeisuijakuState): ShinkeisuijakuState {
  if (state.phase !== "judging") return state;

  const [a, b] = state.flipped;
  const isPair = sameRank(state.board[a], state.board[b]);
  const matched = isPair ? [...state.matched, a, b] : state.matched;

  return {
    ...state,
    flipped: [],
    matched,
    phase: "idle",
  };
}

/** 8ペアそろったか。 */
export function isGameOver(state: ShinkeisuijakuState): boolean {
  return state.matched.length === PAIR_COUNT * 2;
}

/** 今、何ミリ秒後に自動処理が要るか。null は人間の入力待ち。 */
export function pendingDelayMs(state: ShinkeisuijakuState): number | null {
  return state.phase === "judging" ? REVEAL_DELAY_MS : null;
}

/** 状態 + 行動 -> 新しい状態。ゲームのルールはすべてここに書く。 */
export function reduce(
  state: ShinkeisuijakuState,
  action: ShinkeisuijakuAction,
): ShinkeisuijakuState {
  switch (action.type) {
    case "flip":
      return flipCard(state, action.index);
    case "tick":
      return resolveFlip(state);
    case "reset":
      return createInitialState(action.seed ?? state.seed + 1);
    default:
      return state;
  }
}
