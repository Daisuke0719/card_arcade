# ババ抜き（`babanuki`）を実装する

CARD ARCADE に **ババ抜き** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | 担当1 |
| 難易度 | 初級 |
| ブランチ | `feature/babanuki` |
| 編集してよい範囲 | `src/games/babanuki/` の中**だけ** |
| ルール文書 | [`docs/games/babanuki.md`](../blob/main/docs/games/babanuki.md) |

実装するルールは、この Issue とルール文書に記載されたものに限ります。

## Step C｜担当ゲームを作り、Pull Requestを提出する

Step Cでは、このIssueを担当ゲームの作業手順として使用します。
以下のC-1からC-5までを、上から順に進めてください。

各手順には、Claude Codeへ入力するプロンプトと、参加者自身が確認する内容を記載しています。
Step Cの詳しい進め方と完了条件は、研修資料と `docs/handson-steps.md` も参照してください。

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

### C-1　作業ブランチと雛形を用意する

次のプロンプトをターミナルAに入力します。

```text
これから babanuki の実装を始めます。次の5つを、この順番で実行してください。

1. git switch main
2. git pull
3. git switch -c feature/babanuki
4. npm run scaffold -- --game babanuki
5. npm test

実行後、src/games/babanuki/ に生成された5つのファイルについて、
「ファイル名 … 役割」の形式で1行ずつ、合計5行で説明してください。

ファイルは変更せず、まだ実装を始めないでください。
```

処理が終わったら、いったん `/exit` し、`claude` を起動し直します。
起動時の案内とステータスラインに、担当ゲームが反映されます。

`index.ts` の `owner` には担当者が設定されています。
`id`、`name`、`owner`、`difficulty` はあらかじめ決められた値です。変更すると契約テストと CI が失敗するため、そのまま使用してください。

ターミナルBでブラウザを `F5` キーで再読み込みし、一覧に「ババ抜き」が「準備中」と表示されることを確認します。

### C-2　Draft PRを作り、提出経路を確認する

実装前の雛形の段階で Draft の Pull Request を作成し、権限、CI、改行コードに関する問題がないことを確認します。

push や Pull Request の作成前に変更内容を確認できるよう、プロンプトを2つに分けます。

1つ目のプロンプトでは、変更内容を確認してからコミットします。

```text
コミットの前に git status --short を実行し、変更されたファイルの一覧をそのまま表示してください。

そのうえで、git add の対象は src/games/babanuki だけにして、
次のメッセージでコミットしてください。

  chore(babanuki): 雛形を追加する

src/games/babanuki の外にあるファイルは、1つも add しないでください。
```

2つ目のプロンプトでは、push と Draft の Pull Request 作成を依頼します。実行前に承認画面が表示されます。

```text
push して、Draft の Pull Request を作ってください。

- push: git push -u origin HEAD
- PR: gh pr create --draft --title "babanuki を実装する" --body "雛形を置いただけの Draft です。実装はこれから進めます。Closes #1"

作成した Pull Request の番号を最後に教えてください。
gh pr ready は実行しないでください。Draft のままにします。
```

> 承認する前に、画面に表示されたコマンドを確認します。
> 特に `Closes #1` が担当の Issue 番号になっているかを確認してください。
> 番号が違うと、別の Issue を閉じてしまいます。
>
> 番号が違う場合は `n` を押し、次のプロンプトで修正を依頼します。
>
> ```text
> Closes の番号が違います。私の Issue は #1 です。そこだけ直してもう一度出してください。
> ```

CI が成功したことは、ターミナルBで確認します。

```powershell
gh pr checks <自分のPR番号> --watch
```

`verify` が失敗した場合は、実装へ進む前に修正します。担当フォルダの外を `git add` したことが原因であれば、次のプロンプトをターミナルAに入力します。

```text
npm run scope を実行して、範囲外の変更があるか確認してください。
範囲外があれば、scope の出力に示された git restore のコマンドをそのまま実行して戻してください。
src/games/babanuki の中身は消さないでください。
```

### C-3　実装計画を必須要件と照合する

CI が成功したことを確認してから、ターミナルAで実装計画の作成を依頼します。

```text
GitHub の Issue #1 と docs/games/babanuki.md を読んで、
src/games/babanuki/ にこのゲームをどう実装するか計画を立ててください。

- Issue にも docs/games/babanuki.md にも書かれていないルールは足さないでください。
- まだコードは書かないでください。ファイルも変更しないでください。
```

作成された計画を、この Issue の「必須要件」と上から順に照合します。
どの実装が対応するのか分からない要件があれば、その要件を示して計画の修正を依頼します。

```text
必須要件の「<この Issue の要件の文言をそのまま貼る>」に対応する項目が計画にありません。
どの項目で実現するか分かるように、計画へ追記してください。まだ実装はしないでください。
```

```text
計画の「<計画の中の1行をそのまま貼る>」は、Issue にも docs/games/babanuki.md にも書かれていないルールです。
実装対象ではないため、計画から外してください。まだ実装はしないでください。
```

### C-4　実装し、試遊しながら修正する

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
src/games/babanuki/index.ts の status を "ready" にしてください。
ほかの項目（id / name / owner / difficulty）は変更しないでください。
変更後に npm test を実行し、結果を報告してください。
```

### C-5　verifyを実行し、Pull Requestを提出する

```text
Pull Request を提出します。次を順に実行してください。

1. npm run verify
2. git add src/games/babanuki
3. git commit -m "feat(babanuki): ゲームを実装する"
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

- [ ] 53枚（52枚 + 赤ジョーカー1枚）を4人へ配り切る（プレイヤー14枚 / CPU各13枚）
- [ ] 配札直後に、各プレイヤーの手札から同じランクのペアが自動で捨てられている
- [ ] 手番のプレイヤーは左隣の手札から裏向きの1枚を引ける（プレイヤーの手番では裏向きのカードをクリックして引く）
- [ ] 引いた結果ペアがそろったら、その場で2枚とも捨てられる
- [ ] 引く相手がすでに上がっているときは、その人を飛ばして次の生存者から引く
- [ ] 手札が0枚になったプレイヤーは上がりになり、手番からも引かれる対象からも外れる
- [ ] 生存者が1人になったらゲームが終了し、上がった順の順位が `ResultModal` に出る
- [ ] 他プレイヤーの手札は裏向き（`face="down"`）で表示され、中身が DOM に出ない
- [ ] CPU の手番は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] 下の「必須テスト」6件が `logic.test.ts` にあり、`npm run verify` が成功する

## 実装の進め方

最初に、ゲームを最後まで操作できる状態を作ります。
その後、ブラウザで動作を確認しながら、残りの要件を実装します。
進行状況は Issue のチェックリストで確認し、不明点があれば講師に相談してください。

### 第1段階 — ゲームを最後まで操作できる状態にする

ルールは `logic.ts` に純粋関数として書き、画面は `BabanukiGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. `Phase` / `BabanukiState` / `BabanukiAction` の型を決める
2. `createInitialState(seed)`: `createDeckWithJokers(1)` → `shuffle(deck, createRng(seed))` → `deal(deck, 4)` → 各手札に `discardPairs`
3. `discardPairs(hand)` を書き、テストを3件（2枚 / 3枚 / ジョーカー）足す
4. `drawCard(state, index)` と `nextAlivePlayer(state)` を書く
5. `reduce` / `pendingDelayMs` / `isGameOver` をつなぐ
6. `GameShell` で囲み、プレイヤーの手札を `Hand`（`face="up"`）で表示する
7. 他のプレイヤーの手札を `Hand`（`face="down"`）で表示し、左隣に引く向きの矢印を添える
8. プレイヤーの手番だけ、左隣の裏向きカードに `onCardClick` を設定する
9. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行だけ記述する

ブラウザを再読み込みし、最初から最後まで1回操作できることを確認したら、第1段階は完了です。
`logic.ts` に関数を追加したら、`logic.test.ts` にもテストを追加し、`it(` を3件以上にします。

### 第2段階 — 残りの要件を実装する

1. 上がり処理（`finishPlayer`）と順位（`rankByFinishOrder`）、`ResultModal` の表示
2. 残りの必須テスト2件（上がった人のスキップ / 順位）
3. 異常系テスト: CPU の手番中にプレイヤーがクリックしても状態が変わらないこと
4. `index.ts` の `status` を `"ready"` にする
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

1. 発展課題を省略する（並べ替え表示・ログ・記録保存・タイマー・独自 CSS）
2. 引いたカードを表示する演出を省略する。`Phase` から `"revealing"` を外し、`pendingDelayMs` は
   「手番が CPU なら `CPU_DRAW_DELAY_MS`、それ以外は `null`」だけにする
3. `ScoreBoard` を省略し、残り枚数をテキストで表示する
4. CPU を3人から1人に減らす（プレイヤー1人 + CPU 1人の2人対戦。27枚 / 26枚）。
   ルールも `logic.ts` の構造も変わりません。`index.ts` の `minPlayers` / `maxPlayers` を変更するため、
   変更前に講師へ確認する
5. ジョーカーを使わず、「52枚からスペードのAを1枚抜いた51枚」方式にする。
   孤立した1枚がババになるので、遊び方も画面も同じままです。
   `createDeckWithJokers(1)` を、`createDeck()` からスペードのAを1枚除外する処理に置き換えます

実装を省略した場合も必須テスト6件を残し、`npm run verify` が成功する状態にします。
テストがない実装は評価対象になりません。

必須要件を省略する場合は、事前に講師へ相談してください。

## 発展課題（必須要件の完了後）

必須要件を満たし、`npm run verify` が成功してから発展課題に着手します。いずれも `src/games/babanuki/` の中で実装できます。

- `sortCards` で自分の手札をランク順に並べて表示する
- `LogPanel` に「プレイヤーが CPU 1 から1枚引きました」「CPU 2 が上がりました」の経過を表示する
- 引かれた側の手札を引かれるたびにシャッフルし直す（`shuffle` に状態から作った `Rng` を渡す）
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で「1位になった回数」または「最短決着時間」を保存する
- CPU が、直前に自分のカードを引かれた位置を避けるようにする
- `BabanukiGame.module.css` を追加し、プレイヤーの手番に手札を強調表示する

## 参考

| 資料 | 内容 |
|---|---|
| `docs/handson-steps.md` | Step A〜Dの進め方と完了条件 |
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
