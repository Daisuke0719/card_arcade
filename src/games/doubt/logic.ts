import {
  createDeck,
  createRng,
  createSoloVsCpu,
  createTurnState,
  cycleRank,
  deal,
  finishPlayer,
  isFinished,
  isOver,
  neighborId,
  nextTurn,
  rankByFinishOrder,
  shuffle,
} from "@core";
import type { Player, PlayerId, PlayingCard, Rank, Ranking, Rng, TurnState } from "@core";
import { choosePlay, shouldDoubt } from "./cpu";

export const REVEAL_DELAY_MS = 1200;
export const CPU_THINK_MS = 900;
export const MAX_PLAY_CARDS = 4;
export const HUMAN_ID: PlayerId = "you";

export type Phase = "playing" | "doubt-decision" | "revealing" | "finished";
export type Play = {
  readonly playerId: PlayerId;
  readonly declaredRank: Rank;
  readonly cards: readonly PlayingCard[];
};
export type DoubtState = {
  readonly turn: TurnState;
  readonly hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>;
  readonly pile: readonly PlayingCard[];
  readonly declaredRank: Rank;
  readonly lastPlay: Play | null;
  readonly deciderId: PlayerId | null;
  readonly doubterId: PlayerId | null;
  readonly takerId: PlayerId | null;
  readonly phase: Phase;
  readonly log: readonly string[];
  readonly seed: number;
  readonly actionCount: number;
};
export type DoubtAction =
  | { readonly type: "play"; readonly cardIds: readonly string[] }
  | { readonly type: "doubt" }
  | { readonly type: "pass" }
  | { readonly type: "tick" }
  | { readonly type: "reset"; readonly seed?: number };
export type PublicPlayer = {
  readonly id: PlayerId;
  readonly name: string;
  readonly cardCount: number;
  readonly isYou: boolean;
  /** 上がった順位（1始まり）。まだ上がっていなければ null。 */
  readonly finishOrder: number | null;
};
/** 直前に出された組。中身のカードは公開しない。 */
export type PublicPlay = {
  readonly playerId: PlayerId;
  readonly declaredRank: Rank;
  readonly count: number;
};
/** ダウトで公開された直前の組。revealing の間だけ公開する。 */
export type PublicReveal = {
  readonly doubterId: PlayerId | null;
  readonly takerId: PlayerId | null;
  readonly cards: readonly PlayingCard[];
};
/** 盤面に渡す公開状態。CPU版とオンライン版で同じ形を使う。 */
export type DoubtView = {
  readonly myHand: readonly PlayingCard[];
  /** 席順。閲覧者本人も含む。 */
  readonly players: readonly PublicPlayer[];
  readonly declaredRank: Rank;
  readonly pileCount: number;
  readonly phase: Phase;
  /** いま操作する人。ダウトの判断中は判断する人、それ以外は手番の人。 */
  readonly actorId: PlayerId;
  readonly lastPlay: PublicPlay | null;
  readonly reveal: PublicReveal | null;
  readonly log: readonly string[];
};

function isCpu(state: DoubtState, id: PlayerId): boolean {
  return state.turn.players.find((player) => player.id === id)?.kind === "cpu";
}

/** 進行ログに書くプレイヤー名。見つからなければ ID をそのまま使う。 */
function playerName(turn: TurnState, id: PlayerId): string {
  return turn.players.find((player) => player.id === id)?.name ?? id;
}

/**
 * 次にダウトを聞く人。出した人の左隣から一人ずつ進み、一周したら undefined を返す。
 * 出した人を起点にした並びで数えるため、同じ人に二度聞くことはない。
 */
function nextDoubter(state: DoubtState, fromId: PlayerId): PlayerId | undefined {
  const players = state.turn.players;
  const playedId = state.lastPlay?.playerId;
  if (playedId === undefined) return undefined;
  const origin = players.findIndex((player) => player.id === playedId);
  const from = players.findIndex((player) => player.id === fromId);
  if (origin < 0 || from < 0) return undefined;
  const asked = (from - origin + players.length) % players.length;
  for (let step = asked + 1; step < players.length; step += 1) {
    const player = players[(origin + step) % players.length];
    if (!isFinished(state.turn, player.id)) return player.id;
  }
  return undefined;
}

function addLog(state: DoubtState, message: string): readonly string[] {
  return [message, ...state.log].slice(0, 30);
}

function closeNoDoubt(state: DoubtState): DoubtState {
  const actor = state.lastPlay?.playerId;
  if (!actor) return state;
  let turn = state.turn;
  if (state.hands[actor].length === 0) turn = finishPlayer(turn, actor);
  else turn = nextTurn(turn);
  const ended = isOver(turn);
  return {
    ...state,
    turn,
    declaredRank: nextDeclaredRank(state.declaredRank),
    lastPlay: null,
    deciderId: null,
    phase: ended ? "finished" : "playing",
    log: state.hands[actor].length === 0
      ? addLog(state, `${playerName(turn, actor)} が上がりました`)
      : state.log,
  };
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

/** CPU対戦の初期状態。あなたと CPU3人に13枚ずつ配る。 */
export function createInitialState(seed: number = 1): DoubtState {
  return createStateForPlayers(seed, createSoloVsCpu(3));
}

/**
 * 参加者を指定して初期状態を作る。52枚を参加者全員に配り切り、先頭の人から始める。
 * 人数が 2〜4 人でない、または ID が重複しているときは例外にする。
 */
export function createStateForPlayers(seed: number, players: readonly Player[]): DoubtState {
  const ids = new Set(players.map((player) => player.id));
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS || ids.size !== players.length) {
    throw new Error(`${MIN_PLAYERS}〜${MAX_PLAYERS}人の異なるプレイヤーが必要です`);
  }
  const deck = shuffle(createDeck(), createRng(seed));
  const { hands: dealt } = deal(deck, players.length);
  const hands = Object.fromEntries(players.map((player, i) => [player.id, dealt[i] ?? []])) as Record<PlayerId, readonly PlayingCard[]>;
  return {
    turn: createTurnState(players), hands, pile: [], declaredRank: "A", lastPlay: null,
    deciderId: null, doubterId: null, takerId: null, phase: "playing", log: [], seed, actionCount: 0,
  };
}

export function isBluff(cards: readonly PlayingCard[], declaredRank: Rank): boolean {
  return cards.some((card) => card.rank !== declaredRank);
}

export function nextDeclaredRank(rank: Rank): Rank {
  return cycleRank(rank, 1);
}

/** いま申し出られたダウトを受け付けてよいかを判断する。 */
function canResolveDoubt(state: DoubtState, doubterId: PlayerId): boolean {
  if (state.phase !== "doubt-decision" || !state.lastPlay || !state.deciderId) return false;
  if (doubterId !== state.deciderId || isFinished(state.turn, doubterId)) return false;
  return doubterId !== state.lastPlay.playerId;
}

/** 引き取りが終わった時点で手札が0枚の人を、渡された順に上がりにする。 */
function finishEmptyHands(
  turn: TurnState,
  hands: Readonly<Record<PlayerId, readonly PlayingCard[]>>,
  ids: readonly PlayerId[],
): TurnState {
  return ids.reduce(
    (current, id) => (hands[id].length === 0 ? finishPlayer(current, id) : current),
    turn,
  );
}

/** ダウトの決着を進行ログの文言にする。 */
function doubtLogs(
  state: DoubtState,
  result: { hit: boolean; takerId: PlayerId; playedId: PlayerId; playedOut: boolean },
): readonly string[] {
  const outcome = result.hit ? "ダウト成功" : "ダウト失敗";
  const taker = playerName(state.turn, result.takerId);
  const logs = [`${outcome}。${taker} が場札 ${state.pile.length} 枚を引き取りました`, ...state.log];
  if (result.playedOut) logs.unshift(`${playerName(state.turn, result.playedId)} が上がりました`);
  return logs.slice(0, 30);
}

export function resolveDoubt(state: DoubtState, doubterId: PlayerId): DoubtState {
  const play = state.lastPlay;
  if (!play || !canResolveDoubt(state, doubterId)) return state;
  const hit = isBluff(play.cards, play.declaredRank);
  const takerId = hit ? play.playerId : doubterId;
  const hands = { ...state.hands, [takerId]: [...state.hands[takerId], ...state.pile] };
  const playedOut = hands[play.playerId].length === 0;
  const turn = finishEmptyHands({ ...state.turn, currentId: takerId }, hands, [play.playerId, takerId]);
  return {
    ...state, hands, turn, pile: [], declaredRank: "A", deciderId: null,
    doubterId, takerId, phase: "revealing",
    log: doubtLogs(state, { hit, takerId, playedId: play.playerId, playedOut }),
  };
}

/**
 * viewerId から見た公開状態を作る。
 * 他の人の手札と場札の中身は含めず、直前の組のカードはダウトで公開されている間だけ含める。
 */
export function toPublicState(state: DoubtState, viewerId: PlayerId): DoubtView {
  const play = state.lastPlay;
  return {
    myHand: state.hands[viewerId] ?? [],
    players: state.turn.players.map((player) => {
      const finishedIndex = state.turn.finishedIds.indexOf(player.id);
      return {
        id: player.id, name: player.name, cardCount: state.hands[player.id]?.length ?? 0,
        isYou: player.id === viewerId, finishOrder: finishedIndex >= 0 ? finishedIndex + 1 : null,
      };
    }),
    declaredRank: state.declaredRank,
    pileCount: state.pile.length,
    phase: state.phase,
    actorId: state.phase === "doubt-decision" ? (state.deciderId ?? "") : state.turn.currentId,
    lastPlay: play ? { playerId: play.playerId, declaredRank: play.declaredRank, count: play.cards.length } : null,
    reveal: state.phase === "revealing" && play
      ? { doubterId: state.doubterId, takerId: state.takerId, cards: play.cards }
      : null,
    log: state.log,
  };
}

export function pendingDelayMs(state: DoubtState): number | null {
  if (state.phase === "finished") return null;
  if (state.phase === "revealing") return REVEAL_DELAY_MS;
  const actor = state.phase === "doubt-decision" ? state.deciderId : state.turn.currentId;
  return actor && isCpu(state, actor) ? CPU_THINK_MS : null;
}

function startPlay(state: DoubtState, playerId: PlayerId, cardIds: readonly string[]): DoubtState {
  if (state.phase !== "playing" || playerId !== state.turn.currentId) return state;
  const hand = state.hands[playerId] ?? [];
  if (playProblem(hand, cardIds) !== null) return state;
  const ids = [...cardIds];
  const played = ids.map((id) => hand.find((card) => card.id === id)) as PlayingCard[];
  const remaining = hand.filter((card) => !ids.includes(card.id));
  const hands = { ...state.hands, [playerId]: remaining };
  const lastPlay = { playerId, declaredRank: state.declaredRank, cards: played };
  const next = {
    ...state, hands, pile: [...state.pile, ...played], lastPlay,
    phase: "doubt-decision" as const, deciderId: "" as PlayerId,
    actionCount: state.actionCount + 1,
    log: addLog(state, `${playerName(state.turn, playerId)} が${state.declaredRank}を ${played.length} 枚出しました`),
  };
  const deciderId = nextDoubter(next, playerId);
  if (!deciderId) return closeNoDoubt({ ...next, phase: "playing", deciderId: null });
  return { ...next, deciderId };
}

function declineDoubt(state: DoubtState): DoubtState {
  if (state.phase !== "doubt-decision" || !state.deciderId || !state.lastPlay) return state;
  const name = playerName(state.turn, state.deciderId);
  const updated = { ...state, log: addLog(state, `${name} はダウトを見送りました`), actionCount: state.actionCount + 1 };
  const next = nextDoubter(updated, state.deciderId);
  if (next) return { ...updated, deciderId: next };
  return closeNoDoubt({ ...updated, phase: "playing", deciderId: null });
}

export function getRanking(state: DoubtState): Ranking {
  return rankByFinishOrder(state.turn.finishedIds, state.turn.players);
}

/** 人間がボタンで指示できる操作。 */
export type PlayerAction = Exclude<DoubtAction, { type: "reset" } | { type: "tick" }>;

/**
 * playerId の人の操作を処理する。手番でないときやダウトを聞かれていないときは何も変えない。
 * CPU対戦ではあなた、オンライン対戦では操作した参加者を渡す。
 */
export function applyPlayerAction(state: DoubtState, playerId: PlayerId, action: PlayerAction): DoubtState {
  if (state.phase === "finished") return state;
  if (action.type === "play") {
    return state.turn.currentId === playerId ? startPlay(state, playerId, action.cardIds) : state;
  }
  if (state.phase !== "doubt-decision" || state.deciderId !== playerId) return state;
  return action.type === "doubt" ? resolveDoubt(state, playerId) : declineDoubt(state);
}

/** ダウトの結果を見せ終えたら次へ進める。公開中でなければ何も変えない。 */
export function finishRevealIfDone(state: DoubtState): DoubtState {
  return state.phase === "revealing" ? finishReveal(state) : state;
}

/**
 * 出そうとしているカードが合法かを調べる。問題があれば理由を、なければ null を返す。
 * 手番や場面の確認は含めない。
 */
export function playProblem(hand: readonly PlayingCard[], cardIds: readonly string[]): string | null {
  if (cardIds.length < 1 || cardIds.length > MAX_PLAY_CARDS) return `1〜${MAX_PLAY_CARDS}枚を選んでください`;
  if (new Set(cardIds).size !== cardIds.length) return "同じカードを重ねて選べません";
  if (cardIds.some((id) => !hand.some((card) => card.id === id))) return "手札にないカードは出せません";
  return null;
}

/** 公開の演出を終え、引き取った人の次の人から再開する。 */
function finishReveal(state: DoubtState): DoubtState {
  const ended = isOver(state.turn);
  return {
    ...state, turn: nextTurn(state.turn), lastPlay: null, doubterId: null, takerId: null,
    phase: ended ? "finished" : "playing",
  };
}

/** CPU の手番。cpu.ts が選んだカードをそのまま裏向きに出す。 */
function playCpuTurn(state: DoubtState): DoubtState {
  const rng = createRng(state.seed + state.actionCount * 997);
  const chosen = choosePlay(state.hands[state.turn.currentId], state.declaredRank, rng);
  return startPlay(state, state.turn.currentId, chosen.map((card) => card.id));
}

/** CPU がダウトするかどうかを決める。 */
function decideCpuDoubt(state: DoubtState, deciderId: PlayerId): DoubtState {
  const rng = createRng(state.seed + state.actionCount * 997 + 13);
  const hand = state.hands[deciderId] ?? [];
  const playedCount = state.lastPlay?.cards.length ?? 0;
  return shouldDoubt(hand, state.declaredRank, playedCount, state.pile.length, rng)
    ? resolveDoubt(state, deciderId)
    : declineDoubt(state);
}

/** 自動で進む場面（公開の演出、CPU の手番、CPU のダウト判断）を1段階だけ進める。 */
function reduceTick(state: DoubtState): DoubtState {
  if (state.phase === "revealing") return finishReveal(state);
  if (state.phase === "playing" && isCpu(state, state.turn.currentId)) return playCpuTurn(state);
  if (state.phase === "doubt-decision" && state.deciderId && isCpu(state, state.deciderId)) {
    return decideCpuDoubt(state, state.deciderId);
  }
  return state;
}

export function reduce(state: DoubtState, action: DoubtAction): DoubtState {
  if (action.type === "reset") return createInitialState(action.seed ?? state.seed + 1);
  if (state.phase === "finished") return state;
  if (action.type === "tick") return reduceTick(state);
  return applyPlayerAction(state, HUMAN_ID, action);
}

export function isGameOver(state: DoubtState): boolean {
  return state.phase === "finished";
}

export function isPlayerFinished(state: DoubtState, id: PlayerId): boolean {
  return isFinished(state.turn, id);
}

export function currentPlayerName(state: DoubtState, id: PlayerId): string {
  return state.turn.players.find((player) => player.id === id)?.name ?? id;
}

export function getNextAliveId(turn: TurnState): PlayerId | undefined {
  return neighborId(turn, 1);
}

export type { Rng };
