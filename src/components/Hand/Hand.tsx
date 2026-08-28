import type { AnyCard } from "@core";
import { Card } from "../Card/Card";
import styles from "./Hand.module.css";

export type HandLayout = "row" | "fan" | "grid" | "stack";

type OpenHandProps = {
  variant?: "open";
  cards: readonly AnyCard[];
  face?: "up" | "down";
  layout?: HandLayout;
  /** grid のときの列数。神経衰弱は 4。 */
  columns?: number;
  size?: "sm" | "md" | "lg";
  /** 選択中のカードID。複数選択（大富豪・ダウト）はここをゲーム側でトグルする。 */
  selectedIds?: readonly string[];
  /** 押せないカードのID。 */
  disabledIds?: readonly string[];
  /** 出せるカードを緑枠で示す（スピード・七並べ）。 */
  highlightedIds?: readonly string[];
  onCardClick?: (card: AnyCard, index: number) => void;
  label?: string;
  emptyText?: string;
};

type HiddenHandProps = {
  variant: "hidden";
  /** 枚数だけを表示する。実カードは DOM に入らない。 */
  count: number;
  label?: string;
};

export type HandProps = OpenHandProps | HiddenHandProps;

/**
 * 手札の表示。
 *
 * - variant="open"   … カードを並べる。face="down" にすれば裏向きで並ぶ
 *                      （ババ抜きで相手の手札から引く、神経衰弱の場札）
 * - variant="hidden" … 枚数だけを出す。他プレイヤーの手札に使う
 *                      （ダウト・大富豪。実カードを DOM に入れないので漏れようがない）
 */
export function Hand(props: HandProps) {
  if (props.variant === "hidden") {
    return (
      <div className={styles.wrapper}>
        {props.label ? <span className={styles.label}>{props.label}</span> : null}
        <div className={styles.hidden}>
          <span className={styles.hiddenIcon} aria-hidden="true" />
          <span className={styles.count}>{props.count}枚</span>
        </div>
      </div>
    );
  }

  const {
    cards,
    face = "up",
    layout = "row",
    columns = 4,
    size = "md",
    selectedIds = [],
    disabledIds = [],
    highlightedIds = [],
    onCardClick,
    label,
    emptyText = "カードがありません",
  } = props;

  const layoutClass =
    layout === "fan"
      ? styles.fan
      : layout === "grid"
        ? styles.grid
        : layout === "stack"
          ? styles.stack
          : "";

  return (
    <div className={styles.wrapper}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <div
        className={`${styles.cards} ${layoutClass}`}
        style={layout === "grid" ? ({ "--hand-columns": columns } as React.CSSProperties) : undefined}
      >
        {cards.length === 0 ? <span className={styles.empty}>{emptyText}</span> : null}
        {cards.map((card, index) => (
          <Card
            key={`${card.id}-${index}`}
            card={card}
            face={face}
            size={size}
            selected={selectedIds.includes(card.id)}
            disabled={disabledIds.includes(card.id)}
            highlighted={highlightedIds.includes(card.id)}
            onClick={onCardClick ? () => onCardClick(card, index) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
