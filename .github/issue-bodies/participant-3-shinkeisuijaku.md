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

実装するルールは、このIssueとルール文書に記載されたものに限ります。

## 進め方（フェーズ3〜6）

この研修では、Claude Codeにプロンプトを入力して作業を進めます。
以下のコードブロックは、ターミナルAにそのまま貼り付けて使用できます。
同じ文面は `docs/handson-steps.md` にも掲載しています。

### ターミナルは2本使います

| | ターミナルA（Claude Code） | ターミナルB（参加者が操作） |
|---|---|---|
| 常駐するもの | `claude` のセッション | `npm run dev`（研修中は起動したままにする） |
| ここでやること | 調査・実装の依頼・差分の確認・文章の下書き | ブラウザでプレイする / `npm test` の結果確認 / CI の確認 / 承認の判断 |

**開発サーバーは、参加者がターミナルBから起動します。**

```powershell
npm run dev
```

ブラウザで `http://localhost:5173/` を開いたまま、研修が終わるまで閉じないでください。

> **Claude Code に `npm run dev` を頼んでも実行されません。** 拒否メッセージが出ます。
> 起動したままセッションが戻らないことと、ターミナルBで使う `5173` 番ポートと競合することが理由です。
> **画面は、ターミナルB の開発サーバーとブラウザで確認します。**

### 1. ブランチを作成し、雛形を生成する

ターミナルA に貼ります。

```text
これから shinkeisuijaku の実装を始めます。次の5つを、この順番で実行してください。

1. git switch main
2. git pull
3. git switch -c feature/shinkeisuijaku
4. npm run scaffold -- --game shinkeisuijaku
5. npm test

そのあと、src/games/shinkeisuijaku/ にできた5つのファイルについて、
「ファイル名 … 何を書く場所か」を1行ずつ、5行だけで説明してください。

中身はまだ1文字も変えないでください。実装も始めないでください。
```

終わったら、**いったん `/exit` して `claude` を起動し直してください。**
起動時の案内とステータスラインに、担当ゲームが反映されます。

`index.ts` には、担当者が `owner` として書き込まれています。
`id` / `name` / `owner` / `difficulty` は運営が決めた値なので変更しないでください（変更すると契約テストとCIが失敗します）。

ターミナルB でブラウザを **F5 で再読み込み**し、一覧に 神経衰弱 が「準備中」で出れば成功です。

### 2. 最初のコミットから Draft の Pull Request まで

**実装前の雛形の段階で、Draft の Pull Request を作成します。**
実装前に、権限、CI、改行コードに関する問題がないことを確認するためです。

変更内容を確認してから外部へ反映できるよう、プロンプトを2つに分けます。

1本目 — 変更内容を確認してからコミットします。

```text
コミットの前に git status --short を実行して、変更されたファイルの一覧をそのまま見せてください。

そのうえで、git add の対象は src/games/shinkeisuijaku だけにして、
次のメッセージでコミットしてください。

  chore(shinkeisuijaku): 雛形を追加する

src/games/shinkeisuijaku の外にあるファイルは、1つも add しないでください。
```

2本目 — push と Draft PR。**ここで承認を求められます。**

```text
push して、Draft の Pull Request を作ってください。

- push: git push -u origin HEAD
- PR: gh pr create --draft --title "shinkeisuijaku を実装する" --body "雛形を置いただけの Draft です。実装はこれから進めます。Closes #2"

作成した Pull Request の番号を最後に教えてください。
gh pr ready は実行しないでください。Draft のままにします。
```

> **承認する前に、画面に表示されたコマンドを確認してください。**
> とくに `Closes #2` が自分の Issue 番号になっているかを確認します。
> 番号が違うと、他人の Issue を閉じてしまいます。
>
> 違っていたら **`n` を押して、言葉で伝えてください。**
>
> ```text
> Closes の番号が違います。私の Issue は #2 です。そこだけ直してもう一度出してください。
> ```

CIが成功したことは、ターミナルBで確認します。

```powershell
gh pr checks <自分のPR番号> --watch
```

`verify` が失敗したときは、実装に進まずにここで直します。よくある原因は
「担当フォルダの外を `git add` してしまった」です。ターミナルA に貼ってください。

```text
npm run scope を実行して、範囲外の変更があるか確認してください。
範囲外があれば、scope が出す git restore のコマンドをそのまま実行して戻してください。
src/games/shinkeisuijaku の中身は消さないでください。
```

### 3. 実装の計画を先に立てる

CIが成功したことを確認してから、ターミナルAで実装計画の作成を依頼します。

```text
GitHub の Issue #2 と docs/games/shinkeisuijaku.md を読んで、
src/games/shinkeisuijaku/ にこのゲームをどう実装するか計画を立ててください。

- Issue にも docs/games/shinkeisuijaku.md にも書かれていないルールは足さないでください。
- まだコードは書かないでください。ファイルも変更しないでください。
```

作成された計画を、このIssueの「必須要件」と上から1件ずつ照合してください。
対応する実装が分からない要件があれば、その要件を示して計画の修正を依頼します。

```text
必須要件の「<この Issue の要件の文言をそのまま貼る>」に対応する項目が計画にありません。
どこで実現するつもりなのかを計画に足してください。まだ実装はしないでください。
```

```text
計画の「<計画の中の1行をそのまま貼る>」は、Issue にも docs/games/shinkeisuijaku.md にも書かれていないルールです。
Issue に無いものは実装しないので、計画から外してください。まだ実装はしないでください。
```

### 4. まず最後まで遊べる形にする

計画に納得できたら、実装を依頼します。**細かい仕上げは後にして、遊べる状態を先に作ります。**

```text
その計画で実装してください。まず最後まで遊べる状態にすることを優先し、発展課題には手を付けないでください。
```

ここからは、ブラウザで動作を確認しながら修正します。
プランモード（`/plan`）で改善計画を作成し、内容を確認してから修正を依頼してください。

```text
ブラウザで遊んだところ <起きたこと> になりました。期待する動作は <期待していたこと> です。

原因を特定して改善策を計画してください。
まだファイルは変更しないでください。
```

計画を確認し、問題がなければ修正を依頼します。修正後は、ブラウザを再読み込みして同じ操作を試します。

必須要件をすべて満たしたら、アーケードの一覧から遊べる状態にします。

```text
src/games/shinkeisuijaku/index.ts の status を "ready" にしてください。
ほかの項目（id / name / owner / difficulty）は変更しないでください。
そのあと npm test を実行して、結果を報告してください。
```

### 5. Pull Request を提出する

```text
Pull Request を提出します。次を順に実行してください。

1. npm run verify
2. git add src/games/shinkeisuijaku
3. git commit -m "feat(shinkeisuijaku): ゲームを実装する"
4. git push
5. .github/PULL_REQUEST_TEMPLATE.md の形式で、Pull Request の本文を .pr-body.md に書く
6. gh pr edit <自分のPR番号> --body-file .pr-body.md

npm run verify が失敗したら、そこで止めて最初のエラーだけを報告してください。
本文は git diff origin/main...HEAD を読んで、実際の変更内容にもとづいて書いてください。
満たせていない必須要件があれば、「発展課題・未対応事項」に記載してください。

gh pr ready は実行しないでください。私が自分で入力します。
```

Draft状態の解除は、参加者がターミナルBで実行します。

```powershell
gh pr ready <自分のPR番号>
gh pr checks <自分のPR番号> --watch
```

`verify` が成功したら、講師に PR 番号を伝えてください。
**マージは講師が行います。** 参加者はマージしません。

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

最初から作り込まず、**最後まで遊べる状態**を先に作ります。
遊べるようになってから、ブラウザで操作しながら足りないところを足していきます。
進み具合は Issue のチェックリストで確認してください。
進め方が分からない場合は、講師に相談してください。

### 第1段階 — 最後まで遊べるところまで

ルールは `logic.ts` に純粋関数として書き、画面は `ShinkeisuijakuGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. 定数と型を置く … `REVEAL_DELAY_MS` / `PAIR_COUNT` / `Phase` / `ShinkeisuijakuState` / `ShinkeisuijakuAction`
2. `createInitialState(seed)` … 8ランクを選んで16枚を作り、シャッフルして並べる
3. `flipCard(state, index)` … 1枚めくる。**選べないカードなら `state` をそのまま返す**
4. `resolveFlip(state)` … 判定中を解決する。ペアなら `matched` へ、違えば裏に戻す
5. `isGameOver(state)` / `pendingDelayMs(state)` / `reduce(state, action)`
6. `useReducer(reduce, undefined, () => createInitialState(...))` で状態を持つ
7. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));` を**1行だけ**書く
8. 16枚を `Card` で4列に並べ、`face` を1枚ごとに切り替える
9. 手数を表示し、終了したら `ResultModal` を出す

ブラウザを再読み込みして、**最初から最後まで1回遊べること**を確認したら第1段階は完了です。
`logic.ts` に関数を足したら `logic.test.ts` にもテストを足し、`it(` が3件以上ある状態にしてください。

### 第2段階 — 遊びながら仕上げる

1. 「必須テスト」に挙げた7件をすべて書く
2. 「やってはいけない操作」のテストを足す（判定中の3枚目 / ペア済みの再クリック / 同じ場所の2回クリック）
3. `README.md` を書く（遊び方 / 採用したルール / 実装メモ）
4. `index.ts` の `status` を `"ready"` にする
5. `npm run verify` を実行して成功させる

## 完了条件

- [ ] **ターミナルB のブラウザ**で、アーケード一覧から開いて最初から最後まで1回遊べた
- [ ] やってはいけない操作（連打 / 出せないカード / 0枚のとき）を試した
- [ ] リセットして2回目が正しく始まる
- [ ] `logic.test.ts` に `it(` が3件以上ある
- [ ] `README.md` に「遊び方 / ルール / 実装メモ」を書いた
- [ ] `index.ts` の `status` を `"ready"` にした
- [ ] `npm run verify` が成功する（範囲チェック / lint / 型 / テスト / ビルド）
- [ ] Pull Request の Draft を解除し、CI の `verify` が成功した
- [ ] 満たせていない必須要件を「発展課題・未対応事項」に書いた

## 時間が足りないとき

時間が足りない場合は、次の順に実装対象から外します。講師は進み具合を見て判断してください。

1. **見た目の作り込み**（めくり演出・凝った CSS）。`Card` の既定の見た目のまま進めます
2. **経過時間の表示**（`useElapsedMs` + `Timer`）
3. **ベスト手数の保存**（`useHighScore`）
4. **`ResultModal`**。「クリア！ 12手」の1行を画面に出すだけに置き換えます
5. **手数の常時表示**。終了時に手数が出れば必須要件は満たせます
6. **ほかの項目を省略しても間に合わない場合（講師の判断が必要）**: `PAIR_COUNT` を 8 から 6 に下げる（12枚・3列 × 4行）。
   ルールも状態遷移も変わらないので、影響は定数1つと `README.md` の記述だけです

「判定中は3枚目をめくれない」と `logic.test.ts` は評価対象のため、省略できません。
画面の演出よりも、この2点を満たすことを優先してください。

必須要件を省略する場合は、事前に講師へ相談してください。発展課題は先に実装対象から外します。

## 発展課題（必須要件の完了後）

発展課題は、必須要件を満たして `npm run verify` が成功したあとに着手します。すべて共通基盤を変更せずに実装できます。

- **経過時間の表示** … `useElapsedMs(running)` の値を `Timer` に渡す
- **ベスト手数の保存** … `useHighScore(manifest.id, "lower-is-better")` を使う。手数は少ないほど良い記録です
  （`localStorage` の直接利用は禁止です）
- **難易度の切り替え** … `PAIR_COUNT` を 6 / 8 / 10 から選べるようにする（列数も合わせて変える）
- **めくり演出** … CSS Modules の `transform: rotateY(180deg)` でカードが回るようにする
- **ミスの記録** … 同じ場所を何度もめくった回数を数えて `LogPanel` に出す
- **評価コメント** … 手数に応じたメッセージを `ResultModal` の `message` に出す
- **CPU 対戦** … `cpu.ts` に「一定の確率で場所を覚えている」CPU を作る
  （記憶率は `Rng` で表現し、純粋関数に保つ）

## 参考

| 見るもの | 内容 |
|---|---|
| `docs/handson-steps.md` | 入力するプロンプトと各フェーズの手順 |
| `src/games/example-game/` | 実装例 |
| `docs/game-plugin-guide.md` | ゲームの作り方（主教材） |
| `src/games/CLAUDE.md` | `@core` / `@ui` の早見表 |
| `docs/harness.md` | 何が拒否され、何で承認を求められるかの一覧 |
| `docs/troubleshooting.md` | エラーで詰まったとき |

## 困ったときは

- 共通基盤（`src/core` / `src/components`）の変更が必要な場合は、講師に相談してください
- 範囲チェックで止められたら、`npm run scope` が出す `git restore ...` をそのまま実行すれば戻せます
- `npm run dev` が拒否された場合は、ターミナルBで実行してください
- 時間内に終わらなそうなら、早めに講師へ相談してください
