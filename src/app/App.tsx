import { ArcadePage } from "../pages/ArcadePage";
import { GamePage } from "../pages/GamePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { useRoute } from "./router";

export function App() {
  const { route, navigate } = useRoute();
  const goHome = () => navigate({ name: "arcade" });

  switch (route.name) {
    case "game":
      return <GamePage id={route.id} onExit={goHome} />;
    case "not-found":
      return <NotFoundPage onExit={goHome} />;
    default:
      return <ArcadePage />;
  }
}
