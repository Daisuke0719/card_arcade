// @scaffold:untouched
import type { GameManifest } from "@core";
import { ButanoshippoGame } from "./ButanoshippoGame";

/**
 * ゲームの公開情報。アーケードがこのファイルを自動で見つけて一覧に並べます。
 *
 * 変更してよいのは description / howToPlay / icon / status だけです。
 * id・name・owner・difficulty は運営が決めた値なので変えないでください
 * （変えると契約テストと CI が落ちます）。
 *
 * 完成したら status を "ready" に変えてください。それが完成の宣言になります。
 */
export const game: GameManifest = {
  id: "butanoshippo",
  name: "ぶたのしっぽ",
  description: "円くならべた場札をめくり、同じ数字が出たら全部引き取ります",
  difficulty: "easy",
  owner: "participant-5",
  status: "coming-soon",
  minPlayers: 4,
  maxPlayers: 4,
  icon: "🐷",
  issueNumber: 9,
  howToPlay: [
    "TODO: 遊び方を3〜6行で書いてください（画面の「遊び方」に表示されます）。",
  ],
  component: ButanoshippoGame,
};
