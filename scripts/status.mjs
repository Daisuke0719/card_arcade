/**
 * 6チームの進み具合を1画面にまとめる（講師が投影する用）。
 *
 *   npm run status
 *
 * 70〜75分の中間チェックポイントで、これを映して遅れているチームを特定する。
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

function localStatusOf(gameId) {
  const file = path.join(root, "src", "games", gameId, "index.ts");
  if (!existsSync(file)) return "未作成";
  return readFileSync(file, "utf8").includes('status: "ready"') ? "ready" : "coming-soon";
}

const raw = gh([
  "pr",
  "list",
  "--state",
  "all",
  "--limit",
  "50",
  "--json",
  "number,title,headRefName,isDraft,state,statusCheckRollup,reviewDecision,url",
]);

let pulls = [];
try {
  pulls = JSON.parse(raw || "[]");
} catch {
  pulls = [];
}

function ciOf(pull) {
  const checks = pull.statusCheckRollup ?? [];
  const verify = checks.find((check) => (check.name ?? check.context) === "verify");
  if (!verify) return checks.length === 0 ? "未実行" : "実行中";
  const conclusion = verify.conclusion ?? verify.state ?? "";
  if (conclusion === "SUCCESS") return "緑";
  if (conclusion === "FAILURE") return "赤";
  return "実行中";
}

function reviewOf(pull) {
  switch (pull.reviewDecision) {
    case "APPROVED":
      return "承認済み";
    case "CHANGES_REQUESTED":
      return "要修正";
    case "REVIEW_REQUIRED":
      return "レビュー待ち";
    default:
      return "-";
  }
}

const rows = config.participants.map((item) => {
  const pull = pulls.find((pr) => pr.headRefName === "feature/" + item.gameId);
  return {
    owner: item.displayName,
    game: item.name,
    pr: pull ? "#" + pull.number + (pull.isDraft ? "(Draft)" : "") : "なし",
    ci: pull ? ciOf(pull) : "-",
    review: pull ? reviewOf(pull) : "-",
    merged: pull?.state === "MERGED" ? "マージ済み" : "-",
    local: localStatusOf(item.gameId),
  };
});

const widths = {
  owner: 10,
  game: 10,
  pr: 12,
  ci: 8,
  review: 12,
  merged: 12,
};

function pad(text, width) {
  let length = 0;
  for (const ch of String(text)) length += ch.charCodeAt(0) > 0x2e80 ? 2 : 1;
  return String(text) + " ".repeat(Math.max(0, width - length));
}

console.log("");
console.log("CARD ARCADE の進み具合");
console.log("");
console.log(
  "  " +
    pad("担当", widths.owner) +
    pad("ゲーム", widths.game) +
    pad("PR", widths.pr) +
    pad("CI", widths.ci) +
    pad("レビュー", widths.review) +
    pad("マージ", widths.merged),
);
console.log("  " + "-".repeat(62));

for (const row of rows) {
  console.log(
    "  " +
      pad(row.owner, widths.owner) +
      pad(row.game, widths.game) +
      pad(row.pr, widths.pr) +
      pad(row.ci, widths.ci) +
      pad(row.review, widths.review) +
      pad(row.merged, widths.merged),
  );
}

const merged = rows.filter((row) => row.merged !== "-").length;
const withPr = rows.filter((row) => row.pr !== "なし").length;

console.log("");
console.log("  Pull Request: " + withPr + " / " + rows.length + "   マージ済み: " + merged + " / " + rows.length);
console.log("");

if (pulls.length === 0) {
  console.log("  （gh から Pull Request を取得できませんでした。gh auth status を確認してください）");
  console.log("");
}
