/**
 * 検証していないまま作業を終えようとしたら、1回だけ引き止める（Stop）。
 *
 * 研修でいちばん多い失敗は「動いたつもりで Pull Request を出したら CI が赤」。
 * ここで一度だけ声をかけて、npm run verify を挟ませる。
 *
 * 2回目は必ず通す（作業が詰まらないようにする）。
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { currentBranch, gameIdFromBranch, repoRoot } from "../../scripts/lib/harness.mjs";
import { harnessDisabled, readInput } from "./lib/io.mjs";

const input = await readInput();
if (harnessDisabled()) process.exit(0);

const root = repoRoot();
const branch = currentBranch(root);

// 作業ブランチにいるときだけ気にする（運営が main で整備しているときは黙る）
if (!gameIdFromBranch(branch)) process.exit(0);

function workingTreeHash() {
  try {
    const status = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
    const diff = execFileSync("git", ["diff", "HEAD"], { cwd: root, encoding: "utf8" });
    return createHash("sha256").update(status + diff).digest("hex");
  } catch {
    return "";
  }
}

const stateDir = path.join(root, ".claude", ".state");
const verifiedPath = path.join(stateDir, "verified.json");
const noticePath = path.join(stateDir, "stop-notice.json");

const current = workingTreeHash();

// 変更が無いなら何も言わない
try {
  const status = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
  if (!status.trim()) process.exit(0);
} catch {
  process.exit(0);
}

const verified = existsSync(verifiedPath)
  ? JSON.parse(readFileSync(verifiedPath, "utf8"))
  : { hash: "" };

if (verified.hash === current) process.exit(0);

// 同じセッションで既に一度言っていたら、もう言わない
const sessionId = input.session_id ?? "unknown";
const notice = existsSync(noticePath) ? JSON.parse(readFileSync(noticePath, "utf8")) : {};

if (notice.sessionId === sessionId && notice.hash === current) process.exit(0);

mkdirSync(stateDir, { recursive: true });
writeFileSync(noticePath, JSON.stringify({ sessionId, hash: current }, null, 2), "utf8");

process.stderr.write(
  [
    "まだ npm run verify を通していない変更があります。",
    "",
    "  npm run verify",
    "",
    "を実行して、範囲チェック・lint・型・テスト・ビルドがすべて緑になることを確かめてください。",
    "（これが通って初めて「できた」と言えます。次に止まったときはこの確認をしません）",
  ].join("\n"),
);
process.exit(2);
