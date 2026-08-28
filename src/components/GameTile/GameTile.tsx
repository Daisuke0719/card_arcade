import type { GameManifest } from "@core";
import styles from "./GameTile.module.css";

export type GameTileProps = {
  manifest: GameManifest;
  /** 例: "#/games/babanuki" */
  href: string;
  /** COMING SOON のときに表示する担当 Issue へのリンク。 */
  issueUrl?: string;
  /** 例: "Team A" */
  teamLabel?: string;
};

const difficultyLabel = { easy: "初級", normal: "中級", hard: "上級" } as const;

/** アーケード一覧の1枚。COMING SOON はグレースケールで表示する。 */
export function GameTile({ manifest, href, issueUrl, teamLabel }: GameTileProps) {
  const isComingSoon = manifest.status === "coming-soon";
  const label = isComingSoon ? manifest.name + "（準備中）" : manifest.name;

  return (
    <a
      className={styles.tile + " " + (isComingSoon ? styles.comingSoon : styles.playable)}
      href={href}
      aria-label={label}
    >
      <div className={styles.head}>
        {manifest.icon ? (
          <span className={styles.icon} aria-hidden="true">
            {manifest.icon}
          </span>
        ) : null}
        <span className={styles.name}>{manifest.name}</span>
      </div>

      <p className={styles.description}>{manifest.description}</p>

      {isComingSoon ? <span className={styles.status}>[ COMING SOON ]</span> : null}

      <div className={styles.meta}>
        <span className={styles.badge + " " + styles[manifest.difficulty]}>
          {difficultyLabel[manifest.difficulty]}
        </span>
        {teamLabel ? <span className={styles.badge}>{teamLabel}</span> : null}
        {isComingSoon && issueUrl && manifest.issueNumber ? (
          <span className={styles.issue}>Issue #{manifest.issueNumber}</span>
        ) : null}
      </div>
    </a>
  );
}
