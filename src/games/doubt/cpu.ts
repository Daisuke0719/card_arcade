import { rankToNumber } from "@core";
import type { PlayingCard, Rank, Rng } from "@core";

/** 宣言ランクの所持数が少なく、場札が増えるほどダウトしやすくする。 */
export function doubtProbability(
  hand: readonly PlayingCard[],
  declaredRank: Rank,
  playedCount: number,
  pileCount: number,
): number {
  const matchingCount = hand.filter((card) => card.rank === declaredRank).length;
  const evidence = matchingCount < playedCount ? 0.48 : matchingCount === 0 ? 0.3 : 0.08;
  return Math.min(0.82, Math.max(0.04, evidence + Math.min(pileCount, 20) * 0.012));
}

export function shouldDoubt(
  hand: readonly PlayingCard[],
  declaredRank: Rank,
  playedCount: number,
  pileCount: number,
  rng: Rng,
): boolean {
  return rng() < doubtProbability(hand, declaredRank, playedCount, pileCount);
}

/** ランクがあればそれを優先し、無ければ低いカードを1枚出す。 */
export function choosePlay(
  hand: readonly PlayingCard[],
  declaredRank: Rank,
  rng: Rng,
): PlayingCard[] {
  if (hand.length === 0) return [];
  const matches = hand.filter((card) => card.rank === declaredRank);
  const source = matches.length > 0 ? matches : [...hand].sort((a, b) => rankToNumber(a.rank) - rankToNumber(b.rank));
  const count = matches.length > 0 ? 1 + Math.floor(rng() * Math.min(2, matches.length)) : 1;
  return source.slice(0, count);
}
