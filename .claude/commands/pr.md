---
description: Pull Request の説明文を .pr-body.md に作る（作成はしない）
disable-model-invocation: true
---

Pull Request の本文を作ります。**`gh pr create` は実行しません。** 人間が中身を確認してから出します。

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
- **対応した Issue**: `Closes #<番号>`
- **実装内容**: 何ができるようになったかを、動作の言葉で3〜6行
- **採用したルール**: ローカルルールのうち、何を採用して何を採用しなかったか
  （レビュアーが「このルールが無い」と誤解しないために必ず書く）
- **動作確認**: チェックリスト
- **レビューしてほしい点**: ここは**空欄のまま残してください**。人間が自分の言葉で書きます
- **発展課題・未対応事項**: 正直に書く

`.pr-body.md` はコミットされません（`.gitignore` に入っています）。

## 4. 人間に渡す

次を伝えてください。

1. `.pr-body.md` を開いて「レビューしてほしい点」を自分の言葉で書く
   （「勝敗判定を見てください」ではなく「同じ数字が出たときの処理が怪しいので、そこを重点的に」のように具体的に）
2. 画面のスクリーンショットを撮る（Windows: `Win + Shift + S`）
3. 次のコマンドで Draft の Pull Request を作る

```
git push -u origin HEAD
gh pr create --draft --title "<ゲーム名>を実装" --body-file .pr-body.md
```

4. GitHub の画面でスクリーンショットを本文にドラッグ&ドロップする
   （画像ファイルをリポジトリにコミットしないでください）
5. CI が緑になったら `gh pr ready` で Draft を外す
