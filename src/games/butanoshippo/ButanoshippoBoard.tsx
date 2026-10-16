/**
 * ぶたのしっぽの画面。外枠・スコア・輪・場札・結果表示をまとめている。
 *
 * CPU 版とオンライン版は、それぞれの状態をこの props に変換して渡す。
 * 輪は枚数だけを受け取り、カードの中身は扱わない。
 */
import { createDeck, requireCard } from "@core";
import type { GameManifest, Ranking, PlayingCard } from "@core";
import { Card, DeckPile, GameShell, ResultModal, ScoreBoard } from "@ui";
import type { ScoreBoardEntry } from "@ui";
import styles from "./ButanoshippoGame.module.css";

/** 裏向きの輪を描くための見た目用のカード。face="down" の間は中身が DOM に出ない。 */
const BACK_CARD: PlayingCard = requireCard(createDeck()[0], "デッキが空です");

export type ButanoshippoBoardProps = {
  readonly manifest: GameManifest;
  readonly onExit: () => void;
  readonly onReset?: () => void;
  readonly entries: readonly ScoreBoardEntry[];
  /** 輪に残っている枚数。 */
  readonly ringCount: number;
  readonly pileCount: number;
  readonly pileTop?: PlayingCard;
  /** 先頭のカードを押してよいとき true。 */
  readonly canFlip: boolean;
  readonly onFlip: () => void;
  readonly hint: string;
  /** 直前に引き取った人の名前。いなければ null。 */
  readonly collectorName: string | null;
  readonly finished: boolean;
  readonly ranking?: Ranking;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
};

export function ButanoshippoBoard({
  manifest,
  onExit,
  onReset,
  entries,
  ringCount,
  pileCount,
  pileTop,
  canFlip,
  onFlip,
  hint,
  collectorName,
  finished,
  ranking,
  onRetry,
  retryLabel,
}: ButanoshippoBoardProps) {
  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={onReset}
      headerRight={<ScoreBoard title="引き取り枚数" entries={entries} />}
      footer={<p>数字は引き取った枚数です。</p>}
    >
      <main className={styles.game}>
        <section className={styles.ringSection} aria-label="カードの輪">
          <div className={styles.ringHeader}>
            <h2>カードの輪</h2>
            <p>残り {ringCount} 枚</p>
          </div>
          <div className={styles.ring}>
            {Array.from({ length: ringCount }, (_, index) => (
              <Card
                key={index}
                card={BACK_CARD}
                face="down"
                size="sm"
                highlighted={index === 0}
                onClick={index === 0 && canFlip ? onFlip : undefined}
                disabled={index === 0 && !canFlip}
              />
            ))}
            {ringCount === 0 ? <p className={styles.empty}>輪のカードはありません</p> : null}
          </div>
          <p className={styles.hint}>{hint}</p>
        </section>

        <section className={styles.field} aria-label="場札">
          <h2>場の中央</h2>
          <DeckPile count={pileCount} top={pileTop} face="up" label="場札" size="lg" />
          {collectorName ? <p>{collectorName} が引き取りました</p> : null}
        </section>
      </main>

      <ResultModal
        open={finished}
        title="結果"
        ranking={ranking}
        onRetry={onRetry}
        retryLabel={retryLabel}
        onExit={onExit}
      />
    </GameShell>
  );
}
