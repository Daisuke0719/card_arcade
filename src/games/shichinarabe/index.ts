// @scaffold:untouched
import type { GameManifest } from "@core";
import { ShichinarabeGame } from "./ShichinarabeGame";

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
  id: "shichinarabe",
  name: "七並べ",
  description: "7の隣から順にカードを並べます。出せないときはパス",
  difficulty: "normal",
  owner: "participant-7",
  status: "coming-soon",
  minPlayers: 4,
  maxPlayers: 4,
  icon: "🎋",
  issueNumber: 4,
  howToPlay: [
    "TODO: 遊び方を3〜6行で書いてください（画面の「遊び方」に表示されます）。",
  ],
  component: ShichinarabeGame,
};
