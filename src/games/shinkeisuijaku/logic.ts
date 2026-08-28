// @scaffold:untouched
/**
 * 神経衰弱 のルール。
 *
 * このファイルには「純粋な処理」だけを書きます。
 *   - react を import しない
 *   - Math.random() / Date.now() / setTimeout を使わない
 *   - 乱数が必要なら引数で Rng を受け取る（テストで createRng(seed) を渡せるようにする）
 * これらは ESLint がエラーにするので、うっかり書いても CI の前に気づけます。
 *
 * お手本: src/games/example-game/logic.ts
 */
import { createDeck, createRng, shuffle } from "@core";
import type { PlayingCard, Rng } from "@core";

/** 今どの段階かを表す。画面はこれを見て表示を変える。 */
export type Phase = "playing" | "finished";

export type ShinkeisuijakuState = {
  readonly deck: readonly PlayingCard[];
  readonly phase: Phase;
  // TODO: このゲームに必要な状態を足してください
};

export type ShinkeisuijakuAction =
  | { readonly type: "tick" }
  | { readonly type: "reset" };

/** 最初の状態を作る。seed を固定すると毎回同じ配りになる（テスト用）。 */
export function createInitialState(seed?: number): ShinkeisuijakuState {
  const rng: Rng = createRng(seed);
  return {
    deck: shuffle(createDeck(), rng),
    phase: "playing",
  };
}

/**
 * 「今、何ミリ秒後に自動で次へ進めるべきか」を返す。
 * null は「人間の入力待ち」。CPU の手番や演出の待ち時間はここで表現します。
 */
export function pendingDelayMs(state: ShinkeisuijakuState): number | null {
  return state.phase === "finished" ? null : null;
}

/** 状態 + 行動 -> 新しい状態。ゲームのルールはすべてここに書きます。 */
export function reduce(state: ShinkeisuijakuState, action: ShinkeisuijakuAction): ShinkeisuijakuState {
  switch (action.type) {
    case "reset":
      return createInitialState();
    case "tick":
      // TODO: 自動で進む処理を書いてください
      return state;
    default:
      return state;
  }
}

/** ゲームが終わったかどうか。 */
export function isGameOver(state: ShinkeisuijakuState): boolean {
  return state.phase === "finished";
}
