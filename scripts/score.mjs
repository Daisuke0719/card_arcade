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
    "number,headRefName,state,body,author,reviews,comments",
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

for (const team of config.teams) {
  const pull = pulls.find((item) => item.headRefName === "feature/" + team.gameId);
  const reviewsGiven = pulls
    .filter((item) => item.headRefName !== "feature/" + team.gameId)
    .reduce((sum, item) => {
      const reviews = item.reviews ?? [];
      return sum + reviews.length;
    }, 0);

  console.log("[" + team.label + "] " + team.name);
  console.log("  完成宣言(status: ready) : " + (isReady(team.gameId) ? "あり" : "なし"));
  console.log("  テスト件数              : " + testCountOf(team.gameId) + "件");
  console.log("  Pull Request            : " + (pull ? "#" + pull.number + " (" + pull.state + ")" : "なし"));
  console.log("  受けたレビュー          : " + (pull?.reviews?.length ?? 0) + "件");
  console.log("  PR 本文の文字数         : " + (pull?.body?.length ?? 0));
  console.log("  他チームへのレビュー総数 : " + reviewsGiven + "件（リポジトリ全体の参考値）");
  console.log("");
}

console.log("※ テストの中身の妥当性・命名の分かりやすさ・レビューの質は機械では測れません。");
console.log("  そこは相互レビューと講師の目で評価してください。");
console.log("");
