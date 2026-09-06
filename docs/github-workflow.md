# GitHub の進め方（Windows / PowerShell）

この文書では、cloneからマージまでの操作を実行順に説明します。
掲載しているコマンドはPowerShellで実行します。

この研修で GitHub 上を流れるものは1つだけです。

```
Issue（何を作るか） → feature/<ゲームID> ブランチ → Draft Pull Request
  → CI（verify）が成功 → Ready → 講師が Squash マージ → Pages に公開
```

覚えるコマンドは3つだけです（`npm run dev` / `npm test` / `npm run verify`）。
GitHub 側の操作は、このページを見ながらコピペしてください。

---

## ターミナルは2本 — このページの読み方

今日はターミナルを2本開いて進めます。**各コマンドには、実行する場所を明記しています。**

| | ターミナルA（Claude Code） | ターミナルB（参加者が操作） |
|---|---|---|
| 中身 | Claude Code のセッション | ふつうの PowerShell |
| 常駐 | — | **`npm run dev`（研修中は起動したままにする）** |
| やること | 調査 / 実装の依頼 / 差分の確認 / 文章の下書き | **ブラウザでプレイする** / `npm test` の結果確認 / `git push` / `gh pr ready` |

### コマンドブロックに付いている印

| 印 | 意味 |
|---|---|
| **A: Claude に頼む** | ターミナルAにプロンプト（日本語）を入力します。コマンドはClaude Codeが実行します |
| **B: 参加者が実行** | ターミナルB で**参加者が PowerShell のコマンドを実行します**。Claude Code には依頼しません |
| **手動** | Claude Codeを起動する前に、参加者が準備します |

Aのブロックには、ターミナルAへ貼り付けて使えるプロンプトを掲載しています。

### なぜ B が残っているのか

プロンプトで進めると、ほとんどの作業は Claude Code に頼めます。**頼めてしまいます。**
そこで、Claude Code から実行しない操作をターミナルBに分けています。

- `npm run dev` と監視モードのテストは、**ターミナルA では実行できません**（ハーネスが拒否します）
- `gh pr review` / `gh pr comment` / `gh issue comment` も、**ターミナルA では実行できません**
- `git push` / `gh pr create` / `gh pr ready` / `gh pr merge` は実行できますが、**承認を求められます**。
  承認内容を自分で確認するため、**この4つは参加者がターミナルBから実行する決まり**にしています

**B では、参加者が実機や GitHub の状態を確認します。**
詳しい理由は [docs/harness.md](harness.md) にあります。

---

## この研修は「1人1ゲーム」です

参加者は9名。**チームは組みません。1人が1つのゲームを最初から最後まで担当します。**
各参加者が、調査、実装、テスト、Pull Requestの提出までを担当します。
役割を分担したり交代したりする時間もありません。

そのぶん、次の3つを意識してください。**1人だと「詰まっていること」に誰も気づけない**からです。

| 補うもの | どういうことか |
|---|---|
| **Issue のチェックリスト** | 実装状況を共有する主な項目です。1つ終わるたびにGitHub上でチェックを付けてください |
| **中間チェックポイント** | 講師が `npm run status` で全員の Pull Request と CI の状態をまとめて見ます。止まっている人には講師から声をかけます |
| **早めの相談** | 相談できる相手が講師しかいません。**手が止まったら状況を整理して見せる**と決めておいてください |

`npm run status` は参加者も実行できます。9人分の進行状況が一覧で表示されます。

**B: 参加者が実行**

```powershell
npm run status
```

**Issueのチェックボックスは、参加者がGitHubのIssue画面で更新してください。**
`gh issue edit` はハーネスが止めます（Issue 本文は全員が同じ条件で進むための基準なので、講師が管理しています）。

---

## 0. 環境を用意する（当日フェーズ1）

この節の操作は、Claude Codeを起動する前に参加者が行います。

### 0-1. 必要なものが入っているか確認する（**手動**）

```powershell
node -v
git --version
gh --version
```

`node -v` が `v22.` で始まらない場合は `docs/troubleshooting.md` の **T-01** を見てください。
`gh` が見つからない場合は https://cli.github.com/ から GitHub CLI を入れます。

### 0-2. GitHub にログインする（**手動**）

```powershell
gh auth login
```

対話で聞かれるので、次のように答えます。

| 質問 | 選ぶもの |
|---|---|
| What account do you want to log into? | `GitHub.com` |
| What is your preferred protocol? | `HTTPS` |
| Authenticate Git with your GitHub credentials? | `Yes` |
| How would you like to authenticate? | `Login with a web browser` |

ブラウザが開いたら、表示された8桁のコードを貼り付けて承認します。
終わったら確認します。

```powershell
gh auth status
```

`Token scopes:` に `repo` が含まれていることを確認してください。
含まれていない場合は **T-24** です。

### 0-3. リポジトリを clone する（**手動**）

**パスに日本語・スペース・OneDrive を含めないでください**（**T-05**）。

```powershell
mkdir -Force $HOME/dev
cd $HOME/dev
git clone https://github.com/Daisuke0719/card_arcade.git
cd card_arcade
```

### 0-4. 依存をインストールする（**手動**）

**`npm install` ではなく `npm ci` を使ってください。**
`npm install` は `package-lock.json` を書き換えることがあり、その場合はCIが失敗します（**T-22**）。

```powershell
npm ci
```

`npm ci` の最後に `prepare` が走り、コミット前チェック（`.githooks/pre-commit`）が自動で有効になります。

`npm ci` を実行するのは、この手順だけです。
依存の追加は禁止されているので、9人のブランチはすべて `package-lock.json` が同一です。
他のブランチへ移ったときも、入れ直す必要はありません。

### 0-5. 環境チェックと、ターミナルB の起動（**手動**）

```powershell
npm run doctor
```

すべて `✓` になれば準備完了です。`✗` が出たら、その行の `→` に書かれた指示に従ってください。
直らなければその出力をそのまま講師に見せます。

**ここでターミナルB を用意します。これが今日ずっと使う2本目です。**

1. PowerShell を**もう1つ**開く（これを「ターミナルB」と呼びます）
2. リポジトリのフォルダへ移動する
3. 開発サーバーを起動する

```powershell
cd $HOME/dev/card_arcade
npm run dev
```

ブラウザで http://localhost:5173/ を開き、アーケードの一覧画面が出れば準備完了です。
**このターミナルB は、研修が終わるまで閉じません。`Ctrl + C` も押しません。**

コードを変えても再起動は要りません。**ブラウザを F5 で再読み込みするだけ**で最新のコードになります。

> **`npm run dev` は、ターミナルA（Claude Code）では実行できません。**
> 起動したままになるとセッションが返らず、ターミナルB の 5173 番ポートとも衝突するためです。
> 頼んでも拒否メッセージが返ります。**別のコマンドで回避しないでください。**

### 0-6. 自分の Issue を開いておく（**手動**）

担当ごとに Issue が1つ立っています。**この Issue が当日の作業指示書です。**

```powershell
gh issue list
gh issue view <自分のIssue番号>
```

Issue には「必須要件」「必須テスト」「やらないこと」がチェックリストで書かれています。
1人で作業するため、講師はこのチェックリストを主な確認材料とします。
完了した項目から、GitHubのIssue画面でチェックを付けてください。

**チェックを付ける操作は参加者が行います。** `gh issue edit` はハーネスが止めます。

Issue・ラベル（`participant-1` 〜 `participant-9`）・雛形・画面の担当表示は、
すべて `harness/config.json` から作られています。
当日その中身を GitHub のアカウント名へ差し替えるのは講師の作業なので、参加者が触る必要はありません。

---

## 1. 作業ブランチを作る

**`main` のまま実装を始めてはいけません。** ブランチ名が「自分がどのゲームの担当か」を表します。

**B: 参加者が実行**

```powershell
git switch main
git pull
git switch -c feature/<自分のゲームID>
```

| 担当 | ゲームID | ゲーム | 難易度 | Issue | ブランチ |
|---|---|---|---|---|---|
| 担当1 | `babanuki` | ババ抜き | 初級 | #1 | `feature/babanuki` |
| 担当2 | `daifugo` | 大富豪 | 上級 | #6 | `feature/daifugo` |
| 担当3 | `shinkeisuijaku` | 神経衰弱 | 初級 | #2 | `feature/shinkeisuijaku` |
| 担当4 | `poker` | ポーカー | 上級 | #8 | `feature/poker` |
| 担当5 | `butanoshippo` | ぶたのしっぽ | 初級 | #9 | `feature/butanoshippo` |
| 担当6 | `speed` | スピード | 中級 | #3 | `feature/speed` |
| 担当7 | `shichinarabe` | 七並べ | 中級 | #4 | `feature/shichinarabe` |
| 担当8 | `doubt` | ダウト | 中級 | #5 | `feature/doubt` |
| 担当9 | `pageone` | ページワン | 中級 | #10 | `feature/pageone` |

続けて、自分の担当フォルダの雛形を作ります。

**A: Claude に頼む**

```text
npm run scaffold -- --game <自分のゲームID> を実行してください。
作られたファイルの一覧と、それぞれの役割を1行ずつで教えてください。

`--all` と `--force` は付けないでください。9人分のファイルが上書きされます。
```

このコマンドは `.claude/.state/owner.json` に**担当ゲームIDを記録します。**
あとで `gh pr checkout` で他のブランチへ移っても、
**この記録があるおかげで「自分の担当」を見失いません**（相手のコードを編集しようとすると止まります）。

今どこにいるかは、いつでもこれで確認できます。

**B: 参加者が実行**

```powershell
git branch --show-current
```

ブランチを作ると、Claude Code のセッション開始時に
「担当: 担当1 / ババ抜き（ゲームID: babanuki）」と自動で伝わります。
先にブランチを作ることで、担当外のファイルを誤って変更する可能性を減らせます。

---

## 2. こまめにコミットする

**まとまった作業を1つのコミットに詰め込まないでください。**
小さく刻んでおくと、後から「1つ前に戻す」が安全にできます。

**A: Claude に頼む**

```text
今の変更を確認して、コミットしてください。

git add は src/games/<自分のゲームID> だけを対象にしてください（git add . は使わないでください）。
コミットメッセージは feat: / test: / fix: / docs: のどれかで始めて、
「何ができるようになったか」が分かる日本語にしてください。

pushはしないでください。参加者がターミナルBで実行します。
```

ターミナルBで実行するコマンドは次のとおりです。

**B: 参加者が実行**

```powershell
git status
git add src/games/<自分のゲームID>
git commit -m "feat: 手札配布とペア捨てを実装"
```

`git add .` ではなく **`git add src/games/<自分のゲームID>`** と書く癖をつけてください。
`git add .` は一時ファイルやエディタの設定を含めてしまい、範囲チェックが失敗する原因になります（**T-09**）。

コミットしようとすると `.githooks/pre-commit` が範囲チェックを実行します。
担当フォルダの外が含まれているとコミットは中止されます（**T-10**）。

### コミットメッセージの型

先頭に種類を付けます。この4つだけ使えば十分です。

| 接頭辞 | 使うとき | 例 |
|---|---|---|
| `feat:` | 機能ができた | `feat: ジョーカーを含む53枚の配布を実装` |
| `test:` | テストを足した・直した | `test: 最後の1枚を引いたときのテストを追加` |
| `fix:` | バグを直した | `fix: 手札が0枚のときに上がり判定されない問題を修正` |
| `docs:` | README や説明を書いた | `docs: 採用したローカルルールを README に追記` |

日本語で構いません。**「何をしたか」ではなく「何ができるようになったか」**を書くと、あとから読み返しやすくなります。

コミットしたくなる良いタイミングは次のとおりです。

- テストが1つ成功した
- `logic.ts` の1機能が動いた
- 画面が表示できた
- `npm run verify` が成功した

コミットの履歴から、各段階の作業内容を確認できます。
講師に状況を説明するときは、`git log --oneline -5` の出力を共有すると変更履歴を確認できます。

---

## 3. push して Draft Pull Request を作る

### 3-1. 先に verify を通す

**A: Claude に頼む**

```text
npm run verify を実行してください。失敗したら、最初のエラーだけを引用して、原因の候補を教えてください。

成功したら、gh issue view <自分のIssue番号> を実行し、必須要件と、それを実現している実装・テストの
対応表を作ってください。満たせていない要件は、直そうとせず「未達」と書いてください。
```

検証コマンドだけを実行させたいときは、こう頼みます。

```text
npm run verify を実行して、結果をそのまま貼ってください。
失敗した場合は、最初に失敗した項目から修正してください。テストの期待値は緩めないでください。
```

同じ検証は、ターミナルBでも実行できます。

**B: 参加者が実行**

```powershell
npm run verify
```

`✓ npm run verify がすべて通りました。` が出るまで Pull Request を作らないでください。
CI とまったく同じ内容（範囲チェック → lint → 型 → テスト → ビルド）です。

報告だけで判断せず、参加者が検証結果を確認してください。

### 3-2. Pull Request の本文を用意する

**A: Claude に頼む**

```text
.github/PULL_REQUEST_TEMPLATE.md の形式に沿って、Pull Request の本文を .pr-body.md に書いてください。

- git diff origin/main...HEAD を読んで、実際の変更内容にもとづいて書いてください。
- 「採用したルール」と「今回は実装しないルール」を入れてください。
- 「自分でも不安なところ」は空欄のまま残してください。私が自分で書きます。

gh pr create も git push も実行しないでください。
```

`.pr-body.md` が作られます。`.pr-body.md` は `.gitignore` に入っているのでコミットされません。
（このファイルだけは Claude Code が書いてよい場所です。`harness/config.json` の `alwaysWritable`）

**「自分でも不安なところ」は参加者が記入してください。** 上のプロンプトでは、この欄を空欄のまま作成します。

**B: 参加者が実行**

```powershell
notepad .pr-body.md
```

ここが具体的だと、講師がマージの前に見る場所が決まります。

| | 「自分でも不安なところ」の例 |
|---|---|
| 良い | 「同じ数字が続いたときの引き分け処理が怪しいので、そこを重点的に見てください」 |
| 悪い | 「勝敗判定を見てください」「全体的にお願いします」 |
| 最悪 | テンプレートのコメントが消えていない / 空欄のまま |

**講師はマージの前にこの欄を読みます。** テンプレートのままだと、何を見ればよいか伝わりません。

「動作確認」チェックリストは、**自分が本当にやった項目にだけ**チェックを入れてください。

### 3-3. push して Draft で出す

**B: 参加者が実行**

```powershell
git push -u origin HEAD
gh pr create --draft --title "<ゲーム名>を実装" --body-file .pr-body.md
```

`--draft` を付けるのは、**まだ提出済みとして扱わせないため**です。
Draft のうちは CI（`verify`）だけが走ります。

> **この2つは、ターミナルA から打とうとすると承認を求められます。**
> 実行内容を確認してから承認するため、参加者がターミナルBで実行します。
> `git push` すると、コードはほかの参加者からも確認できる状態になります。

作った Pull Request の番号と URL は、次で確認できます。

**B: 参加者が実行**

```powershell
gh pr view
```

以降、`git push` するたびに同じ Pull Request が自動で更新されます。**2つ目を作る必要はありません。**

**B: 参加者が実行**

```powershell
git push
```

（コミットまではターミナルAで依頼できます。pushは参加者がターミナルBで実行します）

---

## 4. スクリーンショットを添付する

**画像ファイルをリポジトリにコミットしないでください。**
画像を追加すると範囲チェックが失敗し、差分の容量も増えます。

すべてターミナルBで行い、参加者がブラウザの表示と操作結果を確認します。

1. ターミナルB の開発サーバーのブラウザで、自分のゲームを表示する
   （開発サーバーは起動したままなので、**F5 で再読み込みします**）
2. `Win + Shift + S` で範囲を選んでスクリーンショットを撮る（クリップボードに入ります）
3. Pull Request のページを開く

   ```powershell
   gh pr view --web
   ```

4. 本文の編集画面（Edit）を開き、テキストエリアに **`Ctrl + V` で貼り付ける**か、画像ファイルを**ドラッグ&ドロップ**する
5. `![image](https://github.com/user-attachments/...)` という行が自動で挿入されます

GitHub が画像を預かってくれるので、リポジトリは汚れません。

Pull Requestの確認者は、そのゲームを初めて見る場合があります。完成画面が1枚あると、
「どこを見ればいいか」が伝わります。

---

## 5. CIが成功したらReadyにする

CIの状態を確認します。

**A: Claude に頼む**

```text
gh pr checksでCIの状態を確認し、失敗しているジョブがあれば、
そのログのうち最初のエラーだけを引用してください。まだ直さないでください。
```

**B: 参加者が実行**

```powershell
gh pr checks
```

`verify` が `pass` になるまで待ちます。ブラウザで見るならこちらです。

```powershell
gh pr view --web
```

失敗している場合は、手元で `npm run verify` を実行してください。CIと同じ検証が行われます。
`npm run verify` が成功するのにCIだけ失敗する場合は、T-21を参照してください。

成功したら Draft 状態を解除します。ここで提出済みになります。

**B: 参加者が実行**

```powershell
gh pr ready
```

> `gh pr ready` は、参加者がターミナルBで実行してください。
> ターミナルA から打とうとすると承認を求められますが、承認を押すだけにしないための決まりです。
> 遊んでいないもの、`verify` が成功していないものを ready にしないでください。

Ready にすると、参考情報として `pr-meta (advisory)` も走ります。
これは**必須チェックではありません**。失敗してもマージできます。Pull Request の書き方の助言が出るだけです。

Ready にしたら、講師に PR 番号を伝えてください。

---

## 6. マージを待つ

**マージは講師が行います。参加者はマージしません。**
`main` へのマージに必要なのは **`verify` が成功していること** と **Draft が外れていること** の2つです。

講師は次のように Squash でマージします（`Create a merge commit` は使いません）。
1つの Pull Request が `main` に1つのコミットとして並ぶので、
「どのゲームがいつ入ったか」が履歴で一目で分かります。

```powershell
gh pr merge <PR番号> --squash --delete-branch
```

マージすると自動で次が起こります。

- 本文に `Closes #<Issue番号>` と書いてあれば Issue が閉じる
- `Deploy to GitHub Pages` が走り、数分後に公開ページへ自分のゲームが出る

デプロイの様子は次で見られます。

**B: 参加者が実行**

```powershell
gh run list --workflow "Deploy to GitHub Pages"
```

公開 URL は GitHub の `Settings > Pages` に出ています。404 のときは **T-26** です。
マージできないときは **T-27** です。

---

## 7. 自分のブランチに戻る / 最新を取り込む

マージ後、次の作業に移る前に `main` を最新にします。

**B: 参加者が実行**

```powershell
git switch main
git pull
```

自分の作業を続ける場合は、自分のブランチに戻ります。

```powershell
git switch feature/<自分のゲームID>
```

`main` が進んで自分のブランチが古くなっても、**このリポジトリでは基本的に競合しません**。
ゲーム一覧は `import.meta.glob` で自動収集していて、9人が共通で書き換えるファイルが1つも無いためです。
それでも取り込みたい場合は次を実行します。

```powershell
git fetch origin
git merge origin/main
```

（`git merge` をターミナルAから実行すると、履歴が変わるため承認を求められます）

---

## 巻き戻し集

「やってしまった」の戻し方です。**焦って `git reset --hard` を打たないでください。**
迷ったら、まず現状を記録します。

**この節のコマンドは、すべて B（参加者が操作する窓）で実行してください。**
戻す操作は「どこまで戻すか」を決めるのが本体で、それは今の状態を知っている人にしか決められません。
現在の状態が分からない場合は、先にターミナルAへ次のプロンプトを入力してください。

**A: Claude に頼む**

```text
いまの状況を10行以内でまとめてください。含めるのは次の5点です。

- いま何をしているか
- 直前に終わったこと
- まだ終わっていないこと
- 次にやること
- 気をつけること

先に git branch --show-current / git status --short / npm run scope を実行し、
その結果にもとづいて書いてください。推測で書かないでください。コードは変更しないでください。
```

出てきた10行が、いまの状態と合っているかを確認してください。
判断できないときは、まだ戻す操作をしないでください。**手を止めて講師に見せてください。**

**B: 参加者が実行**

```powershell
git branch --show-current
git status
git log --oneline -5
```

### 早見表

| やってしまったこと | 戻し方の要点 | 詳しい手順 |
|---|---|---|
| 担当外のファイルを変更した | `npm run scope` が出す `git restore` をそのまま実行 | A |
| 間違ったブランチで作業した（未コミット） | `git stash` → `git switch` → `git stash pop` | B |
| 間違ったブランチでコミットしてしまった | 正しいブランチへ `cherry-pick` して、元を戻す | C |
| コミットメッセージを間違えた（直前のみ・未 push） | `git commit --amend -m "..."` | D |
| push した後に間違いに気づいた | 履歴は書き換えず、直しを新しいコミットで push | E |
| `main` で作業してしまった | `git stash` → `git switch -c` → `git stash pop` | F |
| コンフリクトした | 競合を直して `git add` → `git commit` | G |
| 直前のコミットを取り消したい（未 push） | `git reset --soft HEAD~1`（変更は手元に残る） | H |
| ファイルを消してしまった（未コミット） | `git restore <パス>` | I |

（ここの A〜I は手順の見出しで、ターミナルA / B とは関係ありません）

---

### A. 担当外のファイルを変更した

まず何が範囲外なのかを見ます。

**B: 参加者が実行**

```powershell
npm run scope
```

出力の最後に、**そのままコピペできる復元コマンド**が出ます。

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

変更を一時的に預けて、正しいブランチで取り出します。

**B: 参加者が実行**

```powershell
git stash
git switch feature/<自分のゲームID>
git stash pop
```

`git stash list` で預けたものが見えます。`git stash pop` は「取り出して、預かりを消す」動きです。

### C. 間違ったブランチでコミットしてしまった

例: 作業ブランチにいるつもりが `main` にコミットしてしまった場合。

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

正しいブランチに入ったことを確認してから、間違えた側を元に戻します。

```powershell
git switch main
git status
git reset --hard origin/main
```

`git reset --hard` は**手元の変更を消します**。`git status` が空であることを確認してから実行してください。
不安なら、この操作だけは講師に見てもらってください。
（ターミナルAから実行すると承認を求められます。承認前に、削除される変更を確認してください）

### D. コミットメッセージを間違えた（直前のコミットのみ）

**まだ push していない場合だけ**使えます。

**B: 参加者が実行**

```powershell
git commit --amend -m "feat: ペア捨てを実装"
```

ファイルを1つ入れ忘れていた場合も、同じ方法で足せます。

```powershell
git add src/games/<自分のゲームID>/logic.test.ts
git commit --amend --no-edit
```

**push 済みのコミットには `--amend` を使わないでください。** 履歴が食い違い、`--force` が必要になります（禁止しています）。

### E. push した後に間違いに気づいた

**履歴を書き換えないでください。** `git push --force` はハーネスが止めますし、
すでに公開された差分を壊します。
直しを**新しいコミット**として重ねます。

**A: Claude に頼む**

```text
<何が間違っていたか> を直してください。
修正後に `npm run verify` を実行し、成功したらコミットしてください。

git pushはしないでください。参加者がターミナルBで実行します。
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

よく起こるケースです。まだコミットしていなければ、変更を保持したままブランチを作成できます。

**B: 参加者が実行**

```powershell
git stash
git switch -c feature/<自分のゲームID>
git stash pop
npm run scope
```

コミットまでしてしまった場合は **C** の手順です。

### G. コンフリクトした

このリポジトリは9人が共通で書き換えるファイルを持たない設計なので、
**コンフリクトが起きたら「担当外を触っている」サイン**です。まず何が競合しているかを見ます。

**B: 参加者が実行**

```powershell
git status
```

`both modified:` と出たファイルが競合しています。

競合が `src/games/<自分のゲームID>/` の中だけなら、ファイルを開いて
`<<<<<<<` `=======` `>>>>>>>` の行を消し、正しい内容に直します。

**A: Claude に頼む**（自分のゲームフォルダの中だけのとき）

```text
src/games/<自分のゲームID>/ の中の競合マーカーを解消してください。
どちらの側を採用したかを、ファイルごとに1行で説明してください。

自分のゲームフォルダの外は触らないでください。
```

**B: 参加者が実行**

```powershell
git add src/games/<自分のゲームID>
git commit
npm run verify
```

競合が `package.json` / `package-lock.json` や共通基盤で起きたときは、自分の変更を捨てて `main` に合わせます。

```powershell
git restore --source=origin/main -- package.json package-lock.json
git add package.json package-lock.json
```

ここで `npm ci` を実行する場合は、先にターミナルBの開発サーバーを `Ctrl + C` で停止してください。
`dev` が動いたままだと `node_modules` が使用中になり、Windows では失敗します。
`npm ci` が終わったら、`npm run dev` を再実行します。

途中でやめて元に戻したいときは、こうします。

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

フォルダごと戻す場合はこうします。

```powershell
git restore src/games/<自分のゲームID>
```

---

## コマンド早見表

「実行する場所」の列を確認してください。
**B** は参加者がターミナルBで実行する操作、**A/B** はどちらでもよい操作、**A不可** はターミナルAでは実行できない操作です。

### 毎日使う

| やりたいこと | コマンド | 実行する場所 |
|---|---|---|
| 今のブランチを見る | `git branch --show-current` | A/B |
| 変更を見る | `git status` | A/B |
| 差分を見る | `git diff` | A/B |
| 担当範囲を確認する | `npm run scope` | A/B |
| 提出前の一括検証 | `npm run verify` | A/B（結果は参加者が確認する） |
| **開発サーバー** | `npm run dev` | **B のみ（A 不可）** |
| テスト | `npm test` | A/B |
| **テストの監視モード** | `npm run test:watch` | **B のみ（A 不可）** |
| 環境チェック | `npm run doctor` | A/B |
| 9人の進み具合を見る | `npm run status` | A/B |
| 担当フォルダの雛形を作る | `npm run scaffold -- --game <ゲームID>` | A/B（`--all` と `--force` は A 不可） |

### ブランチとコミット

| やりたいこと | コマンド | 実行する場所 |
|---|---|---|
| 作業ブランチを作る | `git switch -c feature/<ゲームID>` | A/B |
| ブランチを移動する | `git switch feature/<ゲームID>` | A/B |
| 1つ前のブランチに戻る | `git switch -` | A/B |
| 変更を選んで載せる | `git add src/games/<ゲームID>` | A/B |
| コミットする | `git commit -m "feat: ..."` | A/B |
| 直前のメッセージを直す（未 push） | `git commit --amend -m "..."` | B |
| 履歴を見る | `git log --oneline -5` | A/B |
| 変更を捨てる | `git restore <パス>` | B |
| 一時的に預ける / 取り出す | `git stash` / `git stash pop` | B |
| 最新の main を取り込む | `git fetch origin` → `git merge origin/main` | B（A は承認を求める） |
| **強制 push** | `git push --force` | **禁止（A 不可）** |
| **チェックを飛ばすコミット** | `git commit --no-verify` | **禁止（A 不可）** |

### GitHub（gh）

| やりたいこと | コマンド | 実行する場所 |
|---|---|---|
| ログイン状態を見る | `gh auth status` | A/B |
| Issue の一覧を見る | `gh issue list` | A/B |
| 自分の Issue を見る | `gh issue view <Issue番号>` | A/B |
| **Issue の本文を書き換える** | `gh issue edit` | **講師のみ（A 不可）**。チェックは画面でクリック |
| **初回の push** | `git push -u origin HEAD` | **B**（A は承認を求める） |
| **2回目以降の push** | `git push` | **B**（A は承認を求める） |
| **Draft の Pull Request を作る** | `gh pr create --draft --title "..." --body-file .pr-body.md` | **B**（A は承認を求める） |
| 自分の Pull Request を見る | `gh pr view` | A/B |
| ブラウザで開く | `gh pr view --web` | A/B |
| CI の状態を見る | `gh pr checks` | A/B |
| **Draft を外す** | `gh pr ready` | **B**（A は承認を求める） |
| **本文を差し替える** | `gh pr edit <PR番号> --body-file .pr-body.md` | **B**（A は承認を求める） |
| 一覧を見る | `gh pr list` | A/B |
| 差分を見る | `gh pr diff <PR番号>` | A/B |
| コメントを読む | `gh pr view <PR番号> --comments` | A/B |
| **承認する** | `gh pr review <PR番号> --approve --body "..."` | **B のみ（A 不可）** |
| **変更を依頼する** | `gh pr review <PR番号> --request-changes --body "..."` | **B のみ（A 不可）** |
| **コメントを投稿する** | `gh pr comment` / `gh issue comment` | **B のみ（A 不可）**。GitHub の画面が確実 |
| **マージする（Squash）** | `gh pr merge <PR番号> --squash --delete-branch` | **B**（A は承認を求める） |
| **API を直接叩く** | `gh api` | **禁止（A 不可）** |

**A 不可**のものは、頼んでも拒否メッセージが返ります。
理由は [docs/harness.md](harness.md) の「`guard-bash.mjs` が止めるコマンド」にまとまっています。

### Claude Code に頼むときの定型プロンプト（すべて A）

覚えるコマンドはありません。次の場面ごとに、手順書の文面をそのまま貼ります。

| 場面 | 頼むこと | 手順書の場所 |
|---|---|---|
| 実装を始める前 | Issue とルール文書を読み、実装計画を作成する（コードは変更しない） | フェーズ4 |
| 実装 | まず最後まで遊べる状態まで実装する。担当フォルダの外は変更しない | フェーズ4 |
| 遊んで直す | プランモード（`/plan`）で原因と改善策を整理し、確認後に実行する | フェーズ5 |
| 提出前 | `npm run verify` を実行し、必須要件との対応表を作成する | フェーズ6 |
| Pull Request | `.pr-body.md` に本文の作成を依頼する（pushも `gh pr create` も実行しない） | フェーズ6 |
| 状況の共有 | 現在の状況を10行以内にまとめるよう依頼する（推測を含めない） | フェーズ5 |
| 詰まったとき | 事実を集めて `docs/troubleshooting.md` と照合し、次に試すことを1つだけ挙げさせる | `docs/troubleshooting.md` |

**1人で進めるので、相談するタイミングを先に決めておいてください。**
「手が止まったら状況を整理して、それでも動かなければ講師」がおすすめです。
問題の原因を確認する前に大きな変更を始めると、手戻りが増えます。
状況を整理させるときは、**コードを変更させない**と明記してください。

### 範囲を切るプロンプトの型（A で使う）

コマンドと同じくらい、**範囲を切る言い方**を覚えてください。

| 切り方 | 言い方 |
|---|---|
| **ファイルで切る** | 「`logic.ts` と `logic.test.ts` だけ触ってください」 |
| **やらないことを言う** | 「画面（`.tsx`）は触らないでください」「実装は変えないでください」 |
| **止める場所を言う** | 「まだ直さないでください」「計画だけ出して止まってください」 |
| **投稿させない** | 「投稿はしないでください」「push はしないでください」 |

作業範囲を小さく区切ると、各段階で差分を確認しやすくなります。

### 困ったとき

| 状況 | 見るところ |
|---|---|
| 環境がおかしい | `npm run doctor` |
| 範囲チェックが失敗する | `npm run scope` の出力（troubleshooting T-09） |
| CIが失敗する | 手元で `npm run verify`（troubleshooting T-21） |
| 「実行できません」と言われた | [docs/harness.md](harness.md) |
| その他のエラー | `docs/troubleshooting.md`（T-01〜T-32） |
| 当日の進め方が分からない | `docs/handson-steps.md` |
| 自分と全体が今どこにいるか | `npm run status` |
| どうしても分からない | 手を止めて講師に相談する |
