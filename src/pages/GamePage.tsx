import { GameErrorBoundary } from "../app/GameErrorBoundary";
import { getGame } from "../app/registry/loadGames";
import { NotFoundPage } from "./NotFoundPage";
import { PageOneModePage } from "./PageOneModePage";

export type GamePageProps = {
  id: string;
  onExit: () => void;
};

/** ゲーム1本を表示する。実行時エラーはこのゲームの中に閉じ込める。 */
export function GamePage({ id, onExit }: GamePageProps) {
  const game = getGame(id);

  if (!game) {
    return <NotFoundPage message={"「" + id + "」というゲームは見つかりませんでした。"} onExit={onExit} />;
  }

  const { manifest } = game;
  const GameComponent = manifest.component;

  if (id === "pageone") {
    return <PageOneModePage manifest={manifest} onExit={onExit} />;
  }

  return (
    <GameErrorBoundary gameName={manifest.name} onExit={onExit}>
      <GameComponent manifest={manifest} onExit={onExit} />
    </GameErrorBoundary>
  );
}
