# オンライン対戦ハンズオン

共通のオンライン基盤は運営が管理します。参加者は従来どおり1人1ゲームを担当し、担当ゲームの `onlineAdapter.ts` を実装します。

## 参加者が実装するもの

- ゲーム固有の Action
- 手番と合法性の検証
- 状態更新
- プレイヤーごとの公開状態
- オンライン画面への接続
- オンライン固有のテスト

## 共通契約

`ServerGameAdapter<TState, TAction>` は `src/core` が公開する共通契約です。ゲームの状態をサーバーで検証し、`toPublicState` で相手に見せてよい情報だけを返します。

## ローカル起動

```powershell
npm ci
npx wrangler d1 migrations apply DB --local
npx wrangler dev
```

フロントエンドから接続する場合は `VITE_ONLINE_API_URL` に Worker のURLを設定します。Cloudflareへのログインと本番デプロイは運営が行います。

## ページワンの確認

1. `#/online/pageone` を開く
2. 名前を入力してルームを作る
3. 表示されたルームコードを別ブラウザで入力する
4. 参加者が2人以上になると試合が始まる
5. 片方の画面を更新し、再接続後もルーム状態が表示されることを確認する
