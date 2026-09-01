# 止められたときに読むページ

作業中に「それはできません」と止められることがあります。
このページは、**なぜ止まるのか**と**止められたら次に何をするか**を1ページにまとめたものです。

## 間違いは人の注意力ではなく仕組みで止める

3時間で9人が同じリポジトリを同時に触ります。
このとき、いちばん高くつく失敗は「1人のうっかりが全員を止めること」です。

- 誰かが `src/core/` を1行変える → 9人全員のテストが赤くなる
- 誰かが `npm install` する → `package-lock.json` が変わり、9つの Pull Request が全部競合する
- 誰かが `main` で作業する → その変更を誰も分離できなくなる

だから、この研修では**気をつける**のではなく**気をつけなくても起きない形**にしてあります。
止められたのは、あなたが疑われているからではありません。**全員の時間を守るため**です。

そして早く止まるほど、直すのは安く済みます。

| どこで止まるか | 直すのにかかる時間 |
|---|---|
| 書く前（フック） | 数秒 |
| コミット前（pre-commit） | 数十秒 |
| Pull Request（CI） | 数分 + レビュアーの待ち時間 |
| マージ後 | 9人全員が巻き込まれる |

## 5層のハーネス

| 層 | 何が止めるか | いつ止めるか | 外せるか |
|---|---|---|---|
| **1. 予防** | `npm run scaffold`（`scripts/scaffold-game.mjs`）と `templates/game/` | 書き始める前。構造を間違えられない雛形を作る | そもそも止めない（間違いが起きない形にする） |
| **2. 伝える** | `CLAUDE.md` / `src/games/CLAUDE.md` / `src/core/CLAUDE.md` / SessionStart フック | Claude Code が考える前。前提と担当を毎回渡す | 強制力は無い（読ませるだけ） |
| **3. その場で止める** | `.claude/settings.json` の `deny` と `.claude/hooks/` の5本 | ツールを実行する直前 | 講師用の環境変数で無効化できる |
| **4. コミットさせない** | ESLint の境界ルール / `tests/contract/` の4本 / 型チェック / `.githooks/pre-commit` | `npm run verify` と `git commit` | **外せない** |
| **5. マージさせない** | CI の `verify` / CODEOWNERS / ブランチ保護 | Pull Request | 講師のみ（`harness:override` ラベル） |

### Layer 3 が止めるもの（.claude/）

| フック | 役割 |
|---|---|
| `guard-scope.mjs` | 担当フォルダの外に書こうとしたら止める（PreToolUse: Write / Edit） |
| `guard-bash.mjs` | コマンド経由の回り込みを止める（下の表がその全部です） |
| `format-file.mjs` | 担当フォルダの中だけ prettier をかける（差分ノイズを消す） |
| `require-verify.mjs` | `npm run verify` を通さずに終わろうとしたら1回だけ引き止める（Stop） |
| `session-brief.mjs` | セッション開始時に「今どのゲームの担当か」を伝える（SessionStart） |

`session-brief.mjs` は `harness/config.json` を読み、ブランチ名から
「担当◯ / ゲーム名 / ゲームID / 担当 Issue」を毎回 Claude Code に渡します。
だから新しいセッションを開いても、担当を説明し直す必要がありません。

## `guard-bash.mjs` が止めるコマンド

Claude Code に打っても**実行されず、拒否メッセージが返る**コマンドの一覧です。
このページで最初に見るべきはこの表です。「打ったのに動かない」のほとんどはここに載っています。

| 止まるコマンド | なぜ止めるか |
|---|---|
| `npm install` / `npm i` / `yarn add` / `pnpm add` などの依存追加 | `package-lock.json` が変わると9人全員の Pull Request が競合する |
| `git commit --no-verify` | チェックを飛ばしても、CI で同じことが起きるだけ |
| `git push --force` / `git push -f` | 履歴を書き換えると他の人の作業が壊れる |
| `git push ... main` | `main` への直接 push。作業を分離できなくなる |
| **`npm run dev` / `npm run preview` / `npx vite`** | **起動したままになり、セッションが返ってこない。** さらにターミナルB の 5173 番とポートが衝突する |
| **`npm run test:watch` / `npm test -- --watch` / `npx vitest`（`run` なし）** | **監視モードは終わらない。** セッションが返ってこない |
| **`gh pr review` / `gh pr comment` / `gh issue comment`** | **他人の Pull Request と Issue に文字を投稿する操作。** レビューに書いてよいのは「自分が実機で確認したこと」だけなので、確認した本人が投稿する |
| **`gh api`**（作業ブランチのときだけ） | 上の判定を**全部迂回できる裏口**。ここを開けると他の行が意味を失う |
| **`node scripts/setup-github.mjs` / `node scripts/build-issue-bodies.mjs`**（作業ブランチのときだけ） | **講師専用。** 9人分の Issue をまとめて作り直してしまう |
| **`npm run scaffold -- --all` / `--force`**（作業ブランチのときだけ） | **講師専用。** 9人分の雛形をまとめて上書きしてしまう |
| **`gh issue edit`**（作業ブランチのときだけ） | Issue 本文は全員が同じ条件で進むための基準なので、講師が管理する |
| リダイレクト（`>`）・`sed -i`・`cp`・`tee` で保護領域に書く | `deny` はコマンドの先頭しか見ないので、シェル経由の抜け道をここで塞ぐ |

**講師専用の4行に「作業ブランチのときだけ」と書いてあるのは、運営が `main` で共通基盤を整えるため**です。
参加者は必ず `feature/<ゲームID>` で作業するので、実質的にはいつでも止まります。

### 開発サーバーと監視モードだけ、扱いが違う理由

上の表の多くは「**他の人に波及するから**」止めています。
`npm run dev` と `npm run test:watch` はそうではありません。**あなた1人の話です。**
それでも止めているのは、理由が2つあるからです。

1. **技術的な理由。** どちらも終わらないコマンドなので、Claude Code のセッションが返ってきません。
   さらに `npm run dev` は、ターミナルB ですでに使っている 5173 番ポートと衝突します。
2. **設計上の理由。** 開発サーバーは**遊ぶための道具**です。
   遊ぶのは人間の仕事なので、道具も人間の側（ターミナルB）に置いてあります。

拒否メッセージには、ターミナルB での起動手順がそのまま書いてあります。

```text
npm run dev は Claude Code からは実行できません。
起動したままになるので、このセッションが返ってこなくなります。

開発サーバーは「あなたが、別のターミナルで」動かします。研修中はつけっぱなしです。

  1. PowerShell をもう1つ開く（これを「ターミナルB」と呼びます）
  2. cd してリポジトリのフォルダへ移動する
  3. npm run dev
  4. ブラウザで http://localhost:5173/ を開く
```

### Pull Request と Issue への投稿だけ、人間に固定してある理由

`gh pr review` / `gh pr comment` / `gh issue comment` は、**打った瞬間に他の人の画面に文字が出ます。**

この研修のレビューには1つだけ約束があります。

> **レビューに書いてよいのは「自分が実機で確認したこと」だけ。**

確認したかどうかを知っているのは人間だけです。**Claude Code には判定できません。**
だから、下書きを作るところまでは Claude Code の仕事（`/review` と `/fix-review`）にして、
**投稿は人間の手**に固定しています。

投稿は GitHub の画面（Files changed → Review changes）から行うのがいちばん確実です。
コマンドで出したい場合は、ターミナルB で自分の手で打ちます。

## `owner.json` — レビュー中に自分の担当を見失わないための仕組み

`npm run scaffold -- --game <ゲームID>` を実行すると、次のファイルが作られます。

```text
.claude/.state/owner.json
```

中身は1行だけです。

```json
{ "gameId": "babanuki" }
```

**これは「自分の担当はこれ」という記録**です。研修中に一度だけ書かれ、あとは変わりません。

### 何のためにあるか

レビューのときに `gh pr checkout <相手のPR番号>` すると、**ブランチ名が相手のものに変わります。**

```text
feature/babanuki   →   feature/daifugo
```

ブランチ名だけで担当を判定していると、この状態では「あなたは大富豪の担当だ」と見えてしまい、
**相手のコードを編集できてしまいます。** `owner.json` はそれを防ぎます。

`guard-scope.mjs` は、書き込み先のゲームIDを **ブランチ名ではなく `owner.json` と突き合わせます。**
相手のフォルダを編集しようとすると、こう止まります。

```text
src/games/daifugo/logic.ts は 担当2（大富豪） の担当です。

あなたの担当は babanuki です。
いま相手のブランチを取ってきている（レビュー中）だけなので、
相手のコードは変更できません。

気づいたことは、直すのではなく Pull Request のコメントで伝えてください。
自分の作業に戻るときは git switch feature/babanuki です。
```

### なぜ「直せない」ほうが良いのか

レビュー中に相手のコードを直せてしまうと、**指摘が消えます。**
直した本人は満足しますが、相手は「自分のコードのどこが危なかったのか」を知らないまま今日を終えます。
それでは、その人が1人で書いたコードに2つ目の目が入ったことになりません。

**レビュアーの仕事は直すことではなく、伝えることです。** `owner.json` はそれを形にしたものです。

なお、`owner.json` は `harness/config.json` の `alwaysWritable` に入っているので、
`.claude/.state/` の中への書き込みだけは保護領域の例外として許可されています。

## なぜ無害なコマンドは確認なしで通るのか

`.claude/settings.json` には3つの段階があります。

| 段階 | 何が起きるか | 入っているもの |
|---|---|---|
| **deny** | 実行されない。拒否メッセージが返る | 上の「`guard-bash.mjs` が止めるコマンド」 |
| **ask** | 人間に確認を求める（Yes / No） | `git push` / `gh pr create` / `gh pr merge` / `gh pr ready` / `gh pr edit` / `gh issue create` / `git merge` / `git rebase` / `git reset --hard` |
| **allow** | 確認なしで実行される | `npm test` / `npm run verify` / `npm run build` / `npm run scaffold -- --game <ゲームID>` / `git switch` `add` `commit` `status` `diff` `pull` / `gh pr checkout` `view` `checks` `diff` / `node -v` / `gh auth status` |

**allow に入っているコマンドは、確認なしで通ります。** これは手を抜いているのではなく、意図した設計です。

> ### 承認疲れを防ぐため
>
> **確認の回数が増えると、本当に大事な確認が形骸化します。**
>
> `npm test` のたびに「実行してよいですか？」と聞かれる環境では、人は3分で読まなくなります。
> Enter を押す作業になり、その手が止まらないまま `git push` の確認も通ります。
> **10回に9回どうでもいい確認をすると、10回目の大事な確認が死にます。**
>
> だから、確認を求める対象を**取り返しがつかないもの**に絞ってあります。
>
> - **他の人に見える**（`git push` / `gh pr create` / `gh pr ready`）
> - **履歴が変わる**（`git merge` / `git rebase` / `git reset --hard`）
> - **元に戻すのに手間がかかる**（`gh pr merge`）
>
> `npm test` は何度打っても壊れません。`git status` も同じです。
> **壊れないものを止めない。壊れるものだけ止める。** それが確認を生かしておく方法です。

`ask` の6つ（`git push` / `gh pr create` / `gh pr merge` / `gh pr ready` / `gh pr edit` / `gh issue create`）は、
**そもそもターミナルB で自分の手で打つ決まり**になっています。
Claude Code から打とうとしても承認を求められますが、承認を押すだけの作業にしないために、
この6つは自分でタイプしてください。**指が覚えた操作は、あとで会社のリポジトリでも使えます。**

## 硬さの基準は「他の人に波及するか」

止め方には**硬さの差**があります。全部を機械で止めると、違反を潰す作業に時間を使って
ゲームを作る時間が無くなります。全部を警告にすると、機械が何も守りません。
そこで基準を1つに絞ってあります。

> **その違反が他の人に波及するかで決める。**

| 波及する（機械で止める / error） | 自分のフォルダに閉じる（警告に留める / warn） |
|---|---|
| 担当範囲の外を変更する | `any` を使う |
| 依存を追加する（`package-lock.json` が変わる） | 1ファイルが400行を超える |
| 他の人のゲームを参照する | 1関数が150行を超える |
| `@core/...` の深い import | 複雑度が15を超える |
| `logic.ts` を非純粋にする（乱数・時間・react） | `console.log` を残す |
| `localStorage` を直接使う（キーが衝突する） | — |
| `eslint-disable` を書く | — |

チーム制なら「他チームに波及するか」でしたが、いまは1人1ゲームなので**他の人に波及するか**です。
基準は変わりません。左の列を1つ通すと、他の8人の Pull Request が落ちます。
**個人の判断で通してよい範囲ではありません。**

右の列は自分のフォルダの中だけの話なので、機械で止めずに**レビューの題材に回します**。
警告として画面に出ているので、レビュアーは「ここに warn が出ていますが意図的ですか」と聞けます。
すべてを error にすると、レビューで話すことが無くなります。

（例外は `eqeqeq` と未使用変数の2つです。波及はしませんが、直すのが一瞬で、
放置すると型チェックとビルドの失敗に化けるので error にしてあります。）

### なぜ Layer 4 だけが外せないのか

`npm run verify` と CI が**まったく同じコマンド**を実行するからです。

```
範囲チェック → lint → 型チェック → テスト → ビルド
```

さらに、抜け道自体を塞いであります。

- ESLint は `eslint-disable` で黙らせられますが、**契約テストが `eslint-disable` の存在そのものを検査**します
- `@core/deck` のような深い import は、エイリアスが完全一致の正規表現なので**モジュール解決の時点で失敗**します
- `logic.ts` の `Math.random()` は ESLint と契約テストの**両方**が見ています
- Layer 3 を黙らせる環境変数は、**Layer 4 には効きません**

つまり手元で何を消しても、Pull Request では必ず同じ結果が出ます。
**回り込む方法を探す時間が、いちばんもったいない使い方です。**

### GitHub 側のラベル

Issue と Pull Request には、`node scripts/setup-github.mjs labels` が作ったラベルが付いています。

| ラベル | 意味 |
|---|---|
| `participant-1` 〜 `participant-9` | 担当者。1人につき1つ（担当1 = `participant-1` … 担当9 = `participant-9`） |
| `difficulty:easy` / `difficulty:normal` / `difficulty:hard` | 初級 / 中級 / 上級 |
| `game` | 参加者が担当するゲームの実装 |
| `stretch-goal` | 発展課題（必須ではない） |
| `blocked` | 詰まっている・講師の判断待ち |
| `bug` | 大会で見つかった不具合 |
| `core-change` | 共通基盤の変更を含む（講師レビュー必須） |
| `harness:override` | **講師のみ**。付いている Pull Request では範囲チェックが警告に降格する |

担当ラベルは `harness/config.json` の `participant` と同じ名前です。
自分の Issue と Pull Request はラベルで絞り込めます。

```powershell
gh issue list --label participant-1
gh pr list --label participant-1
```

15分以上進まないときは、`blocked` を自分で付けてください。
1人で作っているので、**黙っていると誰も気づけません**。ラベルは救難信号です。

## 止められたときの読み方

フックのメッセージは、いつも同じ3つの部分でできています。

```
src/core/cards/index.ts は運営が管理している場所なので変更できません。   ← 1. 何が起きたか

編集してよいのは src/games/<自分のゲームID>/ の中だけです。              ← 2. なぜダメか

共通基盤への変更が必要かもしれません。次の形で人間に報告してください:   ← 3. 次にどうするか
  - やりたいこと:
  - 足りないと思うもの:
  - ゲーム側だけで実現する案（あれば）:
```

**読むべきは3番目だけ**です。必ず「次にどうするか」が書いてあります。
書いてある通りにすれば進めます。同じ操作を言い方を変えて試す必要はありません。

止められた Claude Code は、**善意で回り込もうとします。** そのときはこう伝えてください。

```text
回避策は探さないでください。
なぜ止められたのかと、ゲーム側（src/games/<自分のゲームID>/ の中）だけで実現する案があるかを説明してください。
別のコマンドで同じことをやり直すのはやめてください。
```

## よく止まるケースと対処

### 1. `src/core/` や `src/components/` を編集しようとした

```
src/core/cards/index.ts は運営が管理している場所なので変更できません。
```

9人全員が使う共通基盤です。ここを1行変えると、他の8人の Pull Request が突然壊れます。

**やること**

1. まず `src/core/index.ts`（または `src/components/index.ts`）をもう一度読む。
   足りないと思った機能は、既存の関数の組み合わせで作れることがほとんどです。
   早見表は [docs/architecture.md](architecture.md) にもあります。
2. それでも必要なら、**自分で直さずに**次の形で報告して講師に相談します。

```text
共通基盤への変更が必要かもしれません。

- やりたいこと:
- 足りないと思うもの:
- ゲーム側だけで実現する案（あれば）:
- 影響しそうな範囲:

講師に確認してください。
```

`docs/` も同じ扱いです（教材は運営管理なので、参加者は編集できません）。

### 2. `npm install` しようとした

```
依存パッケージの追加・更新はできません: npm install lodash
```

依存を1つ入れると `package-lock.json` が変わります。
すると9人全員の Pull Request が同じファイルで競合し、統合が止まります。
CI にも「依存が変わっていないか」という専用のチェックがあります。

**やること**

- `@core` と `@ui` にあるもので作ります（一覧: `src/games/CLAUDE.md` / [docs/architecture.md](architecture.md)）
- 乱数は `createRng`、保存は `useHighScore`、時間は `useCpuTurn` です。外部ライブラリは要りません
- どうしても必要だと思ったら、入れずに講師へ相談します

なお、環境を作り直すときの `npm ci` は使えます（`npm install` ではなく `npm ci`）。
ただし**ターミナルB で `npm run dev` が動いている間は打たないでください。**
Windows では `node_modules` が使用中になり失敗します。打つ前に `Ctrl + C` で開発サーバーを止めます。

（レビューで `gh pr checkout` したあとに `npm ci` は要りません。
依存の追加が禁止されているので、**9人のブランチはすべて `package-lock.json` が同一**だからです。）

### 3. 担当外のゲームを触った

```
src/games/daifugo/logic.ts は 担当2（大富豪） の担当です。

今のブランチ feature/babanuki の担当は babanuki です。
他の人のゲームは変更しないでください。
```

**やること** — 変更してしまったファイルを戻します。
`npm run scope` を実行すると、**そのままコピペできる `git restore`** が表示されます。

```powershell
npm run scope
```

```powershell
git restore --source=HEAD --staged --worktree -- src/games/daifugo/logic.ts
```

複数のファイルを触ってしまった場合も、`npm run scope` が全部まとめた1行を出します。
表示されたコマンドをそのまま実行してください。

（1つの Pull Request で扱うゲームは1つだけです。2つ以上のゲームフォルダに変更があると、
ブランチ名と一致していても範囲チェックが落ちます。）

**レビュー中にこれが出た場合は、正常です。** `owner.json` が効いています。
相手のコードは直さず、指摘としてコメントに書いてください（上の「`owner.json`」の節）。

### 4. `main` ブランチのまま編集した

```
まだ作業ブランチを作っていません（今: main）。

  git switch -c feature/babanuki
```

**やること** — 作業ブランチを作ります。

```powershell
git switch -c feature/babanuki
```

すでに `main` で編集してしまっていても大丈夫です。
コミットしていない変更は、そのまま新しいブランチへ付いてきます。
上のコマンドを実行してから、続きを進めてください。

（`git switch -c` の後ろは自分のゲームIDです:
`babanuki` / `daifugo` / `shinkeisuijaku` / `poker` / `butanoshippo` /
`speed` / `shichinarabe` / `doubt` / `pageone`）

### 5. `npm run verify` を通さずに終わろうとした

```
まだ npm run verify を通していない変更があります。

  npm run verify
```

研修でいちばん多い失敗が「動いたつもりで Pull Request を出したら CI が赤」です。
Stop フックが**1回だけ**引き止めます。

**やること**

```powershell
npm run verify
```

範囲チェック・lint・型チェック・テスト・ビルドが順に走ります。
落ちたときは、**最初に落ちたものから**直してください。

このフックは同じセッションで2回目は黙ります（作業が詰まらないように）。
ただし CI は黙りません。**verify が緑になって初めて「できた」と言えます。**

### 6. `npm run dev` を Claude Code に打たせようとした

```
npm run dev は Claude Code からは実行できません。
起動したままになるので、このセッションが返ってこなくなります。
```

**やること** — ターミナルB を見てください。たいていは、そこですでに動いています。

- 動いている → ブラウザ（http://localhost:5173/）を **F5 で再読み込み**するだけです
- 止まっている → ターミナルB で `npm run dev` を打ち直します

**Claude Code に「開発サーバーを起動して」と頼まないでください。** 何度頼んでも拒否されます。
画面を見て「遊べるかどうか」を判断するのは人間の仕事です。

### 7. Pull Request にコメントを投稿させようとした

```
Pull Request や Issue への投稿は、Claude Code からは行いません。
```

**やること** — 下書きまでは Claude Code に作らせて、投稿は自分で行います。

```text
投稿はしないでください。下書きだけ出してください。
私が GitHub の画面から自分で投稿します。
```

投稿は GitHub の画面（Files changed → 行の `+` → Review changes）から行います。

### そのほか

| 止められたこと | 理由 | どうするか |
|---|---|---|
| `git commit --no-verify` | チェックを飛ばすと、CI で同じことが起きるだけ | 落ちた理由を直してからコミットする |
| `git push --force` | 履歴を書き換えると他の人の作業が壊れる | 講師に相談する |
| `git push origin main` | `main` への直接 push は禁止 | `git push -u origin feature/<ゲームID>` して Pull Request を作る |
| `npx vitest`（監視モード） | セッションが返ってこなくなる | `npm test`（= `vitest run`）を使う |
| `npm run dev` / `npm run preview` | セッションが返ってこない / 5173 番が衝突する | ターミナルB で自分で起動する |
| `gh pr review` / `gh pr comment` | 他人の画面に文字が出る操作 | GitHub の画面から自分で投稿する |
| `gh api` | 上の判定を全部迂回できる裏口 | やりたいことを言葉で言う。必要なら講師に相談する |
| `gh issue edit` | Issue 本文は講師が管理している | チェックボックスは GitHub の画面で自分でクリックする |
| `npm run scaffold -- --all` | 9人分の雛形を上書きしてしまう | `npm run scaffold -- --game <自分のゲームID>` を使う |
| `.claude/settings.json` の変更 | ハーネス自体の無効化 | 止められた理由を講師に伝える |

`docs/troubleshooting.md` には、エラーメッセージから引ける番号つきの対処集（T-01〜）があります。
`/stuck` を使うと、Claude Code が現状を整理して次の一手を1つだけ出します。
