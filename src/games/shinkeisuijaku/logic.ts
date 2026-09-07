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

/** 盤面の枚数。4列 × 4行で並べる。 */
export const BOARD_SIZE = PAIR_COUNT * 2;

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
 * 13種類のランクから8つを選び、選んだランクごとに2枚ずつ取り出します。
 * ペア判定はランクだけで行うため、どのスートの2枚になるかはゲームに影響しません。
 */
export function createBoard(rng: Rng): PlayingCard[] {
  const groups = groupByRank(createDeck());
  const chosenRanks = shuffle(RANKS, rng).slice(0, PAIR_COUNT);

  const cards: PlayingCard[] = [];
  for (const rank of chosenRanks) {
    const group = groups.get(rank) ?? [];
    cards.push(group[0], group[1]);
  }

  return shuffle(cards, rng);
}

/** 最初の状態。seed を固定すると毎回同じ配置になる（テスト用）。 */
export function createInitialState(seed: number = 0): ShinkeisuijakuState {
  return {
    board: createBoard(createRng(seed)),
    flipped: [],
    matched: [],
    phase: "idle",
    moves: 0,
    seed,
  };
}

/** その位置のカードを選べるか。判定中・範囲外・ペア成立済み・めくり済みは選べない。 */
export function canFlip(state: ShinkeisuijakuState, index: number): boolean {
  if (state.phase === "judging") return false;
  if (!Number.isInteger(index) || index < 0 || index >= state.board.length) return false;
  if (state.matched.includes(index)) return false;
  if (state.flipped.includes(index)) return false;
  return true;
}

/** その位置のカードが表向きか。めくり中とペア成立済みが表になる。 */
export function isFaceUp(state: ShinkeisuijakuState, index: number): boolean {
  return state.flipped.includes(index) || state.matched.includes(index);
}

/**
 * 1枚めくる。選べない位置なら state をそのまま返す。
 *
 * 手数は2枚目をめくった時点で1増えます。1枚目では増えません。
 */
export function flipCard(state: ShinkeisuijakuState, index: number): ShinkeisuijakuState {
  if (!canFlip(state, index)) return state;

  const flipped = [...state.flipped, index];
  const isSecond = flipped.length === 2;

  return {
    ...state,
    flipped,
    phase: isSecond ? "judging" : "one-flipped",
    moves: isSecond ? state.moves + 1 : state.moves,
  };
}

/** 判定中を解決する。ペアなら matched へ、違えば両方を裏に戻す。 */
export function resolveFlip(state: ShinkeisuijakuState): ShinkeisuijakuState {
  if (state.phase !== "judging") return state;

  const [first, second] = state.flipped;
  const isPair = sameRank(state.board[first], state.board[second]);

  return {
    ...state,
    flipped: [],
    matched: isPair ? [...state.matched, first, second] : state.matched,
    phase: "idle",
  };
}

/** 8ペアそろったか。 */
export function isGameOver(state: ShinkeisuijakuState): boolean {
  return state.matched.length === BOARD_SIZE;
}

/**
 * 今、何ミリ秒後に自動処理が要るか。null は人間の入力待ち。
 * ペアが成立したときも、しなかったときも同じだけ待ちます。
 */
export function pendingDelayMs(state: ShinkeisuijakuState): number | null {
  return state.phase === "judging" ? REVEAL_DELAY_MS : null;
}

/** 状態 + 行動 -> 新しい状態。ゲームのルールはすべてここに書きます。 */
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
      return createInitialState(action.seed);
    default:
      return state;
  }
}
