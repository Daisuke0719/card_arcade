import type { GameManifest } from "@core";
import { isKnownOwner } from "./harnessConfig";

const DIFFICULTIES = ["easy", "normal", "hard"];
const STATUSES = ["coming-soon", "ready"];
const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * ゲームが公開した manifest が規約を満たしているか調べる。
 * 例外は投げない。問題があってもアーケード全体は動き続け、
 * 開発中は赤いタイル、テストでは契約テストの失敗として現れる。
 */
export function validateManifest(folder: string, value: unknown): string[] {
  const problems: string[] = [];

  if (!value || typeof value !== "object") {
    return [
      "index.ts が `export const game` を公開していません（default export ではなく named export です）",
    ];
  }

  const manifest = value as Partial<GameManifest>;

  if (typeof manifest.id !== "string" || !ID_PATTERN.test(manifest.id)) {
    problems.push("id は英小文字・数字・ハイフンで始まる文字列にしてください");
  } else if (manifest.id !== folder) {
    problems.push(
      "id が「" + manifest.id + "」ですがフォルダ名は「" + folder + "」です。両者は一致させてください",
    );
  }

  if (typeof manifest.name !== "string" || manifest.name.trim() === "") {
    problems.push("name が空です");
  } else if (manifest.name.length > 20) {
    problems.push("name は20文字以内にしてください（現在 " + manifest.name.length + "文字）");
  }

  if (typeof manifest.description !== "string" || manifest.description.trim() === "") {
    problems.push("description が空です");
  } else if (manifest.description.length > 60) {
    problems.push(
      "description は60文字以内にしてください（現在 " + manifest.description.length + "文字）",
    );
  }

  if (typeof manifest.difficulty !== "string" || !DIFFICULTIES.includes(manifest.difficulty)) {
    problems.push("difficulty は easy / normal / hard のいずれかにしてください");
  }

  if (typeof manifest.status !== "string" || !STATUSES.includes(manifest.status)) {
    problems.push("status は coming-soon / ready のいずれかにしてください");
  }

  if (typeof manifest.owner !== "string" || !isKnownOwner(manifest.owner)) {
    problems.push(
      "owner は harness/config.json に載っている担当者ID（または core）にしてください",
    );
  }

  const min = manifest.minPlayers;
  const max = manifest.maxPlayers;
  if (typeof min !== "number" || typeof max !== "number") {
    problems.push("minPlayers / maxPlayers は数値で指定してください");
  } else if (!(min >= 1 && min <= max && max <= 6)) {
    problems.push("プレイ人数は 1 <= minPlayers <= maxPlayers <= 6 にしてください");
  }

  if (!Array.isArray(manifest.howToPlay) || manifest.howToPlay.length === 0) {
    problems.push("howToPlay に遊び方を1行以上書いてください");
  }

  const component: unknown = manifest.component;
  const isComponent =
    typeof component === "function" ||
    (typeof component === "object" && component !== null && "$$typeof" in component);
  if (!isComponent) {
    problems.push("component に React コンポーネントを指定してください");
  }

  return problems;
}
