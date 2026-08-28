import styles from "./LogPanel.module.css";

export type LogPanelProps = {
  /** 新しいものが先頭に来るように渡す。 */
  entries: readonly string[];
  title?: string;
  max?: number;
};

/** 「CPU2 がダウトを宣言しました」のような進行ログ。七並べ・ダウト・大富豪で使う。 */
export function LogPanel({ entries, title = "ログ", max = 20 }: LogPanelProps) {
  const shown = entries.slice(0, max);
  return (
    <div className={styles.panel}>
      <span className={styles.title}>{title}</span>
      {shown.length === 0 ? <span className={styles.empty}>まだ動きはありません</span> : null}
      <ul>
        {shown.map((entry, index) => (
          <li
            key={`${index}-${entry}`}
            className={`${styles.entry} ${index === 0 ? styles.latest : ""}`}
          >
            {entry}
          </li>
        ))}
      </ul>
    </div>
  );
}
