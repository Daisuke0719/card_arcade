# リポジトリ構成

この文書では、リポジトリの構成と各ディレクトリの役割を説明します。
実装の手順は [docs/game-plugin-guide.md](game-plugin-guide.md)、当日の進め方は [docs/handson-steps.md](handson-steps.md) にあります。

## 概要

- 共通処理を提供する `@core` と画面部品を提供する `@ui` は、運営が管理します。参加者は変更しません。
- 参加者9名が1つずつゲームを担当し、`src/games/<ゲームID>/` にゲーム固有のルールを実装します。
- ゲームを自動検出するため、各Pull Requestで共通の登録ファイルを変更する必要はありません。

## 全体像

依存関係は、次の図の上から下に向かう方向に限定されています。反対方向のimportはESLintで禁止しています。

```text
  src/app/  +  src/pages/          アーケードの一覧・ゲーム画面・ルーティング（運営管理）
        |
        |  import.meta.glob で自動的に集める（登録用の一覧ファイルは存在しない）
        v
  src/games/<ゲームID>/            ゲーム固有のルール（参加者の編集対象）
        |
        |  import { Card, GameShell } from "@ui"
        v
  src/components/                  画面部品 = @ui（運営管理）
        |
        |  import { createDeck, useCpuTurn } from "@core"
        v
  src/core/                        共通処理 = @core（運営管理）
```

依存の方向を限定することで、次の利点があります。

- ゲーム同士が独立しているため、ほかの参加者の実装状況にかかわらず作業できる
- `@core` は個別のゲームに依存しないため、ゲームを追加しても共通基盤の変更が不要
- `logic.ts` はReactや時間処理に依存しないため、関数単位でテストできる

`@core` と `@ui` から公開されているAPIだけを使用します。`@core/deck` のように内部のパスを指定すると、`vite.config.ts` と `tsconfig.json` で定義した完全一致のエイリアスに一致せず、モジュールを解決できません。この制限はESLintとは別に機能します。

## ディレクトリ構成

`<=` が付いたディレクトリだけが参加者の編集対象です。それ以外は運営が管理します。

```text
card_arcade/
├─ src/
│  ├─ core/                    @core の実体。ゲーム共通の処理を提供する
│  │  ├─ cards/                スート・ランク・強さの順序
│  │  ├─ deck/                 山札の作成・配布・ドロー
│  │  ├─ shuffle/              seed を固定できる乱数
│  │  ├─ players/              プレイヤーとターンの管理
│  │  ├─ score/                順位づけと表示の整形
│  │  ├─ storage/              ハイスコアの保存
│  │  ├─ game-shell/           開始・終了・リセットを管理する状態機械
│  │  ├─ hooks/                useCpuTurn など「時間」を扱うフック
│  │  ├─ testing/              テスト用のカードファクトリ
│  │  ├─ types.ts              9人全員が共有する型（GameManifest はここ）
│  │  └─ index.ts              外部に公開する API
│  ├─ components/              @ui の実体。12個の画面部品
│  │  └─ index.ts              公開 API
│  ├─ games/
│  │  ├─ example-game/         お手本（ハイ＆ロー・CPU 対戦・10ラウンド）
│  │  ├─ babanuki/          <= 担当1（ババ抜き）の編集対象
│  │  ├─ daifugo/           <= 担当2（大富豪）
│  │  ├─ shinkeisuijaku/    <= 担当3（神経衰弱）
│  │  ├─ poker/             <= 担当4（ポーカー）
│  │  ├─ butanoshippo/      <= 担当5（ぶたのしっぽ）
│  │  ├─ speed/             <= 担当6（スピード）
│  │  ├─ shichinarabe/      <= 担当7（七並べ）
│  │  ├─ doubt/             <= 担当8（ダウト）
│  │  ├─ pageone/           <= 担当9（ページワン）
│  │  └─ CLAUDE.md             ゲーム実装の決まりと早見表
│  ├─ app/                     ゲームの自動検出とルーティング
│  │  └─ registry/             loadGames.ts / validateManifest.ts / gameOrder.ts / harnessConfig.ts
│  ├─ pages/                   ArcadePage / GamePage / NotFoundPage
│  ├─ styles/                  tokens.css（--ca-* の色と余白）/ global.css
│  └─ test/                    Vitest のセットアップ
├─ tests/contract/             契約テスト4本（9人共通の約束を機械で守る）
├─ harness/config.json         担当者とゲームの対応を管理する設定ファイル
├─ scripts/                    scope-guard / scaffold-game / doctor / status / setup-github など
├─ templates/game/             scaffold が使う雛形
├─ .claude/                    commands（8本）/ hooks（5本）/ settings.json
├─ .github/                    CI / CODEOWNERS / Issue・PR テンプレート
├─ .githooks/pre-commit        コミット前の範囲チェック
├─ docs/                       教材（この文書もここ）
└─ CLAUDE.md                   Claude Code が毎回読む決まり
```

担当ゲームのフォルダ以外は参照できますが、変更はできません。

担当者とゲームの対応は、`harness/config.json` を参照元とします。
`scripts/scope-guard.mjs`・`scripts/scaffold-game.mjs`・`scripts/setup-github.mjs`・契約テスト・
`.claude/` のフック・アーケードの画面が、すべて同じファイルを読んでいます。

参加者ID（`participants[].participant`）の初期値は、`participant-1`〜`participant-9` です。
研修当日に GitHub のアカウント名へ書き換えると、Issue、ラベル、雛形、画面の表示にも反映されます。書き換えたあとは、`node scripts/build-issue-bodies.mjs` と `npm run scaffold -- --all --force` を実行します。

## ゲームが自動で見つかる仕組み

`src/app/registry/loadGames.ts` では、次のコードでゲームを読み込みます。

```ts
const modules = import.meta.glob<unknown>("../../games/*/index.ts", {
  eager: true,
  import: "game",
});
```

`src/games/<何か>/index.ts` から `export const game` が公開されていると、そのゲームが一覧に表示されます。

この仕組みにより、登録ファイルでの競合を防いでいます。

- 登録用の配列や、`games.ts` のような一覧ファイルはありません
- 各Pull Requestが同じ登録行を変更することはありません
- ゲームの追加は新しいフォルダ内で完結するため、ほかのゲーム追加と競合しません

読み込み時には、次の検証も行います。

| 機能               | 場所                                   | 動作                                                                                                             |
| ------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `validateManifest` | `src/app/registry/validateManifest.ts` | 規約違反があっても例外を送出せず、該当するゲームをエラー表示にする。他のゲームは引き続き利用できる               |
| `gameOrder.ts`     | `src/app/registry/gameOrder.ts`        | `harness/config.json` の `participants` の順に表示する。担当1〜担当9のあとに、サンプルゲームの `core` を表示する |
| 重複の検出         | `loadGames.ts`                         | `id` や `owner`（担当者）が重複したゲームは登録されず、契約テストも失敗する                                      |

## GameManifest の全フィールド

次の表は、`src/core/types.ts` に定義されているフィールドをまとめたものです。ゲームとアーケードは、この型を介して連携します。

| フィールド    | 型                                  | 必須 | 内容                                                                                                    |
| ------------- | ----------------------------------- | ---- | ------------------------------------------------------------------------------------------------------- |
| `id`          | `GameId`（`string`）                | 必須 | kebab-case。**フォルダ名と一致**（契約テストで強制）                                                    |
| `name`        | `string`                            | 必須 | 画面に表示する名前。20文字以内                                                                          |
| `description` | `string`                            | 必須 | 一覧タイルの説明。60文字以内                                                                            |
| `difficulty`  | `"easy"` / `"normal"` / `"hard"`    | 必須 | 初級 / 中級 / 上級として表示される                                                                      |
| `owner`       | `OwnerId`（`string`）               | 必須 | 担当者。`core`（運営）または `harness/config.json` の `participant`（`participant-1`〜`participant-9`） |
| `status`      | `"coming-soon"` / `"ready"`         | 必須 | 完成後に `"ready"` へ変更する。Pull Request の差分では1行の変更になる                                   |
| `minPlayers`  | `number`                            | 必須 | 1 以上。`minPlayers <= maxPlayers <= 6`                                                                 |
| `maxPlayers`  | `number`                            | 必須 | 6 以下                                                                                                  |
| `howToPlay`   | `readonly string[]`                 | 必須 | 遊び方。3〜6行。`GameInstructions` が自動表示する                                                       |
| `tags`        | `readonly string[]`                 | 任意 | 補足のラベル                                                                                            |
| `icon`        | `string`                            | 任意 | 絵文字1文字。タイルのアイコンになる                                                                     |
| `issueNumber` | `number`                            | 任意 | 担当 Issue の番号。タイルから Issue へリンクする                                                        |
| `component`   | `ComponentType<GameComponentProps>` | 必須 | 画面本体。`<Xxx>Game.tsx` から import する                                                              |

`id`、`name`、`difficulty`、`owner` は運営が決めた値で、雛形にも設定されています。
変更すると契約テストとCIが失敗します。参加者が変更するのは
`description`、`howToPlay`、`icon`、`status` の4つだけです。

画面が受け取る props は2つだけです。

```ts
type GameComponentProps = {
  readonly manifest: GameManifest;
  readonly onExit: () => void; // アーケード一覧へ戻る。GameShell にそのまま渡す
};
```

`status` を `"ready"` にすると、契約テストが**ロジックのテスト3件以上**と
**例外を出さずに描画できること**を要求します。`npm run verify` が成功してから変更してください。

### `owner` の型を `OwnerId`（`string`）にしている理由

チーム制だったときは、`TeamId = "core" | "team-a" | ... | "team-f"` というユニオン型を使っていました。現在は1人1ゲームの構成に合わせ、`string` としています。

```ts
/**
 * ゲームの担当者。"core" は運営、それ以外は harness/config.json の participant。
 * GitHub のアカウント名に差し替えられるよう string にしてあり、
 * 実際に存在する担当者かどうかは契約テストと validateManifest が config と突き合わせて検証する。
 */
export type OwnerId = string;
```

`participant-1`〜`participant-9` は仮の値であり、研修当日に `harness/config.json` で GitHub のアカウント名へ置き換えます。
担当者名をユニオン型にすると、名簿を変更するたびに、運営管理の `src/core/types.ts` も変更しなければなりません。担当者の設定だけで共通基盤へ差分が生じないように、型では値を限定していません。

`string` では担当者が存在するか判定できないため、次の2か所で検証します。

| 検証箇所                                   | 検証内容                                                                               | 問題があった場合の動作                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/app/registry/validateManifest.ts`     | `isKnownOwner()` で、`harness/config.json` に登録された担当者または `core` かを調べる  | 例外を送出せず、該当するゲームだけを赤いタイルで表示する。ほかのゲームは引き続き利用できる |
| `tests/contract/registry.contract.test.ts` | 担当者が重複していないか（1人1ゲーム）/ 担当者・ゲーム名・難易度が config と一致するか | `npm test` と CI が失敗する                                                                |

型だけでは保証できない条件を、テストで補っています。どちらも同じ `harness/config.json` を参照します。
型を固定するより、参照元を一つにまとめるほうが当日の変更に対応しやすいためです。

## @core の早見表

`src/core/index.ts` で公開しているAPIの一覧です。ここにないものは外部から利用できません。

```ts
import {
  // ---- カード（src/core/cards） ----
  SUITS,
  RANKS,
  SUIT_SYMBOL,
  SUIT_COLOR,
  SUIT_NAME_JA,
  cardId,
  cardLabel,
  cardShortLabel, // cardLabel: "スペードのA"
  sameRank,
  sameSuit,
  isStandard,
  isJoker,
  partitionJokers,
  rankToNumber,
  numberToRank,
  cycleRank, // cycleRank: K の次は A
  RANK_ORDER_ACE_LOW,
  RANK_ORDER_ACE_HIGH,
  createRankStrength,
  compareRank,
  compareCard,
  sortCards,
  groupByRank,
  groupBySuit,

  // ---- 山札（src/core/deck） ----
  createDeck, // 52枚
  createDeckWithJokers, // 52枚 + ジョーカー（ババ抜き用）
  createJokers,
  draw,
  drawMany,
  deal,
  returnToDeck,
  first,
  last,
  requireCard,

  // ---- 乱数（src/core/shuffle） ----
  createRng, // seed を固定できる。テストは必ずこれ
  shuffle,
  pickRandom,
  pickRandomIndex,
  hashSeed,
  mulberry32,

  // ---- プレイヤーとターン（src/core/players） ----
  createPlayers,
  createSoloVsCpu,
  findPlayer,
  createTurnState,
  nextTurn,
  finishPlayer,
  reverseDirection,
  neighborId, // 左隣の人。上がった人は自動で飛ばす
  alivePlayers,
  isCurrent,
  isFinished,
  isOver,

  // ---- スコア（src/core/score） ----
  rankByScore, // 点数で順位。同点は同じ順位
  rankByFinishOrder, // 上がった順で順位
  formatRank,
  formatDuration,

  // ---- 保存（src/core/storage） ----
  gameKey,
  useHighScore,
  loadHighScore,
  saveHighScore,
  readJson,
  writeJson,
  removeKey,

  // ---- セッション（src/core/game-shell） ----
  useGameSession,
  initialSession,
  sessionReducer,
  assertNever, // switch の書き忘れをコンパイル時に見つける

  // ---- 時間を扱うフック（src/core/hooks） ----
  useCpuTurn, // 待ち時間つきの自動処理はこれ1本
  useElapsedMs,
  useCountdown,

  // ---- テスト用（src/core/testing） ----
  card,
  hand,
  joker, // card("spades","A") / hand("spades-A","hearts-K")
} from "@core";
```

型も公開APIからimportできます（`import type { ... } from "@core"`）。

```ts
(AnyCard,
  PlayingCard,
  JokerCard,
  CardId,
  Deck,
  Suit,
  Rank,
  RankOrder,
  Rng,
  Player,
  PlayerId,
  PlayerKind,
  TurnState,
  ScoreEntry,
  Ranking,
  RankingRow,
  HighScore,
  HighScoreDirection,
  StorageKey,
  GamePhase,
  GameOutcome,
  GameResult,
  SessionState,
  SessionAction,
  GameId,
  GameDifficulty,
  GameStatus,
  OwnerId,
  GameManifest,
  GameComponentProps);
```

| 目的                             | 使用する機能                       |
| -------------------------------- | ---------------------------------- |
| カードを配りたい                 | 山札                               |
| 「このゲームでの強さ」を決めたい | カード（`createRankStrength`）     |
| テストを毎回同じ結果にしたい     | 乱数（`createRng`）                |
| 手番を回したい・左隣を知りたい   | プレイヤーとターン                 |
| 順位表を表示したい               | スコア                             |
| CPUの処理前に待ち時間を設けたい  | フック（`useCpuTurn`）             |
| 記録を保存したい                 | 保存（`useHighScore` / `gameKey`） |

## @ui の早見表

`src/components/index.ts` が公開しているコンポーネントの一覧です。

| コンポーネント     | 用途                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `GameShell`        | ゲーム画面の外枠。契約テストは `data-testid="game-shell"` の有無を検査する |
| `Card`             | カード1枚を表示する。`face="down"` の場合は、カードの内容をDOMに出力しない |
| `Hand`             | 手札。`variant="hidden"` なら枚数だけ（他プレイヤー用）                    |
| `DeckPile`         | 山札、捨て札、場札と、残り枚数、一番上のカードを表示する                   |
| `Button`           | ボタン。`variant` は primary / secondary / ghost / danger                  |
| `ScoreBoard`       | スコア表を表示する。手番のプレイヤーと上がったプレイヤーに印が付く         |
| `Timer`            | 経過時間を表示する。時間の計測には `@core` のフックを使用する              |
| `ResultModal`      | ゲームの結果を表示する。順位表にも対応する                                 |
| `GameInstructions` | 遊び方。`manifest.howToPlay` をそのまま渡す                                |
| `LogPanel`         | 進行ログ（「CPU2 がダウトを宣言しました」など）                            |
| `ComingSoonPanel`  | 未実装のゲームに表示する内容。実装後はゲーム画面へ差し替える               |
| `GameTile`         | 一覧タイル。アーケード側が使う（ゲームからは通常使いません）               |

色と余白には、`src/styles/tokens.css` で定義された `--ca-*` をCSS Modulesから参照します。値を直接記述しないでください。

## `@core` と `games` の役割

実装場所は、次の基準で判断します。

9つのゲームすべてに共通する処理は `@core` に置き、特定のゲームだけに適用するルールは `games` に置きます。

例として、大富豪のカードの強さ（3 < 4 < ... < K < A < 2）を考えます。
これは大富豪だけのルールなので、`@core` には追加しません。
`@core` からは、指定された順序にもとづいて強さを判定する関数だけを提供します。

```ts
// src/games/daifugo/logic.ts
import { createRankStrength } from "@core";
import type { Rank } from "@core";

// 大富豪の強さ。core はこの並びを知らない
const DAIFUGO_ORDER: readonly Rank[] = [
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
];

const strength = createRankStrength(DAIFUGO_ORDER);

export function isStronger(a: Rank, b: Rank): boolean {
  return strength(a) > strength(b);
}
```

革命が起きた場合は、逆順の配列から作成した関数に切り替えます。
大富豪固有の強さを `daifugoStrength` として `@core` に追加すると、ルールの変更が共通基盤の差分となり、ほかの参加者のPull Requestにも影響します。

| 置き場所              | 例                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `@core`（共通処理）   | 52枚のカード生成、seed付きシャッフル、手番の更新、指定された順序にもとづく強さの判定               |
| `games`（固有ルール） | 3 < ... < A < 2、8切り、革命、ダウトの宣言、7の隣にしか置けない、ポーカーの役の強さ、ジョーカー1枚 |

`@core` に必要な機能が見つからない場合は、変更せずに講師へ報告してください。
既存の関数を組み合わせて実現できる場合があります。報告方法は、[docs/harness.md](harness.md) と `src/core/CLAUDE.md` を参照してください。

## テストの置き場所

| 置き場所                                           | 中身                               | 誰が書くか |
| -------------------------------------------------- | ---------------------------------- | ---------- |
| `src/games/<ゲームID>/logic.test.ts`               | ルールのテスト。**ここが評価対象** | 担当者本人 |
| `src/games/<ゲームID>/<Xxx>Game.test.tsx`          | 画面のテスト（任意）               | 担当者本人 |
| `src/core/` と `src/components/` の `*.test.ts(x)` | 共通基盤のテスト                   | 運営       |
| `tests/contract/`                                  | 9人共通の約束を守る契約テスト      | 運営       |

契約テストは4本です。担当箇所の変更によって失敗することもあるため、各テストの検査内容を確認しておいてください。

| ファイル                      | 何を検査するか                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `registry.contract.test.ts`   | 9ゲーム + お手本がすべて見つかるか / 読み込めないゲームが無いか / `id` とフォルダ名が一致するか / **担当者が重複していないか（1人1ゲーム）** / 担当者・ゲーム名・難易度が `harness/config.json` と一致するか                                                                                                          |
| `manifest.contract.test.tsx`  | 必須ファイル（`index.ts` `logic.ts` `logic.test.ts` `README.md` と `<Xxx>Game.tsx`）が揃っているか / README に `## 遊び方` `## ルール` `## 実装メモ` があるか / name 20文字・description 60文字などの上限を守っているか / `status` が `"ready"` ならテスト3件以上（`skip` 無し）かつ `GameShell` を使って描画できるか |
| `boundaries.contract.test.ts` | 担当フォルダの外を相対パスで参照していないか / 他の人のゲームを参照していないか / `@core/...` `@ui/...` の深い import が無いか / `logic.ts` `cpu.ts` `rules.ts` に `Math.random` `Date.now` `new Date()` `setTimeout` `setInterval` や react が無いか / `eslint-disable` を書いていないか                             |
| `arcade.contract.test.tsx`    | 9人全員のゲームがタイルとして並ぶか / 担当者の表示名がタイルに出るか / お手本が別枠で出るか / COMING SOON の数が実態と合うか / 「公開中 n / 9」の数が合っているか / 読み込めなかったゲームが画面に出るか（白画面にしない）                                                                                            |

`arcade.contract.test.tsx` は、研修開始時に9名分のタイルが表示されることを検査します。そのため、各参加者は初日から担当箇所を確認できます。

これらの契約テストは、`npm test`（`vitest run`）でまとめて実行されます。
`npm run verify` では、テストに加えて範囲チェック、lint、型チェック、ビルドを実行します。検証内容はCIと同じです。

## 次に読むもの

- ゲームの実装手順: [docs/game-plugin-guide.md](game-plugin-guide.md)
- 担当ゲームのルール: [docs/games/](games/)
- ハーネスの制約と対処方法: [docs/harness.md](harness.md)
- エラーの原因と対処方法: [docs/troubleshooting.md](troubleshooting.md)
