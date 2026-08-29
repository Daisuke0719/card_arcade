/**
 * 担当範囲チェック。
 *
 *   node scripts/scope-guard.mjs                  作業ツリーの変更を見る（npm run scope）
 *   node scripts/scope-guard.mjs --staged         コミットしようとしている変更を見る（pre-commit）
 *   node scripts/scope-guard.mjs --base origin/main   ブランチ全体の変更を見る（CI）
 *   node scripts/scope-guard.mjs --base origin/main --branch feature/speed
 *                                                 CI は detached HEAD で動くので、
 *                                                 ブランチ名を外から渡す
 *   node scripts/scope-guard.mjs --warn-only      違反しても成功扱いにする（講師の緊急用）
 *
 * pre-commit と CI がこの同じスクリプトを呼ぶので、
 * 「手元では通ったのに CI で落ちた」が起きない。
 */
import { execFileSync } from "node:child_process";
import {
  classifyPath,
  currentBranch,
  findTeamByGameId,
  gameIdFromBranch,
  loadConfig,
  repoRoot,
} from "./lib/harness.mjs";

const root = repoRoot();
const config = loadConfig(root);
const args = process.argv.slice(2);
const warnOnly = args.includes("--warn-only") || process.env.CARD_ARCADE_HARNESS === "off";

function git(params) {
  return execFileSync("git", params, { cwd: root, encoding: "utf8" });
}

function baseRefOf() {
  const index = args.indexOf("--base");
  return index >= 0 ? args[index + 1] : null;
}

/**
 * 判定に使うブランチ名。
 * CI は detached HEAD で checkout するため、そのまま読むと "HEAD" になってしまう。
 * その状態で「まだ作業ブランチを作っていません」と案内すると参加者が混乱するので、
 * CI からは --branch で PR のブランチ名を渡す。
 */
function branchName() {
  const index = args.indexOf("--branch");
  if (index >= 0 && args[index + 1]) return args[index + 1];

  const current = currentBranch(root);
  return current === "HEAD" ? "" : current;
}

function changedFiles() {
  const base = baseRefOf();

  if (base) {
    const output = git(["diff", "--name-only", base + "...HEAD"]);
    return output.split("\n").map((line) => line.trim()).filter(Boolean);
  }

  if (args.includes("--staged")) {
    const output = git(["diff", "--cached", "--name-only"]);
    return output.split("\n").map((line) => line.trim()).filter(Boolean);
  }

  const output = git(["status", "--porcelain"]);
  return output
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    .map((line) => (line.includes(" -> ") ? line.split(" -> ")[1] : line))
    .map((line) => line.replace(/^"|"$/g, ""));
}

const KIND_LABEL = {
  protected: "運営管理",
  unknown: "対象外の場所",
  "other-game": "他チームのゲーム",
};

function report(violations, touchedIds, branch) {
  console.log("");
  console.log("CARD ARCADE 範囲チェック");
  console.log("");

  const onFeatureBranch = gameIdFromBranch(branch) !== null;

  // ブランチ名が分からない場合（CI で --branch を渡していないなど）は案内を出さない
  if (violations.length > 0 && !onFeatureBranch && branch) {
    console.log("! まだ作業ブランチを作っていません（今: " + (branch || "不明") + "）");
    console.log("");
    console.log("  git switch -c feature/<自分のゲームID>");
    console.log("");
    console.log("を実行してから、担当フォルダの中だけを編集してください。");
    console.log("");
  }

  if (violations.length > 0) {
    console.log("✗ 担当範囲の外が変更されています（" + violations.length + "件）");
    console.log("");
    for (const item of violations) {
      console.log("  [" + KIND_LABEL[item.kind] + "] " + item.path);
    }
    console.log("");
    console.log("編集してよいのは src/games/<自分のゲームID>/ の中だけです。");
    console.log("");
    console.log("元に戻すには、次のコマンドをそのまま実行してください:");
    console.log("");
    console.log(
      "  git restore --source=HEAD --staged --worktree -- " +
        violations.map((item) => item.path).join(" "),
    );
    console.log("");
    console.log("共通基盤の変更がどうしても必要な場合は、自分で直さずに講師へ相談してください。");
    console.log("詳しい対処: docs/troubleshooting.md（T-09）");
    console.log("");
  }

  if (touchedIds.size > 1) {
    console.log("✗ 1つの Pull Request で複数のゲームを変更しています");
    console.log("  " + Array.from(touchedIds).join(", "));
    console.log("");
    console.log("1つの Pull Request で扱うゲームは1つだけにしてください。");
    console.log("");
  }

  const branchGameId = gameIdFromBranch(branch);
  if (branchGameId && touchedIds.size === 1) {
    const touched = Array.from(touchedIds)[0];
    if (touched !== branchGameId) {
      console.log("✗ ブランチ名と変更しているゲームが一致していません");
      console.log("  ブランチ: " + branch + " → " + branchGameId);
      console.log("  変更先  : " + touched);
      console.log("");
      console.log("担当ゲームのブランチに切り替えてください: git switch feature/" + touched);
      console.log("");
      return false;
    }
  }

  return violations.length === 0 && touchedIds.size <= 1;
}

function main() {
  const files = changedFiles();
  const branch = branchName();

  if (files.length === 0) {
    console.log("");
    console.log("✓ 範囲チェック OK（変更はありません）");
    console.log("");
    return 0;
  }

  const violations = [];
  const touchedIds = new Set();
  const branchGameId = gameIdFromBranch(branch);

  for (const file of files) {
    const result = classifyPath(file, config);

    if (result.kind === "always-writable") continue;

    if (result.kind === "game") {
      const known = findTeamByGameId(config, result.gameId);
      const isExample = result.gameId === config.exampleGameId;

      if (!known && !isExample) {
        violations.push({ kind: "unknown", path: result.path });
        continue;
      }
      if (branchGameId && result.gameId !== branchGameId) {
        violations.push({ kind: "other-game", path: result.path });
        continue;
      }
      touchedIds.add(result.gameId);
      continue;
    }

    violations.push({ kind: result.kind, path: result.path });
  }

  const ok = report(violations, touchedIds, branch);

  if (ok) {
    const target = touchedIds.size === 1 ? "src/games/" + Array.from(touchedIds)[0] + "/" : "担当範囲";
    console.log("✓ 範囲チェック OK（" + target + " の中だけを変更しています / " + files.length + "件）");
    console.log("");
    return 0;
  }

  if (warnOnly) {
    console.log("※ --warn-only が指定されているため、警告のみで続行します。");
    console.log("");
    return 0;
  }

  return 1;
}

process.exit(main());
