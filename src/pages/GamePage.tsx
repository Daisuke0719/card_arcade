import { GameErrorBoundary } from "../app/GameErrorBoundary";
import { getGame } from "../app/registry/loadGames";
import { GameModePage } from "./GameModePage";
import { NotFoundPage } from "./NotFoundPage";

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

  return (
    <GameErrorBoundary gameName={manifest.name} onExit={onExit}>
      {manifest.online ? (
        <GameModePage manifest={manifest} onExit={onExit} />
      ) : (
        <GameComponent manifest={manifest} onExit={onExit} />
      )}
    </GameErrorBoundary>
  );
}
