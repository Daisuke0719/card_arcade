/**
 * ページワン のルール。
 *
 * このファイルには「純粋な処理」だけを書きます。
 *   - react を import しない
 *   - Math.random() / Date.now() / setTimeout を使わない
 *   - 乱数が必要なら state から決まる seed で createRng を作る
 *
 * 特殊カードは「手番を何人分進めるか」の違いとして扱います（stepsOf）。
 * お手本: src/games/example-game/logic.ts
 */
import {
  cardShortLabel,
  createDeck,
  createRng,
  createSoloVsCpu,
  createTurnState,
  deal,
  draw,
  last,
  nextTurn,
  rankByScore,
  requireCard,
  sameRank,
  sameSuit,
  shuffle,
} from "@core";
import type { CardId, PlayerId, PlayingCard, Ranking, Rng, TurnState } from "@core";
import { chooseCard } from "./cpu";

/** CPU が1手を指すまでの待ち時間。画面はこの値を参照するだけ。 */
export const CPU_DELAY_MS = 800;

/** 1人に配る枚数。 */
export const HAND_SIZE = 5;

/** プレイヤー1人 + CPU 3人。 */
export const PLAYER_COUNT = 4;

/** 人間のプレイヤーID。createSoloVsCpu が付ける既定の値。 */
export const HUMAN_ID: PlayerId = "you";

export type Phase = "playing" | "finished";

export type PageOneState = {
  /** 山札。先頭から引く。 */
  readonly deck: readonly PlayingCard[];
  /** 場札。出された順に積まれ、末尾が一番上。 */
  readonly field: readonly PlayingCard[];
  /** プレイヤーIDごとの手札。id は "you" / "cpu-1" / "cpu-2" / "cpu-3"。 */
  readonly hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>;
  /** 手番は @core の TurnState に持たせる。 */
  readonly turn: TurnState;
  readonly phase: Phase;
  /** 上がった人。1人入った時点で終了する。 */
  readonly winnerId: PlayerId | null;
  /** 進行ログ（新しいものが先頭）。 */
  readonly log: readonly string[];
  /** これまでに引いた回数。山札を混ぜ直すときの seed に使う。 */
  readonly drawCount: number;
  readonly seed: number;
};

export type PageOneAction =
  | { readonly type: "play"; readonly cardId: CardId }
  | { readonly type: "draw" }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

/* ============================================================
 * 参照用の小さな関数
 * ============================================================ */

/** その人の手札。未知の id なら空配列。 */
export function handOf(state: PageOneState, playerId: PlayerId): readonly PlayingCard[] {
  return state.hands[playerId] ?? [];
}

/** 場札の一番上。 */
export function fieldTop(state: PageOneState): PlayingCard {
  return requireCard(last(state.field), "場札が空です");
}

function nameOf(state: PageOneState, playerId: PlayerId): string {
  return state.turn.players.find((player) => player.id === playerId)?.name ?? playerId;
}

function isCpu(state: PageOneState, playerId: PlayerId): boolean {
  return state.turn.players.find((player) => player.id === playerId)?.kind === "cpu";
}

/** ログを1行足した状態を返す。 */
function withLog(state: PageOneState, entry: string): PageOneState {
  return { ...state, log: [entry, ...state.log] };
}

/* ============================================================
 * ルール
 * ============================================================ */

/** その1枚を今の場札に出せるか。同じマークか同じ数字なら true。 */
export function canPlay(card: PlayingCard, field: PlayingCard): boolean {
  return sameSuit(card, field) || sameRank(card, field);
}

/** 手札のうち今出せるカードだけを返す。0件のときだけ山札を引ける。 */
export function legalMoves(
  hand: readonly PlayingCard[],
  field: PlayingCard,
): PlayingCard[] {
  return hand.filter((card) => canPlay(card, field));
}

/** そのカードを出したあと、手番を何人分進めるか。8 なら2、A なら0、それ以外は1。 */
function stepsOf(card: PlayingCard): number {
  if (card.rank === "8") return 2;
  if (card.rank === "A") return 0;
  return 1;
}

/** 手番を steps 人分進める。0 なら進めない（A）、2 なら1人飛ばす（8）。 */
export function advanceTurn(state: PageOneState, steps: number): PageOneState {
  let turn = state.turn;
  for (let step = 0; step < steps; step += 1) {
    turn = nextTurn(turn);
  }
  return turn === state.turn ? state : { ...state, turn };
}

/** 最初の状態。5枚ずつ配り、山札から1枚めくって場札にする。 */
export function createInitialState(seed: number = 1): PageOneState {
  const players = createSoloVsCpu(PLAYER_COUNT - 1);
  const shuffled = shuffle(createDeck(), createRng(seed));
  const { hands: dealt, rest } = deal(shuffled, PLAYER_COUNT, HAND_SIZE);
  const { card: opened, rest: deckRest } = draw(rest);
  const field = requireCard(opened, "山札から場札をめくれませんでした");

  const hands: Record<PlayerId, readonly PlayingCard[]> = {};
  players.forEach((player, index) => {
    hands[player.id] = dealt[index] ?? [];
  });

  // めくった場札が8やAでも、特殊効果は発動しない。
  return {
    deck: deckRest,
    field: [field],
    hands,
    turn: createTurnState(players),
    phase: "playing",
    winnerId: null,
    log: [`場札は${cardShortLabel(field)}です`],
    drawCount: 0,
    seed,
  };
}

/** 1枚出す。出せないカードや手番でない人を渡されたら state をそのまま返す。 */
export function applyPlay(
  state: PageOneState,
  playerId: PlayerId,
  card: PlayingCard,
): PageOneState {
  if (state.phase !== "playing") return state;
  if (state.turn.currentId !== playerId) return state;

  const hand = handOf(state, playerId);
  if (!hand.some((item) => item.id === card.id)) return state;
  if (!canPlay(card, fieldTop(state))) return state;

  const rest = hand.filter((item) => item.id !== card.id);
  const played = withLog(
    {
      ...state,
      field: [...state.field, card],
      hands: { ...state.hands, [playerId]: rest },
    },
    `${nameOf(state, playerId)}が${cardShortLabel(card)}を出しました`,
  );

  // 最後の1枚が8やAでも、特殊効果は適用せずここで終わる。
  if (rest.length === 0) {
    return withLog(
      { ...played, phase: "finished", winnerId: playerId },
      `${nameOf(state, playerId)}が上がりました`,
    );
  }

  return advanceTurn(played, stepsOf(card));
}

/**
 * 山札が空なら、場札の一番上だけを残して残りを混ぜ、山札に戻す。
 * 混ぜ直しの乱数は state から決まる seed で作る。
 */
function refillDeck(state: PageOneState): PageOneState {
  if (state.deck.length > 0) return state;
  if (state.field.length <= 1) return state;

  const top = fieldTop(state);
  const rng: Rng = createRng(state.seed + state.drawCount);
  return withLog(
    {
      ...state,
      deck: shuffle(state.field.slice(0, -1), rng),
      field: [top],
    },
    "場札を混ぜて山札に戻しました",
  );
}

/** 山札から1枚引いて手札に加える。山札が空なら場札を混ぜ直してから引く。 */
export function drawFromDeck(state: PageOneState, playerId: PlayerId): PageOneState {
  if (state.phase !== "playing") return state;
  if (state.turn.currentId !== playerId) return state;

  const refilled = refillDeck(state);
  const { card: drawn, rest } = draw(refilled.deck);

  // 山札も場札の下も空。引けるカードが無いので手番だけ次へ移す。
  if (!drawn) {
    return advanceTurn(
      withLog(refilled, `${nameOf(state, playerId)}は引けるカードがありません`),
      1,
    );
  }

  const picked = withLog(
    {
      ...refilled,
      deck: rest,
      hands: { ...refilled.hands, [playerId]: [...handOf(refilled, playerId), drawn] },
      drawCount: refilled.drawCount + 1,
    },
    `${nameOf(state, playerId)}が山札から1枚引きました`,
  );

  // 引いたカードが出せるときは、その場で出す（手札に残す選択肢はない）。
  if (canPlay(drawn, fieldTop(picked))) {
    return applyPlay(picked, playerId, drawn);
  }

  return advanceTurn(picked, 1);
}

/** CPU の手番を1手進める。 */
function applyCpuTurn(state: PageOneState): PageOneState {
  if (state.phase !== "playing") return state;

  const playerId = state.turn.currentId;
  if (!isCpu(state, playerId)) return state;

  const moves = legalMoves(handOf(state, playerId), fieldTop(state));
  const rng = createRng(state.seed + state.drawCount * 31 + state.field.length);
  const chosen = chooseCard(moves, rng);

  return chosen ? applyPlay(state, playerId, chosen) : drawFromDeck(state, playerId);
}

/** 順位。1位は上がった人、2位以下は手札の枚数が少ない順（同数は同順位）。 */
export function getRanking(state: PageOneState): Ranking {
  return rankByScore(
    state.turn.players.map((player) => ({
      id: player.id,
      name: player.name,
      score: handOf(state, player.id).length,
    })),
    "lower-is-better",
  );
}

/** 状態 + 行動 -> 新しい状態。ルールはすべてここに集める。 */
export function reduce(state: PageOneState, action: PageOneAction): PageOneState {
  switch (action.type) {
    case "play": {
      if (state.turn.currentId !== HUMAN_ID) return state;
      const card = handOf(state, HUMAN_ID).find((item) => item.id === action.cardId);
      return card ? applyPlay(state, HUMAN_ID, card) : state;
    }
    case "draw": {
      if (state.phase !== "playing") return state;
      if (state.turn.currentId !== HUMAN_ID) return state;
      // 出せるカードが1枚でもあるときは引けない。
      if (legalMoves(handOf(state, HUMAN_ID), fieldTop(state)).length > 0) return state;
      return drawFromDeck(state, HUMAN_ID);
    }
    case "tick":
      return applyCpuTurn(state);
    case "reset":
      return createInitialState(action.seed ?? state.seed + 1);
    default:
      return state;
  }
}

/** 今、何ms後に自動処理が要るか。null は人間の入力待ち。 */
export function pendingDelayMs(state: PageOneState): number | null {
  if (state.phase === "finished") return null;
  return isCpu(state, state.turn.currentId) ? CPU_DELAY_MS : null;
}

export function isGameOver(state: PageOneState): boolean {
  return state.phase === "finished";
}
