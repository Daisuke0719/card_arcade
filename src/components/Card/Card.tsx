import { SUIT_COLOR, SUIT_SYMBOL, cardLabel, isJoker } from "@core";
import type { AnyCard } from "@core";
import styles from "./Card.module.css";

export type CardProps = {
  /** 省略すると空きスロット（点線の枠）になる。 */
  card?: AnyCard;
  /** "down" のときカードの中身は DOM に一切出さない。 */
  face?: "up" | "down";
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  highlighted?: boolean;
  disabled?: boolean;
  /** 空きスロットに出す短い文字（"7" など）。 */
  placeholder?: string;
  onClick?: () => void;
};

/**
 * トランプ1枚。
 *
 * 規約（契約テストで固定している）:
 * 1. face="down" のときスート・ランク・ラベルを DOM に出さない。
 *    神経衰弱のカンニングを防ぎ、「DOM を覗けば答えが分かるテスト」も書けなくする。
 * 2. face="up" のとき aria-label は必ず cardLabel(card)（例: "スペードのA"）。
 *    6チームのテストが getByLabelText("スペードのA") に揃う。
 */
export function Card({
  card,
  face = "up",
  size = "md",
  selected = false,
  highlighted = false,
  disabled = false,
  placeholder,
  onClick,
}: CardProps) {
  const clickable = Boolean(onClick) && !disabled;

  const classes = [
    styles.card,
    size === "sm" ? styles.sm : "",
    size === "lg" ? styles.lg : "",
    !card ? styles.empty : "",
    card && face === "down" ? styles.back : "",
    selected ? styles.selected : "",
    highlighted ? styles.highlighted : "",
    disabled ? styles.disabled : "",
    clickable ? styles.clickable : "",
  ]
    .filter(Boolean)
    .join(" ");

  const commonProps = {
    className: classes,
    onClick: clickable ? onClick : undefined,
    disabled: disabled || !onClick,
    type: "button" as const,
  };

  if (!card) {
    return (
      <button {...commonProps} aria-label={placeholder ? `空き(${placeholder})` : "空きスロット"}>
        {placeholder ?? ""}
      </button>
    );
  }

  if (face === "down") {
    // ここで card の中身を参照しないことが規約そのもの
    return <button {...commonProps} aria-label="裏向きのカード" />;
  }

  if (isJoker(card)) {
    return (
      <button {...commonProps} aria-label={cardLabel(card)}>
        <span className={`${styles.face} ${styles.joker}`}>JOKER</span>
      </button>
    );
  }

  const colorClass = SUIT_COLOR[card.suit] === "red" ? styles.red : "";
  return (
    <button {...commonProps} aria-label={cardLabel(card)}>
      <span className={`${styles.face} ${colorClass}`} aria-hidden="true">
        <span className={styles.rank}>{card.rank}</span>
        <span className={styles.suit}>{SUIT_SYMBOL[card.suit]}</span>
      </span>
    </button>
  );
}
