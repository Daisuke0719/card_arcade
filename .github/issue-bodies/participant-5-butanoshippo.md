# ぶたのしっぽ（`butanoshippo`）を実装する

CARD ARCADE に **ぶたのしっぽ** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | 担当5 |
| 難易度 | 初級 |
| ブランチ | `feature/butanoshippo` |
| 編集してよい範囲 | `src/games/butanoshippo/` の中**だけ** |
| ルール文書 | [`docs/games/butanoshippo.md`](../blob/main/docs/games/butanoshippo.md) |

実装するルールは、この Issue とルール文書に記載されたものに限ります。

## 進め方（フェーズ3〜6）

この研修では、Claude Code にプロンプトを入力して作業を進めます。
次のコードブロックは、ターミナルAにそのまま貼り付けて使用できます。
各フェーズの詳しい説明は `docs/handson-steps.md` に掲載しています。

### 2つのターミナルを使う

| | ターミナルA（Claude Code） | ターミナルB（参加者が操作） |
|---|---|---|
| 常駐するもの | `claude` のセッション | `npm run dev`（研修中は起動したままにする） |
| ここで行うこと | 調査・実装の依頼・差分の確認・文章の下書き | ブラウザでの動作確認 / `npm test` の結果確認 / CI の確認 / 承認の判断 |

開発サーバーは、参加者がターミナルBから起動します。

```powershell
npm run dev
```

ブラウザで `http://localhost:5173/` を開き、研修中は開いたままにします。

> **ターミナルAで `npm run dev` の実行を依頼すると、拒否メッセージが表示されます。**
> コマンドを実行するとセッションを操作できなくなり、ターミナルBで使う `5173` 番ポートとも競合するためです。
> 画面は、ターミナルBの開発サーバーとブラウザで確認します。

### 1. ブランチを作成し、雛形を生成する

次のプロンプトをターミナルAに入力します。

```text
これから butanoshippo の実装を始めます。次の5つを、この順番で実行してください。

1. git switch main
2. git pull
3. git switch -c feature/butanoshippo
4. npm run scaffold -- --game butanoshippo
5. npm test

実行後、src/games/butanoshippo/ に生成された5つのファイルについて、
「ファイル名 … 役割」の形式で1行ずつ、合計5行で説明してください。

ファイルは変更せず、まだ実装を始めないでください。
```

処理が終わったら、いったん `/exit` し、`claude` を起動し直します。
起動時の案内とステータスラインに、担当ゲームが反映されます。

`index.ts` の `owner` には担当者が設定されています。
`id`、`name`、`owner`、`difficulty` はあらかじめ決められた値です。変更すると契約テストと CI が失敗するため、そのまま使用してください。

ターミナルBでブラウザを `F5` キーで再読み込みし、一覧に「ぶたのしっぽ」が「準備中」と表示されることを確認します。

### 2. 最初のコミットと Draft の Pull Request 作成

実装前の雛形の段階で Draft の Pull Request を作成し、権限、CI、改行コードに関する問題がないことを確認します。

push や Pull Request の作成前に変更内容を確認できるよう、プロンプトを2つに分けます。

1つ目のプロンプトでは、変更内容を確認してからコミットします。

```text
コミットの前に git status --short を実行し、変更されたファイルの一覧をそのまま表示してください。

そのうえで、git add の対象は src/games/butanoshippo だけにして、
次のメッセージでコミットしてください。

  chore(butanoshippo): 雛形を追加する

src/games/butanoshippo の外にあるファイルは、1つも add しないでください。
```

2つ目のプロンプトでは、push と Draft の Pull Request 作成を依頼します。実行前に承認画面が表示されます。

```text
push して、Draft の Pull Request を作ってください。

- push: git push -u origin HEAD
- PR: gh pr create --draft --title "butanoshippo を実装する" --body "雛形を置いただけの Draft です。実装はこれから進めます。Closes #9"

作成した Pull Request の番号を最後に教えてください。
gh pr ready は実行しないでください。Draft のままにします。
```

> 承認する前に、画面に表示されたコマンドを確認します。
> 特に `Closes #9` が担当の Issue 番号になっているかを確認してください。
> 番号が違うと、別の Issue を閉じてしまいます。
>
> 番号が違う場合は `n` を押し、次のプロンプトで修正を依頼します。
>
> ```text
> Closes の番号が違います。私の Issue は #9 です。そこだけ直してもう一度出してください。
> ```

CI が成功したことは、ターミナルBで確認します。

```powershell
gh pr checks <自分のPR番号> --watch
```

`verify` が失敗した場合は、実装へ進む前に修正します。担当フォルダの外を `git add` したことが原因であれば、次のプロンプトをターミナルAに入力します。

```text
npm run scope を実行して、範囲外の変更があるか確認してください。
範囲外があれば、scope の出力に示された git restore のコマンドをそのまま実行して戻してください。
src/games/butanoshippo の中身は消さないでください。
```

### 3. 実装の計画を先に立てる

CI が成功したことを確認してから、ターミナルAで実装計画の作成を依頼します。

```text
GitHub の Issue #9 と docs/games/butanoshippo.md を読んで、
src/games/butanoshippo/ にこのゲームをどう実装するか計画を立ててください。

- Issue にも docs/games/butanoshippo.md にも書かれていないルールは足さないでください。
- まだコードは書かないでください。ファイルも変更しないでください。
```

作成された計画を、この Issue の「必須要件」と上から順に照合します。
どの実装が対応するのか分からない要件があれば、その要件を示して計画の修正を依頼します。

```text
必須要件の「<この Issue の要件の文言をそのまま貼る>」に対応する項目が計画にありません。
どの項目で実現するか分かるように、計画へ追記してください。まだ実装はしないでください。
```

```text
計画の「<計画の中の1行をそのまま貼る>」は、Issue にも docs/games/butanoshippo.md にも書かれていないルールです。
実装対象ではないため、計画から外してください。まだ実装はしないでください。
```

### 4. 最後まで遊べる状態にする

計画が Issue とルール文書に一致していれば、実装を依頼します。この段階では、細かい仕上げよりも最後まで遊べる状態にすることを優先します。

```text
その計画で実装してください。まず最後まで遊べる状態にすることを優先し、発展課題には手を付けないでください。
```

ここからは、ブラウザで動作を確認しながら修正します。
プランモード（`/plan`）で改善計画を作成し、内容を確認してから修正を依頼します。

```text
ブラウザでゲームを操作すると、<起きたこと> が発生しました。期待する動作は <期待していたこと> です。

原因を特定して改善策を計画してください。
まだファイルは変更しないでください。
```

提示された計画が報告した不具合に対応していることを確認してから、修正を依頼します。修正後は、ブラウザを再読み込みして同じ操作を試します。

必須要件をすべて満たしたら、アーケードの一覧から遊べる状態にします。

```text
src/games/butanoshippo/index.ts の status を "ready" にしてください。
ほかの項目（id / name / owner / difficulty）は変更しないでください。
変更後に npm test を実行し、結果を報告してください。
```

### 5. Pull Request を提出する

```text
Pull Request を提出します。次を順に実行してください。

1. npm run verify
2. git add src/games/butanoshippo
3. git commit -m "feat(butanoshippo): ゲームを実装する"
4. git push
5. .github/PULL_REQUEST_TEMPLATE.md の形式で、Pull Request の本文を .pr-body.md に書く
6. gh pr edit <自分のPR番号> --body-file .pr-body.md

npm run verify が失敗したら、そこで止めて最初のエラーだけを報告してください。
本文は git diff origin/main...HEAD を確認し、実際の変更内容にもとづいて書いてください。
満たせていない必須要件があれば、「発展課題・未対応事項」に明記してください。

gh pr ready は実行しないでください。ターミナルBで実行します。
```

Draft の解除は、参加者がターミナルBで実行します。

```powershell
gh pr ready <自分のPR番号>
gh pr checks <自分のPR番号> --watch
```

`verify` が成功したら、講師に PR 番号を伝えてください。マージは講師が行います。

## 必須要件

- [ ] 52枚が伏せたまま輪として並び、次にめくるカードと残り枚数が画面で分かる
- [ ] 手番のプレイヤーが輪から1枚めくり、場の中央に重なる（プレイヤーの手番では先頭のカードをクリック）
- [ ] めくったカードが直前のカードと同じランクなら、場札を全部そのプレイヤーが引き取る
- [ ] 引き取りが起きると場が空になり、**引き取った人の次の人**から再開する
- [ ] 輪のカードが尽きたらゲームが終了する（最後の1枚の引き取りも処理してから終わる）
- [ ] 4人の引き取り枚数が常に画面に出ている（`ScoreBoard`）
- [ ] 引き取り枚数が少ない順の順位が `ResultModal` に出る
- [ ] 輪のカードは裏向き（`face="down"`）で表示され、中身が DOM に出ない
- [ ] CPU の手番は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] CPU の手番中や引き取りの演出中にクリックしても場が進まない
- [ ] 下の「必須テスト」6件が `logic.test.ts` にあり、`npm run verify` が成功する

## 実装の進め方

最初に、ゲームを最後まで操作できる状態を作ります。
その後、ブラウザで動作を確認しながら、残りの要件を実装します。
進行状況は Issue のチェックリストで確認し、不明点があれば講師に相談してください。

### 第1段階 — ゲームを最後まで操作できる状態にする

ルールは `logic.ts` に純粋関数として書き、画面は `ButanoshippoGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. `Phase` / `ButanoshippoState` / `ButanoshippoAction` の型を決める
2. `createInitialState(seed)`: `createDeck()` を `shuffle(deck, createRng(seed))` して `ring` に入れ、
   `pile` は空、`collected` は全員0、`turn` は `createTurnState(createSoloVsCpu(3))`
3. `isMatch(prev, next)` を書き、テストを2件（同じランク / 違うランク）足す
4. `flipNext(state)`: 輪の先頭を1枚めくって `pile` の末尾に積む
5. `collectPile(state)`: `pile` をすべて現在の手番のプレイヤーに加え、`pile` を空にして次の手番へ進める
6. `reduce` / `pendingDelayMs` / `isGameOver` / `getRanking` をつなぐ
7. `GameShell` で包み、`headerRight` に `ScoreBoard`（4人の引き取り枚数と手番）を置く
8. 輪を `Card`（`face="down"`）の並びで表示し、先頭の1枚だけ `highlighted` にする
9. 場の中央を `DeckPile`（`top` に一番上のカード、`face="up"`）で表示する
10. プレイヤーの手番だけ、輪の先頭カードに `onClick` を設定して `{ type: "flip" }` を送る
11. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行だけ記述する

ブラウザを再読み込みし、最初から最後まで1回操作できることを確認したら、第1段階は完了です。
`logic.ts` に関数を追加したら、`logic.test.ts` にもテストを追加し、`it(` を3件以上にします。

### 第2段階 — 残りの要件を実装する

1. 終了処理と `getRanking`、`ResultModal` の表示
2. 残りの必須テスト2件（輪が尽きたら終了 / 引き取った人の次から再開）
3. 異常系テスト: CPU の手番中や引き取りの演出中に `{ type: "flip" }` を送っても状態が変わらないこと
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` にする
5. `npm run verify` を実行し、成功を確認する

## 完了条件

- [ ] ターミナルBのブラウザで、アーケード一覧から担当ゲームを開き、最初から最後まで1回遊んだ
- [ ] 無効になるべき操作（連打 / 出せないカード / 0枚のとき）を試した
- [ ] リセットして2回目が正しく始まる
- [ ] `logic.test.ts` に `it(` が3件以上ある
- [ ] `README.md` に「遊び方 / ルール / 実装メモ」を書いた
- [ ] `index.ts` の `status` を `"ready"` にした
- [ ] `npm run verify` が成功する（範囲チェック / lint / 型 / テスト / ビルド）
- [ ] Pull Request の Draft を解除し、CI の `verify` が成功した
- [ ] 満たせていない必須要件を「発展課題・未対応事項」に書いた

## 時間が足りないとき

時間が足りない場合は、講師が進行状況を確認し、次の順に実装対象から外します。

1. 発展課題を省略する（ログ・記録保存・タイマー・円形レイアウト・独自 CSS）
2. 引き取りの演出を省略する。`Phase` から `"collecting"` を外し、`flipNext` の中で即座に引き取る。
   `pendingDelayMs` は「手番が CPU なら `CPU_INTERVAL_MS`、それ以外は `null`」だけにする
3. 輪の52枚表示を省略し、`DeckPile` 1つと「めくる」`Button` に置き換える。
   残り枚数は `DeckPile` の `count` に出るので、ルールは何も変わりません
4. `ScoreBoard` を省略し、4人の引き取り枚数をテキストで表示する
5. CPU を3人から1人に減らす（プレイヤー1人 + CPU 1人の2人対戦）。
   ルールも `logic.ts` の構造も変わりません。`index.ts` の `minPlayers` / `maxPlayers` を変更するため、
   変更前に講師へ確認する
6. 順位表示を省略し、`ResultModal` の `score` にプレイヤーが引き取った枚数だけを表示する。
   `getRanking` を呼ばなくなるので、順位のテストは `collected` の値を直接見る形に書き直します

実装を省略した場合も必須テスト6件を残し、`npm run verify` が成功する状態にします。
テストがない実装は評価対象になりません。

必須要件を省略する場合は、事前に講師へ相談してください。

## 発展課題（必須要件の完了後）

必須要件を満たし、`npm run verify` が成功してから発展課題に着手します。いずれも `src/games/butanoshippo/` の中で実装できます。

- `LogPanel` に「CPU 2 が ♥7 をめくって5枚 引き取りました」の経過を出す
- 順位表の `detail` を「3枚」表記に直す（`rankByScore` を使わず `Ranking` を自分で組み立てる）
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で、プレイヤーの最少引き取り枚数を保存する（少ないほど良い記録）
- `ButanoshippoGame.module.css` を追加し、`transform: rotate()` で輪を円形に並べる
- 引き取りの瞬間、場札が引き取った人の方へ動く演出を付ける
- 「あと何枚で輪が一周するか」と「引き取りが起きた回数」を出す
- 引き取り枚数が最も多いプレイヤーの欄を強調表示する
- `sortCards` で自分が引き取ったカードをランク順に一覧表示する（`collected` を枚数ではなくカード配列で持つ）
- `useCountdown` でプレイヤーの手番に制限時間を設け、時間切れなら自動でめくる
- CPU ごとに待ち時間を変える

## 参考

| 資料 | 内容 |
|---|---|
| `docs/handson-steps.md` | 入力するプロンプトと各フェーズの手順 |
| `src/games/example-game/` | 実装例 |
| `docs/game-plugin-guide.md` | ゲームの作り方（主教材） |
| `src/games/CLAUDE.md` | `@core` / `@ui` の早見表 |
| `docs/harness.md` | 拒否される操作と、承認が必要な操作の一覧 |
| `docs/troubleshooting.md` | エラーへの対処方法 |

## 作業を続けられない場合

- 共通基盤（`src/core` / `src/components`）の変更が必要な場合は、講師に相談してください
- 範囲チェックが失敗した場合は、`npm run scope` の案内を確認し、表示された `git restore ...` を実行します
- `npm run dev` が拒否された場合は、ターミナルBで実行してください
- 時間内に終わる見込みがない場合は、早めに講師へ相談してください
