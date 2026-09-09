/**
 * ババ抜き のルール。
 *
 * このファイルには「純粋な処理」だけを書きます。
 *   - react を import しない
 *   - Math.random() / Date.now() / setTimeout を使わない
 *   - 乱数が必要なら引数で Rng を受け取る（テストで createRng(seed) を渡せるようにする）
 * これらは ESLint がエラーにするので、うっかり書いても CI の前に気づけます。
 *
 * お手本: src/games/example-game/logic.ts
 */
import {
  createDeckWithJokers,
  createRng,
  createSoloVsCpu,
  createTurnState,
  deal,
  finishPlayer,
  groupByRank,
  isOver,
  neighborId,
  nextTurn,
  partitionJokers,
  rankByFinishOrder,
  shuffle,
} from "@core";
import type { AnyCard, PlayerId, Ranking, TurnState } from "@core";
import { chooseDrawIndex } from "./cpu";

/** CPU が1枚引くまでの待ち時間。UI はこの値を参照するだけ。 */
export const CPU_DRAW_DELAY_MS = 900;

/** 引いたカードを見せている時間。 */
export const REVEAL_DELAY_MS = 700;

export type Phase = "playing" | "revealing" | "finished";

export type BabanukiState = {
  /** プレイヤーIDごとの手札。id は "you" / "cpu-1" / "cpu-2" / "cpu-3"。 */
  readonly hands: Readonly<Record<PlayerId, readonly AnyCard[]>>;
  /** 手番と上がった順は @core の TurnState に持たせる。 */
  readonly turn: TurnState;
  readonly phase: Phase;
  /** 直前に引かれたカード。revealing の間だけ入る。 */
  readonly lastDrawn: AnyCard | null;
  /** これまでに引いた回数。CPU 用の Rng を作る種に使う。 */
  readonly drawCount: number;
  readonly seed: number;
};

export type BabanukiAction =
  | { readonly type: "draw"; readonly index: number }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/** 手番のプレイヤーが今CPUかどうか。 */
function isCpuTurn(state: BabanukiState): boolean {
  const current = state.turn.players.find((player) => player.id === state.turn.currentId);
  return current?.kind === "cpu";
}

/**
 * 手札から同じランクのペアを取り除く。
 * 2枚なら両方、4枚なら2ペアとも捨て、3枚なら先頭2枚だけ捨てて1枚残す。
 * ジョーカーはどのカードともペアにならないので、必ず手札に残る。
 */
export function discardPairs(hand: readonly AnyCard[]): AnyCard[] {
  const { standards, jokers } = partitionJokers(hand);
  const groups = groupByRank(standards);

  const removedIds = new Set<string>();
  for (const cards of groups.values()) {
    if (cards.length < 2) continue;
    const pairCount = cards.length % 2 === 0 ? cards.length : cards.length - 1;
    for (let i = 0; i < pairCount; i += 1) removedIds.add(cards[i].id);
  }

  const remainingStandards = standards.filter((card) => !removedIds.has(card.id));
  return [...remainingStandards, ...jokers];
}

/** 最初の状態。配り切ったあと各手札のペアを捨てた状態を返す。 */
export function createInitialState(seed?: number): BabanukiState {
  const rng = createRng(seed);
  const deck = shuffle(createDeckWithJokers(1), rng);
  const players = createSoloVsCpu(3);
  const { hands: dealtHands } = deal(deck, players.length);

  const hands = Object.fromEntries(
    players.map((player, index) => [player.id, discardPairs(dealtHands[index])]),
  ) as Record<PlayerId, readonly AnyCard[]>;

  return {
    hands,
    turn: createTurnState(players),
    phase: "playing",
    lastDrawn: null,
    drawCount: 0,
    seed: seed ?? 0,
  };
}

/** 今の手番から見た「引く相手」。生存者が自分だけなら undefined。 */
export function nextAlivePlayer(state: BabanukiState): PlayerId | undefined {
  return neighborId(state.turn, 1);
}

/** 手番のプレイヤーが、左隣の index 番目のカードを引く。 */
export function drawCard(state: BabanukiState, index: number): BabanukiState {
  const targetId = nextAlivePlayer(state);
  if (!targetId) return state;

  const targetHand = state.hands[targetId];
  if (index < 0 || index >= targetHand.length) return state;

  const drawnCard = targetHand[index];
  const restOfTarget = [...targetHand.slice(0, index), ...targetHand.slice(index + 1)];

  const currentId = state.turn.currentId;
  const newCurrentHand = discardPairs([...state.hands[currentId], drawnCard]);

  const hands: Record<PlayerId, readonly AnyCard[]> = {
    ...state.hands,
    [currentId]: newCurrentHand,
    [targetId]: restOfTarget,
  };

  let turn = state.turn;
  if (newCurrentHand.length === 0) turn = finishPlayer(turn, currentId);
  if (restOfTarget.length === 0) turn = finishPlayer(turn, targetId);

  return {
    ...state,
    hands,
    turn,
    lastDrawn: drawnCard,
  };
}

/** 上がった順の順位。最後の1人は最下位として並ぶ。 */
export function getRanking(state: BabanukiState): Ranking {
  return rankByFinishOrder(state.turn.finishedIds, state.turn.players);
}

/** 状態 + 行動 -> 新しい状態。ルールはすべてここに集める。 */
export function reduce(state: BabanukiState, action: BabanukiAction): BabanukiState {
  switch (action.type) {
    case "reset":
      return createInitialState(action.seed);

    case "draw": {
      if (state.phase !== "playing") return state;
      if (isCpuTurn(state)) return state;

      const drawn = drawCard(state, action.index);
      if (drawn === state) return state;

      const next = { ...drawn, drawCount: state.drawCount + 1 };
      return isOver(next.turn) ? { ...next, phase: "finished" } : { ...next, phase: "revealing" };
    }

    case "tick": {
      if (state.phase === "revealing") {
        return { ...state, phase: "playing", lastDrawn: null, turn: nextTurn(state.turn) };
      }

      if (state.phase === "playing" && isCpuTurn(state)) {
        const targetId = nextAlivePlayer(state);
        if (!targetId) return state;

        const rng = createRng(state.seed + state.drawCount);
        const index = chooseDrawIndex(state.hands[targetId].length, rng);
        const drawn = drawCard(state, index);
        if (drawn === state) return state;

        const next = { ...drawn, drawCount: state.drawCount + 1 };
        return isOver(next.turn) ? { ...next, phase: "finished" } : { ...next, phase: "revealing" };
      }

      return state;
    }

    default:
      return state;
  }
}

/** 今、何ms後に自動処理が要るか。null は人間の入力待ち。 */
export function pendingDelayMs(state: BabanukiState): number | null {
  if (state.phase === "finished") return null;
  if (state.phase === "revealing") return REVEAL_DELAY_MS;
  return isCpuTurn(state) ? CPU_DRAW_DELAY_MS : null;
}

export function isGameOver(state: BabanukiState): boolean {
  return state.phase === "finished";
}
