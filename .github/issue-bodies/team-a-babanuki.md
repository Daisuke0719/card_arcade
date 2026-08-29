# ババ抜き（`babanuki`）を実装する

CARD ARCADE に **ババ抜き** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| チーム | Team A |
| 難易度 | 初級 |
| ブランチ | `feature/babanuki` |
| 編集してよい範囲 | `src/games/babanuki/` の中**だけ** |
| ルールの正典 | [`docs/games/babanuki.md`](../blob/main/docs/games/babanuki.md) |

**この Issue に書かれていないローカルルールは実装しません。** 迷ったら正典を見てください。

## 最初にやること（Step 5〜7）

```powershell
git switch -c feature/babanuki
npm run scaffold -- --game babanuki
npm test
```

テストが緑になったら、**実装を始める前に**一度コミットして Draft の Pull Request を作ります。
権限や CI の問題を早い段階で表に出すためです。

```powershell
git add src/games/babanuki
git commit -m "chore: ババ抜きの雛形を追加"
git push -u origin HEAD
gh pr create --draft --title "ババ抜きを実装" --body "Closes #1"
```

CI が緑になったのを確認してから、Claude Code で計画を立てます。

```
/kickoff 1
```

`/kickoff` はコードを変更できないようになっています。計画が出たら、**人間が読んで合意してから** `/implement` へ進んでください。

## 必須要件

- [ ] 53枚（52枚 + 赤ジョーカー1枚）を4人へ配り切る（あなた14枚 / CPU 各13枚）
- [ ] 配札直後に、各プレイヤーの手札から同じランクのペアが自動で捨てられている
- [ ] 手番のプレイヤーは左隣の手札から裏向きの1枚を引ける（あなたの手番は裏向きのカードをクリックして引く）
- [ ] 引いた結果ペアがそろったら、その場で2枚とも捨てられる
- [ ] 引く相手がすでに上がっているときは、その人を飛ばして次の生存者から引く
- [ ] 手札が0枚になったプレイヤーは上がりになり、手番からも引かれる対象からも外れる
- [ ] 生存者が1人になったらゲームが終了し、上がった順の順位が `ResultModal` に出る
- [ ] 他プレイヤーの手札は裏向き（`face="down"`）で表示され、中身が DOM に出ない
- [ ] CPU の手番は `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` の1行だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] 下の「必須テスト」6件が `logic.test.ts` にあり、`npm run verify` が緑になる

## 実装の進め方

時刻はすべて**研修開始からの経過分**です。実装時間は 45分〜95分に割り当てられています。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面はまだ触りません。`react` を import せずに書けるところだけを作ります。

1. `Phase` / `BabanukiState` / `BabanukiAction` の型を決める
2. `createInitialState(seed)` … `createDeckWithJokers(1)` → `shuffle(deck, createRng(seed))` → `deal(deck, 4)` → 各手札に `discardPairs`
3. `discardPairs(hand)` を書き、テスト3件（2枚 / 3枚 / ジョーカー）を先に通す
4. `drawCard(state, index)` と `nextAlivePlayer(state)` を書く
5. `reduce` / `pendingDelayMs` / `isGameOver` をつなぐ

**目安: 70分の時点で `npm test` が緑（必須テスト6件のうち4件以上が通っている）**

### Step2 — 画面（`BabanukiGame.tsx`）

`logic.ts` に手を入れずに、状態を表示するだけの画面を作ります。

1. `GameShell` で包み、自分の手札を `Hand`（`face="up"`）で出す
2. 他プレイヤーの手札を `Hand`（`face="down"`）で出し、左隣に引く向きの矢印を添える
3. 自分の手番のときだけ、左隣の裏向きカードに `onCardClick` を付ける
4. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を**1行だけ**書く
5. `npm run dev` で開き、**最初から最後まで1回通して遊ぶ**

**目安: 85分の時点で、最初から最後まで1回遊び切れる**

### Step3 — 必須要件の残りと異常系テスト

1. 上がり処理（`finishPlayer`）と順位（`rankByFinishOrder`）、`ResultModal` の表示
2. 残りの必須テスト2件（上がった人のスキップ / 順位）
3. 異常系テスト … CPU の手番中に自分がクリックしても状態が変わらないこと
4. `index.ts` の `status` を `"ready"` にする
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

1. **発展課題を全部やめる**（並べ替え表示・ログ・記録保存・タイマー・独自 CSS）
2. **引いたカードを見せる演出をやめる**。`Phase` から `"revealing"` を外し、`pendingDelayMs` は
   「手番が CPU なら `CPU_DRAW_DELAY_MS`、それ以外は `null`」だけにする
3. **`ScoreBoard` をやめて、残り枚数を素のテキストで出す**（画面の組み立て時間を削る）
4. **CPU を3人から1人に減らす**（あなた + CPU 1 の2人対戦。27枚 / 26枚）。
   ルールも `logic.ts` の構造も変わりません。`index.ts` の `minPlayers` / `maxPlayers` を触るので、
   **必ず講師に確認してから**変更してください
5. **ジョーカーをやめて「52枚からスペードのAを1枚抜いた51枚」方式にする**。
   孤立した1枚がババになるので、遊び方も画面も同じままです。
   `createDeckWithJokers(1)` を `createDeck()` + スペードのAを1枚除外に差し替えるだけで済みます

ここまで落としても、**必須テスト6件と `npm run verify` が緑になることは落としません。**
テストが無い実装は評価されません。

**発展課題より先に、必須要件を削る相談を講師にしてください。**

## 発展課題（必須要件が全部終わってから）

**必須要件が全部終わってから**手を付けてください。すべて `src/games/babanuki/` の中だけで実装できます。

- `sortCards` で自分の手札をランク順に並べて表示する
- `LogPanel` に「あなたが CPU 1 から1枚引きました」「CPU 2 が上がりました」の経過を出す
- 引かれた側の手札を引かれるたびにシャッフルし直す（`shuffle` に状態から作った `Rng` を渡す）
- `useElapsedMs` と `Timer` で決着までの時間を表示する
- `useHighScore` と `gameKey` で「1位になった回数」または「最短決着時間」を保存する
- CPU の引き方を少し賢くする（直前に自分が引かれた位置を避ける、など）
- `BabanukiGame.module.css` を足して、自分の手番のときに手札を光らせる

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
