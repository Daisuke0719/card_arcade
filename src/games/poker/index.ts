import type { GameManifest } from "@core";
import { PokerGame } from "./PokerGame";

export const game: GameManifest = {
  id: "poker",
  name: "ポーカー",
  description: "5枚配って一度だけ交換。できた役の強さで CPU と勝負します",
  difficulty: "hard",
  owner: "participant-4",
  status: "ready",
  minPlayers: 2,
  maxPlayers: 2,
  icon: "🎰",
  issueNumber: 8,
  howToPlay: [
    "52枚から5枚ずつ配ります。プレイヤーの手札は最初から表向きです。",
    "交換したいカードをクリックして選び、もう一度クリックすると選択を外せます。",
    "交換は一度だけで、0〜5枚を山札から補充します。CPUも同時に交換します。",
    "交換後は役の強さで勝負します。同じ役は役を構成する数字で比べます。",
  ],
  component: PokerGame,
};
