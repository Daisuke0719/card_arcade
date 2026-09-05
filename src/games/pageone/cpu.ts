/**
 * ページワン の CPU。
 *
 * 強い CPU を作る研修ではないので、出せる候補からランダムに1枚選ぶだけにしている。
 * 乱数は引数で受け取り、この中では作らない（テストで固定できるようにするため）。
 */
import { pickRandom } from "@core";
import type { PlayingCard, Rng } from "@core";

/** 出せる候補から1枚選ぶ。候補が空なら null（＝山札を引く）。 */
export function chooseCard(moves: readonly PlayingCard[], rng: Rng): PlayingCard | null {
  if (moves.length === 0) return null;
  return pickRandom(moves, rng) ?? null;
}
