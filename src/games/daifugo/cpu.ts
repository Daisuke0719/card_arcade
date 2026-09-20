import type { Rng } from "@core";
import type { PlayingCard } from "@core";

/**
 * legal play 一覧から1手を選ぶ。
 * 手札はランク順（弱い順）に並んでいるので、先頭が最も弱い組になる。
 * 出せる手がなければ null を返す（呼び出し側がパスに切り替える）。
 */
export function pickPlay(
  legalPlays: PlayingCard[][],
  _rng: Rng,
): PlayingCard[] | null {
  return legalPlays[0] ?? null;
}
