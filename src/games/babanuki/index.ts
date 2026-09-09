// @scaffold:untouched
import type { GameManifest } from "@core";
import { BabanukiGame } from "./BabanukiGame";

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
  id: "babanuki",
  name: "ババ抜き",
  description: "ジョーカーを最後まで持っていた人が負け。CPU3人と対戦します",
  difficulty: "easy",
  owner: "participant-1",
  status: "ready",
  minPlayers: 4,
  maxPlayers: 4,
  icon: "🃏",
  issueNumber: 1,
  howToPlay: [
    "53枚（52枚 + 赤ジョーカー1枚）を配り切り、同じ数字のペアを自動で捨てた状態から始まります。",
    "自分の手番では、左隣のプレイヤーの裏向きの手札から1枚選んでクリックし、1枚引きます。",
    "引いたカードとペアがそろえば、その場で2枚とも捨てられます。",
    "手札が0枚になったプレイヤーは上がりです。以降、手番も引かれる対象にもなりません。",
    "最後まで残った1人がジョーカーを持つことになり、最下位になります。",
  ],
  component: BabanukiGame,
};
