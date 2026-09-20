/**
 * ババ抜き の CPU。
 *
 * 「相手の手札から1枚引く」だけなので、判断はほぼ乱数任せでよい。
 * 乱数は引数で受け取り、Math.random() は使わない（テストで createRng(seed) を渡せる）。
 */
import { pickRandomIndex } from "@core";
import type { Rng } from "@core";

/** 相手の手札の枚数から、引く位置を1つ選ぶ。 */
export function chooseDrawIndex(handSize: number, rng: Rng): number {
  return Math.max(0, pickRandomIndex(handSize, rng));
}
