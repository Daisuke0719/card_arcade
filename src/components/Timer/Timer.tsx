import { formatDuration } from "@core";
import styles from "./Timer.module.css";

export type TimerProps = {
  /** 表示するミリ秒。時間を刻むのは @core の useElapsedMs / useCountdown。 */
  ms: number;
  label?: string;
  warning?: boolean;
};

/** 表示専用。自分では時間を数えない（テストしやすさのため）。 */
export function Timer({ ms, label = "経過", warning = false }: TimerProps) {
  return (
    <div className={styles.timer}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${warning ? styles.warning : ""}`}>
        {formatDuration(ms)}
      </span>
    </div>
  );
}
