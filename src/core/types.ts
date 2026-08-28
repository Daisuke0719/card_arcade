import type { ComponentType } from "react";

/* ============================================================
 * カード
 * ============================================================ */

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";

export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type CardId = string;

/** 通常の52枚に含まれるカード。 */
export type PlayingCard = {
  readonly kind: "standard";
  readonly id: CardId; // 例: "spades-A"
  readonly suit: Suit;
  readonly rank: Rank;
};

/**
 * ジョーカー。ババ抜きだけが使う。
 * `kind` で判別するので、`AnyCard` に対していきなり `.rank` を読むと
 * コンパイルエラーになる（＝考慮漏れがビルド時に分かる）。
 */
export type JokerCard = {
  readonly kind: "joker";
  readonly id: CardId; // 例: "joker-red"
  readonly color: "red" | "black";
};

export type AnyCard = PlayingCard | JokerCard;

/** 山札・手札・場札などカードの並び。既定は52枚側の型。 */
export type Deck<T extends AnyCard = PlayingCard> = readonly T[];

/* ============================================================
 * 乱数
 * ============================================================ */

/** 0以上1未満を返す関数。テストでは seed 固定のものを渡す。 */
export type Rng = () => number;

/* ============================================================
 * プレイヤーとターン
 * ============================================================ */

export type PlayerId = string;
export type PlayerKind = "human" | "cpu";

export type Player = {
  readonly id: PlayerId;
  readonly name: string;
  readonly kind: PlayerKind;
};

export type TurnState = {
  readonly players: readonly Player[];
  readonly currentId: PlayerId;
  /** 1 = 並び順どおり / -1 = 逆回り */
  readonly direction: 1 | -1;
  /** 上がった順に並ぶ。ここに入った人は手番から外れる。 */
  readonly finishedIds: readonly PlayerId[];
};

/* ============================================================
 * スコア・順位
 * ============================================================ */

export type ScoreEntry = {
  readonly id: string;
  readonly name: string;
  readonly score: number;
};

export type RankingRow = {
  readonly rank: number;
  readonly name: string;
  /** 「12手」「残り3枚」など、順位の根拠を短く添える。 */
  readonly detail?: string;
};

export type Ranking = readonly RankingRow[];

/* ============================================================
 * ハイスコア（LocalStorage）
 * ============================================================ */

/** `card-arcade:v1:{gameId}:{name}` の形しか作れないようにする。 */
export type StorageKey = `card-arcade:v1:${string}:${string}`;

export type HighScoreDirection = "higher-is-better" | "lower-is-better";

export type HighScore = {
  readonly value: number;
  readonly updatedAt: number;
};

/* ============================================================
 * ゲームセッション（共通の状態機械）
 * ============================================================ */

export type GamePhase = "idle" | "playing" | "finished";

export type GameOutcome = "win" | "lose" | "draw" | "done";

export type GameResult = {
  readonly outcome: GameOutcome;
  readonly score?: number;
  readonly ranking?: Ranking;
  readonly message?: string;
};

export type SessionState = {
  readonly phase: GamePhase;
  readonly result: GameResult | null;
  /** 何回目のプレイか。リセットのたびに増える（state を作り直す鍵に使える）。 */
  readonly round: number;
};

export type SessionAction =
  | { readonly type: "start" }
  | { readonly type: "finish"; readonly result: GameResult }
  | { readonly type: "reset" };

/* ============================================================
 * ゲームの公開契約（6チームの唯一の共通接点）
 * ============================================================ */

export type GameId = string;
export type GameDifficulty = "easy" | "normal" | "hard";

/** "coming-soon" = スケルトン / "ready" = 完成して遊べる */
export type GameStatus = "coming-soon" | "ready";

export type TeamId = "core" | "team-a" | "team-b" | "team-c" | "team-d" | "team-e" | "team-f";

export type GameComponentProps = {
  readonly manifest: GameManifest;
  /** アーケード一覧へ戻る。GameShell が使う。 */
  readonly onExit: () => void;
};

export type GameManifest = {
  /** kebab-case。フォルダ名と一致していること（契約テストで強制）。 */
  readonly id: GameId;
  /** 画面に出す名前。日本語可・20文字以内。 */
  readonly name: string;
  /** 一覧タイルの説明。60文字以内。 */
  readonly description: string;
  readonly difficulty: GameDifficulty;
  readonly team: TeamId;
  /** 完成したら "ready" にする。PR の差分に1行として現れる。 */
  readonly status: GameStatus;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  /** 遊び方。3〜6行。GameInstructions が自動表示する。 */
  readonly howToPlay: readonly string[];
  readonly tags?: readonly string[];
  /** 絵文字1文字。タイルのアイコンになる。 */
  readonly icon?: string;
  /** 担当 Issue の番号。タイルから Issue へリンクする。 */
  readonly issueNumber?: number;
  readonly component: ComponentType<GameComponentProps>;
};
