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
    "4人に5枚ずつ配り、山札から1枚めくった場札から始めます。",
    "場札と同じマークか同じ数字のカードを、手札から1枚出します。",
    "出せるカードが1枚も無いときだけ山札から引き、引いたカードが出せればその場で出ます。",
    "8 を出すと次の人を1回飛ばし、A を出すともう1枚出せます。",
    "先に手札を0枚にした人が1位です。2位以下は残り枚数が少ない順に決まります。",
  ],
  component: PageOneGame,
};
