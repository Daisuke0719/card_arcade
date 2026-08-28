import { useCallback, useEffect, useState } from "react";
import type { GameId, HighScore, HighScoreDirection, StorageKey } from "../types";

/**
 * LocalStorage のキーはこの関数でしか作れない。
 * ゲーム側からの localStorage 直接参照は ESLint で禁止しているので、
 * 6チームがキー名で衝突することが構造的に起きない。
 */
export function gameKey(gameId: GameId, name: string): StorageKey {
  return `card-arcade:v1:${gameId}:${name}`;
}

/** LocalStorage は環境によっては例外を投げる。読み書きは必ずここを通す。 */
export function readJson<T>(key: StorageKey, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: StorageKey, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 保存できなくてもゲームは続行できるべきなので握りつぶす
  }
}

export function removeKey(key: StorageKey): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 同上
  }
}

function highScoreKey(gameId: GameId): StorageKey {
  return gameKey(gameId, "highscore");
}

export function loadHighScore(gameId: GameId): HighScore | null {
  return readJson<HighScore | null>(highScoreKey(gameId), null);
}

/**
 * 記録を更新する。direction は「大きいほど良い」「小さいほど良い」の指定。
 * 神経衰弱の手数のように小さいほど良い記録があるため必須にしている。
 */
export function saveHighScore(
  gameId: GameId,
  value: number,
  direction: HighScoreDirection,
): { highScore: HighScore; updated: boolean } {
  const current = loadHighScore(gameId);
  const isBetter =
    current === null ||
    (direction === "higher-is-better" ? value > current.value : value < current.value);

  if (!isBetter) return { highScore: current, updated: false };

  const next: HighScore = { value, updatedAt: Date.now() };
  writeJson(highScoreKey(gameId), next);
  return { highScore: next, updated: true };
}

/**
 * ハイスコアを読み書きする React フック。
 * submit(value) を呼ぶと、記録が更新されたかどうかを返す。
 */
export function useHighScore(
  gameId: GameId,
  direction: HighScoreDirection,
): { highScore: HighScore | null; submit: (value: number) => boolean; clear: () => void } {
  const [highScore, setHighScore] = useState<HighScore | null>(null);

  useEffect(() => {
    setHighScore(loadHighScore(gameId));
  }, [gameId]);

  const submit = useCallback(
    (value: number) => {
      const { highScore: next, updated } = saveHighScore(gameId, value, direction);
      setHighScore(next);
      return updated;
    },
    [gameId, direction],
  );

  const clear = useCallback(() => {
    removeKey(highScoreKey(gameId));
    setHighScore(null);
  }, [gameId]);

  return { highScore, submit, clear };
}
