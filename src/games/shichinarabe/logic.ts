/**
 * 七並べ のルール。
 *
 * このファイルには「純粋な処理」だけを書きます。
 *   - react を import しない
 *   - Math.random() / Date.now() / setTimeout を使わない
 *   - 乱数が必要なら引数で Rng を受け取る（テストで createRng(seed) を渡せるようにする）
 */
import {
  RANKS,
  SUITS,
  cardLabel,
  createDeck,
  createRng,
  createSoloVsCpu,
  createTurnState,
  deal,
  finishPlayer,
  findPlayer,
  isFinished,
  isOver,
  nextTurn,
  rankByFinishOrder,
  rankToNumber,
  shuffle,
} from "@core";
import type { CardId, PlayerId, PlayingCard, Ranking, Suit, TurnState } from "@core";
import { chooseCard } from "./cpu";

/** CPU が1手を指すまでの待ち時間。画面はこの値を参照するだけ。 */
export const CPU_DELAY_MS = 700;

/** 1人が使えるパスの回数。これを使いきったあとのパスで脱落する。 */
export const MAX_PASSES = 3;

/** 人間プレイヤーの id。createSoloVsCpu が既定でこの id を割り当てる。 */
export const HUMAN_ID: PlayerId = "you";

export type Phase = "playing" | "finished";

/**
 * 場。index 0..12 が A..K に対応し、true なら置かれている。
 * 7の位置は rankToNumber("7") - 1 === 6。
 */
export type Board = Record<Suit, boolean[]>;

export type ShichinarabeState = {
  readonly board: Board;
  /** プレイヤーIDごとの手札。 */
  readonly hands: Record<PlayerId, readonly PlayingCard[]>;
  /** 手番と「上がった順」。@core の TurnState をそのまま使う。 */
  readonly turn: TurnState;
  /** プレイヤーIDごとの、これまでに使ったパスの回数。 */
  readonly passes: Record<PlayerId, number>;
  /** 脱落した人。脱落した順に入る。 */
  readonly droppedIds: readonly PlayerId[];
  readonly phase: Phase;
  /** LogPanel に渡す進行ログ（新しいものが先頭）。 */
  readonly log: readonly string[];
  readonly seed: number;
};

export type ShichinarabeAction =
  | { readonly type: "place"; readonly cardId: CardId }
  | { readonly type: "pass" }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

function createEmptyBoard(): Board {
  const board = {} as Board;
  for (const suit of SUITS) {
    board[suit] = new Array(RANKS.length).fill(false);
  }
  return board;
}

function placeOnBoard(board: Board, card: PlayingCard): Board {
  const index = rankToNumber(card.rank) - 1;
  return {
    ...board,
    [card.suit]: board[card.suit].map((value, i) => (i === index ? true : value)),
  };
}

/** 最初の状態。seed を固定すると毎回同じ配りになる（テスト用）。 */
export function createInitialState(seed: number = 1): ShichinarabeState {
  const rng = createRng(seed);
  const deck = shuffle(createDeck(), rng);
  const players = createSoloVsCpu(3);
  const { hands: dealtHands } = deal(deck, players.length, 13);

  let board = createEmptyBoard();
  const hands: Record<PlayerId, PlayingCard[]> = {};
  let startId: PlayerId = players[0].id;

  players.forEach((player, index) => {
    const dealt = dealtHands[index] ?? [];
    const remaining: PlayingCard[] = [];
    for (const item of dealt) {
      if (item.rank === "7") {
        board = placeOnBoard(board, item);
        if (item.suit === "diamonds") startId = player.id;
      } else {
        remaining.push(item);
      }
    }
    hands[player.id] = remaining;
  });

  const passes: Record<PlayerId, number> = {};
  players.forEach((player) => {
    passes[player.id] = 0;
  });

  return {
    board,
    hands,
    turn: createTurnState(players, { startId }),
    passes,
    droppedIds: [],
    phase: "playing",
    log: [],
    seed,
  };
}

/** その1枚を今の場に置けるか。同じスートで ±1 の隣が置かれているときだけ true。 */
export function canPlace(board: Board, card: PlayingCard): boolean {
  const index = rankToNumber(card.rank) - 1;
  const column = board[card.suit];
  if (column[index]) return false;

  const lower = index > 0 && column[index - 1];
  const upper = index < column.length - 1 && column[index + 1];
  return Boolean(lower || upper);
}

/** 手札のうち今置けるカードだけを返す。0件のときだけパスできる。 */
export function legalMoves(board: Board, hand: readonly PlayingCard[]): PlayingCard[] {
  return hand.filter((card) => canPlace(board, card));
}

/** 1枚置いて次の人へ手番を移す。置けないカードを渡されたら state をそのまま返す。 */
export function place(
  state: ShichinarabeState,
  playerId: PlayerId,
  card: PlayingCard,
): ShichinarabeState {
  if (state.phase !== "playing") return state;
  if (state.turn.currentId !== playerId) return state;
  if (!canPlace(state.board, card)) return state;

  const board = placeOnBoard(state.board, card);
  const hand = (state.hands[playerId] ?? []).filter((item) => item.id !== card.id);
  const hands = { ...state.hands, [playerId]: hand };
  const player = findPlayer(state.turn.players, playerId);
  const name = player?.name ?? playerId;

  const turn = hand.length === 0 ? finishPlayer(state.turn, playerId) : nextTurn(state.turn);
  const log =
    hand.length === 0
      ? [`${name}が${cardLabel(card)}を置いて上がりました`, ...state.log]
      : [`${name}が${cardLabel(card)}を置きました`, ...state.log];

  return {
    ...state,
    board,
    hands,
    turn,
    phase: isOver(turn) ? "finished" : "playing",
    log,
  };
}

/** パスして次の人へ。置けるカードがあるときは state をそのまま返す。 */
export function passTurn(state: ShichinarabeState, playerId: PlayerId): ShichinarabeState {
  if (state.phase !== "playing") return state;
  if (state.turn.currentId !== playerId) return state;

  const hand = state.hands[playerId] ?? [];
  if (legalMoves(state.board, hand).length > 0) return state;

  const used = state.passes[playerId] ?? 0;
  if (used >= MAX_PASSES) {
    return dropOut(state, playerId);
  }

  const player = findPlayer(state.turn.players, playerId);
  const name = player?.name ?? playerId;
  const passes = { ...state.passes, [playerId]: used + 1 };
  const turn = nextTurn(state.turn);

  return {
    ...state,
    passes,
    turn,
    log: [`${name}がパスしました（残り${MAX_PASSES - used - 1}回）`, ...state.log],
  };
}

/** 脱落。手札を全部（飛び地も）場に置き、手番から外す。 */
export function dropOut(state: ShichinarabeState, playerId: PlayerId): ShichinarabeState {
  if (state.phase !== "playing") return state;
  if (isFinished(state.turn, playerId) || state.droppedIds.includes(playerId)) return state;

  const hand = state.hands[playerId] ?? [];
  const board = hand.reduce((current, card) => placeOnBoard(current, card), state.board);
  const hands = { ...state.hands, [playerId]: [] };
  const turn = finishPlayer(state.turn, playerId);
  const droppedIds = [...state.droppedIds, playerId];
  const player = findPlayer(state.turn.players, playerId);
  const name = player?.name ?? playerId;

  return {
    ...state,
    board,
    hands,
    turn,
    droppedIds,
    phase: isOver(turn) ? "finished" : "playing",
    log: [`${name}が脱落しました`, ...state.log],
  };
}

/** 順位表。上がった順 → 残った人 → 脱落した人（脱落が早い人ほど下）。 */
export function getRanking(state: ShichinarabeState): Ranking {
  const finishedOrder = state.turn.finishedIds.filter((id) => !state.droppedIds.includes(id));
  const remaining = state.turn.players
    .map((player) => player.id)
    .filter((id) => !state.turn.finishedIds.includes(id));
  const droppedOrder = [...state.droppedIds].reverse();
  const orderedIds = [...finishedOrder, ...remaining, ...droppedOrder];
  return rankByFinishOrder(orderedIds, state.turn.players);
}

/** CPU の手番を決めるための seed。盤面と経過だけから決定的に作る。 */
function cpuTickSeed(state: ShichinarabeState): string {
  const placed = SUITS.reduce(
    (sum, suit) => sum + state.board[suit].filter(Boolean).length,
    0,
  );
  const passSum = Object.values(state.passes).reduce((sum, value) => sum + value, 0);
  return `${state.seed}:${placed}:${passSum}:${state.droppedIds.length}`;
}

/**
 * 「今、何ミリ秒後に自動で次へ進めるべきか」を返す。
 * null は「人間の入力待ち」。CPU の手番のときだけ待ち時間を返す。
 */
export function pendingDelayMs(state: ShichinarabeState): number | null {
  if (state.phase === "finished") return null;
  if (state.turn.currentId === HUMAN_ID) return null;
  return CPU_DELAY_MS;
}

/** 人間の手番でのカード指定を、実際のカードに解決してから置く。 */
function applyHumanPlace(state: ShichinarabeState, cardId: CardId): ShichinarabeState {
  if (state.phase !== "playing" || state.turn.currentId !== HUMAN_ID) return state;
  const card = (state.hands[HUMAN_ID] ?? []).find((item) => item.id === cardId);
  if (!card) return state;
  return place(state, HUMAN_ID, card);
}

/** CPU の手番を1回進める。置けるカードがあれば置き、無ければパスする。 */
function applyCpuTick(state: ShichinarabeState): ShichinarabeState {
  if (state.phase !== "playing") return state;
  const currentId = state.turn.currentId;
  if (currentId === HUMAN_ID) return state;

  const hand = state.hands[currentId] ?? [];
  const moves = legalMoves(state.board, hand);
  const rng = createRng(cpuTickSeed(state));
  const chosen = chooseCard(moves, rng);
  return chosen ? place(state, currentId, chosen) : passTurn(state, currentId);
}

/** 状態 + 行動 -> 新しい状態。ルールはすべてここに集まる。 */
export function reduce(state: ShichinarabeState, action: ShichinarabeAction): ShichinarabeState {
  switch (action.type) {
    case "place":
      return applyHumanPlace(state, action.cardId);
    case "pass":
      if (state.phase !== "playing" || state.turn.currentId !== HUMAN_ID) return state;
      return passTurn(state, HUMAN_ID);
    case "tick":
      return applyCpuTick(state);
    case "reset":
      return createInitialState(action.seed ?? state.seed + 1);
    default:
      return state;
  }
}

/** ゲームが終わったかどうか。 */
export function isGameOver(state: ShichinarabeState): boolean {
  return state.phase === "finished";
}
