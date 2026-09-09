// @scaffold:untouched
import type { GameManifest } from "@core";
import { DaifugoGame } from "./DaifugoGame";

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
  id: "daifugo",
  name: "大富豪",
  description: "手札を早く出し切った人が勝ち。8切りと革命だけ入れます",
  difficulty: "hard",
  owner: "participant-2",
  status: "ready",
  minPlayers: 4,
  maxPlayers: 4,
  icon: "👑",
  issueNumber: 6,
  howToPlay: [
    "52枚を4人に13枚ずつ配り、ダイヤの3を持つ人から始めます。",
    "場と同じ枚数で、より強いランクの組を出してください。3が最弱、2が最強です。",
    "出せないとき、または出したくないときはパスできます。",
    "出した人以外の全員がパスすると場が流れ、最後に出した人から再開します。",
    "8を含む組を出すと即座に場が流れ、同じ人がもう一度出せます（8切り）。",
    "同じランクを4枚出すと革命が起き、強弱が逆転します。手札を先に出し切った順に大富豪・富豪・貧民・大貧民の称号が付きます。",
  ],
  component: DaifugoGame,
};
