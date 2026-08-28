import { useEffect, useRef, useState } from "react";

/**
 * 「何ms後に自動処理を1回だけ実行するか」を宣言するフック。
 * これがアプリ内で唯一のタイマーになる（＝ゲームのロジックに時間が入らない）。
 *
 *   useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
 *
 * - delayMs が null の間は何もしない（人間の入力待ち）
 * - onTick は必ずインラインの関数で渡す（useCallback で固定しない）。
 *   state が変わるたびにタイマーを張り直すことで CPU の手番が連続する。
 */
export function useCpuTurn(delayMs: number | null, onTick: () => void): void {
  const savedRef = useRef(onTick);

  useEffect(() => {
    savedRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (delayMs === null) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) savedRef.current();
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [delayMs, onTick]);
}

/** running が true の間だけ進む経過時間(ms)。 */
export function useElapsedMs(running: boolean, tickMs = 100): number {
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      startedAtRef.current = null;
      return undefined;
    }

    const base = elapsed;
    const startedAt = Date.now();
    startedAtRef.current = startedAt;

    const timer = window.setInterval(() => {
      setElapsed(base + (Date.now() - startedAt));
    }, tickMs);

    return () => window.clearInterval(timer);
    // elapsed を依存に入れると毎tick再登録されるため意図的に除外する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, tickMs]);

  return elapsed;
}

/** 残り時間(ms)。0 になったら onExpire を1回だけ呼ぶ。 */
export function useCountdown(durationMs: number, running: boolean, onExpire?: () => void): number {
  const [remaining, setRemaining] = useState(durationMs);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setRemaining(durationMs);
    expiredRef.current = false;
  }, [durationMs]);

  useEffect(() => {
    if (!running) return undefined;

    const endsAt = Date.now() + remaining;
    const timer = window.setInterval(() => {
      const next = Math.max(0, endsAt - Date.now());
      setRemaining(next);
      if (next === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    }, 100);

    return () => window.clearInterval(timer);
    // remaining を依存に入れると毎tick再登録されるため意図的に除外する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return remaining;
}
