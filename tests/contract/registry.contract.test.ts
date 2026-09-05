/**
 * ゲーム登録の契約テスト。
 *
 * 9人が別々に書いた index.ts が、アーケードから正しく見えるかを確かめる。
 * ここが緑であることが「マージしても壊れない」の最低ラインになる。
 *
 * 研修開始時点の main には example-game しか無い。
 * ゲームフォルダは各担当が自分の作業ブランチで npm run scaffold して作り、
 * Pull Request がマージされるたびに1つずつ増える。
 * そのため「9ゲームが揃っているか」ではなく
 * 「見つかったゲームが harness/config.json と食い違っていないか」を見る。
 */
import config from "../../harness/config.json";
import { registry } from "../../src/app/registry/loadGames";

const knownIds = new Set([...config.participants.map((item) => item.gameId), config.exampleGameId]);

describe("ゲームの自動検出", () => {
  it("読み込めないゲームが1つも無い", () => {
    const detail = registry.problems
      .map((problem) => problem.folder + ": " + problem.messages.join(" / "))
      .join("\n");
    expect(detail).toBe("");
  });

  it("お手本はいつでも見つかる", () => {
    const ids = registry.games.map((game) => game.manifest.id);
    expect(ids).toContain(config.exampleGameId);
  });

  it("harness/config.json に無いゲームが混ざっていない", () => {
    const unknown = registry.games
      .map((game) => game.manifest.id)
      .filter((id) => !knownIds.has(id));
    expect(unknown).toEqual([]);
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
      // まだ作られていない（マージされていない）ゲームは照合の対象外
      if (!game) continue;
      expect(game.manifest.owner).toBe(item.participant);
      expect(game.manifest.name).toBe(item.name);
      expect(game.manifest.difficulty).toBe(item.difficulty);
    }
  });
});
