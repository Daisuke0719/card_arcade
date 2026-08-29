# スピード（`speed`）を実装する

CARD ARCADE に **スピード** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | 担当6 |
| 難易度 | 中級 |
| ブランチ | `feature/speed` |
| 編集してよい範囲 | `src/games/speed/` の中**だけ** |
| ルールの正典 | [`docs/games/speed.md`](../blob/main/docs/games/speed.md) |

**この Issue に書かれていないローカルルールは実装しません。** 迷ったら正典を見てください。

## 最初にやること（Step 5〜7）

```powershell
git switch -c feature/speed
npm run scaffold -- --game speed
npm test
```

テストが緑になったら、**実装を始める前に**一度コミットして Draft の Pull Request を作ります。
権限や CI の問題を早い段階で表に出すためです。

```powershell
git add src/games/speed
git commit -m "chore: スピードの雛形を追加"
git push -u origin HEAD
gh pr create --draft --title "スピードを実装" --body "Closes #3"
```

CI が緑になったのを確認してから、Claude Code で計画を立てます。

```
/kickoff 3
```

`/kickoff` はコードを変更できないようになっています。計画が出たら、**人間が読んで合意してから** `/implement` へ進んでください。

## 必須要件

- [ ] 52枚をシャッフルして26枚ずつに分け、手札4枚 / 台札1枚 / 山札21枚 で開始する
- [ ] `canPlay(card, pile)` が「1つ違いなら出せる・同じ数字は出せない・A と K は繋がる」を判定する
- [ ] 出せるカードが手札の中で常時ハイライトされる（`Hand` の `highlightedIds`）
- [ ] 手札のカードをクリック1回で出せる。両方の台札に出せるときは左の台札に出る
- [ ] 出せないカードをクリックしても状態が変わらない（連打しても2枚出ない）
- [ ] カードを出したら自分の山札から補充し、手札を4枚に保つ
- [ ] 両者が出せないとき `pendingDelayMs` が `REFILL_DELAY_MS` を返し、`tick` で台札が2枚とも入れ替わる
- [ ] CPU が `CPU_INTERVAL_MS` ごとに1枚だけ出す（画面側は `useCpuTurn` の1行だけ）
- [ ] 決着（手札と山札が両方0 / 両者詰み）で `ResultModal` に勝敗が出る
- [ ] `logic.test.ts` の必須テスト6件が緑になり、`npm run verify` が緑になる

## 実装の進め方

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面は一切書きません。まず「出せるかどうか」をテストで固めます。

1. 定数（`CPU_INTERVAL_MS` / `REFILL_DELAY_MS` / `HAND_SIZE`）と型（`Phase` / `SpeedState` / `SpeedAction`）を書く
2. `canPlay(card, pile)` を書き、必須テストの上から4件（1つ違い / 同ランク / K→A / A→K）を緑にする
3. `createInitialState(seed)` で26枚ずつに分けるところまで作る
4. `hasPlayableCard` と `pendingDelayMs` を書き、必須テスト5件目を緑にする
5. `reduce` の `play` と `tick` を書き、必須テスト6件目（決着）を緑にする

> **ここまで終わっていれば順調: 開始から 70分**（実装時間の折り返し）

### Step2 — 画面（`SpeedGame.tsx`）

`logic.ts` には手を入れません。状態を表示するだけです。

1. `GameShell` で包み、`Hand` と `DeckPile` を並べる
2. 出せるカードの `id` を集めて `Hand` の `highlightedIds` に渡す
3. `onCardClick` で `dispatch({ type: "play", side: "you", cardId: card.id })` する
4. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く
5. `npm run dev` で最初から最後まで1回プレイする

> **ここまで終わっていれば順調: 開始から 90分**

### Step3 — 必須要件の残りと異常系テスト

1. `ResultModal` で勝敗を出す（`rankByScore` に残り枚数を渡し `"lower-is-better"` で並べると楽）
2. 「出せないカードをクリックしても状態が変わらない」を `expect(next).toBe(state)` でテストする
3. 山札が空のときの補充と、両者詰みのテストを足す
4. `index.ts` の `status` を `"ready"` に変える（テスト3件以上と、実際に描画できることが必要）
5. `npm run verify` を緑にする

> **ここまで終わっていれば順調: 開始から 105分**（`npm run verify` が緑）

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

**先に落とすものから**並べています。1から順に落とし、5以降は必ず講師に相談してください。

1. **発展課題を全部やめる**（ログ・タイム記録・アニメーション・難易度切り替え）
2. **CSS Modules を作らない。** `@ui` の既定の見た目のままにする
3. **CPU の乱数をやめる。** 「手札の左から見て最初に出せたカードを出す」に固定する（`cpu.ts` が不要になる）
4. **配る枚数を減らす。** 26枚ずつ → 各自10枚（手札4枚 + 台札1枚 + 山札5枚）にする。
   **ルールも画面も一切変わらず**、1ゲームが短くなるだけなので安全に落とせる
5. **デッドロックの自動補充を落とす。** 詰んだら「もう一度」で仕切り直す。
   → 必須テスト「両者が出せない状態を pendingDelayMs が検出する」が落ちるので、**講師に必ず報告する**
6. **CPU を止める。** `pendingDelayMs` が CPU の手番を返さないようにし、
   「あなたが何秒で全部出せるか」のソロ版にする（`canPlay` のテスト4件はそのまま残る）

**発展課題より先に、必須要件を削る相談を講師にしてください。**

## 発展課題（必須要件が全部終わってから）

**必須要件が全部終わってから**着手してください。共通基盤（`src/core/` `src/components/`）は変更しません。

- CPU の速さを3段階（600ms / 1200ms / 2000ms）から選べるようにする（`CPU_INTERVAL_MS` を状態に持たせる）
- `useElapsedMs` と `Timer` で決着までの経過時間を表示する
- `useHighScore(manifest.id, "lower-is-better")` と `gameKey` で「最短決着タイム」を保存する
- `LogPanel` に「あなた: ♠5 を左へ」という履歴を出す
- `cpu.ts` を「出せるカードの評価値を返す純粋関数」と「乱数と比べて選ぶ薄い層」に分け、CPU の判断をテストする
- カードを出したときのアニメーションを `SpeedGame.module.css` で付ける（色と余白は `--ca-*` トークンを使う）

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
