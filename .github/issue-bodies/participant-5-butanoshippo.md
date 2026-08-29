# ぶたのしっぽ（`butanoshippo`）を実装する

CARD ARCADE に **ぶたのしっぽ** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | 担当5 |
| 難易度 | 初級 |
| ブランチ | `feature/butanoshippo` |
| 編集してよい範囲 | `src/games/butanoshippo/` の中**だけ** |
| ルールの正典 | [`docs/games/butanoshippo.md`](../blob/main/docs/games/butanoshippo.md) |

**この Issue に書かれていないローカルルールは実装しません。** 迷ったら正典を見てください。

## 最初にやること（Step 5〜7）

```powershell
git switch -c feature/butanoshippo
npm run scaffold -- --game butanoshippo
npm test
```

テストが緑になったら、**実装を始める前に**一度コミットして Draft の Pull Request を作ります。
権限や CI の問題を早い段階で表に出すためです。

```powershell
git add src/games/butanoshippo
git commit -m "chore: ぶたのしっぽの雛形を追加"
git push -u origin HEAD
gh pr create --draft --title "ぶたのしっぽを実装" --body "Closes #9"
```

CI が緑になったのを確認してから、Claude Code で計画を立てます。

```
/kickoff 9
```

`/kickoff` はコードを変更できないようになっています。計画が出たら、**人間が読んで合意してから** `/implement` へ進んでください。

## 必須要件

- [ ] 52枚が伏せたまま輪として並び、次にめくるカードと残り枚数が画面で分かる
- [ ] 手番のプレイヤーが輪から1枚めくり、場の中央に重なる（あなたの手番は先頭のカードをクリック）
- [ ] めくったカードが直前のカードと同じランクなら、場札を全部そのプレイヤーが引き取る
- [ ] 引き取りが起きると場が空になり、**引き取った人の次の人**から再開する
- [ ] 輪のカードが尽きたらゲームが終了する（最後の1枚の引き取りも処理してから終わる）
- [ ] 4人の引き取り枚数が常に画面に出ている（`ScoreBoard`）
- [ ] 引き取り枚数が少ない順の順位が `ResultModal` に出る
- [ ] 輪のカードは裏向き（`face="down"`）で表示され、中身が DOM に出ない
- [ ] CPU の手番は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] CPU の手番中や引き取りの演出中にクリックしても場が進まない
- [ ] 下の「必須テスト」6件が `logic.test.ts` にあり、`npm run verify` が緑になる

## 実装の進め方

時刻はすべて**研修開始からの経過分**です。実装時間は 45分〜95分に割り当てられています。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面はまだ触りません。`react` を import せずに書けるところだけを作ります。

1. `Phase` / `ButanoshippoState` / `ButanoshippoAction` の型を決める
2. `createInitialState(seed)` … `createDeck()` を `shuffle(deck, createRng(seed))` して `ring` に入れ、
   `pile` は空、`collected` は全員0、`turn` は `createTurnState(createSoloVsCpu(3))`
3. `isMatch(prev, next)` を書き、テスト2件（同じランク / 違うランク）を先に通す
4. `flipNext(state)` … 輪の先頭を1枚めくって `pile` の末尾に積む
5. `collectPile(state)` … `pile` を全部いまの手番の人に足し、`pile` を空にして次の人へ渡す
6. `reduce` / `pendingDelayMs` / `isGameOver` / `getRanking` をつなぐ

**目安: 70分の時点で `npm test` が緑（必須テスト6件のうち4件以上が通っている）**

### Step2 — 画面（`ButanoshippoGame.tsx`）

`logic.ts` に手を入れずに、状態を表示するだけの画面を作ります。

1. `GameShell` で包み、`headerRight` に `ScoreBoard`（4人の引き取り枚数と手番）を置く
2. 輪を `Card`（`face="down"`）の並びで出し、**先頭の1枚だけ** `highlighted` にする
3. 場の中央を `DeckPile`（`top` に一番上のカード、`face="up"`）で出す
4. 自分の手番のときだけ、輪の先頭カードに `onClick` を付けて `{ type: "flip" }` を送る
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く
6. `npm run dev` で開き、**最初から最後まで1回通して遊ぶ**

**目安: 85分の時点で、最初から最後まで1回遊び切れる**

### Step3 — 必須要件の残りと異常系テスト

1. 終了処理と `getRanking`、`ResultModal` の表示
2. 残りの必須テスト2件（輪が尽きたら終了 / 引き取った人の次から再開）
3. 異常系テスト … CPU の手番中や引き取りの演出中に `{ type: "flip" }` を送っても状態が変わらないこと
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` にする
5. `npm run verify` を実行して緑にする

**目安: 95分の時点で `npm run verify` が緑**

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

1. **発展課題を全部やめる**（ログ・記録保存・タイマー・円形レイアウト・独自 CSS）
2. **引き取りの演出をやめる**。`Phase` から `"collecting"` を外し、`flipNext` の中で即座に引き取る。
   `pendingDelayMs` は「手番が CPU なら `CPU_INTERVAL_MS`、それ以外は `null`」だけにする
3. **輪の52枚表示をやめて、`DeckPile` 1つと「めくる」`Button` にする**（画面の組み立て時間を削る）。
   残り枚数は `DeckPile` の `count` に出るので、ルールは何も変わりません
4. **`ScoreBoard` をやめて、4人の引き取り枚数を素のテキストで出す**
5. **CPU を3人から1人に減らす**（あなた + CPU 1 の2人対戦）。
   ルールも `logic.ts` の構造も変わりません。`index.ts` の `minPlayers` / `maxPlayers` を触るので、
   **必ず講師に確認してから**変更してください
6. **順位表示をやめて、`ResultModal` の `score` に「あなたが引き取った枚数」だけを出す**。
   `getRanking` を呼ばなくなるので、順位のテストは `collected` の値を直接見る形に書き直します

ここまで落としても、**必須テスト6件と `npm run verify` が緑になることは落としません。**
テストが無い実装は評価されません。

**発展課題より先に、必須要件を削る相談を講師にしてください。**

## 発展課題（必須要件が全部終わってから）

**必須要件が全部終わってから**手を付けてください。すべて `src/games/butanoshippo/` の中だけで実装できます。
このゲームは9本の中で最も単純で、必須要件が早く終わります。だから発展課題を厚めに用意しています。

- `LogPanel` に「CPU 2 が ♥7 をめくって5枚 引き取りました」の経過を出す
- 順位表の `detail` を「3枚」表記に直す（`rankByScore` を使わず `Ranking` を自分で組み立てる）
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で「あなたの最少引き取り枚数」を保存する（少ないほど良い記録）
- `ButanoshippoGame.module.css` を足し、`transform: rotate()` で輪を**本物の円形**に並べる
- 引き取りの瞬間、場札が引き取った人の方へ動く演出を付ける
- 「あと何枚で輪が一周するか」と「引き取りが起きた回数」を出す
- 引き取り枚数が最多の人の欄を赤くして、危ない人がひと目で分かるようにする
- `sortCards` で自分が引き取ったカードをランク順に一覧表示する（`collected` を枚数ではなくカード配列で持つ）
- `useCountdown` で人間の手番に制限時間を付け、時間切れなら自動でめくる（本来の反射神経ゲームに一歩近づく）
- CPU ごとに待ち時間を変え、「速い CPU」「慎重な CPU」の個性を出す

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
