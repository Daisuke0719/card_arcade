// @scaffold:untouched
import type { GameManifest } from "@core";
import { PageOneGame } from "./PageOneGame";

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
  id: "pageone",
  name: "ページワン",
  description: "同じマークか同じ数字を出して、手札を先に出し切ります",
  difficulty: "normal",
  owner: "participant-9",
  status: "coming-soon",
  minPlayers: 4,
  maxPlayers: 4,
  icon: "1️⃣",
  issueNumber: 0,
  howToPlay: [
    "TODO: 遊び方を3〜6行で書いてください（画面の「遊び方」に表示されます）。",
  ],
  component: PageOneGame,
};
