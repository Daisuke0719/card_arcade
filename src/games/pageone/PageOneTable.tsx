import type { PlayingCard } from "@core";
import { Button, DeckPile, Hand, LogPanel } from "@ui";
import styles from "./PageOneGame.module.css";

type Props = {
  opponents: readonly { id: string; name: string; handCount: number }[];
  field: readonly PlayingCard[];
  deckCount: number;
  hand: readonly PlayingCard[];
  disabledIds: readonly string[];
  canDraw: boolean;
  canDeclare?: boolean;
  turnMessage: string;
  hintMessage: string;
  log: readonly string[];
  onPlay: (cardId: string) => void;
  onDraw: () => void;
  onDeclare?: () => void;
};

/** CPU・オンラインで同じ盤面を使う。ここにはゲーム状態を持たせない。 */
export function PageOneTable(props: Props) {
  return <div className={styles.table}>
    <div className={styles.opponents}>
      {props.opponents.map(player => <Hand key={player.id} variant="hidden" count={player.handCount} label={player.name} />)}
    </div>
    <div className={styles.piles}>
      <DeckPile count={props.field.length} top={props.field.at(-1)} face="up" label="場札" size="lg" />
      <DeckPile count={props.deckCount} face="down" label="山札" size="lg" highlighted={props.canDraw} disabled={!props.canDraw} onClick={props.onDraw} />
    </div>
    <p className={styles.turn}>{props.turnMessage}</p>
    <p className={styles.message}>{props.hintMessage}</p>
    <div className={styles.you}>
      <Hand cards={props.hand} label="あなたの手札" disabledIds={props.disabledIds} onCardClick={card => props.onPlay(card.id)} emptyText="手札はありません" />
      <Button onClick={props.onDraw} disabled={!props.canDraw}>山札から引く</Button>
      {props.onDeclare && <Button onClick={props.onDeclare} disabled={!props.canDeclare}>ページワンを宣言</Button>}
    </div>
    <div className={styles.log}><LogPanel entries={props.log} max={6} /></div>
  </div>;
}
