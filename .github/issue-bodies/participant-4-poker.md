# ポーカー（`poker`）を実装する

CARD ARCADE に **ポーカー** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | 担当4 |
| 難易度 | 上級 |
| ブランチ | `feature/poker` |
| 編集してよい範囲 | `src/games/poker/` の中**だけ** |
| ルールの正典 | [`docs/games/poker.md`](../blob/main/docs/games/poker.md) |

**この Issue に書かれていないローカルルールは実装しません。** 迷ったら正典を見てください。

## 最初にやること（Step 5〜7）

```powershell
git switch -c feature/poker
npm run scaffold -- --game poker
npm test
```

テストが緑になったら、**実装を始める前に**一度コミットして Draft の Pull Request を作ります。
権限や CI の問題を早い段階で表に出すためです。

```powershell
git add src/games/poker
git commit -m "chore: ポーカーの雛形を追加"
git push -u origin HEAD
gh pr create --draft --title "ポーカーを実装" --body "Closes #8"
```

CI が緑になったのを確認してから、Claude Code で計画を立てます。

```
/kickoff 8
```

`/kickoff` はコードを変更できないようになっています。計画が出たら、**人間が読んで合意してから** `/implement` へ進んでください。

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
- [ ] 下の「必須テスト」8件が `logic.test.ts` にあり、`npm run verify` が緑になる

## 実装の進め方

実装の時間は **研修開始45分から110分**です。下の時刻はすべて「研修開始からの経過分」です。
このゲームは**時間の8割を `evaluateHand` に使います。** 画面は最後に足せば間に合います。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面はまだ触りません。`react` を import せずに書けるところだけを作ります。**テストを先に書いてください。**

#### Step1-a: `evaluateHand`（目安 75分）

1. `HandRank` / `HAND_ORDER` / `HandValue` / `Phase` / `PokerState` / `PokerAction` の型を決める
2. `cardValue(card)` を書く … `createRankStrength(RANK_ORDER_ACE_HIGH)(rank) + 2` で 2〜14 になる
3. `logic.test.ts` に**役の判定テストを先に7件書く**（この時点では全部赤で構いません）
4. `evaluateHand(cards)` を書いて、7件を上から順に緑にしていく
5. A-2-3-4-5 のストレートを通す

**75分の時点で、必須テスト8件のうち7件が緑になっていれば順調です。**
緑になっていなければ、画面より先にここを終わらせてください。

#### Step1-b: `compareHands` と `exchange`（目安 85分）

1. `compareHands(a, b)` … `HAND_ORDER` の添字を比べ、同じなら `tiebreak` を先頭から比べる
2. 必須テストの8件目「同じ役は tiebreak で比較する」を緑にする
3. `createInitialState(seed)` … `createDeck()` → `shuffle(deck, createRng(seed))` → `deal(deck, 2, 5)`
4. `cpu.ts` に `chooseDiscardIds(hand)` を書く
5. `exchange(state, selectedIds)` … あなたと CPU のぶんをまとめて処理し、`phase` を `"showdown"` にする
6. `reduce` / `pendingDelayMs` / `isGameOver` をつなぐ

**85分の時点で `npm test` が緑（必須テスト8件すべて）** になっているのが目標です。

### Step2 — 画面（`PokerGame.tsx`）

`logic.ts` に手を入れずに、状態を表示するだけの画面を作ります。

1. `GameShell` で包み、自分の手札を `Hand`（`face="up"`）で出す
2. `useState<string[]>` で選択中のIDを持ち、`selectedIds` と `onCardClick` を `Hand` に渡して**ゲーム側でトグル**する
3. CPU の手札を `Hand`（`face="down"`）で出し、決着後だけ `face="up"` に変える
4. 「交換する」を `Button` で置く（`phase !== "exchanging"` のときは `disabled`）
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く
6. `npm run dev` で開き、**最初から最後まで1回通して遊ぶ**

**100分の時点で、最初から最後まで1回遊び切れること。**

### Step3 — 必須要件の残りと異常系テスト

1. `ScoreBoard` に両者の役名を出し、`ResultModal` に勝敗と `Ranking`（`getRanking`）を出す
2. 異常系テスト … 交換したあとにもう一度 `{ type: "exchange" }` を送っても状態が変わらないこと
3. `README.md` に「遊び方 / 採用したルール / 実装メモ」を書く
4. `index.ts` の `status` を `"ready"` にする
5. `npm run verify` を実行して緑にする

**110分の時点で `npm run verify` が緑。** そこから Commit / Push / Pull Request です。

## 完了条件

- [ ] `npm run verify` が緑（範囲チェック / lint / 型 / テスト / ビルド）
- [ ] `index.ts` の `status` を `"ready"` にした
- [ ] `README.md` に「遊び方 / ルール / 実装メモ」を書いた
- [ ] アーケード一覧から開いて、最初から最後まで1回遊べた
- [ ] リセットして2回目が正しく始まる
- [ ] テストのアサーションを1つ逆にして、赤くなることを確認した
- [ ] Pull Request にスクリーンショットを添付した
- [ ] 「レビューしてほしい点」を自分の言葉で書いた

## 時間が足りないとき

**上から順に落とします。** 講師が進み具合を見て判断するための材料です。

1. **発展課題を全部やめる。** 必須要件が終わるまで発展課題には一切手を出しません。
2. **同じ役どうしの比較（`tiebreak`）をやめて引き分け扱いにする。**
   `compareHands` は `HAND_ORDER` の添字だけを見て、同じ役なら 0 を返します。
   `HandValue` から `tiebreak` を外してよく、必須テスト「同じ役は tiebreak で比較する」も外します。
3. **ストレートフラッシュとフォーカードを落とす。** `HAND_ORDER` を `full-house` までの7種類にします。
   **フルハウスまでで十分ゲームになります。** 必須テスト8件はそのまま残ります。
4. **CPU の交換判断を「必ず3枚捨てる」に固定する。** `chooseDiscardIds` は手札の先頭3枚のIDを返すだけになります。
   `cpu.ts` の中身が3行で済み、CPU のテストも要らなくなります。
5. **`showdown` の演出をやめる。** `Phase` から `"showdown"` を外し、`pendingDelayMs` は常に `null` を返します。
   交換した瞬間に結果が出ます。`useCpuTurn` の1行は**そのまま残してください**（消すと形が崩れます）。
6. **`index.ts` の `status` を `"coming-soon"` のまま Pull Request を出す。**
   未完成でも Pull Request を出すこと自体に価値があります。この判断は講師が行います。

ここまで落としても、**必須テスト8件と `npm run verify` が緑になることは落としません。**
テストが無い実装は評価されません。落としたルールは `README.md` の「実装しなかったこと」に**必ず書いてください。**
書いてあれば、レビューで「バグ」ではなく「意図した割り切り」として扱われます。

**発展課題より先に、必須要件を削る相談を講師にしてください。**

## 発展課題（必須要件が全部終わってから）

**必須要件が全部終わってから**手を付けてください。すべて `src/games/poker/` の中だけで実装できます。

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
| `src/games/example-game/` | お手本。**最初に読む** |
| `docs/game-plugin-guide.md` | ゲームの作り方（主教材） |
| `src/games/CLAUDE.md` | `@core` / `@ui` の早見表 |
| `docs/troubleshooting.md` | エラーで詰まったとき |
| `/stuck` | 詰まったときに状況を整理するコマンド |

## 困ったときは

- 共通基盤（`src/core` / `src/components`）を変えたくなったら、**自分で直さずに講師へ相談**してください
- 範囲チェックで止められたら、`npm run scope` が出す `git restore ...` をそのまま実行すれば戻せます
- 時間内に終わらなそうなら、70分の中間チェックポイントで講師に相談してください
