/**
 * CI の結果まとめを GitHub の Job Summary に出す。
 *
 * 数字を見せるのが目的で、止めるのが目的ではない。
 * カバレッジの閾値は設けていない（研修中に閾値で止まると学びより手戻りが増えるため）。
 * 実質的な下限は契約テストの「ready なら logic のテスト3件以上」が担っている。
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { loadConfig, repoRoot } from "./lib/harness.mjs";

const root = repoRoot();
const config = loadConfig(root);

function testCountOf(gameId) {
  const file = path.join(root, "src", "games", gameId, "logic.test.ts");
  if (!existsSync(file)) return 0;
  const source = readFileSync(file, "utf8");
  return (source.match(/\bit\(/g) ?? []).length;
}

function statusOf(gameId) {
  const file = path.join(root, "src", "games", gameId, "index.ts");
  if (!existsSync(file)) return "未作成";
  const source = readFileSync(file, "utf8");
  return source.includes('status: "ready"') ? "ready" : "coming-soon";
}

function coverageOf() {
  const file = path.join(root, "coverage", "coverage-summary.json");
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

const coverage = coverageOf();

function coverageFor(gameId) {
  if (!coverage) return "-";
  const prefix = path.join(root, "src", "games", gameId).split(path.sep).join("/");
  const entries = Object.entries(coverage).filter(([key]) =>
    key.split(path.sep).join("/").includes(prefix),
  );
  if (entries.length === 0) return "-";

  let covered = 0;
  let total = 0;
  for (const [, value] of entries) {
    covered += value.lines?.covered ?? 0;
    total += value.lines?.total ?? 0;
  }
  if (total === 0) return "-";
  return Math.round((covered / total) * 100) + "%";
}

const lines = [];
lines.push("## CARD ARCADE の状況");
lines.push("");
lines.push("| チーム | ゲーム | 状態 | logic のテスト | 行カバレッジ |");
lines.push("|---|---|---|---:|---:|");

for (const team of config.teams) {
  lines.push(
    "| " +
      team.label +
      " | " +
      team.name +
      " | " +
      statusOf(team.gameId) +
      " | " +
      testCountOf(team.gameId) +
      "件 | " +
      coverageFor(team.gameId) +
      " |",
  );
}

const readyCount = config.teams.filter((team) => statusOf(team.gameId) === "ready").length;

lines.push("");
lines.push("公開中: **" + readyCount + " / " + config.teams.length + " ゲーム**");
lines.push("");
lines.push("---");
lines.push("");
lines.push("### 落ちたときの調べ方");
lines.push("");
lines.push("手元で `npm run verify` を実行すると、CI とまったく同じ内容を確認できます。");
lines.push("");
lines.push("| 落ちたもの | 見るところ |");
lines.push("|---|---|");
lines.push("| 範囲チェック | `npm run scope` が出す `git restore ...` をそのまま実行する（docs/troubleshooting.md T-09） |");
lines.push("| 依存の変更 | `git restore package.json package-lock.json` |");
lines.push("| Lint | エラーメッセージに直し方が書いてあります |");
lines.push("| 型チェック | 最初の1件だけを読む（後続は巻き添えのことが多い） |");
lines.push("| テスト | `npm test` を手元で実行する |");
lines.push("| ビルド | 型チェックが通っているなら import の書き方を疑う |");

console.log(lines.join("\n"));
