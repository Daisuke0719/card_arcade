# 神経衰弱（`shinkeisuijaku`）を実装する

CARD ARCADE に **神経衰弱** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | 担当3 |
| 難易度 | 初級 |
| ブランチ | `feature/shinkeisuijaku` |
| 編集してよい範囲 | `src/games/shinkeisuijaku/` の中**だけ** |
| ルール文書 | [`docs/games/shinkeisuijaku.md`](../blob/main/docs/games/shinkeisuijaku.md) |

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
これから shinkeisuijaku の実装を始めます。次の5つを、この順番で実行してください。

1. git switch main
2. git pull
3. git switch -c feature/shinkeisuijaku
4. npm run scaffold -- --game shinkeisuijaku
5. npm test

実行後、src/games/shinkeisuijaku/ に生成された5つのファイルについて、
「ファイル名 … 役割」の形式で1行ずつ、合計5行で説明してください。

ファイルは変更せず、まだ実装を始めないでください。
```

処理が終わったら、いったん `/exit` し、`claude` を起動し直します。
起動時の案内とステータスラインに、担当ゲームが反映されます。

`index.ts` の `owner` には担当者が設定されています。
`id`、`name`、`owner`、`difficulty` はあらかじめ決められた値です。変更すると契約テストと CI が失敗するため、そのまま使用してください。

ターミナルBでブラウザを `F5` キーで再読み込みし、一覧に「神経衰弱」が「準備中」と表示されることを確認します。

### C-2　Draft PRを作り、提出経路を確認する

実装前の雛形の段階で Draft の Pull Request を作成し、権限、CI、改行コードに関する問題がないことを確認します。

push や Pull Request の作成前に変更内容を確認できるよう、プロンプトを2つに分けます。

1つ目のプロンプトでは、変更内容を確認してからコミットします。

```text
コミットの前に git status --short を実行し、変更されたファイルの一覧をそのまま表示してください。

そのうえで、git add の対象は src/games/shinkeisuijaku だけにして、
次のメッセージでコミットしてください。

  chore(shinkeisuijaku): 雛形を追加する

src/games/shinkeisuijaku の外にあるファイルは、1つも add しないでください。
```

2つ目のプロンプトでは、push と Draft の Pull Request 作成を依頼します。実行前に承認画面が表示されます。

```text
push して、Draft の Pull Request を作ってください。

- push: git push -u origin HEAD
- PR: gh pr create --draft --title "shinkeisuijaku を実装する" --body "雛形を置いただけの Draft です。実装はこれから進めます。Closes #2"

作成した Pull Request の番号を最後に教えてください。
gh pr ready は実行しないでください。Draft のままにします。
```

> 承認する前に、画面に表示されたコマンドを確認します。
> 特に `Closes #2` が担当の Issue 番号になっているかを確認してください。
> 番号が違うと、別の Issue を閉じてしまいます。
>
> 番号が違う場合は `n` を押し、次のプロンプトで修正を依頼します。
>
> ```text
> Closes の番号が違います。私の Issue は #2 です。そこだけ直してもう一度出してください。
> ```

CI が成功したことは、ターミナルBで確認します。

```powershell
gh pr checks <自分のPR番号> --watch
```

`verify` が失敗した場合は、実装へ進む前に修正します。担当フォルダの外を `git add` したことが原因であれば、次のプロンプトをターミナルAに入力します。

```text
npm run scope を実行して、範囲外の変更があるか確認してください。
範囲外があれば、scope の出力に示された git restore のコマンドをそのまま実行して戻してください。
src/games/shinkeisuijaku の中身は消さないでください。
```

### C-3　実装計画を必須要件と照合する

CI が成功したことを確認してから、ターミナルAで実装計画の作成を依頼します。

```text
GitHub の Issue #2 と docs/games/shinkeisuijaku.md を読んで、
src/games/shinkeisuijaku/ にこのゲームをどう実装するか計画を立ててください。

- Issue にも docs/games/shinkeisuijaku.md にも書かれていないルールは足さないでください。
- まだコードは書かないでください。ファイルも変更しないでください。
```

作成された計画を、この Issue の「必須要件」と上から順に照合します。
どの実装が対応するのか分からない要件があれば、その要件を示して計画の修正を依頼します。

```text
必須要件の「<この Issue の要件の文言をそのまま貼る>」に対応する項目が計画にありません。
どの項目で実現するか分かるように、計画へ追記してください。まだ実装はしないでください。
```

```text
計画の「<計画の中の1行をそのまま貼る>」は、Issue にも docs/games/shinkeisuijaku.md にも書かれていないルールです。
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
src/games/shinkeisuijaku/index.ts の status を "ready" にしてください。
ほかの項目（id / name / owner / difficulty）は変更しないでください。
変更後に npm test を実行し、結果を報告してください。
```

### C-5　verifyを実行し、Pull Requestを提出する

```text
Pull Request を提出します。次を順に実行してください。

1. npm run verify
2. git add src/games/shinkeisuijaku
3. git commit -m "feat(shinkeisuijaku): ゲームを実装する"
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

- [ ] `createInitialState(seed)` が、8ランク × 2枚 = 16枚をシャッフルして裏向きに並べた初期状態を返す
- [ ] 16枚が画面に **4列 × 4行**で裏向きに並ぶ
- [ ] 裏向きのカードをクリックすると表向きになる
- [ ] 2枚めくると判定中になり、**3枚目はめくれない**（連打しても状態が変わらない）
- [ ] 同じランクの2枚はペアが成立し、表向きのまま場に残る
- [ ] 違うランクの2枚は `REVEAL_DELAY_MS`（800ms）後に両方とも裏向きに戻る
- [ ] ペア成立済みのカードと、めくったばかりのカードはクリックしても何も起きない
- [ ] 2枚めくるごとに手数が1増え、画面に表示される
- [ ] 8ペアすべてがそろうとゲームが終わり、手数を含む結果が表示される
- [ ] `logic.test.ts` に「必須テスト」7件があり、`npm run verify` が成功する

## 実装の進め方

最初に、ゲームを最後まで操作できる状態を作ります。
その後、ブラウザで動作を確認しながら、残りの要件を実装します。
進行状況は Issue のチェックリストで確認し、不明点があれば講師に相談してください。

### 第1段階 — ゲームを最後まで操作できる状態にする

ルールは `logic.ts` に純粋関数として書き、画面は `ShinkeisuijakuGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. 定数と型を置く: `REVEAL_DELAY_MS` / `PAIR_COUNT` / `Phase` / `ShinkeisuijakuState` / `ShinkeisuijakuAction`
2. `createInitialState(seed)`: 8ランクを選んで16枚を作り、シャッフルして並べる
3. `flipCard(state, index)`: 1枚めくる。選べないカードの場合は `state` をそのまま返す
4. `resolveFlip(state)`: 判定中を解決する。ペアなら `matched` へ、違えば裏に戻す
5. `isGameOver(state)` / `pendingDelayMs(state)` / `reduce(state, action)`
6. `useReducer(reduce, undefined, () => createInitialState(...))` で状態を持つ
7. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));` を1行だけ記述する
8. 16枚を `Card` で4列に並べ、`face` を1枚ごとに切り替える
9. 手数を表示し、終了したら `ResultModal` を出す

ブラウザを再読み込みし、最初から最後まで1回操作できることを確認したら、第1段階は完了です。
`logic.ts` に関数を追加したら、`logic.test.ts` にもテストを追加し、`it(` を3件以上にします。

### 第2段階 — 残りの要件を実装する

1. 「必須テスト」に挙げた7件をすべて書く
2. 無効な操作のテストを追加する（判定中の3枚目 / ペア済みの再クリック / 同じ場所の2回クリック）
3. `README.md` を書く（遊び方 / 採用したルール / 実装メモ）
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

1. 見た目の作り込み（めくり演出・独自CSS）。`Card` の既定の表示を使用する
2. 経過時間の表示（`useElapsedMs` + `Timer`）
3. ベスト手数の保存（`useHighScore`）
4. `ResultModal`。「クリア！ 12手」の1行を画面に表示する
5. 手数の常時表示。終了時だけ手数を表示する
6. ほかの項目を省略しても間に合わない場合（講師の判断が必要）: `PAIR_COUNT` を8から6に下げる（12枚・3列 × 4行）。
   ルールも状態遷移も変わらないので、影響は定数1つと `README.md` の記述だけです

「判定中は3枚目をめくれない」と `logic.test.ts` は評価対象のため、省略できません。
この2点は、画面の演出より優先して実装します。

必須要件を省略する場合は、事前に講師へ相談してください。

## 発展課題（必須要件の完了後）

必須要件を満たし、`npm run verify` が成功してから発展課題に着手します。いずれも共通基盤を変更せずに実装できます。

- **経過時間の表示**: `useElapsedMs(running)` の値を `Timer` に渡す
- **ベスト手数の保存**: `useHighScore(manifest.id, "lower-is-better")` を使う。手数が少ない記録を上位として扱う
  （`localStorage` の直接利用は禁止です）
- **難易度の切り替え**: `PAIR_COUNT` を 6 / 8 / 10 から選べるようにする（列数も合わせて変える）
- **めくり演出**: CSS Modules の `transform: rotateY(180deg)` でカードが回るようにする
- **ミスの記録**: 同じ場所を複数回めくった回数を数えて `LogPanel` に表示する
- **結果メッセージ**: 手数に応じたメッセージを `ResultModal` の `message` に表示する
- **CPU 対戦**: `cpu.ts` に、一定の確率でめくった場所を記憶する CPU を実装する
  （記憶率は `Rng` で表現し、純粋関数に保つ）

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
