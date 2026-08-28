import { createDeck, createRng, drawMany, rankToNumber, shuffle } from "@core";
import type { PlayingCard } from "@core";
import { chooseGuess } from "./cpu";
import type { Guess } from "./cpu";

/** めくったカードを見せている時間。UI はこの値を参照するだけ。 */
export const REVEAL_DELAY_MS = 900;

export const TOTAL_ROUNDS = 10;

export type Phase = "guessing" | "revealing" | "finished";

export type RoundOutcome = "human" | "cpu" | "both" | "none";

export type ExampleState = {
  readonly deck: readonly PlayingCard[];
  readonly current: PlayingCard;
  /** めくったカード。revealing の間だけ入る。 */
  readonly next: PlayingCard | null;
  readonly phase: Phase;
  readonly round: number;
  readonly humanGuess: Guess | null;
  readonly cpuGuess: Guess | null;
  readonly humanScore: number;
  readonly cpuScore: number;
  readonly lastOutcome: RoundOutcome | null;
  readonly seed: number;
};

export type ExampleAction =
  | { readonly type: "guess"; readonly guess: Guess }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/**
 * 正解はどちらか。同じランクなら引き分け。
 * ゲームのルールはすべてこういう純粋関数に置く（React も時間も出てこない）。
 */
export function judge(current: PlayingCard, next: PlayingCard): Guess | "draw" {
  const diff = rankToNumber(next.rank) - rankToNumber(current.rank);
  if (diff > 0) return "high";
  if (diff < 0) return "low";
  return "draw";
}

export function createInitialState(seed: number = 1): ExampleState {
  const deck = shuffle(createDeck(), createRng(seed));
  const { cards, rest } = drawMany(deck, 1);
  const current = cards[0];

  return {
    deck: rest,
    current,
    next: null,
    phase: "guessing",
    round: 1,
    humanGuess: null,
    cpuGuess: null,
    humanScore: 0,
    cpuScore: 0,
    lastOutcome: null,
    seed,
  };
}

/**
 * 「今、何ミリ秒後に自動で次へ進めるべきか」を返す。
 * null は「人間の入力待ち」。
 *
 * 時間の扱いをここに集約しておくと、画面側は
 *   useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
 * の1行で済み、テストでは setTimeout を一切使わずに済む。
 */
export function pendingDelayMs(state: ExampleState): number | null {
  return state.phase === "revealing" ? REVEAL_DELAY_MS : null;
}

export function isGameOver(state: ExampleState): boolean {
  return state.phase === "finished";
}

/** そのラウンドで誰が当てたか。 */
function outcomeOf(humanHit: boolean, cpuHit: boolean): RoundOutcome {
  if (humanHit && cpuHit) return "both";
  if (humanHit) return "human";
  if (cpuHit) return "cpu";
  return "none";
}

/** 予想を受け付けて、次のカードをめくる。 */
function applyGuess(state: ExampleState, guess: Guess): ExampleState {
  // 判定中や終了後のクリックは無視する（連打で先へ進めない）
  if (state.phase !== "guessing") return state;

  const { cards, rest } = drawMany(state.deck, 1);
  const next = cards[0];
  if (!next) return { ...state, phase: "finished" };

  return {
    ...state,
    deck: rest,
    next,
    phase: "revealing",
    humanGuess: guess,
    cpuGuess: chooseGuess(state.current, createRng(state.seed + state.round)),
  };
}

/** めくったカードで勝敗を決め、次のラウンドへ進める。 */
function applyTick(state: ExampleState): ExampleState {
  if (state.phase !== "revealing" || !state.next) return state;

  const answer = judge(state.current, state.next);
  const humanHit = answer !== "draw" && state.humanGuess === answer;
  const cpuHit = answer !== "draw" && state.cpuGuess === answer;
  const isOver = state.round >= TOTAL_ROUNDS || state.deck.length === 0;

  return {
    ...state,
    current: state.next,
    next: null,
    phase: isOver ? "finished" : "guessing",
    round: state.round + 1,
    humanGuess: null,
    cpuGuess: null,
    humanScore: state.humanScore + (humanHit ? 1 : 0),
    cpuScore: state.cpuScore + (cpuHit ? 1 : 0),
    lastOutcome: outcomeOf(humanHit, cpuHit),
  };
}

/**
 * 状態 + 行動 -> 新しい状態。
 * ここが純粋関数なので、テストは reduce を順番に呼ぶだけで書ける。
 */
export function reduce(state: ExampleState, action: ExampleAction): ExampleState {
  switch (action.type) {
    case "guess":
      return applyGuess(state, action.guess);
    case "tick":
      return applyTick(state);
    case "reset":
      return createInitialState(action.seed ?? state.seed + 1);
    default:
      return state;
  }
}
