# GitHub の進め方（Windows / PowerShell）

clone から マージ までの操作を、**上から順に実行すればそのまま進む**形で並べています。
コマンドはすべて **PowerShell** にそのまま貼り付けて動きます。

この研修で GitHub 上を流れるものは1つだけです。

```
Issue（何を作るか） → feature/<ゲームID> ブランチ → Draft Pull Request
  → CI（verify）が緑 → Ready → 他チームがレビュー → Approve → Squash マージ → Pages に公開
```

覚えるコマンドは3つだけです（`npm run dev` / `npm test` / `npm run verify`）。
GitHub 側の操作は、このページを見ながらコピペしてください。

---

## 0. 事前準備（研修が始まる前に済ませる）

### 0-1. 必要なものが入っているか確認する

```powershell
node -v
git --version
gh --version
```

`node -v` が `v22.` で始まらない場合は `docs/troubleshooting.md` の **T-01** を見てください。
`gh` が見つからない場合は https://cli.github.com/ から GitHub CLI を入れます。

### 0-2. GitHub にログインする

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

`Token scopes:` に `repo` が含まれていることを必ず見てください。
含まれていない場合は **T-24** です。

### 0-3. リポジトリを clone する

**パスに日本語・スペース・OneDrive を含めないでください**（**T-05**）。

```powershell
mkdir -Force $HOME/dev
cd $HOME/dev
git clone https://github.com/Daisuke0719/card_arcade.git
cd card_arcade
```

### 0-4. 依存をインストールする

**`npm install` ではなく `npm ci` を使ってください。**
`npm install` は `package-lock.json` を書き換えることがあり、そうなると CI が落ちます（**T-22**）。

```powershell
npm ci
```

`npm ci` の最後に `prepare` が走り、コミット前チェック（`.githooks/pre-commit`）が自動で有効になります。

### 0-5. 環境チェック

```powershell
npm run doctor
npm run dev
```

`npm run doctor` がすべて `✓` になり、`npm run dev` でアーケードの一覧画面がブラウザに出れば準備完了です。
`✗` が出たら、その行の `→` に書かれた指示に従ってください。直らなければその出力をそのまま講師に見せます。

開発サーバーは `Ctrl + C` で止めます。

---

## 1. 作業ブランチを作る

**`main` のまま実装を始めてはいけません。** ブランチ名が「自分が誰の担当か」を表します。

```powershell
git switch main
git pull
git switch -c feature/babanuki
```

`babanuki` の部分は自分のゲームIDに置き換えます。

| ゲームID | ゲーム | 担当 |
|---|---|---|
| `babanuki` | ババ抜き | Team A |
| `shinkeisuijaku` | 神経衰弱 | Team B |
| `speed` | スピード | Team C |
| `shichinarabe` | 七並べ | Team D |
| `doubt` | ダウト | Team E |
| `daifugo` | 大富豪 | Team F |

今どこにいるかは、いつでもこれで確認できます。

```powershell
git branch --show-current
```

ブランチを作ると、Claude Code のセッション開始時に「あなたは Team A / ババ抜きの担当です」と自動で伝わります。
先にブランチを作っておくほど、AI が担当外を触ろうとする事故が減ります。

---

## 2. こまめにコミットする

**30分ぶんの作業を1つのコミットにしないでください。**
小さく刻んでおくと、後から「1つ前に戻す」が安全にできます。

```powershell
git status
git add src/games/babanuki
git commit -m "feat: ババ抜きの手札配布とペア捨てを実装"
```

`git add .` ではなく **`git add src/games/<自分のゲームID>`** と書く癖をつけてください。
`git add .` は一時ファイルやエディタの設定を巻き込み、範囲チェックが赤くなる原因になります（**T-09**）。

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

日本語で構いません。**「何をしたか」ではなく「何ができるようになったか」**を書くと、レビュアーが読みやすくなります。

コミットしたくなる良いタイミングは次のとおりです。

- テストが1つ緑になった
- `logic.ts` の1機能が動いた
- 画面が表示できた
- `npm run verify` が緑になった

---

## 3. push して Draft Pull Request を作る

### 3-1. 先に verify を通す

```powershell
npm run verify
```

`✓ npm run verify がすべて通りました。` が出るまで Pull Request を作らないでください。
CI とまったく同じ内容（範囲チェック → lint → 型 → テスト → ビルド）です。

### 3-2. Pull Request の本文を用意する

Claude Code の `/pr` を実行すると `.pr-body.md` が作られます。
`.pr-body.md` は `.gitignore` に入っているのでコミットされません。

**「レビューしてほしい点」だけは自分の言葉で書いてください。** ここが具体的だとレビューの質が変わります。

```powershell
notepad .pr-body.md
```

### 3-3. push して Draft で出す

```powershell
git push -u origin HEAD
gh pr create --draft --title "ババ抜きを実装" --body-file .pr-body.md
```

`--draft` を付けるのは、**まだレビューを頼まないため**です。
Draft のうちは CI（`verify`）だけが走り、レビュー依頼の通知は飛びません。

作った Pull Request の番号と URL は、次で確認できます。

```powershell
gh pr view
```

以降、`git push` するたびに同じ Pull Request が自動で更新されます。**2つ目を作る必要はありません。**

```powershell
git add src/games/babanuki
git commit -m "test: 全員パスになったときのテストを追加"
git push
```

---

## 4. スクリーンショットを添付する

**画像ファイルをリポジトリにコミットしないでください。**
画像を追加すると範囲チェックで落ちますし、差分も重くなります。

1. `npm run dev` でゲームを表示する
2. `Win + Shift + S` で範囲を選んでスクリーンショットを撮る（クリップボードに入ります）
3. Pull Request のページを開く

   ```powershell
   gh pr view --web
   ```

4. 本文の編集画面（Edit）を開き、テキストエリアに **`Ctrl + V` で貼り付ける**か、画像ファイルを**ドラッグ&ドロップ**する
5. `![image](https://github.com/user-attachments/...)` という行が自動で挿入されます

GitHub が画像を預かってくれるので、リポジトリは汚れません。

---

## 5. CI が緑になったら Ready にする

CI の状態を見ます。

```powershell
gh pr checks
```

`verify` が `pass` になるまで待ちます（だいたい1〜2分）。ブラウザで見るならこちらです。

```powershell
gh pr view --web
```

赤い場合は **手元で `npm run verify` を実行してください。** CI とまったく同じ内容なので、同じ場所で落ちます。
`npm run verify` が緑なのに CI だけ赤いときは **T-21** です。

緑になったら Draft を外します。ここで初めてレビュー依頼になります。

```powershell
gh pr ready
```

Ready にすると、参考情報として `pr-meta (advisory)` も走ります。
これは**必須チェックではありません**。赤くてもマージできます。Pull Request の書き方の助言が出るだけです。

Ready にしたら、レビュー担当チームに声をかけてください。

| 作ったチーム | レビューするチーム |
|---|---|
| Team A（ババ抜き） | Team B |
| Team B（神経衰弱） | Team C |
| Team C（スピード） | Team D |
| Team D（七並べ） | Team E |
| Team E（ダウト） | Team F |
| Team F（大富豪） | Team A |

---

## 6. レビューする（他チームの Pull Request を読む）

### 6-1. 手元に取ってきて、実際に遊ぶ

**差分を眺めるだけのレビューはしないでください。** まず動かします。

```powershell
gh pr list
gh pr checkout 12
npm ci
npm run dev
```

`12` はレビューする Pull Request の番号です。

遊びながら、次の3つを必ず試します。

- 普通に最初から最後まで1回クリアする
- **やってはいけない操作**をわざとやる（判定中に連打する、出せないカードを出す、0枚のときに引く）
- リセットして2回目が正しく始まるか見る

### 6-2. Issue と差分を突き合わせる

```powershell
gh pr view 12
gh issue view 3
gh pr diff 12
```

Claude Code の `/review 12` を使うと、この手順を観点付きで整理してくれます。
ただし **投稿するのは自分が実機で確認できた指摘だけ**にしてください。

### 6-3. コメントを書く

GitHub の画面で、該当する行に付けるのがいちばん伝わります。

```powershell
gh pr view 12 --web
```

指摘は必ずこの3点セットにします。

1. **ルールの指摘（再現手順つき）** … 「ジョーカーを2回続けて引くと手札が -1 枚になります。Issue では 0 で止まるはずです」
2. **テストの提案（具体的なテスト名で）** … 「`it("最後の1枚を引いたとき上がりになる")` を足すとよいです」
3. **質問または可読性の提案** … 1つは GitHub の `suggestion`（提案）ブロックで書けるもの

再現手順が書けない指摘は投稿しないでください。

### 6-4. 終わったら自分のブランチに戻る

**これを忘れると、次のコミットが他チームのブランチに入ります。**

```powershell
git switch feature/babanuki
```

---

## 7. レビューを受けて直す

### 7-1. コメントを読む

```powershell
gh pr view 12 --comments
```

Claude Code の `/fix-review 12` を使うと、指摘を「直す / 相談 / 直さない」に分類した表を作ってくれます。
**「直さない」を選ぶこと自体は悪いことではありません。** 理由を説明できるかが大事です。

### 7-2. 直して push する

```powershell
npm run verify
git add src/games/babanuki
git commit -m "fix: 判定中のクリックを無視するようにした"
git push
```

`git push` するだけで Pull Request は更新され、CI も再実行されます。

### 7-3. 必ず返信する

**直しただけで終わらせないでください。** レビュアーは「自分の指摘がどうなったか」が分からないと承認できません。
コメント1つずつに、この形で返します。

```
ご指摘ありがとうございます。
判定中は onCardClick を無視するようにしました。
コミット: a1b2c3d
```

コミットの SHA は次で確認できます。

```powershell
git log --oneline -1
```

---

## 8. Approve する

レビュアー側が、指摘への対応を確認したら承認します。

```powershell
gh pr review 12 --approve --body "実機で最後まで確認しました。ルールも Issue どおりです。"
```

直してほしいことが残っているときは、承認ではなく変更依頼を出します。

```powershell
gh pr review 12 --request-changes --body "0枚のときに引けてしまう点だけ直してください。"
```

**自分の Pull Request を自分で Approve することはできません。** GitHub が拒否します。
必ずレビュー担当チームに頼んでください。

---

## 9. マージする（Squash）

`main` へのマージには **`verify` が緑** と **Approve 1件** が必要です。

```powershell
gh pr merge 12 --squash --delete-branch
```

GitHub の画面から押す場合は、**必ず `Squash and merge`** を選びます。
`Create a merge commit` は使いません。1つの Pull Request が `main` に1つのコミットとして並ぶので、
「どのゲームがいつ入ったか」が履歴で一目で分かります。

マージすると自動で次が起こります。

- 本文に `Closes #3` と書いてあれば Issue が閉じる
- `Deploy to GitHub Pages` が走り、数分後に公開ページへ自分のゲームが出る

デプロイの様子は次で見られます。

```powershell
gh run list --workflow "Deploy to GitHub Pages"
```

公開 URL は GitHub の `Settings > Pages` に出ています。404 のときは **T-26** です。
マージできない・ボタンが押せないときは **T-27** です。

---

## 10. 自分のブランチに戻る / 最新を取り込む

マージ後、次の作業に移る前に `main` を最新にします。

```powershell
git switch main
git pull
```

自分の作業を続ける場合は、自分のブランチに戻ります。

```powershell
git switch feature/babanuki
```

`main` が進んで自分のブランチが古くなっても、**このリポジトリでは基本的に競合しません**。
ゲーム一覧は `import.meta.glob` で自動収集していて、6チームが共通で書き換えるファイルが1つも無いためです。
それでも取り込みたい場合は次を実行します。

```powershell
git fetch origin
git merge origin/main
```

---

## 巻き戻し集

「やってしまった」の戻し方です。**焦って `git reset --hard` を打たないでください。**
迷ったら、まず現状を記録します。

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

---

### A. 担当外のファイルを変更した

まず何が範囲外なのかを見ます。

```powershell
npm run scope
```

出力の最後に、**そのままコピペできる復元コマンド**が出ます。

```
元に戻すには、次のコマンドをそのまま実行してください:

  git restore --source=HEAD --staged --worktree -- src/core/deck.ts
```

これをそのまま貼り付けて実行し、もう一度 `npm run scope` が緑になることを確認します。

```powershell
git restore --source=HEAD --staged --worktree -- src/core/deck.ts
npm run scope
```

**共通基盤（`src/core/` `src/components/` など）に手を入れたくなったら、自分で直さずに講師へ相談してください。**

### B. 間違ったブランチで作業した（未コミット）

変更を一時的に預けて、正しいブランチで取り出します。

```powershell
git stash
git switch feature/babanuki
git stash pop
```

`git stash list` で預けたものが見えます。`git stash pop` は「取り出して、預かりを消す」動きです。

### C. 間違ったブランチでコミットしてしまった

例: `feature/speed` にいるつもりが `main` にコミットしてしまった場合。

```powershell
git log --oneline -3
```

移したいコミットの SHA（例 `a1b2c3d`）を控えます。

```powershell
git switch feature/speed
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

### D. コミットメッセージを間違えた（直前のコミットのみ）

**まだ push していない場合だけ**使えます。

```powershell
git commit --amend -m "feat: ババ抜きのペア捨てを実装"
```

ファイルを1つ入れ忘れていた場合も、同じ方法で足せます。

```powershell
git add src/games/babanuki/logic.test.ts
git commit --amend --no-edit
```

**push 済みのコミットには `--amend` を使わないでください。** 履歴が食い違い、`--force` が必要になります（禁止しています）。

### E. push した後に間違いに気づいた

**履歴を書き換えないでください。** `git push --force` はハーネスが止めますし、他チームの作業を壊します。
直しを**新しいコミット**として重ねます。

```powershell
git add src/games/babanuki
git commit -m "fix: ジョーカーを2枚配っていたのを1枚に修正"
git push
```

「あのコミットを丸ごと打ち消したい」場合は、打ち消しコミットを作ります。

```powershell
git log --oneline -3
git revert a1b2c3d
git push
```

### F. `main` で作業してしまった

いちばんよくある事故です。まだコミットしていなければ、そのまま持って行けます。

```powershell
git stash
git switch -c feature/babanuki
git stash pop
npm run scope
```

コミットまでしてしまった場合は **C** の手順です。

### G. コンフリクトした

このリポジトリは6チームが共通で書き換えるファイルを持たない設計なので、
**コンフリクトが起きたら「担当外を触っている」サイン**です。まず何が競合しているかを見ます。

```powershell
git status
```

`both modified:` と出たファイルが競合しています。

競合が `src/games/<自分のゲームID>/` の中だけなら、ファイルを開いて
`<<<<<<<` `=======` `>>>>>>>` の行を消し、正しい内容に直します。

```powershell
git add src/games/babanuki
git commit
npm run verify
```

競合が `package.json` / `package-lock.json` や共通基盤で起きたときは、自分の変更を捨てて `main` に合わせます。

```powershell
git restore --source=origin/main -- package.json package-lock.json
git add package.json package-lock.json
npm ci
```

途中でやめて元に戻したいときは、こうします。

```powershell
git merge --abort
```

### H. 直前のコミットを取り消したい（未 push）

コミットだけを取り消し、**変更内容は手元に残します**。

```powershell
git reset --soft HEAD~1
git status
```

`--soft` なのがポイントです。`--hard` は変更ごと消えます。

### I. ファイルを消してしまった

まだコミットしていなければ、直前のコミットの状態に戻せます。

```powershell
git restore src/games/babanuki/logic.ts
```

フォルダごと戻す場合はこうします。

```powershell
git restore src/games/babanuki
```

---

## コマンド早見表

### 毎日使う

| やりたいこと | コマンド |
|---|---|
| 今のブランチを見る | `git branch --show-current` |
| 変更を見る | `git status` |
| 差分を見る | `git diff` |
| 担当範囲を確認する | `npm run scope` |
| 提出前の全部入りチェック | `npm run verify` |
| 開発サーバー | `npm run dev` |
| テスト | `npm test` |
| 環境チェック | `npm run doctor` |

### ブランチとコミット

| やりたいこと | コマンド |
|---|---|
| 作業ブランチを作る | `git switch -c feature/babanuki` |
| ブランチを移動する | `git switch feature/babanuki` |
| 1つ前のブランチに戻る | `git switch -` |
| 変更を選んで載せる | `git add src/games/babanuki` |
| コミットする | `git commit -m "feat: ..."` |
| 直前のメッセージを直す（未 push） | `git commit --amend -m "..."` |
| 履歴を見る | `git log --oneline -5` |
| 変更を捨てる | `git restore <パス>` |
| 一時的に預ける / 取り出す | `git stash` / `git stash pop` |
| 最新の main を取り込む | `git fetch origin` → `git merge origin/main` |

### GitHub（gh）

| やりたいこと | コマンド |
|---|---|
| ログイン状態を見る | `gh auth status` |
| Issue を見る | `gh issue view 3` |
| 初回の push | `git push -u origin HEAD` |
| 2回目以降の push | `git push` |
| Draft の Pull Request を作る | `gh pr create --draft --title "..." --body-file .pr-body.md` |
| 自分の Pull Request を見る | `gh pr view` |
| ブラウザで開く | `gh pr view --web` |
| CI の状態を見る | `gh pr checks` |
| Draft を外す | `gh pr ready` |
| 一覧を見る | `gh pr list` |
| レビュー用に取ってくる | `gh pr checkout 12` |
| 差分を見る | `gh pr diff 12` |
| コメントを読む | `gh pr view 12 --comments` |
| 承認する | `gh pr review 12 --approve --body "..."` |
| 変更を依頼する | `gh pr review 12 --request-changes --body "..."` |
| マージする（Squash） | `gh pr merge 12 --squash --delete-branch` |

### Claude Code のスラッシュコマンド

| コマンド | すること |
|---|---|
| `/kickoff <Issue番号>` | Issue を読んで実装計画を立てる（コードは変更しない） |
| `/implement` | 合意した計画に沿って実装する |
| `/verify` | `npm run verify` と Issue の完了条件を突き合わせる |
| `/pr` | `.pr-body.md` に Pull Request の本文を作る |
| `/review <PR番号>` | 他チームの Pull Request を観点に沿って読む |
| `/fix-review <PR番号>` | 付いた指摘を分類して対応方針を出す |
| `/handoff` | Driver 交代用の引き継ぎメモを作る |
| `/stuck <困りごと>` | 状況を整理して次の一手を1つ出す |

### 困ったとき

| 状況 | 見るところ |
|---|---|
| 環境がおかしい | `npm run doctor` |
| 範囲チェックが赤い | `npm run scope` の出力（troubleshooting T-09） |
| CI が赤い | 手元で `npm run verify`（troubleshooting T-21） |
| その他のエラー | `docs/troubleshooting.md`（T-01〜T-28） |
| 当日の進め方が分からない | `docs/handson-steps.md` |
| どうしても分からない | 手を止めて講師に相談する |
