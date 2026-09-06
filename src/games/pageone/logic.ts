/**
 * ページワン のルール。
 *
 * このファイルには「純粋な処理」だけを書きます。
 *   - react を import しない
 *   - Math.random() / Date.now() / setTimeout を使わない
 *   - 乱数が必要なら引数で Rng を受け取る（テストで createRng(seed) を渡せるようにする）
 *
 * 8 と A の効果は「手番を何人分進めるか」の違いとして stepsOf にまとめています。
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
import type { CardId, PlayerId, PlayingCard, Ranking, TurnState } from "@core";
import { chooseCard } from "./cpu";

/** CPU が1手を指すまでの待ち時間。UI はこの値を参照するだけ。 */
export const CPU_DELAY_MS = 800;

/** 1人に配る枚数。 */
export const HAND_SIZE = 5;

/** CPU は3人。プレイヤーと合わせて4人で遊ぶ。 */
export const CPU_COUNT = 3;

/** 人間のプレイヤーID。createSoloVsCpu が付ける既定の id と揃えてある。 */
export const HUMAN_ID: PlayerId = "you";

/** 今どの段階かを表す。画面はこれを見て表示を変える。 */
export type Phase = "playing" | "finished";

export type PageOneState = {
  /** 山札。先頭から引く。 */
  readonly deck: readonly PlayingCard[];
  /** 場札。出された順に積まれ、末尾が一番上。山札切れのときは末尾以外を混ぜて戻す。 */
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

/** 最初の状態。5枚ずつ配り、山札から1枚めくって場札にする。 */
export function createInitialState(seed: number = 1): PageOneState {
  const players = createSoloVsCpu(CPU_COUNT);
  const shuffled = shuffle(createDeck(), createRng(seed));
  const { hands: dealt, rest } = deal(shuffled, players.length, HAND_SIZE);
  const { card, rest: deck } = draw(rest);

  const hands: Record<PlayerId, readonly PlayingCard[]> = {};
  players.forEach((player, index) => {
    hands[player.id] = dealt[index];
  });

  return {
    deck,
    field: [requireCard(card, "山札が足りず、場札をめくれませんでした")],
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
  return requireCard(last(state.field), "場札が1枚もありません");
}

/** その1枚を今の場札に出せるか。同じマークか同じ数字なら true。 */
export function canPlay(card: PlayingCard, field: PlayingCard): boolean {
  return sameSuit(card, field) || sameRank(card, field);
}

/** 手札のうち今出せるカードだけを返す。0件のときだけ山札を引ける。 */
export function legalMoves(hand: readonly PlayingCard[], field: PlayingCard): PlayingCard[] {
  return hand.filter((card) => canPlay(card, field));
}

/** そのカードを出したあと、手番を何人分進めるか。8 なら2、A なら0、それ以外は1。 */
function stepsOf(card: PlayingCard): number {
  if (card.rank === "8") return 2;
  if (card.rank === "A") return 0;
  return 1;
}

function nameOf(state: PageOneState, playerId: PlayerId): string {
  return state.turn.players.find((player) => player.id === playerId)?.name ?? playerId;
}

function isCpuTurn(state: PageOneState): boolean {
  return state.turn.players.some(
    (player) => player.id === state.turn.currentId && player.kind === "cpu",
  );
}

/** 手番を steps 人分進める。0 なら進めない（A）、2 なら1人飛ばす（8）。 */
export function advanceTurn(state: PageOneState, steps: number): PageOneState {
  if (steps <= 0) return state;

  let turn = state.turn;
  for (let step = 0; step < steps; step += 1) {
    turn = nextTurn(turn);
  }
  return { ...state, turn };
}

/** その人がその1枚を今出せるか。手番・所持・場札との一致をまとめて確かめる。 */
function canApplyPlay(state: PageOneState, playerId: PlayerId, card: PlayingCard): boolean {
  if (state.phase !== "playing") return false;
  if (state.turn.currentId !== playerId) return false;
  if (!state.hands[playerId]?.some((held) => held.id === card.id)) return false;
  return canPlay(card, fieldTop(state));
}

/** 1枚出す。出せないカードや手番でない人を渡されたら state をそのまま返す。 */
export function applyPlay(
  state: PageOneState,
  playerId: PlayerId,
  card: PlayingCard,
): PageOneState {
  if (!canApplyPlay(state, playerId, card)) return state;

  const rest = state.hands[playerId].filter((held) => held.id !== card.id);
  const played: PageOneState = {
    ...state,
    hands: { ...state.hands, [playerId]: rest },
    field: [...state.field, card],
    log: [`${nameOf(state, playerId)}が${cardShortLabel(card)}を出しました`, ...state.log],
  };

  // 最後の1枚が8やAでも、上がった時点で終了する（特殊効果は適用しない）。
  if (rest.length === 0) {
    return {
      ...played,
      phase: "finished",
      winnerId: playerId,
      log: [`${nameOf(state, playerId)}が上がりました`, ...played.log],
    };
  }

  return advanceTurn(played, stepsOf(card));
}

/** 山札が空のとき、場札の一番上だけ残して残りを混ぜ、山札に戻す。 */
function refillDeck(state: PageOneState): PageOneState {
  const buried = state.field.slice(0, -1);
  if (buried.length === 0) return state;

  return {
    ...state,
    deck: shuffle(buried, createRng(state.seed + state.drawCount)),
    field: [fieldTop(state)],
    log: ["場札を混ぜて山札に戻しました", ...state.log],
  };
}

/** 山札から1枚引いて手札に加える。山札が空なら場札を混ぜ直してから引く。 */
export function drawFromDeck(state: PageOneState, playerId: PlayerId): PageOneState {
  if (state.phase !== "playing") return state;
  if (state.turn.currentId !== playerId) return state;

  const hand = state.hands[playerId] ?? [];
  // 出せるカードが1枚でもあるときは引けない。
  if (legalMoves(hand, fieldTop(state)).length > 0) return state;

  const refilled = state.deck.length === 0 ? refillDeck(state) : state;
  const { card, rest } = draw(refilled.deck);

  // 場札が1枚しかなく、山札も作れない。引かずに手番を次の人へ移す。
  if (!card) {
    return advanceTurn(
      { ...refilled, log: [`${nameOf(state, playerId)}は引けませんでした`, ...refilled.log] },
      1,
    );
  }

  const drawn: PageOneState = { ...refilled, deck: rest, drawCount: refilled.drawCount + 1 };

  // 引いたカードが出せるなら、その場で場に出す（手札には残さない）。
  if (canPlay(card, fieldTop(drawn))) {
    return advanceTurn(
      {
        ...drawn,
        field: [...drawn.field, card],
        log: [
          `${nameOf(state, playerId)}が引いた${cardShortLabel(card)}をそのまま出しました`,
          ...drawn.log,
        ],
      },
      stepsOf(card),
    );
  }

  return advanceTurn(
    {
      ...drawn,
      hands: { ...drawn.hands, [playerId]: [...hand, card] },
      log: [`${nameOf(state, playerId)}が山札から1枚引きました`, ...drawn.log],
    },
    1,
  );
}

/** 順位。1位は上がった人、2位以下は手札の枚数が少ない順（同数は同順位）。 */
export function getRanking(state: PageOneState): Ranking {
  return rankByScore(
    state.turn.players.map((player) => ({
      id: player.id,
      name: player.name,
      score: (state.hands[player.id] ?? []).length,
    })),
    "lower-is-better",
  );
}

/** CPU の手番を1手だけ進める。 */
function applyCpuTurn(state: PageOneState): PageOneState {
  if (state.phase !== "playing") return state;
  if (!isCpuTurn(state)) return state;

  const cpuId = state.turn.currentId;
  const moves = legalMoves(state.hands[cpuId] ?? [], fieldTop(state));
  const rng = createRng(state.seed + state.drawCount + state.field.length);
  const choice = chooseCard(moves, rng);

  return choice ? applyPlay(state, cpuId, choice) : drawFromDeck(state, cpuId);
}

/** 状態 + 行動 -> 新しい状態。ルールはすべてここに集める。 */
export function reduce(state: PageOneState, action: PageOneAction): PageOneState {
  switch (action.type) {
    case "play": {
      const card = (state.hands[HUMAN_ID] ?? []).find((held) => held.id === action.cardId);
      return card ? applyPlay(state, HUMAN_ID, card) : state;
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

/** 今、何ms後に自動処理が要るか。null は人間の入力待ち。 */
export function pendingDelayMs(state: PageOneState): number | null {
  if (state.phase === "finished") return null;
  return isCpuTurn(state) ? CPU_DELAY_MS : null;
}

export function isGameOver(state: PageOneState): boolean {
  return state.phase === "finished";
}
