// @scaffold:untouched
import type { GameManifest } from "@core";
import { SpeedGame } from "./SpeedGame";

/**
 * ゲームの公開情報。アーケードがこのファイルを自動で見つけて一覧に並べます。
 *
 * 変更してよいのは description / howToPlay / icon / status だけです。
 * id・name・team・difficulty は運営が決めた値なので変えないでください
 * （変えると契約テストと CI が落ちます）。
 *
 * 完成したら status を "ready" に変えてください。それが完成の宣言になります。
 */
export const game: GameManifest = {
  id: "speed",
  name: "スピード",
  description: "CPUと同時進行で、1つ違いの数字のカードを出し合う早さ勝負",
  difficulty: "normal",
  team: "team-c",
  status: "coming-soon",
  minPlayers: 2,
  maxPlayers: 2,
  icon: "⚡",
  issueNumber: 3,
  howToPlay: [
    "TODO: 遊び方を3〜6行で書いてください（画面の「遊び方」に表示されます）。",
  ],
  component: SpeedGame,
};
