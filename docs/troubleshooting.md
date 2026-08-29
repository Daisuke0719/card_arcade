# トラブル対処集（T-01 〜 T-32）

エラーで詰まったときに開くページです。**番号が付いています。**
CI のまとめや Issue、講師からの連絡で「T-09 を見て」と言われたら、この番号を探してください。

## 使い方

1. まず `npm run doctor` を実行する（環境まわりならここでほぼ分かります）
2. 症状に近いものを下の索引から探す
3. 「対処」のコマンドを**上から順に**そのまま実行する
4. それでも直らなければ、**手を止めて講師に相談する**（回り込む方法を探さないでください）

コマンドはすべて PowerShell にそのまま貼り付けて動きます。

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

---
