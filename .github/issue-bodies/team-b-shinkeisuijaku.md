# 神経衰弱（`shinkeisuijaku`）を実装する

CARD ARCADE に **神経衰弱** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| チーム | Team B |
| 難易度 | 初級 |
| ブランチ | `feature/shinkeisuijaku` |
| 編集してよい範囲 | `src/games/shinkeisuijaku/` の中**だけ** |
| ルールの正典 | [`docs/games/shinkeisuijaku.md`](../blob/main/docs/games/shinkeisuijaku.md) |

**この Issue に書かれていないローカルルールは実装しません。** 迷ったら正典を見てください。

## 最初にやること（Step 5〜7）

```powershell
git switch -c feature/shinkeisuijaku
npm run scaffold -- --game shinkeisuijaku
npm test
```

テストが緑になったら、**実装を始める前に**一度コミットして Draft の Pull Request を作ります。
権限や CI の問題を早い段階で表に出すためです。

```powershell
git add src/games/shinkeisuijaku
git commit -m "chore: 神経衰弱の雛形を追加"
git push -u origin HEAD
gh pr create --draft --title "神経衰弱を実装" --body "Closes #2"
```

CI が緑になったのを確認してから、Claude Code で計画を立てます。

```
/kickoff 2
```

`/kickoff` はコードを変更できないようになっています。計画が出たら、**人間が読んで合意してから** `/implement` へ進んでください。

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
- [ ] `logic.test.ts` に「必須テスト」7件があり、`npm run verify` が緑になる

## 実装の進め方

**この順番を守ってください。** 画面から作り始めると時間内に終わりません。

### Step1: `logic.ts` と `logic.test.ts`（純粋関数だけ）

`.tsx` はまだ触りません。React も時間も出てこない世界で、ルールを完成させます。

1. 定数と型を置く … `REVEAL_DELAY_MS` / `PAIR_COUNT` / `Phase` / `ShinkeisuijakuState` / `ShinkeisuijakuAction`
2. `createInitialState(seed)` … 8ランクを選んで16枚を作り、シャッフルして並べる
3. `flipCard(state, index)` … 1枚めくる。**選べないカードなら `state` をそのまま返す**
4. `resolveFlip(state)` … 判定中を解決する。ペアなら `matched` へ、違えば裏に戻す
5. `isGameOver(state)` / `pendingDelayMs(state)` / `reduce(state, action)`
6. 「必須テスト」7件を書く

```
npm test
```

**ここまで終わっていれば順調: 研修開始から 70分**（`npm test` が緑）

### Step2: 画面（`ShinkeisuijakuGame.tsx`）

1. `useReducer(reduce, undefined, () => createInitialState(...))` で状態を持つ
2. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }));` を**1行だけ**書く
3. 16枚を `Card` で4列に並べ、`face` を1枚ごとに切り替える
4. 手数を表示する
5. 終了したら `ResultModal` を出す

```
npm run dev
```

**ここまで終わっていれば順調: 研修開始から 85分**（最初から最後まで1回クリアできる）

### Step3: 必須要件の残りと異常系テスト

1. 「やってはいけない操作」のテストを足す（判定中の3枚目 / ペア済みの再クリック / 同じ場所の2回クリック）
2. `README.md` を書く（遊び方 / 採用したルール / 実装メモ）
3. `index.ts` の `status` を `"ready"` にする（**`npm run verify` が緑になってから**）

```
npm run verify
```

**ここまで終わっていれば順調: 研修開始から 95分**（`npm run verify` が緑）

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

**上から順に落とします。** 講師が判断するときの材料です。

1. **見た目の作り込み**（めくり演出・凝った CSS）。`Card` の既定の見た目のまま進めます
2. **経過時間の表示**（`useElapsedMs` + `Timer`）
3. **ベスト手数の保存**（`useHighScore`）
4. **`ResultModal`**。「クリア！ 12手」の1行を画面に出すだけに置き換えます
5. **手数の常時表示**。終了時に手数が出れば必須要件は満たせます
6. **最後の手段（講師の判断が要る）**: `PAIR_COUNT` を 8 から 6 に下げる（12枚・3列 × 4行）。
   ルールも状態遷移も変わらないので、影響は定数1つと `README.md` の記述だけです

**絶対に落としてはいけないもの**: 「判定中は3枚目をめくれない」と `logic.test.ts`。
この2つがこのゲームの評価対象です。画面が地味でも、ここが緑なら合格です。

**発展課題より先に、必須要件を削る相談を講師にしてください。**

## 発展課題（必須要件が全部終わってから）

**必須要件が全部終わってから**手を付けてください。すべて共通基盤を変更せずに実装できます。

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
| `src/games/example-game/` | お手本。**最初に読む** |
| `docs/game-plugin-guide.md` | ゲームの作り方（主教材） |
| `src/games/CLAUDE.md` | `@core` / `@ui` の早見表 |
| `docs/troubleshooting.md` | エラーで詰まったとき |
| `/stuck` | 詰まったときに状況を整理するコマンド |

## 困ったときは

- 共通基盤（`src/core` / `src/components`）を変えたくなったら、**自分で直さずに講師へ相談**してください
- 範囲チェックで止められたら、`npm run scope` が出す `git restore ...` をそのまま実行すれば戻せます
- 時間内に終わらなそうなら、70分の中間チェックポイントで講師に相談してください
