/**
 * ゲームフォルダの形の契約テスト。
 *
 * 「どのチームのフォルダを開いても同じ場所に同じものがある」状態を機械で守る。
 * レビューする側が構造を覚え直さなくて済むようにするための仕組み。
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import config from "../../harness/config.json";
import { registry } from "../../src/app/registry/loadGames";

const gamesDir = path.join(process.cwd(), "src", "games");
const REQUIRED_HEADINGS = ["## 遊び方", "## ルール", "## 実装メモ"];

function componentFileOf(gameId: string): string {
  if (gameId === config.exampleGameId) return "ExampleGame.tsx";
  const team = config.teams.find((item) => item.gameId === gameId);
  return (team?.component ?? "") + ".tsx";
}

describe("ゲームフォルダの構成", () => {
  it("必須ファイルがすべて揃っている", () => {
    const missing: string[] = [];

    for (const game of registry.games) {
      const dir = path.join(gamesDir, game.folder);
      const required = [...config.requiredGameFiles, componentFileOf(game.folder)];

      for (const file of required) {
        if (!existsSync(path.join(dir, file))) {
          missing.push("src/games/" + game.folder + "/" + file);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it("README に決められた見出しがある", () => {
    const missing: string[] = [];

    for (const game of registry.games) {
      const readme = readFileSync(path.join(gamesDir, game.folder, "README.md"), "utf8");
      for (const heading of REQUIRED_HEADINGS) {
        if (!readme.includes(heading)) {
          missing.push("src/games/" + game.folder + "/README.md に " + heading + " がありません");
        }
      }
    }

    expect(missing).toEqual([]);
  });
});

describe("manifest の内容", () => {
  it("表示に使う項目が規約どおりになっている", () => {
    for (const { manifest } of registry.games) {
      expect(manifest.name.length, manifest.id + " の name").toBeLessThanOrEqual(20);
      expect(manifest.description.length, manifest.id + " の description").toBeLessThanOrEqual(60);
      expect(manifest.howToPlay.length, manifest.id + " の howToPlay").toBeGreaterThan(0);
      expect(manifest.minPlayers).toBeGreaterThanOrEqual(1);
      expect(manifest.maxPlayers).toBeGreaterThanOrEqual(manifest.minPlayers);
      expect(manifest.maxPlayers).toBeLessThanOrEqual(6);
    }
  });
});

describe("完成したゲーム（status: ready）", () => {
  // it.each は対象が0件のときテストが1件も登録されず「テストが無い」で落ちるため、
  // 1つのテストの中でループする。研修開始時点では ready が example-game だけになる。
  const readyGames = registry.games.filter((game) => game.manifest.status === "ready");

  it("ロジックのテストを3件以上持っている", () => {
    const problems: string[] = [];

    for (const game of readyGames) {
      const testPath = path.join(gamesDir, game.folder, "logic.test.ts");
      const source = existsSync(testPath) ? readFileSync(testPath, "utf8") : "";
      const count = (source.match(/\bit\(/g) ?? []).length;

      if (count < config.minTestsPerReadyGame) {
        problems.push(game.folder + " のテストが " + count + "件しかありません");
      }
      if (source.includes("it.skip") || source.includes("describe.skip")) {
        problems.push(game.folder + " に skip されたテストがあります");
      }
    }

    expect(problems).toEqual([]);
  });

  it("画面が例外を出さずに描画でき、GameShell を使っている", () => {
    for (const { manifest } of readyGames) {
      const GameComponent = manifest.component;
      const { getByTestId, unmount } = render(
        <GameComponent manifest={manifest} onExit={() => {}} />,
      );
      expect(getByTestId("game-shell"), manifest.id + " が GameShell を使っていません").toBeTruthy();
      unmount();
    }
  });
});
