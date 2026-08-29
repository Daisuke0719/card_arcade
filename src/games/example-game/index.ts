import type { GameManifest } from "@core";
import { ExampleGame } from "./ExampleGame";

/**
 * ゲームの公開情報。アーケードはこのファイルを自動で見つけて一覧に並べる。
 *
 * 必ず `export const game` という名前で公開すること（default export は使わない）。
 */
export const game: GameManifest = {
  id: "example-game",
  name: "ハイ＆ロー",
  description: "次のカードが高いか低いかを CPU と競う、運営のお手本ゲーム",
  difficulty: "easy",
  owner: "core",
  status: "ready",
  minPlayers: 1,
  maxPlayers: 1,
  icon: "🎴",
  tags: ["お手本", "参照実装"],
  howToPlay: [
    "表向きのカードを見て、次のカードが「高い」か「低い」かを選びます。",
    "CPU も同時に予想します。当たった人だけが1点を獲得します。",
    "同じ数字が出たときは引き分けで、どちらも点になりません。",
    "全10ラウンドを終えて、得点が多いほうが勝ちです。",
  ],
  component: ExampleGame,
};
