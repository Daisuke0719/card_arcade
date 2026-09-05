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
  status: "ready",
  minPlayers: 4,
  maxPlayers: 4,
  icon: "1️⃣",
  issueNumber: 10,
  howToPlay: [
    "場札の一番上と同じマーク、または同じ数字のカードを1枚出します。",
    "出せるカードがあるときは必ず出します。1枚も無いときだけ山札から引きます。",
    "引いたカードがそのまま出せるときは、その場で自動的に場に出ます。",
    "8 を出すと次の人が1回飛ばされ、A を出すともう1枚出せます。",
    "手札を先に0枚にした人が勝ちです。2位以下は残り枚数の少ない順になります。",
  ],
  component: PageOneGame,
};
