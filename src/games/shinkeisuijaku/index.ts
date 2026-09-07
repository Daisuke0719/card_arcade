// @scaffold:untouched
import type { GameManifest } from "@core";
import { ShinkeisuijakuGame } from "./ShinkeisuijakuGame";

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
  id: "shinkeisuijaku",
  name: "神経衰弱",
  description: "裏向きのカードを2枚めくって、同じ数字のペアを全部そろえます",
  difficulty: "easy",
  owner: "participant-3",
  status: "coming-soon",
  minPlayers: 1,
  maxPlayers: 1,
  icon: "🧠",
  issueNumber: 2,
  howToPlay: [
    "裏向きに並んだ16枚から、カードを2枚めくります。",
    "2枚のランク（数字）が同じならペアが成立し、表向きのまま場に残ります。",
    "違うランクなら、2枚とも裏向きに戻ります。スートは関係ありません。",
    "2枚めくるごとに手数が1増えます。8組すべてそろえるとクリアです。",
    "少ない手数でそろえることを目指してください。",
  ],
  component: ShinkeisuijakuGame,
};
