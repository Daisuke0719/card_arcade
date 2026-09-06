/**
 * ページワン の CPU。
 *
 * 出せる候補の中から1枚を無作為に選ぶだけの純粋関数です。
 * 乱数は引数で受け取り、テストでは createRng(seed) を渡します。
 */
import { pickRandom } from "@core";
import type { PlayingCard, Rng } from "@core";

/** 出せる候補から1枚選ぶ。候補が空なら null（＝山札を引く）。 */
export function chooseCard(moves: readonly PlayingCard[], rng: Rng): PlayingCard | null {
  return pickRandom(moves, rng) ?? null;
}
