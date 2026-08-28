/**
 * npm run verify の最後に「この内容で検証が通った」を記録する。
 * Stop フックがこれを見て、未検証のまま作業を終えようとしていないか確かめる。
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./lib/harness.mjs";

const root = repoRoot();

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
mkdirSync(stateDir, { recursive: true });
writeFileSync(
  path.join(stateDir, "verified.json"),
  JSON.stringify({ hash: workingTreeHash(), at: new Date().toISOString() }, null, 2),
  "utf8",
);

console.log("");
console.log("✓ npm run verify がすべて通りました。");
console.log("  この内容なら Pull Request を出せます。");
console.log("");
