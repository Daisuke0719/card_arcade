/**
 * ダウトの画面。CPU版とオンライン版で同じものを使う。
 *
 * 外枠（GameShell）、スコア、盤面、ダウト結果、結果表示までをここで描く。
 * ゲーム状態は持たず、公開状態（DoubtView）と操作用の関数だけを受け取る。
 */
import { useState } from "react";
import type { GameManifest, Ranking } from "@core";
import { Button, Card, DeckPile, GameShell, Hand, LogPanel, ResultModal, ScoreBoard } from "@ui";
import type { ScoreBoardEntry } from "@ui";
import { MAX_PLAY_CARDS } from "./logic";
import type { DoubtView } from "./logic";
import styles from "./DoubtGame.module.css";

type Props = {
  readonly manifest: GameManifest;
  readonly onExit: () => void;
  readonly view: DoubtView;
  /** 自分の手番で、カードを出せるとき true。 */
  readonly canPlay: boolean;
  /** 自分がダウトするかを決める番のとき true。 */
  readonly canDecide: boolean;
  readonly onPlay: (cardIds: readonly string[]) => void;
  readonly onDoubt: () => void;
  readonly onPass: () => void;
  /** GameShell のリセット。オンラインでは再戦を渡す。 */
  readonly onReset?: () => void;
  readonly result: {
    readonly open: boolean;
    readonly ranking?: Ranking;
    readonly message?: string;
    readonly onRetry?: () => void;
    readonly retryLabel?: string;
  };
};

function nameOf(view: DoubtView, id: string | null): string {
  return view.players.find((player) => player.id === id)?.name ?? id ?? "";
}

/** 今が誰の番で、何を待っているかを表す一文。 */
function statusText(view: DoubtView): string {
  if (view.phase === "playing") return `${nameOf(view, view.actorId)} の手番`;
  if (view.phase === "doubt-decision") return `${nameOf(view, view.actorId)} はダウトしますか？`;
  if (view.phase === "revealing") return "ダウトの結果";
  return "ゲーム終了";
}

/** 手札の選択を切り替える。上限まで選んでいるときは新しい選択を無視する。 */
function nextSelection(current: readonly string[], cardId: string): string[] {
  if (current.includes(cardId)) return current.filter((id) => id !== cardId);
  return current.length < MAX_PLAY_CARDS ? [...current, cardId] : [...current];
}

/** 各プレイヤーの残り枚数と、今誰が判断しているかを ScoreBoard 用に整える。 */
function toScoreEntries(view: DoubtView): ScoreBoardEntry[] {
  return view.players.map((player) => ({
    id: player.id,
    name: player.name,
    detail: `残り${player.cardCount}枚`,
    isCurrent: view.actorId === player.id,
    isFinished: player.finishOrder !== null,
    rankLabel: player.finishOrder !== null ? `${player.finishOrder}位` : undefined,
  }));
}

/** ダウトの結果と、公開された直前の組を表示する。 */
function RevealPanel({ view }: { view: DoubtView }) {
  if (!view.reveal) return null;
  const { doubterId, takerId, cards } = view.reveal;
  const doubter = doubterId ? `${nameOf(view, doubterId)} がダウトしました。` : "";
  const taker = takerId ? `${nameOf(view, takerId)} が場札を引き取りました。` : "";
  return (
    <div className={styles.reveal} aria-live="polite">
      <p>{doubter}{taker}</p>
      <div>
        {cards.map((card) => <Card key={card.id} card={card} face="up" size="sm" />)}
      </div>
    </div>
  );
}

export function DoubtScreen({
  manifest, onExit, view, canPlay, canDecide, onPlay, onDoubt, onPass, onReset, result,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // 手番が終わったら選択を捨てる。リセットや再戦のあとに前の選択が残らないようにするため。
  const [prevCanPlay, setPrevCanPlay] = useState(canPlay);
  if (canPlay !== prevCanPlay) {
    setPrevCanPlay(canPlay);
    if (!canPlay) setSelectedIds([]);
  }

  const handIds = view.myHand.map((card) => card.id);
  const selected = canPlay ? selectedIds.filter((id) => handIds.includes(id)) : [];
  const playSelected = () => {
    onPlay(selected);
    setSelectedIds([]);
  };
  const opponents = view.players.filter((player) => !player.isYou);

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={onReset}
      headerRight={<ScoreBoard entries={toScoreEntries(view)} title="手番 / 残り枚数" />}
    >
      <main className={styles.table}>
        <div className={styles.status}>
          <p className={styles.rank}>宣言ランク <strong>{view.declaredRank}</strong></p>
          <p>{statusText(view)}</p>
        </div>

        <div className={styles.piles}>
          <DeckPile count={view.pileCount} label="場札（裏向き）" placeholder="場" />
          {view.lastPlay ? (
            <div className={styles.lastPlay}>
              <span>{nameOf(view, view.lastPlay.playerId)} が {view.lastPlay.count} 枚出しました</span>
              {view.reveal ? <span>公開されたカード</span> : null}
            </div>
          ) : null}
        </div>

        <div className={styles.opponents}>
          {opponents.map((player) => (
            <Hand key={player.id} variant="hidden" count={player.cardCount} label={player.name} />
          ))}
        </div>

        <Hand
          cards={view.myHand}
          label="あなたの手札（1〜4枚を選択）"
          selectedIds={selected}
          disabledIds={canPlay ? [] : handIds}
          onCardClick={(card) => setSelectedIds((current) => nextSelection(current, card.id))}
        />
        <div className={styles.actions}>
          <Button onClick={playSelected} disabled={!canPlay || selected.length === 0}>
            {selected.length}枚出す
          </Button>
          <Button variant="danger" onClick={onDoubt} disabled={!canDecide}>
            ダウト！
          </Button>
          <Button variant="secondary" onClick={onPass} disabled={!canDecide}>
            見送る
          </Button>
        </div>
        <LogPanel entries={view.log} title="進行ログ" />
      </main>

      <RevealPanel view={view} />

      <ResultModal
        open={result.open}
        title="ゲーム終了"
        message={result.message}
        ranking={result.ranking}
        onRetry={result.onRetry}
        retryLabel={result.retryLabel}
        onExit={onExit}
      />
    </GameShell>
  );
}
