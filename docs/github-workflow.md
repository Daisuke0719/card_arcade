# GitHub の進め方（Windows / PowerShell）

この文書では、リポジトリのクローンからマージまでの操作を実行順に説明します。
掲載しているコマンドは PowerShell で実行します。

この研修では、次の流れで GitHub を使用します。

```
Issue（何を作るか） → feature/<ゲームID> ブランチ → Draft Pull Request
  → CI（verify）が成功 → Ready → 講師が Squash マージ → Pages に公開
```

開発サーバー、テスト、提出前の検証には、`npm run dev`、`npm test`、`npm run verify` を使用します。GitHub の操作については、この文書に記載したコマンドを参照してください。

---

## 2つのターミナルを使い分ける

研修では、2つのターミナルを使い分けます。各コマンドには、実行するターミナルを明記しています。

|                      | ターミナルA（Claude Code）                 | ターミナルB（参加者が操作）                                 |
| -------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| 使用するもの         | Claude Code のセッション                   | PowerShell                                                  |
| 継続して実行するもの | —                                          | `npm run dev`（研修中は起動したままにする）                 |
| 操作                 | 調査、実装の依頼、差分の確認、文章の下書き | ブラウザでの動作確認、`npm test`、`git push`、`gh pr ready` |

### コマンドブロックの表記

| 印                   | 意味                                                                             |
| -------------------- | -------------------------------------------------------------------------------- |
| **A: Claude に依頼** | ターミナルAに日本語のプロンプトを入力します。コマンドは Claude Code が実行します |
| **B: 参加者が実行**  | 参加者がターミナルBで PowerShell のコマンドを実行します                          |
| **手動**             | Claude Code を起動する前に、参加者が準備します                                   |

A のブロックには、ターミナルAへ貼り付けるプロンプトを掲載しています。

### ターミナルBで操作する理由

ブラウザでの動作確認や、リモートリポジトリの状態を変更する操作は参加者が行います。そのため、Claude Code へ依頼する作業とターミナルBで行う作業を分けています。

- `npm run dev` と監視モードのテストは、ハーネスによりターミナルAからの実行を禁止しています
- `gh pr review`、`gh pr comment`、`gh issue comment` も、ターミナルAからは実行できません
- `git push`、`gh pr create`、`gh pr ready`、`gh pr merge` は実行前に承認を求められます。この研修では、参加者が内容を確認してターミナルBから実行します

ターミナルBでは、ブラウザの表示と GitHub の状態を参加者が確認します。詳しい理由は [docs/harness.md](harness.md) を参照してください。

---

## 1人で1つのゲームを担当する

参加者は9名で、1名が1つのゲームを担当します。調査、実装、テスト、Pull Request の提出までを各自で行います。

進捗と問題を共有するため、次の3つを使用します。

| 確認方法               | 用途                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| Issue のチェックリスト | 必須要件の進捗を共有する。完了した項目に GitHub 上でチェックを付ける |
| 中間チェックポイント   | 講師が `npm run status` で全員の Pull Request と CI の状態を確認する |
| 講師への相談           | 作業を続けられない場合に、現在の状況とエラーを整理して共有する       |

`npm run status` は参加者も実行できます。9人分の進行状況が一覧で表示されます。

**B: 参加者が実行**

```powershell
npm run status
```

Issue のチェックボックスは、参加者が GitHub の Issue 画面で更新します。Issue 本文は講師が管理するため、`gh issue edit` はハーネスによって拒否されます。

---

## 0. 環境を用意する（当日Step A）

この節の操作は、Claude Codeを起動する前に参加者が行います。

### 0-1. 必要なものが入っているか確認する（**手動**）

```powershell
node -v
git --version
gh --version
```

`node -v` が `v22.` で始まらない場合は、`docs/troubleshooting.md` の **T-01** を参照してください。
`gh` が見つからない場合は、[GitHub CLI公式サイト](https://cli.github.com/) からインストールします。

### 0-2. GitHub にログインする（**手動**）

```powershell
gh auth login
```

画面の質問には、次の項目を選択します。

| 質問                                           | 選ぶもの                   |
| ---------------------------------------------- | -------------------------- |
| What account do you want to log into?          | `GitHub.com`               |
| What is your preferred protocol?               | `HTTPS`                    |
| Authenticate Git with your GitHub credentials? | `Yes`                      |
| How would you like to authenticate?            | `Login with a web browser` |

ブラウザが開いたら、表示された8桁のコードを貼り付けて承認します。
ログイン後、状態を確認します。

```powershell
gh auth status
```

`Token scopes:` に `repo` が含まれていることを確認してください。
含まれていない場合は **T-24** です。

### 0-3. リポジトリをクローンする（**手動**）

**パスに日本語・スペース・OneDrive を含めないでください**（**T-05**）。

```powershell
mkdir -Force $HOME/dev
cd $HOME/dev
git clone https://github.com/Daisuke0719/card_arcade.git
cd card_arcade
```

### 0-4. 依存をインストールする（**手動**）

**`npm install` ではなく `npm ci` を使ってください。**
`npm install` は `package-lock.json` を書き換えることがあり、その場合は CI が失敗します（**T-22**）。

```powershell
npm ci
```

`npm ci` の最後に `prepare` が実行され、コミット前チェック（`.githooks/pre-commit`）が有効になります。

`npm ci` を実行するのは、この手順だけです。
依存関係の追加は禁止されているため、作業ブランチごとに `package-lock.json` を変更することはありません。ほかのブランチへ切り替えた場合も、依存関係の再インストールは不要です。

### 0-5. 環境チェックとターミナルBの起動（**手動**）

```powershell
npm run doctor
```

すべての項目が `✓` になれば準備完了です。`✗` が表示された場合は、その行の `→` に書かれた指示に従ってください。解決しない場合は、出力を省略せずに講師へ共有します。

ここで、研修中に使用するターミナルBを用意します。

1. PowerShell を**もう1つ**開く（これを「ターミナルB」と呼びます）
2. リポジトリのフォルダへ移動する
3. 開発サーバーを起動する

```powershell
cd $HOME/dev/card_arcade
npm run dev
```

ブラウザで `http://localhost:5173/` を開き、アーケードの一覧画面が表示されることを確認します。ターミナルBは研修終了まで閉じず、開発サーバーも停止しません。

コードを変更した場合は、ブラウザを `F5` キーで再読み込みします。開発サーバーの再起動は不要です。

> `npm run dev` は、ターミナルAから実行できません。
> 処理が終了せず、ターミナルBが使用している5173番ポートとも競合するため、ハーネスが実行を拒否します。
> 代替コマンドは使用せず、ターミナルBで実行してください。

### 0-6. 担当の Issue を開く（**手動**）

担当ごとに1件の Issue が用意されています。当日の実装は、Issue に記載された要件に沿って進めます。

```powershell
gh issue list
gh issue view <自分のIssue番号>
```

Issue には「必須要件」「必須テスト」「やらないこと」がチェックリストで書かれています。
講師は、このチェックリストを使って進捗を確認します。完了した項目には、GitHub の Issue 画面でチェックを付けてください。

チェックを付ける操作は参加者が行います。`gh issue edit` はハーネスによって拒否されます。

Issue・ラベル（`participant-1` 〜 `participant-9`）・雛形・画面の担当表示は、
すべて `harness/config.json` から作られています。
当日その中身を GitHub のアカウント名へ差し替えるのは講師の作業なので、参加者による変更は不要です。

---

## 1. 作業ブランチを作る

実装を始める前に、`main` から担当ゲームのブランチを作成します。ブランチ名から担当ゲームを判定するため、指定された名前を使用してください。

**B: 参加者が実行**

```powershell
git switch main
git pull
git switch -c feature/<自分のゲームID>
```

| 担当  | ゲームID         | ゲーム       | 難易度 | Issue | ブランチ                 |
| ----- | ---------------- | ------------ | ------ | ----- | ------------------------ |
| 担当1 | `babanuki`       | ババ抜き     | 初級   | #1    | `feature/babanuki`       |
| 担当2 | `daifugo`        | 大富豪       | 上級   | #6    | `feature/daifugo`        |
| 担当3 | `shinkeisuijaku` | 神経衰弱     | 初級   | #2    | `feature/shinkeisuijaku` |
| 担当4 | `poker`          | ポーカー     | 上級   | #8    | `feature/poker`          |
| 担当5 | `butanoshippo`   | ぶたのしっぽ | 初級   | #9    | `feature/butanoshippo`   |
| 担当6 | `speed`          | スピード     | 中級   | #3    | `feature/speed`          |
| 担当7 | `shichinarabe`   | 七並べ       | 中級   | #4    | `feature/shichinarabe`   |
| 担当8 | `doubt`          | ダウト       | 中級   | #5    | `feature/doubt`          |
| 担当9 | `pageone`        | ページワン   | 中級   | #10   | `feature/pageone`        |

続けて、担当ゲームの雛形を生成します。

**A: Claude に依頼**

```text
npm run scaffold -- --game <自分のゲームID> を実行してください。
作られたファイルの一覧と、それぞれの役割を1行ずつで教えてください。

`--all` と `--force` は付けないでください。9人分のファイルが上書きされます。
```

このコマンドを実行すると、`.claude/.state/owner.json` に担当ゲーム ID が記録されます。別のブランチへ切り替えた場合も、この記録をもとに担当範囲が検査されます。

現在のブランチは、次のコマンドで確認できます。

**B: 参加者が実行**

```powershell
git branch --show-current
```

ブランチを作成すると、Claude Code のセッション開始時に「担当: 担当1 / ババ抜き（ゲームID: babanuki）」と表示されます。
先にブランチを作ることで、担当外のファイルを誤って変更する可能性を減らせます。

---

## 2. 作業単位ごとにコミットする

異なる目的の変更を1つのコミットにまとめず、機能やテストなどの作業単位で分けます。変更を分けておくと、必要なコミットだけを取り消しやすくなります。

**A: Claude に依頼**

```text
今の変更を確認して、コミットしてください。

git add は src/games/<自分のゲームID> だけを対象にしてください（git add . は使わないでください）。
コミットメッセージは feat: / test: / fix: / docs: のどれかで始めて、
「何ができるようになったか」が分かる日本語にしてください。

push はしないでください。参加者がターミナルBで実行します。
```

ターミナルBで実行するコマンドは次のとおりです。

**B: 参加者が実行**

```powershell
git status
git add src/games/<自分のゲームID>
git commit -m "feat: 手札配布とペア捨てを実装"
```

`git add .` ではなく、`git add src/games/<自分のゲームID>` で対象を限定してください。
`git add .` は一時ファイルやエディタの設定を含めてしまい、範囲チェックが失敗する原因になります（**T-09**）。

コミットしようとすると `.githooks/pre-commit` が範囲チェックを実行します。
担当フォルダの外が含まれているとコミットは中止されます（**T-10**）。

### コミットメッセージの型

コミットメッセージの先頭には、次のいずれかの接頭辞を付けます。

| 接頭辞  | 使うとき            | 例                                                   |
| ------- | ------------------- | ---------------------------------------------------- |
| `feat:` | 機能の追加          | `feat: ジョーカーを含む53枚の配布を実装`             |
| `test:` | テストの追加・修正  | `test: 最後の1枚を引いたときのテストを追加`          |
| `fix:`  | 不具合の修正        | `fix: 手札が0枚のときに上がり判定されない問題を修正` |
| `docs:` | README や説明の変更 | `docs: 採用したローカルルールを README に追記`       |

接頭辞の後ろは日本語で構いません。変更後に何ができるようになったかが分かる内容にします。

コミットする単位の例を次に示します。

- テストが1つ成功した
- `logic.ts` の1機能が動いた
- 画面が表示できた
- `npm run verify` が成功した

コミットの履歴から、各段階の作業内容を確認できます。
講師に状況を説明するときは、`git log --oneline -5` の出力を共有すると変更履歴を確認できます。

---

## 3. push して Draft Pull Request を作成する

### 3-1. `verify` を実行する

**A: Claude に依頼**

```text
npm run verify を実行してください。失敗したら、最初のエラーだけを引用して、原因の候補を教えてください。

成功したら、gh issue view <自分のIssue番号> を実行し、必須要件と、それを実現している実装・テストの
対応表を作ってください。満たせていない要件は、直そうとせず「未達」と書いてください。
```

検証だけを依頼する場合は、次のプロンプトを入力します。

```text
npm run verify を実行して、結果をそのまま貼ってください。
失敗した場合は、最初に失敗した項目から修正してください。テストの期待値は緩めないでください。
```

同じ検証は、ターミナルBでも実行できます。

**B: 参加者が実行**

```powershell
npm run verify
```

`✓ npm run verify がすべて通りました。` と表示されることを確認してから、Pull Request を作成します。検証内容は CI と同じで、範囲チェック、lint、型チェック、テスト、ビルドを順に実行します。

参加者もコマンドの実行結果を確認してください。

### 3-2. Pull Request の本文を用意する

**A: Claude に依頼**

```text
.github/PULL_REQUEST_TEMPLATE.md の形式に沿って、Pull Request の本文を .pr-body.md に書いてください。

- git diff origin/main...HEAD を読んで、実際の変更内容にもとづいて書いてください。
- 「採用したルール」と「今回は実装しないルール」を入れてください。
- 「自分でも不安なところ」は空欄のまま残してください。私が自分で書きます。

gh pr create も git push も実行しないでください。
```

`.pr-body.md` は `.gitignore` の対象であり、コミットには含まれません。また、`harness/config.json` の `alwaysWritable` に設定されているため、担当フォルダの外にあってもClaude Codeから変更できます。

「自分でも不安なところ」は、参加者が動作確認の結果をもとに記入します。上のプロンプトでは、この欄を空欄のまま作成します。

**B: 参加者が実行**

```powershell
notepad .pr-body.md
```

確認してほしい処理や条件を具体的に記載すると、講師が確認する箇所を特定できます。

|        | 「自分でも不安なところ」の例                                                     |
| ------ | -------------------------------------------------------------------------------- |
| 具体的 | 「同じ数字が続いたときの引き分け処理に不安があるので、重点的に確認してください」 |
| 曖昧   | 「勝敗判定を見てください」「全体的にお願いします」                               |
| 未記入 | テンプレートのコメントが残っている、または空欄のまま                             |

講師はマージ前にこの欄を読みます。テンプレートのままにせず、確認してほしい内容を記入してください。

「動作確認」チェックリストは、実際に確認した項目だけにチェックを入れてください。

### 3-3. push して Draft Pull Request を作成する

**B: 参加者が実行**

```powershell
git push -u origin HEAD
gh pr create --draft --title "<ゲーム名>を実装" --body-file .pr-body.md
```

`--draft` を付けると、提出前の状態で Pull Request を作成できます。Draft 状態でも CI（`verify`）は実行されます。

> この2つをターミナルAから実行すると、承認を求める画面が表示されます。この研修では、参加者がターミナルBで実行します。
> `git push` すると、コードはほかの参加者からも確認できる状態になります。

作成した Pull Request の番号と URL は、次のコマンドで確認できます。

**B: 参加者が実行**

```powershell
gh pr view
```

以降は、同じブランチを `git push` すると既存の Pull Request が更新されます。Pull Request を作り直す必要はありません。

**B: 参加者が実行**

```powershell
git push
```

コミットまではターミナルAで依頼できます。push は参加者がターミナルBで実行します。

---

## 4. スクリーンショットを添付する

画像ファイルはリポジトリにコミットせず、GitHub の Pull Request へ直接添付します。
画像を追加すると範囲チェックが失敗し、差分の容量も増えます。

すべてターミナルBで行い、参加者がブラウザの表示と操作結果を確認します。

1. ターミナルBで起動した開発サーバーをブラウザで開き、担当ゲームを表示する。コードを変更した場合は `F5` キーで再読み込みする
2. `Win + Shift + S` で範囲を選び、スクリーンショットを撮る。画像はクリップボードに保存される
3. Pull Request のページを開く

   ```powershell
   gh pr view --web
   ```

4. 本文の編集画面（Edit）を開き、テキストエリアに `Ctrl + V` で貼り付けるか、画像ファイルをドラッグ＆ドロップする
5. `![image](https://github.com/user-attachments/...)` という行が自動で挿入されます

画像は GitHub の添付ファイルとして保存されるため、リポジトリの差分には含まれません。

完成画面のスクリーンショットを添付すると、確認者が表示内容を把握しやすくなります。

---

## 5. CI の成功後に Draft 状態を解除する

CI の状態を確認します。

**A: Claude に依頼**

```text
gh pr checks で CI の状態を確認し、失敗しているジョブがあれば、
そのログのうち最初のエラーだけを引用してください。まだ直さないでください。
```

**B: 参加者が実行**

```powershell
gh pr checks
```

`verify` が `pass` になるまで待ちます。ブラウザで確認する場合は、次のコマンドを実行します。

```powershell
gh pr view --web
```

失敗している場合は、手元で `npm run verify` を実行してください。CIと同じ検証が行われます。
`npm run verify` が成功するのにCIだけ失敗する場合は、T-21を参照してください。

CI の成功後に Draft 状態を解除します。この操作により、Pull Request が Ready for review になります。

**B: 参加者が実行**

```powershell
gh pr ready
```

> `gh pr ready` は、参加者がターミナルBで実行してください。
> ターミナルAから実行すると承認画面が表示されます。
> ブラウザでの動作確認または `verify` が終わっていない場合は、Draft 状態を維持してください。

Ready for review にすると、参考用の `pr-meta (advisory)` も実行されます。このチェックは必須ではなく、失敗してもマージできます。結果には Pull Request 本文の確認事項が表示されます。

Ready for reviewにしたら、講師にPR番号を伝えてください。

---

## 6. マージを待つ

**マージは講師が行います。参加者はマージしません。**
`main` へマージするには、`verify` が成功し、Draft 状態が解除されている必要があります。

講師は次のコマンドで Squash マージします。`Create a merge commit` は使用しません。1件の Pull Request が `main` 上の1コミットになるため、ゲームごとのマージ履歴を確認できます。

```powershell
gh pr merge <PR番号> --squash --delete-branch
```

マージ後は、次の処理が自動で行われます。

- 本文に `Closes #<Issue番号>` があればIssueが閉じる
- `Deploy to GitHub Pages` が実行され、数分後に担当ゲームが公開ページへ反映される

デプロイの状態は次のコマンドで確認できます。

**B: 参加者が実行**

```powershell
gh run list --workflow "Deploy to GitHub Pages"
```

公開 URL は GitHub の `Settings > Pages` に表示されます。404 エラーの場合は **T-26** を参照してください。
マージできないときは **T-27** です。

---

## 7. `main`を更新して作業ブランチへ戻る

マージ後、次の作業に移る前に `main` を最新にします。

**B: 参加者が実行**

```powershell
git switch main
git pull
```

作業を続ける場合は、担当ゲームのブランチに戻ります。

```powershell
git switch feature/<自分のゲームID>
```

ゲームは `import.meta.glob` で自動収集されるため、参加者全員が変更する登録ファイルはありません。そのため、`main` の更新後も、担当ゲームのブランチとは通常競合しません。
それでも取り込みたい場合は次を実行します。

```powershell
git fetch origin
git merge origin/main
```

`git merge` をターミナルAから実行すると、履歴を変更する操作として承認を求められます。

---

## 操作を取り消す方法

誤ったファイルやブランチを変更した場合の対処方法を説明します。現在の状態を確認する前に、`git reset --hard` を実行しないでください。

この節のコマンドは、すべてターミナルBで実行します。どの変更を取り消すか判断できない場合は、操作を始める前にターミナルAへ次のプロンプトを入力してください。

**A: Claude に依頼**

```text
いまの状況を10行以内でまとめてください。含めるのは次の5点です。

- いま何をしているか
- 直前に終わったこと
- まだ終わっていないこと
- 次に行うこと
- 気をつけること

先に git branch --show-current / git status --short / npm run scope を実行し、
その結果にもとづいて書いてください。推測で書かないでください。コードは変更しないでください。
```

作成された内容が、現在の状態と合っているか確認してください。判断できない場合は取り消し操作を行わず、講師に相談します。

**B: 参加者が実行**

```powershell
git branch --show-current
git status
git log --oneline -5
```

### 早見表

| 状況                                              | 対処方法                                              | 詳しい手順 |
| ------------------------------------------------- | ----------------------------------------------------- | ---------- |
| 担当外のファイルを変更した                        | `npm run scope` の出力に示された `git restore` を実行 | A          |
| 間違ったブランチで作業した（未コミット）          | `git stash` → `git switch` → `git stash pop`          | B          |
| 間違ったブランチでコミットしてしまった            | 正しいブランチへ `cherry-pick` して、元を戻す         | C          |
| コミットメッセージを間違えた（直前のみ・未 push） | `git commit --amend -m "..."`                         | D          |
| push した後に間違いに気づいた                     | 履歴は書き換えず、直しを新しいコミットで push         | E          |
| `main` で作業してしまった                         | `git stash` → `git switch -c` → `git stash pop`       | F          |
| コンフリクトした                                  | 競合を直して `git add` → `git commit`                 | G          |
| 直前のコミットを取り消したい（未 push）           | `git reset --soft HEAD~1`（変更は手元に残る）         | H          |
| ファイルを消してしまった（未コミット）            | `git restore <パス>`                                  | I          |

この表のA〜Iは後続の見出しを示しており、ターミナルA・Bの表記とは関係ありません。

---

### A. 担当外のファイルを変更した

範囲外のファイルを確認します。

**B: 参加者が実行**

```powershell
npm run scope
```

出力の最後に、変更を復元するコマンドが表示されます。

```
元に戻すには、次のコマンドをそのまま実行してください:

  git restore --source=HEAD --staged --worktree -- src/core/deck.ts
```

これを貼り付けて実行し、もう一度 `npm run scope` が成功することを確認します。

```powershell
git restore --source=HEAD --staged --worktree -- src/core/deck.ts
npm run scope
```

共通基盤（`src/core/`、`src/components/` など）の変更が必要な場合は、講師に相談してください。

### B. 間違ったブランチで作業した（未コミット）

変更を一時的に退避し、正しいブランチへ切り替えてから復元します。

**B: 参加者が実行**

```powershell
git stash
git switch feature/<自分のゲームID>
git stash pop
```

退避した変更は `git stash list` で確認できます。`git stash pop` を実行すると、変更を復元してstashの一覧から削除します。

### C. 間違ったブランチでコミットしてしまった

例として、作業ブランチではなく `main` にコミットした場合を説明します。

**B: 参加者が実行**

```powershell
git log --oneline -3
```

移したいコミットの SHA（例 `a1b2c3d`）を控えます。

```powershell
git switch feature/<自分のゲームID>
git cherry-pick a1b2c3d
git log --oneline -2
```

正しいブランチにコミットが追加されたことを確認してから、誤ってコミットしたブランチを元の状態へ戻します。

```powershell
git switch main
git status
git reset --hard origin/main
```

`git reset --hard` を実行すると、コミットされていない変更が失われます。`git status` に変更が表示されていないことを確認してから実行してください。判断できない場合は講師に相談します。ターミナルAから実行すると、承認を求める画面が表示されます。

### D. コミットメッセージを間違えた（直前のコミットのみ）

**まだ push していない場合だけ**使えます。

**B: 参加者が実行**

```powershell
git commit --amend -m "feat: ペア捨てを実装"
```

直前のコミットにファイルを追加する場合も、`--amend` を使用できます。

```powershell
git add src/games/<自分のゲームID>/logic.test.ts
git commit --amend --no-edit
```

push済みのコミットには `--amend` を使わないでください。リモートとローカルの履歴が異なるため、禁止しているforce pushが必要になります。

### E. push した後に間違いに気づいた

push後は履歴を書き換えず、修正を新しいコミットとして追加します。`git push --force` はハーネスによって拒否されます。

**A: Claude に依頼**

```text
<何が間違っていたか> を直してください。
修正後に `npm run verify` を実行し、成功したらコミットしてください。

git push はしないでください。参加者がターミナルBで実行します。
履歴の書き換え（amend / rebase / force push）は行わないでください。
```

**B: 参加者が実行**

```powershell
git push
```

特定のコミットによる変更を取り消す場合は、打ち消しコミットを作成します。

```powershell
git log --oneline -3
git revert a1b2c3d
git push
```

### F. `main` で作業してしまった

まだコミットしていない場合は、変更を退避してから作業ブランチを作成します。

**B: 参加者が実行**

```powershell
git stash
git switch -c feature/<自分のゲームID>
git stash pop
npm run scope
```

コミット済みの場合は、**C** の手順を使用します。

### G. コンフリクトした

このリポジトリでは、参加者全員が変更する登録ファイルを設けていません。競合が発生した場合は、まず対象のファイルを確認します。

**B: 参加者が実行**

```powershell
git status
```

`both modified:` と表示されたファイルが競合しています。

競合が `src/games/<自分のゲームID>/` の中だけで発生している場合は、ファイルを開き、`<<<<<<<`、`=======`、`>>>>>>>` の行を削除して内容を修正します。

**A: Claude に依頼**（自分のゲームフォルダの中だけのとき）

```text
src/games/<自分のゲームID>/ の中の競合マーカーを解消してください。
どちらの側を採用したかを、ファイルごとに1行で説明してください。

自分のゲームフォルダの外は変更しないでください。
```

**B: 参加者が実行**

```powershell
git add src/games/<自分のゲームID>
git commit
npm run verify
```

`package.json`、`package-lock.json`、共通基盤で競合した場合は、該当ファイルに対する担当ブランチ側の変更を取り消し、`main` の内容へ合わせます。

```powershell
git restore --source=origin/main -- package.json package-lock.json
git add package.json package-lock.json
```

ここで `npm ci` を実行する場合は、先にターミナルBの開発サーバーを `Ctrl + C` で停止してください。
`dev` が動いたままだと `node_modules` が使用中になり、Windows では失敗します。
`npm ci` が終わったら、`npm run dev` を再実行します。

マージを中止する場合は、次のコマンドを実行します。

```powershell
git merge --abort
```

### H. 直前のコミットを取り消したい（未 push）

コミットだけを取り消し、**変更内容は手元に残します**。

**B: 参加者が実行**

```powershell
git reset --soft HEAD~1
git status
```

`--soft` を指定すると変更内容が残ります。`--hard` を指定すると変更内容も失われるため、使用しないでください。

### I. ファイルを消してしまった

まだコミットしていなければ、直前のコミットの状態に戻せます。

**B: 参加者が実行**

```powershell
git restore src/games/<自分のゲームID>/logic.ts
```

フォルダ全体を戻す場合は、次のコマンドを実行します。

```powershell
git restore src/games/<自分のゲームID>
```

---

## コマンド早見表

「実行する場所」の列を確認してください。
**B** は参加者がターミナルBで実行する操作、**A/B** はどちらでもよい操作、**A不可** はターミナルAでは実行できない操作です。

### 毎日使う

| 操作                         | コマンド                                | 実行する場所                          |
| ---------------------------- | --------------------------------------- | ------------------------------------- |
| 現在のブランチを確認する     | `git branch --show-current`             | A/B                                   |
| 変更されたファイルを確認する | `git status`                            | A/B                                   |
| 差分を確認する               | `git diff`                              | A/B                                   |
| 担当範囲を確認する           | `npm run scope`                         | A/B                                   |
| 提出前の一括検証             | `npm run verify`                        | A/B（結果は参加者が確認する）         |
| **開発サーバー**             | `npm run dev`                           | **B のみ（A 不可）**                  |
| テスト                       | `npm test`                              | A/B                                   |
| **テストの監視モード**       | `npm run test:watch`                    | **B のみ（A 不可）**                  |
| 環境チェック                 | `npm run doctor`                        | A/B                                   |
| 9名の進捗を確認する          | `npm run status`                        | A/B                                   |
| 担当フォルダの雛形を作る     | `npm run scaffold -- --game <ゲームID>` | A/B（`--all` と `--force` は A 不可） |

### ブランチとコミット

| 操作                              | コマンド                                     | 実行する場所          |
| --------------------------------- | -------------------------------------------- | --------------------- |
| 作業ブランチを作る                | `git switch -c feature/<ゲームID>`           | A/B                   |
| ブランチを移動する                | `git switch feature/<ゲームID>`              | A/B                   |
| 1つ前のブランチに戻る             | `git switch -`                               | A/B                   |
| 変更をステージする                | `git add src/games/<ゲームID>`               | A/B                   |
| コミットする                      | `git commit -m "feat: ..."`                  | A/B                   |
| 直前のメッセージを直す（未 push） | `git commit --amend -m "..."`                | B                     |
| 履歴を確認する                    | `git log --oneline -5`                       | A/B                   |
| 変更を捨てる                      | `git restore <パス>`                         | B                     |
| 一時的に預ける / 取り出す         | `git stash` / `git stash pop`                | B                     |
| 最新の main を取り込む            | `git fetch origin` → `git merge origin/main` | B（A は承認を求める） |
| **強制 push**                     | `git push --force`                           | **禁止（A 不可）**    |
| **チェックを飛ばすコミット**      | `git commit --no-verify`                     | **禁止（A 不可）**    |

### GitHub（gh）

| 操作                             | コマンド                                                     | 実行する場所                                     |
| -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| ログイン状態を確認する           | `gh auth status`                                             | A/B                                              |
| Issue の一覧を確認する           | `gh issue list`                                              | A/B                                              |
| 担当の Issue を確認する          | `gh issue view <Issue番号>`                                  | A/B                                              |
| **Issue の本文を書き換える**     | `gh issue edit`                                              | **講師のみ（A 不可）**。チェックは画面でクリック |
| **初回の push**                  | `git push -u origin HEAD`                                    | **B**（A は承認を求める）                        |
| **2回目以降の push**             | `git push`                                                   | **B**（A は承認を求める）                        |
| **Draft の Pull Request を作る** | `gh pr create --draft --title "..." --body-file .pr-body.md` | **B**（A は承認を求める）                        |
| Pull Request を確認する          | `gh pr view`                                                 | A/B                                              |
| ブラウザで開く                   | `gh pr view --web`                                           | A/B                                              |
| CI の状態を確認する              | `gh pr checks`                                               | A/B                                              |
| **Draft を外す**                 | `gh pr ready`                                                | **B**（A は承認を求める）                        |
| **本文を差し替える**             | `gh pr edit <PR番号> --body-file .pr-body.md`                | **B**（A は承認を求める）                        |
| 一覧を確認する                   | `gh pr list`                                                 | A/B                                              |
| 差分を確認する                   | `gh pr diff <PR番号>`                                        | A/B                                              |
| コメントを読む                   | `gh pr view <PR番号> --comments`                             | A/B                                              |
| **承認する**                     | `gh pr review <PR番号> --approve --body "..."`               | **B のみ（A 不可）**                             |
| **変更を依頼する**               | `gh pr review <PR番号> --request-changes --body "..."`       | **B のみ（A 不可）**                             |
| **コメントを投稿する**           | `gh pr comment` / `gh issue comment`                         | **B のみ（A 不可）**。GitHub の画面が確実        |
| **マージする（Squash）**         | `gh pr merge <PR番号> --squash --delete-branch`              | **B**（A は承認を求める）                        |
| **API を直接実行する**           | `gh api`                                                     | **禁止（A不可）**                                |

**A不可**の操作は、ターミナルAから実行すると拒否メッセージが表示されます。条件は [docs/harness.md](harness.md) の「`guard-bash.mjs` が拒否するコマンド」を参照してください。

### Claude Code へ入力するプロンプト（すべて A）

場面に応じて、手順書のプロンプトを入力します。

| 場面               | 依頼内容                                                                         | 手順書の場所              |
| ------------------ | -------------------------------------------------------------------------------- | ------------------------- |
| 実装を始める前     | Issue とルール文書を読み、実装計画を作成する（コードは変更しない）               | Step C、C-3              |
| 実装               | まず最後まで遊べる状態まで実装する。担当フォルダの外は変更しない                 | Step C、C-4              |
| 遊んで直す         | プランモード（`/plan`）で原因と改善策を整理し、確認後に実行する                  | Step C、C-4              |
| 提出前             | `npm run verify` を実行し、必須要件との対応表を作成する                          | Step C、C-5              |
| Pull Request       | `.pr-body.md` に本文の作成を依頼する（pushも `gh pr create` も実行しない）       | Step C、C-5              |
| 状況の共有         | 現在の状況を10行以内にまとめるよう依頼する（推測を含めない）                     | Step C、C-4              |
| 問題が発生したとき | 事実を確認して `docs/troubleshooting.md` と照合し、次に試すことを1つ挙げてもらう | `docs/troubleshooting.md` |

作業を続けられない場合は、現在の状況とエラーを整理して講師に相談してください。原因を確認するためのプロンプトには、コードを変更しないよう明記します。

### 変更範囲を限定するプロンプト（Aで使用）

次の観点をプロンプトに含め、変更範囲を限定します。

| 観点             | 指示の例                                                             |
| ---------------- | -------------------------------------------------------------------- |
| 対象ファイル     | 「`logic.ts` と `logic.test.ts` だけ変更してください」               |
| 対象外の作業     | 「画面（`.tsx`）は変更しないでください」「実装は変えないでください」 |
| 作業を止める時点 | 「まだ直さないでください」「計画だけ作成して止まってください」       |
| 外部への操作     | 「投稿はしないでください」「push はしないでください」                |

作業範囲を小さく区切ると、各段階で差分を確認しやすくなります。

### 問題が発生したとき

| 状況                         | 確認方法                                        |
| ---------------------------- | ----------------------------------------------- |
| 環境を確認したい             | `npm run doctor`                                |
| 範囲チェックが失敗する       | `npm run scope` の出力（troubleshooting T-09）  |
| CI が失敗する                | 手元で `npm run verify`（troubleshooting T-21） |
| 「実行できません」と言われた | [docs/harness.md](harness.md)                   |
| その他のエラー               | `docs/troubleshooting.md`（T-01〜T-32）         |
| 当日の進め方が分からない     | `docs/handson-steps.md`                         |
| 担当と全体の進捗を確認したい | `npm run status`                                |
| 原因を特定できない           | 変更を中断して講師に相談する                    |
