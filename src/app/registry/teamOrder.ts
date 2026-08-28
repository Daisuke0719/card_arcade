import type { TeamId } from "@core";

/**
 * アーケードに並べる順番。
 * manifest に order フィールドを持たせない（自分のタイルを先頭にする改変を不可能にする）。
 */
export const TEAM_ORDER: readonly TeamId[] = [
  "team-a",
  "team-b",
  "team-c",
  "team-d",
  "team-e",
  "team-f",
  "core",
];

export function teamRank(team: TeamId): number {
  const index = TEAM_ORDER.indexOf(team);
  return index < 0 ? TEAM_ORDER.length : index;
}
