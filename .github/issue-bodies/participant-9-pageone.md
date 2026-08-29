# ページワン（`pageone`）を実装する

CARD ARCADE に **ページワン** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | 担当9 |
| 難易度 | 中級 |
| ブランチ | `feature/pageone` |
| 編集してよい範囲 | `src/games/pageone/` の中**だけ** |
| ルールの正典 | [`docs/games/pageone.md`](../blob/main/docs/games/pageone.md) |

**この Issue に書かれていないローカルルールは実装しません。** 迷ったら正典を見てください。

## 最初にやること（Step 5〜7）

```powershell
git switch -c feature/pageone
npm run scaffold -- --game pageone
npm test
```

テストが緑になったら、**実装を始める前に**一度コミットして Draft の Pull Request を作ります。
権限や CI の問題を早い段階で表に出すためです。

```powershell
git add src/games/pageone
git commit -m "chore: ページワンの雛形を追加"
git push -u origin HEAD
gh pr create --draft --title "ページワンを実装" --body "Closes #10"
```

CI が緑になったのを確認してから、Claude Code で計画を立てます。

```
/kickoff 10
```

`/kickoff` はコードを変更できないようになっています。計画が出たら、**人間が読んで合意してから** `/implement` へ進んでください。

## 必須要件

- [ ] 52枚を4人（あなた + CPU 3人）に5枚ずつ配り、山札から1枚めくって場札にする
- [ ] `canPlay(card, field)` が「場札と同じマーク、または同じ数字」を判定する
- [ ] 自分の手札のうち、今出せるカードだけがクリックできる（出せないカードは押せない）
- [ ] 出せるカードが1枚でもあるときは山札を引けない。出せないときだけ引ける
- [ ] 引いたカードが出せるときは、その場で自動的に場に出る
- [ ] 8 を出すと次の人が1回飛ばされる
- [ ] A を出すともう1枚出せる（同じ人の手番が続く）
- [ ] 山札が尽きたら、場札の一番上を残して残りを混ぜ、山札に戻して続けられる
- [ ] 手札が0枚になった人が出た時点でゲームが終わり、`ResultModal` に順位（2位以下は枚数順）が出る
- [ ] 他プレイヤーの手札は `Hand variant="hidden"` で枚数だけ表示され、中身が DOM に出ない
- [ ] CPU 3人の手番が `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] 下の「必須テスト」7件が `logic.test.ts` にあり、`npm run verify` が緑になる

## 実装の進め方

時刻はすべて**研修開始からの経過分**です。実装時間は45分から始まります。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面はまだ触りません。`react` を import せずに書けるところだけを作ります。

1. `Phase` / `PageOneState` / `PageOneAction` の型を決める
2. `createInitialState(seed)` … `shuffle(createDeck(), createRng(seed))` → `deal(deck, 4, 5)` →
   残りから1枚めくって場札にする
3. `canPlay(card, field)` と `legalMoves(hand, field)` を書き、**必須テストの最初の3件を先に通す**
4. `advanceTurn(state, steps)` を書く。ここが**このゲームの山場**です（下の実装メモを先に読んでください）
5. `applyPlay` と `drawFromDeck` を書き、`reduce` / `pendingDelayMs` / `isGameOver` でつなぐ

**目安: 65分の時点で `npm test` が緑（必須テスト7件のうち4件以上が通っている）**

### Step2 — 画面（`PageOneGame.tsx`）

`logic.ts` に手を入れずに、状態を表示するだけの画面を作ります。

1. `GameShell` で包み、場札を `DeckPile`（`top` に一番上のカード、`face="up"`）で出す
2. 山札を `DeckPile`（`face="down"`）で出し、残り枚数を見せる
3. 自分の手札を `Hand` で出し、`disabledIds` に「今出せないカード」を入れる
4. 他プレイヤーは `Hand variant="hidden"` で枚数だけ出す
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く
6. `npm run dev` で開き、**最初から最後まで1回通して遊ぶ**

**目安: 85分の時点で、最初から最後まで1回遊び切れる**

### Step3 — 必須要件の残りと異常系テスト

1. 山札を引く操作（出せるカードが無いときだけ押せる）と、山札切れの混ぜ直し
2. `ScoreBoard` で4人の残り枚数と今の手番を出し、`ResultModal` に順位を出す
3. 残りの必須テストと異常系テスト（手番でないときの `play` が無視される / 出せるのに `draw` できない）
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` にする
5. `npm run verify` を実行して緑にする

**目安: 95分（遅くとも105分）の時点で `npm run verify` が緑**

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

**上から順に落とします。** 1〜2 は自分の判断で落としてかまいません。
3以降は必須要件が減るので、落とす前に**必ず講師に確認**してください。

1. **発展課題を全部やめる**（並べ替え表示・ハイライト・ログ・記録保存・タイマー・独自 CSS）
2. **`ScoreBoard` と `LogPanel` をやめて、残り枚数を素のテキストで出す**（画面の組み立て時間を削る）
3. **A の効果を落とす**。`stepsOf` から `"A"` の行を消し、A も普通のカードとして1つ進めます。
   ルールが1つ減るだけで、`applyPlay` の形は変わりません。
   （必須要件1件と必須テスト `"Aを出すともう一度出せる"` が落ちます）
4. **8 の効果も落とす**（＝特殊カード無しの基本ルールだけ）。`stepsOf` を消して `advanceTurn(state, 1)` に固定します。
   同じマークか同じ数字を出すだけのゲームになりますが、**最初から最後まで遊べる形は保てます**。
   （必須要件1件と必須テスト `"8を出すと次の人が飛ばされる"` が落ちます）
5. **CPU を3人から1人に減らす**（あなた + CPU 1 の2人対戦）。ルールも `logic.ts` の構造も変わりません。
   `index.ts` の `minPlayers` / `maxPlayers` を触るので、**必ず講師に確認してから**変更してください

ここまで落としても、**残った必須テストと `npm run verify` が緑になることは落としません。**
要件を1つ落としてでも、緑の Pull Request を出してください。テストが無い実装は評価されません。

**発展課題より先に、必須要件を削る相談を講師にしてください。**

## 発展課題（必須要件が全部終わってから）

**必須要件が全部終わってから**手を付けてください。すべて `src/games/pageone/` の中だけで実装できます。

- `sortCards` で自分の手札をマーク順・数字順に並べて表示する
- 出せるカードを `highlightedIds` で緑枠にして、出せないカードと見分けやすくする
- `LogPanel` に「あなたが ♥A を出しました（もう1枚出せます）」「CPU 1 が山札から引きました」を出す
- `ScoreBoard` の `detail` に「残り3枚」を出し、順位表の「3点」表記も残り枚数の言い方に直す
- CPU を少し賢くする（8 と A を後ろに温存する／手札に多いマークを優先して出す）。
  判断は `cpu.ts` の純粋関数に置き、テストを書く
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で「1位になった回数」または「最短決着時間」を保存する
- `PageOneGame.module.css` を足して、直前に出されたカードを一瞬ハイライトする
- 画面の隅に `seed` を表示し、同じ配りをやり直せるようにする

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
