// @scaffold:untouched
import type { GameManifest } from "@core";
import { ShinkeisuijakuGame } from "./ShinkeisuijakuGame";

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
  id: "shinkeisuijaku",
  name: "神経衰弱",
  description: "裏向きのカードを2枚めくって、同じ数字のペアを全部そろえます",
  difficulty: "easy",
  team: "team-b",
  status: "coming-soon",
  minPlayers: 1,
  maxPlayers: 1,
  icon: "🧠",
  issueNumber: 2,
  howToPlay: [
    "TODO: 遊び方を3〜6行で書いてください（画面の「遊び方」に表示されます）。",
  ],
  component: ShinkeisuijakuGame,
};
