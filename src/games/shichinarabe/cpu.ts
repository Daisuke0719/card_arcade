import { pickRandom } from "@core";
import type { PlayingCard, Rng } from "@core";

/** 置ける候補から1枚選ぶ。候補が空なら null（＝パス）。 */
export function chooseCard(moves: readonly PlayingCard[], rng: Rng): PlayingCard | null {
  return pickRandom(moves, rng) ?? null;
}
