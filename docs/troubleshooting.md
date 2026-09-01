# トラブル対処集（T-01 〜 T-35）

エラーで詰まったときに開くページです。**番号が付いています。**
CI のまとめや Issue、講師からの連絡で「T-09 を見て」と言われたら、この番号を探してください。

## 使い方

1. まず `npm run doctor` を実行する（環境まわりならここでほぼ分かります）
2. 症状に近いものを下の索引から探す
3. 「対処」のコマンドを**上から順に**そのまま実行する
4. それでも直らなければ、**手を止めて講師に相談する**（回り込む方法を探さないでください）

コマンドはすべて PowerShell にそのまま貼り付けて動きます。

**このページのコマンドは、断りが無いかぎり「ターミナルB」（自分の手だけで打つ窓）で実行します。**
ターミナルA（Claude Code）に打たせたいときは、各項目に載せている**プロンプトの文面をそのままコピペ**してください。
`npm run dev` のようにターミナルA では**そもそも実行できない**ものがあります（→ T-33）。

この研修は**1人1ゲーム**です。詰まったことに気づけるのは自分だけなので、
**15分進まなかったら `/stuck`、それでも動かなければ講師**と決めておいてください。

## 索引

| 分類 | 番号 | 症状 |
|---|---|---|
| 環境 | T-01 | Node.js のバージョンが違う |
| 環境 | T-02 | `npm ci` が失敗する |
| 環境 | T-03 | ポート 5173 が使用中で `npm run dev` が起動しない |
| 環境 | T-04 | clone しただけなのに `git status` が全ファイル変更になる |
| 環境 | T-05 | パスに日本語やスペースが含まれていて動かない |
| 環境 | T-06 | PowerShell が「スクリプトの実行は無効」と言う |
| 環境 | T-29 | 日本語を含む `.ps1` が構文エラーになる（セットアップ用スクリプト） |
| ハーネス | T-07 | Claude が「変更できません」と言う |
| ハーネス | T-08 | フックが動いていないように見える |
| ハーネス | T-09 | **範囲チェックで落ちる** |
| ハーネス | T-10 | `pre-commit` で止まってコミットできない |
| ハーネス | T-11 | 「まだ npm run verify を通していない」と引き止められる |
| ハーネス | T-12 | 依存を追加しようとして止められた |
| ハーネス | T-33 | Claude Code が「`npm run dev` は実行できません」と言う |
| ハーネス | T-34 | Claude Code が反応しなくなった / プロンプトが返ってこない |
| ハーネス | T-35 | レビュー中に相手のコードを直そうとして止められた |
| 実装 | T-13 | アーケード一覧に自分のゲームが出ない |
| 実装 | T-14 | ファイルを足したのに画面に反映されない |
| 実装 | T-15 | `@core` が解決できない |
| 実装 | T-16 | CPU が1回しか動かない |
| 実装 | T-17 | テストが時々落ちる |
| 実装 | T-18 | `npm test` が終わらない |
| 実装 | T-19 | lint が `logic.ts` の書き方を拒否する |
| 実装 | T-20 | `status` を `"ready"` にしたらテストが落ちた |
| CI | T-21 | 手元では緑なのに CI の `verify` が赤 |
| CI | T-22 | `package.json / package-lock.json が変更されています` |
| CI | T-23 | 必須チェック `verify` が pending のまま |
| CI | T-31 | CI で「まだ作業ブランチを作っていません」と出る |
| GitHub | T-24 | `gh` のトークンに権限が足りない |
| GitHub | T-25 | リポジトリにアクセスできない（403） |
| GitHub | T-26 | 公開ページ（Pages）が 404 |
| GitHub | T-27 | マージボタンが押せない |
| GitHub | T-28 | `gh pr create` が失敗する / Pull Request の向きが違う |
| GitHub | T-30 | `git push` が `workflow` スコープ不足で拒否される |
| GitHub | T-32 | Pages のデプロイが `Get Pages site failed` で落ちる |

---

## 環境

### T-01. Node.js のバージョンが違う

**症状**
`npm ci` や `npm run dev` が `Unsupported engine` や意味の分からない構文エラーで落ちる。
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

インストール後は **PowerShell を閉じて開き直してから** もう一度確認します。

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

いったん消してから入れ直します。

```powershell
Remove-Item -Recurse -Force node_modules
npm ci
```

`package-lock.json` を書き換えてしまっていた場合は、先に戻します。

```powershell
git restore package.json package-lock.json
npm ci
```

**`npm install` は使わないでください。** `package-lock.json` が変わると CI が落ちます（T-22）。
プロキシ環境でネットワークエラーになる場合は、社内の設定が必要なので講師に相談してください。

---

### T-03. ポート 5173 が使用中で `npm run dev` が起動しない

**症状**
`Port 5173 is in use` と出る、または別のポート（5174）で開いて古い画面が表示される。

**原因**
前に起動した開発サーバーが残っています。`Ctrl + C` を押さずにターミナルを閉じたときによく起きます。

**対処**

使っているプロセスを調べて止めます。

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen | Select-Object OwningProcess
Stop-Process -Id <上に出た番号>
npm run dev
```

止められない・番号が出ない場合は、別のポートで起動しても構いません。

```powershell
npm run dev -- --port 5180
```

#### 二重起動で 5174 になっていた場合

**症状が「動いてはいるが、直したはずのコードが画面に出ない」ときは、これを疑ってください。**
ブラウザで開いている URL が `http://localhost:5174/` になっていないか確認します。

開発サーバーは、5173 が埋まっていると**黙って 5174 に逃げます**。
このとき画面は2つ出ていて、片方は古いプロセスが配信している**過去のコード**です。
`npm run dev` を打ち直したつもりで、実は2本目を起動していた、という形で起きます。

かつては、Claude Code に「画面を確認して」と頼むと Claude Code 自身が `npm run dev` を起動してしまい、
参加者がターミナルB で動かしている 5173 と衝突して 5174 が生まれる、という事故がありました。
**今はハーネスがターミナルA からの `npm run dev` を止めるので、この経路では起きません**（→ T-33）。
それでも、**古い手順書を見て自分の手で2回起動した**場合には起きます。

**対処** — 5173 と 5174 の両方を調べて、**余分なほうを止めてから1本だけ起動し直します。**

```powershell
Get-NetTCPConnection -LocalPort 5173,5174 -State Listen | Select-Object LocalPort,OwningProcess
```

出てきた番号のうち、**自分が今使っているターミナルB のもの以外**を止めます。

```powershell
Stop-Process -Id <止めるほうの番号>
```

そのうえで、ターミナルB で1本だけ起動し、ブラウザは `http://localhost:5173/` を開き直します。

```powershell
npm run dev
```

**開発サーバーは、今日は1本しか要りません。** ターミナルB のものだけを残してください。

---

### T-04. clone しただけなのに `git status` が全ファイル変更になる

**症状**
何も編集していないのに、`git status` に数百件の変更が出る。差分を見ると中身は同じに見える。

**原因**
改行コードです。このリポジトリは `.gitattributes` で LF に統一していますが、
Windows の `core.autocrlf=true` が勝つと、全ファイルが CRLF に書き換わって変更扱いになります。
このまま作業すると範囲チェック（T-09）が全ファイルを違反として拾います。

**対処**

**手元に残したい変更が無いことを確認してから**実行してください（下の3行目は変更を消します）。

```powershell
git config --global core.autocrlf false
git rm --cached -r .
git reset --hard
git status
```

`git status` が空になれば直っています。
残したい変更がある場合は、先に `git stash` で預けてから実行してください。

---

### T-05. パスに日本語やスペースが含まれていて動かない

**症状**
`npm ci` や `npm run dev` が謎の場所で落ちる。パスの一部が文字化けしている。
OneDrive 配下でファイルが勝手に同期され、`git status` が安定しない。

**原因**
`C:/Users/山田 太郎/OneDrive/デスクトップ/card_arcade` のようなパスです。
日本語・スペース・OneDrive の同期はどれもトラブルの原因になります。

**対処**

短くて ASCII だけのパスに clone し直すのがいちばん速いです。

```powershell
mkdir -Force $HOME/dev
cd $HOME/dev
git clone https://github.com/Daisuke0719/card_arcade.git
cd card_arcade
npm ci
npm run doctor
```

作業中の変更がある場合は、先に push するか、講師に相談してからやり直してください。

---

### T-06. PowerShell が「スクリプトの実行は無効」と言う

**症状**

```
npm : このシステムではスクリプトの実行が無効になっているため、ファイル ...npm.ps1 を読み込めません。
```

**原因**
PowerShell の実行ポリシーが `Restricted` になっています（`npm` や `gh` は `.ps1` 経由で動きます）。

**対処**

現在の設定を見て、`RemoteSigned` にします（管理者権限は不要です）。

```powershell
Get-ExecutionPolicy -List
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

確認を聞かれたら `Y` を入力します。PowerShell を開き直してから、もう一度実行してください。
会社の設定で変更できない場合は、講師に相談してください。

---

### T-29. 日本語を含む `.ps1` が構文エラーになる（セットアップ用スクリプト）

**症状**
セットアップ用の PowerShell スクリプトを実行すると、中身は正しく見えるのに構文エラーで止まる。

```
発生場所 ...setup-github.ps1:12 文字:1
+ Write-Host "ラベルを作成します"
文字列に終端記号 " がありません。
```

日本語の部分が `���` のように文字化けして表示されることもあります。

**原因**
PowerShell 5.1（Windows に標準で入っているもの）は、**BOM の無い UTF-8 の `.ps1` を UTF-8 として読みません。**
日本語のコメントやメッセージが混ざったスクリプトは、途中でクォートが閉じていないと誤解されます。
**スクリプトの中身は正しいのに、読み込み方だけで壊れる**という、原因が分かりにくいトラブルです。

**対処**

**このリポジトリのセットアップは PowerShell スクリプトを使いません。** Node.js 版を使ってください。

```powershell
node scripts/setup-github.mjs all
```

個別に実行する場合はこうです。

```powershell
node scripts/setup-github.mjs labels
node scripts/setup-github.mjs issues
```

Node.js は BOM の有無に関係なく UTF-8 として読むので、この問題は起きません。
**セットアップ用の `.ps1` は廃止済みです。** 古い手順書に `.ps1` が出てきたら、
それは `node scripts/setup-github.mjs` に読み替えてください。

なお、この作業は**講師が事前に行うもの**です。参加者が実行する必要はありません。
参加者のターミナルA（Claude Code）では、このコマンドは**拒否されます**（9人分をまとめて壊せるため）。

---

## ハーネス

### T-07. Claude が「変更できません」と言う

**症状**
ファイルを直してもらおうとすると、Claude Code が編集せずにこう返す。

```
src/core/cards/index.ts は運営が管理している場所なので変更できません。

編集してよいのは src/games/<自分のゲームID>/ の中だけです。

共通基盤への変更が必要かもしれません。次の形で人間に報告してください:

  - やりたいこと:
  - 足りないと思うもの:
  - ゲーム側だけで実現する案（あれば）:
```

**原因**
**壊れていません。正しい挙動です。**
`.claude/hooks/guard-scope.mjs` が、書き込み先を `harness/config.json` の `protectedPaths` と
突き合わせて止めています。止まり方は3種類あります。

| 出るメッセージ | 意味 |
|---|---|
| 「運営が管理している場所なので変更できません」 | `src/core/` `src/components/` `docs/` `scripts/` など、9人が共有する場所 |
| 「どのゲームフォルダにも属していません」 | `src/games/<ゲームID>/` の外に新しいファイルを作ろうとした |
| 「◯◯ の担当です」 | 他の人のゲームフォルダ（レビュー中の誤編集は T-35） |

なお「まだ作業ブランチを作っていません」は**拒否ではなく確認**です（`y` / `n` を聞かれます）。
`n` を選んで `git switch -c feature/<ゲームID>` を実行してから編集し直してください。

**対処**

1. メッセージの**3番目の段落（次にどうするか）だけ**を読みます。必ず書いてあります。
2. `src/core/index.ts` と `src/components/index.ts` をもう一度読み、
   既存の関数の組み合わせで作れないかを確かめます。ほとんどの場合は作れます。

ターミナルA にそのまま貼れる文面です。

```text
src/core と src/components の公開 API を読んで、いまやりたいことが
既存の関数の組み合わせで実現できるかどうかだけ調べてください。
読むだけで、ファイルは1つも変更しないでください。
できる場合は使う関数名と組み合わせ方を、できない場合は「何が足りないか」を1つだけ挙げてください。
```

3. それでも共通基盤の変更が必要だと思ったら、**自分で直さずに**上の報告フォーマットを埋めて講師に見せます。

**回り込む方法（`sed -i`・リダイレクト・`cp` での上書き）を探さないでください。**
`guard-bash.mjs` が同じ場所を見ているので止まりますし、通ったとしても CI で必ず落ちます。

---

### T-08. フックが動いていないように見える

**症状**
担当範囲の外を編集しても止められない。セッションを開始しても「今のセッションの前提」が出てこない。
`npm run dev` を頼んだのに、拒否メッセージではなく普通に起動しようとする。

**原因**
だいたい次の4つです。

1. `.claude/settings.json` を読み込む前のセッションが残っている（**設定を変えた後は Claude Code の再起動が必要**）
2. 環境変数 `CARD_ARCADE_HARNESS=off` が残っている（**講師が緊急時に使う逃げ道**です。参加者は使いません）
3. リポジトリのルート以外のフォルダで Claude Code を起動した（`.claude/` が見つかりません）
4. `node` にパスが通っていない（フックは `node` で動いています）

**対処**

まず環境変数を調べます。

```powershell
$env:CARD_ARCADE_HARNESS
```

何か表示されたら消して、**ターミナルA を開き直します**。

```powershell
Remove-Item Env:CARD_ARCADE_HARNESS
```

起動した場所を確かめます。ここがリポジトリのルートでなければ、`cd` してから起動し直します。

```powershell
git rev-parse --show-toplevel
node -v
```

フック単体が動くかどうかは、次の1行で確かめられます（拒否メッセージの JSON が出れば正常です）。

```powershell
node .claude/hooks/guard-bash.mjs
```

（このコマンドは標準入力を待ちます。何も貼らずに `Ctrl + C` で抜けて構いません。
エラーにならずに待ち状態になれば、フック本体は動いています。）

**それでも直らなくても、作業は止まりません。**
フック（Layer 3）は**外せる層**ですが、`npm run verify` と CI（Layer 4・5）は**外せません**。
`npm run verify` が緑にならないかぎりマージはできないので、
範囲違反も純粋性違反も、遅くとも Pull Request で必ず見つかります。
おかしいと思ったら、そのまま講師に伝えてください。

---

### T-09. 範囲チェックで落ちる

**症状**
`npm run scope` / `npm run verify` / `git commit` / CI のいずれかで、こう出る。

```
✗ 担当範囲の外が変更されています（2件）

  [運営管理] docs/handson-steps.md
  [他チームのゲーム] src/games/daifugo/logic.ts
```

**原因**
`scripts/scope-guard.mjs` が、変更されたファイルを分類して止めています。
**手元（pre-commit）と CI がまったく同じスクリプトを呼ぶ**ので、判定がずれることはありません。

| 表示 | 意味 |
|---|---|
| `[運営管理]` | `harness/config.json` の `protectedPaths` に入っている場所 |
| `[対象外の場所]` | どのゲームフォルダにも属していないファイル |
| `[他チームのゲーム]` | 自分以外のゲームフォルダ |

このほかに、次の2つでも落ちます。

- **1つの Pull Request で複数のゲームを変更している**（1 Pull Request につきゲームは1つです）
- **ブランチ名と変更しているゲームが一致していない**（`feature/babanuki` にいるのに別のゲームを触った）

よくある入り込み方は3つです。

- `git add .` で一時ファイルやエディタの設定を巻き込んだ
- 改行コードの設定で全ファイルが変更扱いになっている（→ T-04）
- レビューで `gh pr checkout` した後、自分のブランチに戻り忘れた

**対処**

**自分で `git restore` の書き方を考える必要はありません。** 実行すると、そのままコピペできる1行が出ます。

```powershell
npm run scope
```

出力の下のほうに、こういう行があります。**そのまま実行してください。**

```powershell
git restore --source=HEAD --staged --worktree -- docs/handson-steps.md src/games/daifugo/logic.ts
```

消えたことを確認します。

```powershell
npm run scope
```

ブランチ名と一致していない場合は、担当のブランチに戻ります。

```powershell
git switch feature/<自分のゲームID>
```

ターミナルA に頼む場合の文面です。

```text
npm run scope を実行して、範囲チェックの結果をそのまま見せてください。
落ちている場合は、出力に書かれている git restore の1行だけをそのまま実行して、
もう一度 npm run scope を実行してください。
それ以外のファイルは1つも変更しないでください。
```

**復元してよいか自信が無いときは、実行する前に講師に見せてください。**
`git restore` は手元の変更を消します。

---

### T-10. `pre-commit` で止まってコミットできない

**症状**
`git commit` した瞬間に範囲チェックが走り、こう出て中止される。

```
✗ 担当範囲の外が変更されています（1件）
...
コミットを中止しました。
どうしてもこのままコミットする必要がある場合は講師に相談してください。
```

**原因**
`.githooks/pre-commit` が、**コミットしようとしている変更（staged）** に対して
`node scripts/scope-guard.mjs --staged` を実行しています。
`feature/*` ブランチのときだけ動きます（運営が `main` で作業するときは黙ります）。

`npm run scope` は作業ツリー全体を見るのに対し、こちらは**staged だけ**を見ます。
つまり「`git add` してしまったもの」が原因です。

**対処**

何を `git add` したのかを見ます。

```powershell
git diff --cached --name-only
```

範囲外のものを staged から外します（ファイル自体の変更は残ります）。

```powershell
git restore --staged <範囲外のファイル>
```

変更そのものを消してよければ、`npm run scope` が出す1行で戻します（→ T-09）。
そのうえで、**担当フォルダだけを指定して**コミットし直します。

```powershell
git add src/games/<自分のゲームID>
git commit -m "配札処理を実装"
```

**`git add .` は使わないでください。** これが範囲チェックが赤くなる最大の原因です。

**`--no-verify` は使えません。** ターミナルA では `guard-bash.mjs` が止めますし、
仮に手で通しても CI がまったく同じスクリプトで落とします。飛ばした分だけ後で遠回りになります。

逆に、**pre-commit がまったく動いていない**ときは設定が外れています。

```powershell
git config core.hooksPath
```

`.githooks` と表示されなければ、`npm ci` を実行し直してください（`prepare` が自動で設定します）。

---

### T-11. 「まだ npm run verify を通していない」と引き止められる

**症状**
作業が一区切りついて Claude Code が終わろうとすると、こう出て止まる。

```
まだ npm run verify を通していない変更があります。

  npm run verify

を実行して、範囲チェック・lint・型・テスト・ビルドがすべて緑になることを確かめてください。
（これが通って初めて「できた」と言えます。次に止まったときはこの確認をしません）
```

**原因**
`.claude/hooks/require-verify.mjs`（Stop フック）です。次の3つがそろったときだけ声をかけます。

1. `feature/*` ブランチにいる
2. コミットしていない変更がある
3. **今の変更内容で** `npm run verify` を通した記録が無い

`npm run verify` の最後に `scripts/mark-verified.mjs` が
`.claude/.state/verified.json` へ「この内容で通した」という記録を書きます。
その記録と今の作業ツリーが一致していないと、引き止められます。
1行でも直せば記録とずれるので、**直したら通し直す**のが正しい形です。

**対処**

素直に実行してください。ターミナルA でもターミナルB でもかまいません。

```powershell
npm run verify
```

これが緑になると、次のように出て記録が更新されます。

```
✓ npm run verify がすべて通りました。
  この内容なら Pull Request を出せます。
```

**このフックは、同じセッションの2回目は黙ります。** 作業が詰まらないようにするためです。
ただし**CI は黙りません。** 「1回言われたから大丈夫」ではなく、
Pull Request を出す前には必ず `npm run verify` を緑にしてください。

---

### T-12. 依存を追加しようとして止められた

**症状**

```
依存パッケージの追加・更新はできません: npm install lodash

必要な機能は @core と @ui にすべて揃っています（src/games/CLAUDE.md の早見表を見てください）。
どうしても必要な場合は、自分で入れずに講師に相談してください。
```

**原因**
`.claude/hooks/guard-bash.mjs` が `npm install` / `npm i` / `npm add` / `yarn add` / `pnpm add` などを止めています。
`.claude/settings.json` の `deny` にも同じものが並んでいます。

依存を1つ入れると `package-lock.json` が変わります。
すると**9人全員の Pull Request が同じファイルで競合**し、統合が止まります。
CI にも「依存が変わっていないか」という専用のステップがあります（→ T-22）。

**対処**

まず、`@core` と `@ui` で足りることを確かめます。だいたい足ります。

| やりたいこと | 使うもの |
|---|---|
| 山札を作る / 配る / 混ぜる | `createDeck` / `createDeckWithJokers` / `deal` / `shuffle` |
| 乱数 | `createRng(seed)`（`logic.ts` で `Math.random()` は使えません → T-19） |
| CPU の手番の待ち時間 | `useCpuTurn(pendingDelayMs(state), ...)` |
| ハイスコアの保存 | `useHighScore` / `gameKey`（`localStorage` の直接利用は禁止） |
| 画面の枠・ボタン・カード表示 | `@ui` の `GameShell` ほか |

早見表は `src/games/CLAUDE.md` と [docs/architecture.md](architecture.md) にあります。

環境を作り直すときの `npm ci` は**使えます**（`npm install` ではありません）。

```powershell
npm ci
```

すでに `package.json` / `package-lock.json` を書き換えてしまった場合は戻します。

```powershell
git restore package.json package-lock.json
npm ci
```

**それでも必要だと思ったら、入れずに講師へ相談してください。** 判断は運営が行います。

---

### T-33. Claude Code が「`npm run dev` は実行できません」と言う

**症状**
ターミナルA（Claude Code）に「画面で確認して」「開発サーバーを立ち上げて」と頼むと、こう返ってくる。

```
npm run dev は Claude Code からは実行できません。
起動したままになるので、このセッションが返ってこなくなります。

開発サーバーは「あなたが、別のターミナルで」動かします。研修中はつけっぱなしです。

  1. PowerShell をもう1つ開く（これを「ターミナルB」と呼びます）
  2. cd してリポジトリのフォルダへ移動する
  3. npm run dev
  4. ブラウザで http://localhost:5173/ を開く

すでにターミナルB で動いていれば、ブラウザを再読み込みするだけで最新のコードが反映されます。
画面を見て「遊べるかどうか」を判断するのは人間の仕事です。Claude Code は代わりに遊べません。
```

**原因**
**壊れていません。今日の設計そのものです。**
`.claude/settings.json` の `deny` と `.claude/hooks/guard-bash.mjs` の両方で止めています。
`npm run preview` と `npx vite` も同じ扱いです。理由は2つあります。

1. **技術的な理由。** 開発サーバーは終わらないコマンドなので、セッションが返ってきません。
   さらに、あなたがターミナルB で使っている 5173 番ポートと衝突します（→ T-03）。
2. **設計上の理由。** 開発サーバーは**遊ぶための道具**です。
   遊ぶのは人間の仕事なので、道具も人間の側（ターミナルB）に置いてあります。

**対処** — 開発サーバーは**自分の手で**、ターミナルB で起動します。

**PowerShell をもう1枚開きます**（Windows Terminal ならタブを増やすのが楽です: `Ctrl + Shift + T`）。

```powershell
cd $HOME/dev/card_arcade
npm run dev
```

ブラウザで開きます。

```
http://localhost:5173/
```

**この窓は研修が終わるまで閉じません。`Ctrl + C` も押しません。**
コードを直したあとに画面へ反映するのは、**ブラウザの再読み込み（F5）だけ**です。
開発サーバーを起動し直す必要はありません（それでも反映されないときは T-14）。

すでにターミナルB で動いているのに Claude Code に頼んでしまった、という場合は、
**頼む内容のほうを変えます。** ターミナルA にはこう打ってください。

```text
私がターミナルB で npm run dev を動かしています。開発サーバーは起動しないでください。
いま画面で何を確認すればよいかを、手順として3つだけ挙げてください。
それぞれ「どこをクリックして、何が起きたら正しいか」の形で書いてください。
コードはまだ変更しないでください。
```

**回り込む方法を探さないでください。** 探している時間より、B の窓に切り替えて打つほうが速いです。

---

### T-34. Claude Code が反応しなくなった / プロンプトが返ってこない

**症状**
ターミナルA が動いたまま止まり、いつまでも応答が返ってこない。
出力が流れ続けている、あるいは何も出ないまま待たされている。

**原因**
**ほとんどが「終わらないコマンド」です。** 代表的なものは監視モード系です。

| 止まらなくなるもの | 正しい形 |
|---|---|
| `npx vitest`（`run` なし） | `npm test`（= `vitest run`） |
| `npm run test:watch` | `npm test` |
| `npm test -- --watch` | `npm test` |
| `npm run dev` / `npm run preview` | ターミナルB で起動する（→ T-33） |

これらはハーネスが止めますが、**止まるのは表に載っている書き方だけ**です。
言い換えた書き方や、入力待ちになるコマンド（`gh auth login`、`git rebase -i` のような対話形式）は、
すり抜けて「返ってこない」状態になることがあります。

**対処**

1. **`Esc` を押します。** これで Claude Code の実行を中断できます。
2. 戻らなければ、ターミナルA で `Ctrl + C` を押し、Claude Code を起動し直します。
   会話の続きから再開できます（書いたコードが消えることはありません）。
3. 再開したら、**どこまで進んでいたか**を事実で確かめます。

```powershell
git status --short
```

4. 次からは、テストは**1回で終わる形**を使います。

```powershell
npm test
```

特定のファイルだけを流したいときはこうです。

```powershell
npm test -- src/games/<自分のゲームID>/logic.test.ts
```

保存のたびに自動でテストを流したい場合は、**ターミナルB で自分で起動します**（ターミナルA では止められます）。

ターミナルA に打つときは、範囲と形を指定しておくと安全です。

```text
npm test を1回だけ実行して、失敗しているテストの名前と最初のエラーだけを教えてください。
監視モード（watch）は使わないでください。まだ何も直さないでください。
```

対話入力が必要なコマンド（`gh auth login` など）は、**ターミナルB で自分の手で実行してください。**

---

### T-35. レビュー中に相手のコードを直そうとして止められた

**症状**
`gh pr checkout <相手のPR番号>` で相手のブランチを取ってきた状態で修正を頼むと、こう返ってくる。

```
src/games/<相手のゲームID>/logic.ts は 担当N（ゲーム名） の担当です。

あなたの担当は <自分のゲームID> です。
いま相手のブランチを取ってきている（レビュー中）だけなので、
相手のコードは変更できません。

気づいたことは、直すのではなく Pull Request のコメントで伝えてください。
自分の作業に戻るときは git switch feature/<自分のゲームID> です。
```

**原因**
**壊れていません。正しい挙動です。**

`npm run scaffold -- --game <自分のゲームID>` を実行したとき、
`.claude/.state/owner.json` に**自分のゲームID が記録**されています。
`guard-scope.mjs` はブランチ名ではなく**この記録**と突き合わせるので、
`gh pr checkout` でブランチが相手のものになっている間も、担当を見失いません。

これが無いと、レビュー中に「ついでに直しておきました」ができてしまいます。
それをやると**相手が自分のコードを説明できなくなり、レビューが成立しません。**

**対処**

**直しません。** 気づいたことは Pull Request のコメントで伝えます。

1. ターミナルA で下書きだけを作ります。

```text
いま gh pr checkout している <相手のゲームID> の Pull Request をレビューします。
src/games/<相手のゲームID>/logic.ts と logic.test.ts だけを読んで、
気になった点を3つまで挙げてください。
ファイルは1つも変更しないでください。投稿もしないでください。
それぞれ「どのファイルのどのあたりが、どういう入力のときにどうなりそうか」の形で書いてください。
```

2. **実機で確かめます**（ターミナルB のブラウザで、相手のゲームを実際に遊びます）。
   材料は `docs/games/<相手のゲームID>.md` の「レビュアー向けミッション」です。
   **確かめていないことは書きません。** これが今日のレビューの唯一の約束です。
3. 投稿は**人間の手で**行います。GitHub の画面（Files changed → Review changes）がいちばん確実です。
   コマンドで出す場合も、ターミナルB で自分の手で打ちます（ターミナルA では拒否されます）。

自分の作業に戻ります。

```powershell
git switch feature/<自分のゲームID>
```

**`owner.json` が無い、または中身が違う場合**（雛形を作る前にレビューを始めた、など）は、
自分のゲームIDで scaffold をもう一度実行すれば記録し直せます。
**すでにあるファイルは上書きされません**（「そのまま」と表示されて飛ばされます）。

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
あるいは画面の上に赤い欄が出て「読み込めなかったゲームがあります」と表示される。

**原因**
アーケードは一覧ファイルを持っていません。`src/app/registry/loadGames.ts` が
`src/games/<ゲームID>/index.ts` を**自動で集めています**（`import.meta.glob` の `import: "game"`）。
だから9人の Pull Request が同時に来ても競合しない代わりに、**規約を外すと拾われません。**

`src/app/registry/validateManifest.ts` が弾く条件は決まっています。よくあるのはこの5つです。

| 出るメッセージ | 直し方 |
|---|---|
| `export const game` を公開していません | `export default` ではなく **`export const game`** にする |
| `id` が「◯◯」ですがフォルダ名は「△△」です | `id` をフォルダ名と同じにする |
| `name` は20文字以内 / `description` は60文字以内 | 短くする |
| `status` は coming-soon / ready のいずれか | どちらかにする（→ T-20） |
| `owner` は harness/config.json に載っている担当者ID | `participant-N` を勝手に変えない |

`id` `name` `owner` `difficulty` は**運営が決めた値**です。変えると契約テストと CI が落ちます。

**対処**

まず、画面の赤い欄をそのまま読みます。**何が悪いかがフォルダ名つきで書いてあります。**
画面を見なくても、テストで同じことが分かります。

```powershell
npm test
```

`registry` の契約テストが「読み込めないゲームが1つも無い」で落ちていれば、そこに理由が出ます。

そもそもフォルダを作っていない場合は、雛形を作ります。

```powershell
npm run scaffold -- --game <自分のゲームID>
```

ターミナルA に頼む場合の文面です。

```text
src/games/<ゲームID>/index.ts だけを読んで、
src/app/registry/validateManifest.ts の条件を満たしているか確認してください。
満たしていない項目があれば、その項目名と理由だけを挙げてください。
まだ直さないでください。
```

フォルダを新しく作った直後だけは、画面に出るまでに開発サーバーの起動し直しが要ることがあります（→ T-14）。

---

### T-14. ファイルを足したのに画面に反映されない

**症状**
新しいファイルやフォルダを作ったのに、ブラウザの表示が変わらない。
あるいは画面が真っ白のまま止まっている。

**原因**
次の3つのどれかです。

1. **ブラウザを再読み込みしていない。**
2. **ゲームフォルダを新規に作った直後。** 一覧は `src/games/<ゲームID>/index.ts` を
   起動時にまとめて集める形なので、**フォルダが増えたときだけ**開発サーバーの読み直しが要ることがあります。
3. **エラーが出て止まっている。** 構文エラーや型エラーがあると、そこで更新が止まります。
   **答えはターミナルB の画面に出ています。**

**対処**

1. ブラウザで `F5`（キャッシュごと読み直すなら `Ctrl + F5`）。
2. **ターミナルB を見ます。** 赤い文字でエラーが出ていないか確認してください。
   出ていれば、その最初の1件だけをターミナルA に伝えます。

```text
ターミナルB の開発サーバーに次のエラーが出ています。原因の見当だけ教えてください。
まだ直さないでください。

<ここにエラーの1件目を貼る>
```

3. それでも変わらなければ、ターミナルB で開発サーバーを入れ直します。

```powershell
（Ctrl + C で止めてから）
npm run dev
```

**この操作はターミナルB で行います。** ターミナルA からは起動できません（→ T-33）。
別のポート（5174）で開いていないかも確認してください（→ T-03）。

---

### T-15. `@core` が解決できない

**症状**

```
Failed to resolve import "@core/deck" from "src/games/babanuki/logic.ts".
```

または lint が次のように言う。

```
@core と @ui は入口だけを使ってください（例: import { createDeck } from "@core"）。
中のファイルを直接指定することはできません。
```

**原因**
`vite.config.ts` のエイリアスは**完全一致の正規表現**（`^@core$` と `^@ui$`）で書いてあります。
そのため `@core/deck` のような**深い指定はモジュール解決の時点で失敗します。**
これは意図的な設計です。ESLint を黙らせても、契約テストとビルドが同じ場所で落ちます。

**対処**

入口からまとめて読み込みます。

```ts
import { createDeck, shuffle, createRng } from "@core";
import { GameShell } from "@ui";
```

次の書き方はすべて使えません。

| 書き方 | 理由 |
|---|---|
| `import ... from "@core/deck"` | 深い指定。エイリアスが完全一致 |
| `import ... from "../../core"` | 自分のフォルダの外を相対パスで参照している |
| `import ... from "src/core"` | `src/...` から始まる import は使いません |
| `import ... from "../daifugo/logic"` | 他の人のゲームの参照 |

何が公開されているかは `src/core/index.ts` と `src/components/index.ts` に全部書いてあります。

**エディタだけが赤い**（`npm run typecheck` は通る）場合は、TypeScript の状態がずれています。
VS Code なら、コマンドパレットから TypeScript サーバーを再起動してください。
手元での確認はこれで足ります。

```powershell
npm run typecheck
```

---

### T-16. CPU が1回しか動かない

**症状**
CPU の手番が1回だけ進んで、そのあと止まる。画面は固まっていないが、誰も動かない。

**原因**
待ち時間の作り方です。このリポジトリでは**タイマーは `useCpuTurn` の1か所だけ**にしています。

```tsx
useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
```

`useCpuTurn` は `delayMs` と `onTick` が変わるたびにタイマーを張り直します。
つまり**毎回のレンダリングで新しい関数を渡すこと**が、手番が連続する仕組みです。
次のどちらかをやると1回で止まります。

1. `onTick` を `useCallback` などで**固定してしまった**
   （`delayMs` も同じ値だと、依存が変わらずタイマーが張り直されません）
2. `pendingDelayMs(state)` が、**CPU の手番でも `null` を返している**
   （`null` の間は「人間の入力待ち」なので何も起きません）

**対処**

`onTick` は**インラインの関数**で渡します。`useCallback` で包まないでください。

```tsx
useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
```

`pendingDelayMs` が正しいかは、画面を触らずにテストで確かめられます。
`reduce` を順番に呼ぶだけで、CPU が連続して動くかどうかが分かります。

```ts
let state = createInitialState(createRng(1));
state = reduce(state, { type: "tick" });
expect(pendingDelayMs(state)).not.toBeNull();  // まだ CPU の手番が続く
```

ターミナルA に頼む場合の文面です。

```text
src/games/<ゲームID>/logic.ts の pendingDelayMs だけを読んで、
CPU の手番が続くあいだ数値を返し、人間の入力待ちのときだけ null を返しているか確認してください。
まだ直さないでください。どの分岐が怪しいかだけを教えてください。
```

`logic.ts` に `setTimeout` を書いてはいけません（ESLint と契約テストの両方が止めます → T-19）。

---

### T-17. テストが時々落ちる

**症状**
同じテストが、実行するたびに通ったり落ちたりする。CI だけ落ちることもある。

**原因**
**テストの中に、実行ごとに変わるものが入っています。** ほとんどは乱数です。

`logic.ts` の中で `Math.random()` を使うことはできません（ESLint と契約テストが止めます）。
ただし**テストの側で `createRng()` を seed 無しで呼ぶ**と、中身は `Math.random` になります。
これだと配られるカードが毎回変わるので、境界のテストが運任せになります。

時刻（`Date.now()`）や `setTimeout` に依存したテストも同じように不安定になります。

**対処**

乱数は必ず seed を渡して固定します。

```ts
const rng = createRng(1);          // 数値でも "babanuki-1" のような文字列でもかまいません
const deck = shuffle(createDeck(), rng);
```

`logic.ts` の関数は `Rng` を**引数で受け取る**形にします。中で作らないでください。

```ts
export function createInitialState(rng: Rng): BabanukiState { ... }
```

時間はテストしません。`pendingDelayMs` が**何ミリ秒か**を返すところまでがロジックの責任で、
実際に待つのは画面側（`useCpuTurn`）の仕事です（→ T-16）。

**「たまたま通った」を疑うときは、続けて2回実行してください。**

```powershell
npm test
npm test
```

seed を変えたときにも通るかを確かめると、より確実です（`createRng(1)` と `createRng(2)` の両方で書く）。

---

### T-18. `npm test` が終わらない

**症状**
テストを流したまま、いつまでも終わらない。プロンプトが返ってこない。

**原因**
2つのどちらかです。

1. **監視モードで起動している。**
   `npm test` は `vitest run` なので必ず終わります。終わらないのは
   `npx vitest`（`run` なし）・`npm run test:watch`・`npm test -- --watch` のどれかです。
   ターミナルA ではこれらは拒否されます（→ T-34）。ターミナルB では自分で起動できてしまいます。
2. **テストの中で処理が終わっていない。**
   `reduce` を繰り返し呼ぶテストで終了条件に届かず、無限に回っている場合です。
   `pendingDelayMs` が**常に数値を返し続けていないか**を疑ってください（→ T-16）。

**対処**

まず `Ctrl + C` で止めます。そのうえで、1回で終わる形を使います。

```powershell
npm test
```

自分のゲームのテストだけに絞ると、原因の切り分けが速くなります。

```powershell
npm test -- src/games/<自分のゲームID>/logic.test.ts
```

それでも終わらない場合は、無限ループを疑います。

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
`eslint.config.js` は `logic.ts` / `cpu.ts` / `rules.ts` にだけ**純粋関数のルール**を当てています。
これらのファイルは「ルールだけを書く場所」なので、次のものを持てません。

| 使えないもの | 代わりに使うもの |
|---|---|
| `Math.random()` | 引数で `Rng` を受け取り、テストでは `createRng(seed)` |
| `Date.now()` / `new Date()` | 時間は持たない。待ち時間は `pendingDelayMs` が数値を返すだけ |
| `setTimeout` / `setInterval` | 画面側の `useCpuTurn` |
| `react` / `react-dom` / `@ui` の import | 画面のことは `<Xxx>Game.tsx` へ |
| `window` / `document` | ロジックはブラウザを知りません |
| `localStorage` | `@core` の `useHighScore` / `gameKey` |

**理由は「テストが安定するから」です。** 乱数と時間を追い出すと、
`reduce` を順番に呼ぶだけでルールを検証できます（→ T-17）。

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

**`eslint-disable` は使えません。** 契約テスト（`tests/contract/boundaries.contract.test.ts`）が
`eslint-disable` という文字列の存在そのものを検査しているので、書いた瞬間にテストが赤くなります。

なお、`any` の使用・1ファイル400行超・1関数150行超・複雑度15超・`console.log` は
**警告（warn）であって、CI は落ちません。** 自分のフォルダに閉じる話なので、
機械で止めずに**レビューの題材**にしてあります。
例外は `eqeqeq`（`==` ではなく `===`）と未使用変数の2つで、これらはエラーです。

---

### T-20. `status` を `"ready"` にしたらテストが落ちた

**症状**
`index.ts` の `status` を `"coming-soon"` から `"ready"` に変えた瞬間、
それまで緑だったテストが落ちるようになった。

```
✗ 完成したゲーム（status: ready） > ロジックのテストを3件以上持っている
✗ 完成したゲーム（status: ready） > 画面が例外を出さずに描画でき、GameShell を使っている
```

**原因**
**`status: "ready"` は「完成しました」という宣言です。** その瞬間から、
`tests/contract/manifest.contract.test.tsx` が追加の条件を見はじめます。

| 条件 | 中身 |
|---|---|
| `logic.test.ts` に `it(` が**3件以上**ある | `harness/config.json` の `minTestsPerReadyGame` |
| `it.skip` / `describe.skip` が**無い** | 飛ばしたテストは数えません |
| 画面が例外を出さずに描画できる | `<Xxx>Game.tsx` が render できること |
| 画面が `GameShell` を使っている | `data-testid="game-shell"` が出ること |

`coming-soon` の間はこれらを見ません。だから「変えた瞬間に落ちる」のです。

**対処**

落ちた条件を満たします。**`ready` を取り消して逃げるのは最後の手段です。**

1. テストが3件に足りないなら、**壊れやすいところ**を足します（境界値・禁止操作・seed 固定 → T-17）。
2. `it.skip` を外します。動かないテストは、飛ばすのではなく直します。
3. 画面が `GameShell` で包まれているか確認します。

```tsx
import { GameShell } from "@ui";

export function BabanukiGame({ manifest, onExit }: GameProps) {
  return <GameShell manifest={manifest} onExit={onExit}>...</GameShell>;
}
```

確認はこれです。

```powershell
npm test
npm run verify
```

**まだ完成していないなら、`coming-soon` に戻して構いません。**
`ready` は「実機で最初から最後まで1回遊べた」ときに立てる旗です。
先に旗を立てても、CI が同じ場所で落とします。

---

## CI

### T-21. 手元では緑なのに CI の `verify` が赤

**症状**
`npm run verify` は通ったのに、Pull Request の `verify` だけが赤い。

**原因**
`npm run verify` と CI は**同じ順番で同じことを実行します**（範囲チェック → 依存 → lint → 型 → テスト → ビルド）。
それでも結果が違うときは、**見ているものが違います。**

| ずれる理由 | 中身 |
|---|---|
| **コミット・push していない** | CI が見ているのは push 済みの内容です。手元の直しは届いていません |
| **範囲チェックの見る範囲が違う** | 手元の `npm run scope` は作業ツリーだけ。CI は `origin/main` からの**ブランチ全体の差分**を見ます |
| **依存が違う** | CI は `npm ci` でまっさらに入れ直します。手元の `node_modules` が古いことがあります |
| **カバレッジ付きで走る** | CI は `npm run test -- --coverage` です |
| **依存の変更チェックが別にある** | `package.json` / `package-lock.json` の変更は専用ステップで落ちます（→ T-22） |

いちばん多いのは1番目です。**「直したのに push していない」**が半分以上を占めます。

**対処**

まず、手元に取り残しが無いか見ます。

```powershell
git status --short
git log --oneline origin/<自分のブランチ名>..HEAD
```

次に、**CI と同じ見方**で範囲チェックを流します。

```powershell
git fetch origin
node scripts/scope-guard.mjs --base origin/main --branch feature/<自分のゲームID>
```

依存をそろえてから、もう一度全部流します。

```powershell
npm ci
npm run verify
```

CI 側で何が落ちたかは、これで見られます。

```powershell
gh pr checks
gh run list --limit 5
```

**Pull Request の Summary に「落ちたときの調べ方」の表が出ています。**
どのステップが赤いかによって、見る場所が決まっているので、そこから読んでください。

---

### T-22. `package.json / package-lock.json が変更されています`

**症状**
CI の「依存が変わっていないか」ステップで落ちる。

```
::error::package.json / package-lock.json が変更されています。依存の追加は運営が行います。
```

**原因**
`npm install` を実行した（→ T-12）か、エディタや拡張機能が勝手に書き換えたかのどちらかです。
依存が変わると9人全員の Pull Request が同じファイルで競合するので、**専用のステップで止めています。**

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

**これで CI が緑にならない場合は、それ以外の変更も混ざっています。** 講師に相談してください。

---

### T-23. 必須チェック `verify` が pending のまま

**症状**
Pull Request の `verify` がいつまでも待機のまま進まない。マージボタンも押せない（→ T-27）。

**原因**
3つ考えられます。**参加者側で直せるのは1番目だけです。**

1. **Actions がまだ動いていない**（Draft でも `verify` は走ります。走っていないなら実行そのものが始まっていません）
2. **チェック名が GitHub 側に登録されていない**
   ブランチ保護は「`verify` という名前のチェックが緑になること」を要求します。
   その名前は、**一度でも CI が走ったことで初めて登録されます。**
   講師の初期設定で、保護を掛ける前にテスト用の Pull Request を流していないと、
   すべての Pull Request が永久に pending になります
3. Actions の実行が承認待ちになっている

**対処**

まず状態を見ます。

```powershell
gh pr checks
gh run list --limit 5
```

実行が1件も無ければ、空のコミットを積んで動かします。

```powershell
git commit --allow-empty -m "CI を動かす"
git push
```

それでも pending のままなら、**参加者側では直せません。**
`gh pr checks` の出力をそのまま講師に見せてください（ブランチ保護の設定側の問題です）。

**待っている間に手を止めないでください。** レビュー相手の Pull Request を先に見る、
README を書く、など先に進められる作業があります。

---

### T-31. CI で「まだ作業ブランチを作っていません」と出る

**症状**
CI の範囲チェックのログにこう出て、`verify` が赤くなる。

```
! ブランチ名が feature/<ゲームID> の形になっていません（今: fix-babanuki）
```

または `! まだ作業ブランチを作っていません（今: main）`。

**原因**
範囲チェックは**ブランチ名から担当ゲームを決めています**（`feature/<ゲームID>` の形）。
CI は detached HEAD で動くため、Pull Request のブランチ名を `--branch` で渡していますが、
その名前が規約の形になっていないと、担当を判定できません。

つまり**ブランチ名が間違っている**か、**`main` から Pull Request を出している**かのどちらかです。
ゲームIDは `harness/config.json` が正で、`babanuki` / `daifugo` / `shinkeisuijaku` /
`poker` / `butanoshippo` / `speed` / `shichinarabe` / `doubt` / `pageone` の9つです。

**対処**

**ブランチ名は後から変えられません。正しい名前で作り直します。**
今の変更はそのまま新しいブランチへ付いてきます。

```powershell
git switch -c feature/<自分のゲームID>
git push -u origin feature/<自分のゲームID>
```

新しいブランチで Pull Request を出し直し、古いほうは閉じます。

```powershell
gh pr create --base main --head feature/<自分のゲームID> --draft
```

（`gh pr create` は承認を求められます。押す前に、`--base` が `main`、
`--head` が自分のブランチになっていることを目で確かめてください → T-28）

古い Pull Request を閉じるのは**人間の操作**です。GitHub の画面から閉じてください。

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
ブラウザ認証をやり直すか、スコープを足せば直ります。

**対処**

まず今のスコープを確認します。

```powershell
gh auth status
```

`Token scopes:` に `repo` が無ければ、足します。

```powershell
gh auth refresh -s repo
```

ブラウザが開いて8桁のコードを聞かれるので、表示されたコードを貼り付けて承認します。
うまくいかない場合はログインし直します。

```powershell
gh auth login
```

| 質問 | 選ぶもの |
|---|---|
| What account do you want to log into? | `GitHub.com` |
| What is your preferred protocol? | `HTTPS` |
| Authenticate Git with your GitHub credentials? | `Yes` |
| How would you like to authenticate? | `Login with a web browser` |

**これらは対話形式なので、必ずターミナルB で自分の手で実行してください。**
ターミナルA で打つと入力待ちのまま返ってこなくなります（→ T-34）。

最後にもう一度確認します。

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
**招待を承諾していないのが最大の原因です。** 当日の朝にいちばん多く出ます。
講師が招待を送っていても、参加者が承諾するまで書き込み権限は付きません。

トークンのスコープ不足でも 403 になります（→ T-24）。

**対処**

1. GitHub の通知から招待を承諾します。

```
https://github.com/notifications
```

招待メールのリンク、または次を開いて `Accept invitation` を押しても構いません。

```
https://github.com/Daisuke0719/card_arcade
```

2. 承諾できたか確認します。

```powershell
gh repo view Daisuke0719/card_arcade --json name
npm run doctor
```

3. それでも 403 なら、`gh auth status` でスコープを見ます（→ T-24）。
4. 招待そのものが届いていない場合は、**GitHub のアカウント名を添えて講師に伝えてください。**
   再送すれば1分で解決します。

---

### T-26. 公開ページ（Pages）が 404

**症状**
公開 URL を開くと 404 になる。あるいは自分のゲームだけ出てこない。

**原因**
考えられるのは4つです。

1. **まだマージされていない。** 公開ページは `main` からしか作られません
2. **デプロイがまだ終わっていない**（マージから数分かかります）
3. **Pages が有効になっていない**（講師の初期設定 → T-32）
4. **URL が違う**（`Settings > Pages` に出ているものが正です）

**対処**

デプロイの状況を見ます。

```powershell
gh run list --workflow "Deploy to GitHub Pages"
```

`completed` `success` になっていれば、あとは URL とキャッシュの問題です。
ブラウザで `Ctrl + F5`（キャッシュを無視した再読み込み）を試してください。

URL は GitHub の `Settings > Pages` に表示されているものを使います。
このリポジトリは `vite.config.ts` で `base: "./"` にしてあるので、
サブパス配信でも `dist` の直開きでも動きます。**URL の書き換えは要りません。**

`Get Pages site failed` で赤くなっている場合は T-32 です（参加者側では直せません）。

---

### T-27. マージボタンが押せない

**症状**
Pull Request の `Merge pull request` が灰色のまま押せない。

**原因**
`main` へのマージには**3つの条件**があります。どれか1つでも欠けると押せません。

| 条件 | 確認方法 |
|---|---|
| `verify` が緑 | `gh pr checks`（pending のままなら → T-23） |
| **Approve が1件**（自分では不可） | リングで決まっている「自分をレビューする人」に頼む |
| Draft が外れている | `gh pr ready` で Ready にする |

さらに、`.github/CODEOWNERS` に載っている場所（`src/core/` `docs/` など）を変更していると、
**講師の承認が必須**になります。そもそも範囲チェックで落ちているはずなので、まず T-09 を見てください。

**対処**

状態をまとめて確認します。

```powershell
gh pr view --json number,isDraft,reviewDecision,mergeable
gh pr checks
```

Draft のままなら外します（承認を求められます）。

```powershell
gh pr ready
```

Approve が無ければ、**自分をレビューする人**に直接声をかけます。
**自分の Pull Request を自分で Approve することはできません。** GitHub が拒否します。
相手がまだ自分の実装で手一杯なら、待たずに講師へ声をかけてください。

マージするときは**必ず Squash** を選びます。

```powershell
gh pr merge <PR番号> --squash --delete-branch
```

`Conflicting files` と出ている場合は競合です。**このリポジトリでは基本的に起きません**
（ゲーム一覧は自動収集で、9人が共通で書き換えるファイルが無いため）。
起きたときは自分で解決せず、講師に相談してください。

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
Pull Request は「**`main` に対して、自分のブランチの変更を入れてください**」という依頼です。
向きが逆になっていたり、そもそも push していなかったりすると作れません。

- **push していない**（手元にしかコミットが無い）
- **コミットが1つも無い**（変更はあるが `git commit` していない）
- **`main` から作ろうとしている**（→ T-31）

**対処**

自分のブランチにいることを確かめます。

```powershell
git branch --show-current
```

`main` との差分があるかを見ます。ここが空なら、まだコミットしていません。

```powershell
git log --oneline origin/main..HEAD
```

push します（承認を求められます）。

```powershell
git push -u origin feature/<自分のゲームID>
```

そのうえで、**向きを明示して**作ります。

```powershell
gh pr create --base main --head feature/<自分のゲームID> --draft --title "ババ抜きを実装" --body-file .pr-body.md
```

`.pr-body.md` は Pull Request の説明文の下書きです（`/pr` が作ります）。
**このファイルだけは、担当フォルダの外にあってもハーネスが書き込みを許しています。**

ブラウザで作る場合は、`base: main` / `compare: feature/<自分のゲームID>` になっていることを
**目で確かめてから** Create を押してください。

**最初は必ず Draft で出します。** CI が緑になってから `gh pr ready` で Ready にします。

---

### T-30. `git push` が `workflow` スコープ不足で拒否される

**症状**

```
refusing to allow an OAuth App to create or update workflow
`.github/workflows/ci.yml` without `workflow` scope
```

**原因**
push しようとしている変更に **`.github/workflows/` の変更が含まれています。**

ここは運営が管理している場所です。参加者は本来触れないので、
**まず「なぜ入ったのか」を調べてください。** スコープを足して押し込むのは正しい対処ではありません。
だいたいは、改行コード（→ T-04）か `git add .`（→ T-09）で巻き込んだだけです。

**対処**

何が含まれているかを見ます。

```powershell
git diff --name-only origin/main...HEAD
```

`.github/` が出てきたら、`main` の内容に戻します。

```powershell
git fetch origin
git restore --source=origin/main -- .github
git add .github
git commit -m "運営管理のファイルを元に戻す"
git push
```

`npm run scope` が緑になることを確認してください。

```powershell
npm run scope
```

**これで直らない場合や、意図的に workflow を変更する必要がある場合は講師に相談してください。**
（講師が自分で変更するときは `gh auth refresh -s workflow` でスコープを足します。
参加者の端末でこれを実行する必要はありません。）

---

### T-32. Pages のデプロイが `Get Pages site failed` で落ちる

**症状**
`Deploy to GitHub Pages` ワークフローが赤くなり、ログにこう出る。

```
Error: Get Pages site failed. Please verify that the repository has Pages enabled
and configured to build using GitHub Actions
```

**原因**
リポジトリの `Settings > Pages` で、`Source` が **`GitHub Actions`** になっていません。
Pages が有効化されていないと、`actions/configure-pages` がこのエラーで落ちます。

**これは講師の初期設定の項目です。参加者側では直せません。**
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

自分のマージ自体は成功しているので、**待てば公開されます。**
`Deploy to GitHub Pages` が赤いことを講師に伝えて、次の作業に進んでください。

```powershell
gh run list --workflow "Deploy to GitHub Pages"
```

公開されたかどうかは T-26 の手順で確認できます。

---

## それでも直らないとき

このページの手順を試しても直らない場合は、**回り込む方法を探さないでください。**
探している時間が、今日いちばんもったいない使い方です。

1. ターミナルA で `/stuck <困っていることを一言>` を打つ
   （事実を集めて、次の一手を1つだけ出します。コードは変更しません）
2. その出力をそのまま講師に見せる
3. Issue に `blocked` ラベルを付ける（1人で作っているので、黙っていると誰も気づけません）

**15分進まなかったら手を挙げる。** これが今日の唯一のルールです。

止められた理由そのものを知りたいときは [docs/harness.md](harness.md) を読んでください。
「なぜ止まるのか」と「止められたら次に何をするか」が1ページにまとまっています。
