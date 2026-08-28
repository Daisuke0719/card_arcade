import styles from "./ScoreBoard.module.css";

export type ScoreBoardEntry = {
  id: string;
  name: string;
  /** 「12点」「残り5枚」など。 */
  detail?: string;
  /** 手番のプレイヤーを目立たせる。 */
  isCurrent?: boolean;
  /** 上がった人。薄く表示する。 */
  isFinished?: boolean;
  /** 「1位」「大富豪」など。 */
  rankLabel?: string;
};

export type ScoreBoardProps = {
  entries: readonly ScoreBoardEntry[];
  title?: string;
};

/**
 * スコア表。1人プレイの得点表示にも、4人対戦の手番表示にも使う。
 * （プレイヤー席専用のコンポーネントは作らない。これ1つで足りる）
 */
export function ScoreBoard({ entries, title = "スコア" }: ScoreBoardProps) {
  return (
    <div className={styles.board}>
      <span className={styles.title}>{title}</span>
      <ul>
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={[
              styles.row,
              entry.isCurrent ? styles.current : "",
              entry.isFinished ? styles.finished : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className={styles.name}>
              {entry.isCurrent ? (
                <span className={styles.turnMark} aria-label="手番">
                  ▶
                </span>
              ) : null}
              {entry.name}
              {entry.rankLabel ? <span className={styles.rankLabel}>{entry.rankLabel}</span> : null}
            </span>
            {entry.detail ? <span className={styles.detail}>{entry.detail}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
