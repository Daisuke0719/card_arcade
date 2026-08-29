# 七並べ（`shichinarabe`）を実装する

CARD ARCADE に **七並べ** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| チーム | Team D |
| 難易度 | 中級 |
| ブランチ | `feature/shichinarabe` |
| 編集してよい範囲 | `src/games/shichinarabe/` の中**だけ** |
| ルールの正典 | [`docs/games/shichinarabe.md`](../blob/main/docs/games/shichinarabe.md) |

**この Issue に書かれていないローカルルールは実装しません。** 迷ったら正典を見てください。

## 最初にやること（Step 5〜7）

```powershell
git switch -c feature/shichinarabe
npm run scaffold -- --game shichinarabe
npm test
```

テストが緑になったら、**実装を始める前に**一度コミットして Draft の Pull Request を作ります。
権限や CI の問題を早い段階で表に出すためです。

```powershell
git add src/games/shichinarabe
git commit -m "chore: 七並べの雛形を追加"
git push -u origin HEAD
gh pr create --draft --title "七並べを実装" --body "Closes #4"
```

CI が緑になったのを確認してから、Claude Code で計画を立てます。

```
/kickoff 4
```

`/kickoff` はコードを変更できないようになっています。計画が出たら、**人間が読んで合意してから** `/implement` へ進んでください。

## 必須要件

- [ ] 52枚を4人（あなた + CPU3人）に13枚ずつ配り、開始時に4枚の7を自動で場に置く
- [ ] ダイヤの7を配られた人が先手になる
- [ ] `canPlace(board, card)` が「場のカードの ±1 だけ置ける」を判定する（A の下・K の上は無い）
- [ ] 自分の手札のうち、今置けるカードだけがクリックできる（置けないカードは押せない）
- [ ] 置けるカードが1枚でもあるときはパスできない。置けないときだけパスできる
- [ ] パスは1人3回まで。4回目のパスで脱落し、手札を全部（飛び地も）場に置いて手番から外れる
- [ ] CPU3人の手番が `pendingDelayMs` と `useCpuTurn` だけで自動的に進む（`.tsx` に `setTimeout` を書かない）
- [ ] 手札を出し切った順に順位が付き、`ResultModal` に順位表が出る
- [ ] `logic.test.ts` に「必須テスト」6件がある
- [ ] `npm run verify` が緑になり、`index.ts` の `status` を `"ready"` にした

## 実装の進め方

時刻は**研修開始からの経過分**です。実装時間は45分から始まります。

### Step1 — `logic.ts` と `logic.test.ts`（純粋関数だけ）

画面は一切さわりません。`npm test` だけで進めます。

1. `Board` 型（`Record<Suit, boolean[]>`、index 0..12 が A..K）と `createInitialState(seed)` を書く
   （配る → 4枚の7を場に置く → ダイヤの7を持っていた人を先手にする）
2. `canPlace(board, card)` と `legalMoves(board, hand)` を書く
3. `place` / `passTurn` / `dropOut` を書く
4. `reduce(state, action)` と `pendingDelayMs(state)` でつなぐ
5. 必須テストのうち `canPlace` を見る3件（7の隣・離れたカード・A の下と K の上）を先に書く

**目安: 65分。** ここで `npm test` が緑で、必須テスト6件のうち4件以上が書けていれば順調です。

### Step2 — 画面（`ShichinarabeGame.tsx`）

1. `GameShell` で包む
2. 盤面を4スート×13マスで並べる（置かれていないマスは `Card` の `placeholder` で空きスロットにする）
3. 自分の手札を `Hand` で出し、`disabledIds` に「今置けないカード」を入れる
4. 他プレイヤーは `Hand variant="hidden"` で枚数だけ出す
5. `useCpuTurn(pendingDelayMs(state), () => dispatch({ type: "tick" }))` を1行書く

**目安: 85分。** ここで `npm run dev` を開き、**最初から最後まで1回自分でプレイできれば**順調です。

### Step3 — 必須要件の残りと異常系テスト

1. パスボタン（置けないときだけ出す）とパス残り回数の表示
2. 脱落の反映、`ScoreBoard` の手番表示、`ResultModal` の順位表
3. 異常系のテスト（手番でないときの `place` が無視される／脱落した人が手番から飛ばされる など）
4. `index.ts` の `description` と `howToPlay` を書き、`status` を `"ready"` に変える
5. `npm run verify`

**目安: 95分（遅くとも105分）。** 110分から Pull Request 作成に入るので、それまでに verify を緑にします。

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

**上から順に落とします。** 1〜3 はチームの判断で落としてかまいません。4 と 5 は必須要件が減るので、
落とす前に**講師に確認**してください。

1. **進行ログと演出** — `LogPanel` と、置いたときのハイライト。動作には影響しません。
2. **CPU の賢さ** — `legalMoves` の先頭をそのまま出すだけにする。ゲームは最後まで進みます。
3. **パス残り回数の表示** — 画面表示だけ落とし、`passes` のカウントとルールは残す。
4. **順位の並べ替え** — 脱落した人を下に回す処理をやめ、上がった順だけを `ResultModal` に出す。
   （必須要件が1件と、順位まわりのテストの一部が落ちます）
5. **脱落ルールそのもの** — パスを無制限にする。「出せるカードがあるときは必ず出す」を守っていれば、
   場の端に置けるカードは必ず誰かの手札にあり、その人の手番で必ず置かれます。
   つまり**脱落が無くてもゲームは必ず終わります**。
   （必須テスト1件と必須要件1件が落ちるので、これは最後の手段です）

`npm run verify` を緑にすることが最優先です。要件を1つ落としてでも、緑の Pull Request を出してください。

**発展課題より先に、必須要件を削る相談を講師にしてください。**

## 発展課題（必須要件が全部終わってから）

**必須要件が全部終わってから**手を付けてください。いずれも `src/games/shichinarabe/` の中だけで完結します。

- CPU を少し賢くする（自分の手札が続いているスートを優先する／端に近いカードから出す）。
  判断は `cpu.ts` の純粋関数に置き、テストを書く。
- `LogPanel` に「CPU2 がパスしました（残り1回）」「CPU3 が脱落しました」を出す。
- `ScoreBoard` の `detail` に「残り7枚 / パス残り2回」を出す。
- `ShichinarabeGame.module.css` を追加して、直前に置かれたカードを一瞬ハイライトする。
- 次に置けるマス（各スートの両端）の空きスロットだけ枠を光らせる。
- `useHighScore` と `gameKey` で「1位になった回数」を保存して表示する。
- 画面の隅に `seed` を表示し、同じ配りをやり直せるようにする。

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
