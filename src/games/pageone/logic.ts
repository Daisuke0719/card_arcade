/**
 * ページワン のルール。
 *
 * このファイルには「純粋な処理」だけを書く。
 *   - react を import しない
 *   - Math.random() / Date.now() / setTimeout を使わない
 *   - 乱数は state.seed から作る（同じ盤面なら必ず同じ結果になる）
 *
 * 待ち時間は pendingDelayMs が「何ms後か」を返すだけで、待つのは画面側の useCpuTurn。
 * そのおかげでテストは reduce を順番に呼ぶだけで書ける。
 */
import {
  cardShortLabel,
  createDeck,
  createRng,
  createSoloVsCpu,
  createTurnState,
  deal,
  draw,
  findPlayer,
  last,
  nextTurn,
  rankByScore,
  requireCard,
  sameRank,
  sameSuit,
  shuffle,
} from "@core";
import type { CardId, PlayerId, PlayingCard, Ranking, TurnState } from "@core";
import { chooseCard } from "./cpu";

/** CPU が1手を指すまでの待ち時間。UI はこの値を参照するだけ。 */
export const CPU_DELAY_MS = 800;

/** 1人に配る枚数。 */
export const HAND_SIZE = 5;

/** あなた + CPU 3人の4人固定。 */
const CPU_COUNT = 3;

/** 人間のプレイヤーID（createSoloVsCpu が付ける値）。 */
const HUMAN_ID: PlayerId = "you";

export type Phase = "playing" | "finished";

export type PageOneState = {
  /** 山札。先頭から引く。 */
  readonly deck: readonly PlayingCard[];
  /** 場札。出された順に積まれ、末尾が一番上。山札切れのときは末尾以外を混ぜて戻す。 */
  readonly field: readonly PlayingCard[];
  /** プレイヤーIDごとの手札。id は "you" / "cpu-1" / "cpu-2" / "cpu-3"。 */
  readonly hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>;
  /** 手番は @core の TurnState に持たせる（自作しない）。 */
  readonly turn: TurnState;
  readonly phase: Phase;
  /** 上がった人。1人入った時点で終了する。 */
  readonly winnerId: PlayerId | null;
  /** LogPanel に渡す進行ログ（新しいものが先頭）。 */
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

/** ログに出す名前。見つからなければ ID をそのまま使う。 */
function nameOf(state: PageOneState, playerId: PlayerId): string {
  return findPlayer(state.turn.players, playerId)?.name ?? playerId;
}

/** 新しいログを先頭に足す。 */
function withLog(state: PageOneState, line: string): PageOneState {
  return { ...state, log: [line, ...state.log] };
}

/** 最初の状態。5枚ずつ配り、山札から1枚めくって場札にする。 */
export function createInitialState(seed: number = 1): PageOneState {
  const players = createSoloVsCpu(CPU_COUNT);
  const shuffled = shuffle(createDeck(), createRng(seed));
  const { hands: dealt, rest } = deal(shuffled, players.length, HAND_SIZE);
  const { card: opening, rest: deck } = draw(rest);

  const hands: Record<PlayerId, readonly PlayingCard[]> = {};
  players.forEach((player, index) => {
    hands[player.id] = dealt[index] ?? [];
  });

  return {
    deck,
    // 最初にめくった1枚が 8 や A でも効果は発動しない（誰も出していないため）
    field: [requireCard(opening, "場札にする1枚が山札にありません")],
    hands,
    turn: createTurnState(players),
    phase: "playing",
    winnerId: null,
    log: [],
    drawCount: 0,
    seed,
  };
}

/** 場札の一番上。 */
export function fieldTop(state: PageOneState): PlayingCard {
  return requireCard(last(state.field), "場札が空になっています");
}

/** その1枚を今の場札に出せるか。同じマークか同じ数字なら true。 */
export function canPlay(card: PlayingCard, field: PlayingCard): boolean {
  return sameSuit(card, field) || sameRank(card, field);
}

/** 手札のうち今出せるカードだけを返す。これが0枚のときだけ山札を引ける。 */
export function legalMoves(
  hand: readonly PlayingCard[],
  field: PlayingCard,
): PlayingCard[] {
  return hand.filter((card) => canPlay(card, field));
}

/**
 * そのカードを出したあと、手番を何人分進めるか。
 *
 * 8 と A を「特殊カードごとの分岐」ではなく「進める人数の違い」として扱う。
 * 特殊カードの知識がこの1関数に閉じるので、applyPlay の形は増えない。
 */
function stepsOf(card: PlayingCard): number {
  if (card.rank === "8") return 2; // 次の人を1回飛ばす
  if (card.rank === "A") return 0; // 同じ人がもう1枚出せる
  return 1;
}

/** 手番を steps 人分進める。0 なら進めない（A）、2 なら1人飛ばす（8）。 */
export function advanceTurn(state: PageOneState, steps: number): PageOneState {
  let turn = state.turn;
  for (let count = 0; count < steps; count += 1) turn = nextTurn(turn);
  return turn === state.turn ? state : { ...state, turn };
}

/** 1枚出す。出せないカードや手番でない人を渡されたら state をそのまま返す。 */
export function applyPlay(
  state: PageOneState,
  playerId: PlayerId,
  card: PlayingCard,
): PageOneState {
  if (state.phase !== "playing") return state;
  if (state.turn.currentId !== playerId) return state;

  const hand = state.hands[playerId] ?? [];
  if (!hand.some((item) => item.id === card.id)) return state;
  if (!canPlay(card, fieldTop(state))) return state;

  const rest = hand.filter((item) => item.id !== card.id);
  const played = withLog(
    {
      ...state,
      hands: { ...state.hands, [playerId]: rest },
      field: [...state.field, card],
    },
    nameOf(state, playerId) + " が " + cardShortLabel(card) + " を出しました",
  );

  // 最後の1枚が 8 や A でも、効果より上がりが優先される
  if (rest.length === 0) {
    return withLog(
      { ...played, phase: "finished", winnerId: playerId },
      nameOf(state, playerId) + " が上がりました",
    );
  }

  return advanceTurn(played, stepsOf(card));
}

/**
 * 山札が空なら、場札の一番上だけを残して残りを混ぜ、山札に戻す。
 * 場札が1枚しかないときは混ぜられないので、そのまま返す。
 */
function refillDeck(state: PageOneState): PageOneState {
  if (state.deck.length > 0) return state;
  if (state.field.length <= 1) return state;

  const top = fieldTop(state);
  const buried = state.field.slice(0, -1);

  return withLog(
    {
      ...state,
      deck: shuffle(buried, createRng(state.seed + state.drawCount)),
      field: [top],
    },
    "場札を混ぜて山札に戻しました",
  );
}

/** 山札から1枚引いて手札に加える。山札が空なら場札を混ぜ直してから引く。 */
export function drawFromDeck(state: PageOneState, playerId: PlayerId): PageOneState {
  if (state.phase !== "playing") return state;
  if (state.turn.currentId !== playerId) return state;

  const hand = state.hands[playerId] ?? [];
  // 出せるカードが1枚でもあるときは引けない
  if (legalMoves(hand, fieldTop(state)).length > 0) return state;

  const refilled = refillDeck(state);
  const { card: drawn, rest } = draw(refilled.deck);

  // 山札も場札の残りも無い。引けるカードが無いので手番だけを渡す
  if (!drawn) {
    return advanceTurn(
      withLog(refilled, nameOf(refilled, playerId) + " は引けるカードがありません"),
      1,
    );
  }

  const taken = withLog(
    {
      ...refilled,
      deck: rest,
      hands: { ...refilled.hands, [playerId]: [...hand, drawn] },
      drawCount: refilled.drawCount + 1,
    },
    nameOf(refilled, playerId) + " が山札から1枚引きました",
  );

  // 引いたカードが出せるときは、その場で出す（手札に残す選択はない）
  if (canPlay(drawn, fieldTop(taken))) return applyPlay(taken, playerId, drawn);

  return advanceTurn(taken, 1);
}

/** CPU の1手。出せる候補があれば出し、無ければ引く。 */
function applyCpuTurn(state: PageOneState): PageOneState {
  if (state.phase !== "playing") return state;

  const playerId = state.turn.currentId;
  if (playerId === HUMAN_ID) return state;

  const hand = state.hands[playerId] ?? [];
  const moves = legalMoves(hand, fieldTop(state));
  // 乱数は状態から決まる。同じ盤面なら同じ手になり、テストが安定する
  const rng = createRng(state.seed + state.drawCount + state.log.length);
  const chosen = chooseCard(moves, rng);

  return chosen ? applyPlay(state, playerId, chosen) : drawFromDeck(state, playerId);
}

/** 順位。1位は上がった人、2位以下は手札の枚数が少ない順（同数は同順位）。 */
export function getRanking(state: PageOneState): Ranking {
  const entries = state.turn.players.map((player) => ({
    id: player.id,
    name: player.name,
    score: (state.hands[player.id] ?? []).length,
  }));

  return rankByScore(entries, "lower-is-better");
}

/** 状態 + 行動 -> 新しい状態。ルールはすべてここに集める。 */
export function reduce(state: PageOneState, action: PageOneAction): PageOneState {
  switch (action.type) {
    case "play": {
      // 画面から届くのは「あなた」の操作だけ。手番の判定は applyPlay が行う
      const card = (state.hands[HUMAN_ID] ?? []).find((item) => item.id === action.cardId);
      if (!card) return state;
      return applyPlay(state, HUMAN_ID, card);
    }
    case "draw":
      return drawFromDeck(state, HUMAN_ID);
    case "tick":
      return applyCpuTurn(state);
    case "reset":
      return createInitialState(action.seed ?? state.seed + 1);
    default:
      return state;
  }
}

/**
 * 今、何ms後に自動処理が要るか。null は人間の入力待ち。
 * 定義はこの3行だけ。迷ったらここに戻る。
 */
export function pendingDelayMs(state: PageOneState): number | null {
  if (state.phase === "finished") return null;
  if (state.turn.currentId === HUMAN_ID) return null;
  return CPU_DELAY_MS;
}

/** ゲームが終わったかどうか。 */
export function isGameOver(state: PageOneState): boolean {
  return state.phase === "finished";
}
