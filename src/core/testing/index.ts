import { cardId } from "../cards";
import type { JokerCard, PlayingCard, Rank, Suit } from "../types";

/**
 * テスト用のカードファクトリ。
 * テストの中でカードのオブジェクトリテラルを手書きしないための道具。
 *
 *   expect(discardPairs(hand("spades-A", "hearts-A", "clubs-5"))).toHaveLength(1);
 */
export function card(suit: Suit, rank: Rank): PlayingCard {
  return { kind: "standard", id: cardId(suit, rank), suit, rank };
}

export function joker(color: "red" | "black" = "red"): JokerCard {
  return { kind: "joker", id: `joker-${color}`, color };
}

/** "spades-A" のような id からカードの並びを作る。 */
export function hand(...ids: string[]): PlayingCard[] {
  return ids.map((id) => {
    const separator = id.lastIndexOf("-");
    const suit = id.slice(0, separator) as Suit;
    const rank = id.slice(separator + 1) as Rank;
    return card(suit, rank);
  });
}
