import type { GameManifest } from "@core";
import { ButanoshippoGame } from "./ButanoshippoGame";

export const game: GameManifest = {
  id: "butanoshippo",
  name: "ぶたのしっぽ",
  description: "同じ数字が続いたら場札を引き取る、CPU3人とのターン制カードゲーム",
  difficulty: "easy",
  owner: "participant-5",
  status: "ready",
  minPlayers: 4,
  maxPlayers: 4,
  icon: "🐷",
  issueNumber: 9,
  howToPlay: [
    "52枚を伏せて輪に並べ、プレイヤーとCPU3人が順番に先頭のカードをめくります。",
    "直前のカードと同じ数字が出たら、その手番の人が場札をすべて引き取ります。",
    "輪のカードがなくなったら終了です。引き取った枚数が少ない順に順位が決まります。",
  ],
  component: ButanoshippoGame,
};
