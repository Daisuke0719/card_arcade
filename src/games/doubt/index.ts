import type { GameManifest } from "@core";
import { DoubtGame } from "./DoubtGame";

export const game: GameManifest = {
  id: "doubt",
  name: "ダウト",
  description: "裏向きのカードにうそを混ぜ、見抜かれる前に手札をなくそう",
  difficulty: "normal",
  owner: "participant-8",
  status: "ready",
  minPlayers: 4,
  maxPlayers: 4,
  icon: "🃏",
  issueNumber: 5,
  howToPlay: [
    "プレイヤーとCPU3人に13枚ずつ配り、Aの宣言から始めます。",
    "自分の番に手札から1〜4枚を選び、宣言ランクのカードとして裏向きに出します。",
    "出した人の左隣から順にダウトするか決め、最初のダウトで公開します。",
    "うそがあれば出した人、全部合っていればダウトした人が場札をすべて引き取ります。",
    "誰もダウトしなければ宣言を次のランクへ進め、手札を先に出し切った順に順位が決まります。",
  ],
  component: DoubtGame,
};
