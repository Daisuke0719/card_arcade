import styles from "./GameInstructions.module.css";

export type GameInstructionsProps = {
  /** manifest.howToPlay をそのまま渡す。 */
  steps: readonly string[];
  title?: string;
  defaultOpen?: boolean;
};

/** 遊び方。details 要素なので開閉の状態管理が要らない。 */
export function GameInstructions({
  steps,
  title = "遊び方",
  defaultOpen = false,
}: GameInstructionsProps) {
  if (steps.length === 0) return null;

  return (
    <details className={styles.details} open={defaultOpen}>
      <summary className={styles.summary}>{title}</summary>
      <div className={styles.list}>
        {steps.map((step, index) => (
          <p key={`${index}-${step}`} className={styles.item}>
            <span className={styles.marker}>{index + 1}.</span>
            <span>{step}</span>
          </p>
        ))}
      </div>
    </details>
  );
}
