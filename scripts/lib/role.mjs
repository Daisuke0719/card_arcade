/**
 * 「今この端末は誰として作業しているか」を決める。
 *
 * permissions.deny は静的なリストなので、講師と参加者で振る舞いを変えられない
 * （deny は全設定ファイルの和集合で、上位のファイルからも打ち消せない）。
 * ロールで分けたい判断はすべてフック側（= このモジュールを読むコード）に置く。
 *
 * 決め方は上から順に:
 *   1. 環境変数 CARD_ARCADE_ROLE
 *   2. .claude/.state/role.json（npm run role が書く。gitignore 済み）
 *   3. どちらも無ければ participant（安全側の既定）
 *
 * 「参加者の端末には何も置かれていない状態が既定で、いちばん厳しい」を保つのが狙い。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./harness.mjs";

export const ROLES = ["participant", "instructor"];
export const DEFAULT_ROLE = "participant";

export function roleFile(root = repoRoot()) {
  return path.join(root, ".claude", ".state", "role.json");
}

export function isValidRole(value) {
  return ROLES.includes(value);
}

export function currentRole(root = repoRoot()) {
  const fromEnv = process.env.CARD_ARCADE_ROLE;
  if (isValidRole(fromEnv)) return fromEnv;

  const file = roleFile(root);
  if (!existsSync(file)) return DEFAULT_ROLE;

  try {
    const saved = JSON.parse(readFileSync(file, "utf8")).role;
    return isValidRole(saved) ? saved : DEFAULT_ROLE;
  } catch {
    return DEFAULT_ROLE;
  }
}

export function isInstructor(root = repoRoot()) {
  return currentRole(root) === "instructor";
}

export function saveRole(role, root = repoRoot()) {
  if (!isValidRole(role)) throw new Error("知らないロールです: " + role);

  const file = roleFile(root);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ role }, null, 2) + "\n", "utf8");
  return file;
}
