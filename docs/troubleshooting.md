# トラブル対処集（T-01 〜 T-28）

エラーで詰まったときに開くページです。**番号が付いています。**
CI のまとめや Issue、講師からの連絡で「T-09 を見て」と言われたら、この番号を探してください。

## 使い方

1. まず `npm run doctor` を実行する（環境まわりならここでほぼ分かります）
2. 症状に近いものを下の索引から探す
3. 「対処」のコマンドを**上から順に**そのまま実行する
4. それでも直らなければ、**手を止めて講師に相談する**（回り込む方法を探さないでください）

コマンドはすべて PowerShell にそのまま貼り付けて動きます。

## 索引

| 分類 | 番号 | 症状 |
|---|---|---|
| 環境 | T-01 | Node.js のバージョンが違う |
| 環境 | T-02 | `npm ci` が失敗する |
| 環境 | T-03 | ポート 5173 が使用中で `npm run dev` が起動しない |
| 環境 | T-04 | clone しただけなのに `git status` が全ファイル変更になる |
| 環境 | T-05 | パスに日本語やスペースが含まれていて動かない |
| 環境 | T-06 | PowerShell が「スクリプトの実行は無効」と言う |
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
| GitHub | T-24 | `gh` のトークンに権限が足りない |
| GitHub | T-25 | リポジトリにアクセスできない（403） |
| GitHub | T-26 | 公開ページ（Pages）が 404 |
| GitHub | T-27 | マージボタンが押せない |
| GitHub | T-28 | `gh pr create` が失敗する / Pull Request の向きが違う |

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
`npm ci` の途中で `EPERM` / `ENOENT` / `Cannot read properties of null` などが出て終わらない。

**原因**
`node_modules` が壊れている、開発サーバーやエディタがファイルを掴んでいる、社内プロキシ、
または `npm install` を先に実行して `package-lock.json` がずれている。

**対処**

まず動いているものを止めます（`npm run dev` は `Ctrl + C`、VS Code も一度閉じる）。

```powershell
Remove-Item -Recurse -Force node_modules
npm cache clean --force
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

## ハーネス（止められたとき）

### T-07. Claude が「変更できません」と言う

**症状**
Claude Code が次のように答えて、編集をやめてしまう。

```
src/core/deck.ts は運営が管理している場所なので変更できません。
編集してよいのは src/games/<自分のゲームID>/ の中だけです。
```

**原因**
不具合ではありません。**設計どおりの動作**です。
`.claude/hooks/guard-scope.mjs` が、担当フォルダの外への書き込みを止めています。

**対処**

止められた場所によって、やることが変わります。

| 止められた場所 | やること |
|---|---|
| `src/core/` `src/components/` `scripts/` `docs/` など | 自分では直さない。**講師に相談する** |
| 他チームのゲームフォルダ | 触らない。指摘したいことがあればレビューコメントで伝える |
| `src/games/<自分のゲームID>/` なのに止められた | ブランチ名が違います（下記） |

自分のフォルダなのに止められる場合は、ブランチ名を確認してください。

```powershell
git branch --show-current
```

`feature/<自分のゲームID>` になっていなければ、作り直します。

```powershell
git switch -c feature/babanuki
```

**回り込む方法（`sed -i`、リダイレクト、`cp` での上書きなど）を探さないでください。**
仮にフックをすり抜けても、`pre-commit` と CI が同じ判定で止めます。
共通基盤に足りないものがあると思ったときは、次の形で講師に伝えてください。

```
- やりたいこと:
- 足りないと思うもの:
- ゲーム側だけで実現する案（あれば）:
```

---

### T-08. フックが動いていないように見える

**症状**
担当外を編集できてしまう。セッション開始時に「担当: Team A / ババ抜き」の案内が出ない。
コミットしても範囲チェックが走らない。

**原因**
Claude Code のフックはセッション開始時に読み込まれます。設定を読み直していない、
または `git` のフックパスが設定されていない（`npm ci` を実行していない）ことがほとんどです。

**対処**

まず git 側を確認します。

```powershell
git config core.hooksPath
```

`.githooks` と表示されなければ、`npm ci` をやり直します（`prepare` が自動設定します）。

```powershell
npm ci
git config core.hooksPath
```

Claude Code 側は、**セッションを終了して開き直して**ください。
それでも案内が出ない場合は、フックを直接動かして原因を見ます。

```powershell
node .claude/hooks/session-brief.mjs
```

エラーが出たらその内容を講師に見せてください。

**なお、フックが動かなくても最後の砦は残っています。**
`npm run verify` の範囲チェックと CI が同じスクリプトを使っているので、
範囲外の変更はマージできません。慌てずに `npm run scope` を自分で回してください。

---

### T-09. 範囲チェックで落ちる

**症状**

```
✗ 担当範囲の外が変更されています（1件）

  [運営管理] src/core/deck.ts
```

`npm run scope` / `npm run verify` / `pre-commit` / CI のどこで出ても、原因と対処は同じです。

**原因**
`src/games/<自分のゲームID>/` の外が変更されています。よくあるのは次の4つです。

| よくある原因 | 見分け方 |
|---|---|
| `git add .` で一時ファイルを巻き込んだ | 一覧に `.vscode/` や `dist/` などが並ぶ |
| 改行コードで全ファイルが変更扱い | 数百件出る → **T-04** |
| ブランチを間違えている | 「ブランチ名と変更しているゲームが一致していません」と出る |
| Claude が共通基盤を直そうとした | `src/core/` などが1〜2件だけ出る |

**対処**

`npm run scope` の出力の最後に、**そのままコピペできる復元コマンド**が出ます。

```powershell
npm run scope
```

```
元に戻すには、次のコマンドをそのまま実行してください:

  git restore --source=HEAD --staged --worktree -- src/core/deck.ts
```

これをそのまま貼り付けて実行し、もう一度確認します。

```powershell
git restore --source=HEAD --staged --worktree -- src/core/deck.ts
npm run scope
```

`✓ 範囲チェック OK` になれば復旧です。

「まだ作業ブランチを作っていません」と出た場合は、先にブランチを作ります。

```powershell
git stash
git switch -c feature/babanuki
git stash pop
npm run scope
```

「1つの Pull Request で複数のゲームを変更しています」と出た場合は、
自分の担当以外のゲームフォルダを `git restore` で戻してください。

**共通基盤の変更が本当に必要だと思ったときは、自分で直さずに講師に相談してください。**

---

### T-10. `pre-commit` で止まってコミットできない

**症状**

```
コミットを中止しました。
どうしてもこのままコミットする必要がある場合は講師に相談してください。
```

**原因**
コミットしようとしている変更に、担当フォルダの外が含まれています。
`.githooks/pre-commit` が `scripts/scope-guard.mjs --staged` を実行して止めました。
**CI とまったく同じスクリプト**なので、ここで止まる変更は CI でも必ず落ちます。

**対処**

止まった内容をそのまま読み、T-09 の手順で戻します。

```powershell
git status
npm run scope
```

範囲外のファイルだけをコミット対象から外したい場合は、こうします。

```powershell
git restore --staged .vscode/settings.json
git status
git commit -m "feat: ..."
```

**`--no-verify` は使えません。** ハーネスが止めます。落ちた理由を直してからコミットしてください。

---

### T-11. 「まだ npm run verify を通していない」と引き止められる

**症状**
Claude Code が作業を終えようとしたときに、こう表示される。

```
まだ npm run verify を通していない変更があります。
```

**原因**
不具合ではありません。研修でいちばん多い失敗が「動いたつもりで Pull Request を出したら CI が赤」なので、
1回だけ声をかける仕組みになっています（`.claude/hooks/require-verify.mjs`）。

**対処**

素直に実行してください。

```powershell
npm run verify
```

`✓ npm run verify がすべて通りました。` が出れば、以降このメッセージは出ません。
**同じ内容では2回目は引き止めません**ので、作業が詰まることはありません。

---

### T-12. 依存を追加しようとして止められた

**症状**

```
依存パッケージの追加・更新はできません: npm install lodash
```

**原因**
設計どおりの動作です。依存を入れると `package-lock.json` が変わり、
**6チーム全員の Pull Request が競合します**。CI も `package.json` / `package-lock.json` の変更を検出して落とします。

**対処**

必要な機能はほぼすべて `@core` と `@ui` に揃っています。まず早見表を見てください。

- `src/games/CLAUDE.md` の「@core の早見表」「@ui の早見表」
- `src/core/index.ts` と `src/components/index.ts`（ここに無いものは「無い」と考えてよい）

シャッフル・山札・ターン管理・待ち時間・保存・スコア表示は全部あります。
それでも足りないと感じたら、**自分で入れずに講師に相談してください。**

すでに `npm install` してしまった場合は元に戻します。

```powershell
git restore package.json package-lock.json
npm ci
npm run scope
```

---

## 実装

### T-13. アーケード一覧に自分のゲームが出ない

**症状**
`npm run dev` を開いても、自分のゲームのタイルが出てこない。
または一覧の上に「読み込めなかったゲームがあります」と赤く出る。

**原因**
`src/games/<ゲームID>/index.ts` が公開している `game` の内容が規約に合っていません。
画面にはその理由がそのまま日本語で表示されます。

**対処**

まず画面の赤い枠に書かれたメッセージを読んでください。よくあるのは次の3つです。

| メッセージ | 直し方 |
|---|---|
| `index.ts が export const game を公開していません` | `export default` ではなく **`export const game`** にする |
| `id が「xxx」ですがフォルダ名は「yyy」です` | `id` をフォルダ名と一致させる（フォルダ名は変更禁止） |
| `component に React コンポーネントを指定してください` | `component: BabanukiGame` のように**関数そのもの**を渡す（`<BabanukiGame />` ではない） |

そのほか `name` は20文字以内、`description` は60文字以内、`howToPlay` は1行以上、
`minPlayers <= maxPlayers <= 6`、`difficulty` は `easy / normal / hard`、
`team` は `team-a` 〜 `team-f` である必要があります。

確認はテストでもできます。

```powershell
npm test
```

`registry` と `manifest` の契約テストが同じことを見ています。

なお、`status: "coming-soon"` のままでもタイルは出ます（`COMING SOON` 表示になります）。
**タイル自体が出ないのは `index.ts` の問題**です。

---

### T-14. ファイルを足したのに画面に反映されない

**症状**
新しくゲームフォルダを作った（`npm run scaffold` した）のに、一覧に出てこない。
`import.meta.glob` が拾っていないように見える。

**原因**
`import.meta.glob("../../games/*/index.ts")` は**開発サーバー起動時に解決されます**。
フォルダを新しく作った場合、起動中の Vite が新しいパターンを拾えないことがあります。

**対処**

開発サーバーを一度止めて、起動し直してください。

```powershell
# 実行中のターミナルで Ctrl + C
npm run dev
```

それでも出ない場合は、次を順に確認します。

```powershell
Get-ChildItem src/games
```

- フォルダが `src/games/<ゲームID>/` の直下にあるか（1階層深くしない）
- その中に `index.ts` があるか（`Index.ts` や `index.tsx` ではない）
- `index.ts` が `export const game` を公開しているか（→ T-13）

キャッシュが残っている場合はこうします。

```powershell
Remove-Item -Recurse -Force node_modules/.vite
npm run dev
```

---

### T-15. `@core` が解決できない

**症状**

```
Failed to resolve import "@core/deck" from "src/games/babanuki/logic.ts"
```

または `Cannot find module "@core"` と型エラーになる。

**原因**
`@core` と `@ui` は**入口だけ**が使えます（`vite.config.ts` の alias が完全一致になっています）。
`@core/deck` のような深い指定は、モジュール解決の時点で失敗します。これは意図的な設計です。

**対処**

入口から名前で取り出してください。

```ts
// NG
import { createDeck } from "@core/deck";
import { Card } from "@ui/Card/Card";

// OK
import { createDeck, shuffle, createRng } from "@core";
import { Card, Hand, GameShell } from "@ui";
```

相対パスで外に出るのも禁止です（`import ... from "../../core"` は lint と契約テストが止めます）。

使える名前の一覧は `src/games/CLAUDE.md` の早見表、
または `src/core/index.ts` と `src/components/index.ts` にあります。**ここに無いものは「無い」と考えてください。**

`@core` 自体が見つからないと言われる場合は、依存が入っていません。

```powershell
npm ci
npm run typecheck
```

---

### T-16. CPU が1回しか動かない

**症状**
CPU の手番が1回だけ進んで、そのあと止まってしまう。
あるいは自分の手番になっても盤面が固まったまま。

**原因**
`useCpuTurn` に渡すコールバックを `useCallback` などで固定してしまい、
`state` が古いまま参照されているケースがほとんどです。

**対処**

`<Xxx>Game.tsx` はこの1行だけにします。**インラインの関数で渡してください。**

```tsx
useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));
```

それでも止まる場合は、`logic.ts` 側を疑います。

- `pendingDelayMs(state)` が、次に自動処理が必要な局面で `null` を返していないか
- `reduce(state, { type: "tick" })` が状態を進めているか（同じ状態を返し続けていないか）

これは画面を触らずにテストで確かめられます。これが `logic.ts` を分けている理由です。

```ts
let s = createInitialState(1);
while (pendingDelayMs(s) !== null) {
  s = reduce(s, { type: "tick" });
}
expect(s.phase).toBe("finished");
```

**`.tsx` の中に `setTimeout` を書かないでください。** 時間の扱いは `useCpuTurn` 1本だけです。

---

### T-17. テストが時々落ちる

**症状**
`npm test` を続けて実行すると、通ったり落ちたりする。CI だけ落ちる。

**原因**
乱数か時間に依存しています。`Math.random()` `Date.now()` `new Date()` は
`logic.ts` / `cpu.ts` では ESLint と契約テストが禁止していますが、テストファイル側で使ってしまうことがあります。

**対処**

乱数は必ず引数で受け取り、テストでは seed を固定します。

```ts
import { createRng, shuffle } from "@core";

const rng = createRng(42);
const deck = shuffle(createDeck(), rng);
```

同じ seed なら常に同じ並びになるので、期待値を直接書けます。

配られた手札に依存しないテストにしたい場合は、テスト用のヘルパーで手札を直接作ります。

```ts
import { card, hand } from "@core";

const yours = hand("spades-A", "hearts-K");
```

「たまたま通る」テストは、レビューで必ず指摘対象になります。

---

### T-18. `npm test` が終わらない

**症状**
テストが全部通ったのに、プロンプトが返ってこない。Claude Code のセッションが固まったように見える。

**原因**
`vitest` を監視（watch）モードで起動しています。

**対処**

`Ctrl + C` で止めて、`npm test` を使ってください。

```powershell
npm test
```

`npm test` は `vitest run` です（1回だけ実行して終わります）。
**`npx vitest` を直接実行しないでください。** ハーネスが止めます。

書きながら自動で回したいときだけ、監視モードを明示的に使います。

```powershell
npm run test:watch
```

これは自分の手で実行するときだけにしてください（`q` で終了します）。

---

### T-19. lint が `logic.ts` の書き方を拒否する

**症状**

```
logic.ts と cpu.ts は「純粋なルール」だけを書く場所です。画面のことは <Xxx>Game.tsx に書いてください。
Math.random() は使えません。乱数は引数で Rng を受け取り、テストでは createRng(seed) で固定します。
```

**原因**
設計どおりです。`logic.ts` と `cpu.ts` からは react / `@ui` / `Math.random()` / `Date.now()` /
`new Date()` / `window` / `document` / `localStorage` が使えません。

**対処**

| 書きたかったもの | 正しい場所 |
|---|---|
| `useState` などの react | `<Xxx>Game.tsx` |
| `@ui` のコンポーネント | `<Xxx>Game.tsx` |
| `Math.random()` | 引数で `Rng` を受け取る（`chooseMove(state, rng)`） |
| `setTimeout` / `Date.now()` | `pendingDelayMs(state)` を返し、画面の `useCpuTurn` に任せる |
| `localStorage` | `@core` の `useHighScore` / `gameKey` |

**`eslint-disable` コメントで黙らせないでください。**
同じことを `tests/contract/boundaries.contract.test.ts` が別の方法で見ているので、テストで落ちます。

「勝ったかどうか」を `.tsx` の中で計算し始めたら、それは `logic.ts` に移すサインです。

---

### T-20. `status` を `"ready"` にしたらテストが落ちた

**症状**
`index.ts` の `status` を `"ready"` にした途端、契約テストが赤くなる。

```
babanuki のテストが 2件しかありません
src/games/babanuki/README.md に ## 実装メモ がありません
babanuki が GameShell を使っていません
```

**原因**
設計どおりです。`"ready"` は「アーケードで公開してよい」という宣言なので、
最低限の条件を契約テストが確認します。

**対処**

`"ready"` にするために必要なものは3つです。

1. `logic.test.ts` に `it(...)` が **3件以上**あること
2. `README.md` に **`## 遊び方` `## ルール` `## 実装メモ`** の3つの見出しがあること
3. 画面が例外を出さずに描画でき、`GameShell` で包まれていること

また、`it.skip` / `describe.skip` が1つでも残っていると落ちます。
書きかけのテストは skip で残さず、消すか完成させてください。

```tsx
return (
  <GameShell title="ババ抜き">
    {/* 中身 */}
  </GameShell>
);
```

必須要件が終わって `npm run verify` が緑になってから `"ready"` に変えてください。
まだ途中なら `status: "coming-soon"` に戻せば、テストは通ります。

---

## CI（GitHub Actions）

### T-21. 手元では緑なのに CI の `verify` が赤

**症状**
`npm run verify` は通るのに、Pull Request の `verify` が失敗する。

**原因**
見ている差分の範囲が違います。手元の `npm run scope` は「今の作業ツリー」を見ますが、
CI は `origin/main` からの**ブランチ全体の差分**を見ます。
つまり「前のコミットで範囲外を触っていて、その後戻した」場合、手元は緑・CI は赤になります。

そのほかに多いのは次の3つです。

| CI で赤くなったもの | 見るところ |
|---|---|
| 範囲チェック | ブランチ全体の差分（下記） |
| 依存の変更 | **T-22** |
| テスト | 乱数や時間に依存していないか（**T-17**） |

**対処**

まず、CI が見ているのと同じ差分を手元で出します。

```powershell
git fetch origin
git diff --name-only origin/main...HEAD
node scripts/scope-guard.mjs --base origin/main
```

ここに担当外のファイルが出たら、`main` の内容に戻して push します。

```powershell
git restore --source=origin/main -- <そのファイル>
git add <そのファイル>
git commit -m "fix: 担当範囲外の変更を元に戻した"
git push
```

CI の詳しい出力はここで読めます。

```powershell
gh pr checks
gh run view --log-failed
```

Pull Request の Summary には、6チームの状況と「落ちたときの調べ方」の表も出ています。

---

### T-22. `package.json / package-lock.json が変更されています`

**症状**

```
::error::package.json / package-lock.json が変更されています。依存の追加は運営が行います。
```

**原因**
`npm install` を実行した、または依存を追加しました。
`package-lock.json` が変わると**6チーム全員の Pull Request が競合する**ので、CI で止めています。

**対処**

`main` の内容に戻して、`npm ci` で入れ直します。

```powershell
git restore --source=origin/main -- package.json package-lock.json
git add package.json package-lock.json
git commit -m "fix: package-lock.json を main の状態に戻した"
npm ci
npm run verify
git push
```

以後は **`npm install` ではなく `npm ci`** を使ってください（→ T-12）。

---

### T-23. 必須チェック `verify` が pending のまま

**症状**
Pull Request の下に `Expected — Waiting for status to be reported` と出たまま、いつまでも進まない。マージできない。

**原因**
よくあるのは次の3つです。

1. まだ push していない（Pull Request にコミットが1件も乗っていない）
2. `main` 以外を向いた Pull Request になっている（CI は `main` 向きの Pull Request でだけ動きます）
3. GitHub Actions が混んでいて順番待ちになっている（研修の終盤に起きやすい）

**対処**

まず状態を見ます。

```powershell
gh pr checks
gh run list --limit 5
```

`queued` なら待つだけです（数分かかることがあります）。
まったく実行されていない場合は、向き先を確認します。

```powershell
gh pr view --json baseRefName,headRefName
```

`baseRefName` が `main` でなければ、Pull Request を作り直してください（→ T-28）。

空コミットで再実行を促す方法もあります。

```powershell
git commit --allow-empty -m "chore: CI を再実行"
git push
```

なお `pr-meta (advisory)` は **Draft では動きません**。これは必須チェックではないので、pending でも問題ありません。

---

## GitHub

### T-24. `gh` のトークンに権限が足りない

**症状**

```
HTTP 403: Resource not accessible by personal access token
```

`npm run doctor` が「トークンに repo 権限がありません」で `✗` になる。

**原因**
`gh auth login` のときに `repo` スコープが付いていません。

**対処**

まず今のスコープを確認します。

```powershell
gh auth status
```

`Token scopes:` に `repo` が無ければ、追加します。

```powershell
gh auth refresh -h github.com -s repo
```

うまくいかない場合は、ログインし直します。

```powershell
gh auth logout
gh auth login
```

`How would you like to authenticate?` では **`Login with a web browser`** を選んでください
（トークン貼り付けを選ぶとスコープ不足になりがちです）。

---

### T-25. リポジトリにアクセスできない（403 / Not Found）

**症状**

```
GraphQL: Could not resolve to a Repository with the name 'Daisuke0719/card_arcade'.
```

または `git push` が 403 で拒否される。`npm run doctor` の「リポジトリにアクセスできるか」が `✗`。

**原因**
collaborator の招待を承諾していません。招待を承諾するまで、private リポジトリは「存在しない」扱いになります。

**対処**

1. GitHub からの招待メールを開き、`Accept invitation` を押す
2. またはブラウザで直接開く: https://github.com/Daisuke0719/card_arcade/invitations
3. 承諾したら確認する

```powershell
gh repo view Daisuke0719/card_arcade
npm run doctor
```

招待が届いていない場合は、GitHub のユーザー名を講師に伝えてください（メールアドレスではなくユーザー名です）。

---

### T-26. 公開ページ（Pages）が 404

**症状**
マージしたのに、公開 URL を開くと `404 There isn't a GitHub Pages site here.` と出る。

**原因**
デプロイがまだ終わっていないか、まだ一度も走っていません。
`Deploy to GitHub Pages` は **`main` への push でだけ**動きます（Pull Request では動きません）。

**対処**

デプロイの状況を見ます。

```powershell
gh run list --workflow "Deploy to GitHub Pages" --limit 5
```

`in_progress` なら1〜3分待ってから再読み込みしてください。
研修の終盤は6つの Pull Request が続けてマージされるため、デプロイが順番待ちになります（意図的に直列にしています）。

失敗している場合はログを見ます。

```powershell
gh run view --log-failed
```

一度も実行されていない場合は、リポジトリの `Settings > Pages` で
`Source` が `GitHub Actions` になっているかを講師に確認してもらってください。

なお、公開ページのタイルは各チームが `status: "ready"` にしたゲームだけが遊べる状態になります。
`COMING SOON` のままなら 404 ではなく仕様です（→ T-20）。

---

### T-27. マージボタンが押せない

**症状**
Pull Request の画面で `Merge pull request` が灰色のまま押せない。
`gh pr merge` が `Pull request is not mergeable` で失敗する。

**原因**
マージには次の条件がすべて必要です。

| 条件 | 確認方法 |
|---|---|
| `verify` が緑 | `gh pr checks` |
| Approve が1件以上 | `gh pr view --json reviewDecision` |
| Draft を外している | `gh pr ready` |
| コンフリクトしていない | `gh pr view --json mergeable` |
| 保護領域を変更していない | 変更していると講師（CODEOWNERS）の承認が必要 |

**対処**

```powershell
gh pr checks
gh pr view --json reviewDecision,mergeable,isDraft
```

- `isDraft: true` → `gh pr ready`
- `reviewDecision` が空 → レビュー担当チームに Approve を頼む（**自分では Approve できません**）
- `Review required from code owners` と出る → `src/core/` などを変更しています。
  範囲外の変更を戻してください（→ T-09）。戻せない事情があるときは講師に相談してください
- `mergeable: CONFLICTING` → `docs/github-workflow.md` の巻き戻し集 G

マージは **`Squash and merge`** を使ってください。

```powershell
gh pr merge 12 --squash --delete-branch
```

---

### T-28. `gh pr create` が失敗する / Pull Request の向きが違う

**症状**

```
pull request create failed: GraphQL: No commits between main and feature/babanuki
```

または、作られた Pull Request の差分が空・他チームの変更まで入っている。

**原因**
push していない、コミットが1件も無い、または base（向き先）が `main` になっていません。

**対処**

まず、コミットと push の状態を確認します。

```powershell
git log origin/main..HEAD --oneline
git status
```

何も出なければ、まだコミットしていません。

```powershell
git add src/games/babanuki
git commit -m "feat: ババ抜きを実装"
git push -u origin HEAD
```

そのうえで作り直します。base は明示するのが確実です。

```powershell
gh pr create --draft --base main --head feature/babanuki --title "ババ抜きを実装" --body-file .pr-body.md
```

すでに間違った Pull Request を作ってしまった場合は、閉じてから作り直します。

```powershell
gh pr close <番号>
```

`.pr-body.md` が無いと言われたら、Claude Code の `/pr` を実行してから作ってください。

---

## それでも直らないとき

**回り込む方法を探さないでください。** 30分溶かすより、5分で聞くほうが早いです。

講師に伝えるときは、次の3つをそのまま見せてください。

```powershell
git branch --show-current
git status
npm run doctor
```

加えて、**最初に出たエラーメッセージ1件**を正確に伝えてください
（後続のエラーは巻き添えであることがほとんどです）。

Claude Code を使っている場合は `/stuck <困っていること>` を実行すると、
この情報を集めて「次の一手を1つだけ」出してくれます。

関連するページ:

| 見るもの | 内容 |
|---|---|
| `docs/github-workflow.md` | Git / GitHub の操作と巻き戻し集 |
| `docs/handson-steps.md` | 当日の手順 |
| `src/games/CLAUDE.md` | `@core` / `@ui` の早見表と、よくある失敗 |
| `src/games/example-game/` | お手本の実装 |
| `docs/games/<ゲームID>.md` | ルールの正典 |
