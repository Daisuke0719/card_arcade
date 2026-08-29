# ダウト（`doubt`）を実装する

CARD ARCADE に **ダウト** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | 担当8 |
| 難易度 | 中級 |
| ブランチ | `feature/doubt` |
| 編集してよい範囲 | `src/games/doubt/` の中**だけ** |
| ルールの正典 | [`docs/games/doubt.md`](../blob/main/docs/games/doubt.md) |

**この Issue に書かれていないローカルルールは実装しません。** 迷ったら正典を見てください。

## 最初にやること（Step 5〜7）

```powershell
git switch -c feature/doubt
npm run scaffold -- --game doubt
npm test
```

テストが緑になったら、**実装を始める前に**一度コミットして Draft の Pull Request を作ります。
権限や CI の問題を早い段階で表に出すためです。

```powershell
git add src/games/doubt
git commit -m "chore: ダウトの雛形を追加"
git push -u origin HEAD
gh pr create --draft --title "ダウトを実装" --body "Closes #5"
```

CI が緑になったのを確認してから、Claude Code で計画を立てます。

```
/kickoff 5
```

`/kickoff` はコードを変更できないようになっています。計画が出たら、**人間が読んで合意してから** `/implement` へ進んでください。

## 必須要件

- [ ] 52枚を4人（あなた + CPU3人）に13枚ずつ配り切り、あなたの手番から始まる
- [ ] 宣言ランクが `A` から昇順に自動で循環する（`K` の次は `A`）
- [ ] 手番のとき、手札から1〜4枚を選んで裏向きに出せる（宣言ランクと違うカードも出せる）
- [ ] 出した後、出した人の左隣から順に、他のプレイヤーが1人ずつダウトするかを決める（最初の1人で確定）
- [ ] ダウトが当たれば出した人が、外れればダウトした人が、場札を**全部**引き取る
- [ ] 誰もダウトしなければ場札はそのまま積まれ、宣言ランクが1つ進んで次の人の手番になる
- [ ] 引き取りが起きたら場札が0枚になり、宣言ランクが `A` に戻り、引き取った人の次の人から再開する
- [ ] 他プレイヤーの手札は枚数だけ表示される（`Hand variant="hidden"` を使い、中身を DOM に出さない）
- [ ] 手札0枚で上がり、上がった順に順位が出る（最後に残った1人が最下位）
- [ ] `npm run verify` が緑になり、下の「必須テスト」6件が通る

## 実装の進め方

時刻は**研修開始からの経過分**です。実装は45〜95分、検証は95〜110分の枠を想定しています。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）｜ 65分までに終わっていれば順調

画面は一切さわりません。ここが終われば、あとは表示を貼るだけになります。

1. `Phase` / `DoubtState` / `DoubtAction` の型を決める（下の雛形をそのまま使ってかまいません）
2. `createInitialState(seed)` … 13枚ずつ配り、`you` を先手にし、`declaredRank` を `"A"` にする
3. `isBluff(cards, declaredRank)` … 1枚でもランクが違えば `true`
4. `nextDeclaredRank(rank)` … `cycleRank(rank, 1)` を包むだけ
5. `resolveDoubt(state, doubterId)` … 当たり/外れを判定し、場札の引き取り先を決める
6. 必須テスト6件のうち、`isBluff` と `resolveDoubt` に関わる5件を先に書く

### Step2 — 画面（`DoubtGame.tsx`）｜ 85分までに終わっていれば順調

1. `ComingSoonPanel` を消す
2. 自分の手札を `Hand`（複数選択）で出す。選んだIDを `useState<string[]>` に持ち、「出す」ボタンで `dispatch`
3. 他プレイヤーは `Hand variant="hidden" count={...}` で枚数だけ
4. 場札は `DeckPile`、`revealing` 中の公開カードは `Card`（または `Hand face="up"`）
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行だけ書く
6. `npm run dev` で最初から最後まで1回通してプレイする

### Step3 — 必須要件の残りと異常系テスト｜ 95分までに終わっていれば順調

1. `toPublicState` を書き、他人の手札が型として存在しないことをテストする
2. 上がりと順位（`finishPlayer` / `rankByFinishOrder` / `ResultModal`）
3. 異常系テスト（手番でない人の操作、判断中の二重クリック、上がった人への問い合わせ）
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` に変える
5. `README.md` を埋める
6. `npm run verify` が緑になったら `/pr`

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

**上から順に落とします。** 下に行くほどルールに影響するので、4番以降は必ず講師に相談してください。

1. **`LogPanel` の進行ログ** … 表示だけ。ルールには一切影響しない
2. **`revealing` の演出時間** … `REVEAL_DELAY_MS` を待たずに即決着させる。`pendingDelayMs` は CPU の手番だけを扱えばよくなる
3. **CPU の乱数判断** … `shouldDoubt` を「場札が3枚以下、かつ宣言ランクを2枚以上持っていればダウト」のような固定ルールにする。`Rng` 引数が不要になり、`cpu.ts` のテストも減る
4. **出せる枚数を1枚固定にする** … `Hand` の複数選択と「出す」ボタンが不要になり、画面が大幅に軽くなる。ルールの記述は1行変わる
5. **ダウトできるのを「あなた」だけにする** … CPU はダウトしない。心理戦が半分になるので**最終手段**

`index.ts` の `id` / `name` / `team` / `difficulty` / `minPlayers` / `maxPlayers` は、
どれだけ時間が無くても変更しないでください（契約テストと CI が落ちます）。

**発展課題より先に、必須要件を削る相談を講師にしてください。**

## 発展課題（必須要件が全部終わってから）

必須要件が全部終わってから手を出してください。すべて `src/games/doubt/` の中だけで実装できます。

- CPU の `doubtProbability` を改良する（場札が多いほど慎重になる、直前に自分が出したランクを避ける など）
- 「うそを通した回数」「ダウトを当てた回数」を数え、`useHighScore` と `gameKey` で保存する
- `LogPanel` にダウトの結果（誰が何枚引き取ったか）を履歴として残す
- 宣言ランクと一致する手札を `highlightedIds` で光らせ、うそをつく判断を助ける
- 「宣言ランクを全部出す」ボタン（`groupByRank` で該当カードをまとめて選択状態にする）
- CPU ごとに性格（うそをつきやすい / ダウトしやすい）を持たせる

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
