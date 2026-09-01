---
description: Pull Request の説明文を .pr-body.md に作る（作成・push はしない）
disable-model-invocation: true
---

Pull Request の本文を作ります。**`git push` も `gh pr create` も実行しません。**
push と PR 操作は、人間がターミナルB で自分の手で打ちます。

## 1. 前提の確認

```
npm run verify
git status
git log origin/main..HEAD --oneline
```

`npm run verify` が緑でない場合は、ここで止めて理由を報告してください。

## 2. 変更内容を読む

```
git diff origin/main...HEAD
```

自分が何を変えたかを、コミットではなく**差分から**説明できるようにしてください。

## 3. 本文を `.pr-body.md` に書く

`.github/PULL_REQUEST_TEMPLATE.md` の構成に沿って、次を埋めます。

- **実装したゲーム**: ゲーム名とゲームID
- **対応した Issue**: `Closes #<Issue番号>`
- **実装内容**: 何ができるようになったかを、動作の言葉で3〜6行
- **採用したルール**: ローカルルールのうち、何を採用して何を採用しなかったか
  （レビュアーが「このルールが無い」と誤解しないために必ず書く）
- **動作確認**: チェックリスト。**人間がまだ確認していない項目にチェックを入れないでください**
- **レビューしてほしい点**: ここは**空欄のまま残してください**。人間が自分の言葉で書きます
- **発展課題・未対応事項**: 正直に書く

`.pr-body.md` はコミットされません（`.gitignore` に入っています）。
このファイルだけは Claude Code が書いてよい場所です（`harness/config.json` の `alwaysWritable`）。

## 4. 人間に渡す（ここから先はターミナルB で人間が打つ）

次を伝えてください。**Claude Code はどれも実行しません。**

1. `.pr-body.md` を開いて「レビューしてほしい点」を自分の言葉で書く
   （「勝敗判定を見てください」ではなく「同じ数字が出たときの処理が怪しいので、そこを重点的に」のように具体的に）
   ここは相手のレビュアーが**具体的かどうかを検問する**場所です。テンプレのままだと指摘されます
2. 「動作確認」チェックリストのうち、自分が本当にやった項目にだけチェックを入れる
3. 画面のスクリーンショットを撮る（Windows: `Win + Shift + S`）
4. ターミナルB で push する

```
git push -u origin HEAD
```

5. Pull Request の本文を反映する

**Step 6 ですでに Draft の Pull Request を作っている場合**（通常はこちら）:

```
gh pr edit <自分のPR番号> --body-file .pr-body.md
```

**まだ Pull Request が無い場合**:

```
gh pr create --draft --title "<ゲーム名>を実装" --body-file .pr-body.md
```

6. GitHub の画面でスクリーンショットを本文にドラッグ&ドロップする
   （画像ファイルをリポジトリにコミットしないでください）
7. CI が緑になったことを確認してから、Draft を外す

```
gh pr checks
gh pr ready
```

`gh pr ready` を打った瞬間から、相手のレビュアーがあなたのコードを触り始めます。
**遊んでいないもの、verify が緑でないものを ready にしないでください。**

## 5. 補足

`git push` / `gh pr create` / `gh pr edit` / `gh pr ready` は、
仮に Claude Code から打とうとしても**人間の承認を求める設定**になっています。
承認を押すだけの作業にしないために、この5つは自分の手で打つ決まりにしています。
