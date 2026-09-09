import {
  createDeck,
  createRng,
  shuffle,
  deal,
  createRankStrength,
  groupByRank,
  sameRank,
  sortCards,
  createSoloVsCpu,
  createTurnState,
  nextTurn,
  finishPlayer,
  alivePlayers,
  isOver,
} from "@core";
import type { PlayerId, PlayingCard, TurnState } from "@core";
import { pickPlay } from "./cpu";

/** 大富豪の強さの並び。3 が最弱・2 が最強。 */
export const DAIFUGO_RANK_ORDER = [
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
  "2",
] as const;

/** CPU が1手を出すまでの待ち時間。 */
export const CPU_INTERVAL_MS = 900;

/** 上がり順に対応する称号。 */
export const TITLES = ["大富豪", "富豪", "貧民", "大貧民"] as const;
export type Title = (typeof TITLES)[number];

const rankStr = createRankStrength(DAIFUGO_RANK_ORDER);

export type Phase = "playing" | "finished";

/** 場に出ている組。null なら場は空。 */
export type Field = {
  readonly cards: readonly PlayingCard[];
  readonly count: number;
  readonly ownerId: PlayerId;
} | null;

export type DaifugoState = {
  readonly hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>;
  readonly field: Field;
  readonly turn: TurnState;
  readonly isRevolution: boolean;
  readonly passedIds: readonly PlayerId[];
  readonly phase: Phase;
  readonly log: readonly string[];
  readonly seed: number;
};

export type DaifugoAction =
  | { readonly type: "play"; readonly cardIds: readonly string[] }
  | { readonly type: "pass" }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };

function playerLabel(id: PlayerId): string {
  if (id === "you") return "あなた";
  return `CPU ${id.replace("cpu-", "")}`;
}

export function createInitialState(seed?: number): DaifugoState {
  const rng = createRng(seed);
  const deck = shuffle(createDeck(), rng);
  const players = createSoloVsCpu(3);
  const { hands: dealt } = deal(deck, 4, 13);

  const hands: Record<PlayerId, readonly PlayingCard[]> = {};
  players.forEach((p, i) => {
    hands[p.id] = sortCards(dealt[i], { order: DAIFUGO_RANK_ORDER });
  });

  const startPlayer = players.find(p =>
    hands[p.id].some(c => c.id === "diamonds-3"),
  );
  const startId = startPlayer?.id ?? players[0].id;
  const turn = createTurnState(players, { startId });

  return {
    hands,
    field: null,
    turn,
    isRevolution: false,
    passedIds: [],
    phase: "playing",
    log: [],
    seed: seed ?? 1,
  };
}

/** その組を場に出せるか。枚数一致・同一ランク・強さの3条件を見る。 */
export function isLegalPlay(
  play: readonly PlayingCard[],
  field: Field,
  isRevolution: boolean,
): boolean {
  if (play.length === 0) return false;
  if (!play.every(c => sameRank(c, play[0]))) return false;

  if (field === null) {
    return play.length >= 1 && play.length <= 4;
  }

  if (play.length !== field.count) return false;

  const pStr = rankStr(play[0].rank);
  const fStr = rankStr(field.cards[0].rank);
  return isRevolution ? pStr < fStr : pStr > fStr;
}

/**
 * 手札から出せる組を列挙する。
 * groupByRank で同ランクにまとめ、各グループから必要枚数を1通りだけ取る。
 */
export function getLegalPlays(
  hand: readonly PlayingCard[],
  field: Field,
  isRevolution: boolean,
): PlayingCard[][] {
  const result: PlayingCard[][] = [];
  for (const [, cards] of groupByRank(hand)) {
    if (field === null) {
      result.push([...cards]);
    } else if (cards.length >= field.count) {
      const candidate = cards.slice(0, field.count);
      if (isLegalPlay(candidate, field, isRevolution)) {
        result.push(candidate);
      }
    }
  }
  return result;
}

/** 組を出した後の状態。8切り・革命・上がりの判定もここで行う。 */
export function applyPlay(
  state: DaifugoState,
  play: readonly PlayingCard[],
): DaifugoState {
  const id = state.turn.currentId;
  const name = playerLabel(id);
  const playIds = new Set(play.map(c => c.id));

  const newHand = state.hands[id].filter(c => !playIds.has(c.id));
  const newHands = { ...state.hands, [id]: newHand };

  let newLog: readonly string[] = [
    `${name} が ${play[0].rank} を ${play.length}枚出しました`,
    ...state.log,
  ];

  const didWin = newHand.length === 0;
  let turn = state.turn;
  if (didWin) {
    turn = finishPlayer(turn, id);
    newLog = [`${name} があがりました`, ...newLog];
  }

  const has8 = play.some(c => c.rank === "8");
  const is4ofAKind = play.length === 4;

  let newIsRevolution = state.isRevolution;
  if (is4ofAKind) {
    newIsRevolution = !state.isRevolution;
    newLog = [newIsRevolution ? "革命！" : "革命返し！", ...newLog];
  }

  let newField: Field;
  let newTurn: TurnState;

  if (has8) {
    newLog = ["8切り！場が流れます", ...newLog];
    newField = null;
    // 同じプレイヤーがもう一度出す（上がっていれば finishPlayer が既に次へ進めている）
    newTurn = turn;
  } else {
    newField = { cards: play, count: play.length, ownerId: id };
    newTurn = didWin ? turn : nextTurn(turn);
  }

  return {
    ...state,
    hands: newHands,
    field: newField,
    turn: newTurn,
    isRevolution: newIsRevolution,
    passedIds: [],
    phase: isOver(newTurn) ? "finished" : "playing",
    log: newLog,
  };
}

/** パスする。出した人以外の全員がパスしていたら場を流す。 */
export function passTurn(state: DaifugoState): DaifugoState {
  const id = state.turn.currentId;
  const newPassedIds = [...state.passedIds, id];
  const newLog: readonly string[] = [`${playerLabel(id)} がパスしました`, ...state.log];

  if (state.field !== null) {
    const aliveIds = alivePlayers(state.turn).map(p => p.id);
    const nonOwner = aliveIds.filter(i => i !== state.field!.ownerId);
    if (nonOwner.every(i => newPassedIds.includes(i))) {
      return {
        ...state,
        field: null,
        turn: nextTurn(state.turn),
        passedIds: [],
        log: ["場が流れました", ...newLog],
      };
    }
  }

  return {
    ...state,
    turn: nextTurn(state.turn),
    passedIds: newPassedIds,
    log: newLog,
  };
}

/** 今、何ミリ秒後に自動で次へ進めるべきか。null は人間の入力待ち。 */
export function pendingDelayMs(state: DaifugoState): number | null {
  if (state.phase === "finished") return null;
  return state.turn.currentId !== "you" ? CPU_INTERVAL_MS : null;
}

export function isGameOver(state: DaifugoState): boolean {
  return state.phase === "finished";
}

export function reduce(state: DaifugoState, action: DaifugoAction): DaifugoState {
  switch (action.type) {
    case "play": {
      if (state.phase !== "playing" || state.turn.currentId !== "you") return state;
      const play = action.cardIds
        .map(id => state.hands["you"].find(c => c.id === id))
        .filter((c): c is PlayingCard => c !== undefined);
      if (!isLegalPlay(play, state.field, state.isRevolution)) return state;
      return applyPlay(state, play);
    }
    case "pass": {
      if (state.phase !== "playing" || state.turn.currentId !== "you") return state;
      return passTurn(state);
    }
    case "tick": {
      if (state.phase !== "playing" || state.turn.currentId === "you") return state;
      const currentId = state.turn.currentId;
      const legal = getLegalPlays(state.hands[currentId], state.field, state.isRevolution);
      const rng = createRng(state.seed);
      const play = pickPlay(legal, rng);
      if (!play) return passTurn(state);
      return applyPlay(state, play);
    }
    case "reset":
      return createInitialState(action.seed);
    default:
      return state;
  }
}
