/**
 * ポーカーの画面。CPU版とオンライン版で同じものを使う。
 *
 * 外枠（GameShell）、スコア、盤面、結果表示までをここで描く。
 * ゲーム状態は持たず、公開状態（PokerView）と操作用の関数だけを受け取る。
 */
import { useState } from "react";
import type { GameManifest, PlayingCard, Ranking } from "@core";
import { Button, DeckPile, GameShell, Hand, ResultModal, ScoreBoard } from "@ui";
import type { ScoreBoardEntry } from "@ui";
import { HAND_NAME_JA } from "./logic";
import type { PokerSeatView, PokerView } from "./logic";
import styles from "./PokerGame.module.css";

type Props = {
  readonly manifest: GameManifest;
  readonly onExit: () => void;
  readonly view: PokerView;
  /** 交換を送れるとき true。 */
  readonly canExchange: boolean;
  readonly onExchange: (cardIds: readonly string[]) => void;
  /** GameShell のリセット。オンラインでは再戦を渡す。 */
  readonly onReset?: () => void;
  readonly result: {
    readonly open: boolean;
    readonly ranking?: Ranking;
    readonly onRetry?: () => void;
    readonly retryLabel?: string;
  };
};

/**
 * 伏せている手札を裏向きで並べるための仮カード。
 * face="down" の Card は中身を DOM に出さないので、スートと数字は表示に使われない。
 */
function hiddenCards(count: number): PlayingCard[] {
  return Array.from({ length: count }, (_, index) => ({
    kind: "standard", id: `hidden-${index}`, suit: "spades", rank: "A",
  }));
}

function seatDetail(view: PokerView, seat: PokerSeatView): string {
  if (seat.handRank) return HAND_NAME_JA[seat.handRank];
  if (view.phase === "exchanging" && seat.exchangedCount !== null) return "交換済み";
  return seat.id === view.me.id ? "交換待ち" : "手札を伏せています";
}

function statusText(view: PokerView, canExchange: boolean): string {
  if (view.phase === "showdown") return "役を判定しました";
  if (view.phase === "finished") return "勝負終了";
  if (!canExchange && view.me.exchangedCount !== null) return "相手の交換を待っています";
  return "交換するカードを選んでください（0〜5枚）";
}

function resultTitle(view: PokerView): string {
  if (view.winnerId === null) return "引き分け";
  return view.winnerId === view.me.id ? "あなたの勝ち" : `${view.opponent.name} の勝ち`;
}

export function PokerScreen({ manifest, onExit, view, canExchange, onExchange, onReset, result }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const myCards = view.me.cards ?? [];
  // 配り直しや再戦で手札が変わったら、手札にない選択は捨てる。
  const selected = selectedIds.filter(id => myCards.some(card => card.id === id));

  const toggle = (id: string) => {
    if (!canExchange) return;
    setSelectedIds(selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id]);
  };
  const exchange = () => {
    onExchange(selected);
    setSelectedIds([]);
  };

  const scoreEntries: ScoreBoardEntry[] = [view.me, view.opponent].map(seat => ({
    id: seat.id,
    name: seat.name,
    detail: seatDetail(view, seat),
  }));
  const { me, opponent } = view;

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={onReset}
      headerRight={<ScoreBoard entries={scoreEntries} title="役" />}
    >
      <div className={styles.table}>
        <section className={styles.seat} aria-label={opponent.name}>
          <h2>{opponent.name}</h2>
          <Hand
            cards={opponent.cards ?? hiddenCards(opponent.cardCount)}
            face={opponent.cards ? "up" : "down"}
            label={`${opponent.name} の手札`}
          />
          {opponent.exchangedCount !== null && <p>{opponent.exchangedCount}枚交換</p>}
        </section>
        <div className={styles.center}>
          <DeckPile count={view.deckCount} label="山札" size="md" />
          <p>{statusText(view, canExchange)}</p>
        </div>
        <section className={styles.seat} aria-label={me.name}>
          <h2>{me.name}</h2>
          <Hand
            cards={myCards}
            face="up"
            selectedIds={selected}
            onCardClick={card => toggle(card.id)}
            label={`${me.name}の手札`}
          />
          {me.exchangedCount !== null && <p>{me.exchangedCount}枚交換</p>}
          <Button onClick={exchange} disabled={!canExchange}>
            交換する（{selected.length}枚）
          </Button>
        </section>
      </div>
      <ResultModal
        open={result.open}
        title={resultTitle(view)}
        message={me.handRank && opponent.handRank
          ? `${me.name}: ${HAND_NAME_JA[me.handRank]} / ${opponent.name}: ${HAND_NAME_JA[opponent.handRank]}`
          : undefined}
        ranking={result.ranking}
        onRetry={result.onRetry}
        retryLabel={result.retryLabel}
        onExit={onExit}
      />
    </GameShell>
  );
}
