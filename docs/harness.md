# 操作が拒否された場合の対処

作業中に、ハーネスによって操作が拒否されることがあります。
このページでは、操作が拒否される理由と、その後の対処を説明します。

## ハーネスを設ける理由

この研修では、9名が3時間のなかで同じリポジトリを変更します。共通ファイルの変更は、ほかの参加者の作業にも影響します。

- `src/core/` を変更すると、共通処理を利用するゲームのテストに影響する
- `npm install` で `package-lock.json` が変わると、複数のPull Requestで競合する可能性がある
- `main` で作業すると、担当ゲームの変更を作業ブランチとして管理できない

この研修では、注意だけに頼らず、誤操作を仕組みで防ぎます。
操作を早い段階で止めることで、修正の範囲と所要時間を抑えられます。

| 検出する段階             | 修正時間の目安           |
| ------------------------ | ------------------------ |
| 書く前（フック）         | 数秒                     |
| コミット前（pre-commit） | 数十秒                   |
| Pull Request（CI）       | 数分と、再検証を待つ時間 |
| マージ後                 | 影響範囲の調査が必要     |

## 5層のハーネス

| 層                  | 機能                                                                               | 検査する時点                                 | 無効化できるか                        |
| ------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------- |
| **1. 予防**         | `npm run scaffold`（`scripts/scaffold-game.mjs`）と `templates/game/`              | 実装前に、必要な構造の雛形を生成する         | 該当しない                            |
| **2. 指示**         | `CLAUDE.md` / `src/games/CLAUDE.md` / `src/core/CLAUDE.md` / SessionStart フック   | Claude Code の作業開始前に、前提と担当を示す | 強制力はない（文書による指示のみ）    |
| **3. 操作制限**     | `.claude/settings.json` の `deny` と `.claude/hooks/` の5本                        | ツールを実行する直前                         | 講師用の環境変数で無効化できる        |
| **4. ローカル検証** | ESLintの境界ルール / `tests/contract/` の4本 / 型チェック / `.githooks/pre-commit` | `npm run verify` と `git commit`             | 無効化できない                        |
| **5. CI**           | CI の `verify` / CODEOWNERS / ブランチ保護                                         | Pull Request                                 | 講師のみ（`harness:override` ラベル） |

### Layer 3の操作制限（`.claude/`）

| フック               | 役割                                                                            |
| -------------------- | ------------------------------------------------------------------------------- |
| `guard-scope.mjs`    | 担当フォルダの外への書き込みを拒否する（PreToolUse: Write / Edit）              |
| `guard-bash.mjs`     | シェルコマンドによる制限対象の操作を拒否する                                    |
| `format-file.mjs`    | 担当フォルダ内のファイルにPrettierを実行する                                    |
| `require-verify.mjs` | `npm run verify` を実行せずに終了しようとした場合、初回の終了を拒否する（Stop） |
| `session-brief.mjs`  | セッション開始時に担当ゲームを表示する（SessionStart）                          |

`session-brief.mjs` は `harness/config.json` を読み、ブランチ名から
「担当◯ / ゲーム名 / ゲーム ID / 担当 Issue」を Claude Code へ渡します。新しいセッションでも、この情報が起動時に表示されます。

## `guard-bash.mjs` が拒否するコマンド

Claude Codeから実行すると拒否されるコマンドの一覧です。

| コマンド                                                                                              | 拒否する理由                                                                |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `npm install` / `npm i` / `yarn add` / `pnpm add` などの依存追加                                      | `package-lock.json` が変わると9人全員の Pull Request が競合する             |
| `git commit --no-verify`                                                                              | コミット前の検査を省略する                                                  |
| `git push --force` / `git push -f`                                                                    | リモートの履歴を書き換える                                                  |
| `git push ... main`                                                                                   | `main` への直接 push。作業を分離できなくなる                                |
| **`npm run dev` / `npm run preview` / `npx vite`**                                                    | 処理が終了せず、ターミナルBの開発サーバーと5173番ポートが競合する           |
| **`npm run test:watch` / `npm test -- --watch` / `npx vitest`（`run` なし）**                         | 監視モードが終了しない                                                      |
| **`gh pr review` / `gh pr comment` / `gh issue comment`**                                             | Pull RequestやIssueへ投稿する操作である                                     |
| **`gh api`**（作業ブランチのときだけ）                                                                | 操作内容を事前に判定できず、ほかの制限を経由せずに変更できる                |
| **`node scripts/setup-github.mjs` / `node scripts/build-issue-bodies.mjs`**（作業ブランチのときだけ） | 9名分のIssueをまとめて変更する講師用の操作である                            |
| **`npm run scaffold -- --all` / `--force`**（作業ブランチのときだけ）                                 | 9名分の雛形をまとめて上書きする講師用の操作である                           |
| **`gh issue edit`**（作業ブランチのときだけ）                                                         | Issue 本文は全員が同じ条件で進むための基準なので、講師が管理する            |
| リダイレクト（`>`）・`sed -i`・`cp`・`tee` で保護領域に書く                                           | `deny` はコマンドの先頭しか見ないため、シェル経由の書き込みもここで拒否する |

講師用の操作を `main` で実行できるよう、該当する4項目は作業ブランチの場合だけ拒否します。参加者は `feature/<ゲームID>` で作業するため、これらの操作を実行できません。

### 開発サーバーと監視モードを拒否する理由

`npm run dev` と `npm run test:watch` は、参加者がターミナルBで継続して実行するコマンドです。ターミナルAからの実行を拒否する理由は2つあります。

1. どちらも継続して動作するため、ターミナルAの処理が完了しません。さらに `npm run dev` は、ターミナルBで使用している5173番ポートと競合します。
2. ゲームの動作確認は参加者がブラウザで行うため、開発サーバーもターミナルBで管理します。

拒否メッセージには、ターミナルBでの起動手順が記載されています。

```text
npm run dev は Claude Code からは実行できません。
起動したままになるので、このセッションが返ってこなくなります。

開発サーバーは、参加者が別のターミナルで起動します。研修中は起動したままにします。

  1. PowerShell をもう1つ開く（これを「ターミナルB」と呼びます）
  2. cd してリポジトリのフォルダへ移動する
  3. npm run dev
  4. ブラウザで http://localhost:5173/ を開く
```

### Pull Request と Issue への投稿を参加者が行う理由

`gh pr review` / `gh pr comment` / `gh issue comment` は、GitHub上の情報を更新するコマンドです。
投稿内容にはブラウザで確認した結果を含めるため、Claude Codeには下書きの作成までを依頼し、投稿は確認を行った参加者が担当します。

投稿は GitHub の画面から行います。コマンドを使う場合は、ターミナルBで参加者が実行します。

## `owner.json` による担当範囲の記録

`npm run scaffold -- --game <ゲームID>` を実行すると、次のファイルが作られます。

```text
.claude/.state/owner.json
```

ファイルには、ゲームIDを記録します。

```json
{ "gameId": "babanuki" }
```

この値は研修中に一度だけ書き込まれ、その後は変更されません。

### 記録する目的

`guard-scope.mjs` は、書き込み先のゲームIDをブランチ名と `owner.json` の両方に照合します。ほかの参加者のブランチへ切り替わっている状態で担当外のフォルダを編集すると、次のメッセージが表示されます。

```text
src/games/daifugo/logic.ts は 担当2（大富豪） の担当です。

あなたの担当は babanuki です。
いま他の人のブランチにいるので、そのコードは変更できません。

自分の作業に戻るときは git switch feature/babanuki です。
```

ブランチ名だけで判定すると、切り替え先のブランチを担当範囲として扱ってしまいます。`owner.json` も照合することで、担当外のコードへの書き込みを拒否します。

`owner.json` は `harness/config.json` の `alwaysWritable` に指定されています。そのため、`.claude/.state/` への書き込みは保護領域の例外として許可されます。

## 承認なしで実行できるコマンド

`.claude/settings.json` には3つの段階があります。

| 段階      | 動作                               | 対象                                                                                                                                                                                                                    |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **deny**  | 実行されない。拒否メッセージが返る | 上の「`guard-bash.mjs` が拒否するコマンド」                                                                                                                                                                             |
| **ask**   | 参加者に確認を求める（Yes / No）   | `git push` / `gh pr create` / `gh pr merge` / `gh pr ready` / `gh pr edit` / `gh issue create` / `git merge` / `git rebase` / `git reset --hard`                                                                        |
| **allow** | 確認なしで実行される               | `npm test` / `npm run verify` / `npm run build` / `npm run scaffold -- --game <ゲームID>` / `git switch` `add` `commit` `status` `diff` `pull` / `gh pr checkout` `view` `checks` `diff` / `node -v` / `gh auth status` |

`allow` に含まれるコマンドは、承認なしで実行されます。外部の状態や履歴を変更しない操作を、承認の対象から除外するためです。

> ### 承認対象を限定する理由
>
> 承認画面では、実行するコマンドと影響を確認する必要があります。確認回数を増やしすぎないよう、承認を求める対象を、外部へ反映される操作や履歴を変更する操作に限定しています。
>
> - リモートに変更を反映する（`git push` / `gh pr create` / `gh pr ready`）
> - 履歴を変更する（`git merge` / `git rebase` / `git reset --hard`）
> - Pull Request をマージする（`gh pr merge`）
>
> `npm test` や `git status` は外部の状態や履歴を変更しないため、確認なしで実行できます。

`ask` のうち、`git push`、`gh pr create`、`gh pr merge`、`gh pr ready`、`gh pr edit`、`gh issue create` は、参加者がターミナルBで実行します。ターミナルAから実行した場合は、承認を求める画面が表示されます。

## エラーと警告の使い分け

検査には、警告だけを表示するものと、操作を拒否するものがあります。すべての違反で操作を拒否すると修正に時間がかかり、すべてを警告だけにすると重要な違反を防げないためです。

ほかの参加者へ影響する違反はエラーとし、担当フォルダ内に限られる問題は警告として扱います。

| ほかの参加者へ影響する（error）                | 担当フォルダ内に限られる（warn） |
| ---------------------------------------------- | -------------------------------- |
| 担当範囲の外を変更する                         | `any` を使う                     |
| 依存を追加する（`package-lock.json` が変わる） | 1ファイルが400行を超える         |
| 他の人のゲームを参照する                       | 1関数が150行を超える             |
| `@core/...` の深い import                      | 複雑度が15を超える               |
| `logic.ts` を非純粋にする（乱数・時間・react） | `console.log` を残す             |
| `localStorage` を直接使う（キーが衝突する）    | —                                |
| `eslint-disable` を書く                        | —                                |

左の列にある変更は、共通基盤やほかの参加者のゲームに影響するため、エラーとして処理します。

右の列にある問題は担当フォルダ内に限られるため、操作を拒否せず警告を表示します。修正するかどうかは、内容を確認して実装者が判断します。

`eqeqeq` と未使用変数は例外としてエラーにしています。型チェックやビルドの失敗につながるためです。

### Layer 4を無効化できない理由

`npm run verify` とCIでは、同じ検証を実行します。

```
範囲チェック → lint → 型チェック → テスト → ビルド
```

検証を無効化する変更も、次の方法で検出します。

- ESLint の検査は `eslint-disable` で無効化できますが、**契約テストが `eslint-disable` の存在そのものを検査**します
- `@core/deck` のような深い import は、エイリアスが完全一致の正規表現なので**モジュール解決の時点で失敗**します
- `logic.ts` の `Math.random()` は ESLint と契約テストの**両方**が見ています
- Layer 3 を無効化する環境変数は、**Layer 4 には効きません**

ローカルのフックを無効化しても、Pull Request の CI では同じ検証が実行されます。エラーの原因を修正し、`npm run verify` が成功することを確認してください。

### GitHub 側のラベル

Issue と Pull Request には、`node scripts/setup-github.mjs labels` が作ったラベルが付いています。

| ラベル                                                      | 意味                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `participant-1` 〜 `participant-9`                          | 担当者。1人につき1つ（担当1 = `participant-1` … 担当9 = `participant-9`） |
| `difficulty:easy` / `difficulty:normal` / `difficulty:hard` | 初級 / 中級 / 上級                                                        |
| `game`                                                      | 参加者が担当するゲームの実装                                              |
| `stretch-goal`                                              | 発展課題（必須ではない）                                                  |
| `blocked`                                                   | 作業を続けられない、または講師の判断待ち                                  |
| `bug`                                                       | 公開後に見つかった不具合                                                  |
| `core-change`                                               | 共通基盤の変更を含む（講師の確認が必要）                                  |
| `harness:override`                                          | **講師のみ**。付いている Pull Request では範囲チェックが警告に降格する    |

担当ラベルは `harness/config.json` の `participant` と同じ名前です。
担当のIssueとPull Requestは、ラベルで絞り込めます。

```powershell
gh issue list --label participant-1
gh pr list --label participant-1
```

作業を続けられないときは、`blocked` ラベルを付けてください。
講師はこのラベルを確認し、対応が必要な参加者を把握します。

## 拒否メッセージの読み方

フックのメッセージは、次の3つの部分で構成されています。

```
src/core/cards/index.ts は運営が管理している場所なので変更できません。   ← 1. 何が起きたか

編集してよいのは src/games/<自分のゲームID>/ の中だけです。              ← 2. なぜダメか

共通基盤への変更が必要かもしれません。次の形式で参加者に報告してください:   ← 3. 次にどうするか
  - やりたいこと:
  - 足りないと思うもの:
  - ゲーム側だけで実現する案（あれば）:
```

3番目の「次にどうするか」を確認し、記載された手順に従ってください。同じ操作を別のコマンドで実行する必要はありません。

操作が拒否されたあと、Claude Codeが別の方法を提案することがあります。その場合は、次のように伝えてください。

```text
回避策は探さないでください。
なぜ止められたのかと、ゲーム側（src/games/<自分のゲームID>/ の中）だけで実現する案があるかを説明してください。
別のコマンドで同じことをやり直すのはやめてください。
```

## よくある拒否と対処方法

### 1. `src/core/` や `src/components/` を編集しようとした

```
src/core/cards/index.ts は運営が管理している場所なので変更できません。
```

共通基盤は9人全員が利用するため、変更するとほかの参加者のPull Requestにも影響します。

**対処方法**

1. `src/core/index.ts` または `src/components/index.ts` を確認し、既存の API を組み合わせて実現できないか検討する。早見表は [docs/architecture.md](architecture.md) にもあります。
2. 共通基盤の変更が必要な場合は、変更せずに次の形式で講師へ相談する。

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

依存関係を追加すると `package-lock.json` が変わり、ほかの参加者のPull Requestと競合する可能性があります。CIでも、依存関係が変更されていないか検査します。

**対処方法**

- `@core` と `@ui` の既存 API を確認する（一覧: `src/games/CLAUDE.md` / [docs/architecture.md](architecture.md)）
- 乱数には `createRng`、保存には `useHighScore`、時間処理には `useCpuTurn` を使用する
- 既存APIで実現できない場合は、依存関係を追加せずに講師へ相談する

なお、環境を作り直すときの `npm ci` は使えます（`npm install` ではなく `npm ci`）。
ただし、**ターミナルBで `npm run dev` が動いている間は実行しないでください。**
Windows では `node_modules` が使用中になり、処理が失敗します。実行前に `Ctrl + C` で開発サーバーを停止します。

`gh pr checkout` でほかのブランチへ切り替えた場合も、`npm ci` の再実行は不要です。各作業ブランチでは、`package-lock.json` を変更しません。

### 3. 担当外のゲームを触った

```
src/games/daifugo/logic.ts は 担当2（大富豪） の担当です。

今のブランチ feature/babanuki の担当は babanuki です。
他の人のゲームは変更しないでください。
```

**対処方法**

変更してしまったファイルを戻します。`npm run scope` を実行すると、対象ファイルを指定した `git restore` コマンドが表示されます。

```powershell
npm run scope
```

```powershell
git restore --source=HEAD --staged --worktree -- src/games/daifugo/logic.ts
```

複数のファイルを変更した場合も、`npm run scope` が対象をまとめた復元コマンドを1行で表示します。
表示されたコマンドをそのまま実行してください。

1つのPull Requestで扱うゲームは1つだけです。2つ以上のゲームフォルダに変更がある場合は、ブランチ名と一致していても範囲チェックが失敗します。

ほかの参加者のブランチでこのメッセージが表示された場合は、`owner.json` に記録された担当範囲へ戻ってください。相手のコードは変更せず、必要な指摘はコメントとして共有します。

### 4. `main` ブランチのまま編集した

```
まだ作業ブランチを作っていません（今: main）。

  git switch -c feature/babanuki
```

**対処方法**

作業ブランチを作成します。

```powershell
git switch -c feature/babanuki
```

`main` にコミットしていない変更がある場合も、`git switch -c` で作成したブランチへ引き継がれます。上のコマンドを実行してから作業を続けてください。

`git switch -c` の後ろには、担当するゲームIDを指定します（`babanuki` / `daifugo` / `shinkeisuijaku` / `poker` / `butanoshippo` / `speed` / `shichinarabe` / `doubt` / `pageone`）。

### 5. `npm run verify` を実行せずに終了しようとした

```
まだ npm run verify を通していない変更があります。

  npm run verify
```

`npm run verify` が未実行の場合、Stopフックが初回の終了を拒否します。

**対処方法**

```powershell
npm run verify
```

範囲チェック、lint、型チェック、テスト、ビルドが順に実行されます。失敗した場合は、最初に失敗した項目から修正してください。

このフックは、作業を繰り返し止めないよう、同じセッションでは1回だけ通知します。
ただし、CIでは同じ検証が実行されます。`verify` が成功したことを確認してから完了と判断してください。

### 6. `npm run dev` をClaude Codeから実行しようとした

```
npm run dev は Claude Code からは実行できません。
起動したままになるので、このセッションが返ってこなくなります。
```

**対処方法**

ターミナルBで開発サーバーの状態を確認します。

- 起動している場合: ブラウザ（`http://localhost:5173/`）を `F5` で再読み込みする
- 停止している場合: ターミナルBで `npm run dev` を再実行する

開発サーバーはターミナルBで管理し、画面の表示と操作結果は参加者が確認します。

### 7. Pull Requestへコメントを投稿しようとした

```
Pull Request や Issue への投稿は、Claude Code からは行いません。
```

**対処方法**

Claude Codeには下書きの作成だけを依頼し、投稿は参加者が行います。

```text
投稿はしないでください。下書きだけ出してください。
私が GitHub の画面から自分で投稿します。
```

投稿は GitHub の画面（Files changed → 行の `+` → Review changes）から行います。

### そのほか

| 拒否された操作                    | 理由                                           | 対処方法                                                         |
| --------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| `git commit --no-verify`          | チェックを省略しても、CIで同じ検証が実行される | 失敗した原因を修正してからコミットする                           |
| `git push --force`                | リモートの履歴を書き換える                     | 講師に相談する                                                   |
| `git push origin main`            | `main` への直接 push は禁止                    | `git push -u origin feature/<ゲームID>` して Pull Request を作る |
| `npx vitest`（監視モード）        | 処理が終了しない                               | `npm test`（`vitest run`）を使う                                 |
| `npm run dev` / `npm run preview` | 処理が終了せず、5173番ポートが競合する         | ターミナルBで起動する                                            |
| `gh pr review` / `gh pr comment`  | Pull Request へ投稿する操作である              | 参加者が GitHub の画面から投稿する                               |
| `gh api`                          | 操作内容を事前に判定できない                   | 実行したい操作を説明し、必要に応じて講師に相談する               |
| `gh issue edit`                   | Issue 本文は講師が管理している                 | 参加者が GitHub の画面でチェックボックスを操作する               |
| `npm run scaffold -- --all`       | 9名分の雛形を上書きする                        | `npm run scaffold -- --game <自分のゲームID>` を使う             |
| `.claude/settings.json` の変更    | ハーネス自体の無効化                           | 操作が拒否された理由を講師に伝える                               |

`docs/troubleshooting.md` には、エラーメッセージから参照できる番号付きの対処方法（T-01〜）があります。原因を特定できない場合は、現在の状況とエラーを整理し、次に確認する項目を1つ挙げるよう依頼してください。その際は、コードを変更しないよう明記します。
