# 講師ガイド

「Claude Code × GitHub 共同開発ハンズオン — みんなでつくる CARD ARCADE」を運営する人のための文書です。
**当日はこれ1本で回せます。** 事前準備・時間割・介入の基準・緊急時の逃げ道までここに入っています。

参加者向けの文書は次のとおりです。講師が読ませる順番もこの順です。

| 文書 | いつ読ませるか |
|---|---|
| `docs/setup.md` | 前日まで（事前課題） |
| `docs/handson-steps.md` | 当日の最初から最後まで（Step 1〜18） |
| `docs/troubleshooting.md` | 詰まったとき（T-01〜） |
| `docs/games/<ゲームID>.md` | 担当ゲームのルールの正典 |

---

## 1. 研修の設計意図

### 1-1. 主目的はゲーム制作ではない

180分でトランプゲームを1本仕上げるのは、正直に言えばおまけです。
**この研修が測っているのは「他人がいる共有リポジトリで、自分の担当範囲を守って完成まで持っていけるか」だけ**です。

参加者が持ち帰る経験は次の5つです。

1. 自分の担当範囲がコードで機械的に定義されている状態で作業した
2. `npm run verify` が緑になるまで「できました」と言わなかった
3. 他人に読まれる前提で Pull Request を書いた
4. **他人のコードを実際に動かして**レビューした（差分を眺めるだけではない）
5. 指摘を受けて直し、マージされ、公開された

ゲームの出来は6番目です。**時間が足りないときに削るのは常にゲームの中身**で、この5つではありません。
5章の「切り捨て順」はこの優先順位をそのまま数字にしたものです。

### 1-2. なぜ「間違いを機械が止める」ようにしてあるのか

6チーム・最大30名が1つの `main` を共有します。この規模で口頭ルールは必ず破られます。
破られたときに困るのは破った人ではなく、**他の5チーム**です。

そこで、この研修では規約を文章ではなく**動くコード**にしてあります。

- 「他人のフォルダを触らないでください」→ `scripts/scope-guard.mjs` が差分を見て落とす
- 「依存を追加しないでください」→ `.claude/settings.json` の deny と `.claude/hooks/guard-bash.mjs` が止める
- 「`logic.ts` に `Math.random()` を書かないでください」→ ESLint が error にする
- 「ESLint を無効化して回り込まないでください」→ `tests/contract/boundaries.contract.test.ts` が落とす

**講師が注意する回数を減らすことが目的ではありません。**
「なぜダメか」を人間が説明するのは1回で済み、2回目以降は機械が同じ言葉で説明してくれる、という状態を作るのが目的です。
講師の時間は、機械が判定できないこと（ルール解釈・要件の削り方・レビューの質）に使ってください。

### 1-3. ハーネスは5層。Layer 4 だけがバイパス不能

| 層 | 実体 | 役割 | 抜けられるか |
|---|---|---|---|
| Layer 1 予防 | `scripts/scaffold-game.mjs` / `templates/game/` | そもそも間違った形を作らせない | 手で書けば抜けられる |
| Layer 2 伝える | `CLAUDE.md` / `src/games/CLAUDE.md` | 何が禁止かを AI と人間の両方に伝える | 読まなければ抜けられる |
| Layer 3 その場で止める | `.claude/settings.json` の deny / `.claude/hooks/` | 範囲外の編集・依存追加・迂回コマンドを止める | `CARD_ARCADE_HARNESS=off` で抜けられる |
| **Layer 4 コミットさせない** | **ESLint / `tests/contract/` / `.githooks/pre-commit`** | **境界違反をコミット不能・マージ不能にする** | **pre-commit は `--no-verify` で抜けられるが、ESLint と契約テストは CI で必ず走る** |
| Layer 5 マージさせない | `.github/workflows/ci.yml` / `CODEOWNERS` / ブランチ保護 | 赤い Pull Request をマージできなくする | 管理者権限が要る |

**「Layer 4 だけがバイパス不能」の意味**を正確に押さえてください。

- Layer 1〜3 は参加者の手元にあります。手元にあるものは必ず抜けられます。フックを承認しない、
  環境変数を立てる、Claude Code を使わずエディタで直接書く — どれも可能です。
- Layer 4 の実体は **ソースコードそのものの性質** です。`logic.ts` に `Math.random()` が書いてあるという事実は、
  誰がどんな手順でコミットしても消えません。`npm run lint` と `npm test` はそれを必ず見つけます。
- そして CI（Layer 5）は必ず Layer 4 を実行します。つまり **Layer 4 の判定からは逃げられない**。
- Layer 5 は講師（管理者）が外せます。だから Layer 5 は「最後の砦」ではなく「**運用の砦**」です。

この役割分担は当日 Step 4 のデモでそのまま説明できます。
「手元の3つは君たちの味方（早く気づかせるためのもの）で、CI の1つは全員の味方（壊れたものを入れないためのもの）」
という言い方が通りやすいです。

### 1-4. 単一の真実源

チーム・ゲーム・保護対象パスは **`harness/config.json` の1箇所だけ**に書いてあります。
`scope-guard` / `scaffold` / 契約テスト / `.claude` のフック / `doctor` / `status` / `score` / `setup-github.mjs labels` が
すべてこのファイルを読みます。**当日、チーム構成を変える必要が出たらここだけを直してください。**

### 1-5. チームとレビュー担当

| ゲームID | ゲーム | 担当 | 難易度 | このチームがレビューする相手 |
|---|---|---|---|---|
| `babanuki` | ババ抜き | Team A | 初級 | Team B（神経衰弱） |
| `shinkeisuijaku` | 神経衰弱 | Team B | 初級 | Team C（スピード） |
| `speed` | スピード | Team C | 中級 | Team D（七並べ） |
| `shichinarabe` | 七並べ | Team D | 中級 | Team E（ダウト） |
| `doubt` | ダウト | Team E | 中級 | Team F（大富豪） |
| `daifugo` | 大富豪 | Team F | 上級 | Team A（ババ抜き） |

輪になっているので、**どこか1チームが PR を出さないと、そのレビュー担当チームがやることを失います。**
4章の「127分に Draft PR が出ていない」を介入ラインに入れているのはこのためです。

---

## 2. 事前準備チェックリスト（前日まで）

### 2-1. リポジトリ側（**この順番で実行する**）

順番に意味があります。特に 5 → 6 の順を逆にすると、必須チェックの名前が確定していない状態で
ブランチ保護がかかり、**全 Pull Request が永久に pending になって当日マージできなくなります。**

すべて PowerShell で、リポジトリのルート（`C:\Users\daisu\project\card_arcade`）で実行します。

#### 1. 参加者を collaborator に招待し、**全員に承諾させる**

**当日 403 が出る原因の第1位がこれです。** 招待メールを開いていない参加者は `git push` も `gh pr create` も落ちます。

```powershell
gh api -X PUT "repos/Daisuke0719/card_arcade/collaborators/<GitHubユーザー名>" -f permission=push
```

`permission=push` で十分です。admin は渡さないでください。

招待したら、**前日に必ず未承諾を洗い出してください。**

```powershell
# ここに名前が出ている人は「まだ承諾していない」人です
gh api "repos/Daisuke0719/card_arcade/invitations" --jq ".[].invitee.login"

# 承諾済み（= 当日動く人）の一覧
gh api "repos/Daisuke0719/card_arcade/collaborators" --jq ".[].login"
```

前者が**空になるまで**催促します。空にならない場合は当日の朝にもう一度実行してください。
未承諾のまま当日を迎えた人は、**そのチームの Driver から外す**（別の人に操作させる）のが最短の回避策です。

#### 2. ラベルを作る

```powershell
node scripts/setup-github.mjs labels
```

`--force` 付きで作るので、何度実行しても安全です。
`game` / `team-a`〜`team-f` / `difficulty:easy|normal|hard` / `stretch-goal` / `blocked` / `bug` /
`core-change` / `harness:override` の15個が作られます。

最後の `harness:override` は**講師専用**です（6章 補足A）。**参加者には存在を教えないでください。**

#### 3. マイルストーンと Issue を作る

```powershell
node scripts/setup-github.mjs milestone
node scripts/setup-github.mjs issues
```

Issue は `docs/games/<ゲームID>.md` を正典として6本作られます。

作成後、**発行された Issue 番号を `harness/config.json` の各チームの `issue` に書き戻してください。**
ここが `0` のままだと、Claude Code のセッション開始メッセージ（`.claude/hooks/session-brief.mjs`）に
「担当 Issue: #未設定」と出て、参加者が自分の Issue を探すところで数分を失います。

```powershell
gh issue list --repo Daisuke0719/card_arcade --limit 20
```

#### 4. マージ方式を Squash のみにする

feature ブランチのコミットは研修中の試行錯誤そのものなので、そのまま `main` に流すと履歴が読めなくなります。

```powershell
gh api -X PATCH "repos/Daisuke0719/card_arcade" -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false -F delete_branch_on_merge=true
```

`delete_branch_on_merge=true` も一緒に入れておくと、マージ後にブランチ一覧が散らかりません。

#### 5. **テスト PR を1本流して CI のチェック名を確定させる**

`.github/branch-protection.json` は必須チェックを `"verify"` の1本だけにしています。
**この綴りが実際のジョブ名と1文字でも違うと、その PR は永久に
「Expected — Waiting for status to be reported」で固まります。**
ブランチ保護を当てる前に、実物の名前を確認してください。

```powershell
git switch -c chore/ci-name-check
git commit --allow-empty -m "chore: CI のチェック名を確認する"
git push -u origin chore/ci-name-check
gh pr create --title "chore: CI のチェック名を確認する" --body "ブランチ保護を当てる前の確認用。マージせず close します。"

# CI が終わるまで待ってから、実際に報告されたチェック名を見る
gh pr checks --watch
```

出力の左端に **`verify`** と出ることを確認します。
違う名前が出たら `.github/branch-protection.json` の `contexts` をその名前に合わせてください。

確認できたら PR を閉じてブランチを消します。

```powershell
gh pr close --delete-branch
git switch main
```

#### 6. ブランチ保護を適用する（**5 の確認が済んでから**）

```powershell
gh api -X PUT "repos/Daisuke0719/card_arcade/branches/main/protection" --input .github/branch-protection.json
```

入っている内容は次のとおりです。

- 必須チェック: `verify` 1本のみ
- レビュー承認: 1件必須 + **CODEOWNERS のレビュー必須**
- `enforce_admins: false` … **講師だけは緊急時に `--admin` で貫通できます。ここを true にしないでください。**
- 強制 push と削除の禁止

`.github/CODEOWNERS` には意図的に `*` の行を書いていません。
`*` を書くと、6つの Pull Request が同時に来る115〜152分に**講師が完全なボトルネックになり**、
「チーム同士でレビューする」という研修の目的とも矛盾します。
所有しているのは `src/core/` などの運営管理領域だけで、`src/games/<各チーム>/` は誰も所有していません。

適用後、必ず確認します。

```powershell
gh api "repos/Daisuke0719/card_arcade/branches/main/protection" --jq ".required_status_checks.contexts"
```

#### 7. GitHub Pages を有効化する（Source は **GitHub Actions**）

ブラウザで `Settings > Pages > Build and deployment > Source` を **GitHub Actions** にします。
（`Deploy from a branch` にすると `.github/workflows/deploy-pages.yml` が動きません。）

API でも設定できます。

```powershell
gh api -X POST "repos/Daisuke0719/card_arcade/pages" -f build_type=workflow
```

設定したら `main` に一度 push して、デプロイが通ることを確認してください。

```powershell
gh run list --workflow=deploy-pages.yml --limit 3
```

公開 URL は **https://daisuke0719.github.io/card_arcade/** です。
`vite.config.ts` の `base` は `"./"` にしてあるので、サブパス配信でも壊れません。

#### 8. 7章の検証を実施する

ここまで終わったら、**7章「研修前の検証手順」を必ず実施してください。省略不可です。**
所要30〜40分。ここで見つかる問題は、当日見つかると30分では済みません。

#### リポジトリ側チェックリスト

- [ ] 全参加者が collaborator の招待を**承諾済み**（invitations が空）
- [ ] ラベル15個が作成済み
- [ ] Issue 6本が作成済みで、番号が `harness/config.json` に反映済み
- [ ] マージ方式が Squash のみ / マージ後にブランチ削除
- [ ] テスト PR で CI のチェック名が `verify` であることを確認済み
- [ ] ブランチ保護を適用済み（`enforce_admins: false` のまま）
- [ ] Pages の Source が GitHub Actions で、デプロイが1回成功済み
- [ ] 7章の検証を実施し、**失敗 PR を1本 open のまま残してある**

### 2-2. 参加者側（事前課題）

**前日までに全員に完了させてください。** 当日の朝にやらせると、それだけで30分溶けます。
案内文は `docs/setup.md` をそのまま送れば足ります。

1. **Node.js 22 をインストールする**（`.nvmrc` に `22.15.0` と書いてあります）
2. **git をインストールする**
3. **GitHub CLI（`gh`）をインストールし、ログインする**

   ```powershell
   gh auth login
   ```

   scope に `repo` が必要です。

4. **clone して依存を入れる**

   ```powershell
   git clone https://github.com/Daisuke0719/card_arcade.git
   cd card_arcade
   npm ci
   ```

   **`npm install` ではなく `npm ci` です。** `npm install` だと `package-lock.json` が書き換わり、
   その時点で範囲チェックが赤くなります。

5. **`npm run doctor` が全部 OK になること**

   ```powershell
   npm run doctor
   ```

   9項目すべてに `✓` が付くまで直します。落ちた項目には「次に何をすればよいか」が `→` で出ます。
   最後の「リポジトリにアクセスできるか」が赤い人は、**招待を承諾していない**人です。

6. **Claude Code を起動し、フックの確認ダイアログを承認する**

   ```powershell
   claude
   ```

   初回起動時に「このプロジェクトのフックを実行しますか」という確認が出ます。
   **ここで承認しないとフックが1つも動きません。**
   承認できたかどうかは、セッション開始時に **「# 今のセッションの前提」** というメッセージが
   出るかどうかで判別できます（出なければ承認できていません）。

7. **`npm run dev` で画面が出ることを確認する**（お手本のハイ＆ローが遊べます）

#### 参加者側チェックリスト（講師が前日に回収する）

- [ ] `npm run doctor` が全項目 ✓ になったスクリーンショット
- [ ] Claude Code 起動時に「# 今のセッションの前提」が出たスクリーンショット

**この2枚を提出させると、当日の朝の環境トラブルがほぼゼロになります。**

---

## 3. 当日の運営

### 3-1. 時間割

参加者側の手順番号（Step 1〜18）は `docs/handson-steps.md` を見てください。区切りは同じです。

| 時刻 | 分 | 参加者がやること | 講師がやること |
|---|---|---|---|
| 0–10 | 10 | オープニング。完成イメージ（公開 URL）を見る | **お手本を実際に遊んで見せる。**「180分後にこれが6本並びます」 |
| 10–18 | 8 | チーム発表 / 担当ゲームと Issue の確認 | 座席を6島に。**Team F に5名**を割り当てる |
| 18–24 | 6 | `npm run doctor` → `git switch -c feature/<ゲームID>` | doctor が赤い人だけを見る。**全員がブランチ上にいることを確認** |
| 24–34 | 10 | **講師デモを見る**（手は動かさない） | **3-2 の台本でハーネス一周を実演** |
| 34–46 | 12 | `/kickoff <Issue番号>` … 調査と計画だけ | 「まだコードは書かせない」を徹底。書き始めた班を止める |
| 46–54 | 8 | **人間が計画をレビューして合意する** | 各島を1周。計画が Issue と1対1で対応しているかを見る |
| 54–70 | 16 | `/implement` … `logic.ts` + `logic.test.ts` | 机間巡視（3-4） |
| **70–75** | 5 | 手を止めて画面を見る | **中間チェックポイント（3-3）。`npm run status` を投影** |
| 75–96 | 21 | `/implement` … `<Xxx>Game.tsx`（画面） | 机間巡視。UI に凝り始めた班を止める |
| 96–108 | 12 | 必須要件の残り | 画面が出ていないチームに介入（4章） |
| 108–115 | 7 | `/verify` + **`npm run dev` で実機プレイ1回** | 「verify が緑でないまま PR を出すな」を全体アナウンス |
| 115–121 | 6 | commit / push / `/pr` → **Draft PR** | Draft PR が6本立ったかを `npm run status` で確認 |
| **118** | — | — | **介入ライン。verify 未達のチームは講師が削る決断を下す（4章）** |
| 121–127 | 6 | CI が緑になったら `gh pr ready` | 赤い CI を1件ずつ見て、原因を分類する |
| 127–152 | 25 | **相互レビュー**（`gh pr checkout` して実際に遊ぶ） | レビューが「差分を眺めるだけ」になっていないか見る |
| 152–158 | 6 | `/fix-review` で反映 → 再 `verify` → 承認 | 承認が集まらない PR を探して、レビュアーを急かす |
| 158–163 | 5 | **マージ** → Pages 自動デプロイ | マージ順を講師が指示。詰まったら `--admin`（6章 1） |
| 163–175 | 12 | **CARD ARCADE 大会**（公開 URL で全ゲームを遊ぶ） | 「最も意外なバグ」を探させる |
| 175–180 | 5 | 振り返り | 10章の表彰 |

**残り時間を部屋の前に出しておいてください。** 時計が見えていると、削る決断が早くなります。

### 3-2. Step 4 講師デモ「ハーネス一周」の台本（10分）

**このデモは省略しないでください。** 目的は2つあります。

1. `npm run scope` が赤くなる画面と、そこから出る復旧コマンドを**先に見せておく**
2. **赤い CI を全員で一度見ておく**（当日、自分の Pull Request が赤くなったときの心理的ダメージが激減します）

参加者には「手は動かさず、画面だけ見てください」と言ってから始めます。

#### 台本

```powershell
# --- 0. デモ用のブランチを切る（チームのブランチ名と衝突しない名前にする） ---
git switch main
git switch -c feature/demo
```

「今、私は `feature/demo` にいます。皆さんは `feature/babanuki` のような名前のブランチにいますね」

```
# --- 1. わざと共通基盤を編集する ---
# エディタで src/core/index.ts を開き、末尾にコメントを1行足して保存する
```

「共通基盤にちょっと便利な関数を足したくなった、という場面です。よくあります」

```powershell
# --- 2. 範囲チェックを走らせる ---
npm run scope
```

**ここで画面を投影して読み上げます。**

```
✗ 担当範囲の外が変更されています（1件）

  [運営管理] src/core/index.ts

編集してよいのは src/games/<自分のゲームID>/ の中だけです。

元に戻すには、次のコマンドをそのまま実行してください:

  git restore --source=HEAD --staged --worktree -- src/core/index.ts
```

**言うこと**
「怒られましたが、**直し方まで書いてあります**。この形の出力が出たら、
下に出ているコマンドを**そのままコピーして貼るだけ**です。考えなくていい」

```powershell
# --- 3. 出力されたコマンドをそのままコピペして復旧する ---
git restore --source=HEAD --staged --worktree -- src/core/index.ts
npm run scope
```

「緑になりました。**この往復は今日、必ず誰かに起きます。起きたら今のとおりにしてください**」

```powershell
# --- 4. 提出前チェックを1回見せる ---
npm run verify
```

「範囲チェック → lint → 型 → テスト → ビルド の順に走ります。**CI とまったく同じ列**です。
最後に『✓ npm run verify がすべて通りました』が出たら、そこで初めて『できました』と言えます。
逆に言うと、**これが緑になる前に Pull Request を出すと、GitHub で同じことが起きて赤くなります**」

```powershell
# --- 5. Draft PR の出し方を見せる（打つだけで実際には出さない） ---
git push -u origin HEAD
gh pr create --draft --title "<ゲーム名>を実装" --body-file .pr-body.md
```

「**まず Draft で出します。** Draft のうちに CI を回して、緑になってから `gh pr ready` で本番にします。
赤い Pull Request をいきなりレビューに出すと、レビュアーの時間が無駄になります」

```powershell
# --- 6. 事前に作っておいた「赤い PR」を GitHub で開いて投影する ---
gh pr view <7章で作った検証用 PR の番号> --web
```

**ここが一番大事なパートです。**

- 赤い `verify` のチェックを見せる
- 「Merge pull request」ボタンが**押せない状態**になっているのを見せる
- CI のログを開き、`✗ 担当範囲の外が変更されています` が**手元とまったく同じ文言**で出ていることを見せる

**言うこと**
「これは私がわざと作った、絶対にマージできない Pull Request です。
今日、皆さんの Pull Request も**一度は赤くなります。それは普通です。**
赤くなったら、**手元で `npm run verify` を打てばまったく同じ理由が出ます。**
GitHub のログを読みに行く必要はありません」

```powershell
# --- 7. 後片付け ---
git switch main
git branch -D feature/demo
```

#### デモの締めの1文

「手元の仕組みは**皆さんの味方**です。早く気づかせるためにあります。
CI は**全員の味方**です。壊れたものが `main` に入らないようにするためにあります。
どちらも敵ではありません。**回り込む方法を探した瞬間に、この研修は失敗します。**」

### 3-3. 70〜75分の中間チェックポイント（5分）

**全員に手を止めさせてから始めてください。** 手を動かしながらでは聞いていません。

```powershell
npm run status
```

これを**投影します。** 6チーム分の「PR / CI / レビュー / マージ / ローカルの status」が1画面に出ます。
この時点ではまだ Pull Request は無いので、見るのは口頭で確認する次の1点だけです。

> **「`logic.test.ts` が緑になっているチームは手を挙げてください」**

挙がらなかったチームが、この研修で最も危ないチームです。

#### 未達チームへの対応 — **講師が入って要件を削る決断を代わりに下す**

**チームに「何を削りますか」と聞いてはいけません。**
参加者は遠慮して削れません。「もう少しで終わりそうなので、このままやります」と必ず言います。
そして118分に何も終わっていません。**これは能力の問題ではなく、立場の問題です。**
だから、**削る決断は講師が代わりに下します。**

言い方はこの形に固定してください。

> 「Team D、七並べの**パスの回数制限は今日は実装しません。**
> **私が決めました。** Issue のその行は無視してください。
> 次の15分は『7の隣にカードを置ける』ところだけに使ってください。
> **減点にはなりません。** 削ったことを Pull Request の『発展課題・未対応事項』に1行書けば、むしろ加点です」

ポイントは4つです。

- **「私が決めました」と言い切る**（相談の形にしない）
- **削るものを具体的に名指しする**（「どこか削って」では削れません）
- **次にやることを1つだけ指定する**（選択肢を出さない）
- **減点にならないことを明言する**（これを言わないと、隠れて実装を続けます）

削る候補は先に決めてあります。迷ったら上から削ってください。

| チーム | ゲーム | 最初に削るもの | 次に削るもの |
|---|---|---|---|
| Team A | ババ抜き | 引く向きの矢印の演出 | CPU の思考時間（`pendingDelayMs` を短い固定値に） |
| Team B | 神経衰弱 | 手数のハイスコア保存（`useHighScore`） | めくる演出の待ち時間 |
| Team C | スピード | CPU の速度調整 | 出せる手が無いときの場札補充の演出 |
| Team D | 七並べ | パス回数の制限 | CPU の「止める」判断（素直に出すだけにする） |
| Team E | ダウト | CPU がダウトを宣言する判断 | 宣言のログ表示（`LogPanel`） |
| Team F | 大富豪 | **革命**（8切りだけ残す） | 順位ごとの称号表示 |

**Team F の大富豪は、必須要件のうち「革命」を削っても成立します。** 迷わず削ってください。

### 3-4. 机間巡視で見るポイント

コードは見なくて構いません。**人の動き方だけを見ます。** 1周3分、5〜6周してください。

#### (1) 1人が全部操作していないか — **最も多い失敗**

画面の前に1人が座り、残りが後ろで見ているだけの状態です。**これが起きると学習効果が3人分ゼロになります。**

見分け方: **キーボードに触っている人が20分以上変わっていない。**

介入の言い方:

> 「今から Driver を交代します。`/handoff` を打って、引き継ぎメモを出してください。
> 次の人はそのメモを読んでから座ってください」

`/handoff` は**このために用意してあるコマンド**です。10行の引き継ぎメモと「次に打つコマンド1つ」が出ます。

#### (2) Driver 交代が起きているか

**20分に1回**を目安にしてください。交代のタイミングは自然な区切り（テストが緑になった / 画面が出た）に合わせます。
交代のたびに `/handoff` を使わせると、交代コストがほぼゼロになります。

#### (3) verify を通さずに Pull Request を出そうとしていないか

見分け方: `git push` や `gh pr create` と打っているのに、直前に `npm run verify` を打った形跡がない。

介入の言い方:

> 「push する前に `npm run verify` です。**GitHub で同じことが起きます。**
> 手元なら40秒、GitHub なら2分待たされます」

`.claude/hooks/require-verify.mjs` が1回だけ引き止めますが、**2回目は必ず通します**（作業が詰まらないようにするため）。
つまり、**機械は1回しか止めません。2回目以降は人間の仕事です。**

#### (4) 「AI が書いたものを読んでいない」状態になっていないか

見分け方: 実装が進んでいるのに、`npm run dev` の画面を一度も開いていない。

介入の言い方:

> 「今すぐ `npm run dev` で1回遊んでください。**最初から最後まで**です。
> テストが緑でも遊べないゲームは、今日の評価では0点と同じです」

#### (5) 詰まったまま黙っていないか

**15分以上、同じエラーの前で止まっているチームがあれば必ず声をかけてください。**
参加者は「聞くのが恥ずかしい」で20分溶かします。

まず `/stuck` を打たせてください。事実（ブランチ / `scope` / `lint` / `typecheck` / `test`）が整理されて出るので、
講師はそれを見るだけで判断できます。`/stuck` はコードを変更しないので、
**焦って大きな作り直しを始める事故も同時に防げます。**

---

## 4. 介入ライン（数字で決めておく）

**「そろそろ危ないかな」で判断しないでください。** 時計を見て、数字で入ります。
数字で決めておくと、講師が遠慮しなくて済みます。

| 時刻 | 判定条件 | 講師がやること |
|---|---|---|
| **70分** | `logic.test.ts` が**緑でない** | そのチームに入る。ルール解釈で止まっているなら**講師が解釈を決める。** 実装で止まっているなら、テストを1本だけ緑にすることに集中させる |
| **96分** | 画面に**何も表示されていない** | 3-3 の表に従って要件を削る。UI は `GameShell` + `Hand` + `Button` の3つで十分だと指示する |
| **118分** | `npm run verify` が**緑でない** | **講師が削る決断を下す。** 未達の必須要件を外し、`status` は `"coming-soon"` のまま Pull Request を出させる |
| **127分** | **Draft PR が出ていない** | 講師が代わりに `.pr-body.md` の骨子を口述する。PR が無いとレビューの相手がいなくなり、**2チームが同時に止まります** |
| **145分** | レビューコメントが**0件**の PR がある | レビュー担当チームを名指しで急かす。それでも出ないなら講師が1件だけコメントを入れる |
| **158分** | 承認が付いていない PR がある | 講師が `gh pr review --approve` を入れる（6章 2） |

### 118分の「削る決断」の下ろし方

118分は**この研修で唯一、講師が参加者の合意なしに仕様を変更する時刻**です。ためらわないでください。

```
1. そのチームの画面で npm run verify を打たせる（口頭報告を信じない）
2. 最初に落ちたものだけを見る（後続は最初の失敗の影響であることが多い）
3. 落ちている原因が「未実装」なら、その機能を今日は作らないと宣言する
4. index.ts の status は "coming-soon" のままにさせる
5. PR の「発展課題・未対応事項」に、削った項目をそのまま書かせる
```

**4 が重要です。** `status` を `"ready"` にすると、契約テスト（`tests/contract/manifest.contract.test.tsx`）が
**「`logic.test.ts` に `it(` が3件以上」** と **「画面が例外なく描画でき `GameShell` を使っている」** を要求します。
未完成のまま `"ready"` にすると確実に赤くなります。

**`status: "coming-soon"` のままでも Pull Request は出せますし、マージもできます。**
アーケードの一覧には `ComingSoonPanel` が出るだけです。
**未完成のままマージすることは失敗ではありません。**
むしろ「間に合わない範囲を正直に切って、動くものだけをマージする」のは実務そのものです。そう言い切ってください。

### 大富豪（Team F）の扱い

**大富豪は6ゲームの中で明確に最も重い**ので、最初から差をつけて配置します。

- **5名を配置する。** 他チームは3〜4名で構いません。
- **レビューは別メンバーに分担させる。**
  Team F がレビューする相手は Team A（ババ抜き）です。
  実装が押している127分に実装担当がレビューへ引き抜かれると、実装が完全に止まります。
  **Team F の中で「実装3名 / レビュー2名」に分けさせてください。**
  レビュー担当の2名は、**127分を待たずに110分ごろから Team A の Pull Request を見始めて構いません。**
- **革命は最初から削ってよい**と、70分の中間チェックポイントで先に言っておきます。
  「8切りだけで大富豪として成立します。革命は発展課題です」

なお、**大富豪をレビューするのは Team E（ダウト）** です。差分もルールも6ゲームで最大になるので、
Team E にも「レビューは2名で分担してよい」と伝えておいてください。

---

## 5. 遅延時の切り捨て順

全体が遅れているときは、**上から順に**切ります。**順番を入れ替えないでください。**

| # | 切るもの | 稼げる時間 | 判断の目安 |
|---|---|---|---|
| 1 | **発展課題を全面禁止**（`stretch-goal` の Issue を全部閉じる） | 0分（ただし脱線を防ぐ） | 70分の時点で3チーム以上が logic 未完 |
| 2 | **UI の作り込み**（CSS Modules 禁止。`GameShell` + `Hand` + `Button` だけ） | 10〜15分 | 96分の時点で2チーム以上が画面未表示 |
| 3 | **中間チェックを短縮**（5分 → 2分。`npm run status` を映すだけ） | 3分 | 開始が押している場合のみ |
| 4 | **レビュー 25分 → 18分**（1人1 PR、指摘は3点セットの1番目だけ） | 7分 | 127分の時点で Draft PR が4本以下 |
| 5 | **大会 12分 → 6分**（各ゲーム1分ずつ触る） | 6分 | 163分の時点でマージが3本以下 |

### **絶対に削らない5つ**

この5つは、**研修が10分押していても削りません。** 削った瞬間に、この研修は「ゲームを作った日」になります。

1. **Draft PR を出すこと** — 「まず不完全な状態を共有する」体験そのものです
2. **Pull Request を出すこと** — 自分の言葉で説明を書くところまで
3. **相互レビューを行うこと** — 他人のコードを**実際に動かして**指摘する経験
4. **マージすること** — 自分のコードが `main` に入り、公開される瞬間
5. **振り返りを行うこと** — 経験を言葉にしないと持ち帰れません

**5 の振り返りが一番削られやすく、一番削ってはいけないものです。**
時間が無ければ大会を全部やめて構いません。**振り返りの5分は必ず確保してください。**

### 全体が20分以上押した場合の非常手段

レビューを**同時並行**にします。

- 通常: 自分の PR を出す → 他チームの PR をレビューする（直列）
- 非常時: **PR を出した瞬間に、レビュー担当チームへその場で口頭で伝える**（`gh pr list` を待たない）
- レビューの必須項目を **「再現手順つきの指摘1件」だけ**に減らす
  （`/review` が出す3点セットのうち1番目だけ）

---

## 6. 緊急時の逃げ道（優先度順・**焦っているときに判断させない**）

**上から順に試してください。** 番号の小さいものほど影響範囲が狭く、後始末が要りません。
**4以降は研修後の後始末が必要です。**

### 1. Pull Request 単位の管理者マージ（**最初にこれ**）

CI が赤い / 承認が足りない / 時間が無い — **理由を問わず、まずこれで1本だけ通します。**
ブランチ保護は `enforce_admins: false` なので、講師（管理者）は貫通できます。
**影響はその PR 1本だけ**で、他の5チームの保護は生きたままです。

```powershell
gh pr merge <番号> --squash --admin --delete-branch
```

### 2. 承認が足りない

レビュアーが席を外している、承認の操作が分からない、などのときです。

```powershell
gh pr review <番号> --approve --body "講師承認"
```

**注意: 自分が作成した Pull Request は自分では承認できません**（GitHub の仕様）。
講師が作った PR（7章の検証用など）を通したいときは、1（`--admin`）を使ってください。

### 3. CI 自体が壊れた（GitHub Actions の障害、Node のバージョン変更など）

**6チーム全部が赤い**ときだけこれを使います。1チームだけ赤いのは CI の故障ではありません。

```powershell
# 必須チェックだけを一時的に外す（レビュー必須は残る）
gh api -X DELETE "repos/Daisuke0719/card_arcade/branches/main/protection/required_status_checks"
```

**研修後に必ず戻します。**

```powershell
gh api -X PUT "repos/Daisuke0719/card_arcade/branches/main/protection" --input .github/branch-protection.json
```

### 4. 保護を丸ごと外す（**最終手段**）

3 でも通らないときだけ。**残り10分を切っていて、まだ1本もマージできていない**ような状況専用です。

```powershell
gh api -X DELETE "repos/Daisuke0719/card_arcade/branches/main/protection"
```

**→ 研修後に必ず戻してください。**

```powershell
gh api -X PUT "repos/Daisuke0719/card_arcade/branches/main/protection" --input .github/branch-protection.json
gh api "repos/Daisuke0719/card_arcade/branches/main/protection" --jq ".required_status_checks.contexts"
```

**この復旧コマンドを、当日の朝にメモ帳へコピーしておいてください。** 焦っているときには探せません。

### 5. 誤ってマージしたものを巻き戻す

`main` が壊れると6チーム全員が止まります。
**`git reset` ではなく `revert` を使ってください**（履歴を書き換えると他の5チームの作業が壊れます）。

```powershell
git switch main
git pull

# マージコミットの SHA を調べる
git log --oneline --merges -5

# 巻き戻す（-m 1 は「main 側を残す」の意味）
git revert -m 1 <マージコミットSHA>
git push
```

**Squash マージにしている場合はマージコミットになりません。** その場合は `-m 1` を付けずに実行します。

```powershell
git log --oneline -5
git revert <コミットSHA>
git push
```

**巻き戻したチームには必ず理由を説明してください。** 黙って消すと、そのチームは以降の研修に参加しなくなります。

### 6. ハーネス全停止（`CARD_ARCADE_HARNESS=off`）

特定の1台で、フックが誤作動して作業が完全に止まった場合です。

**Claude Code を起動する前に**、その端末の PowerShell で次を実行します。

```powershell
$env:CARD_ARCADE_HARNESS = "off"
claude
```

- 効くのは **`.claude/hooks/` のフック**と **`.githooks/pre-commit`** と **`npm run scope`** だけです。
- **CI は残ります。** 範囲外を触れば Pull Request は赤くなります。**逃げ切れません。**
- **Claude Code のセッションの中からは設定できません。** `guard-bash.mjs` が
  `CARD_ARCADE_HARNESS=off` を含むコマンドを拒否します。必ず**起動前**に、講師が端末で設定してください。
- 元に戻すときは PowerShell を閉じるか、次を実行します。

  ```powershell
  Remove-Item Env:CARD_ARCADE_HARNESS
  ```

### 7. PC が壊れた参加者が出た

**同チーム内で1台を共有し、Driver を交代制にします。** これが最も速い復旧です。

- 壊れた人の GitHub アカウントで push する必要はありません。**チームの成果は Pull Request 1本に集約されます。**
- 交代のたびに `/handoff` を打たせてください。引き継ぎメモが出るので、交代コストがほぼゼロになります。
- 予備 PC を1台用意しておくと安心ですが、**共有で十分回ります。**
  そもそもこの研修は「1人が全部操作しない」ことを目指しているので、共有はむしろ望ましい状態です。

### 補足A. 範囲チェックだけが原因で赤い PR を、PR 単位で救う

**1（`--admin`）を使う前に検討できる、より影響の小さい手**です。

その Pull Request に **`harness:override` ラベル**を付けると、CI の範囲チェックが**警告のみ**に降格します
（`.github/workflows/ci.yml` がラベルを見て `scope-guard.mjs` に `--warn-only` を渡します）。
lint / 型 / テスト / ビルドは**通常どおり必須のまま**です。

```powershell
gh pr edit <番号> --add-label "harness:override"
gh pr checks <番号> --watch
```

**このラベルの存在は参加者に教えないでください。** 教えた瞬間にハーネスが機能しなくなります。

### 補足B. 当日の朝、メモ帳にコピーしておくコマンド

```powershell
# 進み具合を投影する
npm run status

# Pull Request を1本だけ強引に通す
gh pr merge <番号> --squash --admin --delete-branch

# 承認を入れる
gh pr review <番号> --approve --body "講師承認"

# 保護を戻す（研修後に必ず実行）
gh api -X PUT "repos/Daisuke0719/card_arcade/branches/main/protection" --input .github/branch-protection.json
```

---

## 7. 研修前の検証手順（**省略不可**）

**本番の前に30〜40分で実施してください。** やることは1つだけです。

> **わざと壊して、止まるはずのものが止まるかを確認する。**

「動くこと」を確認しても意味がありません。この研修で価値があるのは「**止まること**」です。
**止まらなかった項目は、当日必ず誰かがそこを通り抜けます。**

準備として、講師の端末で作業用のブランチを1本切ります。

```powershell
git switch main
git pull
git switch -c feature/speed
```

### Layer 2 — Claude Code のフックが「その場で」止めるか

**Claude Code を起動して**、次を1つずつ依頼します。`feature/speed` にいる状態で行ってください。

| # | Claude Code に依頼する内容 | 期待する結果 |
|---|---|---|
| 2-1 | 「`src/core/index.ts` に便利な関数を1つ足して」 | **拒否。**「src/core/index.ts は運営が管理している場所なので変更できません」＋報告テンプレートが出る |
| 2-2 | 「`src/games/babanuki/logic.ts` を直して」 | **拒否。**「Team A（ババ抜き）の担当です。今のブランチ feature/speed の担当は speed です」 |
| 2-3 | 「`src/games/speed/logic.ts` にコメントを1行足して」 | **通る。**（ここが通らないと当日は誰も作業できません） |
| 2-4 | 「`npm install lodash` を実行して」 | **拒否。**「必要な機能は @core と @ui にすべて揃っています」 |
| 2-5 | 「`echo "test" >> src/core/index.ts` を実行して」 | **拒否。**「src/core は運営が管理している場所です。コマンド経由でも変更できません」 |
| 2-6 | 「`.claude/settings.json` を書き換えてフックを外して」 | **拒否。**「ハーネスの設定を変更・無効化することはできません」 |
| 2-7 | 「`git commit --no-verify -m "x"` して」 | **拒否。**「--no-verify でコミット前のチェックを飛ばすことはできません」 |
| 2-8 | 「`vitest` を実行して」 | **拒否。**「監視モードになり、実行が終わらなくなります。npm test を使ってください」 |

**2-3 が通らない場合**は、`harness/config.json` の `protectedPaths` に
`src/games/**` のような広すぎるパターンが混ざっています。当日までに必ず直してください。

**フックが1つも動かない場合**は、フックの承認ダイアログを承認していません。
セッション開始時に「# 今のセッションの前提」が出るかどうかで判別できます。

Claude Code を終了し、作業ツリーを元に戻します。

```powershell
git restore --source=HEAD --staged --worktree -- .
git status
```

### Layer 3 — ESLint と契約テストと pre-commit が「コミット前に」止めるか

ここからは **Claude Code を使わず、普通の PowerShell とエディタで**行います
（Layer 2 が先に止めてしまうため、Layer 3 だけを試すには手で書く必要があります）。

| # | わざと壊す内容 | 実行するコマンド | 期待する結果 |
|---|---|---|---|
| 3-1 | `src/games/speed/logic.ts` に `Math.random()` を使う行を足す | `npm run lint` | **error。**「Math.random() は使えません。乱数は引数で Rng を受け取り、テストでは createRng(seed) で固定します」 |
| 3-2 | `src/games/speed/index.ts` の `id: "speed"` を `id: "speeed"` に変える | `npm test` | **失敗。**「id がフォルダ名と一致している」の契約テストが落ちる |
| 3-3 | `src/games/speed/README.md` から `## 遊び方` の見出しを消す | `npm test` | **失敗。**「README に決められた見出しがある」が落ち、どの見出しが無いかまで出る |
| 3-4 | `src/games/speed/logic.ts` に `// eslint-disable-next-line no-restricted-imports` を書き、続けて `import { x } from "../example-game/logic";` を足す | `npm run lint` → `npm test` | **lint は通る。しかしテストが落ちる。**「eslint のルールを無効化していない」と「自分のフォルダの外を相対パスで参照していない」の2件 |
| 3-5 | `src/games/speed/logic.ts` に `Date.now()` を足す | `npm run lint` | **error。**「Date.now() は使えません」 |
| 3-6 | `src/games/speed/logic.ts` に `import { Card } from "@ui";` を足す | `npm run lint` | **error。**「logic.ts と cpu.ts は『純粋なルール』だけを書く場所です」 |
| 3-7 | `src/core/index.ts` を1行変えて `git add -A` し、コミットする | `git commit -m "test"` | **pre-commit が止める。**「コミットを中止しました」 |

**3-4 が最重要です。** ESLint はコメント1つで無効化できてしまうので、
**契約テストという二重の網**を張ってあります。ここが止まらないなら Layer 4 が機能していません。

毎回、元に戻してください。

```powershell
git restore --source=HEAD --staged --worktree -- .
```

### Layer 4 / 5 — **CI がマージを止めるか**（このステップの成果物を当日使います）

**ここで作る失敗 Pull Request は close せずに残してください。** 当日の Step 4 デモの教材になります。

```powershell
git switch main
git switch -c feature/harness-check
```

エディタで `src/core/index.ts` の末尾にコメントを1行足して保存します。

```powershell
git add -A

# 手元の pre-commit をわざと飛ばす（Claude Code の外なので --no-verify が使えます）
git commit --no-verify -m "test: ハーネスの検証用（絶対にマージしないこと）"
git push -u origin feature/harness-check

# Draft ではなく通常の Pull Request にする
# （Draft だとマージボタンが Draft 由来で押せず、赤い CI が原因だと分かりにくいため）
gh pr create --title "ハーネス検証用 — 絶対にマージしないこと" --body "研修当日 Step 4 のデモ教材です。src/core をわざと変更してあり、CI が赤くなることを見せるために残しています。マージしないでください。"

gh pr checks --watch
```

**確認すること**

- [ ] `verify` が **赤**になる
- [ ] CI のログに `✗ 担当範囲の外が変更されています` が出て、**手元の `npm run scope` とまったく同じ文言**である
- [ ] GitHub の PR 画面で **「Merge pull request」ボタンが押せない**
- [ ] 「Required statuses must pass」と「Review required」の両方が表示されている

確認できたら、**この Pull Request は open のまま残します。**

```powershell
gh pr edit --add-label "core-change"
git switch main
```

**当日、この PR 番号をメモしておいてください。** Step 4 のデモで `gh pr view <番号> --web` を打ちます。

この検証の結論は、**「手元の網は抜けられるが、CI は抜けられない」**です。
`--no-verify` が Claude Code の中では使えないこと（2-7）と合わせて説明すると、1章 1-3 の話がそのまま通ります。

### Windows 固有 — 改行コードで PR 差分が壊れないか

**6台の Windows 端末で改行が揺れると、Pull Request の差分がファイル全体になってレビュー不能になります。**
これは当日いちばん取り返しがつかない事故です。必ず確認してください。

```powershell
# 悪条件をわざと作る
git config --global core.autocrlf true

# 別の場所にまっさらな状態で clone する
git clone https://github.com/Daisuke0719/card_arcade.git C:\temp\ca-crlf-check
cd C:\temp\ca-crlf-check
npm ci
git status
```

**期待する結果: `nothing to commit, working tree clean`。**

`.gitattributes` に `* text=auto eol=lf` を書いてあるので、`core.autocrlf=true` の端末でも
作業ツリーは LF のままになり、clone 直後に差分は出ません。

**ここで大量の変更が出たら、当日、全参加者の `npm run scope` が最初から赤になります。**
`.gitattributes` が正しく取り込まれているかを確認してください。

確認後、後片付けします。

```powershell
cd C:\Users\daisu\project\card_arcade
Remove-Item -Recurse -Force C:\temp\ca-crlf-check
```

### 検証チェックリスト

- [ ] Layer 2: 2-1 〜 2-8 すべて期待どおり（**2-3 は「通る」が正解**）
- [ ] Layer 3: 3-1 〜 3-7 すべて期待どおり（**3-4 で lint は通り、テストが落ちる**）
- [ ] Layer 4 / 5: 失敗 PR で CI が赤くなり、マージボタンが押せない
- [ ] 失敗 PR を **open のまま残した**。PR 番号: `#______`
- [ ] Windows: `core.autocrlf=true` の端末で clone → `npm ci` → `git status` が clean
- [ ] `npm run status` と `node scripts/score.mjs` が講師の端末で動く
- [ ] 検証で作った変更がリポジトリに残っていない（`git status` が clean）

---

## 8. 想定トラブルと対応

### 参加者が自力で解決できるもの

**`docs/troubleshooting.md`（T-01〜）を見せてください。** 講師が説明する必要はありません。
`/stuck` を打つと、AI が該当する T-xx 番号まで探して出します。

代表的なもの:

| 症状 | 対処 |
|---|---|
| `npm run scope` が赤い | 出力された `git restore ...` を**そのまま**実行する |
| 一覧に自分のゲームが出ない | `index.ts` の `export const game` と `id` を確認（`src/games/CLAUDE.md`） |
| CPU が1回しか動かない | `useCpuTurn` に渡す関数を `useCallback` で固定している。インラインで渡す |
| テストが時々落ちる | `Math.random()` を使っている。`createRng(seed)` を引数で渡す |
| lint が「@ui は使えません」と言う | 画面の処理を `logic.ts` に書いている。`.tsx` へ移す |
| コミットできない | pre-commit が範囲外を検出している。`npm run scope` を見る |
| `npm ci` が失敗する | Node のバージョン。`npm run doctor` を打つ |

### **講師しか対応できないもの**

次の4種類は、参加者が何をしても直りません。**症状を聞いた瞬間に講師が動いてください。**

#### (1) 権限（403 / Permission denied）

**当日いちばん多い講師案件です。** ほぼ100%、collaborator の招待を承諾していないことが原因です。

```powershell
# 未承諾の一覧
gh api "repos/Daisuke0719/card_arcade/invitations" --jq ".[].invitee.login"

# 招待し直す
gh api -X PUT "repos/Daisuke0719/card_arcade/collaborators/<GitHubユーザー名>" -f permission=push
```

招待メールを開かせて承諾させます。**メールが見つからない場合は、本人のブラウザで
https://github.com/Daisuke0719/card_arcade を開くと画面上部に承諾ボタンが出ます。**

その場で解決しない場合の回避策: **同チームの承諾済みの人が Driver を代わる。**
チームの成果は Pull Request 1本なので、これで作業は続けられます。

#### (2) ブランチ保護（マージできない / チェックが終わらない）

| 症状 | 原因 | 対処 |
|---|---|---|
| 「Expected — Waiting for status to be reported」が消えない | 必須チェックの名前が実際のジョブ名と違う | 6章 3 で必須チェックを外すか、`contexts` を実名に直す |
| CI は緑なのにマージできない | CODEOWNERS が所有する場所を触っている | `gh pr diff <番号>` で範囲を確認。運営領域を触っているなら差し戻す |
| 承認済みなのにマージできない | 単に CI がまだ実行中 | `gh pr checks <番号> --watch` で待つ |
| 何をやってもマージできない | — | 6章 1 の `--admin` で通す |

#### (3) GitHub Pages（公開されない / 404 になる）

```powershell
# デプロイの実行状況
gh run list --workflow=deploy-pages.yml --limit 5

# 失敗しているログを見る
gh run view --log-failed
```

| 症状 | 原因 | 対処 |
|---|---|---|
| ワークフローが起動しない | Pages の Source が `Deploy from a branch` になっている | Settings > Pages で **GitHub Actions** に変える |
| 404 になる | 初回デプロイがまだ終わっていない | 2〜3分待つ。`gh run list` で `completed` を確認 |
| 画面は出るが真っ白 | `base` の設定 | `vite.config.ts` の `base: "./"` を確認（変更不要のはず） |
| マージしたのに反映されない | デプロイが順番待ちしている | `deploy-pages.yml` は `cancel-in-progress: false` なので順に流れます。**待てば必ず反映されます** |

**大会（163分〜）の直前には、必ず講師が公開 URL を開いて確認してください。**
6本目のマージからデプロイ完了まで2〜3分かかります。**マージは163分より前に終わらせてください。**

#### (4) ハーネス自体の誤作動

「正しいことをしているのに止められた」という報告が来た場合です。

1. **まず本当に誤作動か確かめます。** 9割は正しく止まっています（担当外を触っている）。
   `npm run scope` の出力をそのまま見せてもらってください。
2. 本当に誤作動なら、その端末だけ 6章 6（`$env:CARD_ARCADE_HARNESS = "off"`）で止めます。
3. **CI は残るので、範囲外を触れば結局赤くなります。** そのことを本人に必ず伝えてください。
4. 範囲チェックだけが原因で PR が赤いなら、6章 補足A の `harness:override` ラベルで PR 単位に救えます。

---

## 9. 評価

### 配点

| 評価項目 | 配点 |
|---|---|
| Issue の必須要件を満たした | 20 |
| 担当範囲を守った | 10 |
| 適切なテストを作成した | 20 |
| Pull Request を分かりやすく書いた | 15 |
| 他チームのレビューを行った | 15 |
| レビュー指摘を反映した | 10 |
| UI とゲームとしての工夫 | 10 |
| **合計** | **100** |

**「ゲームが完成したか」に直接の配点はありません。** これは意図的です。
100点のうち**60点**（テスト20 + PR15 + レビュー15 + 反映10）が**共同開発の作法**に振られています。
1章の目的をそのまま数字にしたものです。

### 集計の材料

機械が数えられる部分は、2つのコマンドで集まります。**評価の前に両方を実行してください。**

```powershell
# 6チームの PR / CI / レビュー / マージ の状況（当日の進行管理にも使う）
npm run status

# 数えられる評価項目だけを集める（研修後の採点用）
node scripts/score.mjs
```

`node scripts/score.mjs` が出すのは次の6つです。

- 完成宣言（`index.ts` が `status: "ready"` になっているか）
- **テスト件数**（`logic.test.ts` と `cpu.test.ts` の `it(` の数）
- Pull Request の有無と状態
- **受けたレビュー件数**
- **PR 本文の文字数**
- 他チームへのレビュー総数（リポジトリ全体の参考値）

### 機械が測れないもの — **ここは人間が見る**

`score.mjs` は最後にこう出力します。

> ※ テストの中身の妥当性・命名の分かりやすさ・レビューの質は機械では測れません。
> そこは相互レビューと講師の目で評価してください。

**この線引き自体が、この研修で伝えたい設計思想です。**
数えられるものだけを機械に任せ、質は人間が見る。CI の設計もまったく同じ考え方でできています。

配点への当てはめ方の目安:

| 項目 | 機械で見る | 人間で見る |
|---|---|---|
| 必須要件を満たした 20 | `status: "ready"` / CI が緑 | Issue の必須要件と実装の突き合わせ。**実際に遊んでみる** |
| 担当範囲を守った 10 | CI の範囲チェックが緑 / `harness:override` を使っていない | — |
| 適切なテストを作成した 20 | テスト件数（3件が下限） | **境界値と異常系があるか。** 正常系だけなら半分以下 |
| PR を分かりやすく書いた 15 | 本文の文字数 / `Closes #` の有無 | **「レビューしてほしい点」が自分の言葉で具体的か** |
| 他チームのレビューを行った 15 | レビュー件数 | **再現手順が書かれているか。**「LGTM」だけなら0点 |
| レビュー指摘を反映した 10 | 指摘後のコミット数 | **「直さない」判断に理由が書かれているか**（理由があれば満点） |
| UI とゲームの工夫 10 | — | 大会で実際に遊んで判断 |

**「直さない」を選んだこと自体は減点しないでください。**
理由を説明できているかだけを見ます（`/fix-review` も参加者にそう指示しています）。

### 採点の実務

**研修中に採点しないでください。** 講師の時間は介入に使います。

`npm run status` のスクリーンショットを **70分 / 118分 / 152分 / 175分** の4回撮っておき、
研修後に `node scripts/score.mjs` の出力と合わせて採点します。
この4枚があれば、「どのチームがどこで詰まったか」まで後から再現できます。

---

## 10. 表彰（175〜180分）

**振り返りの前に3分で行います。** 6チームあるので、**賞も6つ用意して全チームが何かを取る**ようにしてください。
「うちだけ何もなかった」を作らないことが目的です。

| 賞 | 選び方 |
|---|---|
| **ベストゲーム賞** | 大会（163〜175分）で最も遊ばれたゲーム。挙手で決めてよい |
| **ベストUI賞** | 見た目と分かりやすさ。`src/styles/tokens.css` の `--ca-*` を使って統一感が出ているものを優先 |
| **ベストテスト賞** | **件数ではなく、境界値と異常系を見ているか。**「同じ数字」「最後の1枚」「0枚」「二重クリック」を押さえているものを選ぶ |
| **ベストレビュー賞** | **下の数えられる基準で選ぶ**（次項） |
| **ベストチームワーク賞** | Driver 交代の回数（`/handoff` を使った回数）と、机間巡視で見た様子 |
| **最も意外なバグ賞** | 大会中に見つかった想定外のバグ。**見つけた人ではなく、バグを作ったチームを表彰する** |

### ベストレビュー賞は「数えられる基準」で選ぶ

**「一番いいレビューをしたチーム」では選べません。** 印象で選ぶと、声の大きいチームが取ります。
**次の2つを数えて、合計が最も多いチームを選んでください。**

1. **再現手順つき指摘の数**
   「〇〇を〇回すると〇〇になります。Issue では〇〇のはずです」の形で書かれたコメントの数。
   **「ここが怪しいです」「LGTM」は数えません。**
2. **採用された `suggestion` の数**
   GitHub の suggestion 機能で提案し、**相手が「Commit suggestion」を押したもの**の数。

数え方:

```powershell
# 各 Pull Request に付いたコメントを一覧で見る
gh pr view <番号> --comments

# レビュー件数の参考値
node scripts/score.mjs
```

**この基準は研修の最初（チーム発表のあたり）に予告しておいてください。**
「レビューはこの2つで数えます」と先に言っておくと、127分からのレビューの質がはっきり変わります。
`/review` が「必ず3点セットを出す」「再現手順が書けない指摘は投稿しない」と指示しているのは、
この基準に直結させるためです。

### 表彰の締め方

賞を配ったあと、**公開 URL をもう一度全員で開いてください。**

**https://daisuke0719.github.io/card_arcade/**

> 「180分前は、ここにお手本が1本あるだけでした。今は6本あります。
> **1人で作ったものは、1つもありません。**」

そのまま5分の振り返りに入ります。聞くのは次の3つで十分です。

1. **今日、機械に止められて助かったことは何ですか**
2. **他人のコードをレビューして、自分のコードについて気づいたことは何ですか**
3. **明日から自分のチームで1つだけ真似するとしたら、どれですか**

3つ目の答えは、その場で誰かに書き取らせて共有してください。
**「持ち帰る1つ」を言葉にした人だけが、実際に持ち帰ります。**
