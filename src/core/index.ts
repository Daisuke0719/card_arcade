/**
 * @core の公開 API。
 * ゲームからは必ず `import { ... } from "@core"` で使う。
 * ここに無いものは「無い」と考えてよい（探し回らなくてよい）。
 */
export type {
  AnyCard,
  CardId,
  Deck,
  GameComponentProps,
  GameDifficulty,
  GameId,
  GameManifest,
  GameOutcome,
  GamePhase,
  GameResult,
  GameStatus,
  HighScore,
  HighScoreDirection,
  JokerCard,
  Player,
  PlayerId,
  PlayerKind,
  PlayingCard,
  Rank,
  Ranking,
  RankingRow,
  Rng,
  ScoreEntry,
  SessionAction,
  SessionState,
  StorageKey,
  Suit,
  OwnerId,
  TurnState,
} from "./types";

export {
  RANKS,
  RANK_ORDER_ACE_HIGH,
  RANK_ORDER_ACE_LOW,
  SUITS,
  SUIT_COLOR,
  SUIT_NAME_JA,
  SUIT_SYMBOL,
  cardId,
  cardLabel,
  cardShortLabel,
  compareCard,
  compareRank,
  createRankStrength,
  cycleRank,
  groupByRank,
  groupBySuit,
  isJoker,
  isStandard,
  numberToRank,
  partitionJokers,
  rankToNumber,
  sameRank,
  sameSuit,
  sortCards,
} from "./cards";
export type { RankOrder } from "./cards";

export {
  createDeck,
  createDeckWithJokers,
  createJokers,
  deal,
  draw,
  drawMany,
  first,
  last,
  requireCard,
  returnToDeck,
} from "./deck";

export { createRng, hashSeed, mulberry32, pickRandom, pickRandomIndex, shuffle } from "./shuffle";

export {
  alivePlayers,
  createPlayers,
  createSoloVsCpu,
  createTurnState,
  findPlayer,
  finishPlayer,
  isCurrent,
  isFinished,
  isOver,
  neighborId,
  nextTurn,
  reverseDirection,
} from "./players";

export { formatDuration, formatRank, rankByFinishOrder, rankByScore } from "./score";

export {
  gameKey,
  loadHighScore,
  readJson,
  removeKey,
  saveHighScore,
  useHighScore,
  writeJson,
} from "./storage";

export { assertNever, initialSession, sessionReducer, useGameSession } from "./game-shell";

export { useCountdown, useCpuTurn, useElapsedMs } from "./hooks";

export { card, hand, joker } from "./testing";
