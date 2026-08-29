// @scaffold:untouched
import type { GameManifest } from "@core";
import { PokerGame } from "./PokerGame";

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
  id: "poker",
  name: "ポーカー",
  description: "5枚配って一度だけ交換。できた役の強さで CPU と勝負します",
  difficulty: "hard",
  owner: "participant-4",
  status: "coming-soon",
  minPlayers: 2,
  maxPlayers: 2,
  icon: "🎰",
  issueNumber: 0,
  howToPlay: [
    "TODO: 遊び方を3〜6行で書いてください（画面の「遊び方」に表示されます）。",
  ],
  component: PokerGame,
};
