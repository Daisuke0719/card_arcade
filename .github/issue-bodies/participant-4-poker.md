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
これから poker の実装を始めます。次の5つを、この順番で実行してください。

1. git switch main
2. git pull
3. git switch -c feature/poker
4. npm run scaffold -- --game poker
5. npm test

そのあと、src/games/poker/ にできた5つのファイルについて、
「ファイル名 … 何を書く場所か」を1行ずつ、5行だけで説明してください。

中身はまだ1文字も変えないでください。実装も始めないでください。
```

終わったら、**いったん `/exit` して `claude` を起動し直してください。**
起動時の案内とステータスラインに、担当ゲームが反映されます。

`index.ts` には、担当者が `owner` として書き込まれています。
`id` / `name` / `owner` / `difficulty` は運営が決めた値なので変更しないでください（変更すると契約テストとCIが失敗します）。

ターミナルB でブラウザを **F5 で再読み込み**し、一覧に ポーカー が「準備中」で出れば成功です。

### 2. 最初のコミットから Draft の Pull Request まで

**実装前の雛形の段階で、Draft の Pull Request を作成します。**
実装前に、権限、CI、改行コードに関する問題がないことを確認するためです。

変更内容を確認してから外部へ反映できるよう、プロンプトを2つに分けます。

1本目 — 変更内容を確認してからコミットします。

```text
コミットの前に git status --short を実行して、変更されたファイルの一覧をそのまま見せてください。

そのうえで、git add の対象は src/games/poker だけにして、
次のメッセージでコミットしてください。

  chore(poker): 雛形を追加する

src/games/poker の外にあるファイルは、1つも add しないでください。
```

2本目 — push と Draft PR。**ここで承認を求められます。**

```text
push して、Draft の Pull Request を作ってください。

- push: git push -u origin HEAD
- PR: gh pr create --draft --title "poker を実装する" --body "雛形を置いただけの Draft です。実装はこれから進めます。Closes #8"

作成した Pull Request の番号を最後に教えてください。
gh pr ready は実行しないでください。Draft のままにします。
```

> **承認する前に、画面に表示されたコマンドを確認してください。**
> とくに `Closes #8` が自分の Issue 番号になっているかを確認します。
> 番号が違うと、他人の Issue を閉じてしまいます。
>
> 違っていたら **`n` を押して、言葉で伝えてください。**
>
> ```text
> Closes の番号が違います。私の Issue は #8 です。そこだけ直してもう一度出してください。
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
src/games/poker の中身は消さないでください。
```

### 3. 実装の計画を先に立てる

CIが成功したことを確認してから、ターミナルAで実装計画の作成を依頼します。

```text
GitHub の Issue #8 と docs/games/poker.md を読んで、
src/games/poker/ にこのゲームをどう実装するか計画を立ててください。

- Issue にも docs/games/poker.md にも書かれていないルールは足さないでください。
- まだコードは書かないでください。ファイルも変更しないでください。
```

作成された計画を、このIssueの「必須要件」と上から1件ずつ照合してください。
対応する実装が分からない要件があれば、その要件を示して計画の修正を依頼します。

```text
必須要件の「<この Issue の要件の文言をそのまま貼る>」に対応する項目が計画にありません。
どこで実現するつもりなのかを計画に足してください。まだ実装はしないでください。
```

```text
計画の「<計画の中の1行をそのまま貼る>」は、Issue にも docs/games/poker.md にも書かれていないルールです。
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
src/games/poker/index.ts の status を "ready" にしてください。
ほかの項目（id / name / owner / difficulty）は変更しないでください。
そのあと npm test を実行して、結果を報告してください。
```

### 5. Pull Request を提出する

```text
Pull Request を提出します。次を順に実行してください。

1. npm run verify
2. git add src/games/poker
3. git commit -m "feat(poker): ゲームを実装する"
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

- [ ] 52枚をシャッフルして、あなたと CPU に5枚ずつ配る（`deal(deck, 2, 5)`。残り42枚が山札）
- [ ] あなたの手札は表向き、CPU の手札は決着まで伏せたまま表示される
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

最初から作り込まず、**最後まで遊べる状態**を先に作ります。
遊べるようになってから、ブラウザで操作しながら足りないところを足していきます。
進み具合は Issue のチェックリストで確認してください。
進め方が分からない場合は、講師に相談してください。

### 第1段階 — 最後まで遊べるところまで

このゲームは**時間の大半を `evaluateHand` に使います。** 画面は最後に足せば間に合います。
ルールは `logic.ts` に純粋関数として書き、画面は `PokerGame.tsx` に書きます。
`logic.ts` では `react` を import せず、`Math.random()` / `Date.now()` / `setTimeout` を使いません。

**(1) 役の判定**

1. `HandRank` / `HAND_ORDER` / `HandValue` / `Phase` / `PokerState` / `PokerAction` の型を決める
2. `cardValue(card)` を書く … `createRankStrength(RANK_ORDER_ACE_HIGH)(rank) + 2` で 2〜14 になる
3. `logic.test.ts` に**役の判定テストを先に7件書く**（この時点では全部失敗して構いません）
4. `evaluateHand(cards)` を書いて、7件を上から順に成功させていく
5. A-2-3-4-5 のストレートを通す

**(2) 比較と交換**

1. `compareHands(a, b)` … `HAND_ORDER` の添字を比べ、同じなら `tiebreak` を先頭から比べる
2. 必須テストの8件目「同じ役は tiebreak で比較する」を成功させる
3. `createInitialState(seed)` … `createDeck()` → `shuffle(deck, createRng(seed))` → `deal(deck, 2, 5)`
4. `cpu.ts` に `chooseDiscardIds(hand)` を書く
5. `exchange(state, selectedIds)` … あなたと CPU のぶんをまとめて処理し、`phase` を `"showdown"` にする
6. `reduce` / `pendingDelayMs` / `isGameOver` をつなぐ

**(3) 画面**

1. `GameShell` で包み、自分の手札を `Hand`（`face="up"`）で出す
2. `useState<string[]>` で選択中のIDを持ち、`selectedIds` と `onCardClick` を `Hand` に渡して**ゲーム側でトグル**する
3. CPU の手札を `Hand`（`face="down"`）で出し、決着後だけ `face="up"` に変える
4. 「交換する」を `Button` で置く（`phase !== "exchanging"` のときは `disabled`）
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く

ブラウザを再読み込みして、**最初から最後まで1回遊べること**を確認したら第1段階は完了です。
`logic.ts` に関数を足したら `logic.test.ts` にもテストを足し、`it(` が3件以上ある状態にしてください。

### 第2段階 — 遊びながら仕上げる

1. `ScoreBoard` に両者の役名を出し、`ResultModal` に勝敗と `Ranking`（`getRanking`）を出す
2. 異常系テスト … 交換したあとにもう一度 `{ type: "exchange" }` を送っても状態が変わらないこと
3. `README.md` に「遊び方 / 採用したルール / 実装メモ」を書く
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

1. **発展課題を省略する。** 必須要件が終わるまでは、発展課題に着手しません。
2. **同じ役どうしの比較（`tiebreak`）を省略し、引き分けとして扱う。**
   `compareHands` は `HAND_ORDER` の添字だけを見て、同じ役なら 0 を返します。
   `HandValue` から `tiebreak` を外してよく、必須テスト「同じ役は tiebreak で比較する」も外します。
3. **ストレートフラッシュとフォーカードを省略する。** `HAND_ORDER` を `full-house` までの7種類にします。
   フルハウスまで実装すれば、ゲームとして成立します。必須テスト8件は変更しません。
4. **CPU の交換判断を「必ず3枚捨てる」に固定する。** `chooseDiscardIds` は手札の先頭3枚のIDを返すだけになります。
   `cpu.ts` の中身が3行で済み、CPU のテストも要らなくなります。
5. **`showdown` の演出を省略する。** `Phase` から `"showdown"` を外し、`pendingDelayMs` は常に `null` を返します。
   交換した瞬間に結果が出ます。`useCpuTurn` の1行は**そのまま残してください**（消すと形が崩れます）。
6. **`index.ts` の `status` を `"coming-soon"` のまま Pull Request を出す。**
   未完成でも Pull Request を出すこと自体に価値があります。この判断は講師が行います。

実装を省略した場合も、必須テスト8件を残し、`npm run verify` が成功する状態にしてください。
テストがない実装は評価されません。省略したルールは `README.md` の「実装しなかったこと」に記載してください。
書いてあれば、「バグ」ではなく「意図した割り切り」として読めます。

必須要件を省略する場合は、事前に講師へ相談してください。発展課題は先に実装対象から外します。

## 発展課題（必須要件の完了後）

発展課題は、必須要件を満たして `npm run verify` が成功したあとに着手します。すべて `src/games/poker/` の中で実装できます。

- **ロイヤルストレートフラッシュ** … 10-J-Q-K-A のストレートフラッシュを `royal-flush` として独立表示する。`HAND_ORDER` の末尾に足すだけで済む
- **キッカーの厳密な比較** … ワンペアなら残り3枚も強い順に `tiebreak` へ足す。引き分けがほとんど起きなくなる
- `LogPanel` に「あなたは2枚交換しました」「CPU は3枚交換しました」の経過を出す
- 交換する前に「今の役」を表示する（`evaluateHand` を交換前の手札にも当てるだけ）
- **CPU を少し賢くする** … 同じスートが4枚あれば1枚だけ交換する、ストレートまであと1枚なら1枚だけ交換する。`cpu.ts` は純粋関数のまま保つこと
- `sortCards` で自分の手札をランク順に並べて表示する
- `useHighScore` と `gameKey` で「これまでに出した最強の役」を保存する
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- 複数回戦にして勝敗を積み上げる（`reduce` に `"next-round"` アクションを足す）
- `PokerGame.module.css` を足して、役を構成しているカードだけを光らせる

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
