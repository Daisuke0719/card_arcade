import { RANKS, SUITS, cardId } from "../cards";
import type { AnyCard, JokerCard, PlayingCard } from "../types";

/**
 * 52枚のトランプを作る。
 * 戻り値は PlayingCard[] のまま。ジョーカーを使うのはババ抜きだけなので、
 * ここで型を AnyCard に広げると他の5ゲームまで「ジョーカーかもしれない」を
 * 意識させられてしまう。
 */
export function createDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ kind: "standard", id: cardId(suit, rank), suit, rank });
    }
  }
  return deck;
}

export function createJokers(count: 1 | 2 = 1): JokerCard[] {
  const jokers: JokerCard[] = [{ kind: "joker", id: "joker-red", color: "red" }];
  if (count === 2) jokers.push({ kind: "joker", id: "joker-black", color: "black" });
  return jokers;
}

/** 52枚 + ジョーカー。ババ抜き用。 */
export function createDeckWithJokers(count: 1 | 2 = 1): AnyCard[] {
  return [...createDeck(), ...createJokers(count)];
}

/** 1枚引く。空なら card は undefined（例外を投げない）。 */
export function draw<T extends AnyCard>(deck: readonly T[]): { card: T | undefined; rest: T[] } {
  if (deck.length === 0) return { card: undefined, rest: [] };
  return { card: deck[0], rest: deck.slice(1) };
}

/** n枚引く。足りなければあるだけ返す。 */
export function drawMany<T extends AnyCard>(
  deck: readonly T[],
  count: number,
): { cards: T[]; rest: T[] } {
  const take = Math.max(0, Math.min(count, deck.length));
  return { cards: deck.slice(0, take), rest: deck.slice(take) };
}

/**
 * 人数分に配る。
 * - perPlayer 省略 … 配り切り。端数は先頭のプレイヤーから1枚多くなる
 * - perPlayer 指定 … 1人あたり固定枚数を配り、残りを rest として返す
 */
export function deal<T extends AnyCard>(
  deck: readonly T[],
  playerCount: number,
  perPlayer?: number,
): { hands: T[][]; rest: T[] } {
  if (playerCount <= 0) return { hands: [], rest: deck.slice() };

  const hands: T[][] = Array.from({ length: playerCount }, () => []);

  if (perPlayer === undefined) {
    deck.forEach((card, index) => {
      hands[index % playerCount].push(card);
    });
    return { hands, rest: [] };
  }

  const total = Math.min(perPlayer * playerCount, deck.length);
  for (let index = 0; index < total; index += 1) {
    hands[index % playerCount].push(deck[index]);
  }
  return { hands, rest: deck.slice(total) };
}

/** 山札にカードを戻す。 */
export function returnToDeck<T extends AnyCard>(
  deck: readonly T[],
  cards: readonly T[],
  where: "top" | "bottom" = "bottom",
): T[] {
  return where === "top" ? [...cards, ...deck] : [...deck, ...cards];
}

export function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

export function last<T>(items: readonly T[]): T | undefined {
  return items[items.length - 1];
}

/**
 * 「ここには必ずカードがある」と分かっている場所で使う。
 * undefined なら分かりやすいメッセージで落とす（黙って進めない）。
 */
export function requireCard<T extends AnyCard>(card: T | undefined, message: string): T {
  if (!card) throw new Error(`[card-arcade] ${message}`);
  return card;
}
