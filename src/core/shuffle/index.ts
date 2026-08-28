import type { Rng } from "../types";

/**
 * seed から決定的な乱数列を作る（mulberry32）。
 * テストで「同じ seed なら必ず同じシャッフル結果」にするための土台。
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 文字列 seed を数値に変換する（"team-a" のような seed を使えるようにする）。 */
export function hashSeed(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 乱数を1つ作る。
 * - seed 省略 … 実際にランダム（本番プレイ用）
 * - seed 指定 … 毎回同じ並び（テスト用）
 */
export function createRng(seed?: number | string): Rng {
  if (seed === undefined) return Math.random;
  return mulberry32(typeof seed === "number" ? seed >>> 0 : hashSeed(seed));
}

/** Fisher-Yates。元の配列は書き換えず、新しい配列を返す。 */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = result[i];
    const b = result[j];
    result[i] = b;
    result[j] = a;
  }
  return result;
}

/** 0 以上 len 未満の整数を1つ選ぶ。len が 0 なら -1。 */
export function pickRandomIndex(len: number, rng: Rng = Math.random): number {
  if (len <= 0) return -1;
  return Math.floor(rng() * len);
}

/** 配列から1つ選ぶ。空配列なら undefined。 */
export function pickRandom<T>(items: readonly T[], rng: Rng = Math.random): T | undefined {
  if (items.length === 0) return undefined;
  return items[pickRandomIndex(items.length, rng)];
}
