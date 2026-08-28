import config from "../../../harness/config.json";
import type { TeamId } from "@core";

export type TeamConfig = {
  team: string;
  label: string;
  gameId: string;
  name: string;
  difficulty: string;
  component: string;
  issue: number;
  reviews: string;
};

/** harness/config.json（単一の真実源）を画面からも読む。 */
export const REPO: string = config.repo;
export const TEAMS: readonly TeamConfig[] = config.teams;
export const EXAMPLE_GAME_ID: string = config.exampleGameId;

export function teamLabel(team: TeamId): string | undefined {
  if (team === "core") return "お手本";
  return TEAMS.find((item) => item.team === team)?.label;
}

export function issueUrl(issueNumber?: number): string | undefined {
  if (!issueNumber || issueNumber <= 0) return undefined;
  return "https://github.com/" + REPO + "/issues/" + issueNumber;
}
