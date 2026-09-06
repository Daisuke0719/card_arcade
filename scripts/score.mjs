/**
 * 評価のうち「数えられる部分」を集める（講師用の補助。最終判断は人間が行う）。
 *
 *   npm run score
 *
 * 数えられるものだけを出し、数えられないもの（テストの質、命名の分かりやすさ）は
 * 出さない。この線引き自体が、この研修で伝えたい設計思想でもある。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadConfig, repoRoot } from "./lib/harness.mjs";

const root = repoRoot();
const config = loadConfig(root);

function gh(args) {
  try {
    return execFileSync("gh", args, { cwd: root, encoding: "utf8", stdio: "pipe" });
  } catch {
    return "";
  }
}

function json(text, fallback) {
  try {
    return JSON.parse(text || "");
  } catch {
    return fallback;
  }
}

const pulls = json(
  gh([
    "pr",
    "list",
    "--state",
    "all",
    "--limit",
    "50",
    "--json",
    "number,headRefName,state,body,author,comments",
  ]),
  [],
);

function testCountOf(gameId) {
  const results = [];
  const dir = path.join(root, "src", "games", gameId);
  if (!existsSync(dir)) return 0;
  for (const file of ["logic.test.ts", "cpu.test.ts"]) {
    const full = path.join(dir, file);
    if (existsSync(full)) results.push(readFileSync(full, "utf8"));
  }
  return results.reduce((sum, source) => sum + (source.match(/\bit\(/g) ?? []).length, 0);
}

function isReady(gameId) {
  const file = path.join(root, "src", "games", gameId, "index.ts");
  return existsSync(file) && readFileSync(file, "utf8").includes('status: "ready"');
}

console.log("");
console.log("CARD ARCADE 集計（数えられるものだけ）");
console.log("");

for (const item of config.participants) {
  const pull = pulls.find((pr) => pr.headRefName === "feature/" + item.gameId);

  console.log("[" + item.displayName + "] " + item.name);
  console.log("  完成宣言(status: ready) : " + (isReady(item.gameId) ? "あり" : "なし"));
  console.log("  テスト件数              : " + testCountOf(item.gameId) + "件");
  console.log("  Pull Request            : " + (pull ? "#" + pull.number + " (" + pull.state + ")" : "なし"));
  console.log("  PR 本文の文字数         : " + (pull?.body?.length ?? 0));
  console.log("");
}

console.log("※ テストの中身の妥当性や命名の分かりやすさは機械では測れません。");
console.log("  そこは講師が実際に遊び、コードを読んで評価してください。");
console.log("");
