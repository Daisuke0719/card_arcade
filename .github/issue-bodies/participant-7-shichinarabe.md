# 七並べ（`shichinarabe`）を実装する

CARD ARCADE に **七並べ** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | 担当7 |
| 難易度 | 中級 |
| ブランチ | `feature/shichinarabe` |
| 編集してよい範囲 | `src/games/shichinarabe/` の中**だけ** |
| ルール文書 | [`docs/games/shichinarabe.md`](../blob/main/docs/games/shichinarabe.md) |

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
これから shichinarabe の実装を始めます。次の5つを、この順番で実行してください。

1. git switch main
2. git pull
3. git switch -c feature/shichinarabe
4. npm run scaffold -- --game shichinarabe
5. npm test

実行後、src/games/shichinarabe/ に生成された5つのファイルについて、
「ファイル名 … 役割」の形式で1行ずつ、合計5行で説明してください。

ファイルは変更せず、まだ実装を始めないでください。
```

処理が終わったら、いったん `/exit` し、`claude` を起動し直します。
起動時の案内とステータスラインに、担当ゲームが反映されます。

`index.ts` の `owner` には担当者が設定されています。
`id`、`name`、`owner`、`difficulty` はあらかじめ決められた値です。変更すると契約テストと CI が失敗するため、そのまま使用してください。

ターミナルBでブラウザを `F5` キーで再読み込みし、一覧に「七並べ」が「準備中」と表示されることを確認します。

### 2. 最初のコミットと Draft の Pull Request 作成

実装前の雛形の段階で Draft の Pull Request を作成し、権限、CI、改行コードに関する問題がないことを確認します。

push や Pull Request の作成前に変更内容を確認できるよう、プロンプトを2つに分けます。

1つ目のプロンプトでは、変更内容を確認してからコミットします。

```text
コミットの前に git status --short を実行し、変更されたファイルの一覧をそのまま表示してください。

そのうえで、git add の対象は src/games/shichinarabe だけにして、
次のメッセージでコミットしてください。

  chore(shichinarabe): 雛形を追加する

src/games/shichinarabe の外にあるファイルは、1つも add しないでください。
```

2つ目のプロンプトでは、push と Draft の Pull Request 作成を依頼します。実行前に承認画面が表示されます。

```text
push して、Draft の Pull Request を作ってください。

- push: git push -u origin HEAD
- PR: gh pr create --draft --title "shichinarabe を実装する" --body "雛形を置いただけの Draft です。実装はこれから進めます。Closes #4"

作成した Pull Request の番号を最後に教えてください。
gh pr ready は実行しないでください。Draft のままにします。
```

> 承認する前に、画面に表示されたコマンドを確認します。
> 特に `Closes #4` が担当の Issue 番号になっているかを確認してください。
> 番号が違うと、別の Issue を閉じてしまいます。
>
> 番号が違う場合は `n` を押し、次のプロンプトで修正を依頼します。
>
> ```text
> Closes の番号が違います。私の Issue は #4 です。そこだけ直してもう一度出してください。
> ```

CI が成功したことは、ターミナルBで確認します。

```powershell
gh pr checks <自分のPR番号> --watch
```

`verify` が失敗した場合は、実装へ進む前に修正します。担当フォルダの外を `git add` したことが原因であれば、次のプロンプトをターミナルAに入力します。

```text
npm run scope を実行して、範囲外の変更があるか確認してください。
範囲外があれば、scope の出力に示された git restore のコマンドをそのまま実行して戻してください。
src/games/shichinarabe の中身は消さないでください。
```

### 3. 実装の計画を先に立てる

CI が成功したことを確認してから、ターミナルAで実装計画の作成を依頼します。

```text
GitHub の Issue #4 と docs/games/shichinarabe.md を読んで、
src/games/shichinarabe/ にこのゲームをどう実装するか計画を立ててください。

- Issue にも docs/games/shichinarabe.md にも書かれていないルールは足さないでください。
- まだコードは書かないでください。ファイルも変更しないでください。
```

作成された計画を、この Issue の「必須要件」と上から順に照合します。
どの実装が対応するのか分からない要件があれば、その要件を示して計画の修正を依頼します。

```text
必須要件の「<この Issue の要件の文言をそのまま貼る>」に対応する項目が計画にありません。
どの項目で実現するか分かるように、計画へ追記してください。まだ実装はしないでください。
```

```text
計画の「<計画の中の1行をそのまま貼る>」は、Issue にも docs/games/shichinarabe.md にも書かれていないルールです。
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
src/games/shichinarabe/index.ts の status を "ready" にしてください。
ほかの項目（id / name / owner / difficulty）は変更しないでください。
変更後に npm test を実行し、結果を報告してください。
```

### 5. Pull Request を提出する

```text
Pull Request を提出します。次を順に実行してください。

1. npm run verify
2. git add src/games/shichinarabe
3. git commit -m "feat(shichinarabe): ゲームを実装する"
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

- [ ] 52枚を4人（プレイヤー + CPU 3人）に13枚ずつ配り、開始時に4枚の7を自動で場に置く
- [ ] ダイヤの7を配られた人が先手になる
- [ ] `canPlace(board, card)` が「場のカードの ±1 だけ置ける」を判定する（A の下・K の上は無い）
- [ ] プレイヤーの手札のうち、現在置けるカードだけがクリックできる（置けないカードは押せない）
- [ ] 置けるカードが1枚でもあるときはパスできない。置けないときだけパスできる
- [ ] パスは1人3回まで。4回目のパスで脱落し、手札を全部（飛び地も）場に置いて手番から外れる
- [ ] CPU 3人の手番が `pendingDelayMs` と `useCpuTurn` だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] 手札を出し切った順に順位が付き、`ResultModal` に順位表が出る
- [ ] `logic.test.ts` に「必須テスト」6件がある
- [ ] `npm run verify` が成功し、`index.ts` の `status` を `"ready"` にした

## 実装の進め方

最初に、ゲームを最後まで操作できる状態を作ります。
その後、ブラウザで動作を確認しながら、残りの要件を実装します。
進行状況は Issue のチェックリストで確認し、不明点があれば講師に相談してください。

### 第1段階 — ゲームを最後まで操作できる状態にする

ルールは `logic.ts` に純粋関数として書き、画面は `ShichinarabeGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

1. `Board` 型（`Record<Suit, boolean[]>`、index 0..12 が A..K）と `createInitialState(seed)` を書く
   （配る → 4枚の7を場に置く → ダイヤの7を持っていた人を先手にする）
2. `canPlace(board, card)` と `legalMoves(board, hand)` を書く
3. `canPlace` を見るテスト3件（7の隣・離れたカード・A の下と K の上）を足す
4. `place` / `passTurn` / `dropOut` を書く
5. `reduce(state, action)` と `pendingDelayMs(state)` でつなぐ
6. `GameShell` で包み、盤面を4スート×13マスで並べる
   （置かれていないマスは `Card` の `placeholder` で空きスロットにする）
7. プレイヤーの手札を `Hand` で表示し、`disabledIds` に現在置けないカードを指定する
8. 他のプレイヤーは `Hand variant="hidden"` で枚数だけ表示する
9. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行だけ記述する

ブラウザを再読み込みし、最初から最後まで1回操作できることを確認したら、第1段階は完了です。
`logic.ts` に関数を追加したら、`logic.test.ts` にもテストを追加し、`it(` を3件以上にします。

### 第2段階 — 残りの要件を実装する

1. パスボタン（置けないときだけ出す）とパス残り回数の表示
2. 脱落の反映、`ScoreBoard` の手番表示、`ResultModal` の順位表
3. 残りの必須テストと異常系テスト（手番でないときの `place` が無視される / 脱落した人が手番から飛ばされる）
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` に変える
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

時間が足りない場合は、次の順に実装対象から外します。1〜3は参加者の判断で省略できます。4と5は必須要件が減るため、
省略する前に講師へ確認します。

1. 進行ログと演出。`LogPanel` と、カードを置いたときのハイライトを省略する
2. CPU の選択処理。`legalMoves` の先頭にあるカードを出す
3. パス残り回数の表示。画面表示だけを省略し、`passes` のカウントとルールは残す
4. 順位の並べ替え。脱落した人を下に回す処理を省略し、上がった順だけを `ResultModal` に表示する
   （必須要件1件と、順位に関する一部のテストが対象外になります）
5. 脱落ルール。パスを無制限にする。「出せるカードがあるときは必ず出す」を守っていれば、
   場の端に置けるカードは必ず誰かの手札にあり、その人の手番で必ず置かれます。
   脱落がなくてもゲームは終了します。
   （必須テスト1件と必須要件1件が対象外になるため、ほかの項目を省略しても間に合わない場合に限ります）

必要に応じて実装対象を減らし、`npm run verify` が成功する状態で Pull Request を提出します。

必須要件を省略する場合は、事前に講師へ相談してください。

## 発展課題（必須要件の完了後）

必須要件を満たし、`npm run verify` が成功してから発展課題に着手します。いずれも `src/games/shichinarabe/` の中で実装できます。

- CPU が、自分の手札が続いているスートや端に近いカードを優先するようにする。
  判断処理は `cpu.ts` の純粋関数に置き、テストを追加する。
- `LogPanel` に「CPU2 がパスしました（残り1回）」「CPU3 が脱落しました」を出す。
- `ScoreBoard` の `detail` に「残り7枚 / パス残り2回」を出す。
- `ShichinarabeGame.module.css` を追加して、直前に置かれたカードを一瞬ハイライトする。
- 次に置けるマス（各スートの両端）の空きスロットだけを強調表示する。
- `useHighScore` と `gameKey` で「1位になった回数」を保存して表示する。
- 画面の隅に `seed` を表示し、同じ配りをやり直せるようにする。

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
