import type { ReactNode } from "react";
import type { GameManifest } from "@core";
import { Button } from "../Button/Button";
import { GameInstructions } from "../GameInstructions/GameInstructions";
import styles from "./GameShell.module.css";

export type GameShellProps = {
  manifest: GameManifest;
  onExit: () => void;
  /** 「もう一度」ボタン。省略すると出ない。 */
  onReset?: () => void;
  /** ScoreBoard や Timer を差し込む場所。 */
  headerRight?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

const difficultyLabel = { easy: "初級", normal: "中級", hard: "上級" } as const;

/**
 * 全ゲーム共通の外枠。ゲーム側が自分で描画する
 * （headerRight にスコアや時計を差せるようにするため）。
 * 使い忘れは契約テストの data-testid="game-shell" 検査で分かる。
 */
export function GameShell({
  manifest,
  onExit,
  onReset,
  headerRight,
  footer,
  children,
}: GameShellProps) {
  const players =
    manifest.minPlayers === manifest.maxPlayers
      ? manifest.minPlayers + "人"
      : manifest.minPlayers + "〜" + manifest.maxPlayers + "人";

  return (
    <div className={styles.shell} data-testid="game-shell">
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            {manifest.icon ? (
              <span className={styles.icon} aria-hidden="true">
                {manifest.icon}
              </span>
            ) : null}
            <h1 className={styles.title}>{manifest.name}</h1>
          </div>
          <p className={styles.description}>{manifest.description}</p>
          <div className={styles.badges}>
            <span className={styles.badge + " " + styles[manifest.difficulty]}>
              {difficultyLabel[manifest.difficulty]}
            </span>
            <span className={styles.badge}>{players}</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          {headerRight}
          <div className={styles.actions}>
            {onReset ? (
              <Button variant="secondary" size="sm" onClick={onReset}>
                もう一度
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={onExit}>
              ← アーケードへ
            </Button>
          </div>
        </div>
      </header>

      <div className={styles.board}>{children}</div>

      <footer className={styles.footer}>
        {footer}
        <GameInstructions steps={manifest.howToPlay} />
      </footer>
    </div>
  );
}
