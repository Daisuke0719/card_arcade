import config from "../../../harness/config.json";
import type { OwnerId } from "@core";

export type ParticipantConfig = {
  participant: string;
  displayName: string;
  gameId: string;
  name: string;
  difficulty: string;
  component: string;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  issue: number;
  reviews: string;
};

/** harness/config.json（単一の真実源）を画面からも読む。 */
export const REPO: string = config.repo;
export const PARTICIPANTS: readonly ParticipantConfig[] = config.participants;
export const EXAMPLE_GAME_ID: string = config.exampleGameId;

/** 担当者の表示名。GitHub のアカウント名に差し替えたらそのまま出る。 */
export function ownerLabel(owner: OwnerId): string | undefined {
  if (owner === "core") return "お手本";
  return PARTICIPANTS.find((item) => item.participant === owner)?.displayName;
}

/** 実在する担当者かどうか。契約テストと manifest の検証が使う。 */
export function isKnownOwner(owner: string): boolean {
  return owner === "core" || PARTICIPANTS.some((item) => item.participant === owner);
}

export function issueUrl(issueNumber?: number): string | undefined {
  if (!issueNumber || issueNumber <= 0) return undefined;
  return "https://github.com/" + REPO + "/issues/" + issueNumber;
}
