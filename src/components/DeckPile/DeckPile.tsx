import type { AnyCard } from "@core";
import { Card } from "../Card/Card";
import styles from "./DeckPile.module.css";

export type DeckPileProps = {
  /** 残り枚数。0 なら空きスロットとして描画する。 */
  count: number;
  /** 一番上のカード。捨て札や台札を表向きで見せたいときに渡す。 */
  top?: AnyCard;
  face?: "up" | "down";
  label?: string;
  size?: "sm" | "md" | "lg";
  highlighted?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onClick?: () => void;
};

/** 山札・捨て札・場札。型の Deck<T> と名前がぶつからないよう DeckPile という名前にしている。 */
export function DeckPile({
  count,
  top,
  face = "down",
  label,
  size = "md",
  highlighted = false,
  disabled = false,
  placeholder,
  onClick,
}: DeckPileProps) {
  return (
    <div className={styles.pile}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <Card
        card={count > 0 ? top : undefined}
        face={face}
        size={size}
        highlighted={highlighted}
        disabled={disabled}
        placeholder={placeholder}
        onClick={onClick}
      />
      <span className={styles.count}>{count}枚</span>
    </div>
  );
}
