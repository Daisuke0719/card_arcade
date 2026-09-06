# 止められたときに読むページ

作業中に「それはできません」と止められることがあります。
このページでは、操作が拒否される理由と、その後の対処を説明します。

## 間違いは人の注意力ではなく仕組みで止める

3時間で9人が同じリポジトリを同時に触ります。
特に影響が大きいのは、1人の誤操作によって全員の作業が止まることです。

- 誰かが `src/core/` を1行変える → 9人全員のテストが失敗する
- 誰かが `npm install` する → `package-lock.json` が変わり、9つの Pull Request が全部競合する
- 誰かが `main` で作業する → その変更を誰も分離できなくなる

この研修では、注意だけに頼らず、誤操作を仕組みで防ぎます。
操作を早い段階で止めることで、修正の範囲と所要時間を抑えられます。

| どこで止まるか | 直すのにかかる時間 |
|---|---|
| 書く前（フック） | 数秒 |
| コミット前（pre-commit） | 数十秒 |
| Pull Request（CI） | 数分 + 講師がマージするまでの待ち時間 |
| マージ後 | 9人全員が巻き込まれる |

## 5層のハーネス

| 層 | 何が止めるか | いつ止めるか | 外せるか |
|---|---|---|---|
| **1. 予防** | `npm run scaffold`（`scripts/scaffold-game.mjs`）と `templates/game/` | 書き始める前。構造を間違えられない雛形を作る | そもそも止めない（間違いが起きない形にする） |
| **2. 伝える** | `CLAUDE.md` / `src/games/CLAUDE.md` / `src/core/CLAUDE.md` / SessionStart フック | Claude Codeの作業開始前に、前提と担当を毎回伝える | 強制力はない（文書による指示のみ） |
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

Claude Codeから実行すると拒否されるコマンドの一覧です。

| 止まるコマンド | なぜ止めるか |
|---|---|
| `npm install` / `npm i` / `yarn add` / `pnpm add` などの依存追加 | `package-lock.json` が変わると9人全員の Pull Request が競合する |
| `git commit --no-verify` | チェックを飛ばしても、CI で同じことが起きるだけ |
| `git push --force` / `git push -f` | 履歴を書き換えると他の人の作業が壊れる |
| `git push ... main` | `main` への直接 push。作業を分離できなくなる |
| **`npm run dev` / `npm run preview` / `npx vite`** | **起動したままになり、セッションが返ってこない。** さらにターミナルB の 5173 番とポートが衝突する |
| **`npm run test:watch` / `npm test -- --watch` / `npx vitest`（`run` なし）** | **監視モードは終わらない。** セッションが返ってこない |
| **`gh pr review` / `gh pr comment` / `gh issue comment`** | **他人の Pull Request と Issue に文字を投稿する操作。** 投稿してよいのは「自分が実機で確認したこと」だけなので、確認した本人が投稿する |
| **`gh api`**（作業ブランチのときだけ） | 上の判定をすべて回避できる操作。この操作を許可すると、他の制限が機能しなくなる |
| **`node scripts/setup-github.mjs` / `node scripts/build-issue-bodies.mjs`**（作業ブランチのときだけ） | **講師専用。** 9人分の Issue をまとめて作り直してしまう |
| **`npm run scaffold -- --all` / `--force`**（作業ブランチのときだけ） | **講師専用。** 9人分の雛形をまとめて上書きしてしまう |
| **`gh issue edit`**（作業ブランチのときだけ） | Issue 本文は全員が同じ条件で進むための基準なので、講師が管理する |
| リダイレクト（`>`）・`sed -i`・`cp`・`tee` で保護領域に書く | `deny` はコマンドの先頭しか見ないため、シェル経由の書き込みもここで拒否する |

**講師専用の4行に「作業ブランチのときだけ」と書いてあるのは、運営が `main` で共通基盤を整えるため**です。
参加者は必ず `feature/<ゲームID>` で作業するので、実質的にはいつでも止まります。

### 開発サーバーと監視モードだけ、扱いが違う理由

上の表の多くは「**他の人に波及するから**」止めています。
`npm run dev` と `npm run test:watch` は、各参加者が自分の端末で継続して動かすコマンドです。
それでも止めているのは、理由が2つあるからです。

1. **技術的な理由。** どちらも終わらないコマンドなので、Claude Code のセッションが返ってきません。
   さらに `npm run dev` は、ターミナルB ですでに使っている 5173 番ポートと衝突します。
2. **設計上の理由。** 開発サーバーは**遊ぶための道具**です。
   実機でのプレイは参加者が行うため、開発サーバーは参加者が操作するターミナルBで起動します。

拒否メッセージには、ターミナルB での起動手順がそのまま書いてあります。

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
投稿内容には実機で確認した結果を含めるため、Claude Codeには下書きの作成までを依頼し、投稿は確認を行った参加者が担当します。

投稿はGitHubの画面から行います。コマンドを使う場合は、ターミナルBで参加者が実行します。

## `owner.json` — 自分の担当を記録しておく仕組み

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

`guard-scope.mjs` は、書き込み先のゲームIDを **ブランチ名だけでなく `owner.json` とも突き合わせます。**
何かの拍子に他の人のブランチへ移っていても、そのフォルダを編集しようとするとこう止まります。

```text
src/games/daifugo/logic.ts は 担当2（大富豪） の担当です。

あなたの担当は babanuki です。
いま他の人のブランチにいるので、そのコードは変更できません。

自分の作業に戻るときは git switch feature/babanuki です。
```

ブランチ名だけで判定していると、この状態では「あなたは大富豪の担当だ」と見えてしまい、
**他人のコードを編集できてしまいます。** `owner.json` はそれを防ぎます。

なお、`owner.json` は `harness/config.json` の `alwaysWritable` に入っているので、
`.claude/.state/` の中への書き込みだけは保護領域の例外として許可されています。

## なぜ無害なコマンドは確認なしで通るのか

`.claude/settings.json` には3つの段階があります。

| 段階 | 何が起きるか | 入っているもの |
|---|---|---|
| **deny** | 実行されない。拒否メッセージが返る | 上の「`guard-bash.mjs` が止めるコマンド」 |
| **ask** | 参加者に確認を求める（Yes / No） | `git push` / `gh pr create` / `gh pr merge` / `gh pr ready` / `gh pr edit` / `gh issue create` / `git merge` / `git rebase` / `git reset --hard` |
| **allow** | 確認なしで実行される | `npm test` / `npm run verify` / `npm run build` / `npm run scaffold -- --game <ゲームID>` / `git switch` `add` `commit` `status` `diff` `pull` / `gh pr checkout` `view` `checks` `diff` / `node -v` / `gh auth status` |

**allowに含まれるコマンドは、確認なしで実行されます。** 影響の小さい操作で確認が繰り返されないようにするためです。

> ### 承認疲れを防ぐため
>
> 確認の回数が多すぎると、各確認の内容を読まずに承認する可能性が高まります。
>
> `npm test` のたびに確認が表示されると、確認内容を読まずに承認する習慣につながります。
> その状態では、`git push` など影響の大きい操作も同様に承認されるおそれがあります。
>
> そのため、確認を求める対象を、外部へ反映される操作や履歴を変更する操作に絞っています。
>
> - **他の人に見える**（`git push` / `gh pr create` / `gh pr ready`）
> - **履歴が変わる**（`git merge` / `git rebase` / `git reset --hard`）
> - **元に戻すのに手間がかかる**（`gh pr merge`）
>
> `npm test` や `git status` は外部の状態や履歴を変更しないため、確認なしで実行できます。

`ask` の6つ（`git push` / `gh pr create` / `gh pr merge` / `gh pr ready` / `gh pr edit` / `gh issue create`）は、
**もともとターミナルBから参加者が実行する決まり**になっています。
Claude Codeから実行しようとすると承認を求められますが、この6つはターミナルBで参加者が実行してください。

## 硬さの基準は「他の人に波及するか」

検査には、警告だけを表示するものと、操作を拒否するものがあります。すべての違反で操作を拒否すると修正に時間がかかり、すべてを警告だけにすると重要な違反を防げないためです。

> **違反がほかの参加者へ影響するかどうかで判断する。**

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
基準は変わりません。左の列の変更を1つ許可すると、他の8人のPull Requestが失敗します。
**個人の判断で通してよい範囲ではありません。**

右の列は自分のフォルダの中だけの話なので、機械では止めずに**警告として画面に出します**。
意図的にそうしている場合もあるため、直すかどうかは実装者が判断します。

（例外は `eqeqeq` と未使用変数の2つです。波及はしませんが、直すのが一瞬で、
放置すると型チェックとビルドの失敗に化けるので error にしてあります。）

### なぜ Layer 4 だけが外せないのか

`npm run verify` と CI が**まったく同じコマンド**を実行するからです。

```
範囲チェック → lint → 型チェック → テスト → ビルド
```

さらに、別のコマンドを使った回避も拒否します。

- ESLint の検査は `eslint-disable` で無効化できますが、**契約テストが `eslint-disable` の存在そのものを検査**します
- `@core/deck` のような深い import は、エイリアスが完全一致の正規表現なので**モジュール解決の時点で失敗**します
- `logic.ts` の `Math.random()` は ESLint と契約テストの**両方**が見ています
- Layer 3 を無効化する環境変数は、**Layer 4 には効きません**

つまり手元で何を消しても、Pull Request では必ず同じ結果が出ます。
**別の方法で回避しようとせず、決められた手順に戻ってください。**

### GitHub 側のラベル

Issue と Pull Request には、`node scripts/setup-github.mjs labels` が作ったラベルが付いています。

| ラベル | 意味 |
|---|---|
| `participant-1` 〜 `participant-9` | 担当者。1人につき1つ（担当1 = `participant-1` … 担当9 = `participant-9`） |
| `difficulty:easy` / `difficulty:normal` / `difficulty:hard` | 初級 / 中級 / 上級 |
| `game` | 参加者が担当するゲームの実装 |
| `stretch-goal` | 発展課題（必須ではない） |
| `blocked` | 詰まっている・講師の判断待ち |
| `bug` | 公開後に見つかった不具合 |
| `core-change` | 共通基盤の変更を含む（講師の確認が必要） |
| `harness:override` | **講師のみ**。付いている Pull Request では範囲チェックが警告に降格する |

担当ラベルは `harness/config.json` の `participant` と同じ名前です。
自分の Issue と Pull Request はラベルで絞り込めます。

```powershell
gh issue list --label participant-1
gh pr list --label participant-1
```

作業を続けられないときは、`blocked` ラベルを付けてください。
講師はこのラベルを確認し、対応が必要な参加者を把握します。

## 止められたときの読み方

フックのメッセージは、いつも同じ3つの部分でできています。

```
src/core/cards/index.ts は運営が管理している場所なので変更できません。   ← 1. 何が起きたか

編集してよいのは src/games/<自分のゲームID>/ の中だけです。              ← 2. なぜダメか

共通基盤への変更が必要かもしれません。次の形式で参加者に報告してください:   ← 3. 次にどうするか
  - やりたいこと:
  - 足りないと思うもの:
  - ゲーム側だけで実現する案（あれば）:
```

まず3番目の「次にどうするか」を確認してください。
書いてある通りにすれば進めます。同じ操作を言い方を変えて試す必要はありません。

操作が拒否されたあと、Claude Codeが別の方法を提案することがあります。その場合は、次のように伝えてください。

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

共通基盤は9人全員が利用するため、変更するとほかの参加者のPull Requestにも影響します。

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
ただし、**ターミナルBで `npm run dev` が動いている間は実行しないでください。**
Windowsでは `node_modules` が使用中になり、処理が失敗します。実行前に `Ctrl + C` で開発サーバーを停止します。

（`gh pr checkout` で他のブランチに移ったあとも `npm ci` は要りません。
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

複数のファイルを変更した場合も、`npm run scope` が対象をまとめた復元コマンドを1行で表示します。
表示されたコマンドをそのまま実行してください。

（1つの Pull Request で扱うゲームは1つだけです。2つ以上のゲームフォルダに変更があると、
ブランチ名と一致していても範囲チェックは失敗します。）

**他の人のブランチにいるときにこれが出た場合は、正常です。** `owner.json` が効いています。
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

研修では、手元での確認が不足したままPull Requestを作成し、CIが失敗するケースが多くあります。
Stop フックが**1回だけ**引き止めます。

**やること**

```powershell
npm run verify
```

範囲チェック・lint・型チェック・テスト・ビルドが順に走ります。
失敗したときは、**最初に失敗した項目から**修正してください。

このフックは、作業を繰り返し止めないよう、同じセッションでは1回だけ通知します。
ただし、CIでは同じ検証が実行されます。`verify` が成功したことを確認してから完了と判断してください。

### 6. `npm run dev` をClaude Codeから実行しようとした

```
npm run dev は Claude Code からは実行できません。
起動したままになるので、このセッションが返ってこなくなります。
```

**やること** — ターミナルB を見てください。たいていは、そこですでに動いています。

- 動いている → ブラウザ（http://localhost:5173/）を **F5 で再読み込み**するだけです
- 止まっている → ターミナルBで `npm run dev` を再実行します

**Claude Code に「開発サーバーを起動して」と頼まないでください。** 何度頼んでも拒否されます。
画面を見て「遊べるかどうか」を判断するのは参加者の役割です。

### 7. Pull Request にコメントを投稿させようとした

```
Pull Request や Issue への投稿は、Claude Code からは行いません。
```

**やること** — 下書きは Claude Code に作成を依頼し、投稿は参加者が行います。

```text
投稿はしないでください。下書きだけ出してください。
私が GitHub の画面から自分で投稿します。
```

投稿は GitHub の画面（Files changed → 行の `+` → Review changes）から行います。

### そのほか

| 止められたこと | 理由 | どうするか |
|---|---|---|
| `git commit --no-verify` | チェックを省略しても、CIで同じ検証が実行される | 失敗した原因を修正してからコミットする |
| `git push --force` | 履歴を書き換えると他の人の作業が壊れる | 講師に相談する |
| `git push origin main` | `main` への直接 push は禁止 | `git push -u origin feature/<ゲームID>` して Pull Request を作る |
| `npx vitest`（監視モード） | セッションが返ってこなくなる | `npm test`（= `vitest run`）を使う |
| `npm run dev` / `npm run preview` | セッションが返ってこない / 5173 番が衝突する | ターミナルB で自分で起動する |
| `gh pr review` / `gh pr comment` | 他人の画面に文字が出る操作 | GitHub の画面から自分で投稿する |
| `gh api` | 上の判定をすべて回避できる操作 | やりたいことを説明し、必要なら講師に相談する |
| `gh issue edit` | Issue 本文は講師が管理している | チェックボックスは GitHub の画面で自分でクリックする |
| `npm run scaffold -- --all` | 9人分の雛形を上書きしてしまう | `npm run scaffold -- --game <自分のゲームID>` を使う |
| `.claude/settings.json` の変更 | ハーネス自体の無効化 | 止められた理由を講師に伝える |

`docs/troubleshooting.md` には、エラーメッセージから引ける番号つきの対処集（T-01〜）があります。
詰まったときは、事実を集めて状況を整理し、次に試すことを1つだけ挙げてもらってください。
そのときコードは変更させないでください。
