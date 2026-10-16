/**
 * ページワン の CPU。
 *
 * 出せるカードの中から1枚を無作為に選ぶだけの単純なルールです。
 * 乱数は引数で受け取るので、テストでは createRng(seed) を渡して結果を固定できます。
 */
import { pickRandom } from "@core";
import type { PlayingCard, Rng } from "@core";

/** 出せる候補から1枚選ぶ。候補が空なら null（＝山札を引く）。 */
export function chooseCard(moves: readonly PlayingCard[], rng: Rng): PlayingCard | null {
  return pickRandom(moves, rng) ?? null;
}
