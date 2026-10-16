import { RANK_ORDER_ACE_HIGH, createRankStrength, groupByRank } from "@core";
import type { CardId, PlayingCard } from "@core";

const cardStrength = createRankStrength(RANK_ORDER_ACE_HIGH);
const cardValue = (card: PlayingCard) => cardStrength(card.rank) + 2;

/** 同じ数字の組をすべて残し、役がなければ強い2枚を残す。 */
export function chooseDiscardIds(hand: readonly PlayingCard[]): CardId[] {
  const groups = [...groupByRank(hand).values()];
  const pairedIds = new Set(groups.filter(group => group.length >= 2).flatMap(group => group.map(card => card.id)));
  const keptIds = pairedIds.size > 0
    ? pairedIds
    : new Set([...hand].sort((a, b) => cardValue(b) - cardValue(a)).slice(0, 2).map(card => card.id));
  return hand.filter(card => !keptIds.has(card.id)).map(card => card.id);
}
