import { rankToNumber } from "@core";
import type { PlayingCard, Rng } from "@core";

export type Guess = "high" | "low";

/**
 * 「次のカードが今より高い確率」を返す純粋関数。
 *
 * CPU の判断はこうやって
 *   (1) 確率を計算する純粋関数        ← テストするのはこちら
 *   (2) 乱数と比べて実際に選ぶ薄い層   ← 乱数は引数で受け取る
 * に分けておくと、CPU の強さをテストできるようになる。
 */
export function highProbability(current: PlayingCard): number {
  const value = rankToNumber(current.rank); // A=1 ... K=13
  const higherCount = 13 - value;
  return higherCount / 12;
}

/** 確率にしたがって予想する。強すぎず弱すぎない CPU になる。 */
export function chooseGuess(current: PlayingCard, rng: Rng): Guess {
  return rng() < highProbability(current) ? "high" : "low";
}
