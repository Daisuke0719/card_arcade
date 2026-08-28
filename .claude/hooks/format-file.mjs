/**
 * 担当フォルダの中だけ prettier をかける（PostToolUse: Write / Edit）。
 *
 * 目的はコードの美しさではなく「差分ノイズを消すこと」。
 * 整形の差分が混ざると、レビューで本質的な指摘までたどり着けなくなる。
 */
import { execFileSync } from "node:child_process";
import { classifyPath, loadConfig, repoRoot, toRepoPath } from "../../scripts/lib/harness.mjs";
import { harnessDisabled, readInput } from "./lib/io.mjs";

const input = await readInput();
if (harnessDisabled()) process.exit(0);

const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

if (!/\.(ts|tsx|css|json|md)$/.test(filePath)) process.exit(0);

const root = repoRoot();
const relative = toRepoPath(filePath, root);
const result = classifyPath(relative, loadConfig(root));

// 担当フォルダの中だけ。保護領域には触らない。
if (result.kind !== "game") process.exit(0);

try {
  execFileSync("npx", ["prettier", "--write", relative], { cwd: root, stdio: "ignore" });
} catch {
  // 整形できなくても作業は続けられるので何もしない
}

process.exit(0);
