import type { Ranking } from "@core";
import { formatRank } from "@core";
import { Button } from "../Button/Button";
import styles from "./ResultModal.module.css";

export type ResultModalProps = {
  open: boolean;
  title: string;
  message?: string;
  /** 「12手」「3勝2敗」など、大きく見せたい1行。 */
  score?: string;
  ranking?: Ranking;
  onRetry?: () => void;
  onExit?: () => void;
  retryLabel?: string;
  exitLabel?: string;
};

/** 結果表示。portal を使わず固定オーバーレイにしている（テストが単純になる）。 */
export function ResultModal({
  open,
  title,
  message,
  score,
  ranking,
  onRetry,
  onExit,
  retryLabel = "もう一度",
  exitLabel = "アーケードへ戻る",
}: ResultModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{title}</h2>
        {score ? <p className={styles.score}>{score}</p> : null}
        {message ? <p className={styles.message}>{message}</p> : null}

        {ranking && ranking.length > 0 ? (
          <div className={styles.ranking}>
            {ranking.map((row, index) => (
              <div
                key={`${row.rank}-${row.name}-${index}`}
                className={`${styles.row} ${row.rank === 1 ? styles.first : ""}`}
              >
                <span className={styles.rank}>{formatRank(row.rank)}</span>
                <span className={styles.name}>{row.name}</span>
                {row.detail ? <span className={styles.detail}>{row.detail}</span> : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.actions}>
          {onRetry ? (
            <Button onClick={onRetry} fullWidth>
              {retryLabel}
            </Button>
          ) : null}
          {onExit ? (
            <Button variant="secondary" onClick={onExit} fullWidth>
              {exitLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
