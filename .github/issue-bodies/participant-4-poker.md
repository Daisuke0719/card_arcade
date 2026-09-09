# ポーカー（`poker`）を実装する

CARD ARCADE に **ポーカー** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | 担当4 |
| 難易度 | 上級 |
| ブランチ | `feature/poker` |
| 編集してよい範囲 | `src/games/poker/` の中**だけ** |
| ルール文書 | [`docs/games/poker.md`](../blob/main/docs/games/poker.md) |

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
これから poker の実装を始めます。次の5つを、この順番で実行してください。

1. git switch main
2. git pull
3. git switch -c feature/poker
4. npm run scaffold -- --game poker
5. npm test

実行後、src/games/poker/ に生成された5つのファイルについて、
「ファイル名 … 役割」の形式で1行ずつ、合計5行で説明してください。

ファイルは変更せず、まだ実装を始めないでください。
```

処理が終わったら、いったん `/exit` し、`claude` を起動し直します。
起動時の案内とステータスラインに、担当ゲームが反映されます。

`index.ts` の `owner` には担当者が設定されています。
`id`、`name`、`owner`、`difficulty` はあらかじめ決められた値です。変更すると契約テストと CI が失敗するため、そのまま使用してください。

ターミナルBでブラウザを `F5` キーで再読み込みし、一覧に「ポーカー」が「準備中」と表示されることを確認します。

### C-2　Draft PRを作り、提出経路を確認する

実装前の雛形の段階で Draft の Pull Request を作成し、権限、CI、改行コードに関する問題がないことを確認します。

push や Pull Request の作成前に変更内容を確認できるよう、プロンプトを2つに分けます。

1つ目のプロンプトでは、変更内容を確認してからコミットします。

```text
コミットの前に git status --short を実行し、変更されたファイルの一覧をそのまま表示してください。

そのうえで、git add の対象は src/games/poker だけにして、
次のメッセージでコミットしてください。

  chore(poker): 雛形を追加する

src/games/poker の外にあるファイルは、1つも add しないでください。
```

2つ目のプロンプトでは、push と Draft の Pull Request 作成を依頼します。実行前に承認画面が表示されます。

```text
push して、Draft の Pull Request を作ってください。

- push: git push -u origin HEAD
- PR: gh pr create --draft --title "poker を実装する" --body "雛形を置いただけの Draft です。実装はこれから進めます。Closes #8"

作成した Pull Request の番号を最後に教えてください。
gh pr ready は実行しないでください。Draft のままにします。
```

> 承認する前に、画面に表示されたコマンドを確認します。
> 特に `Closes #8` が担当の Issue 番号になっているかを確認してください。
> 番号が違うと、別の Issue を閉じてしまいます。
>
> 番号が違う場合は `n` を押し、次のプロンプトで修正を依頼します。
>
> ```text
> Closes の番号が違います。私の Issue は #8 です。そこだけ直してもう一度出してください。
> ```

CI が成功したことは、ターミナルBで確認します。

```powershell
gh pr checks <自分のPR番号> --watch
```

`verify` が失敗した場合は、実装へ進む前に修正します。担当フォルダの外を `git add` したことが原因であれば、次のプロンプトをターミナルAに入力します。

```text
npm run scope を実行して、範囲外の変更があるか確認してください。
範囲外があれば、scope の出力に示された git restore のコマンドをそのまま実行して戻してください。
src/games/poker の中身は消さないでください。
```

### C-3　実装計画を必須要件と照合する

CI が成功したことを確認してから、ターミナルAで実装計画の作成を依頼します。

```text
GitHub の Issue #8 と docs/games/poker.md を読んで、
src/games/poker/ にこのゲームをどう実装するか計画を立ててください。

- Issue にも docs/games/poker.md にも書かれていないルールは足さないでください。
- まだコードは書かないでください。ファイルも変更しないでください。
```

作成された計画を、この Issue の「必須要件」と上から順に照合します。
どの実装が対応するのか分からない要件があれば、その要件を示して計画の修正を依頼します。

```text
必須要件の「<この Issue の要件の文言をそのまま貼る>」に対応する項目が計画にありません。
どの項目で実現するか分かるように、計画へ追記してください。まだ実装はしないでください。
```

```text
計画の「<計画の中の1行をそのまま貼る>」は、Issue にも docs/games/poker.md にも書かれていないルールです。
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
src/games/poker/index.ts の status を "ready" にしてください。
ほかの項目（id / name / owner / difficulty）は変更しないでください。
変更後に npm test を実行し、結果を報告してください。
```

### C-5　verifyを実行し、Pull Requestを提出する

```text
Pull Request を提出します。次を順に実行してください。

1. npm run verify
2. git add src/games/poker
3. git commit -m "feat(poker): ゲームを実装する"
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

- [ ] 52枚をシャッフルして、プレイヤーとCPUに5枚ずつ配る（`deal(deck, 2, 5)`。残り42枚が山札）
- [ ] プレイヤーの手札は表向き、CPU の手札は決着まで伏せたまま表示される
- [ ] 手札のカードをクリックして交換するカードを選べる（0〜5枚。もう一度クリックで選択が外れる）
- [ ] 「交換する」を押すと選んだ枚数だけ山札から補充され、**交換は一度で終わる**（2回目は押せない）
- [ ] CPU も同じタイミングで一度だけ交換する（ペア以上があればそれ以外を捨て、無ければ3枚捨てる）
- [ ] `evaluateHand(cards)` が9種類の役を `{ rank, tiebreak }` の形で返す
- [ ] `compareHands(a, b)` が同じ役どうしを `tiebreak` で比較し、それでも並んだら引き分けになる
- [ ] A-2-3-4-5 と 10-J-Q-K-A の**両方**をストレートとして認める
- [ ] 決着すると両者の手札が表向きになり、**役名と勝敗**が `ResultModal` に出る
- [ ] 交換が終わるまで CPU の手札の中身が DOM に出ない（`face="down"`）
- [ ] CPU の交換と役の公開は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで進む（`.tsx` に `setTimeout` を書かない）
- [ ] 下の「必須テスト」8件が `logic.test.ts` にあり、`npm run verify` が成功する

## 実装の進め方

最初に、ゲームを最後まで操作できる状態を作ります。
その後、ブラウザで動作を確認しながら、残りの要件を実装します。
進行状況は Issue のチェックリストで確認し、不明点があれば講師に相談してください。

### 第1段階 — ゲームを最後まで操作できる状態にする

最初に `evaluateHand` とそのテストを実装し、その後に画面を作成します。
ルールは `logic.ts` に純粋関数として書き、画面は `PokerGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

**(1) 役の判定**

1. `HandRank` / `HAND_ORDER` / `HandValue` / `Phase` / `PokerState` / `PokerAction` の型を決める
2. `cardValue(card)` を書く: `createRankStrength(RANK_ORDER_ACE_HIGH)(rank) + 2` で2〜14の値を返す
3. `logic.test.ts` に**役の判定テストを先に7件書く**（この時点では全部失敗して構いません）
4. `evaluateHand(cards)` を書いて、7件を上から順に成功させていく
5. A-2-3-4-5 のストレートを通す

**(2) 比較と交換**

1. `compareHands(a, b)`: `HAND_ORDER` の添字を比べ、同じなら `tiebreak` を先頭から比べる
2. 同じ役を `tiebreak` で比較し、必須テストの8件目が成功することを確認する
3. `createInitialState(seed)`: `createDeck()` → `shuffle(deck, createRng(seed))` → `deal(deck, 2, 5)`
4. `cpu.ts` に `chooseDiscardIds(hand)` を書く
5. `exchange(state, selectedIds)`: プレイヤーと CPU の交換をまとめて処理し、`phase` を `"showdown"` にする
6. `reduce` / `pendingDelayMs` / `isGameOver` をつなぐ

**(3) 画面**

1. `GameShell` で囲み、プレイヤーの手札を `Hand`（`face="up"`）で表示する
2. `useState<string[]>` で選択中の ID を持ち、`selectedIds` と `onCardClick` を `Hand` に渡してゲーム側で選択状態を切り替える
3. CPU の手札を `Hand`（`face="down"`）で表示し、決着後だけ `face="up"` に変える
4. 「交換する」を `Button` で置く（`phase !== "exchanging"` のときは `disabled`）
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行だけ記述する

ブラウザを再読み込みし、最初から最後まで1回操作できることを確認したら、第1段階は完了です。
`logic.ts` に関数を追加したら、`logic.test.ts` にもテストを追加し、`it(` を3件以上にします。

### 第2段階 — 残りの要件を実装する

1. `ScoreBoard` に両者の役名を出し、`ResultModal` に勝敗と `Ranking`（`getRanking`）を出す
2. 異常系テスト: 交換したあとにもう一度 `{ type: "exchange" }` を送っても状態が変わらないこと
3. `README.md` に「遊び方 / 採用したルール / 実装メモ」を書く
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

1. 発展課題を省略する。必須要件が終わるまでは、発展課題に着手しません。
2. 同じ役どうしの比較（`tiebreak`）を省略し、引き分けとして扱う。
   `compareHands` は `HAND_ORDER` の添字だけを見て、同じ役なら 0 を返します。
   `HandValue` から `tiebreak` を外してよく、必須テスト「同じ役は tiebreak で比較する」も外します。
3. ストレートフラッシュとフォーカードを省略する。`HAND_ORDER` を `full-house` までの7種類にします。
   フルハウスまで実装すれば、ゲームとして成立します。必須テスト8件は変更しません。
4. CPU の交換判断を「必ず3枚捨てる」に固定する。`chooseDiscardIds` は手札の先頭3枚の ID を返します。
   CPU の選択処理が単純になり、CPU に関するテストも不要になります。
5. `showdown` の演出を省略する。`Phase` から `"showdown"` を外し、`pendingDelayMs` は常に `null` を返します。
   交換時に結果を表示します。`useCpuTurn` の1行は残します。
6. `index.ts` の `status` を `"coming-soon"` のまま Pull Request を作成する。この判断は講師が行います。

実装を省略した場合も必須テスト8件を残し、`npm run verify` が成功する状態にします。
テストがない実装は評価対象になりません。省略したルールは `README.md` の「実装しなかったこと」に記載します。

必須要件を省略する場合は、事前に講師へ相談してください。

## 発展課題（必須要件の完了後）

必須要件を満たし、`npm run verify` が成功してから発展課題に着手します。いずれも `src/games/poker/` の中で実装できます。

- **ロイヤルストレートフラッシュ**: 10-J-Q-K-A のストレートフラッシュを `royal-flush` として独立表示し、`HAND_ORDER` の末尾に追加する
- **キッカーの厳密な比較**: ワンペアなら残り3枚も強い順に `tiebreak` へ追加して比較する
- `LogPanel` に「プレイヤーは2枚交換しました」「CPU は3枚交換しました」の経過を表示する
- 交換する前に「今の役」を表示する（`evaluateHand` を交換前の手札にも当てるだけ）
- **CPU の交換判断**: 同じスートが4枚ある場合や、あと1枚でストレートになる場合は、1枚だけ交換する。判断処理は `cpu.ts` の純粋関数に置く
- `sortCards` でプレイヤーの手札をランク順に並べて表示する
- `useHighScore` と `gameKey` で「これまでに出した最強の役」を保存する
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- 複数回戦にして勝敗を積み上げる（`reduce` に `"next-round"` アクションを足す）
- `PokerGame.module.css` を追加し、役を構成しているカードだけを強調表示する

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
