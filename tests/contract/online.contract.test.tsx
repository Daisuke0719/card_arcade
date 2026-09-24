/**
 * オンライン対戦の契約テスト。
 *
 * Worker は src/games/<id>/onlineAdapter.ts を自動で登録し、
 * 画面は manifest.online を見て入口とロビーを切り替える。
 * 片方だけ用意されて「サーバーにはあるのに画面から入れない」状態にならないことを確かめる。
 */
import { render, screen } from "@testing-library/react";
import { defineOnlineGame, defineOnlineView, type GameManifest } from "@core";
import { registry } from "../../src/app/registry/loadGames";
import { validateManifest } from "../../src/app/registry/validateManifest";
import { GamePage } from "../../src/pages/GamePage";
import { OnlineLobbyPage } from "../../src/pages/OnlineLobbyPage";

type AdapterModule = { onlineAdapter?: { gameId: string; minPlayers: number; maxPlayers: number } };
const adapters = import.meta.glob<AdapterModule>("../../src/games/*/onlineAdapter.ts", { eager: true });
const folderOf = (path: string) => path.split("/").at(-2) ?? path;

describe("オンライン対戦の登録", () => {
  it("onlineAdapter.ts があるゲームは manifest.online も登録している", () => {
    for (const [path, module] of Object.entries(adapters)) {
      const folder = folderOf(path);
      const game = registry.games.find((item) => item.folder === folder);
      expect(module.onlineAdapter, folder + " の onlineAdapter.ts が onlineAdapter を公開していません").toBeDefined();
      expect(game?.manifest.online, folder + " の index.ts に online: defineOnlineView(...) がありません").toBeDefined();
      expect(game?.manifest.online?.gameId).toBe(module.onlineAdapter?.gameId);
      expect(game?.manifest.online?.minPlayers).toBe(module.onlineAdapter?.minPlayers);
      expect(game?.manifest.online?.maxPlayers).toBe(module.onlineAdapter?.maxPlayers);
    }
  });

  it("manifest.online があるゲームは onlineAdapter.ts も持っている", () => {
    const withAdapter = new Set(Object.keys(adapters).map(folderOf));
    const missing = registry.games
      .filter((game) => game.manifest.online && !withAdapter.has(game.folder))
      .map((game) => game.folder);
    expect(missing).toEqual([]);
  });
});

describe("manifest.online の検証", () => {
  const base = registry.games[0].manifest;
  const adapter = defineOnlineGame<null, null>({
    gameId: "other-game", minPlayers: 2, maxPlayers: 4,
    createInitialState: () => null, parseAction: () => null, validateAction: () => ({ ok: true }),
    reduce: () => null, isFinished: () => false, getResult: () => ({ outcome: "done" }), toPublicState: () => null,
  });

  it("gameId が manifest の id と違うと問題として報告する", () => {
    const manifest: GameManifest = { ...base, online: defineOnlineView(adapter, () => null) };
    expect(validateManifest(base.id, manifest).join("\n")).toContain("gameId");
  });

  it("オンラインの人数が1人だと問題として報告する", () => {
    const solo = { ...adapter, gameId: base.id, minPlayers: 1, maxPlayers: 1 };
    const manifest: GameManifest = { ...base, online: defineOnlineView(solo, () => null) };
    expect(validateManifest(base.id, manifest).join("\n")).toContain("人数");
  });
});

describe("オンライン対戦の入口", () => {
  const onlineGame = registry.games.find((game) => game.manifest.online);
  const cpuOnlyGame = registry.games.find((game) => !game.manifest.online);

  it("オンライン対応のゲームは CPU 対戦とオンライン対戦を選べる", () => {
    if (!onlineGame) return;
    render(<GamePage id={onlineGame.manifest.id} onExit={() => {}} />);
    expect(screen.getByText("CPU対戦")).toBeInTheDocument();
    expect(screen.getByText("オンライン対戦").closest("a")).toHaveAttribute("href", "#/online/" + onlineGame.manifest.id);
  });

  it("オンライン未対応のゲームはロビーに入れない", () => {
    if (!cpuOnlyGame) return;
    render(<OnlineLobbyPage gameId={cpuOnlyGame.manifest.id} onExit={() => {}} />);
    expect(screen.getByText(/オンライン対戦に対応していません/)).toBeInTheDocument();
  });

  it("ロビーは manifest.online の人数を表示する", () => {
    if (!onlineGame?.manifest.online) return;
    const { minPlayers, maxPlayers } = onlineGame.manifest.online;
    render(<OnlineLobbyPage gameId={onlineGame.manifest.id} onExit={() => {}} />);
    const label = minPlayers === maxPlayers ? `${minPlayers}人` : `${minPlayers}〜${maxPlayers}人`;
    expect(screen.getByText(new RegExp(label + "で遊べます"))).toBeInTheDocument();
  });
});
