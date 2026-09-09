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
  status: "ready",
  minPlayers: 4,
  maxPlayers: 4,
  icon: "🎋",
  issueNumber: 4,
  howToPlay: [
    "配り終わった直後に、4枚の7が自動で場に置かれます。ダイヤの7を持っていた人が先手です。",
    "手番では、場に出ているカードと同じスートで±1のランクのカードを1枚だけ置けます。",
    "置けるカードがあるときはパスできません。置けるカードが無いときだけパスできます。",
    "パスは1人3回まで。4回目のパスで脱落し、手札をすべて場に置いて手番から外れます。",
    "手札を先に出し切った人が上位になります。最後まで残った人が1人になったら終了です。",
  ],
  component: ShichinarabeGame,
};
