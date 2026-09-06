# リポジトリの地図

この文書では、リポジトリの構成と各ディレクトリの役割を説明します。
実装の手順は [docs/game-plugin-guide.md](game-plugin-guide.md)、当日の進め方は [docs/handson-steps.md](handson-steps.md) にあります。

## 概要

- 共通基盤（`@core` = 仕組み / `@ui` = 画面部品）は運営が用意します。参加者は変更しません。
- 参加者9人が1ゲームずつ担当し、`src/games/<自分のゲームID>/` にゲーム固有のルールを書きます。
- ゲームは自動検出されるため、9つの Pull Request が同じ登録ファイルを変更することはありません。

## 全体像

依存は上から下への一方向だけです。**逆向きの矢印はありません**（ESLint が禁止しています）。

```text
  src/app/  +  src/pages/          アーケードの一覧・ゲーム画面・ルーティング（運営管理）
        |
        |  import.meta.glob で自動的に集める（登録用の一覧ファイルは存在しない）
        v
  src/games/<ゲームID>/            ルール。9人が書くのはここだけ
        |
        |  import { Card, GameShell } from "@ui"
        v
  src/components/                  画面部品 = @ui（運営管理）
        |
        |  import { createDeck, useCpuTurn } from "@core"
        v
  src/core/                        仕組み = @core（運営管理）
```

依存の方向を限定することで、次の利点があります。

- **ゲーム同士を独立させられる** … 他の参加者の実装状況にかかわらず作業を進められる
- **共通基盤への影響を防げる** … `@core` は個別のゲームに依存しないため、ゲームの追加時にも変更が不要
- **テストを短時間で実行できる** … `logic.ts` は React や時間処理に依存せず、関数単位でテストできる

`@core` と `@ui` は「入口だけ」を使います。`@core/deck` のような深い指定は、
`vite.config.ts` と `tsconfig.json` のエイリアスが**完全一致の正規表現**になっているため、
モジュール解決の時点で失敗します（ESLint を無効化しても境界は破れません）。

## ディレクトリ構成

矢印が付いているところだけが参加者の編集対象です。それ以外はすべて運営管理です。

```text
card_arcade/
├─ src/
│  ├─ core/                    @core の実体。仕組みだけを持つ
│  │  ├─ cards/                スート・ランク・強さの順序
│  │  ├─ deck/                 山札を作る・配る・引く
│  │  ├─ shuffle/              seed を固定できる乱数
│  │  ├─ players/              プレイヤーとターンの管理
│  │  ├─ score/                順位づけと表示の整形
│  │  ├─ storage/              ハイスコアの保存
│  │  ├─ game-shell/           始まる・終わる・やり直すの状態機械
│  │  ├─ hooks/                useCpuTurn など「時間」を扱うフック
│  │  ├─ testing/              テスト用のカードファクトリ
│  │  ├─ types.ts              9人全員が共有する型（GameManifest はここ）
│  │  └─ index.ts              公開 API。ここに無いものは「無い」
│  ├─ components/              @ui の実体。12個の画面部品
│  │  └─ index.ts              公開 API
│  ├─ games/
│  │  ├─ example-game/         お手本（ハイ＆ロー・CPU 対戦・10ラウンド）
│  │  ├─ babanuki/          <= 担当1（ババ抜き）ここだけ書ける
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

自分のゲームフォルダ以外は、読むのは自由ですが変更できません。

担当者とゲームの対応は、`harness/config.json` を参照元とします。
`scripts/scope-guard.mjs`・`scripts/scaffold-game.mjs`・`scripts/setup-github.mjs`・契約テスト・
`.claude/` のフック・アーケードの画面が、すべて同じファイルを読んでいます。

参加者ID（`participants[].participant`）は仮名の `participant-1`〜`participant-9` で置いてあります。
当日ここをGitHubのアカウント名に書き換えると、Issue、ラベル、雛形、画面の表示にも同じ名前が反映されます
（書き換えたら `node scripts/build-issue-bodies.mjs` と `npm run scaffold -- --all --force`）。

## ゲームが自動で見つかる仕組み

`src/app/registry/loadGames.ts` では、次のコードでゲームを読み込みます。

```ts
const modules = import.meta.glob<unknown>("../../games/*/index.ts", {
  eager: true,
  import: "game",
});
```

`src/games/<何か>/index.ts` が `export const game` を公開していれば、それだけで一覧に載ります。

この仕組みにより、登録ファイルでの競合を防いでいます。

- 登録用の配列も、`games.ts` のような一覧ファイルも**存在しません**
- そのため、9人の Pull Request が同じ行を書き換えることはありません
- ゲームの追加は新しいフォルダ内で完結するため、ほかのゲーム追加とは競合しません

安全装置も入っています。

| 仕組み | 場所 | 何をするか |
|---|---|---|
| `validateManifest` | `src/app/registry/validateManifest.ts` | 規約違反があっても例外を送出せず、該当するゲームをエラー表示にする。他のゲームは引き続き利用できる |
| `gameOrder.ts` | `src/app/registry/gameOrder.ts` | 表示順は `harness/config.json` の `participants` の並び（担当1 〜 担当9 の順、お手本の `core` は最後）で固定。manifest に順番のフィールドが無いので、自分のタイルを先頭にできない |
| 重複の検出 | `loadGames.ts` | `id` や `owner`（担当者）が重複したゲームは登録されず、契約テストも失敗する |

## GameManifest の全フィールド

`src/core/types.ts` の定義そのままです。ゲームとアーケードは、この型を介して連携します。

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `id` | `GameId`（`string`） | 必須 | kebab-case。**フォルダ名と一致**（契約テストで強制） |
| `name` | `string` | 必須 | 画面に出す名前。20文字以内 |
| `description` | `string` | 必須 | 一覧タイルの説明。60文字以内 |
| `difficulty` | `"easy"` / `"normal"` / `"hard"` | 必須 | 初級 / 中級 / 上級として表示される |
| `owner` | `OwnerId`（`string`） | 必須 | 担当者。`core`（運営）または `harness/config.json` の `participant`（`participant-1`〜`participant-9`） |
| `status` | `"coming-soon"` / `"ready"` | 必須 | 完成したら `"ready"` に変える。Pull Request の差分に1行として現れる |
| `minPlayers` | `number` | 必須 | 1 以上。`minPlayers <= maxPlayers <= 6` |
| `maxPlayers` | `number` | 必須 | 6 以下 |
| `howToPlay` | `readonly string[]` | 必須 | 遊び方。3〜6行。`GameInstructions` が自動表示する |
| `tags` | `readonly string[]` | 任意 | 補足のラベル |
| `icon` | `string` | 任意 | 絵文字1文字。タイルのアイコンになる |
| `issueNumber` | `number` | 任意 | 担当 Issue の番号。タイルから Issue へリンクする |
| `component` | `ComponentType<GameComponentProps>` | 必須 | 画面本体。`<Xxx>Game.tsx` から import する |

`id` `name` `difficulty` `owner` は運営が決めた値です（雛形にそう書いてあります）。
変更すると契約テストとCIが失敗します。参加者が変更するのは
`description` / `howToPlay` / `icon` / `status` の4つだけです。

画面が受け取る props は2つだけです。

```ts
type GameComponentProps = {
  readonly manifest: GameManifest;
  readonly onExit: () => void;   // アーケード一覧へ戻る。GameShell にそのまま渡す
};
```

`status` を `"ready"` にすると、契約テストが**ロジックのテスト3件以上**と
**例外を出さずに描画できること**を要求します。`npm run verify` が成功してから変更してください。

### owner の型が `OwnerId`（= `string`）である理由

チーム制だったときは `TeamId = "core" | "team-a" | ... | "team-f"` という、
候補を並べた型（ユニオン型）でした。1人1ゲームになったいまは、ただの `string` です。
運用上の理由から、意図的に `string` としています。

```ts
/**
 * ゲームの担当者。"core" は運営、それ以外は harness/config.json の participant。
 * GitHub のアカウント名に差し替えられるよう string にしてあり、
 * 実際に存在する担当者かどうかは契約テストと validateManifest が config と突き合わせて検証する。
 */
export type OwnerId = string;
```

理由は当日の差し替えです。`participant-1`〜`participant-9` は仮名で、
研修当日に `harness/config.json` を GitHub のアカウント名へ書き換えます。
もし型に9人分の名前を並べていたら、**名簿が変わるたびに `src/core/types.ts` を編集**することになります。
そこは参加者が触れない運営管理の場所で、しかも全員のビルドに影響します。
アカウント名を1つ直しただけで共通基盤が動くのは、依存の向きとして間違っています。

一方で、存在しない担当者も指定できてしまうため、次の2か所で検証します。

| どこで | 何を見るか | 問題があった場合の表示 |
|---|---|---|
| `src/app/registry/validateManifest.ts` | `isKnownOwner()` が `harness/config.json` に載っている担当者（または `core`）かを調べる | 例外は投げない。そのゲームだけ赤いタイルになり、他は動き続ける |
| `tests/contract/registry.contract.test.ts` | 担当者が重複していないか（1人1ゲーム）/ 担当者・ゲーム名・難易度が config と一致するか | `npm test` と CI が失敗する |

型だけでは保証できない条件を、テストで補っています。どちらも同じ `harness/config.json` を参照します。
型を固定するより、参照元を一つにまとめるほうが当日の変更に対応しやすいためです。

## @core の早見表

`src/core/index.ts` で公開しているAPIの一覧です。ここにないものは外部から利用できません。

```ts
import {
  // ---- カード（src/core/cards） ----
  SUITS, RANKS, SUIT_SYMBOL, SUIT_COLOR, SUIT_NAME_JA,
  cardId, cardLabel, cardShortLabel,          // cardLabel: "スペードのA"
  sameRank, sameSuit, isStandard, isJoker, partitionJokers,
  rankToNumber, numberToRank, cycleRank,      // cycleRank: K の次は A
  RANK_ORDER_ACE_LOW, RANK_ORDER_ACE_HIGH,
  createRankStrength, compareRank, compareCard,
  sortCards, groupByRank, groupBySuit,

  // ---- 山札（src/core/deck） ----
  createDeck,             // 52枚
  createDeckWithJokers,   // 52枚 + ジョーカー（ババ抜き用）
  createJokers,
  draw, drawMany, deal, returnToDeck,
  first, last, requireCard,

  // ---- 乱数（src/core/shuffle） ----
  createRng,              // seed を固定できる。テストは必ずこれ
  shuffle, pickRandom, pickRandomIndex,
  hashSeed, mulberry32,

  // ---- プレイヤーとターン（src/core/players） ----
  createPlayers, createSoloVsCpu, findPlayer,
  createTurnState, nextTurn, finishPlayer, reverseDirection,
  neighborId,             // 左隣の人。上がった人は自動で飛ばす
  alivePlayers, isCurrent, isFinished, isOver,

  // ---- スコア（src/core/score） ----
  rankByScore,            // 点数で順位。同点は同じ順位
  rankByFinishOrder,      // 上がった順で順位
  formatRank, formatDuration,

  // ---- 保存（src/core/storage） ----
  gameKey, useHighScore,
  loadHighScore, saveHighScore, readJson, writeJson, removeKey,

  // ---- セッション（src/core/game-shell） ----
  useGameSession, initialSession, sessionReducer,
  assertNever,            // switch の書き忘れをコンパイル時に見つける

  // ---- 時間を扱うフック（src/core/hooks） ----
  useCpuTurn,             // 待ち時間つきの自動処理はこれ1本
  useElapsedMs, useCountdown,

  // ---- テスト用（src/core/testing） ----
  card, hand, joker,      // card("spades","A") / hand("spades-A","hearts-K")
} from "@core";
```

型も同じ入口から取れます（`import type { ... } from "@core"`）。

```ts
AnyCard, PlayingCard, JokerCard, CardId, Deck, Suit, Rank, RankOrder,
Rng, Player, PlayerId, PlayerKind, TurnState,
ScoreEntry, Ranking, RankingRow, HighScore, HighScoreDirection, StorageKey,
GamePhase, GameOutcome, GameResult, SessionState, SessionAction,
GameId, GameDifficulty, GameStatus, OwnerId, GameManifest, GameComponentProps
```

| こういうときに | 開くグループ |
|---|---|
| カードを配りたい | 山札 |
| 「このゲームでの強さ」を決めたい | カード（`createRankStrength`） |
| テストを毎回同じ結果にしたい | 乱数（`createRng`） |
| 手番を回したい・左隣を知りたい | プレイヤーとターン |
| 順位表を出したい | スコア |
| CPU に少し待ってから動いてほしい | フック（`useCpuTurn`） |
| 記録を残したい | 保存（`useHighScore` / `gameKey`） |

## @ui の早見表

`src/components/index.ts` が公開しているコンポーネントの一覧です。

| コンポーネント | 何をするか |
|---|---|
| `GameShell` | 画面の外枠。**必ずこれで包む**（契約テストが `data-testid="game-shell"` を見る） |
| `Card` | カード1枚。`face="down"` にすると中身が DOM に一切出ない |
| `Hand` | 手札。`variant="hidden"` なら枚数だけ（他プレイヤー用） |
| `DeckPile` | 山札・捨て札・場札。残り枚数と一番上のカードを出す |
| `Button` | ボタン。`variant` は primary / secondary / ghost / danger |
| `ScoreBoard` | スコア表。手番の人と上がった人に印が付く |
| `Timer` | 経過時間の表示。自分では数えない（時間は `@core` のフックが持つ） |
| `ResultModal` | 結果表示。順位表も出せる |
| `GameInstructions` | 遊び方。`manifest.howToPlay` をそのまま渡す |
| `LogPanel` | 進行ログ（「CPU2 がダウトを宣言しました」など） |
| `ComingSoonPanel` | 未実装のゲームが表示する中身。実装したら差し替える |
| `GameTile` | 一覧タイル。アーケード側が使う（ゲームからは通常使いません） |

色と余白は `src/styles/tokens.css` の `--ca-*` を CSS Modules から参照します。直書きはしません。

## core は仕組み、games はルール

実装場所は、次の基準で判断します。

> そのルールは9ゲーム全部に当てはまるか？
> 当てはまらないなら、それは `games` に書くものです。

例として、大富豪のカードの強さ（3 < 4 < ... < K < A < 2）を考えます。
これは大富豪だけのルールなので、`@core` には**入れません**。
`@core` が渡すのは「順序から強さの関数を作る道具」だけです。

```ts
// src/games/daifugo/logic.ts
import { createRankStrength } from "@core";
import type { Rank } from "@core";

// 大富豪の強さ。core はこの並びを知らない
const DAIFUGO_ORDER: readonly Rank[] = [
  "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2",
];

const strength = createRankStrength(DAIFUGO_ORDER);

export function isStronger(a: Rank, b: Rank): boolean {
  return strength(a) > strength(b);
}
```

革命が起きたら、逆順の配列から作った関数に差し替えるだけです。
`@core` は最後まで大富豪を知りません。
（もし `@core` に `daifugoStrength` を足していたら、革命のたびに共通基盤を直すことになり、
9人全員の Pull Request に影響が出ます。）

| 置き場所 | 例 |
|---|---|
| `@core`（仕組み） | 52枚を作る / seed 付きシャッフル / 手番を回す / 順序から強さの関数を作る |
| `games`（ルール） | 3 < ... < A < 2 / 8切り / 革命 / ダウトの宣言 / 7の隣にしか置けない / ポーカーの役の強さ / ジョーカーは1枚 |

`@core` に機能が足りないと思ったときは、自分で足さずに手を止めてください。
多くの場合は既存の関数の組み合わせで実現できます。報告の書き方は
[docs/harness.md](harness.md) と `src/core/CLAUDE.md` にあります。

## テストの置き場所

| 置き場所 | 中身 | 誰が書くか |
|---|---|---|
| `src/games/<ゲームID>/logic.test.ts` | ルールのテスト。**ここが評価対象** | 担当者本人 |
| `src/games/<ゲームID>/<Xxx>Game.test.tsx` | 画面のテスト（任意） | 担当者本人 |
| `src/core/` と `src/components/` の `*.test.ts(x)` | 共通基盤のテスト | 運営 |
| `tests/contract/` | 9人共通の約束を守る契約テスト | 運営 |

契約テストは4本です。担当箇所の変更によって失敗することもあるため、各テストの検査内容を確認しておいてください。

| ファイル | 何を検査するか |
|---|---|
| `registry.contract.test.ts` | 9ゲーム + お手本がすべて見つかるか / 読み込めないゲームが無いか / `id` とフォルダ名が一致するか / **担当者が重複していないか（1人1ゲーム）** / 担当者・ゲーム名・難易度が `harness/config.json` と一致するか |
| `manifest.contract.test.tsx` | 必須ファイル（`index.ts` `logic.ts` `logic.test.ts` `README.md` と `<Xxx>Game.tsx`）が揃っているか / README に `## 遊び方` `## ルール` `## 実装メモ` があるか / name 20文字・description 60文字などの上限を守っているか / `status` が `"ready"` ならテスト3件以上（`skip` 無し）かつ `GameShell` を使って描画できるか |
| `boundaries.contract.test.ts` | 担当フォルダの外を相対パスで参照していないか / 他の人のゲームを参照していないか / `@core/...` `@ui/...` の深い import が無いか / `logic.ts` `cpu.ts` `rules.ts` に `Math.random` `Date.now` `new Date()` `setTimeout` `setInterval` や react が無いか / `eslint-disable` を書いていないか |
| `arcade.contract.test.tsx` | 9人全員のゲームがタイルとして並ぶか / 担当者の表示名がタイルに出るか / お手本が別枠で出るか / COMING SOON の数が実態と合うか / 「公開中 n / 9」の数が合っているか / 読み込めなかったゲームが画面に出るか（白画面にしない） |

`arcade.contract.test.tsx` があるおかげで、**研修が始まる時点で9人分のタイルが並んでいること**が
機械で保証されます。そのため、初日から担当箇所を確認できます。

実行はどれも `npm test`（= `vitest run`）でまとめて走ります。
`npm run verify` はそこに範囲チェック・lint・型チェック・ビルドを足したもので、CI とまったく同じ列です。

## 次に読むもの

- 実装を始める → [docs/game-plugin-guide.md](game-plugin-guide.md)
- 自分のゲームのルール → [docs/games/](games/)
- 止められて理由が分からない → [docs/harness.md](harness.md)
- エラーで詰まった → [docs/troubleshooting.md](troubleshooting.md)
