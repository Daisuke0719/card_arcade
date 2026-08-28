/**
 * ゲーム登録の契約テスト。
 *
 * 6チームが別々に書いた index.ts が、アーケードから正しく見えるかを確かめる。
 * ここが緑であることが「マージしても壊れない」の最低ラインになる。
 */
import config from "../../harness/config.json";
import { registry } from "../../src/app/registry/loadGames";

const expectedIds = [...config.teams.map((team) => team.gameId), config.exampleGameId].sort();

describe("ゲームの自動検出", () => {
  it("読み込めないゲームが1つも無い", () => {
    const detail = registry.problems
      .map((problem) => problem.folder + ": " + problem.messages.join(" / "))
      .join("\n");
    expect(detail).toBe("");
  });

  it("harness/config.json に書かれたゲームがすべて見つかる", () => {
    const actual = registry.games.map((game) => game.manifest.id).sort();
    expect(actual).toEqual(expectedIds);
  });

  it("id がフォルダ名と一致している", () => {
    for (const game of registry.games) {
      expect(game.manifest.id).toBe(game.folder);
    }
  });

  it("担当チームが重複していない", () => {
    const teams = registry.games
      .map((game) => game.manifest.team)
      .filter((team) => team !== "core");
    expect(new Set(teams).size).toBe(teams.length);
  });

  it("チームとゲームの対応が harness/config.json と一致している", () => {
    for (const team of config.teams) {
      const game = registry.games.find((item) => item.manifest.id === team.gameId);
      expect(game, team.gameId + " が見つかりません").toBeDefined();
      expect(game?.manifest.team).toBe(team.team);
      expect(game?.manifest.name).toBe(team.name);
      expect(game?.manifest.difficulty).toBe(team.difficulty);
    }
  });
});
