import type { AnyCard, CardId, JokerCard, PlayingCard, Rank, Suit } from "../types";

export const SUITS: readonly Suit[] = ["spades", "hearts", "diamonds", "clubs"];

export const RANKS: readonly Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export const SUIT_SYMBOL: Readonly<Record<Suit, string>> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

export const SUIT_NAME_JA: Readonly<Record<Suit, string>> = {
  spades: "スペード",
  hearts: "ハート",
  diamonds: "ダイヤ",
  clubs: "クラブ",
};

export const SUIT_COLOR: Readonly<Record<Suit, "red" | "black">> = {
  spades: "black",
  hearts: "red",
  diamonds: "red",
  clubs: "black",
};

/* ---------- 判別 ---------- */

export function isStandard(card: AnyCard): card is PlayingCard {
  return card.kind === "standard";
}

export function isJoker(card: AnyCard): card is JokerCard {
  return card.kind === "joker";
}

/**
 * ジョーカーを含むカード列を、通常カードとジョーカーに分ける。
 * ババ抜きの「ジョーカーはペアにならない」は、これで分けてから
 * 通常カードだけをペア判定すれば自然に表現できる。
 */
export function partitionJokers(cards: readonly AnyCard[]): {
  standards: PlayingCard[];
  jokers: JokerCard[];
} {
  const standards: PlayingCard[] = [];
  const jokers: JokerCard[] = [];
  for (const card of cards) {
    if (isJoker(card)) jokers.push(card);
    else standards.push(card);
  }
  return { standards, jokers };
}

/* ---------- 表示・識別 ---------- */

export function cardId(suit: Suit, rank: Rank): CardId {
  return `${suit}-${rank}`;
}

/** 画面読み上げにも使う日本語ラベル。例: "スペードのA" / "ジョーカー(赤)" */
export function cardLabel(card: AnyCard): string {
  if (isJoker(card)) return `ジョーカー(${card.color === "red" ? "赤" : "黒"})`;
  return `${SUIT_NAME_JA[card.suit]}の${card.rank}`;
}

/** 記号つきの短い表記。例: "♠A" */
export function cardShortLabel(card: AnyCard): string {
  if (isJoker(card)) return "JOKER";
  return `${SUIT_SYMBOL[card.suit]}${card.rank}`;
}

/** 同じランクか。ジョーカーが混ざったら常に false（＝ペアにならない）。 */
export function sameRank(a: AnyCard, b: AnyCard): boolean {
  if (isJoker(a) || isJoker(b)) return false;
  return a.rank === b.rank;
}

/** 同じスートか。ジョーカーが混ざったら常に false。 */
export function sameSuit(a: AnyCard, b: AnyCard): boolean {
  if (isJoker(a) || isJoker(b)) return false;
  return a.suit === b.suit;
}

/* ---------- ランクの数値化 ---------- */

/** A=1, 2..10, J=11, Q=12, K=13。神経衰弱・スピード・七並べが使う。 */
export function rankToNumber(rank: Rank): number {
  return RANKS.indexOf(rank) + 1;
}

export function numberToRank(value: number): Rank | undefined {
  return RANKS[value - 1];
}

/**
 * ランクを循環させる。K の次は A、A の前は K。
 * スピードの「A と K は繋がる」、ダウトの宣言ランクの循環がこれ1本で書ける。
 */
export function cycleRank(rank: Rank, delta: number): Rank {
  const size = RANKS.length;
  const next = (((rankToNumber(rank) - 1 + delta) % size) + size) % size;
  return RANKS[next];
}

/* ---------- 強さの順序 ---------- */

/** 「弱い順」に並べたランクの配列。 */
export type RankOrder = readonly Rank[];

export const RANK_ORDER_ACE_LOW: RankOrder = RANKS;

export const RANK_ORDER_ACE_HIGH: RankOrder = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

/**
 * 順序を与えると「ランク → 強さ(0始まり)」の関数を作る。
 *
 * core が持つのはここまで。大富豪の 3<4<...<A<2 という並びは
 * ゲーム側（src/games/daifugo/rules.ts）で
 * createRankStrength(["3","4",...,"A","2"]) として作る。
 * core は仕組み、games はルール。
 */
export function createRankStrength(order: RankOrder = RANK_ORDER_ACE_LOW): (rank: Rank) => number {
  const table = new Map<Rank, number>();
  order.forEach((rank, index) => table.set(rank, index));
  return (rank) => table.get(rank) ?? -1;
}

export function compareRank(a: Rank, b: Rank, order: RankOrder = RANK_ORDER_ACE_LOW): number {
  const strength = createRankStrength(order);
  return strength(a) - strength(b);
}

export function compareCard(
  a: PlayingCard,
  b: PlayingCard,
  order: RankOrder = RANK_ORDER_ACE_LOW,
): number {
  return compareRank(a.rank, b.rank, order);
}

/* ---------- 並べ替え・グループ化 ---------- */

export function sortCards(
  cards: readonly PlayingCard[],
  options: { order?: RankOrder; by?: "rank" | "suit" } = {},
): PlayingCard[] {
  const { order = RANK_ORDER_ACE_LOW, by = "rank" } = options;
  const strength = createRankStrength(order);
  return cards.slice().sort((a, b) => {
    if (by === "suit") {
      const suitDiff = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
      if (suitDiff !== 0) return suitDiff;
      return strength(a.rank) - strength(b.rank);
    }
    const rankDiff = strength(a.rank) - strength(b.rank);
    if (rankDiff !== 0) return rankDiff;
    return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
  });
}

/** ランクごとにまとめる。ペア判定・大富豪の合法手列挙の起点。 */
export function groupByRank(cards: readonly PlayingCard[]): Map<Rank, PlayingCard[]> {
  const groups = new Map<Rank, PlayingCard[]>();
  for (const card of cards) {
    const bucket = groups.get(card.rank);
    if (bucket) bucket.push(card);
    else groups.set(card.rank, [card]);
  }
  return groups;
}

/** スートごとにまとめる。七並べの盤面を作るときに使う。 */
export function groupBySuit(cards: readonly PlayingCard[]): Map<Suit, PlayingCard[]> {
  const groups = new Map<Suit, PlayingCard[]>();
  for (const card of cards) {
    const bucket = groups.get(card.suit);
    if (bucket) bucket.push(card);
    else groups.set(card.suit, [card]);
  }
  return groups;
}
