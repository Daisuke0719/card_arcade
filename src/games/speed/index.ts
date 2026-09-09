// @scaffold:untouched
import type { GameManifest } from "@core";
import { SpeedGame } from "./SpeedGame";

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
  id: "speed",
  name: "スピード",
  description: "CPUと同時進行で、1つ違いの数字のカードを出し合う早さ勝負",
  difficulty: "normal",
  owner: "participant-6",
  status: "ready",
  minPlayers: 2,
  maxPlayers: 2,
  icon: "⚡",
  issueNumber: 3,
  howToPlay: [
    "中央の2枚の台札に、数字が1つ違うカードを手札から出します。",
    "出したカードは自動的に新しい台札になり、山札から1枚引いて手札を4枚に保ちます。",
    "A と K はつながります。K の台札に A が、A の台札に K が出せます。",
    "CPU と同時進行で出し合い、先に手札と山札を出し切ったほうが勝ちです。",
    "どちらも出せなくなったら、山札から1枚ずつ新しい台札に置いて続けます。",
  ],
  component: SpeedGame,
};
