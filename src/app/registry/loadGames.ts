import type { GameManifest, TeamId } from "@core";
import { teamRank } from "./teamOrder";
import { validateManifest } from "./validateManifest";

export type LoadedGame = {
  folder: string;
  manifest: GameManifest;
};

export type RegistryProblem = {
  folder: string;
  messages: string[];
};

export type Registry = {
  games: LoadedGame[];
  problems: RegistryProblem[];
};

/**
 * src/games/<id>/index.ts を自動で集める。
 *
 * 一覧ファイルも登録用の配列も存在しないので、
 * 6チームの Pull Request が同時にマージされても
 * git が競合を起こす共通ファイルが1つも無い。これが「競合ゼロ」の仕組み。
 */
const modules = import.meta.glob<unknown>("../../games/*/index.ts", {
  eager: true,
  import: "game",
});

function folderNameOf(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 2] ?? path;
}

export function buildRegistry(entries: Record<string, unknown> = modules): Registry {
  const games: LoadedGame[] = [];
  const problems: RegistryProblem[] = [];

  const seenIds = new Set<string>();
  const seenTeams = new Set<string>();

  for (const [path, value] of Object.entries(entries)) {
    const folder = folderNameOf(path);
    const messages = validateManifest(folder, value);

    if (messages.length === 0) {
      const manifest = value as GameManifest;

      if (seenIds.has(manifest.id)) {
        problems.push({ folder, messages: ["id「" + manifest.id + "」が他のゲームと重複しています"] });
        continue;
      }
      if (manifest.team !== "core" && seenTeams.has(manifest.team)) {
        problems.push({
          folder,
          messages: ["team「" + manifest.team + "」が他のゲームと重複しています"],
        });
        continue;
      }

      seenIds.add(manifest.id);
      seenTeams.add(manifest.team);
      games.push({ folder, manifest });
    } else {
      problems.push({ folder, messages });
    }
  }

  games.sort((a, b) => {
    const rankDiff = teamRank(a.manifest.team as TeamId) - teamRank(b.manifest.team as TeamId);
    if (rankDiff !== 0) return rankDiff;
    return a.manifest.id.localeCompare(b.manifest.id);
  });

  return { games, problems };
}

export const registry: Registry = buildRegistry();

export function getGame(id: string): LoadedGame | undefined {
  return registry.games.find((game) => game.manifest.id === id);
}
