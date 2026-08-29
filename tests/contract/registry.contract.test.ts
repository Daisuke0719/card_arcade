/**
 * ゲーム登録の契約テスト。
 *
 * 9人が別々に書いた index.ts が、アーケードから正しく見えるかを確かめる。
 * ここが緑であることが「マージしても壊れない」の最低ラインになる。
 */
import config from "../../harness/config.json";
import { registry } from "../../src/app/registry/loadGames";

const expectedIds = [
  ...config.participants.map((item) => item.gameId),
  config.exampleGameId,
].sort();

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

  it("担当者が重複していない（1人1ゲーム）", () => {
    const owners = registry.games
      .map((game) => game.manifest.owner)
      .filter((owner) => owner !== "core");
    expect(new Set(owners).size).toBe(owners.length);
  });

  it("担当者とゲームの対応が harness/config.json と一致している", () => {
    for (const item of config.participants) {
      const game = registry.games.find((entry) => entry.manifest.id === item.gameId);
      expect(game, item.gameId + " が見つかりません").toBeDefined();
      expect(game?.manifest.owner).toBe(item.participant);
      expect(game?.manifest.name).toBe(item.name);
      expect(game?.manifest.difficulty).toBe(item.difficulty);
    }
  });
});
