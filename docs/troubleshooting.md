# トラブル対処集（T-01 〜 T-35）

この文書では、研修中に起こり得る問題と対処方法を番号別に説明します。
CI の Summary、Issue、または講師の案内に記載された番号を索引から探してください。

## 使い方

1. `npm run doctor` を実行し、環境に関する主な問題を確認する
2. 症状に近いものを下の索引から探す
3. 「対処」のコマンドを上から順に実行する
4. 解決しなければ、作業を中断して講師に相談する（別の方法で制限を回避しない）

掲載しているコマンドは、PowerShell で実行できます。

このページのコマンドは、特に指定がない限り「ターミナルB」（参加者が操作する画面）で実行します。
ターミナルA（Claude Code）で実行を依頼する場合は、各項目に掲載しているプロンプトを使用してください。
`npm run dev` のように、ターミナルAでは実行できないコマンドもあります（→ T-33）。

作業を続けられない場合は、状況を整理したうえで講師に相談してください。

## 索引

| 分類     | 番号 | 症状                                                               |
| -------- | ---- | ------------------------------------------------------------------ |
| 環境     | T-01 | Node.js のバージョンが違う                                         |
| 環境     | T-02 | `npm ci` が失敗する                                                |
| 環境     | T-03 | ポート 5173 が使用中で `npm run dev` が起動しない                  |
| 環境     | T-04 | clone の直後に `git status` が全ファイル変更になる                 |
| 環境     | T-05 | パスに日本語やスペースが含まれていて動かない                       |
| 環境     | T-06 | PowerShell が「スクリプトの実行は無効」と言う                      |
| 環境     | T-29 | 日本語を含む `.ps1` が構文エラーになる（セットアップ用スクリプト） |
| ハーネス | T-07 | Claude Code が「変更できません」と表示する                         |
| ハーネス | T-08 | フックが動いていないように見える                                   |
| ハーネス | T-09 | 範囲チェックが失敗する                                             |
| ハーネス | T-10 | `pre-commit` で止まってコミットできない                            |
| ハーネス | T-11 | 「まだ npm run verify を通していない」と表示される                 |
| ハーネス | T-12 | 依存の追加を拒否された                                             |
| ハーネス | T-33 | Claude Code が「`npm run dev` は実行できません」と表示する         |
| ハーネス | T-34 | Claude Code が反応しなくなった / プロンプトが返ってこない          |
| ハーネス | T-35 | 他の人のブランチでコードを変更しようとして拒否された               |
| 実装     | T-13 | アーケード一覧に自分のゲームが出ない                               |
| 実装     | T-14 | ファイルを足したのに画面に反映されない                             |
| 実装     | T-15 | `@core` が解決できない                                             |
| 実装     | T-16 | CPU が1回しか動かない                                              |
| 実装     | T-17 | テスト結果が実行ごとに変わる                                       |
| 実装     | T-18 | `npm test` が終わらない                                            |
| 実装     | T-19 | lint が `logic.ts` の書き方を拒否する                              |
| 実装     | T-20 | `status` を `"ready"` にしたらテストが失敗した                     |
| CI       | T-21 | 手元では成功するのに CI の `verify` が失敗する                     |
| CI       | T-22 | `package.json / package-lock.json が変更されています`              |
| CI       | T-23 | 必須チェック `verify` が pending のまま                            |
| CI       | T-31 | CI で「まだ作業ブランチを作っていません」と出る                    |
| GitHub   | T-24 | `gh` のトークンに権限が足りない                                    |
| GitHub   | T-25 | リポジトリにアクセスできない（403）                                |
| GitHub   | T-26 | 公開ページ（Pages）が 404                                          |
| GitHub   | T-27 | マージボタンが押せない                                             |
| GitHub   | T-28 | `gh pr create` が失敗する / Pull Request の向きが違う              |
| GitHub   | T-30 | `git push` が `workflow` スコープ不足で拒否される                  |
| GitHub   | T-32 | Pages のデプロイが `Get Pages site failed` で失敗する              |

---

## 環境

### T-01. Node.js のバージョンが違う

**症状**
`npm ci` や `npm run dev` を実行すると、`Unsupported engine` または原因の分からない構文エラーが表示される。
`npm run doctor` が `Node.js のバージョン` で `✗` になる。

**原因**
このリポジトリは Node.js 22 以上が前提です（`package.json` の `engines`、`.nvmrc` は `22.15.0`）。

**対処**

```powershell
node -v
```

`v22.` で始まっていなければ入れ替えます。

```powershell
winget install OpenJS.NodeJS.LTS
```

インストール後はPowerShellを開き直してから、もう一度確認します。

```powershell
node -v
npm run doctor
```

複数バージョンを使い分けている場合は、`.nvmrc` に合わせてください（`22.15.0`）。

---

### T-02. `npm ci` が失敗する

**症状**
`npm ci` の途中でエラーになる。`npm ERR! cb() never called!` や、`node_modules` が中途半端に残る。

**原因**
ネットワークの一時的な失敗か、前回の `npm install` で `package-lock.json` がずれています。

**対処**

`node_modules` を削除してから、依存パッケージを入れ直します。

```powershell
Remove-Item -Recurse -Force node_modules
npm ci
```

`package-lock.json` を書き換えてしまっていた場合は、先に戻します。

```powershell
git restore package.json package-lock.json
npm ci
```

`npm install` は使用しません。`package-lock.json` が変わるとCIが失敗します（T-22）。
プロキシ環境でネットワークエラーになる場合は、社内の設定が必要なので講師に相談してください。

---

### T-03. ポート 5173 が使用中で `npm run dev` が起動しない

**症状**
`Port 5173 is in use` と出る、または別のポート（5174）で開いて古い画面が表示される。

**原因**
前に起動した開発サーバーが残っています。`Ctrl + C` を押さずにターミナルを閉じたときによく起きます。

**対処**

5173番ポートを使用しているプロセスを調べて停止します。

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen | Select-Object OwningProcess
Stop-Process -Id <上に出た番号>
npm run dev
```

プロセスを停止できない場合や番号が表示されない場合は、別のポートで起動します。

```powershell
npm run dev -- --port 5180
```

#### 二重起動で 5174 になっていた場合

開発サーバーは動作しているのに変更が画面へ反映されない場合は、ブラウザで開いているポートを確認します。
ブラウザで開いている URL が `http://localhost:5174/` になっていないか確認します。

5173番ポートが使用中の場合、開発サーバーは5174番ポートで起動します。
このとき2つの開発サーバーが動作しており、一方では変更前のコードが配信されています。
`npm run dev` を再実行した際に、既存のプロセスを停止せず2つ目を起動すると発生します。

以前の手順では、Claude Codeに画面確認を依頼した際、ターミナルAでも `npm run dev` が起動する場合がありました。
現在はハーネスがターミナルAからの `npm run dev` を拒否します（→ T-33）。
古い手順書を参照し、開発サーバーを2回起動した場合にも発生します。

**対処** — 5173番と5174番の両方を調べ、不要なプロセスを停止してから1つだけ起動し直します。

```powershell
Get-NetTCPConnection -LocalPort 5173,5174 -State Listen | Select-Object LocalPort,OwningProcess
```

表示された番号のうち、現在使用しているターミナルB以外のプロセスを停止します。

```powershell
Stop-Process -Id <止めるほうの番号>
```

その後、ターミナルBで開発サーバーを1つだけ起動し、ブラウザで `http://localhost:5173/` を開き直します。

```powershell
npm run dev
```

開発サーバーは、ターミナルBで起動した1つだけを使用します。

---

### T-04. clone しただけなのに `git status` が全ファイル変更になる

**症状**
何も編集していないのに、`git status` に数百件の変更が出る。差分を見ると中身は同じに見える。

**原因**
改行コードが原因です。このリポジトリでは `.gitattributes` でLFに統一していますが、
Windowsの `core.autocrlf=true` の設定によって、全ファイルがCRLFへ変換され、変更として扱われる場合があります。
この状態では、範囲チェック（T-09）が全ファイルを違反として検出します。

**対処**

残す必要のある変更がないことを確認してから実行します（3行目のコマンドは作業ツリーの変更を破棄します）。

```powershell
git config --global core.autocrlf false
git rm --cached -r .
git reset --hard
git status
```

`git status` に変更が表示されなければ、改行コードの問題は解消しています。
残す必要のある変更がある場合は、先に `git stash` で退避してから実行します。

---

### T-05. パスに日本語やスペースが含まれていて動かない

**症状**
`npm ci` や `npm run dev` が失敗し、エラーに表示されたパスの一部が文字化けしている。
OneDriveによる自動同期のため、`git status` の結果が安定しない。

**原因**
`C:/Users/山田 太郎/OneDrive/デスクトップ/card_arcade` のようなパスです。
日本語やスペースを含むパス、OneDriveによる同期が、処理に影響する場合があります。

**対処**

短く、ASCII文字だけで構成されたパスへcloneし直します。

```powershell
mkdir -Force $HOME/dev
cd $HOME/dev
git clone https://github.com/Daisuke0719/card_arcade.git
cd card_arcade
npm ci
npm run doctor
```

作業中の変更がある場合は、先にpushするか、講師に相談してからcloneし直します。

---

### T-06. PowerShell が「スクリプトの実行は無効」と言う

**症状**

```
npm : このシステムではスクリプトの実行が無効になっているため、ファイル ...npm.ps1 を読み込めません。
```

**原因**
PowerShell の実行ポリシーが `Restricted` になっています（`npm` や `gh` は `.ps1` 経由で動きます）。

**対処**

現在の設定を確認し、`RemoteSigned` に変更します（管理者権限は不要です）。

```powershell
Get-ExecutionPolicy -List
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

確認が表示されたら `Y` を入力します。PowerShellを開き直してから、もう一度実行します。
組織の設定によって変更できない場合は、講師に相談します。

---

### T-29. 日本語を含む `.ps1` が構文エラーになる（セットアップ用スクリプト）

**症状**
セットアップ用のPowerShellスクリプトを実行すると、内容に問題がないように見えても構文エラーが表示される。

```
発生場所 ...setup-github.ps1:12 文字:1
+ Write-Host "ラベルを作成します"
文字列に終端記号 " がありません。
```

日本語の部分が `���` のように文字化けして表示されることもあります。

**原因**
PowerShell 5.1（Windowsに標準で含まれるもの）は、BOMなしUTF-8の `.ps1` をUTF-8として扱わない場合があります。
そのため、日本語のコメントやメッセージを含むスクリプトが正しく解析されないことがあります。
スクリプトの内容に問題がなくても、読み込み方法によって構文エラーが発生する場合があります。

**対処**

このリポジトリのセットアップでは、PowerShellスクリプトではなくNode.js版を使用します。

```powershell
node scripts/setup-github.mjs all
```

個別に実行する場合は、次のコマンドを使用します。

```powershell
node scripts/setup-github.mjs labels
node scripts/setup-github.mjs issues
```

Node.js版では、この文字コードの問題は発生しません。
セットアップ用の `.ps1` は廃止されています。古い手順書に `.ps1` が記載されている場合は、
`node scripts/setup-github.mjs` を使用します。

この作業は講師が事前に行います。参加者が実行する必要はありません。
参加者のターミナルA（Claude Code）では、9人分の設定を一括で変更するため、このコマンドは拒否されます。

---

## ハーネス

### T-07. Claude Codeが「変更できません」と表示する

**症状**
ファイルの変更を依頼すると、Claude Codeが編集せずに次のメッセージを表示する。

```
src/core/cards/index.ts は運営が管理している場所なので変更できません。

編集してよいのは src/games/<自分のゲームID>/ の中だけです。

共通基盤への変更が必要かもしれません。次の形式で参加者に報告してください:

  - やりたいこと:
  - 足りないと思うもの:
  - ゲーム側だけで実現する案（あれば）:
```

**原因**

`.claude/hooks/guard-scope.mjs` が、書き込み先を `harness/config.json` の `protectedPaths` と照合し、担当範囲外への書き込みを拒否しています。表示されるメッセージは3種類あります。

| メッセージ                                     | 意味                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| 「運営が管理している場所なので変更できません」 | `src/core/` `src/components/` `docs/` `scripts/` など、9人が共有する場所 |
| 「どのゲームフォルダにも属していません」       | `src/games/<ゲームID>/` の外に新しいファイルを作ろうとした               |
| 「◯◯ の担当です」                              | 他の人のゲームフォルダ（→ T-35）                                         |

なお、「まだ作業ブランチを作っていません」は拒否ではなく確認です（`y` / `n` が表示されます）。
`n` を選び、`git switch -c feature/<ゲームID>` を実行してから、もう一度編集を依頼します。

**対処**

1. メッセージの3番目の段落にある「次にどうするか」を確認します。
2. `src/core/index.ts` と `src/components/index.ts` をもう一度読み、
   既存の関数を組み合わせて実現できるか確認します。

ターミナルAでは、次のプロンプトを使用できます。

```text
src/core と src/components の公開 API を読んで、いまやりたいことが
既存の関数の組み合わせで実現できるかどうかだけ調べてください。
読むだけで、ファイルは1つも変更しないでください。
できる場合は使う関数名と組み合わせ方を、できない場合は「何が足りないか」を1つだけ挙げてください。
```

3. それでも共通基盤の変更が必要な場合は、上の報告フォーマットを記入して講師に相談します。

`sed -i`、リダイレクト、`cp` での上書きなど、別の方法で制限を回避しないでください。
`guard-bash.mjs` も同じ操作を検査します。ローカルで実行できた場合でも、CIでは検証が失敗します。

---

### T-08. フックが動いていないように見える

**症状**
担当範囲の外を編集しても拒否されない。セッションを開始しても「今のセッションの前提」が表示されない。
`npm run dev` を頼んだのに、拒否メッセージではなく普通に起動しようとする。

**原因**
主な原因は次の4つです。

1. `.claude/settings.json` を読み込む前のセッションが残っている（設定変更後はClaude Codeの再起動が必要）
2. 環境変数 `CARD_ARCADE_HARNESS=off` が残っている（講師が緊急時に使用する設定。参加者は使用しない）
3. リポジトリのルート以外のフォルダで Claude Code を起動した（`.claude/` が見つかりません）
4. `node` にパスが通っていない（フックは `node` で動いています）

**対処**

まず環境変数を調べます。

```powershell
$env:CARD_ARCADE_HARNESS
```

値が表示された場合は環境変数を削除し、ターミナルAを開き直します。

```powershell
Remove-Item Env:CARD_ARCADE_HARNESS
```

起動した場所を確かめます。ここがリポジトリのルートでなければ、`cd` してから起動し直します。

```powershell
git rev-parse --show-toplevel
node -v
```

フック単体の動作は、次のコマンドで確認できます（拒否メッセージの JSON が表示されれば正常です）。

```powershell
node .claude/hooks/guard-bash.mjs
```

このコマンドは標準入力を待ちます。何も入力せず、`Ctrl + C` で終了できます。
エラーが表示されず待機状態になれば、フック自体は動作しています。

フックを再開できない場合でも、`npm run verify` と CI（Layer 4・5）で変更内容を検査できます。
`npm run verify` が成功しない限りマージできないため、
範囲違反や純粋性違反は、遅くとも Pull Request の CI で検出されます。
フックの動作に問題がある場合は、講師に状況を伝えます。

---

### T-09. 範囲チェックが失敗する

**症状**
`npm run scope` / `npm run verify` / `git commit` / CI のいずれかで、次のメッセージが表示される。

```
✗ 担当範囲の外が変更されています（2件）

  [運営管理] docs/handson-steps.md
  [他チームのゲーム] src/games/daifugo/logic.ts
```

**原因**
`scripts/scope-guard.mjs` が変更されたファイルを分類し、範囲外の変更を検出しています。
pre-commit と CI は同じスクリプトを実行します。

| 表示                 | 意味                                                       |
| -------------------- | ---------------------------------------------------------- |
| `[運営管理]`         | `harness/config.json` の `protectedPaths` に入っている場所 |
| `[対象外の場所]`     | どのゲームフォルダにも属していないファイル                 |
| `[他チームのゲーム]` | 自分以外のゲームフォルダ                                   |

このほかに、次の2つの場合も失敗します。

- 1つのPull Requestで複数のゲームを変更している（1 Pull Requestにつきゲームは1つ）
- ブランチ名と変更しているゲームが一致していない（`feature/babanuki` で別のゲームを変更した）

主な原因は次の3つです。

- `git add .` で一時ファイルやエディタの設定を巻き込んだ
- 改行コードの設定で全ファイルが変更扱いになっている（→ T-04）
- `gh pr checkout` で他のブランチに移った後、自分のブランチに戻り忘れた

**対処**

`npm run scope` を実行すると、対象ファイルを元に戻すコマンドが表示されます。

```powershell
npm run scope
```

出力の末尾に表示されたコマンドを確認して実行します。

```powershell
git restore --source=HEAD --staged --worktree -- docs/handson-steps.md src/games/daifugo/logic.ts
```

範囲外の変更がなくなったことを確認します。

```powershell
npm run scope
```

ブランチ名と一致していない場合は、担当のブランチに戻ります。

```powershell
git switch feature/<自分のゲームID>
```

ターミナルAでは、次のプロンプトを使用します。

```text
npm run scope を実行して、範囲チェックの結果をそのまま見せてください。
落ちている場合は、出力に書かれている git restore の1行だけをそのまま実行して、
もう一度 npm run scope を実行してください。
それ以外のファイルは1つも変更しないでください。
```

変更を破棄してよいか判断できない場合は、実行前に講師へ確認します。
`git restore` は手元の変更を消します。

---

### T-10. `pre-commit` で止まってコミットできない

**症状**
`git commit` を実行すると範囲チェックが動作し、次のメッセージが表示されて中止される。

```
✗ 担当範囲の外が変更されています（1件）
...
コミットを中止しました。
どうしてもこのままコミットする必要がある場合は講師に相談してください。
```

**原因**
`.githooks/pre-commit` が、コミット対象の変更（staged）に対して
`node scripts/scope-guard.mjs --staged` を実行しています。
`feature/*` ブランチでのみ動作します（運営が作業する `main` では通知しません）。

`npm run scope` は作業ツリー全体を検査しますが、pre-commitはstagedの変更だけを検査します。

**対処**

stagedのファイルを確認します。

```powershell
git diff --cached --name-only
```

範囲外のものを staged から外します（ファイル自体の変更は残ります）。

```powershell
git restore --staged <範囲外のファイル>
```

変更そのものを破棄してよければ、`npm run scope` が表示するコマンドで元に戻します（→ T-09）。
その後、担当フォルダを指定してコミットし直します。

```powershell
git add src/games/<自分のゲームID>
git commit -m "配札処理を実装"
```

`git add .` は使用しません。担当外のファイルが含まれ、範囲チェックが失敗する原因になります。

`--no-verify` は使用できません。ターミナルAでは `guard-bash.mjs` が拒否し、
pre-commitを省略してもCIでは同じスクリプトが実行されます。表示された手順に沿って修正します。

pre-commitが動作しない場合は、設定を確認します。

```powershell
git config core.hooksPath
```

`.githooks` と表示されなければ、`npm ci` を実行し直してください（`prepare` が自動で設定します）。

---

### T-11. 「まだ npm run verify を通していない」と表示される

**症状**
Claude Codeが作業を終了しようとしたときに、次のメッセージが表示される。

```
まだ npm run verify を通していない変更があります。

  npm run verify

を実行して、範囲チェック・lint・型・テスト・ビルドがすべて成功することを確認してください。
（これが通って初めて「できた」と言えます。次に止まったときはこの確認をしません）
```

**原因**
`.claude/hooks/require-verify.mjs`（Stopフック）が、次の3条件を満たした場合に表示します。

1. `feature/*` ブランチにいる
2. コミットしていない変更がある
3. 現在の変更内容で `npm run verify` を成功させた記録がない

`npm run verify` の最後に `scripts/mark-verified.mjs` が
`.claude/.state/verified.json` へ「この内容で通した」という記録を書きます。
その記録と現在の作業ツリーが一致していない場合に、メッセージが表示されます。
変更後は `npm run verify` をもう一度実行します。

**対処**

ターミナルAまたはターミナルBで実行します。

```powershell
npm run verify
```

この処理が成功すると、次のように表示され、記録が更新されます。

```
✓ npm run verify がすべて通りました。
  この内容なら Pull Request を出せます。
```

このフックは、作業を繰り返し止めないよう、同じセッションでは1回だけ通知します。
ただし、CIでは毎回同じ検証が実行されます。
Pull Requestを作成する前に、`npm run verify` が成功することを確認してください。

---

### T-12. 依存の追加を拒否された

**症状**

```
依存パッケージの追加・更新はできません: npm install lodash

必要な機能は @core と @ui にすべて揃っています（src/games/CLAUDE.md の早見表を見てください）。
どうしても必要な場合は、自分で入れずに講師に相談してください。
```

**原因**
`.claude/hooks/guard-bash.mjs` が `npm install` / `npm i` / `npm add` / `yarn add` / `pnpm add` などを拒否します。
`.claude/settings.json` の `deny` にも同じものが並んでいます。

依存を1つ入れると `package-lock.json` が変わります。
9人のPull Requestで同じファイルが変更され、競合する可能性があります。
CI にも「依存が変わっていないか」という専用のステップがあります（→ T-22）。

**対処**

まず、`@core` と `@ui` の既存機能で実装できるかを確認します。

| やりたいこと                 | 使うもの                                                               |
| ---------------------------- | ---------------------------------------------------------------------- |
| 山札を作る / 配る / 混ぜる   | `createDeck` / `createDeckWithJokers` / `deal` / `shuffle`             |
| 乱数                         | `createRng(seed)`（`logic.ts` で `Math.random()` は使えません → T-19） |
| CPU の手番の待ち時間         | `useCpuTurn(pendingDelayMs(state), ...)`                               |
| ハイスコアの保存             | `useHighScore` / `gameKey`（`localStorage` の直接利用は禁止）          |
| 画面の枠・ボタン・カード表示 | `@ui` の `GameShell` ほか                                              |

早見表は `src/games/CLAUDE.md` と [docs/architecture.md](architecture.md) にあります。

環境を作り直すときは、`npm install` ではなく `npm ci` を使用できます。

```powershell
npm ci
```

すでに `package.json` / `package-lock.json` を書き換えてしまった場合は戻します。

```powershell
git restore package.json package-lock.json
npm ci
```

既存機能で実装できない場合は、依存を追加せず講師に相談します。追加の可否は運営が判断します。

---

### T-33. Claude Codeが「`npm run dev` は実行できません」と表示する

**症状**
ターミナルA（Claude Code）に画面確認や開発サーバーの起動を依頼すると、次のメッセージが表示される。

```
npm run dev は Claude Code からは実行できません。
起動したままになるので、このセッションが返ってこなくなります。

開発サーバーは、参加者が別のターミナルで起動します。研修中は起動したままにします。

  1. PowerShell をもう1つ開く（これを「ターミナルB」と呼びます）
  2. cd してリポジトリのフォルダへ移動する
  3. npm run dev
  4. ブラウザで http://localhost:5173/ を開く

すでにターミナルB で動いていれば、ブラウザを再読み込みするだけで最新のコードが反映されます。
画面を見て「遊べるかどうか」を判断するのは参加者の役割です。Claude Code は代わりにプレイできません。
```

**原因**

`.claude/settings.json` の `deny` と `.claude/hooks/guard-bash.mjs` の両方で、開発サーバーの起動を拒否しています。
`npm run preview` と `npx vite` も同じ扱いです。理由は2つあります。

1. **技術上の理由:** 開発サーバーは継続して動作するため、Claude Codeの処理が終了しません。
   また、ターミナルBで使用している5173番ポートと競合します（→ T-03）。
2. **運営上の理由:** ブラウザでの動作確認は参加者が行うため、開発サーバーはターミナルBで起動します。

**対処** — 開発サーバーは、参加者がターミナルBで起動します。

PowerShellをもう1つ開きます（Windows Terminalでは `Ctrl + Shift + T` でタブを追加できます）。

```powershell
cd $HOME/dev/card_arcade
npm run dev
```

ブラウザで開きます。

```
http://localhost:5173/
```

このターミナルは研修が終わるまで開いたままにし、`Ctrl + C` で停止しません。
コードの変更後は、ブラウザを再読み込み（F5）して反映を確認します。
開発サーバーを起動し直す必要はありません（それでも反映されないときは T-14）。

開発サーバーがターミナルBで動作している場合、ターミナルAには起動ではなく確認手順の作成を依頼します。

```text
私がターミナルB で npm run dev を動かしています。開発サーバーは起動しないでください。
いま画面で何を確認すればよいかを、手順として3つだけ挙げてください。
それぞれ「どこをクリックして、何が起きたら正しいか」の形で書いてください。
コードはまだ変更しないでください。
```

別の方法で制限を回避せず、ターミナルBに切り替えて手順を実行します。

---

### T-34. Claude Code が反応しなくなった / プロンプトが返ってこない

**症状**
ターミナルAで処理が続き、応答が返ってこない。
出力が続いている、または何も表示されず待機している。

**原因**
監視モードなど、終了を待ち続けるコマンドが実行されている可能性があります。

| 終了を待ち続けるコマンド          | 代わりに実行するコマンド         |
| --------------------------------- | -------------------------------- |
| `npx vitest`（`run` なし）        | `npm test`（= `vitest run`）     |
| `npm run test:watch`              | `npm test`                       |
| `npm test -- --watch`             | `npm test`                       |
| `npm run dev` / `npm run preview` | ターミナルB で起動する（→ T-33） |

表に記載したコマンドはハーネスが拒否します。
言い換えた書き方や、入力待ちになるコマンド（`gh auth login`、`git rebase -i` のような対話形式）は、
検査の対象にならず、処理が終了しない場合があります。

**対処**

1. `Esc` を押して、Claude Codeの実行を中断します。
2. 戻らなければ、ターミナルA で `Ctrl + C` を押し、Claude Code を起動し直します。
   会話の続きから再開できます（書いたコードが消えることはありません）。
3. 再開後、変更されたファイルを確認します。

```powershell
git status --short
```

4. 以降のテストには、1回で終了するコマンドを使用します。

```powershell
npm test
```

特定のファイルだけを実行する場合は、次のコマンドを使用します。

```powershell
npm test -- src/games/<自分のゲームID>/logic.test.ts
```

保存のたびにテストを自動実行する場合は、参加者がターミナルBで起動します（ターミナルAでは実行が拒否されます）。

ターミナルAへ入力するときは、対象範囲と出力形式を指定してください。

```text
npm test を1回だけ実行して、失敗しているテストの名前と最初のエラーだけを教えてください。
監視モード（watch）は使わないでください。まだ何も直さないでください。
```

対話入力が必要なコマンド（`gh auth login` など）は、参加者がターミナルBで実行してください。

---

### T-35. 他の人のブランチでコードを変更しようとして拒否された

**症状**
`gh pr checkout <他の人のPR番号>` などで他の人のブランチに移り、修正を依頼すると、次のメッセージが表示される。

```
src/games/<他の人のゲームID>/logic.ts は 担当N（ゲーム名） の担当です。

あなたの担当は <自分のゲームID> です。
いま他の人のブランチにいるので、そのコードは変更できません。

自分の作業に戻るときは git switch feature/<自分のゲームID> です。
```

**原因**

`npm run scaffold -- --game <自分のゲームID>` を実行したとき、
`.claude/.state/owner.json` に**自分のゲームID が記録**されています。
`guard-scope.mjs` はブランチ名とこの記録を照合し、別のブランチでも担当を判定します。

この記録により、担当者以外が別の参加者のコードを変更することを防ぎます。

**対処**

その場では変更せず、自分の作業ブランチに戻ります。

```powershell
git switch feature/<自分のゲームID>
```

気づいたことがあれば、直すのではなく講師に伝えてください。

`owner.json` がない、または内容が異なる場合（雛形を作る前にブランチを移った場合など）は、
自分のゲームIDで scaffold をもう一度実行すれば記録し直せます。
既存のファイルは上書きされません（「そのまま」と表示され、処理を省略します）。

```powershell
npm run scaffold -- --game <自分のゲームID>
```

記録の中身はこれで確認できます。

```powershell
Get-Content .claude/.state/owner.json
```

---

## 実装

### T-13. アーケード一覧に自分のゲームが出ない

**症状**
ターミナルB のブラウザ（`http://localhost:5173/`）を開いても、自分のタイルが並んでいない。
または、画面上部のエラー欄に「読み込めなかったゲームがあります」と表示される。

**原因**
アーケードは一覧ファイルを持っていません。`src/app/registry/loadGames.ts` が
`src/games/<ゲームID>/index.ts` を自動で読み込みます（`import.meta.glob` の `import: "game"`）。
一覧ファイルでの競合は起きませんが、規定の形式を満たしていないゲームは読み込まれません。

`src/app/registry/validateManifest.ts` がエラーとする条件のうち、主なものは次の5つです。

| メッセージ                                          | 修正方法                                             |
| --------------------------------------------------- | ---------------------------------------------------- |
| `export const game` を公開していません              | `export default` ではなく `export const game` にする |
| `id` が「◯◯」ですがフォルダ名は「△△」です           | `id` をフォルダ名と同じにする                        |
| `name` は20文字以内 / `description` は60文字以内    | 短くする                                             |
| `status` は coming-soon / ready のいずれか          | どちらかにする（→ T-20）                             |
| `owner` は harness/config.json に載っている担当者ID | `participant-N` を変更しない                         |

`id`、`name`、`owner`、`difficulty` は運営が定めた値です。変更すると契約テストとCIが失敗します。

**対処**

まず、画面上部のエラー欄を確認します。原因と対象のフォルダ名が表示されています。
画面を見なくても、テストで同じことが分かります。

```powershell
npm test
```

`registry` の契約テスト「読み込めないゲームが1つも無い」が失敗していれば、その結果に理由が表示されます。

ゲームのフォルダがない場合は、雛形を作成します。

```powershell
npm run scaffold -- --game <自分のゲームID>
```

ターミナルAでは、次のプロンプトを使用します。

```text
src/games/<ゲームID>/index.ts だけを読んで、
src/app/registry/validateManifest.ts の条件を満たしているか確認してください。
満たしていない項目があれば、その項目名と理由だけを挙げてください。
まだ直さないでください。
```

フォルダを新しく作った直後は、画面へ反映するために開発サーバーの再起動が必要な場合があります（→ T-14）。

---

### T-14. ファイルを追加しても画面に反映されない

**症状**
新しいファイルやフォルダを作ったのに、ブラウザの表示が変わらない。
または、画面に何も表示されない。

**原因**
主な原因は次の3つです。

1. ブラウザを再読み込みしていない。
2. ゲームフォルダを新しく作成した直後である。一覧は `src/games/<ゲームID>/index.ts` を
   起動時に読み込むため、フォルダを追加したときは開発サーバーの再起動が必要な場合があります。
3. 構文エラーや型エラーによって更新が止まっている。エラーはターミナルBに表示されます。

**対処**

1. ブラウザで `F5`（キャッシュごと読み直すなら `Ctrl + F5`）。
2. ターミナルBにエラーが表示されていないか確認します。
   表示されている場合は、最初の1件をターミナルAに伝えます。

```text
ターミナルB の開発サーバーに次のエラーが出ています。原因の見当だけ教えてください。
まだ直さないでください。

<ここにエラーの1件目を貼る>
```

3. それでも反映されなければ、ターミナルBで開発サーバーを再起動します。

```powershell
（Ctrl + C で止めてから）
npm run dev
```

この操作はターミナルBで行います。ターミナルAからは起動できません（→ T-33）。
別のポート（5174）で開いていないかも確認してください（→ T-03）。

---

### T-15. `@core` が解決できない

**症状**

```
Failed to resolve import "@core/deck" from "src/games/babanuki/logic.ts".
```

または、lintで次のメッセージが表示される。

```
@core と @ui は入口だけを使ってください（例: import { createDeck } from "@core"）。
中のファイルを直接指定することはできません。
```

**原因**
`vite.config.ts` のエイリアスは、完全一致の正規表現（`^@core$` と `^@ui$`）で設定されています。
そのため、`@core/deck` のように内部のパスを指定すると、モジュールを解決できません。
これは意図的な設計です。ESLintの検査を無効化しても、契約テストとビルドが同じ箇所の問題を検出します。

**対処**

公開されているエントリーポイントから読み込みます。

```ts
import { createDeck, shuffle, createRng } from "@core";
import { GameShell } from "@ui";
```

次の書き方はすべて使えません。

| 書き方                               | 理由                                       |
| ------------------------------------ | ------------------------------------------ |
| `import ... from "@core/deck"`       | 深い指定。エイリアスが完全一致             |
| `import ... from "../../core"`       | 自分のフォルダの外を相対パスで参照している |
| `import ... from "src/core"`         | `src/...` から始まる import は使いません   |
| `import ... from "../daifugo/logic"` | 他の人のゲームの参照                       |

公開されているAPIは、`src/core/index.ts` と `src/components/index.ts` で確認できます。

エディタにだけエラーが表示され、`npm run typecheck` は成功する場合は、エディタのTypeScriptサーバーの状態を確認します。
VS Code なら、コマンドパレットから TypeScript サーバーを再起動してください。
次のコマンドで確認します。

```powershell
npm run typecheck
```

---

### T-16. CPU が1回しか動かない

**症状**
CPUの手番が1回だけ進み、その後の処理が進まない。画面自体は操作できる。

**原因**
待ち時間の実装が原因です。このリポジトリでは、タイマーを `useCpuTurn` だけで管理します。

```tsx
useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
```

`useCpuTurn` は `delayMs` と `onTick` が変わるたびにタイマーを張り直します。
手番を続けるには、レンダリングのたびに新しい関数を渡します。
次のどちらかをやると1回で止まります。

1. `onTick` を `useCallback` などで固定した
   （`delayMs` も同じ値だと、依存が変わらずタイマーが張り直されません）
2. `pendingDelayMs(state)` が、CPUの手番でも `null` を返している
   （`null` の間は参加者の入力待ちとなり、処理は進みません）

**対処**

`onTick` にはインライン関数を渡します。`useCallback` は使用しません。

```tsx
useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
```

`pendingDelayMs` の動作はテストで確認できます。
`reduce` を順番に呼ぶだけで、CPU が連続して動くかどうかが分かります。

```ts
let state = createInitialState(createRng(1));
state = reduce(state, { type: "tick" });
expect(pendingDelayMs(state)).not.toBeNull(); // まだ CPU の手番が続く
```

ターミナルAでは、次のプロンプトを使用します。

```text
src/games/<ゲームID>/logic.ts の pendingDelayMs だけを読んで、
CPU の手番が続くあいだ数値を返し、参加者の入力待ちのときだけ null を返しているか確認してください。
まだ直さないでください。どの分岐が怪しいかだけを教えてください。
```

`logic.ts` では `setTimeout` を使用できません（ESLintと契約テストで検出されます → T-19）。

---

### T-17. テスト結果が実行ごとに変わる

**症状**
同じテストが、実行するたびに成功したり失敗したりする。CIでだけ失敗することもある。

**原因**
テストに、実行ごとに値が変わる処理が含まれています。主な原因は乱数です。

`logic.ts` の中で `Math.random()` を使うことはできません（ESLint と契約テストが止めます）。
ただし、テスト側でseedを指定せずに `createRng()` を呼ぶと、内部で `Math.random` が使われます。
配られるカードが実行ごとに変わるため、テスト結果が安定しません。

時刻（`Date.now()`）や `setTimeout` に依存したテストも同じように不安定になります。

**対処**

乱数にはseedを渡し、結果を固定します。

```ts
const rng = createRng(1); // 数値でも "babanuki-1" のような文字列でもかまいません
const deck = shuffle(createDeck(), rng);
```

`logic.ts` の関数は、`Rng` を引数で受け取る形にします。関数内では作成しません。

```ts
export function createInitialState(rng: Rng): BabanukiState { ... }
```

ロジックのテストでは実際の待ち時間を発生させません。`pendingDelayMs` がミリ秒を返すところまでを検証し、
待機処理は画面側の `useCpuTurn` が行います（→ T-16）。

結果が安定しているかを確認するには、続けて2回実行します。

```powershell
npm test
npm test
```

seedを変えた場合も成功するかを確認します（`createRng(1)` と `createRng(2)` の両方を使用します）。

---

### T-18. `npm test` が終わらない

**症状**
テストが終了せず、プロンプトへの応答が返ってこない。

**原因**
主な原因は次の2つです。

1. 監視モードで起動している。
   `npm test` は `vitest run` を実行するため終了します。終了しない場合は、
   `npx vitest`（`run` なし）・`npm run test:watch`・`npm test -- --watch` のどれかです。
   ターミナルAではこれらのコマンドが拒否されます（→ T-34）。
2. テスト内の処理が終了していない。
   `reduce` を繰り返し呼ぶテストで終了条件に届かず、無限に回っている場合です。
   `pendingDelayMs` が常に数値を返していないか確認します（→ T-16）。

**対処**

まず `Ctrl + C` で停止し、1回で終了するコマンドを使用します。

```powershell
npm test
```

担当ゲームのテストだけを実行すると、原因を絞り込めます。

```powershell
npm test -- src/games/<自分のゲームID>/logic.test.ts
```

それでも終了しない場合は、無限ループがないかを確認します。

```text
src/games/<ゲームID>/logic.test.ts と logic.ts だけを読んで、
終了条件に到達しないまま reduce を呼び続けている箇所が無いか確認してください。
まだ直さないでください。怪しい箇所を1つだけ挙げてください。
```

---

### T-19. lint が `logic.ts` の書き方を拒否する

**症状**
`npm run lint` や `npm run verify` で、`logic.ts`（または `cpu.ts` / `rules.ts`）だけがエラーになる。

```
Math.random() は使えません。乱数は引数で Rng を受け取り、テストでは createRng(seed) で固定します。
Date.now() は使えません。時間の扱いは画面側（useCpuTurn）に任せ、ロジックは時間を持たない形にします。
logic.ts と cpu.ts は「純粋なルール」だけを書く場所です。画面のことは <Xxx>Game.tsx に書いてください。
```

**原因**
`eslint.config.js` は `logic.ts` / `cpu.ts` / `rules.ts` に純粋関数用のルールを適用します。
これらのファイルは「ルールだけを書く場所」なので、次のものを持てません。

| 使えないもの                            | 代わりに使うもの                                             |
| --------------------------------------- | ------------------------------------------------------------ |
| `Math.random()`                         | 引数で `Rng` を受け取り、テストでは `createRng(seed)`        |
| `Date.now()` / `new Date()`             | 時間は持たない。待ち時間は `pendingDelayMs` が数値を返すだけ |
| `setTimeout` / `setInterval`            | 画面側の `useCpuTurn`                                        |
| `react` / `react-dom` / `@ui` の import | 画面のことは `<Xxx>Game.tsx` へ                              |
| `window` / `document`                   | ブラウザの処理は画面側へ記述する                             |
| `localStorage`                          | `@core` の `useHighScore` / `gameKey`                        |

乱数と時間への依存をロジックの外に出すことで、`reduce` を順番に呼ぶだけでルールを検証できます（→ T-17）。

**対処**

エラーが出た行を、上の表のとおりに置き換えます。

```ts
// 直す前
const index = Math.floor(Math.random() * hand.length);

// 直した後（rng は呼び出し側から渡ってくる）
export function drawFrom(hand: readonly Card[], rng: Rng): number {
  return pickRandomIndex(hand.length, rng);
}
```

`eslint-disable` は使用できません。契約テスト（`tests/contract/boundaries.contract.test.ts`）が
`eslint-disable` という文字列自体を検査しているため、追加するとテストが失敗します。

なお、`any` の使用、1ファイル400行超、1関数150行超、複雑度15超、`console.log` は
警告（warn）として表示され、CIは失敗しません。担当フォルダ内に限られる問題として扱います。
例外は `eqeqeq`（`==` ではなく `===`）と未使用変数の2つで、これらはエラーです。

---

### T-20. `status` を `"ready"` にしたらテストが失敗した

**症状**
`index.ts` の `status` を `"coming-soon"` から `"ready"` に変えた瞬間、
それまで成功していたテストが失敗するようになった。

```
✗ 完成したゲーム（status: ready） > ロジックのテストを3件以上持っている
✗ 完成したゲーム（status: ready） > 画面が例外を出さずに描画でき、GameShell を使っている
```

**原因**
`status: "ready"` は、ゲームが完成したことを示します。この値に変更すると、
`tests/contract/manifest.contract.test.tsx` が追加の条件を検査します。

| 条件                                       | 中身                                            |
| ------------------------------------------ | ----------------------------------------------- |
| `logic.test.ts` に `it(` が**3件以上**ある | `harness/config.json` の `minTestsPerReadyGame` |
| `it.skip` / `describe.skip` がない         | skipしたテストは数えない                        |
| 画面が例外を出さずに描画できる             | `<Xxx>Game.tsx` が render できること            |
| 画面が `GameShell` を使っている            | `data-testid="game-shell"` が出ること           |

`coming-soon` の間はこれらを検査しないため、`ready` に変更した時点で問題が検出されます。

**対処**

失敗した条件を満たすように修正します。`ready` の取り消しは、修正が間に合わない場合に講師と相談して行います。

1. テストが3件に足りない場合は、不具合が起きやすい条件を追加します（境界値・禁止操作・seed固定 → T-17）。
2. `it.skip` を外します。動かないテストは、飛ばすのではなく直します。
3. 画面が `GameShell` で包まれているか確認します。

```tsx
import { GameShell } from "@ui";

export function BabanukiGame({ manifest, onExit }: GameProps) {
  return (
    <GameShell manifest={manifest} onExit={onExit}>
      ...
    </GameShell>
  );
}
```

確認はこれです。

```powershell
npm test
npm run verify
```

まだ完成していない場合は、講師と相談して `coming-soon` に戻します。
`ready` に変更するのは、ブラウザで最初から最後まで1回操作できた後です。
条件を満たしていない場合は、CIでも同じ検証が失敗します。

---

## CI

### T-21. 手元では成功するのにCIの `verify` が失敗する

**症状**
`npm run verify` は成功したのに、Pull Requestの `verify` だけが失敗する。

**原因**
`npm run verify` とCIは、同じ順番で同じ検証を実行します（範囲チェック → 依存 → lint → 型 → テスト → ビルド）。
結果が異なる場合は、検査対象や環境を確認します。

| ずれる理由                   | 中身                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| コミット・pushしていない     | CIが検査するのはpush済みの内容。ローカルの修正は含まれていない                                 |
| 範囲チェックの対象が違う     | ローカルの `npm run scope` は作業ツリー、CIは `origin/main` からのブランチ全体の差分を検査する |
| 依存が違う                   | CIは `npm ci` で依存を入れ直す。ローカルの `node_modules` が古い場合がある                     |
| カバレッジ付きで実行する     | CIでは `npm run test -- --coverage` を実行する                                                 |
| 依存の変更チェックが別にある | `package.json` / `package-lock.json` の変更は専用の手順で検出される（→ T-22）                  |

**対処**

まず、コミットまたはpushしていない変更がないか確認します。

```powershell
git status --short
git log --oneline origin/<自分のブランチ名>..HEAD
```

次に、CIと同じ対象範囲で範囲チェックを実行します。

```powershell
git fetch origin
node scripts/scope-guard.mjs --base origin/main --branch feature/<自分のゲームID>
```

依存をそろえてから、CIと同じ一連の検証を再実行します。

```powershell
npm ci
npm run verify
```

CIで失敗した項目は、次のコマンドで確認できます。

```powershell
gh pr checks
gh run list --limit 5
```

Pull RequestのSummaryには、失敗時の確認方法が表示されます。
失敗したステップに対応する箇所から確認してください。

---

### T-22. `package.json / package-lock.json が変更されています`

**症状**
CIの「依存が変わっていないか」ステップが失敗する。

```
::error::package.json / package-lock.json が変更されています。依存の追加は運営が行います。
```

**原因**
`npm install` を実行した場合（→ T-12）や、エディタまたは拡張機能によって書き換えられた場合があります。
依存が変わると9人のPull Requestで同じファイルが変更されるため、専用の手順で検出します。

**対処**

まだコミットしていなければ、戻して入れ直します。

```powershell
git restore package.json package-lock.json
npm ci
```

すでにコミットしてしまっている場合は、`main` の内容に戻してからコミットします。

```powershell
git fetch origin
git restore --source=origin/main -- package.json package-lock.json
git add package.json package-lock.json
git commit -m "依存の変更を元に戻す"
git push
```

これを実行してもCIが成功しない場合は、ほかの変更が含まれていないかを確認し、講師に相談します。

---

### T-23. 必須チェック `verify` が pending のまま

**症状**
Pull Request の `verify` がいつまでも待機のまま進まない。マージボタンも押せない（→ T-27）。

**原因**
主な原因は次の3つです。参加者が対応できるのは1番目だけです。

1. Actionsがまだ実行されていない（Draftでも `verify` は実行されます）
2. チェック名がGitHub側に登録されていない
   ブランチ保護は、`verify` という名前のチェックが成功することを要求します。
   この名前は、CIが一度実行されると登録されます。
   ブランチ保護の適用前に確認用のPull RequestでCIを実行していないと、
   必須チェックが見つからず、Pull Requestがpendingのままになります
3. Actions の実行が承認待ちになっている

**対処**

まず、現在の状態を確認します。

```powershell
gh pr checks
gh run list --limit 5
```

実行履歴がない場合は、空のコミットを作成してActionsを開始します。

```powershell
git commit --allow-empty -m "CI を動かす"
git push
```

それでもpendingのままの場合は、講師による設定の確認が必要です。
`gh pr checks` の出力を講師に提示します。

待機中は、`README.md` の実装メモなど、CIの完了前に進められる作業を行います。

---

### T-31. CI で「まだ作業ブランチを作っていません」と出る

**症状**
CIの範囲チェックに次のログが表示され、`verify` が失敗する。

```
! ブランチ名が feature/<ゲームID> の形になっていません（今: fix-babanuki）
```

または `! まだ作業ブランチを作っていません（今: main）`。

**原因**
範囲チェックはブランチ名から担当ゲームを判定します（`feature/<ゲームID>` の形）。
CI は detached HEAD で動くため、Pull Request のブランチ名を `--branch` で渡していますが、
その名前が規約の形になっていないと、担当を判定できません。

ブランチ名が規定と異なるか、`main` からPull Requestを作成していることが原因です。
ゲームIDは `harness/config.json` が正で、`babanuki` / `daifugo` / `shinkeisuijaku` /
`poker` / `butanoshippo` / `speed` / `shichinarabe` / `doubt` / `pageone` の9つです。

**対処**

正しい名前で新しいブランチを作成します。現在の変更は新しいブランチにも引き継がれます。

```powershell
git switch -c feature/<自分のゲームID>
git push -u origin feature/<自分のゲームID>
```

新しいブランチで Pull Request を出し直し、古いほうは閉じます。

```powershell
gh pr create --base main --head feature/<自分のゲームID> --draft
```

（`gh pr create` では承認が必要です。実行前に、`--base` が `main`、
`--head` が自分のブランチになっていることを確認します → T-28）

古いPull Requestは、参加者がGitHubの画面から閉じます。

---

## GitHub

### T-24. `gh` のトークンに権限が足りない

**症状**
`npm run doctor` が「GitHub にログインしているか」で `✗` になる。

```
✗ GitHub にログインしているか   トークンに repo 権限がありません（gist, read:org）
```

`git push` や `gh pr create` が権限エラーで失敗することもあります。

**原因**
`gh auth login` のときに、`repo` スコープを持たないトークンでログインしています。
ブラウザ認証をやり直すか、スコープを追加します。

**対処**

まず今のスコープを確認します。

```powershell
gh auth status
```

`Token scopes:` に `repo` がなければ追加します。

```powershell
gh auth refresh -s repo
```

ブラウザに8桁のコードの入力画面が表示されたら、ターミナルに表示されたコードを入力して承認します。
認証できない場合はログインし直します。

```powershell
gh auth login
```

| 質問                                           | 選ぶもの                   |
| ---------------------------------------------- | -------------------------- |
| What account do you want to log into?          | `GitHub.com`               |
| What is your preferred protocol?               | `HTTPS`                    |
| Authenticate Git with your GitHub credentials? | `Yes`                      |
| How would you like to authenticate?            | `Login with a web browser` |

これらは対話形式のため、参加者がターミナルBで実行します。
ターミナルAで実行すると、入力待ちの状態になります（→ T-34）。

ログイン後、認証状態と環境をもう一度確認します。

```powershell
gh auth status
npm run doctor
```

---

### T-25. リポジトリにアクセスできない（403）

**症状**
`git push` や `gh pr create` が 403 で失敗する。`npm run doctor` の
「リポジトリにアクセスできるか」が `✗` になる。

```
remote: Permission to Daisuke0719/card_arcade.git denied
fatal: unable to access ... : The requested URL returned error: 403
```

**原因**
まず、collaborator の招待を承諾しているか確認します。
講師が招待を送っていても、参加者が承諾するまで書き込み権限は付きません。

トークンのスコープ不足でも 403 になります（→ T-24）。

**対処**

1. GitHub の通知から招待を承諾します。

```
https://github.com/notifications
```

招待メールのリンク、または次のURLを開いて `Accept invitation` を選択します。

```
https://github.com/Daisuke0719/card_arcade
```

2. 承諾できたか確認します。

```powershell
gh repo view Daisuke0719/card_arcade --json name
npm run doctor
```

3. それでも403になる場合は、`gh auth status` でスコープを確認します（→ T-24）。
4. 招待が届いていない場合は、GitHubのアカウント名を講師に伝え、招待を再送してもらいます。

---

### T-26. 公開ページ（Pages）が 404

**症状**
公開 URL を開くと 404 になる。あるいは自分のゲームだけ出てこない。

**原因**
主な原因は次の4つです。

1. まだマージされていない。公開ページは `main` から作成されます
2. デプロイがまだ終わっていない（マージから数分かかります）
3. Pagesが有効になっていない（講師の初期設定 → T-32）
4. URLが違う（`Settings > Pages` に表示されているURLを使用します）

**対処**

デプロイの状況を見ます。

```powershell
gh run list --workflow "Deploy to GitHub Pages"
```

`completed` `success` になっている場合は、URLとキャッシュを確認します。
ブラウザで `Ctrl + F5` を押し、キャッシュを無視して再読み込みします。

URL は GitHub の `Settings > Pages` に表示されているものを使います。
このリポジトリは `vite.config.ts` で `base: "./"` にしてあるので、
サブパス配信と `dist` の直接表示に対応しています。URLの書き換えは不要です。

`Get Pages site failed` と表示されている場合はT-32を確認してください（参加者側では修正できません）。

---

### T-27. マージボタンが押せない

**症状**
Pull Request の `Merge pull request` が灰色のまま押せない。

**原因**
`main` へのマージには次の2つの条件があります。どちらかを満たしていない場合はマージできません。

| 条件                    | 確認方法                                    |
| ----------------------- | ------------------------------------------- |
| `verify` が成功している | `gh pr checks`（pending のままなら → T-23） |
| Draft が外れている      | `gh pr ready` で Ready にする               |

マージは講師が行います。上の2つがそろったら、講師へ確認を依頼します。

**対処**

状態をまとめて確認します。

```powershell
gh pr view --json number,isDraft,mergeable
gh pr checks
```

Draft のままなら外します（承認を求められます）。

```powershell
gh pr ready
```

Readyにしてもマージできない場合は、講師へ伝えます。

講師はSquashを選んでマージします。

```powershell
gh pr merge <PR番号> --squash --delete-branch
```

`Conflicting files` と表示されている場合は競合が発生しています。
このリポジトリではゲーム一覧を自動収集し、参加者が共通ファイルを変更しない構成ですが、
競合が発生した場合は自分で解決せず、講師に相談します。

---

### T-28. `gh pr create` が失敗する / Pull Request の向きが違う

**症状**

```
pull request create failed: GraphQL: No commits between main and feature/babanuki
```

```
must first push the current branch to a remote
```

あるいは画面上で `base` が自分のブランチ、`compare` が `main` になっている。

**原因**
Pull Requestは、`main` に自分のブランチの変更を取り込むための依頼です。
baseとheadが逆になっている場合や、ブランチをpushしていない場合は作成できません。

- pushしていない（コミットがローカルにしかない）
- コミットが1つもない（変更はあるが `git commit` していない）
- `main` から作成しようとしている（→ T-31）

**対処**

自分のブランチにいることを確認します。

```powershell
git branch --show-current
```

`main` との差分を確認します。何も表示されない場合は、まだコミットがありません。

```powershell
git log --oneline origin/main..HEAD
```

pushします（実行には承認が必要です）。

```powershell
git push -u origin feature/<自分のゲームID>
```

baseとheadを指定して作成します。

```powershell
gh pr create --base main --head feature/<自分のゲームID> --draft --title "ババ抜きを実装" --body-file .pr-body.md
```

`.pr-body.md` はPull Requestの説明文の下書きです（提出前にClaude Codeへ作成を依頼します）。
このファイルは、担当フォルダの外にありますが、ハーネスによる書き込みが許可されています。

ブラウザで作成する場合は、`base: main` / `compare: feature/<自分のゲームID>` になっていることを
確認してからCreateを選択します。

最初はDraftで作成します。CIが成功してから `gh pr ready` でReadyにします。

---

### T-30. `git push` が `workflow` スコープ不足で拒否される

**症状**

```
refusing to allow an OAuth App to create or update workflow
`.github/workflows/ci.yml` without `workflow` scope
```

**原因**
pushしようとしている変更に `.github/workflows/` の変更が含まれています。

`.github/workflows/` は運営が管理する場所です。参加者の変更に含まれた原因を確認します。
参加者のトークンに `workflow` スコープを追加してpushする方法は使用しません。
主な原因は、改行コード（→ T-04）か `git add .`（→ T-09）によって担当外のファイルが含まれたことです。

**対処**

変更に含まれているファイルを確認します。

```powershell
git diff --name-only origin/main...HEAD
```

`.github/` が含まれている場合は、`main` の内容に戻します。

```powershell
git fetch origin
git restore --source=origin/main -- .github
git add .github
git commit -m "運営管理のファイルを元に戻す"
git push
```

`npm run scope` が成功することを確認します。

```powershell
npm run scope
```

これで解決しない場合や、workflowを変更する必要がある場合は講師に相談します。
講師が変更する場合は、`gh auth refresh -s workflow` でスコープを追加します。
参加者の端末では実行しません。

---

### T-32. Pages のデプロイが `Get Pages site failed` で失敗する

**症状**
`Deploy to GitHub Pages` ワークフローが失敗し、ログに次の内容が表示される。

```
Error: Get Pages site failed. Please verify that the repository has Pages enabled
and configured to build using GitHub Actions
```

**原因**
リポジトリの `Settings > Pages` で、`Source` が `GitHub Actions` に設定されていません。
Pagesが有効化されていないと、`actions/configure-pages` がこのエラーで失敗します。

これは講師が初期設定で対応する項目です。参加者には変更権限がありません。
`node scripts/setup-github.mjs` の手順でも、Pages の有効化だけは
GitHub の画面から行うことになっています。

**対処（講師）**

1. `Settings > Pages` を開く
2. `Source` を `GitHub Actions` にする
3. デプロイをやり直す

```powershell
gh workflow run "Deploy to GitHub Pages"
gh run list --workflow "Deploy to GitHub Pages"
```

**対処（参加者）**

自分のマージが成功していても、公開にはデプロイの完了が必要です。
`Deploy to GitHub Pages` が失敗していることを講師に伝え、次の作業に進んでください。

```powershell
gh run list --workflow "Deploy to GitHub Pages"
```

公開されたかどうかは T-26 の手順で確認できます。

---

## それでも直らないとき

このページの手順で解決しない場合は、別の回避策を試さず講師に相談します。

1. ターミナルAで、現在の状態を確認して整理する
   （`npm run scope` / `npm test` の結果を集め、コードは変更しません）
2. その出力を講師に提示する
3. Issue に `blocked` ラベルを付け、作業が止まっていることを共有する

操作が拒否された場合は、理由と対処方法を [docs/harness.md](harness.md) で確認してください。
