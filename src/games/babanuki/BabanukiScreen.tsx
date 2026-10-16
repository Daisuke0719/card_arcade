/**
 * ババ抜きの画面。CPU版とオンライン版で同じものを使う。
 *
 * 外枠（GameShell）、スコア、相手の手札、引いたカード、自分の手札、結果表示までをここで描く。
 * ゲーム状態は持たず、公開状態（BabanukiView）と操作用の関数だけを受け取る。
 */
import type { AnyCard, GameManifest, PlayerId, Ranking } from "@core";
import { Card, GameShell, Hand, ResultModal, ScoreBoard } from "@ui";
import type { ScoreBoardEntry } from "@ui";
import type { BabanukiView } from "./logic";

type Props = {
  readonly manifest: GameManifest;
  readonly onExit: () => void;
  readonly view: BabanukiView;
  /** 自分の手番で、カードを引けるとき true。 */
  readonly canDraw: boolean;
  /** 引く相手の手札の位置（0始まり）を受け取る。 */
  readonly onDraw: (index: number) => void;
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

/**
 * 裏向きに並べるためだけのカード。face="down" の Card は中身を描かないので、
 * 公開状態に無い相手のカードを、枚数から並べられる。
 */
function backsOf(ownerId: PlayerId, count: number): AnyCard[] {
  return Array.from({ length: count }, (_, index) => ({
    kind: "joker",
    id: `back-${ownerId}-${index}`,
    color: "red",
  }));
}

function nameOf(view: BabanukiView, id: PlayerId | null): string {
  return view.seats.find((seat) => seat.id === id)?.name ?? "";
}

function toScoreEntries(view: BabanukiView): ScoreBoardEntry[] {
  return view.seats.map((seat) => ({
    id: seat.id,
    name: seat.name,
    detail: `残り${seat.handCount}枚`,
    isCurrent: view.phase !== "finished" && seat.id === view.currentPlayerId,
    isFinished: seat.finishOrder !== null,
    rankLabel: seat.finishOrder !== null ? `${seat.finishOrder}位` : undefined,
  }));
}

export function BabanukiScreen({ manifest, onExit, view, canDraw, onDraw, onReset, result }: Props) {
  const others = view.seats.filter((seat) => seat.id !== view.viewerId);

  return (
    <GameShell
      manifest={manifest}
      onExit={onExit}
      onReset={onReset}
      headerRight={<ScoreBoard title="残り枚数" entries={toScoreEntries(view)} />}
    >
      <div>
        {others.map((seat) => {
          const isTarget = seat.id === view.targetId;
          return (
            <div key={seat.id}>
              <Hand
                cards={backsOf(seat.id, seat.handCount)}
                face="down"
                label={seat.name}
                onCardClick={canDraw && isTarget ? (_card, index) => onDraw(index) : undefined}
              />
              {isTarget && view.phase !== "finished" ? (
                <p aria-hidden="true">← ここから引きます</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {view.phase === "revealing" && view.lastDrawn ? (
        <div>
          <p>引いたカード</p>
          <Card card={view.lastDrawn} face="up" />
        </div>
      ) : view.phase === "revealing" && view.lastDrawerId ? (
        <div>
          <p>{nameOf(view, view.lastDrawerId)}が1枚引きました</p>
        </div>
      ) : null}

      <Hand cards={view.myHand} face="up" label="あなたの手札" />

      <ResultModal
        open={result.open}
        title="結果"
        message={result.message}
        ranking={result.ranking}
        onRetry={result.onRetry}
        retryLabel={result.retryLabel}
        onExit={onExit}
      />
    </GameShell>
  );
}
