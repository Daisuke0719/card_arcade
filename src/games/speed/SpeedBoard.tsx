/**
 * スピードの盤面。CPU 版とオンライン版が同じ画面を使うための表示専用コンポーネント。
 *
 * ルールと勝敗の判定は持たず、渡された値を表示して操作を通知するだけにする。
 */
import type { GameManifest, PlayingCard, Ranking } from "@core";
import { Button, Card, DeckPile, GameShell, Hand, ResultModal } from "@ui";
import styles from "./SpeedGame.module.css";

export type SpeedBoardProps = {
  readonly manifest: GameManifest;
  readonly onExit: () => void;
  /** GameShell のリセット。渡さなければボタンは表示されない。 */
  readonly onReset?: () => void;

  readonly opponentName: string;
  readonly opponentDeckCount: number;
  readonly opponentHandCount: number;

  readonly piles: readonly [PlayingCard, PlayingCard];

  readonly myName: string;
  readonly myDeckCount: number;
  readonly myHand: readonly PlayingCard[];
  readonly highlightedIds: readonly string[];
  /** 操作できないカード。CPU 版では渡さない。 */
  readonly disabledIds?: readonly string[];
  readonly onPlay: (cardId: string) => void;
  /** 台札の更新ボタン。渡したときだけ表示する（CPU 版は自動で更新するため渡さない）。 */
  readonly onRefill?: () => void;

  readonly finished: boolean;
  readonly resultTitle: string;
  readonly resultScore: string;
  readonly ranking: Ranking;
  /** 結果モーダルの再挑戦。渡さなければボタンは表示されない。 */
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
};

export function SpeedBoard({
  manifest,
  onExit,
  onReset,
  opponentName,
  opponentDeckCount,
  opponentHandCount,
  piles,
  myName,
  myDeckCount,
  myHand,
  highlightedIds,
  disabledIds,
  onPlay,
  onRefill,
  finished,
  resultTitle,
  resultScore,
  ranking,
  onRetry,
  retryLabel,
}: SpeedBoardProps) {
  return (
    <GameShell manifest={manifest} onExit={onExit} onReset={onReset}>
      <div className={styles.container}>
        <div className={styles.cpuArea}>
          <DeckPile label={`${opponentName} の山札`} count={opponentDeckCount} />
          <Hand variant="hidden" count={opponentHandCount} />
        </div>

        <div className={styles.center}>
          <div className={styles.piles}>
            <div className={styles.pileSlot}>
              <span className={styles.pileLabel}>左の台札</span>
              <Card card={piles[0]} face="up" size="lg" />
            </div>
            <div className={styles.pileSlot}>
              <span className={styles.pileLabel}>右の台札</span>
              <Card card={piles[1]} face="up" size="lg" />
            </div>
          </div>
          {onRefill ? <Button onClick={onRefill}>台札を更新</Button> : null}
        </div>

        <div className={styles.playerArea}>
          <DeckPile label={`${myName}の山札`} count={myDeckCount} />
          <Hand
            cards={myHand}
            highlightedIds={highlightedIds}
            disabledIds={disabledIds}
            onCardClick={(card) => onPlay(card.id)}
          />
        </div>
      </div>

      <ResultModal
        open={finished}
        title={resultTitle}
        score={resultScore}
        ranking={ranking}
        onRetry={onRetry}
        retryLabel={retryLabel}
        onExit={onExit}
      />
    </GameShell>
  );
}
