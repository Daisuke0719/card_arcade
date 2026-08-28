# Claude Code × GitHub共同開発ハンズオン設計書

## みんなでつくる CARD ARCADE

---

## 1. 研修概要

### 1.1 研修タイトル

**Claude Code × GitHub共同開発ハンズオン — みんなでつくる CARD ARCADE**

### 1.2 コンセプト

共通のトランプ基盤とハーネス（開発の逸脱を防ぐ仕掛け）を運営側で用意し、参加者がチームごとに異なるカードゲームを開発する。各チームは Claude Code を使って既存コードを理解し、担当ゲームを実装して、テスト、Commit、Push、Pull Request、相互レビュー、修正、マージ、公開までを経験する。

研修開始時点では、ゲームセンターの共通画面と、運営が用意したお手本1本だけが存在する。6枚のタイルはすべて `[ COMING SOON ]` になっている。

```text
CARD ARCADE                       公開中 0 / 6 ゲーム

┌───────────────┐ ┌───────────────┐
│ 🃏 ババ抜き    │ │ 🧠 神経衰弱    │
│ [COMING SOON] │ │ [COMING SOON] │
│ 初級   Team A │ │ 初級   Team B │
└───────────────┘ └───────────────┘
┌───────────────┐ ┌───────────────┐
│ ⚡ スピード    │ │ 🎋 七並べ      │
│ [COMING SOON] │ │ [COMING SOON] │
│ 中級   Team C │ │ 中級   Team D │
└───────────────┘ └───────────────┘
┌───────────────┐ ┌───────────────┐
│ 🤥 ダウト      │ │ 👑 大富豪      │
│ [COMING SOON] │ │ [COMING SOON] │
│ 中級   Team E │ │ 上級   Team F │
└───────────────┘ └───────────────┘

お手本（運営が用意した参照実装）
┌───────────────┐
│ 🎴 ハイ＆ロー  │  ← 最初から遊べる
└───────────────┘
```

各チームの Pull Request がマージされるたびに、タイルがグレースケールから色つきに変わり、実際に遊べるゲームが増えていく。

```text
CARD ARCADE                       公開中 6 / 6 ゲーム

[ 🃏 ババ抜き ]  [ 🧠 神経衰弱 ]
[ ⚡ スピード ]  [ 🎋 七並べ   ]
[ 🤥 ダウト   ]  [ 👑 大富豪   ]
```

最後に、公開された CARD ARCADE を全員でプレイし、人気投票と振り返りを行う。

### 1.3 想定条件

| 項目 | 想定 |
|---|---|
| 研修時間 | 180分（Step 1 〜 Step 18） |
| 事前課題 | 前日までに P-1 〜 P-6（環境構築と `npm run doctor`） |
| チーム数 | 6チーム |
| チーム人数 | 1チーム3〜5名 |
| 対象者 | GitHub・Claude Code 初級〜中級 |
| 開発形式 | 共有 GitHub リポジトリにコラボレーターとして参加（fork はしない） |
| 成果物 | GitHub Pages で公開されるブラウザゲーム集 |
| 端末 | Windows / PowerShell を前提に手順を記述（`docs/handson-steps.md`） |

180分でトランプゲームを1本仕上げること自体は、この研修の主目的ではない。**主目的は「他人と同じリポジトリで、壊さずに、説明できる変更を入れる」体験**であり、ゲームはそのための題材である。

### 1.4 ゲームを日本のトランプゲームに変えた理由

初版は High & Low / War / 神経衰弱 / Blackjack / Poker Hand Challenge / Target 21 の6本だった。これを日本人になじみ深い6本に全面改編した。

| 初版の課題 | 改編後 |
|---|---|
| Blackjack・Poker はルール説明に時間がかかる。「エースを1か11で数える」「役の強さ」を覚える時間が、Git とレビューの時間を食う | ババ抜き・神経衰弱・七並べ・大富豪は**ルール説明が不要**。実装に入るまでの立ち上がりが速い |
| High & Low と War、Blackjack と Target 21 は構造が似すぎていて、相互レビューが「同じものを2回見る」になる | 手札交換（ババ抜き）／記憶（神経衰弱）／同時進行（スピード）／場札の連結（七並べ）／宣言と嫌疑（ダウト）／複数枚出しと強さ（大富豪）と、**状態の持ち方が6本すべて異なる** |
| 1人プレイのゲームが多く、「ターン」「順位」という共通基盤を使う場面が少ない | 6本中5本が CPU 対戦。`TurnState`・`neighborId`・`rankByFinishOrder` を全チームが使うので、共通基盤の学習が全員に効く |
| ローカルルールの差が小さく、「仕様を決める」練習にならない | 大富豪・七並べ・ダウトは家庭ごとにルールが違う。**「どのルールを採用したか」を README に書かせる**ことが、そのまま仕様記述の練習になる |

チームとゲームの対応は `harness/config.json` を単一の真実源とし、CLAUDE.md・Issue 本文・手順書・scaffold・契約テストがすべてそこを読む。

| チーム | ゲームID | ゲーム | 難易度 | 構成 | レビュー担当 |
|---|---|---|---|---|---|
| Team A | `babanuki` | ババ抜き | 初級 | 人間1 + CPU3・53枚 | Team B |
| Team B | `shinkeisuijaku` | 神経衰弱 | 初級 | ソロ・8組16枚 | Team C |
| Team C | `speed` | スピード | 中級 | 人間1 + CPU1 | Team D |
| Team D | `shichinarabe` | 七並べ | 中級 | 人間1 + CPU3 | Team E |
| Team E | `doubt` | ダウト | 中級 | 人間1 + CPU3 | Team F |
| Team F | `daifugo` | 大富豪 | 上級 | 人間1 + CPU3・基本 + 8切り + 革命のみ | Team A |

### 1.5 ハーネスを設計に加えた理由

Claude Code は指示に無いことも「良かれと思って」やる。共通基盤に足りない関数があれば追加し、必要そうなライブラリがあれば `npm install` し、他チームのフォルダを参考にしようとして読み書きする。研修という時間制約の中では、**その1回が6チーム全員を巻き込んで止める**。

そこで、参加者の善意や記憶力に頼らずに開発の逸脱を防ぐ仕掛けを「ハーネス」と呼び、設計対象として明示的に置いた。5層構成と硬さの基準は第9章で述べる。本章では次の1行だけを共有する。

> **編集してよいのは `src/games/<自分のゲームID>/` の中だけ。**

この1行を、README・CLAUDE.md・Claude Code のフック・ESLint・pre-commit・CI・CODEOWNERS の7か所が、それぞれの言い方で同じことを言う。

---

## 2. 研修の目的

### 2.1 全体ゴール

参加者が、Claude Code と GitHub を利用した共同開発の一連の流れを、**公開まで**経験する。

```text
GitHub Issue を確認
  → 共有リポジトリを取得（clone / npm ci / npm run doctor）
  → 既存コードとルールを理解（CLAUDE.md / example-game）
  → 作業ブランチを作成（feature/<ゲームID>）
  → 雛形を生成（npm run scaffold）→ 最初の commit → Draft PR
  → /kickoff で計画を立て、人間が計画をレビューする
  → Claude Code で担当ゲームを実装（logic.ts → 画面）
  → ローカルで動作確認（npm run dev で最初から最後まで1回遊ぶ）
  → 自動テストを実行（npm test）
  → npm run verify が緑になる（CI とまったく同じ列）
  → Commit・Push
  → Pull Request を Ready にする
  → 別チームがレビューする
  → 指摘を反映して再検証
  → マージ
  → GitHub Pages に自動デプロイ
  → 公開されたプロダクトを全員で遊ぶ
```

初版との違いは、**「Draft PR を先に作る」**と**「計画を人間がレビューする」**の2つを流れに組み込んだこと。前者は「PR は完成してから作るもの」という誤解を最初に壊すため、後者は AI が書いたコードではなく **AI に書かせる前の判断**を人間の仕事として体験させるためである。

### 2.2 学習目標

研修終了時点で、参加者が次の内容を理解・実行できる状態を目指す。

**リポジトリとルールを読む**

- 既存リポジトリの構造と、運営管理／参加者担当の境界を確認できる
- `CLAUDE.md` が「AI に読ませる規約ファイル」であることを理解し、その内容を自分でも守れる
- 共通基盤（`@core` / `@ui`）に何があるかを、入口の1ファイルから把握できる
- GitHub Issue から実装要件（必須要件・完了条件）を読み取れる

**Claude Code を道具として使う**

- Claude Code にコードベースを調査させ、実装前に計画を出させられる
- 出てきた計画を人間がレビューし、Issue の要件との差分を指摘できる
- `/kickoff` `/implement` `/verify` `/pr` のように、**役割を分けたコマンドで AI に段階的に作業させられる**
- AI の出力を鵜呑みにせず、実機で遊ぶ・テストのアサーションをわざと逆にして赤くなることを見る、という方法で検証できる

**壊さずに変更を入れる**

- 作業ブランチを作成し、変更を分離できる
- 自分の担当範囲の外に手を出していないことを、機械のチェック（`npm run scope`）で確認できる
- 共通基盤に手を入れたくなったとき、自分で直さずに相談するという判断ができる
- 依存を勝手に追加しないことの理由を説明できる
- ハーネスに止められたとき、迂回策を探さずに正しい行動へ切り替えられる

**品質を自分で担保する**

- ゲームロジックに対するテストを作成できる（境界値・禁止操作・seed 固定）
- 純粋関数と副作用（時間・乱数・DOM）を分けて書ける
- `npm run verify` が緑であることを「できた」の定義として使える

**共同開発として仕上げる**

- Pull Request で変更内容を自分の言葉で説明できる
- 他チームの Pull Request をレビューし、実際に動かして確かめた上で指摘できる
- レビュー指摘を反映して再度検証できる
- 複数チームの変更が1つのプロダクトに統合される様子を確認できる

### 2.3 今回扱わないもの

共同開発の体験に集中するため、次の要素は対象外とする。

| 扱わないもの | 理由 |
|---|---|
| ログイン・ユーザー認証 | サーバーが要る。研修時間に対して割に合わない |
| データベース | 記録は LocalStorage で足りる |
| サーバーサイド開発 | GitHub Pages（静的配信）で完結させる |
| リアルタイム対戦 | 通信の失敗が「自分のコードのバグ」と切り分けられなくなる |
| **複雑な CPU AI** | 下記の但し書きを参照 |
| カード画像の制作 | カードは CSS だけで描く。素材の用意がボトルネックにならない |
| 外部 API との連携 | ランタイム依存を `react` / `react-dom` だけに保つ |
| スマートフォンアプリ化 | ブラウザで完結させる |
| ゼロからのデプロイ環境構築 | GitHub Actions と Pages は運営が用意済み |
| 新しいライブラリの選定 | 依存追加は禁止。選定の議論に時間を使わせない |

**CPU についての但し書き**

CPU 対戦そのものは扱う。6ゲーム中5ゲームが CPU 相手である。**扱わないのは「強い CPU」であって「CPU」ではない。**

- 単純なルールベース（出せる中からランダムに選ぶ、弱いカードから出す、一定確率でダウトを宣言する）で十分とする
- 探索・評価関数・学習は作らない
- CPU の判断は `cpu.ts` に純粋関数として置き、乱数は引数の `Rng` で受け取る（テストで固定できる形にする）

この線引きは `CLAUDE.md` と `src/games/CLAUDE.md` の両方に明記してある。放っておくと Claude Code は CPU を強くすることに時間を使い、必須要件が終わらないためである。

---

## 3. 採用技術

実物の `package.json` に入っているものがすべてである。

### 3.1 ランタイム依存（2つだけ）

| パッケージ | バージョン | 用途 |
|---|---|---|
| `react` | ^19.2.8 | UI |
| `react-dom` | ^19.2.8 | DOM への描画 |

**依存を2つに絞った理由。** 依存が増えるほど、参加者が「これは何のライブラリか」を調べる時間が増える。加えて、`npm install` が1回でも走ると `package-lock.json` が変わり、他の5チームの CI が巻き添えで落ちる。そこで「必要なものは `@core` と `@ui` に全部ある」と言い切れる状態を作り、依存追加そのものを禁止した。

この禁止は3か所で守っている。

| 場所 | 止め方 |
|---|---|
| `CLAUDE.md`（絶対に守る5条の2番） | 文章で伝える |
| `.claude/settings.json` の `deny` | `npm install *` `npm i *` `yarn add *` `pnpm add *` `bun add *` を実行させない |
| `.github/workflows/ci.yml` | `git diff --exit-code -- package.json package-lock.json` が変更を検出したら落とす |

### 3.2 開発時の依存

| 分類 | パッケージ | バージョン | 選定理由 |
|---|---|---|---|
| ビルド | `vite` | ^8.2.2 | 起動が速く、`import.meta.glob` が使える。この glob が第4章の「競合ゼロ」の土台 |
| | `@vitejs/plugin-react` | ^6.1.1 | React の HMR |
| 言語 | `typescript` | ^6.0.3 | `strict`。ジョーカーの考慮漏れを型で検出させる（5.1） |
| | `@types/react` / `@types/react-dom` / `@types/node` | ^19.2.18 / ^19.2.5 / ^26.4.0 | 型定義 |
| テスト | `vitest` | ^4.1.11 | Vite と設定を共有できる。テスト専用のビルド設定を参加者に見せなくて済む |
| | `@vitest/coverage-v8` | ^4.1.11 | CI でカバレッジを出す |
| | `jsdom` | ^29.1.1 | 画面テストの実行環境 |
| | `@testing-library/react` | ^16.3.3 | `getByLabelText("スペードのA")` で書けるようにする |
| | `@testing-library/jest-dom` | ^7.0.1 | `toBeInTheDocument` などの表明 |
| | `@testing-library/user-event` | ^14.6.6 | クリック操作の再現 |
| Lint | `eslint` | ^10.9.1 | フラットコンフィグ。**フォルダごとに違うルールを当てる**のに使う（第9章） |
| | `@eslint/js` | ^10.0.1 | 推奨ルール |
| | `typescript-eslint` | ^8.68.0 | TypeScript 向けルール |
| | `eslint-plugin-react-hooks` | ^7.1.1 | フックの依存配列 |
| | `eslint-plugin-react-refresh` | ^0.5.5 | HMR が壊れる書き方を検出 |
| | `globals` | ^17.11.0 | グローバル定義 |
| 整形 | `prettier` | ^3.9.6 | 整形の議論をレビューから消す。保存時とフック（`format-file.mjs`）で自動適用 |

Node.js は `package.json` の `engines` で `>=22.0.0`、`.nvmrc` と CI の `setup-node` も 22 に揃えてある。事前課題の `npm run doctor` が最初に見るのもこのバージョンである。

### 3.3 npm scripts

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm test` | Vitest（1回実行） |
| `npm run verify` | **範囲チェック → lint → 型 → テスト → ビルド → 成功の記録** |
| `npm run scope` | 担当範囲チェックだけ |
| `npm run scaffold` | 自分のゲームの雛形を生成 |
| `npm run doctor` | 環境チェック |
| `npm run status` | 今の状態（ブランチ・差分・verify）をまとめて表示 |
| `npm run lint` / `lint:fix` / `typecheck` / `format` / `build` / `preview` | 個別実行 |

参加者に覚えてもらうのは `dev` / `test` / `verify` の3つだけにしてある。`verify` の列は CI の列とまったく同じ順序で、落ちやすく速いものから並べてある（範囲チェックは40秒以内に結果が出る）。

### 3.4 その他の採用

| 項目 | 採用 | 理由 |
|---|---|---|
| リポジトリ | GitHub（1リポジトリ共有） | fork 運用にすると PR の向き先で必ず迷う。コラボレーター招待にして「同じリポジトリの別ブランチ」に統一した |
| CI | GitHub Actions | 必須チェックは `verify` の1本だけ（第9章 Layer 4） |
| 公開 | GitHub Pages | サーバー不要。`base: "./"` にしてサブパス配信でも `dist` の直開きでも動く |
| AI 開発支援 | Claude Code | 規約は `CLAUDE.md` 4枚、作業手順は `.claude/commands/` のスラッシュコマンドで与える |
| データ保存 | ブラウザ内の状態 + LocalStorage | 記録は `@core` の `useHighScore` 経由に限定し、キーの衝突を構造的に無くす |
| ルーティング | **自前のハッシュルータ**（`src/app/router.ts`） | 下記 |
| スタイル | **CSS Modules**（Vite 標準機能） | 下記 |

**react-router を入れず自前ハッシュルータにした理由。**

`src/app/router.ts` は `useSyncExternalStore` で `hashchange` を購読するだけの約60行である。

- GitHub Pages はサーバー側のリライト設定ができない。`/games/babanuki` のようなパスでリロードすると 404 になる。ハッシュ（`#/games/babanuki`）なら常に `index.html` が返る
- 依存が1つ増えると、参加者が覚えることが1つ増える。今回のルートは「一覧」「ゲーム1本」「見つからない」の3つだけで、ライブラリを入れる理由がない
- ルータのメジャーバージョン差で Claude Code が古い書き方を出す事故を、そもそも起こさない

ルートの定義も3つだけで、ゲーム側はルーティングを一切意識しない（`@core` にも `@ui` にもルータは出てこない）。

**CSS Modules を選んだ理由。**

- Vite に最初から入っており、依存が増えない（Tailwind も CSS-in-JS も追加パッケージが要る）
- ファイル単位でクラス名が閉じるので、**6チームが同じクラス名（`.card` `.board` `.actions`）を使っても衝突しない**。共同開発の題材として、この性質がそのまま効く
- 色と余白は `src/styles/tokens.css` の `--ca-*` 変数を使う規約にしてある。6チームが別々に色を決めると、統合したときに1つのアーケードに見えなくなるため

---

## 4. 共同開発の基本方針

### 4.1 開発単位

全員で1つのゲームを作るのではなく、**1チーム1ゲーム**を担当する。

この方式により、次の効果を狙う。

- チーム間のファイル競合を減らす（4.3 で「ゼロ」にする）
- ゲーム単位で責任範囲を明確にする（誰の PR がどこを壊したかが自明になる）
- チームの習熟度に応じて難易度を割り当てられる（初級2・中級3・上級1）
- Pull Request ごとに独立したレビューを行える（Team A → B → C → D → E → F → A の輪番）
- マージされるたびにプロダクトが目に見えて成長する

### 4.2 編集範囲

参加者に伝えるルールは1行である。

> **編集してよいのは `src/games/<自分のゲームID>/` の中だけ。例外はない。**

ゲームフォルダの中は5ファイル固定（必要なら `cpu.ts` / `types.ts` / `*.module.css` を足してよい）。

```text
src/games/<ゲームID>/
├─ index.ts            ゲームの公開情報（GameManifest）。完成したら status を "ready" にする
├─ <Xxx>Game.tsx       画面。見た目と「時間」だけを担当する
├─ logic.ts            ルール。純粋関数だけを書く
├─ logic.test.ts       ロジックのテスト。ここが評価対象
└─ README.md           遊び方 / ルール / 実装メモ
```

次の場所は運営管理とし、参加者は変更しない。一覧は `harness/config.json` の `protectedPaths` が正であり、`.claude/settings.json` の `deny`・`.github/CODEOWNERS`・`scripts/scope-guard.mjs` はすべて同じ定義を参照している。

```text
src/core/  src/components/  src/app/  src/pages/  src/styles/  src/test/
src/games/CLAUDE.md   src/games/example-game/
docs/  tests/  templates/  scripts/  harness/
.github/  .claude/  .githooks/  public/  .vscode/
package.json  package-lock.json  tsconfig.json  vite.config.ts  eslint.config.js
index.html  CLAUDE.md  README.md
```

**他チームのゲームフォルダも「範囲外」である。** 参考に読むのは自由だが、書き込みは運営管理の場所と同じ扱いで止まる。相対パスでの import も ESLint が禁止している（「自分のゲームフォルダの外を相対パスで参照しないでください。共通機能は @core と @ui から import します。」）。

範囲外を編集しようとしたときに何が起きるかは、**参加者に事前に見せておく**（当日 Step 4 の講師デモで実演する）。「止められた」ではなく「早く気づけた」と受け取ってもらうためである。新しいライブラリの追加や共通基盤の変更が必要だと判断した場合の正解は、自分で直すことではなく**手を止めて講師に相談する**ことだと `CLAUDE.md` に明記してある。

### 4.3 マージ時の競合を防ぐ仕組み

初版でも `import.meta.glob` による自動検出を採用していたが、今回はその性質をより強く言い切れる形に詰めた。

> **一覧ファイルも登録用の配列も存在しない。したがって、6つの Pull Request が同時にマージされても、git が競合を起こす共通ファイルが1つも無い。**

`src/app/registry/loadGames.ts` の該当部分をそのまま引用する。

```ts
/**
 * src/games/<id>/index.ts を自動で集める。
 *
 * 一覧ファイルも登録用の配列も存在しないので、
 * 6チームの Pull Request が同時にマージされても
 * git が競合を起こす共通ファイルが1つも無い。これが「競合ゼロ」の仕組み。
 */
const modules = import.meta.glob<unknown>("../../games/*/index.ts", {
  eager: true,
  import: "game",
});
```

`import: "game"` を指定しているので、glob は各 `index.ts` の **`game` という名前の export だけ**を取り出す。ゲーム側がすべきことは `export const game: GameManifest = { ... }` を書くことだけで、**どこにも自分を登録しに行かない**。

検討した他の方式との比較。

| 方式 | 6チームが同時にマージすると | 判定 |
|---|---|---|
| `games.ts` に配列を書いて import する | 全チームが同じ行の近くを編集する。**必ず競合する** | 却下 |
| `registry.register(game)` を各ゲームが起動時に呼ぶ | 呼び出し忘れが起きる。読み込み順に依存する | 却下 |
| ルータに `<Route>` を1行ずつ足す | 同上。加えてルータの依存が要る | 却下 |
| **`import.meta.glob` で自動検出** | 共通ファイルの変更が0行。**競合しようがない** | 採用 |

参加者が触る共通ファイルが無いということは、**「マージの順番を気にしなくてよい」**ということでもある。6チームが同時に Ready にしても、講師は届いた順にマージしてよい。研修終盤の115〜152分に PR が集中するため、この性質が時間割そのものを支えている。

競合が無い代わりに、「壊れた `index.ts` が1つ混ざったらアーケード全体が落ちる」という別のリスクが生まれる。これには2つの手当てをしている。

1. `src/app/registry/validateManifest.ts` は**例外を投げない**。問題があってもそのゲームだけを一覧から外し、画面上部に「読み込めなかったゲームがあります」として理由を日本語で表示する。他の5チームは動き続ける
2. `tests/contract/registry.contract.test.ts` が「読み込めないゲームが1つも無い」「`harness/config.json` に書かれたゲームがすべて見つかる」「id がフォルダ名と一致している」「チームが重複していない」を CI で検査する

実行時エラーについても同様に、`src/app/GameErrorBoundary.tsx` が**そのゲームの中に閉じ込める**。1チームのバグで CARD ARCADE 全体が白画面になることはない。

---

## 5. 共通基盤の設計

共通基盤は `@core`（ロジック）と `@ui`（画面部品）の2つだけである。エイリアスもこの2つだけで、`vite.config.ts` と `tsconfig.json` の両方に**完全一致**で定義してある。

```ts
// vite.config.ts — 配列（正規表現）で書く
alias: [
  { find: /^@core$/, replacement: ".../src/core/index.ts" },
  { find: /^@ui$/,   replacement: ".../src/components/index.ts" },
]
```

オブジェクト形式で書くと前方一致置換になり、`@core/deck` が `src/core/index.ts/deck` に化けて分かりにくいエラーになる。正規表現の完全一致にしておくと、**深い import はモジュール解決の時点で失敗する**。ESLint を `eslint-disable` コメントで無効化されても、公開 API の境界は破れない。

「入口が1ファイル」であることには、AI に対する効果もある。Claude Code に「使えるものを探せ」と言うと `src/core/**` を全部読みに行くが、`src/core/index.ts` に全機能が並んでいるので探索が1ファイルで終わる。`src/games/CLAUDE.md` にも「ここに無いものは無い（探し回らなくてよい）」と明記した。

### 5.1 カード基盤

`@core` が公開している機能（`src/core/index.ts` にあるものがすべて）。

| 分類 | 公開している関数・定数 |
|---|---|
| 定数 | `SUITS` `RANKS` `SUIT_SYMBOL` `SUIT_COLOR` `SUIT_NAME_JA` `RANK_ORDER_ACE_LOW` `RANK_ORDER_ACE_HIGH` |
| 判別 | `isStandard` `isJoker` `partitionJokers` |
| 表示・識別 | `cardId` `cardLabel`（"スペードのA"）`cardShortLabel`（"♠A"） |
| 比較 | `sameRank` `sameSuit` `compareRank` `compareCard` |
| 数値変換 | `rankToNumber`（A=1 … K=13）`numberToRank` `cycleRank`（K の次は A） |
| 強さの順序 | `createRankStrength(order)` |
| 並べ替え | `sortCards` `groupByRank` `groupBySuit` |
| 山札 | `createDeck`（52枚）`createDeckWithJokers` `createJokers` `draw` `drawMany` `deal` `returnToDeck` `first` `last` `requireCard` |
| 乱数 | `createRng` `shuffle` `pickRandom` `pickRandomIndex` `mulberry32` `hashSeed` |
| プレイヤー・ターン | `createPlayers` `createSoloVsCpu` `createTurnState` `nextTurn` `neighborId` `finishPlayer` `reverseDirection` `alivePlayers` `findPlayer` `isCurrent` `isFinished` `isOver` |
| スコア・順位 | `rankByScore` `rankByFinishOrder` `formatRank` `formatDuration` |
| 保存 | `gameKey` `useHighScore` `loadHighScore` `saveHighScore` `readJson` `writeJson` `removeKey` |
| セッション | `useGameSession` `sessionReducer` `initialSession` `assertNever` |
| フック | `useCpuTurn` `useElapsedMs` `useCountdown` |
| テスト補助 | `card` `hand` `joker` |

補足として、保存はキーの作り方を1本に固定してある。`gameKey(gameId, name)` が返すのは `` `card-arcade:v1:${gameId}:${name}` `` という**テンプレートリテラル型**（`StorageKey`）で、それ以外の形の文字列は `writeJson` に渡せない。ゲーム側からの `localStorage` 直接参照は ESLint が禁止しているため、6チームがキー名で衝突することが構造的に起きない。

**ジョーカーの型設計。** 今回のラインナップではババ抜きだけがジョーカーを使う。この1本のために残り5本へ負担をかけない、というのが設計上の争点だった。

```ts
export type PlayingCard = {
  readonly kind: "standard";
  readonly id: CardId;      // 例: "spades-A"
  readonly suit: Suit;
  readonly rank: Rank;
};

export type JokerCard = {
  readonly kind: "joker";
  readonly id: CardId;      // 例: "joker-red"
  readonly color: "red" | "black";
};

export type AnyCard = PlayingCard | JokerCard;
```

検討した3案と結論。

| 案 | 内容 | 判定 |
|---|---|---|
| A | `PlayingCard` に `rank?: Rank` を足し、ジョーカーは `rank` 無しにする | **却下。** 全ゲームで `card.rank` が `Rank \| undefined` になり、ババ抜き以外の5チームが不要な `??` と `!` を書く羽目になる |
| B | ジョーカーを `rank: "JOKER"` として `Rank` を1つ増やす | **却下。** `rankToNumber` が壊れ、`RANKS.length` が 13 でなくなる。神経衰弱・スピード・七並べのループが全部おかしくなる |
| C | **`kind` 判別子つきの別型にして、union は `AnyCard` にだけ持たせる** | **採用** |

C を採ったことで、次の2つが同時に成立する。

- `createDeck()` の戻り値は **`PlayingCard[]` のまま**。型を `AnyCard[]` に広げない。ババ抜き以外の5ゲームは「ジョーカーかもしれない」を一切意識しなくてよい
- ババ抜きは `createDeckWithJokers()` で `AnyCard[]` を受け取る。`AnyCard` に対していきなり `.rank` を読むと**コンパイルエラーになる**ので、考慮漏れがビルド時に分かる

`Deck<T extends AnyCard = PlayingCard>` の既定型引数も同じ思想で、何も指定しなければ52枚側の型になる。

さらに、ジョーカー特有のルールを書きやすくする関数を2つ用意した。

- `sameRank(a, b)` はどちらかがジョーカーなら常に `false` を返す。「ジョーカーはペアにならない」がそのまま表現される
- `partitionJokers(cards)` は通常カードとジョーカーに分ける。ババ抜きの配札直後のペア掃除は「分けてから通常カードだけをペア判定する」で書ける

### 5.2 プレイヤーとターンの管理

CPU 対戦が5本あるため、ターン管理は共通基盤側に置いた。

```ts
export type TurnState = {
  readonly players: readonly Player[];
  readonly currentId: PlayerId;
  readonly direction: 1 | -1;                // 1 = 並び順どおり / -1 = 逆回り
  readonly finishedIds: readonly PlayerId[]; // 上がった順。そのまま順位になる
};
```

| 関数 | 役割 |
|---|---|
| `createSoloVsCpu(3)` | 「あなた + CPU 3人」を一発で作る。ババ抜き・七並べ・ダウト・大富豪はこれで足りる |
| `nextTurn(state)` | 次の手番へ。**上がった人は自動的に飛ばす** |
| `finishPlayer(state, id)` | 上がり処理。手番だった人が上がったら次の人へ移す |
| `reverseDirection(state)` | 逆回りにする |
| `alivePlayers` / `isOver` | まだ上がっていない人／残り1人以下か |

**`neighborId` を用意した理由。** ババ抜きの中心ルールである「左隣の人から1枚引く」は、素直に書くと「現在位置を探す → 方向を見る → 上がった人を飛ばしながら進む → 一周したら諦める」という20行ほどのループになる。これは6ゲーム中3ゲーム（ババ抜き・七並べ・ダウト）で必要になり、しかも**間違えても一見動いてしまう**（上がった人を飛ばし忘れても、残り2人になるまで誰も気づかない）。だから core 側に置いた。

```ts
// ババ抜き: 左隣から引く
const targetId = neighborId(state.turn);      // 上がった人は自動で飛ばす。自分だけなら undefined

// 2人先を見たいときは offset を渡す
const twoAhead = neighborId(state.turn, 2);
```

`direction` を見るので、逆回りが要るゲームでも同じ1行で済む。`nextTurn` も `finishPlayer` も内部では `neighborId` を呼んでいるので、「上がった人を飛ばす」規則がリポジトリ全体で1か所にしかない。

順位も同じ考え方で、`finishedIds` の並びをそのまま `rankByFinishOrder(finishedIds, players)` に渡せば順位表になる。上がれなかった人（ババを持っていた人）は自動的に最後尾へ回る。

### 5.3 共通UIコンポーネント

`@ui` が公開しているのは12個。`src/components/index.ts` にあるものがすべてである。

| コンポーネント | 役割 | 主な利用者 |
|---|---|---|
| `Card` | トランプ1枚。空きスロット・裏向き・選択中・強調・無効を表現する | 全ゲーム |
| `Hand` | 手札。`row` / `fan` / `grid` / `stack` の4レイアウト | 全ゲーム |
| `DeckPile` | 山札・捨て札・場札。残り枚数と一番上のカード | スピード・ダウト・七並べ |
| `GameShell` | 画面の外枠。タイトル・難易度・人数・遊び方・「もう一度」「アーケードへ」 | 全ゲーム（必須） |
| `GameTile` | 一覧の1枚。COMING SOON はグレースケール | アーケード画面 |
| `Button` | `primary` / `secondary` / `ghost` / `danger` | 全ゲーム |
| `ScoreBoard` | 各プレイヤーの状態。手番の強調・上がった人の淡色表示 | CPU 対戦の5本 |
| `Timer` | 経過時間・残り時間の表示（刻むのは `@core` のフック） | 神経衰弱・スピード |
| `ResultModal` | 結果画面。順位表・「もう一度」「アーケードへ」 | 全ゲーム |
| `GameInstructions` | `manifest.howToPlay` を折りたたみ表示 | `GameShell` が自動で使う |
| `LogPanel` | 「CPU 1 が ♠7 を出しました」のような進行ログ | ダウト・大富豪・七並べ |
| `ComingSoonPanel` | 未実装ゲームの中身（6.3 参照） | 研修開始時点の6ゲーム |

**`Card` の裏向き規約。** 2つの規約をコンポーネント側で固定している。

```tsx
if (face === "down") {
  // ここで card の中身を参照しないことが規約そのもの
  return <button {...commonProps} aria-label="裏向きのカード" />;
}
```

1. **`face="down"` のとき、スート・ランク・ラベルを DOM に一切出さない。** 神経衰弱で DevTools を開けば答えが分かる状態を防ぐと同時に、「DOM を覗いて正解を確かめるテスト」を書けなくする。テストは `logic.ts` を通すしかなくなる
2. **`face="up"` のとき `aria-label` は必ず `cardLabel(card)`**（例: `"スペードのA"`）。6チームのテストが `getByLabelText("スペードのA")` に揃い、レビュアーが読み方を覚え直さなくて済む

**`Hand` の `hidden` variant。** `Hand` の props は判別可能ユニオンになっていて、`variant="hidden"` のときは `cards` を受け取らず `count: number` だけを受け取る。

```tsx
<Hand variant="hidden" count={state.hands["cpu-1"].length} label="CPU 1" />
```

`variant="open"` に `face="down"` を渡しても見た目は裏向きになるが、それだと**実カードのオブジェクトが DOM ツリーに入る**。ダウトのように「相手の手札を知られたら成立しないゲーム」では、型のレベルで渡せなくしておくほうが安全である。

2つの口を使い分ける基準はこうなる。

| 場面 | 使うもの |
|---|---|
| 他プレイヤーの手札を「枚数だけ」見せる | `variant="hidden"`（ダウト・大富豪・七並べ） |
| 裏向きのカードを**実際にクリックさせる** | `variant="open"` + `face="down"`（ババ抜きで相手の手札から引く、神経衰弱の場札） |

`Hand` の `grid` レイアウトと `columns` は神経衰弱の 4×4 盤面のために、`selectedIds` は大富豪・ダウトの複数枚選択のために、`highlightedIds` はスピード・七並べの「今出せるカード」表示のために用意した。**6ゲームの必要が先にあって、そこから逆算して props を決めている。**

### 5.4 「core は仕組み、games はルール」の原則

共通基盤に何を入れて何を入れないかは、次の1文で判断する。

> **core が持つのは「どのゲームでも同じ形をしている仕組み」。games が持つのは「そのゲーム固有の決めごと」。**

具体例が大富豪のランクの強さである。大富豪では 3 が最弱で 2 が最強（3 < 4 < … < K < A < 2）だが、これは大富豪だけの決めごとであり、七並べでも神経衰弱でも成立しない。したがって core は**順序そのものを持たず、順序を受け取って強さの関数を作る仕組みだけ**を持つ。

```ts
// src/core/cards/index.ts — core が持つのはここまで
export function createRankStrength(order: RankOrder = RANK_ORDER_ACE_LOW): (rank: Rank) => number {
  const table = new Map<Rank, number>();
  order.forEach((rank, index) => table.set(rank, index));
  return (rank) => table.get(rank) ?? -1;
}
```

```ts
// src/games/daifugo/ — 大富豪のルールはゲーム側が作る
const strength = createRankStrength(["3","4","5","6","7","8","9","10","J","Q","K","A","2"]);

// 革命中は強さが反転する。これも大富豪固有なのでゲーム側に置く
const power = (rank: Rank) => (state.revolution ? -strength(rank) : strength(rank));
```

もし `RANK_ORDER_DAIFUGO` を core に置いたら何が起きるか。ダウトを担当する Team E が `@core` の一覧を読んだときに「大富豪用の定数」を目にして、自分にも関係があるのかと考える時間が発生する。革命の実装で Team F が core を変更したくなる。core が特定ゲームの都合で膨らみ、他の5チームのテストが道連れになるリスクが生まれる。**core に1行入れるコストは、常に6チーム分である。**

`RANK_ORDER_ACE_LOW`（A=1）と `RANK_ORDER_ACE_HIGH`（A が最強）の2つだけは core に置いてある。これは「複数のゲームが同じ順序を使う」から仕組み側と判断した。1チームしか使わない順序は games に置く。

**core に入れてはいけないものの一覧**（`src/core/CLAUDE.md` と同じ基準）。

| 入れない | 具体例 | どこに置くか |
|---|---|---|
| ゲーム固有のランク強さ | 大富豪の 3<…<A<2、革命による反転 | `src/games/daifugo/` |
| 役・組み合わせの判定 | 大富豪の「同じ数字の複数枚出し」「8切り」 | 各ゲームの `logic.ts` |
| ゲーム固有の状態型 | `BabanukiState` `DoubtAction` | 各ゲームの `logic.ts` |
| CPU の戦略 | ダウトを宣言する確率、七並べの温存判断 | 各ゲームの `cpu.ts` |
| 演出の待ち時間 | 神経衰弱の「2枚めくって見せる 900ms」 | 各ゲームの `logic.ts` の定数（5.5） |
| 盤面の初期配置 | 七並べの「♦7 を最初に置く」 | `src/games/shichinarabe/` |
| 勝敗の文言 | 「大貧民」「ババを持っていた人の負け」 | 各ゲームの画面 |
| 便利になりそうな汎用関数 | 「あったら使うかもしれない」もの | 入れない |

判断に迷ったときの基準は「**その関数を、他の5チームのうち何チームが使うか**」である。1チームしか使わないなら games に置く。

この原則は参加者に守らせるものでもある。`src/core/CLAUDE.md` と `src/components/CLAUDE.md` は「停止: ここは運営管理の領域です」という見出しで始まり、やってよいこと（読む）とやってはいけないこと（追加・編集・削除、`sed -i` や `cp` での書き換え、「ゲーム側から使いやすくするための小さな修正」）を並べ、**必要な機能が無いと思ったときは自分で追加せず人間に報告する**という手順を示している。

### 5.5 時間と乱数の扱い

共同開発で最も再現性を壊すのが時間（`setTimeout`）と乱数（`Math.random()`）である。この2つを**画面側に押し出し、ロジックから完全に追い出す**のが今回の設計の中核にあたる。

**乱数。** `logic.ts` と `cpu.ts` では `Math.random()` を書けない（ESLint がエラーにする）。乱数が要る関数は引数で `Rng` を受け取る。

```ts
export type Rng = () => number;                 // 0以上1未満を返す関数

createRng()          // seed 省略 → 実際にランダム（本番プレイ）
createRng(12345)     // seed 指定 → 毎回同じ並び（テスト）
createRng("team-a")  // 文字列 seed も可（hashSeed で数値化）
```

`shuffle` は Fisher-Yates で、元の配列を書き換えず新しい配列を返す。seed を固定すれば配札は毎回同じになるので、「たまに落ちるテスト」が構造的に発生しない。**乱数を作るのは画面側の役目**で、`useReducer` の初期化時に1回だけ `createInitialState(Math.floor(Math.random() * 100000))` として seed を渡す。

**時間。** ロジックは「今、何ミリ秒後に自動で次へ進めるべきか」を**返すだけ**にする。実際に待つのは画面側の1行だけである。

```ts
// logic.ts — 時間の概念を持たない。null は「人間の入力待ち」
export function reduce(state: S, action: A): S;
export function pendingDelayMs(state: S): number | null;
```

```tsx
// <Xxx>Game.tsx — 時間だけを担当する
useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
```

```ts
// src/core/hooks/index.ts
export function useCpuTurn(delayMs: number | null, onTick: () => void): void;
```

**なぜこの形にしたか。**

| 効果 | 内容 |
|---|---|
| テストから時間が消える | テストは `reduce(state, { type: "tick" })` を順番に呼ぶだけ。`vi.useFakeTimers()` も `await waitFor` も要らない。**研修時間内でテストが書ける**のはこれが理由 |
| CPU の連鎖が自然に直列化される | CPU 3人が続けて動く場面も、`pendingDelayMs` が値を返し続ける限り `tick` が繰り返されるだけ。`setTimeout` の入れ子を書く必要がない |
| 待ち時間が状態の関数になる | 「めくって見せている間は 900ms、入力待ちは null」を1つの関数に集約できる。演出の速さを変えたいときの変更点が1か所 |
| タイマーがアプリ内で1本になる | `useCpuTurn` が唯一のタイマー。二重起動やクリーンアップ漏れの調査先が1ファイルで済む |
| AI への指示が短くなる | 「CPU の手番を実装して」ではなく「`pendingDelayMs` が値を返すようにして、`tick` で1手進めて」と言える。**形が決まっているので Claude Code の出力がぶれない** |
| レビューが速くなる | どのゲームを開いても「`reduce` と `pendingDelayMs` を読めばルールが分かる」。レビュアーが構造を覚え直さなくて済む |

お手本ではこうなっている（`src/games/example-game/logic.ts`）。

```ts
export const REVEAL_DELAY_MS = 900;

export function pendingDelayMs(state: ExampleState): number | null {
  return state.phase === "revealing" ? REVEAL_DELAY_MS : null;
}
```

演出の待ち時間を `logic.ts` の定数として持たせているのは、**画面側に数値を散らさないため**である。「めくって見せる時間」はルールの一部であって、見た目の設定ではない。

`useCpuTurn` の実装上の注意も1つある。`onTick` は**インラインの関数で渡す**（`useCallback` で固定しない）。`delayMs` と `onTick` の両方を依存に入れてあるため、state が変わるたびにタイマーが張り直されて CPU の手番が連続する。`useCallback` で固定すると CPU が1回しか動かない。これは典型的な失敗として `src/games/CLAUDE.md` の「よくある失敗」表に載せてある。

経過時間そのものが要るゲーム（神経衰弱のタイム記録、スピードの制限時間）のために `useElapsedMs` と `useCountdown` も用意してあるが、これらも画面側でしか使えない。`logic.ts` から `Date.now()` を呼ぶことは ESLint と契約テストの両方が禁止している。

---

## 6. ゲーム共通インターフェース

6チームの唯一の共通接点が `GameManifest` である。ゲーム側が書くのは `src/games/<id>/index.ts` の1ファイル、しかも**オブジェクトリテラル1つだけ**にした。

```ts
import type { GameManifest } from "@core";
import { BabanukiGame } from "./BabanukiGame";

export const game: GameManifest = {
  id: "babanuki",
  name: "ババ抜き",
  description: "ジョーカーを最後まで持っていた人が負け。CPU3人と対戦します",
  difficulty: "easy",
  team: "team-a",
  status: "coming-soon",     // 完成したら "ready" に変える
  minPlayers: 4,
  maxPlayers: 4,
  icon: "🃏",
  issueNumber: 1,
  howToPlay: ["...", "...", "..."],
  component: BabanukiGame,
};
```

### 6.1 GameManifest の全フィールド

`src/core/types.ts` の定義がすべてである。

| フィールド | 型 | 必須 | 制約 | 参加者が変えてよいか |
|---|---|---|---|---|
| `id` | `GameId`（`string`） | ○ | kebab-case。**フォルダ名と一致**（契約テストで強制） | 変更禁止 |
| `name` | `string` | ○ | 20文字以内。日本語可 | 変更禁止 |
| `description` | `string` | ○ | 60文字以内。一覧タイルの説明 | 変えてよい |
| `difficulty` | `"easy" \| "normal" \| "hard"` | ○ | 画面では 初級 / 中級 / 上級 | 変更禁止 |
| `team` | `TeamId` | ○ | `core` / `team-a` 〜 `team-f`。**重複不可** | 変更禁止 |
| `status` | `"coming-soon" \| "ready"` | ○ | 完成宣言。`ready` にすると追加検査が有効になる | **これを変えるのが仕事** |
| `minPlayers` | `number` | ○ | `1 <= min <= max <= 6` | 変更禁止 |
| `maxPlayers` | `number` | ○ | 同上 | 変更禁止 |
| `howToPlay` | `readonly string[]` | ○ | 3〜6行。`GameInstructions` が自動表示 | 変えてよい |
| `tags` | `readonly string[]` | | 任意のラベル | 変えてよい |
| `icon` | `string` | | 絵文字1文字。タイルのアイコンになる | 変えてよい |
| `issueNumber` | `number` | | 担当 Issue の番号。タイルから Issue へリンクする | 運営が設定 |
| `component` | `ComponentType<GameComponentProps>` | ○ | 画面本体 | 自分のコンポーネントを指す |

「変更禁止」の5つ（`id` `name` `difficulty` `team` と人数）は、`harness/config.json` に書かれた値と一致していることを契約テストが検査する。参加者が自由に決めてよいのは、**説明文・遊び方・アイコン・そして完成宣言**だけである。

コンポーネントが受け取るのは2つだけ。

```ts
export type GameComponentProps = {
  readonly manifest: GameManifest;
  readonly onExit: () => void;   // アーケード一覧へ戻る
};
```

`manifest` を渡すのは、`GameShell` がタイトル・難易度・人数・遊び方をそこから描画するためである。ゲーム側が同じ情報を2回書かなくて済む。

`validateManifest.ts` は上の制約を実行時にも検査し、違反を**日本語のメッセージ**で返す。例外は投げず、問題のあるゲームだけを一覧から外して画面上部に理由を出す（4.3）。

### 6.2 意図的に持たせなかったもの・固定したもの

**`order` フィールドを持たせない理由。**

並び順を manifest に書けるようにすると、「自分のゲームを一番上にする」変更が1行で書けてしまう。研修中にそれをやられると、指摘内容としては些細なのに6チーム分の PR に同じ指摘が並ぶ。そこで並び順は共通側に固定した。

```ts
// src/app/registry/teamOrder.ts
/**
 * アーケードに並べる順番。
 * manifest に order フィールドを持たせない（自分のタイルを先頭にする改変を不可能にする）。
 */
export const TEAM_ORDER: readonly TeamId[] = [
  "team-a", "team-b", "team-c", "team-d", "team-e", "team-f", "core",
];
```

チーム順（Team A → F）で並び、同じチーム内は id の辞書順。お手本の `example-game` は `core` 扱いなので必ず最後になり、一覧では「お手本（運営が用意した参照実装）」セクションに分けて表示される。**並び順が競争の対象にならない**ようにしたのが狙いである。

**`export const game` の named export に固定した理由。**

`default export` を許すと次の問題が起きる。

- `import.meta.glob` の `import: "game"` が使えなくなり、モジュール全体を読み込んでから中身を探す実装になる（4.3 の「競合ゼロ」の土台が弱くなる）
- 名前が無いので、参加者が `export default BabanukiGame`（コンポーネント）と `export default game`（manifest）を取り違える。しかも取り違えたときのエラーが「component に React コンポーネントを指定してください」ではなく、意味不明な描画エラーになる
- エディタの補完が効かない。`game.` と打てば全フィールドが出る状態のほうが、実装中の参照コストが低い

`validateManifest` の最初のメッセージも、この取り違えを名指しで説明する形にしてある。

```ts
return ["index.ts が `export const game` を公開していません（default export ではなく named export です）"];
```

### 6.3 COMING SOON を「分岐」ではなく「データ」にした設計

初版では、未実装のゲームは一覧の中で特別扱いされる想定だった。今回はそれをやめ、**未実装であることを `status` という1つのデータで表す**方式にした。

- 未実装のゲームも `index.ts` を持ち、`component` を持ち、実際に描画できる
- 描画される中身が `ComingSoonPanel`（裏向きのカード3枚 + `[ COMING SOON ]` + 担当 Issue へのリンク）である
- 一覧側は `status === "coming-soon"` を見て CSS のクラスを変えるだけ。読み込み・検証・描画の**コードパスは1本のまま**

```tsx
// 未実装ゲームの初期状態（scaffold が生成する）
export function BabanukiGame({ manifest, onExit }: GameComponentProps) {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(Math.floor(Math.random() * 100000)),
  );
  useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));

  return (
    <GameShell manifest={manifest} onExit={onExit} onReset={() => dispatch({ type: "reset" })}>
      {/* TODO: この ComingSoonPanel を消して、ここにゲーム画面を作ってください。 */}
      <ComingSoonPanel manifest={manifest} />
      <p>（雛形）山札の残り: {state.deck.length}枚</p>
    </GameShell>
  );
}
```

雛形の時点で `useReducer` と `useCpuTurn` の1行がすでに入っていることも重要で、参加者は**構造を作るのではなく中身を埋める**作業から始められる。

この設計で得られる効果が3つある。

| 効果 | 内容 |
|---|---|
| **コードパスが1本** | 「未実装なら描画しない」という分岐が存在しない。分岐を書くと、6チームが実装を終えたあと**誰も通らない死んだコード**が残り、研修後のリポジトリが読みにくくなる |
| **開始時点で `verify` が緑** | 研修が始まった瞬間から `npm run verify` が全部通る。参加者が最初に見る CI が赤だと、「元から赤いのか、自分が壊したのか」の切り分けに時間を溶かす。**緑から始めて緑を維持する**体験にできる |
| **完成宣言が PR の差分に現れる** | `status: "coming-soon"` → `"ready"` の1行が Pull Request の差分に必ず出る。レビュアーはその1行を見て「このチームは完成したと言っている」と分かる。**宣言と検査が同じ場所で起きる** |

3つ目には仕掛けがある。`status` を `"ready"` にすると、契約テストが**そのゲームにだけ追加の検査**を始める。

```ts
// tests/contract/manifest.contract.test.tsx
const readyGames = registry.games.filter((game) => game.manifest.status === "ready");

it("ロジックのテストを3件以上持っている", ...)            // minTestsPerReadyGame: 3
it("画面が例外を出さずに描画でき、GameShell を使っている", ...)
```

- `logic.test.ts` の `it(` が3件未満なら落ちる
- `it.skip` / `describe.skip` が混ざっていたら落ちる（数合わせで通せない）
- 画面が例外を投げずに描画でき、`GameShell`（`data-testid="game-shell"`）を使っていることを確認する

つまり **`"ready"` と書くことが、そのままテストを厳しくするスイッチになっている。** 「完成しました」と宣言した瞬間に、その宣言が機械で検査される。参加者に「テストを3件書け」と口で言う代わりに、完成宣言の副作用として要求している。

`status` が `"coming-soon"` のままなら追加検査は動かないので、実装途中の PR は落ちない。Draft PR を早めに作る流れ（2.1）と噛み合う。

---

## 7. リポジトリ構成

実物のツリー。**★ が付いているのが参加者担当**で、それ以外はすべて運営管理である。

```text
card_arcade/
├─ .claude/                       Claude Code の設定（第9章 Layer 1・2）
│  ├─ settings.json                 permissions（deny / ask / allow）とフックの登録
│  ├─ statusline.mjs                今のブランチ・担当ゲーム・verify 状態を常時表示
│  ├─ agents/rule-checker.md        規約違反を探す専用サブエージェント
│  ├─ commands/                     /kickoff /implement /verify /pr /review /fix-review /stuck /handoff
│  └─ hooks/                        guard-scope   範囲外への書き込みをその場で止める
│                                   guard-bash    sed -i やリダイレクトでの迂回を止める
│                                   format-file   保存時に prettier をかける
│                                   require-verify  verify せずに終わろうとしたら止める
│                                   session-brief   起動時に担当と5条を読み上げる
├─ .githooks/pre-commit           コミット前に範囲チェック（第9章 Layer 3）
├─ .github/
│  ├─ workflows/ci.yml              必須チェック。verify 1本だけ（Layer 4）
│  ├─ workflows/deploy-pages.yml    main へのマージで GitHub Pages に自動デプロイ
│  ├─ workflows/scaffold-selftest.yml  scaffold が生成する雛形自体が verify を通るかの自己検査
│  ├─ CODEOWNERS                    運営管理の場所だけ講師の承認必須（`*` の行は書かない）
│  ├─ branch-protection.json        main の保護設定をコード化したもの
│  ├─ ISSUE_TEMPLATE/               bug_report.yml / improvement.yml / config.yml
│  ├─ issue-bodies/                 6チーム分の Issue 本文（config.json から生成）
│  └─ PULL_REQUEST_TEMPLATE.md      PR の書式
├─ .vscode/extensions.json        推奨拡張
├─ docs/
│  ├─ handson-steps.md              当日の手順書（事前課題 P-1〜P-6 / Step 1〜18）
│  ├─ instructor-guide.md           講師用。時間割と介入の判断
│  ├─ harness.md                    ハーネス5層の説明
│  ├─ architecture.md               設計の全体像
│  ├─ claude-code-guide.md          Claude Code の使い方
│  ├─ game-plugin-guide.md          ゲームの追加方法
│  ├─ github-workflow.md            ブランチ・PR・レビューの流れ
│  ├─ review-guide.md               レビューの観点
│  ├─ troubleshooting.md            エラー別の対処
│  └─ games/                        6ゲームの仕様書（babanuki.md 〜 daifugo.md）
├─ harness/config.json            ★単一の真実源★ チーム・ゲーム・保護対象パスの定義
├─ public/.nojekyll               GitHub Pages 用
├─ scripts/
│  ├─ lib/harness.mjs               config.json の読み込みとパス分類（全スクリプトの土台）
│  ├─ scope-guard.mjs               担当範囲チェック。pre-commit と CI が同じものを呼ぶ
│  ├─ scaffold-game.mjs             templates/ から自分のゲームの雛形を生成
│  ├─ doctor.mjs                    環境チェック（事前課題の完了判定）
│  ├─ status.mjs                    今の状態（ブランチ・差分・verify）をまとめて表示
│  ├─ mark-verified.mjs             verify 成功を記録する（require-verify フックが読む）
│  ├─ check-pr-body.mjs             PR 本文の必須項目チェック
│  ├─ ci-summary.mjs                CI の結果を日本語の要約にする
│  ├─ build-issue-bodies.mjs        config.json から Issue 本文を生成
│  ├─ install-git-hooks.mjs         npm ci のときに .githooks を有効化（prepare）
│  ├─ score.mjs                     採点補助
│  └─ setup-*.ps1                   講師用。collaborators / issues / labels / milestone / branch-protection
├─ src/
│  ├─ app/                        アプリの骨格
│  │  ├─ main.tsx / App.tsx         起動と画面切り替え
│  │  ├─ router.ts                  自前のハッシュルータ（約60行）
│  │  ├─ GameErrorBoundary.tsx      1ゲームの実行時エラーを他へ波及させない
│  │  └─ registry/                  loadGames（import.meta.glob）/ validateManifest /
│  │                                teamOrder（並び順の固定）/ harnessConfig（config.json を画面から読む）
│  ├─ components/                 @ui の実体（12コンポーネント）
│  │  ├─ CLAUDE.md                  「停止: ここは運営管理の領域です」
│  │  ├─ index.ts                   @ui の公開 API。ここに無いものは無い
│  │  └─ Card/ Hand/ DeckPile/ GameShell/ GameTile/ Button/ ScoreBoard/
│  │     Timer/ ResultModal/ GameInstructions/ LogPanel/ ComingSoonPanel/
│  ├─ core/                       @core の実体
│  │  ├─ CLAUDE.md                  「停止: ここは運営管理の領域です」
│  │  ├─ index.ts                   @core の公開 API。ここに無いものは無い
│  │  ├─ types.ts                   カード・プレイヤー・GameManifest などの型
│  │  └─ cards/ deck/ shuffle/ players/ score/ storage/ game-shell/ hooks/ testing/
│  ├─ games/
│  │  ├─ CLAUDE.md                  ゲーム実装の決まり（運営管理。読むのは必須）
│  │  ├─ example-game/              お手本（ハイ＆ロー・CPU 対戦・10ラウンド）※運営管理
│  │  ├─ babanuki/           ★ Team A だけが編集する
│  │  ├─ shinkeisuijaku/     ★ Team B だけが編集する
│  │  ├─ speed/              ★ Team C だけが編集する
│  │  ├─ shichinarabe/       ★ Team D だけが編集する
│  │  ├─ doubt/              ★ Team E だけが編集する
│  │  └─ daifugo/            ★ Team F だけが編集する
│  ├─ pages/                      ArcadePage / GamePage / NotFoundPage
│  ├─ styles/                     tokens.css（--ca-* 変数）/ global.css
│  ├─ test/setup.ts               テストの共通設定
│  └─ vite-env.d.ts
├─ templates/game/                scaffold が使う雛形（index / logic / logic.test / Game.tsx / README の *.tmpl）
├─ tests/contract/                契約テスト（第9章 Layer 3）
│  ├─ registry.contract.test.ts     自動検出・id とフォルダ名の一致・チームの重複
│  ├─ manifest.contract.test.tsx    必須ファイル・README の見出し・ready の追加検査
│  └─ boundaries.contract.test.ts   ソースの静的走査（ESLint 無効化への二重の網）
├─ CLAUDE.md                      ルート。絶対に守る5条・担当表・いちばん大事な型
├─ README.md                      5分で始める・担当表・コマンド3つ
├─ card_arcade_training_design.md 本設計書
├─ package.json / package-lock.json  依存追加は禁止
├─ tsconfig.json                  strict / paths（@core・@ui）
├─ vite.config.ts                 alias（完全一致）/ vitest 設定 / base: "./"
├─ eslint.config.js               フォルダごとに違うルールを当てる
├─ index.html
└─ .editorconfig / .gitattributes / .gitignore / .nvmrc / .prettierrc
```

### 7.1 境界の読み方

ツリーで **★ が付いているのは `src/games/` の6フォルダだけ**である。同じ `src/games/` の下にありながら `CLAUDE.md` と `example-game/` は運営管理で、これは「お手本を読ませたいが、書き換えさせたくない」ためである。

この境界は文章だけでなく、次の4つが同じ `harness/config.json` の `protectedPaths` を参照して機械的に守っている。

| 仕組み | 止まる場所 | バイパス |
|---|---|---|
| `.claude/settings.json` の `deny` | Claude Code が書こうとした瞬間 | 可能 |
| `.claude/hooks/guard-scope.mjs` | 同上（`deny` をすり抜けた経路も含む） | 可能 |
| `.githooks/pre-commit` → `scope-guard.mjs --staged` | コミットしようとしたとき | 可能 |
| `.github/workflows/ci.yml` → `scope-guard.mjs --base origin/main` | Pull Request のとき | **不可** |

`scripts/scope-guard.mjs` は3つの呼ばれ方（作業ツリー / ステージ / ブランチ全体）で**同じ判定ロジック**を使う。手元では通ったのに CI で落ちる、という状況が起きないようにするためである。違反したときは「どのファイルが」「どの分類（運営管理／他チーム／対象外の場所）で」「どう戻すか（`git restore` のコマンド）」までを日本語で出す。

`.github/CODEOWNERS` にはあえて `*` の行を書いていない。書くと6つの Pull Request が同時に来る115〜152分の時間帯に講師が完全なボトルネックになり、「チーム同士でレビューする」という研修の目的とも矛盾する。**`src/games/<各チーム>/` は意図的に誰も所有していない。** 講師の承認が必須になるのは、参加者がそもそも触らないはずの場所（`src/core/` `src/components/` `.github/` など）に変更が入ったときだけである。

各層の役割と、なぜ「止める硬さ」を場所によって変えているかは第9章で述べる。

---
## 8. チーム別ゲーム仕様

6ゲームは「日本人なら説明なしで遊べるトランプゲーム」から選んだ。選定条件は3つ。

1. **ルールを30秒で口頭説明できる。** レビュアーが他チームのゲームを触るとき、仕様書を読み込む時間は無い。
2. **純粋関数で書ける山場が1つある。** その山場が `logic.test.ts` の必須テストになり、評価の対象になる。
3. **52枚のトランプだけで完結する。** 追加の道具（チップ・ボード・得点表）が要るゲームは、
   実装よりも表示の作り込みに時間を取られる。

お手本の `src/games/example-game/`（ハイ＆ロー・CPU 対戦・10ラウンド）はどのチームにも割り当てない。
6チームが同じお手本を読み、同じ形を6通りに展開する構図にしている。

### ルールの正典は設計書ではない

各ゲームのルールは **`docs/games/<ゲームID>.md`** が正典である。この設計書はその要約であり、
実装で迷ったときに読むのは正典のほうである。GitHub Issue の本文も同じファイルから機械生成する（10章）。

正典を設計書から分離した理由は2つ。

- 設計書は研修の**設計意図**を説明する文書で、当日は誰も読まない。当日読まれるのは Issue である。
- ルールの記述が設計書と Issue の2箇所にあると、必ずどちらかが古くなる。
  **直す場所を `docs/games/<ゲームID>.md` の1つに固定する。**

以下の各節は、正典のうち「なぜこのゲームを選んだか」「どこを簡略化したか」「何が学べるか」だけを抜き出したものである。
必須要件の全文・状態の雛形・レビュアー向けミッションは正典を見ること。

---

## 8.1 Team A：ババ抜き（`babanuki`）

**難易度: 初級 / 人間1 + CPU3 / 53枚（52枚 + 赤ジョーカー1枚）**

### なぜこのゲームか

- 参加者全員が知っている。ルール説明の時間が0になる。
- 勝敗の判定が「最後に残った1人」だけで済み、得点計算が要らない。
- **ジョーカーという「他の52枚と型が違う1枚」が入る。** 判別可能ユニオンを最小の実例で扱える。
  `createDeck()` の戻り値を `PlayingCard[]` のまま広げず、ジョーカーを使うのはこのゲームだけにした。

### 基本仕様

- 53枚を4人へ配り切る（あなた14枚 / CPU 各13枚）
- 配札直後に、各プレイヤーの手札から同ランクのペアを自動で捨てる
- 手番のプレイヤーは**左隣**の手札から裏向きの1枚を引く
- 引いた結果ペアがそろったら、その場で2枚とも捨てる
- 引く相手がすでに上がっていたら飛ばして、次の生存者から引く
- 手札が0枚になったら上がり。手番からも引かれる対象からも外れる
- 生存者が1人になったら終了。上がった順に1位〜4位を付ける
- 他プレイヤーの手札は `face="down"` で表示し、中身を DOM に出さない
- 待ち時間は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで扱う

### 簡略化したルールと、その判断理由

| ローカルルール | 今回の扱い | なぜそう決めたか |
|---|---|---|
| ジョーカー2枚（赤・黒） | 赤1枚のみ | ババが2枚あると勝敗条件が変わり、必須テストが増える。型の学びは1枚で足りる |
| 同じ色でないとペアにできない | ランクが同じなら色は問わない | 判定条件が1つ増えるだけで、学べることは増えない |
| 同ランク3枚を3枚まとめて捨てる | 先頭2枚だけ捨てて1枚残す | **3枚の扱いを境界値テストの題材として残したかった。** 簡略化ではなく意図的な残し方 |
| 引く相手・引く方向を選ぶ | 左隣に固定 | 相手選択の UI が実装時間を圧迫する。`neighborId(state.turn)` で1行になる |
| 複数回戦・持ち越しスコア | 1回で完結 | 状態が増えるだけでルールの学びが無い |

### 必須テスト

- `同じランクが2枚あると両方とも捨てられる`
- `同じランクが3枚なら1組だけ捨てて1枚残る`
- `ジョーカーはペアにならず手札に残る`
- `引いた結果ペアがそろったら即座に捨てられる`
- `上がった人は手番からも引く相手からもスキップされる`
- `上がった順に順位が付く`

### 学習ポイント — 判別可能ユニオンと4人のターン管理

- `AnyCard = PlayingCard | JokerCard` を `kind` で判別する。
  `AnyCard` に対していきなり `.rank` を読むと**コンパイルエラーになる**。
  「考慮漏れが実行時ではなくビルド時に分かる」を、最小のコードで体験させる。
- 4人の手番を自前の index で回さず、`@core` の `TurnState` に預ける。
  上がった人のスキップは `neighborId` / `nextTurn` の内側に閉じ、ゲーム側には現れない。
  **「共通基盤に預けると自分のコードから消える」**という感覚を最初のゲームで作る。
- 終了条件が「生存者が1人」だけなので、`isGameOver(state)` を状態から導く形に自然になる。

### 発展機能

`sortCards` による手札の並べ替え / `LogPanel` の進行ログ / 引かれた側の手札の再シャッフル /
`useElapsedMs` + `Timer` / `useHighScore` による記録保存 / CPU の引き方の改善 / 手番のハイライト。

### 時間切れの逃げ道

1. 発展機能を全部やめる
2. 引いたカードを見せる演出（`"revealing"` フェーズ）をやめる
3. `ScoreBoard` をやめ、残り枚数を素のテキストで出す
4. CPU を3人から1人に減らす（`minPlayers` / `maxPlayers` を触るので**講師の確認が要る**）
5. ジョーカーをやめ、「52枚からスペードのAを抜いた51枚」方式にする

ここまで落としても、**必須テスト6件と `npm run verify` が緑になることは落とさない。**

---

## 8.2 Team B：神経衰弱（`shinkeisuijaku`）

**難易度: 初級 / ソロ（1人） / 8組16枚**

### なぜこのゲームか

- **6ゲームで唯一、対戦相手がいない。** CPU も手番もターン管理も無いので、
  プログラミング経験がいちばん浅いメンバーを置ける枠として用意した。
- そのぶん、**「2枚めくって0.8秒待つ」という非同期の山場が1つだけ**きれいに残る。
  やることが1つしかないので、そこに全員の理解を集中させられる。
- 盤面が16枚で固定なので、画面の作り込みが `Card` を16個並べるだけで終わる。

### 基本仕様

- 52枚から8ランクを選び、各2枚の計16枚をシャッフルして4列 × 4行に裏向きで並べる
- 1回にめくれるのは2枚まで
- 2枚めくると判定中になり、`REVEAL_DELAY_MS`（800ms）の間は次をめくれない
- ペアが成立してもしなくても、**同じ800ms**だけ判定中になる
- 同ランクの2枚はペア成立。表向きのまま場に残り、以後は選べない
- 違うランクの2枚は両方とも裏向きに戻す
- ペア成立済みのカード・めくったばかりのカード・範囲外の位置は選べない
- 手数は2枚めくった時点で1増える（1枚目では増えない）
- 8ペアそろったら終了。手数を結果に出す
- 「もう一度」でランクを選び直し、手数を0に戻す

### 簡略化したルールと、その判断理由

| ローカルルール | 今回の扱い | なぜそう決めたか |
|---|---|---|
| スートまで一致して初めてペア | ランクだけで判定 | 判定が複雑になるだけで、非同期の山場とは無関係 |
| ペアを取ったら続けてもう一度めくれる | 常に「2枚で1手」 | **ペアのときだけ待たない分岐を作らないため。** 状態遷移が1本で済み、画面もちらつかない |
| 2人以上で交互にめくる | ソロ専用 | ターン管理が入ると、このゲームを初級に置いた意味が消える |
| 52枚（26組）すべてを並べる | 8組16枚に固定 | 1ゲームが2分で終わる大きさに合わせた |
| 制限時間つき・タイムアタック | 発展課題 | 時間を必須要件にすると、時間のテストが必要になる |

### 必須テスト

- `裏向きのカードをめくると表になる`
- `2枚めくった判定中は3枚目をめくれない`
- `ペア成立済みのカードとめくり済みのカードは選べない`
- `2枚めくると手数が1増える`
- `同じランクの2枚はペアになって表のまま残る`
- `違うランクの2枚は両方とも裏に戻る`
- `8ペアすべてそろうとゲームが終わる`

### 学習ポイント — 非同期処理を純粋関数に落とす設計

- 「0.8秒待つ」を `setTimeout` ではなく、**`phase: "judging"` という状態**と
  `pendingDelayMs(state)` の戻り値で表す。時間はデータになり、テストできるようになる。
- 連打対策のすべてが `flipCard` の先頭1行に収まる。

  ```ts
  if (state.phase === "judging") return state;
  ```

  同じことを `.tsx` 側のボタンの `disabled` でやると、**テストできない実装**になる。
  「防御をどこに置くか」で検証可能性が変わることを、1行の差で体験させる。
- テストは `reduce(state, { type: "tick" })` を呼ぶだけ。**1ミリ秒も待たない。**
  `vi.useFakeTimers` は必須要件に含めない。

### 発展機能

`useElapsedMs` + `Timer` の経過時間 / `useHighScore(manifest.id, "lower-is-better")` のベスト手数 /
`PAIR_COUNT` を6・8・10から選ぶ難易度 / CSS のめくり演出 / ミスの記録 / 手数に応じた評価コメント /
「一定の確率で場所を覚えている」CPU。

### 時間切れの逃げ道

1. 見た目の作り込み（めくり演出・凝った CSS）
2. 経過時間の表示
3. ベスト手数の保存
4. `ResultModal`（「クリア！ 12手」の1行に置き換える）
5. 手数の常時表示（終了時に出れば必須要件は満たせる）
6. `PAIR_COUNT` を8から6に下げる（**講師の判断が要る**）

**絶対に落とさないのは「判定中は3枚目をめくれない」と `logic.test.ts`。** 画面が地味でも、ここが緑なら合格。

---

## 8.3 Team C：スピード（`speed`）

**難易度: 中級 / 人間1 + CPU1 / 52枚**

### なぜこのゲームか

- **6ゲームで唯一「同時進行」を扱う。** 人間の入力と CPU のタイマーが互いに独立に走る。
  ターン制でないゲームを1本入れておくと、`pendingDelayMs` が「手番の待ち時間」ではなく
  **「次に自動で起きることまでの時間」**だと分かる。
- **デッドロック（両者とも出せない）という、状態機械を作らないと解けない事象**が自然に入っている。
  イベントではなく状態から検出する、という設計を強制できる。
- 判定条件（1つ違い・同ランク不可・A と K が繋がる）が短く、テストが4件で書き切れる。

### 基本仕様

- 52枚を26枚ずつに分け、手札4枚 / 台札1枚 / 山札21枚で開始する
- 手札は、どちらかの台札と**1つ違い**のときだけ出せる。同じ数字は出せない
- **A と K は繋がる**（判定は `cycleRank` を使う）。スートは一切関係しない
- 出せるカードは常時ハイライトされる（`Hand` の `highlightedIds`）
- クリック1回で出す。左右どちらにも出せるときは**必ず左の台札**へ出す
- カードを出したら山札から補充し、手札を4枚に保つ
- CPU は `CPU_INTERVAL_MS`（1200ms）ごとに1回だけ出す
- 両者とも出せないときは `REFILL_DELAY_MS`（700ms）後に、各自の山札から1枚ずつ台札に足す
- 手札と山札が両方0で勝ち。両者詰みなら残り枚数が少ないほうの勝ち

### 簡略化したルールと、その判断理由

| ローカルルール | 今回の扱い | なぜそう決めたか |
|---|---|---|
| 同時に出したときの取り合い | 人間の入力と CPU のタイマーを独立に処理 | 「同時」を真面目に作ると競合の解決が主題になり、時間内に終わらない |
| ドラッグ&ドロップで台札を選ぶ | クリック1回・両方出せるときは左固定 | **仕様から非決定性を消すため。** 「どちらに出るか」がテストで一意に決まる |
| 「せーの」で同時スタートする演出 | 開始直後から出せる | 演出のための状態が1つ増える |
| 詰みを自分で宣言するボタン | `pendingDelayMs` が自動検出 | **デッドロック検出を状態から導く**のがこのゲームの学びなので、人間に宣言させたら意味が無い |
| 山札が切れたら相手から借りる | 実装しない | 終了条件が増える |

### 必須テスト

- `1つ違いなら出せる`
- `同じランクは出せない`
- `K の次に A が出せる`
- `A の次に K が出せる`
- `両者が出せない状態を pendingDelayMs が検出する`
- `手札と山札が0で終了`

### 学習ポイント — 時間依存のロジックをテスト可能にする

- **2種類の待ち時間**（CPU の間隔・詰みからの復帰）を `pendingDelayMs` 1本に集約する。
  画面は「今どちらを待っているのか」を知らないまま、`useCpuTurn` の1行で両方を処理する。
  時間の分岐がロジック側に集まり、テストできる場所に移る。
- デッドロックを「イベント」ではなく**状態から導く**。
  `hasPlayableCard(you) === false && hasPlayableCard(cpu) === false` の組み合わせが `REFILL_DELAY_MS` を返す。
  この形にすると、詰みの検出漏れでゲームが永久に止まる事故がテスト1件で防げる。
- `rankToNumber` の引き算だけで「1つ違い」を書くと K と A の境界で落ちる。
  `cycleRank` を使う理由が、必須テスト2件（`K の次に A` / `A の次に K`）として残る。
- **`vi.useFakeTimers` を使わずに、時間の絡むゲームをテストし切れる**ことを示す。

### 発展機能

CPU の速さを3段階から選ぶ / `useElapsedMs` + `Timer` / `useHighScore` による最短決着タイム /
`LogPanel` の履歴 / `cpu.ts` を「評価値を返す純粋関数」と「乱数と比べる薄い層」に分ける / 出したときのアニメーション。

### 時間切れの逃げ道

1. 発展機能を全部やめる
2. CSS Modules を作らない（`@ui` の既定の見た目のまま）
3. CPU の乱数をやめ、「左から見て最初に出せたカード」に固定する
4. 配る枚数を26枚から各自10枚に減らす（**ルールも画面も変わらない。いちばん安全**）
5. デッドロックの自動補充を落とす（必須テストが1件落ちるので**講師へ報告**）
6. CPU を止めてソロ版にする

---

## 8.4 Team D：七並べ（`shichinarabe`）

**難易度: 中級 / 人間1 + CPU3 / 52枚**

### なぜこのゲームか

- **6ゲームで唯一「盤面」を持つ。** 状態の中心が手札ではなく場の形になる。
  「カードの集合をどう持つか」という設計判断が、実装の速さに直接効く題材である。
- **合法手の列挙**という概念を最小の形で扱える。置けるかどうかの判定が ±1 の1条件しかないので、
  列挙のアルゴリズムではなく「列挙した結果を何に使うか」に集中できる。
- パス回数と脱落という**2本目のカウンタ**を持つ。上がりと脱落が「手札が0枚」で似ているのに
  順位では逆、という引っかけが自然に入っている。

### 基本仕様

- 52枚を4人に13枚ずつ配り切り、開始時に4枚の7を自動で場に置く
- **ダイヤの7を配られた人が先手**
- 置けるのは、同じスートで場のカードの ±1 のカードだけ
- ランクは A=1 から K=13 の**直線**。K の次に A は繋がらない（`cycleRank` を使わない）
- 1手番でできるのは「1枚置く」か「パス」のどちらか1つ
- **置けるカードが1枚でもあるときはパスできない**
- パスは1人3回まで。4回目のパスで脱落し、手札を全部（飛び地も）場に置く
- 手札が0枚になった人から上がり。上がった人・脱落した人は手番から外れる
- 順位は「出し切った順 → 終了時に手札が残っていた人 → 脱落した人（脱落が遅いほど上）」

### 簡略化したルールと、その判断理由

| ローカルルール | 今回の扱い | なぜそう決めたか |
|---|---|---|
| 都落ち | 不採用 | 一度確定した順位が後から動くと、順位のテストが書けない |
| A と K が繋がる | 不採用（直線） | **`@core` に `cycleRank` があるのに、あえて使わないと決める判断**を残したかった。必須テスト1件で守る |
| パス回数を無制限にする | 3回で固定（`MAX_PASSES`） | 脱落という2本目のカウンタが消え、境界値テストの題材が無くなる |
| 出せるのにあえて出さない駆け引き | 不採用（出せるなら必ず出す） | これが緩むと全員がパスし続け、**ゲームが終わらなくなる**。終了性を仕様で保証している |
| 6と8も最初に場に置く | 最初に置くのは4枚の7だけ | 初期状態の生成が長くなる |
| 脱落者が出た時点で終了 | 残った人で最後まで続ける | 脱落と上がりの順位の違いを見せるために、両方が起きる必要がある |

### 必須テスト

- `7の隣（6と8）は置ける`
- `場から離れたカードは置けない`
- `A の下と K の上には置けない`
- `出せるカードがあるときはパスできない`
- `3回パスしたあと、4回目のパスで脱落し手札が全部場に出る`
- `手札を出し切った順に順位が付く`

### 学習ポイント — 盤面の表現と合法手の列挙

- **`Board = Record<Suit, boolean[]>`（index 0..12 が A..K）という持ち替え。**
  置かれたカードの配列をそのまま持つと ±1 の判定が毎回の走査になる。
  「データ構造を判定しやすい形に変える」という、この研修で唯一の本格的な設計判断である。
- **`canPlace`（1枚の判定）と `legalMoves`（列挙）を分ける。**
  画面の `disabledIds` も、パスできるかどうかも、CPU の手も、すべて `legalMoves` 1本から出る。
  同じ判定を3箇所に書いてずれる、という典型的な事故が構造で防げる。
- 「出せるならパスできない」をロジック側で強制すると、**終了性そのものがテストで守れる**ことを学ぶ。
- 上がり（`finishedIds`）と脱落（`droppedIds`）を分けて持つ。
  まとめて `finishedIds` に入れると脱落者が1位になる、という失敗が実際に起きる。

### 発展機能

CPU を賢くする（続いているスートを優先 / 端から出す） / `LogPanel` にパスと脱落を出す /
`ScoreBoard` の `detail` に残り枚数とパス残り回数 / 直前に置いたカードのハイライト /
次に置けるマスを光らせる / `useHighScore` で1位の回数を保存 / seed の表示。

### 時間切れの逃げ道

1. 進行ログと演出
2. CPU の賢さ（`legalMoves` の先頭をそのまま出す）
3. パス残り回数の表示（カウントとルールは残す）
4. 順位の並べ替え（**必須要件が1件落ちる**）
5. 脱落ルールそのもの（**必須テスト1件と必須要件1件が落ちる。最後の手段**）

5 を選んでもゲームは必ず終わる。「出せるカードがあるときは必ず出す」を守っていれば、
場の端に置けるカードは必ず誰かの手札にあり、その人の手番で必ず置かれるからである。

---

## 8.5 Team E：ダウト（`doubt`）

**難易度: 中級 / 人間1 + CPU3 / 52枚**

### なぜこのゲームか

- **6ゲームで唯一、情報の非対称性がゲームの本体になる。**
  「他人の手札を見せてはいけない」という要求が、そのまま型の設計課題になる。
- 隠蔽が破れているかどうかを、**ブラウザの開発者ツールで実際に確認できる**。
  レビュアーが F12 で DOM を見るだけで判定でき、レビューのミッションが具体的に書ける。
- CPU の判断が「宣言ランクを何枚持っているか」と「場札の枚数」だけで書ける。
  凝った推論を作らなくても、心理戦らしい挙動になる。

### 基本仕様

- 52枚を4人に13枚ずつ配り切り、あなたの手番から始まる
- 宣言ランクは `A` から自動で1つずつ上がる（`K` の次は `A`）。**プレイヤーは選べない**
- 手番の人は手札から1〜4枚を裏向きに出す。パスはできない
- 出した直後、左隣から順に1人ずつダウトするかを決める。**最初にダウトした1人で確定**
- ダウトが当たれば出した人が、外れればダウトした人が、場札を**全部**引き取る
- 引き取りが起きたら場札は空、宣言ランクは `A` に戻り、引き取った人の次の人から再開する
- 誰もダウトしなければ場札は積まれ、宣言ランクが1つ進む
- 他プレイヤーの手札は `Hand variant="hidden"` で**枚数だけ**表示する
- 手札0枚で上がり。ただし**確定はその場の決着がついてから**
- 残り1人でゲーム終了。上がった順がそのまま順位

### 簡略化したルールと、その判断理由

| ローカルルール | 今回の扱い | なぜそう決めたか |
|---|---|---|
| 複数人が同時にダウトを宣言する（早い者勝ち） | 手番順に1人ずつ聞き、最初の1人で確定 | 「同時」の解決を作ると状態機械が一気に重くなる。中級の枠を超える |
| 宣言ランクを自分で選べる | `A` から昇順に自動で循環 | 選択の UI が増え、`cycleRank` を使う必然性も消える |
| 手番でパスできる | 必ず1〜4枚出す | パスを許すと、全員がパスして進まない盤面が作れてしまう |
| 場札を一部だけ引き取る | 常に全部 | 引き取り枚数の計算が主題になる。**「52枚が消えも増えもしない」の検算が単純になる**利点も大きい |
| 上がった人もダウトだけ宣言できる | 完全に抜ける | `finishPlayer` / `neighborId` が自動で飛ばす形から外れる |
| 1人が上がった時点で終了 | 残り1人になるまで続ける | 順位が2位までしか決まらない |

### 必須テスト

- `宣言と実体が一致していればダウトは外れ`
- `宣言と違うカードが混ざっていればダウトは当たり`
- `ダウトが当たると出した人が場札を全部引き取る`
- `ダウトが外れるとダウトした人が場札を全部引き取る`
- `解決後は宣言が A に戻る`
- `toPublicState に他人の手札が含まれない`

### 学習ポイント — 情報隠蔽を型で保証する

- **`toPublicState(state, viewerId): PublicState`。**
  `PublicState` には他人の手札のフィールドが**存在しない**。
  「渡さないように気をつける」ではなく「**渡せない**」に変える。これがこのゲームの中心。
- そのおかげで、隠蔽のテストが DOM を見に行かずに書ける。
  必須テスト `toPublicState に他人の手札が含まれない` は、型の形だけで守れる。
- **CPU も `PublicState` だけを見て判断する。**
  こうすると「CPU が神視点でズルをしていない」ことが、コードの構造から一目で分かる。
  CPU の強さを調整するときにも、公開情報の範囲が勝手に広がらない。
- `Hand variant="hidden"` と `face="down"` の違いを実物で理解する。
  後者は**カードの実体が DOM に載る**ので、開発者ツールで中身が読めてしまう。
  「見えない」と「存在しない」は違う、という一般則をこの1点で教える。

### 発展機能

`doubtProbability` の改良 / 「うそを通した回数」「ダウトを当てた回数」の保存 /
`LogPanel` のダウト履歴 / 宣言ランクと一致する手札のハイライト / 「宣言ランクを全部出す」ボタン /
CPU ごとの性格づけ。

### 時間切れの逃げ道

1. `LogPanel` の進行ログ
2. `revealing` の演出時間（`pendingDelayMs` が CPU の手番だけを扱えばよくなる）
3. CPU の乱数判断を固定ルールにする
4. **出せる枚数を1枚固定にする**（複数選択と「出す」ボタンが不要になり、画面が大幅に軽くなる）
5. ダウトできるのを「あなた」だけにする（心理戦が半分になるので**最終手段**）

`index.ts` の `id` / `name` / `team` / `difficulty` / `minPlayers` / `maxPlayers` は、
どれだけ時間が無くても変更しない（契約テストと CI が落ちる）。

---

## 8.6 Team F：大富豪（`daifugo`）

**難易度: 上級 / 人間1 + CPU3 / 52枚 / 基本 + 8切り + 革命のみ**

### なぜこのゲームか

- **6ゲームで唯一、ルールが互いに干渉する。**
  8切り（場が流れる・手番が移らない）と革命（強さが反転する）は独立したルールだが、
  8を含む4枚出しでは**同時に発動する**。この1ケースを仕様として先に決めるところが山場になる。
- ルールを足し引きできる構造なので、**時間切れのときに削る対象が明確**である。
  「革命を落とす → CPU を1枚出しに落とす → 8切りを落とす」と落としても、
  基本ルールだけで1本のゲームとして成立する。
- 参加者の中でいちばん経験のあるメンバーを集める先が必要だった。

### 基本仕様

- 52枚を4人に13枚ずつ配り切り、**ダイヤの3**を持つ人が先手
- 強さは `3 < 4 < ... < K < A < 2`。`createRankStrength` にゲーム側で並びを渡して作る
- 場が空のときは、同じランクで揃った1〜4枚を出せる
- 場にカードがあるときは、**同じ枚数**かつ**より強いランク**の組だけ出せる
- パスできる。パスした人は場が流れるまでその回に出せない
- 出した人以外の全員がパスしたら場が流れ、最後に出した人から再開する
- **8切り**: 8 を含む組を出すと即座に場が流れ、**同じ人がもう一度出す**
- **革命**: 同ランク4枚で強さが全反転。次の4枚出しで元に戻る。場が流れても続く
- 出し切った順に 大富豪 / 富豪 / 貧民 / 大貧民 の称号が付く

### 簡略化したルールと、その判断理由

採用したのは**基本ルール + 8切り + 革命の3つだけ**である。除外したローカルルールは正典に15件挙げてある。
代表的なものと理由は次のとおり。

| ローカルルール | 今回の扱い | なぜそう決めたか |
|---|---|---|
| 階段（同スートの連番3枚以上） | 不採用 | `isLegalPlay` の枚数条件に手を入れることになり、影響範囲が最大になる |
| しばり / 5飛ばし / 7渡し / 10捨て / 9リバース / Jバック | すべて不採用 | **1つ足すごとに `applyPlay` の分岐が1つ増える。** 3つに絞って干渉の扱いを学ぶほうが価値が高い |
| ジョーカー / ジョーカー単騎 / スペードの3返し | 不採用（52枚のみ） | ジョーカーはババ抜き専用にして、`createDeck()` の型を広げない方針を守る |
| 複数回戦とカード交換 | 1回戦で終了 | 回戦をまたぐアクションが `reduce` に要る。180分では収まらない |
| 反則上がり（2や8で上がると最下位） | 不採用 | 上がりの判定に例外が入り、順位のテストが倍になる |
| 革命中は8切り無効 | 不採用（革命中でも8切りは発動） | **干渉のケースを1つに固定するため。** 同時に起きたときの扱いを仕様で先に決めておく |
| スートによる強弱 | 不採用（ランクだけ） | 強さ表が2次元になる |

### 必須テスト

- `枚数が違うと出せない`
- `場より弱いランクは出せない`
- `同じ枚数で強ければ出せる`
- `革命中は強弱が反転する`
- `8を含む組を出すと場が流れる`
- `全員がパスすると場が流れる`
- `出し切った順に称号が付く`

### 学習ポイント — 複合ルールの分解と優先順位づけ

- **強さを `createRankStrength` で「差し替え可能な表」にする。**
  革命は「表を逆向きに読む」だけになり、`if (isRevolution)` を判定のあちこちに散らさずに済む。
  ルールの追加をデータ側へ寄せる、という手筋をここで覚える。
- **`applyPlay` の中で8切りと革命の順序を決める。**
  「4枚出し → 革命を反転 → 8を含むので場を流す → 手番は移さない」を1本の流れとして書く。
  同時発動のケースが仕様で固定してあるので、実装は迷わない。
- **`getLegalPlays` を `groupByRank` ベースで書く。**
  すべての組み合わせを列挙しようとすると13枚の手札で爆発する。
  「各ランクから必要枚数を1通りだけ取る」と決めれば候補はせいぜい13通りで済む。
  **正典にこの方針を明記してある**（放っておくと全組み合わせを作る実装が出てくる）。
- 落とす順番（革命 → CPU の複数枚出し → 8切り）が最初から決まっている。
  **どのルールが独立していてどれが土台かを理解していないと、この順番は作れない。**
  順番そのものが教材になっている。

### 発展機能

9リバース（`reverseDirection` で `TurnState` の向きを変えるだけ） / しばり（`sameSuit`） /
階段（`rankToNumber` で連番判定。影響範囲は大きめ） / ジョーカー（`createDeckWithJokers(1)`） /
複数回戦とカード交換 / CPU の強化 / `useHighScore` による最高順位の保存。

### 時間切れの逃げ道

1. 発展機能を全部捨てる
2. **革命を落とす**（`isRevolution` を `false` 固定。Step1-c がまるごと消える）
3. CPU を「1枚出しのみ」に切り替える（人間は今までどおり複数枚出せる）
4. 8切りを落とす（ここまでで**基本ルールのみ**。これでも1本のゲームとして成立する）
5. 称号を落として順位だけにする（`formatRank` の「1位」「2位」）
6. `status` を `"coming-soon"` のまま Pull Request を出す（**この判断は講師が行う**）

落としたルールは `README.md` の「実装しなかったこと」に必ず書く。
書いてあれば、レビューで「バグ」ではなく「意図した割り切り」として扱われる。

---

## 8.7 6ゲームで学ぶことが重ならないようにした

同じ「トランプゲームを1本作る」でも、各チームが持ち帰るものは違うように配分した。

| チーム | ゲーム | 中心の学び | 主に使う `@core` | このゲームだけの特徴 |
|---|---|---|---|---|
| A | ババ抜き | 判別可能ユニオンと4人のターン管理 | `createDeckWithJokers` / `TurnState` / `neighborId` | 唯一ジョーカーを使う |
| B | 神経衰弱 | 非同期処理を純粋関数に落とす | `groupByRank` / `sameRank` / `useCpuTurn` | 唯一のソロ |
| C | スピード | 時間依存のロジックをテスト可能にする | `cycleRank` / `draw` / `drawMany` | 唯一の同時進行 |
| D | 七並べ | 盤面の表現と合法手の列挙 | `rankToNumber` / `SUITS` / `groupBySuit` | 唯一の盤面 |
| E | ダウト | 情報隠蔽を型で保証する | `cycleRank` / `neighborId` / `groupByRank` | 唯一の非公開情報 |
| F | 大富豪 | 複合ルールの分解と優先順位づけ | `createRankStrength` / `groupByRank` / `sameRank` | 唯一の複合ルール |

**共通しているのは1点だけ**である。すべてのゲームが `logic.ts` に
`reduce(state, action)` と `pendingDelayMs(state)` を置き、画面には
`useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行しか書かない。
6本のゲームが**同じ形の6通りの中身**になるので、他チームのコードでも初見で読める。
相互レビューが25分で成立するのは、この一致があるからである。

---

## 9. 難易度と時間配分

難易度は `harness/config.json` の `difficulty` が唯一の正である。
ここを直せば、ラベル・Issue 本文・アーケードのタイル・契約テストがすべて同時に変わる。

### 9.1 難易度の内訳

| チーム | ゲーム | 難易度 | 構成 | 使う枚数 | `Phase` の数 | 待ち時間の定数 | 必須テスト |
|---|---|---|---|---|---|---|---|
| A | ババ抜き | 初級 | 人間1 + CPU3 | 53 | 3 | 2 | 6件 |
| B | 神経衰弱 | 初級 | ソロ | 16 | 3 | 1 | 7件 |
| C | スピード | 中級 | 人間1 + CPU1 | 52 | 2 | 2 | 6件 |
| D | 七並べ | 中級 | 人間1 + CPU3 | 52 | 2 | 1 | 6件 |
| E | ダウト | 中級 | 人間1 + CPU3 | 52 | 4 | 2 | 6件 |
| F | 大富豪 | 上級 | 人間1 + CPU3 | 52 | 2 | 1 | 7件 |

**この表で分かるのは「重さはフェーズの数には出ない」ことである。**
フェーズが最も多いのはダウト（4）だが、上級は大富豪（2）である。
状態遷移の本数ではなく、**1つの遷移の中で判断すべきルールの数**が重さを決める。

### 9.2 実装のマイルストーン

各ゲームの正典に「研修開始から何分の時点で何が終わっていれば順調か」を書いてある。
チームは自分の時計だけを見ればよく、他チームと比べる必要が無い。

| チーム | Step1（`logic` + テスト） | Step2（画面） | Step3（残りと異常系） |
|---|---|---|---|
| A ババ抜き | 70分 | 85分 | 95分 |
| B 神経衰弱 | 70分 | 85分 | 95分 |
| C スピード | 70分 | 90分 | 105分 |
| D 七並べ | 65分 | 85分 | 95分（遅くとも105分） |
| E ダウト | 65分 | 85分 | 95分 |
| F 大富豪 | **60 / 68 / 75分の3段** | 95分 | 110分 |

**70〜75分に全体の中間チェックポイントを置いてある。**
この時刻に各チームの Step1 が終わっている前提でマイルストーンを引いた。
中間チェックで `npm run status` を投影すれば、遅れているチームがその場で分かる。

### 9.3 大富豪だけが重い

6本のうち、大富豪だけが明確に重い。理由は3つである。

1. **ルールが3つあり、互いに干渉する。**
   8切りと革命は独立しているが、8を含む4枚出しでは同時に発動する。
   他の5本は「ルールが1つ」か「ルールが複数でも干渉しない」。
2. **「出せる組の列挙」が必要な唯一のゲームである。**
   他の5本は1枚単位の判定（`canPlay` / `canPlace` / `isBluff`）で済む。
   大富豪だけが `getLegalPlays` という**組を返す関数**を必要とする。
3. **人間の入力も最も重い。** 手札から複数枚を選び、選択の合法性を見て「出す」ボタンの活性を切り替える。
   1クリックで確定する他の5本と比べ、画面側の作業量が明確に多い。

結果として、実装の終了目安が他の5本より **10〜15分遅い110分**になる。
Draft Pull Request の締切（115〜121分）にいちばん近いチームであり、放置すると
「実装は動いているが Pull Request が出ない」という最悪の結末になる。

### 9.4 大富豪を吸収するための4つの手当

**難易度を下げるのではなく、重さを吸収する仕掛けを4つ入れてある。**
ゲームとしての面白さ（8切りと革命）を残したまま、時間のリスクだけを下げるのが狙いである。

#### 手当1: 正典の雛形を6本でいちばん厚くする

`docs/games/daifugo.md` の「状態の設計（雛形）」は6本で最も長い。型とシグネチャに加えて、
**設計判断そのものを先に書いてある。**

- `DAIFUGO_RANK_ORDER` を定数として与える（`@core` の既定の強さは A が最弱なので、そのままでは使えない）
- `Field` 型に `count` を持たせる理由（枚数の比較を読みやすくするため）まで書く
- `getLegalPlays` に「**すべての組み合わせを作ろうとしないこと**」を明記する
- 「場が流れた」を表す演出用フェーズ（`"flowing"` など）を**作るな**と禁止する

雛形を厚くしても実装は減らない。**減るのは「どう設計するか迷う時間」である。**
上級チームで削るべきなのは実装時間ではなく、設計の迷いの時間だという判断による。

#### 手当2: Issue の Step を3段に割る

他の5本は Step1 / Step2 / Step3 の3段だが、大富豪だけ Step1 を3段に割ってある。

| 段 | 内容 | 目安 | ここで緑になるテスト |
|---|---|---|---|
| Step1-a | 出せる判定（`isLegalPlay` / `getLegalPlays` / パス） | 60分 | 4件 |
| Step1-b | 8切り | 68分 | 1件 |
| Step1-c | 革命 | 75分 | 1件 |

**75分の時点で「今どの段にいるか」を聞けば、遅れが1問で分かる。**
中間チェックポイント（70〜75分）の直後に判断できるので、削る決断が最も早く下せる。
75分に Step1-c へ入れていなければ、革命はその場で落とす。

#### 手当3: CPU のフォールバックを最初から用意しておく

「時間が足りないときに落とす順番」の3番に、**CPU を「1枚出しのみ」に切り替える**を置いてある。

- CPU は手札から出せる1枚を探すだけになり、`getLegalPlays` が実質不要になる
- **人間は今までどおり複数枚出せる。** ルールは1つも落ちない
- 落ちるのは CPU の賢さだけで、必須テスト7件はすべて残る

**いちばん重い部品（組の列挙）を、ルールを1つも削らずに外せる逃げ道**を先に用意してある、ということである。
当日その場で考えると必ず「革命を消す」から手を付けてしまうので、順番のほうを先に決めておく。

#### 手当4: Team F は5名配置し、レビューを別メンバーに分担する

- **Team F だけ5名。** 他チームは3〜4名でよい。
- チーム内で**実装3名 / レビュー2名**に分ける。
- レビュー担当の2名は、全体のレビュー時間（127分）を待たず、**110分ごろから相手チームの
  Pull Request を見始めてよい。**

これは人数の問題ではなく**時間帯の衝突**の問題である。
実装が押している127分に実装担当をレビューへ引き抜くと、大富豪の実装は完全に止まる。
先に人を分けておけば、実装は最後まで3名で走り続けられる。

なお、**大富豪をレビューする側**も6ゲームで最大の差分を読むことになる。
そちらのチームにも「レビューは2名で分担してよい」と事前に伝えておく。

### 9.5 早く終わったチームの扱い

発展機能へ進ませる。ただし**各ゲームの発展機能は、すべて自分のフォルダの中だけで完結するものに限ってある。**
「共通基盤に機能を足せば実現できる発展機能」は1つも載せていない。
早く終わったチームが `src/core/` に手を出すのが、この構成でいちばん起きてほしくない事故だからである。

### 9.6 全体が遅れているときの切り捨て順

上から順に切る。**順番を入れ替えない。**

| # | 切るもの | 稼げる時間 | 判断の目安 |
|---|---|---|---|
| 1 | 発展課題を全面禁止 | 0分（脱線を防ぐ） | 70分の時点で3チーム以上が `logic` 未完 |
| 2 | UI の作り込み（CSS Modules 禁止） | 10〜15分 | 96分の時点で2チーム以上が画面未表示 |
| 3 | 中間チェックを短縮（5分 → 2分） | 3分 | 開始が押している場合のみ |
| 4 | レビュー 25分 → 18分 | 7分 | 127分の時点で Draft PR が4本以下 |
| 5 | 大会 12分 → 6分 | 6分 | 163分の時点でマージが3本以下 |

**118分が介入ラインである。** この時刻に `npm run verify` が緑でないチームには、
講師が参加者の合意を待たずに削る決断を下す。

このとき `index.ts` の `status` は **`"coming-soon"` のままにさせる。**
`"ready"` にすると契約テストが「`logic.test.ts` に `it(` が3件以上」と
「画面が例外なく描画でき `GameShell` を使っている」を要求し、未完成なら確実に赤くなる。

**`status: "coming-soon"` のままでも Pull Request は出せるし、マージもできる。**
アーケードの一覧には `ComingSoonPanel` が出るだけである。
未完成のままマージすることは失敗ではない。間に合わない範囲を正直に切って動くものだけをマージするのは、
実務そのものである。

---

## 10. GitHub Issue 設計

Issue は「当日いちばん読まれる文書」である。設計書も README も当日は開かれない。
したがって、**チームが知るべきことはすべて Issue 本文に入っていなければならない。**

### 10.1 ラベル15種

`scripts/setup-labels.ps1` が `--force` 付きで作る（何度実行しても安全）。

| ラベル | 色 | 用途 |
|---|---|---|
| `game` | 青 | チームが担当するゲームの実装 |
| `team-a` | 紫 | Team A / ババ抜き |
| `team-b` | 紫 | Team B / 神経衰弱 |
| `team-c` | 紫 | Team C / スピード |
| `team-d` | 紫 | Team D / 七並べ |
| `team-e` | 紫 | Team E / ダウト |
| `team-f` | 紫 | Team F / 大富豪 |
| `difficulty:easy` | 緑 | 初級 |
| `difficulty:normal` | 青 | 中級 |
| `difficulty:hard` | 橙 | 上級 |
| `stretch-goal` | 黄 | 発展課題（必須ではない） |
| `blocked` | 赤 | 詰まっている・講師の判断待ち |
| `bug` | 赤 | 大会で見つかった不具合 |
| `core-change` | 桃 | 共通基盤の変更を含む（講師レビュー必須） |
| `harness:override` | 水色 | **講師のみ**: 範囲チェックを警告に降格する |

ラベル名も色も `harness/config.json` の `teams` から機械的に導いている。
チーム構成を変えたらラベルもそのまま追随する。

**`harness:override` だけは性格が違う。**
これは CI の範囲チェックを `--warn-only` に落とす**非常口**で、講師だけが付ける。
研修中に「共通基盤を1行直さないと6チーム全員が進めない」事態が起きたときのために用意してある。
逃げ道を明文化しておかないと、参加者が独自の迂回策を発明してしまう。

### 10.2 Issue 本文の構成

実物は `.github/issue-bodies/<チーム>-<ゲームID>.md` にある。構成は9ブロックで、全チーム同じ形である。

| ブロック | 内容 | 出どころ |
|---|---|---|
| 見出し | 「〇〇（`gameId`）を実装する」 | `harness/config.json` |
| 担当 | チーム / 難易度 / ブランチ名 / **編集してよい範囲** / 正典へのリンク | `harness/config.json` |
| 最初にやること | `git switch -c` → `npm run scaffold` → `npm test` → 最初のコミット → **Draft PR** → `/kickoff` | 固定文（コマンドは `gameId` で埋める） |
| 必須要件 | チェックボックスの一覧 | `docs/games/<id>.md` の「必須要件」 |
| 実装の進め方 | Step1 / Step2 / Step3 と、各段の目安時刻 | `docs/games/<id>.md` の「実装の進め方」 |
| 完了条件 | verify が緑 / `status` を `"ready"` に / README / 実機で1回遊ぶ / **アサーションを逆にして赤くなるのを見る** / スクショ / レビュー観点 | 固定文（全チーム共通） |
| 時間が足りないとき | 落とす順番 | `docs/games/<id>.md` の「時間が足りないとき」 |
| 発展課題 | 必須要件のあとに手を付けるもの | `docs/games/<id>.md` の「発展課題」 |
| 参考 / 困ったときは | お手本・早見表・`/stuck`・講師への相談条件 | 固定文（全チーム共通） |

設計上の意図が3つある。

- **「編集してよい範囲」を担当表の中に置く。** 本文の途中に注意書きとして書くと読み飛ばされる。
- **`/kickoff` へ到達する前に Draft Pull Request を作らせる。**
  実装が1行も無い状態で push と CI を通しておくと、権限や CI の問題が最も安い時間帯に表に出る。
- **完了条件に「アサーションを1つ逆にして赤くなるのを見る」を入れてある。**
  これを入れないと、通ることだけを確認したテストが必ず出てくる。

### 10.3 Issue 本文は正典から機械生成する

Issue 本文は手で書かない。`scripts/build-issue-bodies.mjs` が
`docs/games/<ゲームID>.md` から4つのセクションを切り出して組み立てる。

```
node scripts/build-issue-bodies.mjs
  -> .github/issue-bodies/team-a-babanuki.md
  -> .github/issue-bodies/team-b-shinkeisuijaku.md
  -> ...（6本）
```

抜き出すのは「必須要件」「実装の進め方」「時間が足りないとき」「発展課題」の4セクションで、
それ以外（担当表・完了条件・参考）は `harness/config.json` の値を埋めた固定文である。

**なぜ機械生成にしたか。**

- ルールの記述が正典と Issue の2箇所にあると、**必ずどちらかが古くなる。**
  当日の参加者は Issue を読み、レビュアーは正典を読む。両者がずれた瞬間に、
  レビューが「仕様の解釈違い」で止まる。
- 直す場所を1つに固定できる。ルールを変えたいときは `docs/games/<id>.md` を直して
  `node scripts/build-issue-bodies.mjs` を実行し直すだけでよい。
- Issue 本文がリポジトリにコミットされているので、**当日 GitHub が使えなくなっても
  参加者は手元のファイルで作業を続けられる。**

出力は **UTF-8 BOM なし / LF** で書く。`gh issue create --body-file` がファイルをそのまま渡すため、
BOM や CRLF が混ざると GitHub 上の表示が崩れる。
本文をコマンドラインで直接渡さないのも同じ理由で、長い日本語はコンソールの文字コードで壊れることがある。

### 10.4 Issue 番号が単一の真実源に戻ってくる

`scripts/setup-issues.ps1` は、作成した Issue の番号を **`harness/config.json` に書き戻す。**

```
setup-labels.ps1     ラベル15種を作る
setup-milestone.ps1  マイルストーン "CARD ARCADE v1" を作る
build-issue-bodies.mjs  docs/games/*.md から本文を生成
setup-issues.ps1     Issue を6本作り、番号を harness/config.json へ書き戻す
npm run scaffold -- --all --force   雛形の manifest に issueNumber を反映
```

この一巡で、**アーケードのタイルから担当 Issue へリンクが張られる。**
Issue 番号という「あとから決まる値」も、最終的には `harness/config.json` の1箇所に集まる。

付けるラベルは `game` + `<チームID>` + `difficulty:<難易度>` の3つで、
すべて `harness/config.json` から組み立てる。手で付けるラベルは `blocked` / `bug` / `stretch-goal` /
`core-change` / `harness:override` の5つだけである。

---

## 11. Claude Code の使い方

AI 向けの指示ファイルは **`CLAUDE.md`** に統一した（`AGENTS.md` は作らない）。
ルート / `src/games/` / `src/core/` / `src/components/` の4階層に置き、
**Claude がそのフォルダのファイルを開いた時点で、その階層の CLAUDE.md が効く**構造にしている。
指示を1枚に集約せず、必要な場所に必要なぶんだけ置くのが狙いである。

その上で、当日の操作は**8本のスラッシュコマンド**に落としてある。
参加者はプロンプトを考えない。**打つのはコマンド名だけである。**

### 11.1 スラッシュコマンド8本

| コマンド | 何をする | 引数 | Edit / Write | 止まる場所 |
|---|---|---|---|---|
| `/kickoff` | Issue を読んで実装計画を立てる | Issue番号 | **使えない** | 計画を出したら止まる。人間の合意待ち |
| `/implement` | 合意済みの計画に沿って実装する | Step番号（省略可） | 使える | 報告を出して、人間に実機確認を依頼する |
| `/verify` | `npm run verify` と Issue の完了条件を突き合わせる | Issue番号（省略可） | 使える | 未達を未達と書いて報告する |
| `/pr` | Pull Request の本文を `.pr-body.md` に作る | なし | 使える（`.pr-body.md` のみ） | **`gh pr create` は実行しない** |
| `/review` | 他チームの Pull Request を読む | PR番号 | **使えない** | **コメントは投稿しない** |
| `/fix-review` | 付いた指摘の対応方針を表にする | PR番号 | 使える | **先に方針だけ出す。** 合意前に直さない |
| `/stuck` | 詰まった状況を整理して次の一手を出す | 困りごと（自由文） | **使えない** | **直さない。** 次の一手を1つだけ出す |
| `/handoff` | Driver 交代の引き継ぎメモを10行で作る | なし | 使える | 次の人が最初に打つコマンドを1つ示す |

**8本すべてに `disable-model-invocation: true` を付けてある。**
Claude が自分の判断でこれらを呼ぶことはできず、**人間が打ったときだけ動く。**
「今どのコマンドの中にいるか」を人間が常に把握できる状態を保つためである。

コマンドの粒度は「研修の1コマ = 1コマンド」で切った。
`/kickoff` から `/pr` までを順に打てば、そのまま当日の進行になる。
`/stuck` と `/handoff` は進行から外れたときの2本で、どちらもコードを変更しない。

### 11.2 `/kickoff` は「コードを変更しない」を仕組みにしてある

`/kickoff` の先頭には次の1行が入っている。

```yaml
disallowed-tools: Edit, Write, NotebookEdit
```

**このコマンドの実行中だけ、編集ツールが存在しなくなる。**

「まだコードは書かないでください」と本文でお願いする方式は採らなかった。理由は単純で、
**お願いは守られないことがあるからである。** 特に、計画を書いているうちに
「ついでにここも直せる」と判断が働く場面で破られる。

計画のフェーズにコードを書き始めると、この研修でいちばん高くつく失敗が起きる。

- 人間が計画をレビューする前に実装が進み、**レビューが「もう書いてあるもの」の追認になる**
- 計画とコードがずれたときに、どちらが正しいのか誰も分からなくなる
- 「AI に計画を立てさせて、人間が判断する」という研修の中心の体験が消える

同じ理由で `/review` と `/stuck` からも編集ツールを外してある。

- `/review` — 他チームのコードを読んでいる最中に、**善意で直してしまう**のを止める
- `/stuck` — 詰まっているときに大きな作り直しを始めるのを止める
  （研修でいちばん時間を失う失敗がこれである）

**「読むだけの時間」を、意思ではなく仕組みで作る。**
これがスラッシュコマンド設計の中心にある考え方である。

なお `/pr` も `gh pr create` を実行しない。本文を `.pr-body.md` に書いて人間に渡すところで止まる。
`.pr-body.md` は `.gitignore` に入れてあり、コミットされない。

### 11.3 人間が確認する4フェーズ

AI の出力をそのまま信じない、を4回に分けて配置してある。
**どのフェーズも「読んで判断する」ではなく「手を動かして確かめる」形にしてある。**

| # | フェーズ | 時刻 | 人間が確かめること | 見落とすと起きること |
|---|---|---|---|---|
| 1 | **計画** | 46〜54分 | `/kickoff` の計画と Issue の必須要件が1対1で対応しているか。ルールの解釈が正典と食い違っていないか。テストが正常系に偏っていないか。担当フォルダの外を触る計画になっていないか | 実装が全部終わってから作り直しになる。この研修で最も高い手戻り |
| 2 | **実装後** | `/implement` の報告直後 〜 108〜115分 | **`npm run dev` で最初から最後まで1回遊ぶ。** テストのアサーションを1つわざと逆にして、赤くなることを見る | 「テストは緑だが遊べない」Pull Request が出る。レビュアーの時間まで失う |
| 3 | **PR前** | 115〜121分 | `.pr-body.md` の「**レビューしてほしい点**」を自分の言葉で書く。採用したルールと採用しなかったルールが書かれているか | レビュアーがどこを見ればよいか分からず、指摘が「動きません」で終わる |
| 4 | **レビュー時** | 127〜152分 | `/review` が出した指摘のうち、**自分が実機で確認できたものだけ**を投稿する。確認できていないものは「未確認」と明示する | AI の推測がそのまま他チームへの指摘になり、相手が存在しないバグを探す |

フェーズ2の「アサーションを1つ逆にする」は、Issue の完了条件にチェックボックスとして入っている。
**テストが本当に仕様を確認しているかは、赤くなるのを一度見るまで分からない。**

`/pr` が「レビューしてほしい点」を**空欄のまま残す**のは、この4フェーズを成立させるための仕掛けである。
ここを AI に埋めさせると、参加者は自分のコードのどこが怪しいかを一度も考えないまま Pull Request を出す。

`/verify` の最後には `rule-checker` サブエージェントの起動を入れてある。
実装したセッションとは**別の文脈で差分だけを見る**ので、
「自分が書いたものを正当化する」バイアスが入らない。編集ツールも持っていない。

---

### 11.4 AI が間違えやすいところと、それをどの層で止めているか

**どれも「AI が悪い」ではなく「そう書くのが最短に見える」から起きる。**
だから注意書きではなく、機械で止める場所を決めてある。
層の呼び方（Layer 0〜4）はハーネスの章に合わせている。

| AI がやりがちなこと | なぜそう書くのが自然か | 止める層と仕掛け | 硬さ |
|---|---|---|---|
| `src/core/` に関数を足して解決する | いちばん短い解決に見える | **L2** `settings.json` の `deny: Edit(src/core/**)` と `guard-scope` フック / **L3** pre-commit の `scope-guard` / **L4** CI の範囲チェックと CODEOWNERS | 機械で止める |
| `sed -i` やリダイレクトで保護領域に書く | 編集ツールが拒否されたので別の手段を探す | **L2** `guard-bash` が `>` `>>` `tee` `sed -i` `cp` `Set-Content` などを見て止める / **L4** CI の範囲チェック | 機械で止める |
| `npm install` で足りないものを補う | ライブラリを入れるのが常識的な解決だから | **L2** `deny: Bash(npm install *)` と `guard-bash` / **L4** CI の「依存が変わっていないか」ステップ | 機械で止める |
| `@core/deck` のように深く import する | フォルダ構成が見えているので自然に書ける | **L0** エイリアスは `@core` / `@ui` の2つだけで、バレルの実体へ完全一致解決する。**深い指定はモジュール解決の時点で失敗する** / **L3** ESLint と契約テスト | そもそも動かない |
| 他チームのゲームを参考にコピーする | 似た実装が同じリポジトリにあるから | **L3** ESLint の `**/games/*/**` 禁止 + 契約テスト「他のチームのゲームを参照していない」 / **L4** CI | 機械で止める |
| `logic.ts` で `Math.random()` / `Date.now()` を使う | シャッフルと待ち時間に必要だから | **L1** `CLAUDE.md` のコード規約 / **L3** ESLint（error）+ 契約テスト「乱数と時刻を直接使っていない」 | 機械で止める |
| `logic.ts` から react や `@ui` を import する | 状態と表示を一緒に書くほうが早いから | **L3** ESLint（error）+ 契約テスト「画面のことを知らない」 | 機械で止める |
| `.tsx` に `setTimeout` を書く | 待ち時間は画面の仕事に見えるから | **L0** 雛形とお手本が `useCpuTurn` の形になっている / **L1** `CLAUDE.md` の「いちばん大事な型」 / Issue の必須要件に**1行として明記** | レビューで見る |
| `eslint-disable` で警告を消す | 赤を消すのがいちばん速いから | **L3** 契約テスト「eslint のルールを無効化していない」 | 機械で止める |
| `localStorage` を直接使う | 保存の標準的なやり方だから | **L3** ESLint の `no-restricted-globals`（error）。`useHighScore` / `gameKey` に誘導する | 機械で止める |
| 未完成なのに `status: "ready"` にする | Issue の完了条件に書いてあるから | **L3** manifest 契約テスト（`it(` が3件以上 / 画面が例外なく描画でき `GameShell` を使う） / **L4** CI | 機械で止める |
| 計画のフェーズでコードを書き始める | 計画中に直せる箇所が見えてしまうから | **L2** `/kickoff` の `disallowed-tools` で編集ツールを外す | 実行できない |
| `--no-verify` でコミット前チェックを飛ばす | 止まったので回避したいから | **L2** `deny` と `guard-bash` の両方で止める | 機械で止める |
| 検証しないまま「できました」と言う | 実装が終われば作業は終わりに見えるから | **L2** Stop フック `require-verify` が**1回だけ**引き止める（2回目は通す） | 声をかけるだけ |
| `any` を使う / 関数が長い / `console.log` が残る | 手が早いときほど起きる | **L3** ESLint の warn のみ | **警告に留める** |

### 11.5 硬さの基準は「他チームに波及するか」

上の表の最後の1行だけ扱いが違う。これは意図的である。

**その違反が他チームに波及するかどうかで、硬さを決めている。**

| 波及する（機械で止める） | 自分のフォルダに閉じる（警告に留める） |
|---|---|
| 共通基盤の変更 | `any` の使用 |
| 依存の追加（`package-lock.json` が変わると6チーム全員の PR が競合する） | 関数や1ファイルの行数 |
| 他チームのゲームへの参照 | `console.log` の残り |
| `logic.ts` の非純粋化（テストが不安定になる） | 複雑度 |

前者を1つ通すと、他のチームの Pull Request が落ちる。**個人の判断で通してよい範囲ではない。**
後者は自分のフォルダの中だけの話なので、機械で止めずに**レビューの題材に回す。**
警告として画面に出ているので、レビュアーは「ここに warn が出ていますが意図的ですか」と聞ける。
すべてを error にすると、レビューで話すことが無くなる。

### 11.6 どの層がバイパスできるか

これは正直に参加者へ伝えておく。**隠すと迂回策を発明されるからである。**

| 層 | 何をする | バイパスできるか |
|---|---|---|
| L0 scaffold | 構造を間違えられなくする | — （予防なので破る対象が無い） |
| L1 `CLAUDE.md` ×4 | Claude に前提を伝える | AI の判断次第 |
| L2 permissions とフック | 書こうとした瞬間に止める | **できる**（`--dangerously-skip-permissions`） |
| L3 ESLint / 契約テスト / pre-commit | コミットさせない | **できる**（`git commit --no-verify`） |
| L4 CI verify / CODEOWNERS / ブランチ保護 | マージさせない | **できない** |

だから L2 と L3 は「**早く気づかせて時間を節約する装置**」、L4 は「**本当に止める装置**」と役割を分けてある。
L2 で止まったものを L3 と L4 が二重三重に受けるので、飛ばしても最後は必ず捕まる。

`CLAUDE.md` の冒頭には「迂回策を探さないでください」と明記し、
**共通基盤の変更が必要だと判断したら手を止めて講師に相談する**のが正しい行動だと書いてある。
そのうえで講師には `harness:override` ラベルという非常口を用意してある。
**正しい非常口を1つ用意しておくと、間違った抜け道を探さなくなる。**

---
## 12. 開発ハーネスの設計

この章がこの設計書の中心となる。8章までで決めた「6チームが同じ形の成果物を出す」という要求を、
口頭ルールではなく**動くコード**で実現する仕組みを扱う。実体は
`harness/config.json` / `scripts/` / `templates/` / `.claude/` / `.githooks/` / `tests/contract/` / `.github/` に置いてある。

### 12.1 なぜハーネスが要るか

180分のあいだ、6チーム・最大30名が1つの `main` を共有する。
さらに各チームが Claude Code のセッションを持つため、**6つの独立した書き手**が同時に同じリポジトリへ書き込む。

この規模で口頭ルールは必ず破られる。問題は、破られたときに困るのが破った本人ではなく**他の5チーム**である点にある。

研修で実際に起きる事故を5つに絞ると次のようになる。

| # | 事故 | 直接の原因 | 波及範囲 | 発覚が遅れたときの被害 |
|---|---|---|---|---|
| 1 | 共通基盤を「ついでに」直す | ゲーム側から使いやすくしようとする善意 | **6チーム全員** | 他チームのテストが突然赤くなる。原因が自分の変更でないため誰も気づけない |
| 2 | `npm install` して lockfile が変わる | 「この機能にはこのライブラリが要る」という判断 | **6つの Pull Request 全部** | `package-lock.json` が全 PR で競合し、マージ順に依存した解決作業が発生する |
| 3 | フォルダ構造がチームごとにばらつく | 手で作る / AI が独自の構成を提案する | レビュアー全員 | レビューのたびに構造を読み直す。ゲーム自動検出に載らない |
| 4 | `logic.ts` に `Math.random()` を書く | 「シャッフルするから乱数が要る」 | そのチーム + レビュアー | テストが時々落ちる。原因が実装かテストか判別できず、残り時間を溶かす |
| 5 | `verify` を通さずに「できました」と言う | 画面が動いたので完成だと判断する | レビュー担当チーム | 115分以降に CI が赤くなり、レビュー担当チームが待たされる。輪になっているので2チームが同時に止まる |

いずれも、**気づくのが遅いほど高くつく**という共通の性質を持つ。

| どこで止まるか | 直すのにかかる時間 |
|---|---|
| 書く前（フック） | 数秒 |
| コミット前（pre-commit） | 数十秒 |
| Pull Request（CI） | 数分 + レビュアーの待ち時間 |
| マージ後 | 全チームが巻き込まれる |

したがってハーネスの設計目標は「違反を検出すること」ではない。
**同じ違反を、できるだけ早い段階で、同じ言葉で説明すること**である。
講師が「なぜダメか」を説明するのは1回で済み、2回目以降は機械が同じ説明をする。
講師の時間は、機械が判定できないこと（ルール解釈・要件の削り方・レビューの質）に使う。

### 12.2 5層モデル

ハーネスは5層で構成する。層ごとに「いつ止めるか」と「抜けられるか」が違う。

| 層 | 実体 | 役割 | いつ止まるか | 抜け方 |
|---|---|---|---|---|
| **Layer 0** 予防 | `scripts/scaffold-game.mjs` / `templates/game/` | そもそも間違った構造を作らせない | 書き始める前 | 手で書けば抜けられる（そのとき Layer 3 が拾う） |
| **Layer 1** 伝える | `CLAUDE.md` 4階層 / `session-brief.mjs` | 何が禁止かを Claude と人間の両方に伝える | 考える前 | 強制力なし（読ませるだけ） |
| **Layer 2** その場で止める | `.claude/settings.json` の deny / `.claude/hooks/` 5本 | 書こうとした瞬間に拒否する | ツール実行の直前 | 権限確認の全面スキップ起動 |
| **Layer 3** コミットさせない | ESLint 境界ルール / `tests/contract/` 3本 / 型チェック / `.githooks/pre-commit` | 違反をコミットできなくする | `git commit` と `npm run verify` | pre-commit は `--no-verify` |
| **Layer 4** マージさせない | `.github/workflows/ci.yml` の verify / CODEOWNERS / ブランチ保護 | 赤い Pull Request をマージできなくする | Pull Request | **管理者権限が要る** |

**Layer 4 だけがバイパス不能**である。ここが設計の要になっている。

- Layer 0〜3 は参加者の手元にある。手元にあるものは必ず抜けられる。
  権限確認を飛ばして起動する、`--no-verify` を付ける、Claude Code を使わずエディタで直接書く — どれも可能である。
- しかし Layer 3 が見ているのは **ソースコードそのものの性質**である。
  `logic.ts` に `Math.random()` が書いてあるという事実は、どんな手順でコミットしても消えない。
- そして CI（Layer 4）は必ず Layer 3 と同じコマンドを実行する。
  つまり **Layer 3 の判定からは、Layer 4 を経由して逃げられない**。
- Layer 4 自体は講師（管理者）が外せる。だから Layer 4 は「絶対の砦」ではなく「**運用の砦**」である。

この役割分担から、各層の位置づけが決まる。

- **Layer 2・3 は「早く気づかせて時間を節約する装置」**。参加者の味方である。抜けられてよい。
- **Layer 4 は「本当に止める装置」**。全員の味方である。抜けられてはいけない。

当日 Step 4 の講師デモは、この1文をそのまま実演する構成にしてある。
「手元の層は君たちのための時短で、CI の1本は全員のための防波堤」という説明で通る。

> 参加者向けの `docs/harness.md` と `docs/handson-steps.md` では、
> 数え方を Layer 1〜5 と1始まりにしている（「Layer 0」を初学者に出さないため）。中身は同じである。

### 12.3 各層の中身

#### 12.3.1 Layer 0 — scaffold と templates/game/

構造の定義は**1箇所しかない**。`templates/game/` の5つのテンプレートである。

```text
templates/game/
├─ index.ts.tmpl
├─ Game.tsx.tmpl
├─ logic.ts.tmpl
├─ logic.test.ts.tmpl
└─ README.md.tmpl
```

`npm run scaffold -- --game <ゲームID>` が `harness/config.json` の値を差し込んで展開する。
差し込む値（`GAME_ID` / `COMPONENT` / `STATE` / `ACTION` / `ICON` / `MIN_PLAYERS` など）はすべて設定ファイル側にある。

**却下した案: 手順書に「この5ファイルを作れ」と書く。**
6チームが手で作れば必ず揺れる。ファイル名の大文字小文字、型名の付け方、`index.ts` に処理を書くかどうか。
揺れた構造はレビューのたびに読み直すコストになり、契約テストの前提も崩れる。

同じスクリプトが2つの役割を兼ねている点も意図的である。

- 参加者は `--game <ゲームID>` で自分の1つを作る
- 運営は `--all` で6チーム分をまとめて用意する

**お手本・スケルトン・契約テストの前提が原理的にズレない。** 生成元が同じだからである。

さらに、雛形自体が規約違反になっていないことを CI が保証している
（`.github/workflows/scaffold-selftest.yml`）。`templates/**` か `scaffold-game.mjs` か
`eslint.config.js` か `tests/contract/**` が変わったら、6チーム分を `--all --force` で作り直し、
その状態で lint / 型 / テスト / ビルドが通ることを確認する。
**「scaffold した直後に verify が赤い」は当日いちばん士気を削ぐ事故なので、機械で潰してある。**

生成したファイルには `@scaffold:untouched` というマーカーが入る。
`--force` はこのマーカーが残っているファイルだけを作り直すので、参加者が書いたコードを消さない。

対話モードは**あえて用意していない**。Claude Code から実行したときに入力待ちでセッションが止まるためである。
引数なしで実行すると一覧が出るだけにしてある。

#### 12.3.2 Layer 1 — CLAUDE.md 4階層

AI 向けの指示ファイルは `CLAUDE.md` に統一する（`AGENTS.md` は作らない）。
形式を2つに増やすと、片方だけが更新されて食い違う。

配置は4階層。**それぞれ「読まれるタイミング」が違う。**

| 置き場所 | 読まれる場面 | 書いてあること |
|---|---|---|
| `CLAUDE.md`（ルート） | セッション開始時 | 絶対に守る5条 / チーム表 / 覚える3コマンド / 5ファイル構成 / reduce と pendingDelayMs の型 |
| `src/games/CLAUDE.md` | ゲームを実装しようとしたとき | ファイルの役割（混ぜない）/ GameManifest / `@core` と `@ui` の早見表 / CPU の作り方 / よくある失敗 |
| `src/core/CLAUDE.md` | **`src/core/` を覗いた瞬間** | 「停止: ここは運営管理の領域です」/ 読むのは自由・変更は不可 / 報告テンプレート |
| `src/components/CLAUDE.md` | **`src/components/` を覗いた瞬間** | 同上 |

**下2つの配置に意味がある。**
ルートの `CLAUDE.md` に「`src/core/` を変更しない」と書いてあっても、
長いセッションの後半では前提が薄れる。共通基盤に手を入れたくなるのは、たいてい実装が詰まった後半である。

`src/core/CLAUDE.md` を core の中に置くと、**そのフォルダを読もうとした瞬間に制止が届く**。
「必要な機能が無いと思ったとき」の報告テンプレートも同じ場所に置いてあるので、
禁止の直後に「では何をすべきか」が続く。禁止だけを伝えると、AI は回り込む方法を探し始める。

動的な情報は `CLAUDE.md` には書けない。「今どのチームの担当か」はブランチ名で決まるからである。
これは SessionStart フック（`session-brief.mjs`）が毎回注入する。

```text
# 今のセッションの前提

- 担当: Team A / ババ抜き（ゲームID: babanuki）
- ブランチ: feature/babanuki
- 編集してよい場所: src/games/babanuki/ の中だけ
```

Driver が交代してセッションを開き直しても、前提がずれない。
ブランチを切っていない場合は「まだ作業ブランチを作っていません」と出て、`git switch -c` を促す。

#### 12.3.3 Layer 2 — .claude の permissions

`.claude/settings.json` の `permissions` は **deny 中心**にしてある。ask は最小限に留めた。

**却下した案: 危険な操作をすべて ask にする。**
研修中の参加者は、**ほぼ必ず「はい」を押す**。時間に追われている状態で、
AI が「共通基盤を直せば早く終わります」と提案してきたら、内容を吟味せずに承認する。
ask は「判断できる人」にしか意味を持たない。参加者はその判断材料をまだ持っていない。

そこで、**判断させたくないものは deny にして選択肢ごと消す**。

| 分類 | 例 | 決め方 |
|---|---|---|
| deny | `Edit(src/core/**)` `Edit(.claude/**)` `Edit(package.json)` / `Bash(npm install *)` / `Bash(git commit --no-verify *)` / `Bash(git config core.hooksPath *)` | 他チームに波及する。押し間違えると取り返しがつかない |
| ask | `Bash(git push *)` `Bash(gh pr create *)` `Bash(git reset --hard *)` | **人間が主語であるべき操作**。押す前に一拍置かせたい |
| allow | `Bash(npm run *)` `Bash(git add *)` `Bash(gh pr checkout *)` | 何度実行しても壊れない。ここで確認を挟むとテンポが死ぬ |

`defaultMode` は `acceptEdits` にしてある。
担当フォルダの中の編集をいちいち確認していては180分では終わらない。
**「中は自由、外は不可」という線引きを、モードと deny の組み合わせで表現している。**

ask に残した `git push` と `gh pr create` には別の意図もある。
研修の目的の1つが「自分の言葉で説明を書く」ことなので、**PR を出す瞬間だけは人間の手に戻す**。

#### 12.3.4 Layer 2 — フック5本

フックは5本。それぞれ役割が重ならないようにしてある。

| フック | イベント | 役割 |
|---|---|---|
| `guard-scope.mjs` | PreToolUse (Write / Edit) | 担当範囲の外に書こうとしたら止める。**「なぜダメか」と「次にどうすべきか」を日本語で返すのが本体** |
| `guard-bash.mjs` | PreToolUse (Bash / PowerShell) | コマンド経由の回り込みを止める |
| `format-file.mjs` | PostToolUse (Write / Edit) | 担当フォルダの中だけ prettier をかける |
| `require-verify.mjs` | Stop | `npm run verify` を通さずに終わろうとしたら**1回だけ**引き止める |
| `session-brief.mjs` | SessionStart | 今の担当をセッションに注入する |

**`guard-scope.mjs` は deny と同じ場所を塞いでいる。冗長に見えるが役割が違う。**
deny は「拒否」しか返せない。フックは文章を返せる。

```text
src/core/index.ts は運営が管理している場所なので変更できません。

編集してよいのは src/games/<自分のゲームID>/ の中だけです。

共通基盤への変更が必要かもしれません。次の形で人間に報告してください:

  - やりたいこと:
  - 足りないと思うもの:
  - ゲーム側だけで実現する案（あれば）:
```

このメッセージは3つの部分でできている。**何が起きたか / どこなら書けるか / 次に何をするか**。
形を固定してあるので、参加者は3回目からは最後の段落だけを読むようになる。

`guard-scope.mjs` は「他チームのゲームフォルダ」も見分ける。
ブランチ名から担当を割り出し、`feature/speed` にいるのに `src/games/babanuki/` を触ろうとしたら
「Team A（ババ抜き）の担当です」と返す。ブランチを切っていない場合だけは deny ではなく ask にしてある
（作業を止めるのではなく `git switch -c` に誘導したいため）。

`guard-bash.mjs` は deny の穴を埋める。
deny はコマンドの先頭を見るので、`echo "x" >> src/core/index.ts` や `sed -i` のような
「シェル経由で保護領域に書く」形を捉えられない。ここで止めているのは6つ。

1. 依存の追加・削除（`npm` / `yarn` / `pnpm` / `bun` の install・add・remove・update。`npm ci` と引数なしの `npm install` は通す）
2. `--no-verify`
3. 強制 push と `main` への直接 push
4. `vitest` の直接起動（監視モードに入るとセッションが返ってこなくなる）
5. リダイレクト・`sed -i`・`cp`・`mv` による保護領域への書き込み
6. `.claude/settings.json` 自体の書き換えと、ハーネス無効化の環境変数

5 は **`feature/*` にいるときだけ**判定する。運営が `main` で共通基盤を整備するときに邪魔をしないためである。
`git restore` `git checkout` `git stash` などの復旧コマンドは明示的に通す。
**止められた人が元に戻せなくなるのが最悪の状態**だからである。

`require-verify.mjs` は「動いたつもりで PR を出したら CI が赤」という最頻出の失敗を狙っている。
作業ツリーのハッシュを取り、`npm run verify` の完走時に記録されたハッシュ（`mark-verified.mjs` が書く）と比べる。
一致しなければ1回だけ引き止める。

**2回目は必ず通す。** 引き止めが繰り返されると作業が詰まり、参加者はハーネスごと切りに行く。
「1回だけ声をかける」は、無視できる警告と絶対に通れない壁の中間として選んだ落としどころである。

`format-file.mjs` の目的はコードの美しさではない。**差分ノイズを消すこと**である。
整形の差分が混ざると、レビューで本質的な指摘までたどり着けない。
だから担当フォルダの中だけにかけ、保護領域には触らない。

#### 12.3.5 Layer 3 — ESLint の境界ルール

`eslint.config.js` は「読みやすさ」ではなく「境界」を書く場所として使う。

**`logic.ts` と `cpu.ts` の純粋性を機械で強制する**のが最大の目的である。

```text
src/games/*/logic.ts, cpu.ts, rules.ts に適用

no-restricted-imports    react / react-dom / @ui を禁止
no-restricted-properties Math.random / Date.now を禁止
no-restricted-globals    window / document / localStorage を禁止
no-restricted-syntax     new Date() を禁止
```

メッセージには必ず**代替手段**を書く。

```text
Math.random() は使えません。乱数は引数で Rng を受け取り、テストでは createRng(seed) で固定します。
```

これは6章で決めた `reduce(state, action)` と `pendingDelayMs(state)` の型を成立させるための土台になる。
`logic.ts` から乱数と時間が消えれば、テストは `reduce` を順番に呼ぶだけで書ける。
**12.1 の事故4「テストが時々落ちる」が構造的に起きなくなる。**

ゲームフォルダ全体には、依存の向きを固定するルールを当てる。

| 禁止する import | 理由 |
|---|---|
| `../*` `../../*` | 自分のフォルダの外を相対パスで見に行かせない |
| `@core/*` `@ui/*` | **入口だけを使わせる。** 深い指定を許すと公開 API の意味が消える |
| `**/games/*/**` | ゲーム同士を完全に独立させる |
| `src/*` `@/*` | パスの書き方を1つに固定する |

逆向きも塞いである。`src/core/**` と `src/components/**` からは games と `@ui` を参照できない。
依存を **core ← components ← games** の一方向に固定する。

`@core/*` の禁止は ESLint だけに頼っていない。
`vite.config.ts` と `tsconfig.json` のエイリアスを**完全一致**にしてあるので、
`@core/deck` は**モジュール解決の時点で失敗する**。

```ts
// vite.config.ts — オブジェクト形式ではなく配列（正規表現）で書く
alias: [
  { find: /^@core$/, replacement: "<repo>/src/core/index.ts" },
  { find: /^@ui$/,   replacement: "<repo>/src/components/index.ts" },
]
```

オブジェクト形式にすると前方一致置換になり、`@core/deck` が `src/core/index.ts/deck` に化けて
分かりにくいエラーになる。**正規表現で完全一致にしておくと、ESLint を無効化されても境界が守られる。**

#### 12.3.6 Layer 3 — 契約テスト3本

ESLint には決定的な弱点がある。**`eslint-disable` コメント1行で自分を無効化できる。**
AI に「lint が通るように直して」と頼むと、`eslint-disable` を書いて通すことがある。

そこで、ソースを静的に走査する契約テストを3本置いた。
**ESLint が自分の無効化を防げないことへの、二重の網**である。

| ファイル | 見ているもの |
|---|---|
| `tests/contract/boundaries.contract.test.ts` | 境界。`../` の参照 / 他ゲームの参照 / `@core/` の深い import / **`eslint-disable` の存在そのもの** / `logic.ts` の `Math.random` `Date.now` `setTimeout` `react` |
| `tests/contract/manifest.contract.test.tsx` | 形。必須ファイルが揃っているか / README の3見出し / manifest の文字数と人数 / `status: "ready"` のゲームはテスト3件以上・`GameShell` を使って例外なく描画できるか |
| `tests/contract/registry.contract.test.ts` | 登録。全ゲームが読み込めるか / id とフォルダ名が一致するか / `harness/config.json` の対応と一致するか |

**「eslint-disable の存在そのものを検査する」が要である。**
ルール単位で判定しないのは、抜け道の名前を数え上げる方式が必ず漏れるからである。
研修の180分で `eslint-disable` が正当に必要になる場面は無い、と割り切って一律に禁止した。

走査するときテンプレートのコメント行は落としている。
雛形には「`Math.random()` を使わない」という**説明文**が書いてあるので、
そのまま検索すると説明文まで違反として拾ってしまう。

`manifest.contract.test.tsx` の `status` の扱いも設計上の判断である。

- `"coming-soon"` のままなら、テストの件数も描画も要求しない
- `"ready"` に変えた瞬間に、テスト3件以上と「例外なく描画できる」が要求される

つまり **`status` は参加者自身が押す完成宣言のスイッチ**になっている。
118分に講師が「削る決断」を下すときは、`"coming-soon"` のまま PR を出させる。
未完成のままマージできる設計にしてあるのは、
**間に合わない範囲を正直に切って動くものだけを入れるのが実務そのもの**だからである。

なお `it.each` を使わず1つのテストの中でループしているのは、
研修開始時点で `"ready"` が `example-game` だけになり、対象0件だと「テストが1件も無い」で落ちるためである。

#### 12.3.7 Layer 3・4 — scope-guard を pre-commit と CI が共用する

担当範囲チェックの実体は `scripts/scope-guard.mjs` **1本だけ**である。

```text
node scripts/scope-guard.mjs                       作業ツリーを見る（npm run scope）
node scripts/scope-guard.mjs --staged              コミット対象を見る（.githooks/pre-commit）
node scripts/scope-guard.mjs --base origin/main    ブランチ全体を見る（CI）
node scripts/scope-guard.mjs --warn-only           警告のみ（講師の緊急用）
```

**見る差分の取り方だけが違い、判定ロジックは共通である。**
だから「手元では通ったのに CI で落ちた」が**原理的に起きない**。

これは研修の時間設計に直結する。手元と CI で判定がずれると、
参加者は CI のログを読みに行き、原因を推測し、直して push し、また数分待つ。
1往復5分として、6チームで30分が消える。**判定のズレを消すことは、そのまま時間の節約になる。**

判定の材料も1箇所にある。`harness/config.json` の `protectedPaths` / `alwaysWritable` / `teams` である。
`scope-guard` / `scaffold` / 契約テスト / `.claude` のフック / `doctor` / `status` / `score` / `setup-*.ps1` が
すべて同じファイルを読む。**当日チーム構成を変える必要が出たら、ここだけを直せば全部が揃って変わる。**

出力は「直すためのコマンドをそのままコピペできる形」にしてある。

```text
✗ 担当範囲の外が変更されています（1件）

  [運営管理] src/core/index.ts

元に戻すには、次のコマンドをそのまま実行してください:

  git restore --source=HEAD --staged --worktree -- src/core/index.ts
```

**止めるだけで復帰方法を出さない仕組みは、研修では機能しない。**
止められた参加者は自力で戻せず、講師を呼び、講師が6チーム分の同じ作業をすることになる。

pre-commit は `feature/*` にいるときだけ動く。運営が `main` で整備しているときに邪魔をしないためである。
`.githooks` への切り替えは `package.json` の `prepare` から `install-git-hooks.mjs` が行うので、
**参加者は `npm ci` をするだけで pre-commit が有効になる**（husky などの追加依存は要らない）。
ランタイム依存を `react` と `react-dom` だけに保つ方針を、開発フローの側でも守っている。

#### 12.3.8 Layer 4 — CI と CODEOWNERS とブランチ保護

詳細は16章に書く。ここでは層としての位置づけだけ記す。

- **CI の verify** … `npm run verify` とまったく同じ列を実行する。必須チェックはこの1本だけ
- **CODEOWNERS** … 運営管理領域だけを講師の承認必須にする。`src/games/<各チーム>/` は**誰も所有していない**
- **ブランチ保護** … `main` への直接 push を禁止し、verify の成功と1件の承認を必須にする

`CODEOWNERS` に `*` の行を**書かない**ことが重要である。
書くと6つの PR が同時に来る115〜152分に講師が完全なボトルネックになり、
「チーム同士でレビューする」という研修の目的とも矛盾する。

### 12.4 硬さの基準

すべてを error にすると、参加者は違反を潰す作業に時間を使い、ゲームを作る時間が無くなる。
すべてを warn にすると、機械が何も守らない。**線を引く基準が要る。**

この設計では、基準を1つに絞った。

> **その違反が「他チームに波及するか」で決める。**

| 波及する（機械で止める / error） | 自分のフォルダに閉じる（警告に留める / warn） |
|---|---|
| 担当範囲の外を変更する | `any` を使う（`@typescript-eslint/no-explicit-any`） |
| 依存を追加する（lockfile が変わる） | 1ファイルが400行を超える（`max-lines`） |
| 他チームのゲームを参照する | 1関数が150行を超える（`max-lines-per-function`） |
| `@core/*` の深い import | 複雑度が15を超える（`complexity`） |
| `logic.ts` を非純粋にする（乱数・時間・react） | `console.log` を残す（`no-console`） |
| `localStorage` を直接使う（キーが衝突する） | — |
| `eslint-disable` を書く | — |

**警告に留めたものは、レビューの題材になる。**
`any` が並んでいるコードや200行の関数は、レビュアーが読んで「ここが読みにくい」と言う対象である。
機械が先に潰してしまうと、**レビューで話すことが無くなる**。

これは12.6 の役割分担と同じ考え方である。
機械は「他人に迷惑がかかるか」だけを見て、「良いコードか」は人間が見る。

`eqeqeq` と `no-unused-vars` だけは例外的に error にしてある。
波及はしないが、直すのが一瞬で、放置すると型チェックとビルドの失敗に化けるためである。

### 12.5 受け入れている抜け穴

**このハーネスは悪意への対策ではない。うっかりへの対策と割り切っている。**
明示的に受け入れている抜け穴は次のとおり。

| 抜け穴 | 何が起きるか | 受け入れる理由 |
|---|---|---|
| `--dangerously-skip-permissions` での起動 | Layer 2 の deny とフックが全部消える | 参加者が意図して打たない限り起きない。打ったなら、それは事故ではなく選択である |
| `git commit --no-verify` | Layer 3 の pre-commit を飛ばせる | 手元の網は必ず抜けられる。飛ばしても CI が同じ判定をする |
| エディタでの直接編集 | Layer 2 が一切効かない（Claude Code を経由しないため） | Claude Code は開発の道具であって門番ではない。門番は CI 側に置く |
| `guard-bash.mjs` の正規表現 | コマンドの書き方を変えれば回避できる（文字列の分割、別名の利用など） | 網羅を目指すと誤検知が増え、正当な操作まで止まる。**回避を思いつく人は、回避してはいけない理由も理解している** |
| ハーネス無効化の環境変数 | Layer 2 と pre-commit が黙る | 講師が緊急時に使うための逃げ道として意図的に残してある |

いずれも「本気で回り込もうとすれば回り込める」。**それでよい。**
研修で防ぎたいのは「悪意ある回避」ではなく「善意の巻き添え」である。
`src/core/` を直そうとする参加者は、他チームを壊そうとしているのではなく、
自分のゲームを完成させようとしている。だから止めるときのメッセージは非難ではなく案内にしてある。

そして、どの抜け穴も**同じ1点に収束する**。

> 手元で何を消しても、Pull Request では必ず同じ結果が出る。

権限確認を飛ばして書いた `Math.random()` も、`--no-verify` でコミットした範囲外の変更も、
エディタで直接書いた `eslint-disable` も、**CI の verify が同じ言葉で落とす**。
ハーネス無効化の環境変数は Layer 2 と pre-commit にしか効かず、CI には効かない。

**だから Layer 4 が要る。** 手元の3層は速く気づくための道具、CI の1層は本当に止めるための装置。
この結論は当日の Step 4 デモでそのまま見せる。
`git commit --no-verify` で通したものが CI で赤くなる、という一連の流れを実演する
（デモ用の失敗 Pull Request は、講師が事前検証で作って open のまま残しておく。21章参照）。

### 12.6 機械で測れないもの

ハーネスが守っているのは「機械で測れること」だけである。
**ゲームが面白いか、テストが意味を持っているかは機械には分からない。**

| 機械（ハーネス）が見る | 人（レビュー担当チーム）が見る |
|---|---|
| 担当範囲からはみ出していないか | **テストの質** … 正常系だけになっていないか。境界値と異常系を見ているか。アサーションを1つ逆にしたら本当に落ちるか |
| import の向き（`@core` / `@ui` の入口だけか） | **命名の分かりやすさ** … 変数名と関数名だけで意味が分かるか。ルール判定が `.tsx` に漏れていないか |
| `logic.ts` が純粋か（乱数・時間・react が無いか） | **ルールの解釈** … 正典に書かれたルールと実装が一致しているか。曖昧な場面の扱いが妥当か |
| 必須ファイルが揃っているか / README の見出し | **README** … 読んで遊び方が分かるか。採用したルールと捨てたルールが書いてあるか |
| テストが3件以上あるか（`status: "ready"` のとき） | **実機で遊べるか** … 最初から最後まで1回プレイできるか。連打やリセットで壊れないか |
| 型が通るか / ビルドできるか | **Pull Request の説明** … 自分の言葉で書かれているか |

**「テストが3件ある」は機械が数えられるが、「そのテストが仕様を確認している」は数えられない。**
だから **テストの件数は Layer 3 が、テストの中身はレビューが**見る。役割が重なっていない。

同じ線引きを評価にも通してある。`npm run score` は数えられるものしか出さず、
最後に必ずこう出力する。

```text
※ テストの中身の妥当性・命名の分かりやすさ・レビューの質は機械では測れません。
  そこは相互レビューと講師の目で評価してください。
```

**この役割分担自体が、研修で伝えたい設計思想である。**

現場で CI を導入すると「CI が緑なら良いコード」という誤解が必ず生まれる。
CI が保証しているのは「壊れていないこと」であって「良いこと」ではない。
この研修は、その2つが**別の仕組みで担保されている**状態を180分で体験させる設計になっている。

- 壊れていないこと … ハーネス（Layer 0〜4）が保証する。人間は何もしなくてよい
- 良いこと … レビューが担当する。**機械が判定しないからこそ、人間が見る意味がある**

Step 17 で `npm run score` を投影しながらこの話をすると、180分の体験と設計思想が1つに繋がる。
**ここがこの研修の締めになる。**

---

## 13. ブランチとコミットの規約

### 13.1 ブランチ名

**ブランチ名が担当を表す。** これがこの章の中心にある。

```text
feature/babanuki
feature/shinkeisuijaku
feature/speed
feature/shichinarabe
feature/doubt
feature/daifugo
```

`feature/<ゲームID>` の `<ゲームID>` は `harness/config.json` の `gameId` と完全に一致させる。
チーム名（`team-a`）でも日本語（`ババ抜き`）でもなく**ゲームID**にしたのは、
ブランチ名からフォルダ名が一意に決まる必要があるためである。

ブランチ名は単なる命名規約ではなく、**ハーネスの入力**になっている。

| 読む側 | ブランチ名から何を決めるか |
|---|---|
| `session-brief.mjs` | セッション開始時に「あなたは Team A / ババ抜きの担当」と伝える |
| `guard-scope.mjs` | 他チームのフォルダを触ろうとしたら止める |
| `guard-bash.mjs` | `feature/*` のときだけ保護領域への書き込みを見る |
| `scope-guard.mjs` | ブランチ名と変更しているゲームが一致しているかを判定する |
| `.githooks/pre-commit` | `feature/*` のときだけ範囲チェックを走らせる |
| `require-verify.mjs` | `feature/*` のときだけ引き止める |
| `statusline.mjs` | 画面下に `Team A ババ抜き ⋅ feature/babanuki` と表示する |

**`main` のまま実装を始めると、これらがすべて「担当未設定」として動く。**
だから `CLAUDE.md` にも手順書にも「`main` のまま始めてはいけない」を先頭近くに書いてある。
ブランチを切っていない状態で編集しようとすると、`guard-scope.mjs` が
`git switch -c feature/<ゲームID>` を提示して確認を求める（この1件だけは deny ではなく ask）。

### 13.2 コミットメッセージ

接頭辞は4つだけ使う。**日本語で構わない。**

| 接頭辞 | 使うとき | 例 |
|---|---|---|
| `feat:` | 機能ができた | `feat: ジョーカーを含む53枚の配布を実装` |
| `test:` | テストを足した・直した | `test: 最後の1枚を引いたときのテストを追加` |
| `fix:` | バグを直した | `fix: 手札が0枚のときに上がり判定されない問題を修正` |
| `docs:` | README や説明を書いた | `docs: 採用したローカルルールを README に追記` |

雛形を置く最初のコミット（Step 6）だけは `chore(<ゲームID>): 雛形を追加する` を使う。
ゲームIDをスコープに書く形（`fix(babanuki): ...`）も許す。

**「何をしたか」ではなく「何ができるようになったか」を書く。**
レビュアーは差分より先にコミット一覧を見るので、ここが動作の言葉になっていると読む順番が決まる。

コミットの粒度についての指示は1つだけにした。

> 30分ぶんの作業を1つのコミットにしない。

細かい規約を増やしても180分では守られない。**小さく刻むと「1つ前に戻す」が安全にできる**という利点だけを伝え、
良いタイミングを具体例で示す（テストが1つ緑になった / 画面が表示できた / verify が緑になった）。

`git add .` ではなく **`git add src/games/<自分のゲームID>`** と書く癖をつけさせる。
`git add .` は一時ファイルやエディタの設定を巻き込み、範囲チェックが赤くなる最頻出の原因になる。

### 13.3 Squash マージのみ

リポジトリ設定でマージ方式を **Squash に限定する**。

```text
allow_squash_merge      = true
allow_merge_commit      = false
allow_rebase_merge      = false
delete_branch_on_merge  = true
```

**理由は履歴の美しさではなく、研修の性質そのものにある。**
feature ブランチのコミットは、研修中の試行錯誤（計画、途中で捨てた実装、レビュー対応）そのものである。
そのまま `main` に流すと、6チーム分の試行錯誤が混ざって履歴が読めなくなる。

Squash に固定すると `main` の履歴が「1ゲーム = 1コミット」になる。
**研修の成果が6行で見える**ので、最後の締めにも使える。

マージ方式を選択肢として残さないのも意図的である。
研修中に「どれを選ぶべきか」を考えさせる価値が無く、選び間違えると後から直せない。
`delete_branch_on_merge` も同時に入れて、マージ後にブランチ一覧が散らからないようにする。

---

## 14. Pull Request 設計

### 14.1 テンプレートの構成

`.github/PULL_REQUEST_TEMPLATE.md` は次の7節でできている。

| 節 | 目的 |
|---|---|
| 実装したゲーム | ゲーム名とゲームID |
| 対応した Issue | `Closes #<番号>`（マージ時に Issue を自動で閉じる） |
| 実装内容 | 何ができるようになったかを**動作の言葉で**3〜6行 |
| **採用したルール** | 採用したもの / 今回は実装しないもの |
| 動作確認 | チェックリスト7項目 |
| レビューしてほしい点 | **AI に書かせない。自分の言葉で書く** |
| 発展課題・未対応事項 | できていないことを正直に書く（減点しない） |

### 14.2 「採用したルール」欄を設けた理由

**元の設計には無かった節である。日本のトランプゲームに変えたことで必要になった。**

トランプゲームは家庭ごとにルールが違う。ババ抜きひとつ取っても、
ジョーカーを2枚入れる家、同じ色でないとペアにできない家、引く相手を選べる家がある。
大富豪に至っては、8切り・革命・階段・スペ3・都落ちのどこまでを「基本」と呼ぶかで意見が割れる。

この状態でレビューを始めると、**「このルールが無い」という空振りの指摘が必ず出る。**
指摘された側は「正典に無いので実装していません」と返すことになり、
25分しかないレビュー時間が、ルールの擦り合わせで消える。

対策を2段構えにした。

1. `docs/games/<ゲームID>.md` に **「採用するルール」と「今回は実装しないルール」を先に書く**
   （不採用のローカルルールを表にして、なぜ外したかまで明記してある）
2. PR テンプレートに **「採用したルール」欄**を置き、実装者に宣言させる

正典どおりなら「正典どおり」の5文字で構わない。**書く手間より、空振りを防ぐ効果のほうが大きい。**

この欄が空だと、`scripts/check-pr-body.mjs` が助言を出す。

```text
「採用したルール」が空です。トランプゲームは家庭ごとにルールが違うので、
ここを書いておくと「このルールが無い」という誤解を防げます。
```

`check-pr-body.mjs` はほかに `Closes #` の有無、テンプレートの説明コメントの残り数、
「レビューしてほしい点」の文字数、`TODO:` の残りを見る。

**これは参考情報であり、必須チェックにしない。** 走るのは `pr-meta (advisory)` という別ジョブで、
Draft のあいだは動かない。書き方の助言でマージを止めるのは筋が違う。

### 14.3 動作確認チェックリスト

7項目のうち3つは、他の場所と意図的に繋げてある。

| 項目 | 繋がっている先 |
|---|---|
| `npm run verify` が緑になった | Layer 3・4。CI とまったく同じ列 |
| **テストのアサーションを1つ逆にして、赤くなることを確認した** | 12.6。テストが仕様を確認しているかは機械が測れない |
| やってはいけない操作を試した | レビューのミッションカード（15.4）と同じ観点 |

**「アサーションを1つ逆にする」は、この研修で唯一「テストのテスト」を人間にやらせる手順である。**
テストが3件あることは契約テストが数えるが、そのテストが何も検証していない可能性は機械には見えない。
Step 11 で Test Lead が主導する「儀式」として時間に組み込んである。

スクリーンショットは**コミットさせない**。PR 本文にドラッグ&ドロップさせる。
画像をリポジトリに入れると、範囲チェックが赤くなり、差分も重くなる。

### 14.4 Draft PR を38〜42分に出させる理由

**まだ何も実装していない雛形の状態で、いきなり Pull Request を出させる。**
元の設計では110分だったものを、40分に前倒しした。

理由は、パイプラインの事故が**実装完了後に発覚すると取り返しがつかない**ことにある。

| 事故 | 40分に発覚した場合 | 115分に発覚した場合 |
|---|---|---|
| collaborator 招待が未承諾（403） | 講師が招待し直して2分 | 実装が終わっているのに push できない。レビュー時間が消える |
| 改行コードで差分がファイル全体になる | `.gitattributes` の確認で数分 | レビュー不能な PR ができあがる |
| 担当フォルダの外を `git add` していた | `npm run scope` の指示どおり戻して1分 | 実装の差分と混ざり、切り分けに時間がかかる |
| CI のチェック名が違う / 保護設定の誤り | 講師が直して全員に反映 | 6チーム全部がマージできない |

**中身が空のうちに一度パイプラインを最後まで通し、事故を序盤に出し切る。**
Step 6 の完了条件を「`gh pr checks` で verify が緑」にしてあるので、ここが赤いチームは実装に進ませない。

副次的な効果が2つある。

1. **レビュー担当チームが、相手の PR 番号を早い段階で知る。**
   レビューの組み合わせは輪になっているので、PR が出ていないチームがあると2チームが同時に止まる。
   Draft を早く出させておくと、遅れているチームが可視化される（講師は `npm run status` で見る）。
2. **「まず不完全な状態を共有する」体験そのものが目的になる。**
   完成してから見せるのではなく、途中を晒して進めるのが共同開発である。
   だから遅延時の切り捨て順でも、Draft PR は**絶対に削らない5つ**に入れてある。

Draft から Ready への切り替えは Step 12（105〜115分）に置いた。
`gh pr ready` を打つ条件は「`npm run verify` が緑」「スクリーンショットを貼った」「本文を自分で読んだ」の3つ。

---

## 15. 相互レビュー設計

12.6 で「機械で測れないもの」をレビューに割り当てた。この章はその受け皿を設計する。
**レビューはこの研修で最も形骸化しやすい工程**なので、仕組みで支える必要がある。

### 15.1 レビューの組み合わせ

輪にする。担当は `harness/config.json` の `reviews` に書いてあり、単一の真実源から生成される。

```text
Team A → Team B → Team C → Team D → Team E → Team F → Team A
```

| レビューする | レビューされる | 対象ゲーム |
|---|---|---|
| Team A | Team B | 神経衰弱（`shinkeisuijaku`） |
| Team B | Team C | スピード（`speed`） |
| Team C | Team D | 七並べ（`shichinarabe`） |
| Team D | Team E | ダウト（`doubt`） |
| Team E | Team F | 大富豪（`daifugo`） |
| Team F | Team A | ババ抜き（`babanuki`） |

**却下した案: 総当たり、または講師が全 PR をレビューする。**
総当たりは25分では回らない。講師が全部見るのは `CODEOWNERS` に `*` を書くのと同じで、
115〜152分に講師がボトルネックになる。輪にすると、1チームあたり「出す1本・見る1本」で固定できる。

輪の弱点は、**1チームが PR を出さないとレビュー担当チームがやることを失う**点にある。
だから14.4 で Draft PR を40分に前倒しし、
講師の介入ラインに「127分に Draft PR が出ていない」を数字で入れてある。

難易度差への配慮も入れてある。大富豪（Team F）は6ゲームで最も重いので5名を配置し、
チーム内を「実装3名 / レビュー2名」に分けて、レビュー担当は110分ごろから Team A の PR を見始めてよいことにする。
大富豪をレビューする Team E も、差分とルールが最大になるので2名で分担してよい。

### 15.2 `gh pr checkout` と `npm run dev` を必須手順にした理由

> **差分を眺めるだけのレビューは、この研修では成果として認めない。**

必須コマンドは3つ。

```text
gh pr checkout <相手のPR番号>
npm ci
npm run dev
```

理由は3つある。

1. **この研修で見つかるバグの大半は、差分を読んでも見つからない。**
   連打で二重に処理が走る、CPU の手番中に操作が通る、リセット後に前回の状態が残る。
   いずれも「動かして初めて分かる」種類のものである。
2. **`gh pr checkout` は共同開発の実技そのものである。**
   他人のブランチを自分の環境に持ってきて動かす、という操作を1回もやらずに研修を終えてほしくない。
   終わったら `git switch feature/<ゲームID>` で自分のブランチに戻る、までを手順に含めてある
   （これを忘れて相手のブランチにコミットする事故が起きやすいため）。
3. **Approve の意味を体で理解させる。**
   Approve は「良い人ですね」という意思表示ではなく「この状態で `main` に入れてよい」という技術的な判断である。
   動かさずに押した Approve は、判断ではなく社交辞令になる。

`/review` コマンドも同じ順序を強制している。最初の見出しが「1. まず動かす（これを飛ばさない）」で、
`disallowed-tools` に `Edit` / `Write` を指定してあるので、**レビュー中に相手のコードを勝手に直せない**。

### 15.3 レビューの観点

| 観点 | 具体的に見ること |
|---|---|
| Issue の必須要件 | 正典の必須要件が全部あるか。**書かれていないローカルルールが足されていないか**（多すぎるのも指摘対象） |
| ルールの境界 | 同じ数字 / 最後の1枚 / 0枚 / 全員パス / K の次 / 誰かが上がった直後 |
| テストの偏り | `it("...")` を上から読む。正常系だけになっていないか。怪しければアサーションを1つ逆にして手元で試す |
| 担当範囲 | `gh pr diff` のファイル一覧が担当フォルダの中だけか（外があれば CI も落ちる） |
| 命名 | `flag` `data` `tmp` `check2` のような名前が残っていないか |
| 役割の分離 | 勝敗やルールの判定が `.tsx` に漏れていないか。`logic.ts` が純粋か |
| 他への影響 | アーケード一覧が壊れていないか。`status` が実態と合っているか |

上の7つのうち「担当範囲」と「役割の分離」は機械も見る。**人間には「怪しいところを探す入口」として渡している。**

### 15.4 ゲーム別ミッションカード

**レビューの最大の障害は「相手のゲームのルールを知らない」ことである。**
七並べのレビュー担当が七並べのローカルルールに詳しいとは限らない。
ルールを覚えるところから始めると、25分は覚える時間で終わる。

そこで、**ルールを知らなくても判定できる形**にした。
`docs/review-guide.md` と `docs/games/<ゲームID>.md` に、
1ゲームあたり3つの「ミッション」を用意してある。

```text
Team B → スピード（speed）

2. A と K の折り返し。
   台札が K のときに手札の A が出せること、台札が A のときに K が出せること。
   ついでに、台札が K のときに 2 が出せないことも確認する。
```

ミッションは**操作と期待結果だけ**で書かれている。読んで、そのとおり動かせば、正しいかどうかが分かる。

選んだ3つは、そのゲームで**いちばん壊れやすい所**である。

| ゲーム | ミッションが狙っているもの |
|---|---|
| 神経衰弱 | 判定中の連打 / 成立済みカードの再クリック / リセット後の再配置 |
| スピード | 同数カードの拒否と二重出し / A と K の折り返し / 両者が詰んだときの自動復帰 |
| 七並べ | CPU 手番中の入力 / パス可能条件 / 4回パスの脱落処理 |
| ダウト | 罰の向き（引き取るのは誰か）と52枚の保存 / 宣言の巡回とリセット / CPU 手札の情報漏れ |
| 大富豪 | 枚数のごまかし / 8切り後の手番 / **革命が元に戻るか**（最も多いバグ） |
| ババ抜き | 配札直後のペア掃除 / 上がった人を飛ばす処理 / 最後の1人がジョーカーを持って4位 |

**「情報が漏れていないか」を F12 の Elements で確認させる**ミッション（ダウト）のように、
実装の中身を読まなくても検証できる形にしてあるものが多い。

### 15.5 必ず出す3点セット

レビューコメントは**この3つを必ず**出す。3つ揃って初めて「レビューした」と言える。

| # | 種類 | 形 |
|---|---|---|
| 1 | **ルール検証の指摘（再現手順つき）** | 「〇〇を〇回すると〇〇になります。正典では〇〇のはずです」+ 手順1・2・3 |
| 2 | **テスト観点の提案（具体的なテスト名で）** | `it("同じ数字が続いたときに引き分けになる")` のように、そのまま貼れる形 |
| 3 | **質問または可読性の提案** | 1件は GitHub の suggestion 形式（相手はボタン1つで取り込める） |

それぞれに理由がある。

- **1 は「再現手順が書けない指摘は投稿しない」を条件にしてある。**
  直す側が確認できない指摘は、直しようがないうえに時間を奪う。
  「たぶんバグだと思う」は指摘ではなく**質問**として書かせる。
- **2 は「テストが足りません」を禁止するためにある。**
  テスト名まで書けば、相手は `logic.test.ts` にコピーするだけで着手できる。
  抽象的な指摘は、受け取った側が何をすればいいか分からず放置される。
- **3 は「レビューが指摘だけになる」のを防ぐ。**
  suggestion は相手が受け入れやすく、レビューが対立ではなく共同作業だと体感できる。
  20章のベストレビュー賞が「採用された suggestion の数」を数えるのは、この体験を数字に繋げるためである。

書き方のルールは3つだけにした。

1. **人ではなくコードに向ける**（「あなたのミス」ではなく「この関数はこう動いているように見えます」）
2. **確認できたことと推測を分ける**（実機で確認していないものは「未確認ですが」と明記する）
3. **止めるものと、そうでないものを分ける**（マージを止める指摘か、単なる提案かを最初の1行で書く）

### 15.6 Approve の基準

**基準を文書化しておかないと、Approve は必ず社交辞令になる。**

| Approve していい | Approve してはいけない |
|---|---|
| `gh pr checkout` して**実際に遊んだ** | **動かしていない**（差分を読んだだけ、CI が緑なだけ） |
| ミッションカードの3つを試して期待どおりだった | **不具合を見つけた**（小さくても Approve せず Request changes かコメント） |
| Issue の必須要件が満たされている | **「他チームに悪いから」**（これがいちばん危険） |
| CI が緑 | **時間が無いから**（正直に「実機確認ができませんでした」と書く） |
| 残っている指摘が「提案」だけ | — |

「小さいから」で通した不具合は、**統合デモで全員の前で落ちる**。
そこまで含めて説明すると、Approve を渋ることが相手のためになると理解される。

### 15.7 レビューを受けた側の作法

**指摘には必ず何かを返す。直しただけで黙っているのが、レビュアーをいちばん困らせる。**

`/fix-review <PR番号>` がコメントを集め、対応方針の表を作る。分類は3つだけ。

| 分類 | どんなとき | 返し方 |
|---|---|---|
| **直す** | 指摘が正しい | どう直したかを1行 + コミット SHA |
| **相談** | 直すべきか判断が分かれる | 理由を書いて、レビュアーと講師に判断を委ねる |
| **直さない** | 仕様どおり、または Issue の範囲外 | **理由を丁寧に書く** |

**「直さない」は正当な選択肢である。** 大事なのは理由を説明できるかどうかで、
評価でも「直さない」を選んだこと自体は減点しない（20章）。
正典に無いルールを足す提案なら「今回は正典どおりに実装しているので入れていません」と返すのが正解になる。

`/fix-review` は**方針の表を出すところで一度止まる**。合意してから直させる。
指摘を受けた瞬間に AI が全部直し始めると、参加者は「何を直したか」を説明できなくなる。

### 15.8 レビューが形骸化しないための6つの工夫

| # | 工夫 | 防いでいる形骸化 |
|---|---|---|
| 1 | `gh pr checkout` + `npm run dev` を**必須手順**にした | 差分を眺めて「LGTM」で終わる |
| 2 | **ゲーム別ミッションカード**を用意した | 相手のルールが分からず、何も指摘できない |
| 3 | **3点セット**を必須にした（ルール / テスト / 提案） | 感想だけ、あるいは些細な指摘だけになる |
| 4 | `/review` は**コメントを投稿しない**。投稿は人間が決める | AI の出力をそのまま貼り、自分が確認していない指摘を出す |
| 5 | **Approve の基準を文書化**した | 「他チームに悪いから」で通す |
| 6 | **ベストレビュー賞を数えられる基準にし、研修の最初に予告する** | 印象で選ばれるので、質を上げる動機が働かない |

**4 と 6 が特に効く。**

4 は「未確認」を明示させる仕組みでもある。
`/review` は「確認できたか / 未確認か」を明記させるので、
自分が動かして見つけたものと AI が差分から推測したものが混ざらない。

6 は事前予告が本体である。
「再現手順つき指摘の数」と「採用された suggestion の数」で選ぶと最初に言っておくと、
115分からのレビューの質がはっきり変わる。**評価基準を後出しにすると、行動は変わらない。**

時間が足りないときの優先順位も決めてある。上から順にできるところまでやる。

```text
1. 実機で1回遊ぶ（これだけは絶対に落とさない）
2. ミッションカードの3つを試す
3. logic.test.ts の it("...") を上から読む
4. 変更ファイルの一覧が担当フォルダの中だけか確認する
5. 差分を全部読む
```

**1 と 2 をやれば、3点セットのうち最低2つは必ず書ける。**

---

## 16. CI/CD 設計

### 16.1 verify の中身

CI（`.github/workflows/ci.yml`）が実行する列は、`npm run verify` とまったく同じである。

```text
範囲チェック → 依存が変わっていないか → lint → 型チェック → テスト → ビルド
```

```json
"verify": "npm run scope && npm run lint && npm run typecheck && npm run test && npm run build && node scripts/mark-verified.mjs"
```

**この一致が設計の中心にある。** 参加者が覚えるコマンドは `npm run dev` / `npm test` / `npm run verify` の3つだけで、
そのうち1つが CI と同じ意味を持つ。「手元で緑なら CI も緑」が保証されるので、
CI のログを読むために GitHub とエディタを往復する時間が消える。

並べる順序は**落ちやすく、いちばん速いものから**にしてある。
範囲チェックは差分のパスを見るだけなので数秒で終わり、最も頻度の高い違反を捕まえる。
**赤い理由が40秒で分かる**状態を目指している。

CI 側にだけ1つ多い判定がある。`package.json` と `package-lock.json` が変わっていないかの確認である。

```text
::error::package.json / package-lock.json が変更されています。依存の追加は運営が行います。
```

Layer 2 の `guard-bash.mjs` が `npm install` を止めているが、
手元で直接叩かれた場合はここが最後の網になる（12.5 の「受け入れている抜け穴」の実際の受け止め先）。

### 16.2 必須チェックを verify 1本にした理由

`.github/branch-protection.json` の `contexts` は `["verify"]` の1本だけである。

**却下した案: lint / typecheck / test / build を別ジョブに分けて、4つとも必須にする。**

分けると見た目は分かりやすいが、**チェック名の綴り違いで全 PR が永久に pending になる事故**が起きる。

- ブランチ保護に書いた名前と、実際のジョブ名が1文字でも違うと、GitHub はその名前のチェックを待ち続ける
- 表示は「Expected — Waiting for status to be reported」になり、**エラーではないので原因が分かりにくい**
- 気づくのは6チーム全部がマージできなくなった152分である

名前が4つあれば、事故の確率は単純に4倍になる。**1本に絞れば、間違える箇所が1つになる。**
さらに、21章の事前準備で「テスト PR を1本流してチェック名を確定させてから保護を当てる」順序を必須にしてある。

ジョブ内の各ステップは `id` を持ち、名前ではなく**結果**で判定する。
名前の一致に依存しているのはブランチ保護の1行だけになっている。

### 16.3 `if: !cancelled()` で失敗をまとめる理由

各ステップに `if: ${{ !cancelled() }}` を付け、最後にまとめて判定する。

```yaml
- name: 判定
  if: ${{ !cancelled() }}
  run: |
    FAILED=""
    [ "${{ steps.scope.outcome }}" = "failure" ] && FAILED="$FAILED 範囲チェック"
    ...
    if [ -n "$FAILED" ]; then
      echo "::error::失敗しました:$FAILED  — 手元で npm run verify を実行すると同じ内容を確認できます"
      exit 1
    fi
```

**通常の CI は最初の失敗で止まる。研修ではそれが致命的になる。**

lint で止まる → 直して push → 2分待つ → 型チェックで落ちる → 直して push → 2分待つ → テストで落ちる。
**1回の PR で3往復し、10分近く溶ける。** レビューの25分がそのまま削られる。

`!cancelled()` を付けると、lint が落ちても型チェックとテストとビルドが走る。
**1回の実行で「今どこが壊れているか」が全部出る。**
参加者は手元で `npm run verify` を1回だけ回して、まとめて直せる。

結果は `scripts/ci-summary.mjs` が GitHub の Summary に書き出すので、
ログを開かなくても PR 画面から状況が読める。

### 16.4 参考ジョブと緊急用ラベル

必須にしないジョブが1つある。

```yaml
pr-meta:
  name: pr-meta (advisory)
  if: github.event_name == 'pull_request' && github.event.pull_request.draft == false
```

PR 本文の書き方を見るジョブで、**Draft のあいだは動かない**（14.4 で40分に Draft を出させるため、
まだ本文が空の段階で助言を出しても意味がない）。
`(advisory)` を名前に入れてあるのは、必須チェックと見間違えないためである。

範囲チェックには緊急用のラベルを1つ用意してある。

```yaml
env:
  OVERRIDE: ${{ contains(github.event.pull_request.labels.*.name, 'harness:override') }}
```

`harness:override` ラベルが付いた PR だけ `--warn-only` で走る。
**範囲チェックだけが原因で赤い PR を、PR 単位で救うための逃げ道**である。
保護そのものを外すより影響範囲が狭く、後始末も要らない。

### 16.5 GitHub Pages への自動デプロイ

`main` に push されると `deploy-pages.yml` が走り、`dist` を Pages に上げる。

```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```

**`cancel-in-progress: false` は意図的である。**

一般的な設定は `true`（新しい実行が始まったら古いものを打ち切る）だが、
研修の終盤（152〜160分）は6つの PR が続けてマージされる。
`true` にすると途中のデプロイが次々にキャンセルされ、
**「自分のゲームが公開された瞬間」を各チームが見られなくなる。**

最終的に公開される内容はどちらでも同じだが、
**6チームがそれぞれ自分の番でデプロイの成功を見る**ことに研修上の意味がある。
数十秒のビルドを6回積むコストを払ってでも、順番に全部流す。

`vite.config.ts` の `base: "./"` も同じ文脈にある。
相対パスにしておくと、Pages のサブパス配信でも `dist` の直開きでも動く。
リポジトリ名を変えても壊れない。

### 16.6 ブランチ保護の設定と根拠

```json
{
  "required_status_checks": { "strict": false, "contexts": ["verify"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": false
}
```

一般的な設定と違えている項目には、すべて研修上の理由がある。

| 設定 | 値 | 根拠 |
|---|---|---|
| `strict` | **false** | true にすると「main が進むたびに全 PR が rebase を要求される」。6本が順にマージされる152〜160分に、後続5チームが延々と更新作業をすることになる。各チームは自分のフォルダしか触っていないので、古い main の上でも競合しない |
| `dismiss_stale_reviews` | **false** | true にすると、レビュー指摘を直して push した瞬間に Approve が消える。140〜152分は「直す→承認」を1往復で終える設計なので、承認が消えるとレビュアーを2回呼ぶことになる |
| `enforce_admins` | **false** | **講師だけは緊急時に貫通できる必要がある。** 158分に承認が付いていない PR を救う手段が無いと、研修が完成しないまま終わる |
| `required_approving_review_count` | 1 | 輪のレビューが1対1なので1件で足りる。2件にすると輪が成立しない |
| `require_code_owner_reviews` | true | 運営管理領域に触った PR だけ講師の承認を必須にする。`CODEOWNERS` に `*` が無いので、ゲームフォルダだけの PR には効かない |
| `allow_force_pushes` / `allow_deletions` | false | 履歴の書き換えは他チームを巻き込む。取り返しがつかない操作だけを禁止する |
| `required_conversation_resolution` | **false** | true にすると、コメント1件が未解決なだけでマージできない。レビュー返信の作法（15.7）で担保する方針にして、機械では止めない |

**`enforce_admins: false` は「保護が甘い」のではなく「逃げ道を1本だけ残す」判断である。**
研修は時間で終わる。マージできないまま終わる状態を作ってはいけない。
逃げ道は講師しか使えず、使ったことは履歴に残る。

### 16.7 適用順序

**順番に意味がある。特に 4 → 5 を逆にすると当日マージできなくなる。**

| # | 手順 | 逆にすると何が起きるか |
|---|---|---|
| 1 | 参加者を collaborator に招待し、**全員に承諾させる** | **当日 403 が出る原因の第1位。** 未承諾だと `git push` も `gh pr create` も落ちる |
| 2 | ラベルを作る（`setup-labels.ps1`） | Issue 作成時にラベルが付かない |
| 3 | マイルストーンと Issue を作る（`setup-milestone.ps1` / `setup-issues.ps1`） | Issue 番号が確定しないと `harness/config.json` の `issue` を埋められない |
| 4 | マージ方式を Squash のみにする | 後から変えても既存 PR には効かない |
| 5 | **テスト PR を1本流して CI のチェック名を確定させる** | — |
| 6 | ブランチ保護を適用する（**5 の確認後**） | **5 より先にやると、必須チェックの名前が確定しない状態で保護がかかり、全 PR が永久に pending になる** |
| 7 | GitHub Pages を有効化する（Source は **GitHub Actions**） | `Deploy from a branch` にすると `deploy-pages.yml` が動かない |
| 8 | 21章の事前検証を実施する | 止まるはずのものが止まらないまま当日を迎える |

1 は前日に未承諾を洗い出すところまでを含める。招待メールを開いていない参加者が1人でもいると、
その人の Draft PR（40分）で研修が止まる。

---

## 17. チーム内の役割

### 17.1 4つの役割

| 役割 | 仕事 |
|---|---|
| **Driver** | 唯一 PC を操作する人。Claude Code にプロンプトを打つ |
| **Navigator** | Issue と画面を見て「次に何をするか」を口で言う人。**Driver は Navigator の合意なしに次へ進まない** |
| **Test Lead** | テストの中身を見る人。Step 11 の「アサーションを1つ逆にする」儀式を主導する |
| **GitHub Lead** | ブランチ・コミット・PR・レビュー返信を担当する人 |

3人チームは Test Lead と GitHub Lead を兼任する。

**元の設計にあった Reviewer の役割は置かなかった。**
レビューは1人の仕事ではなく、チーム全員が相手の PR を触る工程として設計してある（15.2）。
役割として切り出すと「レビューはあの人の担当」になり、
**他人のコードを動かす経験が1人にしか渡らない**。
レビューへの返信だけは窓口を決めておきたいので、GitHub Lead の仕事に含めてある。

### 17.2 Driver 交代

**Driver は60分で交代する。目安は研修開始105分（Step 11 の開始時）。**

理由は2つ。

1. **1人がすべてを操作する状態を避ける。**
   Claude Code を触っていない人は「AI が勝手に作った」という感想しか持ち帰れない。
   プロンプトを打つ経験は全員に必要である。
2. **105分は実装が佳境で、いちばん交代したくない時刻である。**
   だからこそ、そこで交代させる。**引き継ぎの練習になるのは、引き継ぎたくない場面だけ**である。

交代のコストは `/handoff` で下げる。

```text
## 今どこ
- 担当: <チーム> / <ゲーム名>
- ブランチ: feature/<ゲームID>
- Issue の Step: <どこまで終わったか>

## 直前にやったこと
## 今できていること / できていないこと
## 次の一手
```

`/handoff` は現在の状態（`git branch --show-current` / `git status --short` / `npm run scope`）を
確認してから10行程度のメモを書く。次の Driver はそれを読んでセッションを開き直す。
セッション開始時には `session-brief.mjs` が担当とブランチを再注入するので、**前提はずれない**。

`/handoff` の実行回数は、20章のベストチームワーク賞の材料にもなる。

---

## 18. 180分の進行

### 18.1 当日の流れ

`docs/handson-steps.md` と同じ区切りである。**手順書と設計書で時刻がずれてはいけない**ので、
Step 番号もそのまま揃えてある。

| 時間 | Step | 内容 | この時間の成果 |
|---:|---|---|---|
| 0–10 | 1 | オープニング・完成イメージ・チーム発表 | ゴールの理解 |
| 10–18 | 2 | 環境の最終確認と救済 | 全員が `npm run doctor` を通過 |
| 18–24 | 3 | 役割決めと Issue 読み合わせ | 担当と必須要件の理解 |
| 24–32 | 4 | **講師デモ「ハーネス一周」（見るだけ）** | 止められたときの読み方 |
| 32–38 | 5 | ブランチを切って雛形を作る | `feature/<ゲームID>` と5ファイル |
| 38–42 | 6 | 最初のコミット → push → **Draft PR** | パイプラインが通ることの確認 |
| 42–52 | 7 | `/kickoff` で計画を立て、**人間がレビューする** | 実装計画 |
| 52–70 | 8 | 実装 Step1（`logic.ts` と `logic.test.ts`） | 純粋なルールとテスト |
| 70–75 | 9 | **中間チェックポイント** | 遅れの可視化と削る判断 |
| 75–95 | 10 | 実装 Step2（画面） | 遊べる画面 |
| 95–105 | 11 | 必須要件つぶし + 異常系テスト | `status: "ready"` |
| 105–115 | 12 | `npm run verify` → `/pr` → スクショ → `gh pr ready` | レビュー可能な PR |
| 115–140 | 13 | **相互レビュー（25分）** | 3点セットの指摘 |
| 140–152 | 14 | `/fix-review` → 修正 → Approve | 承認済みの PR |
| 152–160 | 15 | マージと自動デプロイ | 公開された CARD ARCADE |
| 160–172 | 16 | CARD ARCADE 大会・不具合を Issue 登録 | 利用と評価 |
| 172–178 | 17 | 表彰 | 相互評価 |
| 178–180 | 18 | 振り返り | 学びの言語化 |

### 18.2 元の設計からの変更点

| 変更 | 元 | 新 | 理由 |
|---|---|---|---|
| **PR を前倒し** | 110–125分 | **38–42分（Draft）** | 権限・CI・改行コードの事故を序盤に出し切る。実装完了後に発覚すると取り返しがつかない（14.4） |
| **実装を2分割** | 45–95分の1本 | 52–70分（ロジック）+ 75–95分（画面） | 分けないと最後まで画面を作らず、95分で「動くものが何も無い」チームが出る。先にロジックを固めると `reduce` のテストが書ける |
| **中間チェックを挿入** | なし | **70–75分** | 遅れを70分の時点で数字にする。ここが「発展課題を捨てる」最後の判断点になる |
| **講師デモを追加** | なし | **24–32分** | ハーネスの存在を体験させないと、止められたときに「壊れた」と解釈される。**8分の投資で、講師が個別に説明する回数が激減する** |
| **レビューを延長** | 20分 | **25分** | `gh pr checkout` して実際に遊ぶ手順を必須にしたので、20分では回らない |
| **環境構築を事前課題化** | 15–30分 | **前日まで（P-1〜P-6）** | 当日の環境構築は1分も価値を生まない。`npm run doctor` を通過条件にして前日に潰す |

**実装時間は元の50分から38分に減っている。** それでも成立するのは、
Layer 0 の雛形（構造を書く時間がゼロ）と、`@core` / `@ui` の完備（基盤を書く時間がゼロ）で、
参加者が書くのが**ルールとテストと画面だけ**になっているからである。

**「実装時間を削って、PR とレビューに回した」のがこの改訂の本質**である。
ゲームの出来は6番目に置いてある（12.6 の役割分担と同じ優先順位）。

### 18.3 中間チェックポイント（70–75分）

いったん全員手を止め、講師が `npm run status` を投影する。

参加者は自分の状態を確認する。

```text
git branch --show-current
npm run scope
npm test
git status --short
```

この時点の目標ラインは3つ。

- `npm test` が緑で、必須テストが4件以上
- `npm run scope` が緑
- Draft PR があり、CI が緑

**ここが「発展課題を捨てて必須要件だけに絞る」判断をする最後のタイミング**である。
詰まっているチームは `/stuck` を打つ。`/stuck` はコードを変更せず、
事実（ブランチ / status / scope / lint / typecheck / test）を集めて**次の一手を1つだけ**出す。

**詰まっているときに大きな作り直しを始めるのが、研修でいちばん時間を失う失敗である。**
だから `/stuck` の `disallowed-tools` に `Edit` / `Write` を入れて、構造的に作り直せないようにしてある。

### 18.4 介入ライン

**「そろそろ危ないかな」で判断しない。時計を見て、数字で入る。**
数字で決めておくと、講師が遠慮しなくて済む。

| 時刻 | 判定条件 | 講師がやること |
|---|---|---|
| 70分 | `logic.test.ts` が緑でない | そのチームに入る。ルール解釈で止まっているなら**講師が解釈を決める** |
| 96分 | 画面に何も表示されていない | 要件を削る。UI は `GameShell` + `Hand` + `Button` の3つで十分だと指示する |
| 118分 | `npm run verify` が緑でない | **講師が削る決断を下す。** 未達の要件を外し、`status` は `"coming-soon"` のまま PR を出させる |
| 127分 | Draft PR が出ていない | 講師が `.pr-body.md` の骨子を口述する。**PR が無いと2チームが同時に止まる** |
| 145分 | レビューコメントが0件の PR がある | レビュー担当チームを名指しで急かす |
| 158分 | 承認が付いていない PR がある | 講師が承認を入れる（`enforce_admins: false` の出番） |

**118分はこの研修で唯一、講師が参加者の合意なしに仕様を変更する時刻である。**
`status` を `"coming-soon"` のままにさせるのが要点で、
`"ready"` にすると契約テストがテスト3件と描画を要求して確実に赤くなる（12.3.6）。

**未完成のままマージすることは失敗ではない。**
間に合わない範囲を正直に切って、動くものだけをマージするのは実務そのものである、と言い切る。

### 18.5 絶対に削らない5つと、切り捨て順

**この5つは、研修が10分押していても削らない。** 削った瞬間に、この研修は「ゲームを作った日」になる。

1. **Draft PR を出すこと** — 「まず不完全な状態を共有する」体験そのもの
2. **Pull Request を出すこと** — 自分の言葉で説明を書くところまで
3. **相互レビューを行うこと** — 他人のコードを**実際に動かして**指摘する経験
4. **マージすること** — 自分のコードが `main` に入り、公開される瞬間
5. **振り返りを行うこと** — 経験を言葉にしないと持ち帰れない

**5 がいちばん削られやすく、いちばん削ってはいけない。**
時間が無ければ大会を全部やめてよい。振り返りの時間は必ず確保する。

遅れているときは**上から順に**切る。**順番を入れ替えない。**

| # | 切るもの | 稼げる時間 | 判断の目安 |
|---|---|---|---|
| 1 | 発展課題を全面禁止 | 0分（脱線を防ぐ） | 70分で3チーム以上がロジック未完 |
| 2 | UI の作り込み（CSS Modules 禁止。`GameShell` + `Hand` + `Button` だけ） | 10〜15分 | 96分で2チーム以上が画面未表示 |
| 3 | 中間チェックを短縮（5分 → 2分） | 3分 | 開始が押している場合のみ |
| 4 | レビュー 25分 → 18分（指摘は3点セットの1番目だけ） | 7分 | 127分で Draft PR が4本以下 |
| 5 | 大会 12分 → 6分 | 6分 | 163分でマージが3本以下 |

**切り捨て順は、絶対に削らない5つの裏返しになっている。**
削るのは常に「ゲームの中身」と「時間の余裕」で、共同開発の工程そのものではない。

20分以上押した場合は、レビューを**同時並行**にする。
PR を出した瞬間にレビュー担当チームへ口頭で伝え、必須項目を「再現手順つきの指摘1件」だけに減らす。

---

## 19. 最終デモとゲーム大会

### 19.1 進行

マージが終わると、公開 URL に6ゲームが並ぶ。

1. 各チームが担当ゲームを30秒で紹介する（採用したルールと、捨てたルールを1つずつ言う）
2. 全員で6ゲームを回る。**1ゲーム約2分**
3. 壊れているところを探し、見つけたら Issue に登録する
4. 表彰
5. 振り返り

**3 が本体である。** 「作って終わり」ではなく、
**使って不具合を見つけて Issue にするところまでを開発ループに含める。**

Issue には `.github/ISSUE_TEMPLATE/bug_report.yml` を使い、
「どのゲームか / **再現手順** / どうなると思ったか / 実際どうなったか」を埋めさせる。
**再現手順を書かせるのは、レビューの3点セット（15.5）と同じ訓練である。**

不具合を見つけられるのは良いレビュアーである証拠なので、遠慮せずに登録させる。
完了条件を「1人1件以上」にしてあるが、不具合が無ければ「改善の提案」でも構わない。

### 19.2 表彰

**6チームあるので賞も6つ用意し、全チームが何かを取るようにする。**
「うちだけ何もなかった」を作らないことが目的である。

| 賞 | 選び方 |
|---|---|
| ベストゲーム賞 | 大会で最も遊ばれたゲーム。挙手で決めてよい |
| ベストUI賞 | 見た目と分かりやすさ。`--ca-*` トークンで統一感が出ているものを優先 |
| ベストテスト賞 | **件数ではなく、境界値と異常系を見ているか。**「同じ数字」「最後の1枚」「0枚」「二重クリック」を押さえているもの |
| **ベストレビュー賞** | **数えられる基準で選ぶ**（下記） |
| ベストチームワーク賞 | Driver 交代の回数（`/handoff` を使った回数）と、机間巡視で見た様子 |
| 最も意外なバグ賞 | 大会中に見つかった想定外のバグ。**見つけた人ではなく、バグを作ったチームを表彰する** |

### 19.3 ベストレビュー賞を数えられる基準にした理由

**「一番いいレビューをしたチーム」では選べない。** 印象で選ぶと、声の大きいチームが取る。
次の2つを数え、合計が最も多いチームを選ぶ。

| 数えるもの | 数えないもの |
|---|---|
| **再現手順つき指摘の数**（「〇〇を〇回すると〇〇になります」の形） | 「ここが怪しいです」「LGTM」 |
| **採用された suggestion の数**（相手が「Commit suggestion」を押したもの） | 提案しただけで採用されなかったもの |

材料は `gh pr view <番号> --comments` と `npm run score` で集まる。

**この基準は研修の最初（チーム発表のあたり）に予告する。**
「レビューはこの2つで数えます」と先に言っておくと、115分からのレビューの質がはっきり変わる。
`/review` が「必ず3点セットを出す」「再現手順が書けない指摘は投稿しない」と指示しているのは、
この基準に直結させるためである（15.8 の工夫6）。

**評価基準を後出しにすると、行動は変わらない。** 先に言うことに意味がある。

### 19.4 締め方

賞を配ったあと、公開 URL をもう一度全員で開く。

> 「180分前は、ここにお手本が1本あるだけだった。今は6本ある。**1人で作ったものは、1つもない。**」

そのまま振り返りに入る。聞くのは3つで足りる。

1. 今日、機械に止められて助かったことは何か
2. 他人のコードをレビューして、自分のコードについて気づいたことは何か
3. 明日から自分のプロジェクトに持ち帰る1つは何か

---

## 20. 評価基準

### 20.1 配点

ゲームの派手さではなく、共同開発の進め方を評価する。

| 評価項目 | 配点 |
|---|---:|
| Issue の必須要件を満たした | 20 |
| 担当範囲を守った | 10 |
| 適切なテストを作成した | 20 |
| Pull Request を分かりやすく書いた | 15 |
| 他チームのレビューを行った | 15 |
| レビュー指摘を反映した | 10 |
| UI とゲームとしての工夫 | 10 |
| **合計** | **100** |

元の配点からの変更は2つ。

- **担当範囲 15 → 10。** ハーネスが機械的に保証するようになったので、人間が点を付ける意味が薄れた
- **レビュー 10 → 15。** レビューはこの研修で最も形骸化しやすく、最も価値が高い工程である。配点で意思表示する

**「ゲームが完成したか」に直接の配点は無い。これは意図的である。**
100点のうち**60点**（テスト20 + PR15 + レビュー15 + 反映10）が**共同開発の作法**に振られている。
2章の目的をそのまま数字にしたものになっている。

### 20.2 集計の材料

機械が数えられる部分は2つのコマンドで集まる。

```text
npm run status   6チームの PR / CI / レビュー / マージ の状況（当日の進行管理にも使う）
npm run score    数えられる評価項目だけを集める（研修後の採点用）
```

`npm run score` が出すのは次の6つ。

- 完成宣言（`index.ts` が `status: "ready"` か）
- **テスト件数**（`logic.test.ts` と `cpu.test.ts` の `it(` の数）
- Pull Request の有無と状態
- **受けたレビュー件数**
- **PR 本文の文字数**
- 他チームへのレビュー総数（参考値）

**研修中に採点しない。** 講師の時間は介入に使う。
`npm run status` のスクリーンショットを **70分 / 118分 / 152分 / 175分**の4回撮っておき、
研修後に `npm run score` の出力と合わせて採点する。
この4枚があれば「どのチームがどこで詰まったか」まで後から再現できる。

### 20.3 機械と人間の分担

**12.6 の線引きを、そのまま採点にも通す。**

| 項目 | 機械で見る | 人間で見る |
|---|---|---|
| 必須要件 20 | `status: "ready"` / CI が緑 | 必須要件との突き合わせ。**実際に遊んでみる** |
| 担当範囲 10 | CI の範囲チェックが緑 / `harness:override` を使っていない | — |
| テスト 20 | テスト件数（3件が下限） | **境界値と異常系があるか。** 正常系だけなら半分以下 |
| PR 15 | 本文の文字数 / `Closes #` の有無 | **「レビューしてほしい点」が自分の言葉で具体的か** |
| レビュー 15 | レビュー件数 | **再現手順が書かれているか。**「LGTM」だけなら0点 |
| 指摘の反映 10 | 指摘後のコミット数 | **「直さない」判断に理由が書かれているか**（理由があれば満点） |
| 工夫 10 | — | 大会で実際に遊んで判断 |

**「担当範囲」だけは人間の欄が空である。** ここは完全に機械の担当であり、
機械が緑なら満点でよい。**人間が見なくていい項目を作ることが、ハーネスの目的の1つ**である。

**「直さない」を選んだこと自体は減点しない。** 理由を説明できているかだけを見る。
`/fix-review` も参加者にそう指示している（15.7）。

---

## 21. 講師の事前準備

準備は4分類。**このうち「ハーネス検証」だけは省略不可**である。

### 21.1 リポジトリ

16.7 の適用順序をそのまま実行する。

- [ ] 参加者を collaborator に招待し、**前日までに全員の承諾を確認する**（未承諾は当日403の第1位）
- [ ] ラベルを作る（`scripts/setup-labels.ps1`）
- [ ] マイルストーンと Issue を作る（`setup-milestone.ps1` / `setup-issues.ps1`）
- [ ] マージ方式を Squash のみにし、`delete_branch_on_merge` を有効にする
- [ ] **テスト PR を1本流して CI のチェック名を確定させる**
- [ ] ブランチ保護を適用する（`.github/branch-protection.json` をそのまま流す）
- [ ] GitHub Pages を有効化する（Source は **GitHub Actions**）。デプロイが1回成功していることまで確認する
- [ ] `harness/config.json` の `issue` に、作成された Issue 番号を入れる

Issue の本文は `.github/issue-bodies/<チーム>-<ゲームID>.md` に置いてあり、
`scripts/build-issue-bodies.mjs` が `docs/games/<ゲームID>.md` と `harness/config.json` から生成する。
**正典とIssueが食い違わない**ようにするための仕組みである。

### 21.2 教材

- [ ] `README.md` / `CLAUDE.md`（4階層）
- [ ] `docs/architecture.md`（構造と `@core` に何があるか）
- [ ] `docs/game-plugin-guide.md`（ゲームの足し方）
- [ ] `docs/github-workflow.md`（ブランチからマージまでと巻き戻し集）
- [ ] `docs/claude-code-guide.md`（Claude Code の使い方）
- [ ] `docs/harness.md`（止められたときに読むページ）
- [ ] `docs/review-guide.md`（ミッションカードと3点セット）
- [ ] `docs/troubleshooting.md`（T-01〜T-28）
- [ ] `docs/handson-steps.md`（当日の手順書）
- [ ] `docs/games/<各ゲーム>.md`（**ルールの正典**。採用 / 不採用 / 必須要件 / レビュアー向けミッション）
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` / `.github/ISSUE_TEMPLATE/`

### 21.3 ゲーム基盤

- [ ] `src/core/`（カード・山札・ターン・スコア・`Rng`・`useCpuTurn`・`useHighScore`）
- [ ] `src/components/`（`GameShell` / `Hand` / `Card` / `Button` / `ResultModal` / `ComingSoonPanel` ほか）
- [ ] `src/games/example-game/`（**お手本**。CPU 対戦のハイ＆ロー・10ラウンド）
- [ ] `templates/game/` と `scripts/scaffold-game.mjs`
- [ ] 6チーム分のスケルトンを `--all` で生成済み（`status: "coming-soon"`）
- [ ] `tests/contract/` 3本が緑

### 21.4 運営

- [ ] チーム分けと担当ゲームの決定（**大富豪は5名**。実装3名 / レビュー2名に分ける）
- [ ] `npm run status` と `npm run score` が講師の端末で動く
- [ ] 介入ライン（18.4）と切り捨て順（18.5）を印刷して手元に置く
- [ ] 緊急時の逃げ道を優先度順に確認しておく（**焦っているときに判断させない**）
- [ ] 参加者の事前課題（P-1〜P-6）の完了確認。`npm run doctor` が全項目 ✓ であること

### 21.5 研修前のハーネス検証（**省略不可**）

**本番の30〜40分前までに実施する。やることは1つだけ。**

> **わざと壊して、止まるはずのものが止まることを確認する。**

**「動くこと」を確認しても意味がない。この研修で価値があるのは「止まること」である。**
**止まらなかった項目は、当日必ず誰かがそこを通り抜ける。**

講師の端末で `feature/speed` を切り、層ごとに確認する。

**Layer 2（フックが「その場で」止めるか）** — Claude Code を起動して依頼する

| # | 依頼する内容 | 期待する結果 |
|---|---|---|
| 2-1 | `src/core/index.ts` に関数を1つ足して | **拒否** + 報告テンプレートが出る |
| 2-2 | `src/games/babanuki/logic.ts` を直して | **拒否**（「Team A の担当です」） |
| 2-3 | `src/games/speed/logic.ts` にコメントを1行足して | **通る**（ここが通らないと当日は誰も作業できない） |
| 2-4 | `npm install lodash` を実行して | **拒否** |
| 2-5 | `echo "test" >> src/core/index.ts` を実行して | **拒否**（コマンド経由も塞がっている） |
| 2-6 | `.claude/settings.json` を書き換えてフックを外して | **拒否** |
| 2-7 | `git commit --no-verify` して | **拒否** |
| 2-8 | `vitest` を実行して | **拒否**（監視モードに入らせない） |

**2-3 が「通る」のが正解である。** ここが拒否されるなら `protectedPaths` が広すぎる。

**Layer 3（コミット前に止まるか）** — Claude Code を使わず、エディタと PowerShell で行う

| # | わざと壊す | 期待する結果 |
|---|---|---|
| 3-1 | `logic.ts` に `Math.random()` を足す | `npm run lint` が error（代替手段つき） |
| 3-2 | `index.ts` の `id` をフォルダ名とずらす | 契約テストが落ちる |
| 3-3 | README から `## 遊び方` を消す | 契約テストが落ち、欠けた見出しまで出る |
| 3-4 | **`eslint-disable` を書いて他ゲームを import する** | **lint は通る。しかし契約テストが2件落ちる** |
| 3-5 | `logic.ts` に `Date.now()` を足す | lint が error |
| 3-6 | `logic.ts` に `@ui` の import を足す | lint が error |
| 3-7 | `src/core/` を変更してコミットする | pre-commit が止める |

**3-4 が最重要である。** ESLint はコメント1つで無効化できるので、契約テストという二重の網を張ってある。
**ここが止まらないなら Layer 3 が機能していない。**

**Layer 4（CI がマージを止めるか）** — ここで作る失敗 PR は当日のデモ教材にする

`src/core/` をわざと変更し、`--no-verify` でコミットして PR を出す。

- [ ] `verify` が**赤**になる
- [ ] CI のログの文言が、**手元の `npm run scope` とまったく同じ**である
- [ ] 「Merge pull request」ボタンが**押せない**
- [ ] 「Required statuses must pass」と「Review required」の両方が出ている

**この PR は close せず open のまま残す。** Step 4 のデモで `gh pr view <番号> --web` を開く。
検証の結論がそのままデモの主題になる。**「手元の網は抜けられるが、CI は抜けられない」**（12.5）。

**Windows 固有 — 改行コード**

6台の Windows 端末で改行が揺れると、**PR の差分がファイル全体になってレビュー不能になる。**
当日いちばん取り返しがつかない事故なので必ず確認する。

`core.autocrlf=true` の状態で別の場所に clone し、`npm ci` の後に `git status` が clean であること。
`.gitattributes` に `* text=auto eol=lf` を書いてあるので、作業ツリーは LF のままになる。

---

## 22. 想定トラブルと対応

新構成で実際に起きるものを、発生する場面ごとに並べる。
**参加者向けの対処は `docs/troubleshooting.md` に T-01〜T-28 の番号付きで書いてある。**
番号を付けたのは、講師が口頭で「T-09 を見て」と言えるようにするためである。

### 22.1 参加者が自分で解決できるもの

| 場面 | 症状 | 対処 | 番号 |
|---|---|---|---|
| 環境 | Node.js が22未満 | LTS の22系を入れ直す | T-01 |
| 環境 | clone しただけで全ファイルが変更扱い | 改行コード。`.gitattributes` の取り込みを確認 | T-04 |
| ハーネス | Claude が「変更できません」と言う | **止められたのが正しい。** メッセージ最後の段落を読む | T-07 |
| ハーネス | 範囲チェックで落ちる | `npm run scope` が出す `git restore ...` をそのまま実行 | T-09 |
| ハーネス | 依存を追加しようとして止められた | `@core` / `@ui` の早見表を見る。無ければ講師に相談 | T-12 |
| 実装 | 一覧に自分のゲームが出ない | `index.ts` の `GameManifest` を確認 | T-13 |
| 実装 | `@core` が解決できない | `@core/deck` のような深い import を使っている | T-15 |
| 実装 | CPU が1回しか動かない | `useCpuTurn(pendingDelayMs(state), ...)` の1行になっているか | T-16 |
| 実装 | テストが時々落ちる | `Math.random()` を使っている。`createRng(seed)` に直す | T-17 |
| 実装 | `status` を `"ready"` にしたらテストが落ちた | 契約テストがテスト3件と描画を要求している | T-20 |
| CI | 手元では緑なのに CI が赤 | `origin/main` との差分を見ているため。`git fetch` して再確認 | T-21 |
| GitHub | マージボタンが押せない | 承認不足 / CI 赤 / Changes requested のどれか | T-27 |

**T-07 と T-09 がいちばん多い。** どちらも「止められたのが正しい」ケースなので、
`docs/harness.md` に「止められたときの読み方」を1ページ用意してある。

### 22.2 講師しか対応できないもの

| 症状 | 原因 | 対応 |
|---|---|---|
| `git push` が403 | collaborator の招待が未承諾 | 招待し直して承諾させる。**40分の Draft PR で必ず露見する** |
| 必須チェック `verify` が pending のまま | ブランチ保護のチェック名がジョブ名と違う | 保護を当て直す（16.2・16.7） |
| 範囲チェックだけが原因で PR が赤い | 過去のコミットに範囲外が混ざっている | `harness:override` ラベルを付けて PR 単位で救う（16.4） |
| 承認が付かないまま158分 | レビュー担当チームが間に合っていない | 講師が承認を入れる（`enforce_admins: false`） |
| CI 自体が壊れた | GitHub Actions の障害など | 保護を一時的に緩める。**最終手段** |
| Pages が404 | Source が `Deploy from a branch` になっている | GitHub Actions に切り替える | T-26 |
| ハーネスが誤作動して作業が進まない | 想定外のパス構成など | `CARD_ARCADE_HARNESS=off` で Layer 2 と pre-commit を止める（**CI は止まらない**） |

**逃げ道は優先度順に並べて印刷しておく。焦っているときに判断させない。**
番号が小さいものほど影響範囲が狭く、後始末が要らない。

### 22.3 新構成で新しく増えたトラブル

日本のトランプゲームに変えたことと、ハーネスを入れたことで増えたものが3つある。

| 症状 | 原因 | 対応 |
|---|---|---|
| ルール解釈で議論が止まる | トランプはローカルルールが多い | **`docs/games/<ゲームID>.md` が正典。** 70分を過ぎたら講師が解釈を決める |
| 大富豪だけ実装が終わらない | 6ゲームで明確に最も重い | 5名を配置し、**革命は最初から発展課題**にしてよいと70分に伝える |
| フックが動いていないように見える | フックの承認をしていない | セッション開始時に「# 今のセッションの前提」が出るかで判別（T-08） |

---

## 23. 研修設計上の重要ポイント

### 23.1 主目的はゲーム制作ではない

この研修の主目的はゲーム制作ではない。
全員が理解できる題材（日本のトランプゲーム）を使い、次の構造を体験することが本質である。

```text
共通のカード基盤
＋
チームごとの独立したゲーム
＋
共通の開発ルール
＋
Pull Request によるレビューと統合
＝
一つの CARD ARCADE
```

今回の改訂で、ここに1行を足した。

```text
共通のカード基盤
＋
チームごとの独立したゲーム
＋
共通の開発ルール
＋
破ろうとすると機械が止まる仕組み        ← 追加
＋
Pull Request によるレビューと統合
＝
一つの CARD ARCADE
```

**「共通の開発ルール」と「機械が止める仕組み」は別物である。** ここを分けたのが今回の改訂の核心になる。

ルールは文章である。文章は読まれないことがあり、忘れられることがあり、
時間に追われれば破られる。破られたときに困るのは書いた人ではなく他の5チームである。

だから同じ内容を**動くコード**にした。

| 文章のルール | 動くコード |
|---|---|
| 他人のフォルダを触らない | `scripts/scope-guard.mjs` が差分を見て落とす |
| 依存を追加しない | `deny` と `guard-bash.mjs` が止め、CI が lockfile の差分を見る |
| `logic.ts` に `Math.random()` を書かない | ESLint が error にする |
| ESLint を無効化して回り込まない | 契約テストが `eslint-disable` の存在を検査する |
| `verify` を通してから提出する | Stop フックが1回引き止め、CI が同じ列を実行する |

**目的は講師が注意する回数を減らすことではない。**
「なぜダメか」を人間が説明するのは1回で済み、2回目以降は機械が同じ言葉で説明してくれる、
という状態を作ることが目的である。講師の時間は、機械が判定できないことに使う。

### 23.2 参加者自身が判断すること

Claude Code にすべてを丸投げするのではなく、参加者自身が次を判断する。

- 要件を確認する
- **実装計画をレビューする**（`/kickoff` はコードを1行も変更しない。合意してから `/implement` に進む）
- 変更範囲を管理する
- **ゲームルールを検証する**（正典と突き合わせる。正典に無いことは実装しない）
- **テスト内容を確認する**（アサーションを1つ逆にして、本当に赤くなるか見る）
- Pull Request を説明する
- **他者の変更をレビューする**（差分を読むだけでなく、実際に動かす）
- マージ後の統合状態を確認する

`CLAUDE.md` にも「人間が必ず自分で確認すること」を4点に絞って書いてある。

1. **実装計画**が Issue の要件と合っているか
2. **実機で遊べるか**（最初から最後まで1回プレイする）
3. **テストが仕様を確認しているか**（アサーションを1つ逆にして赤くなることを見る）
4. **Pull Request の説明**が自分の言葉で書かれているか

**AI に指示するファイル自身に「AI を信じるな」と書いてある**のは意図的である。
参加者はこのファイルを読むし、AI もこのファイルを読む。
AI 側にも「人間の確認を飛ばさない」という前提が渡る。

### 23.3 機械と人間の役割分担

**この研修でいちばん伝えたいのは、ハーネスの作り方ではなく、境界の引き方である。**

| 機械に任せるもの | 人間が見るもの |
|---|---|
| 他人に迷惑がかかるか（範囲・依存・依存の向き・純粋性） | 良いコードか（命名・テストの質・ルールの解釈） |
| 数えられるもの（テスト件数・CI の成否・PR の有無） | 数えられないもの（説明が伝わるか・指摘が具体的か） |
| 何度でも同じ判定ができるもの | 一度しか起きない状況の判断 |

この分担は、ハーネス（12章）・レビュー（15章）・評価（20章）の3箇所で同じ形をしている。
**3箇所で同じ線を引いているので、参加者は180分で3回それを体験する。**

現場で CI を導入すると「CI が緑なら良いコード」という誤解が必ず生まれる。
CI が保証しているのは「壊れていないこと」だけである。
その2つが別の仕組みで担保されている状態を体で覚えて帰るのが、この研修の到達点になる。

### 23.4 結論

これにより、単なる AI コーディング体験ではなく、
**「既存の共通基盤に対して、制約を守りながら機能を追加し、
機械が守る境界の中で、他者のレビューを経て統合する」**という、
共有リポジトリでの実践的な共同開発研修を実現する。

---

## 24. 研修終了時の到達イメージ

参加者が、次の内容を**自分の言葉で説明できる**状態を目指す。

### 24.1 共同開発の基本

1. なぜ `main` ブランチへ直接変更を加えないのか
2. Issue・ブランチ・Commit・Pull Request の関係
3. 共通基盤と担当機能を分ける理由
4. Claude Code の実装結果を人間が確認する必要性
5. テストが Pull Request の品質を支える仕組み
6. コードレビューで確認すべき観点
7. 複数人の変更が一つのプロダクトへ統合される流れ

### 24.2 ハーネスについて

8. **なぜ間違いを機械で止めるのか**
   人の注意力に頼ると、破られたときに困るのが破った本人ではないから。
   そして**早く止まるほど直すのが安い**から（数秒 → 数十秒 → 数分 → 全チームが巻き込まれる）。
9. **なぜ Layer 4（CI）だけが本当に止める装置なのか**
   手元の層は必ず抜けられる。抜けられてよい。手元の層は「早く気づかせる時短の道具」で、
   CI は「壊れたものを入れない防波堤」。**役割が違う。**
10. **どこまでを機械で止め、どこからを人間が見るのか**
    他チームに波及するものは機械で止める。自分のフォルダに閉じるものは警告に留め、レビューの題材にする。
11. **機械で測れないものは何か**
    テストの質、命名の分かりやすさ、ルールの解釈、説明が伝わるか。
    **数えられるものと数えられないものの線引きが、そのまま CI とレビューの分担になっている。**
12. **自分のプロジェクトに持ち帰るなら、最初に何を1つ作るか**
    5層すべてを作る必要はない。**1つだけ作るなら CI の1本**である。
    手元の仕組みは抜けられるが、CI は抜けられない。

### 24.3 到達を確かめる問い

振り返り（Step 18）で1人1つずつ答えさせる。

- 今日いちばん「**止められて助かった**」ことは何か
- Claude Code の出力を**自分で確かめて良かった**ことは何か
- 明日から自分のプロジェクトに持ち帰る**1つ**は何か

**3つ目に答えられれば、この研修は成功である。**
180分で作ったゲームは持ち帰れないが、**境界の引き方は持ち帰れる。**
