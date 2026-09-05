/**
 * ステータスライン。
 * 「今どのチームとして、どのブランチで作業しているか」を常に出しておく。
 * Driver が交代したときの取り違えを目で防ぐのが目的。
 *
 * 講師モードのときは先頭に [講師] を出す。
 * 「講師モードのまま参加者の説明をしていた」に気づけるようにするため。
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { currentBranch, findParticipantByGameId, gameIdFromBranch, loadConfig, repoRoot } from "../scripts/lib/harness.mjs";
import { isInstructor } from "../scripts/lib/role.mjs";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let input = {};
try {
  input = JSON.parse(raw || "{}");
} catch {
  input = {};
}

const root = repoRoot();
const parts = [];

try {
  if (isInstructor(root)) parts.push("[講師]");

  const config = loadConfig(root);
  const branch = currentBranch(root);
  const gameId = gameIdFromBranch(branch);
  const item = gameId ? findParticipantByGameId(config, gameId) : null;

  parts.push(item ? item.displayName + " " + item.name : "担当未設定");
  parts.push(branch || "?");

  const status = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
  const changed = status.split("\n").filter((line) => line.trim()).length;

  if (changed === 0) {
    parts.push("変更なし");
  } else {
    const diff = execFileSync("git", ["diff", "HEAD"], { cwd: root, encoding: "utf8" });
    const hash = createHash("sha256").update(status + diff).digest("hex");
    const verifiedPath = path.join(root, ".claude", ".state", "verified.json");
    const verified = existsSync(verifiedPath)
      ? JSON.parse(readFileSync(verifiedPath, "utf8"))
      : { hash: "" };

    parts.push(verified.hash === hash ? "検証済み(" + changed + "件)" : "未検証(" + changed + "件)");
  }
} catch {
  parts.push("CARD ARCADE");
}

const model = input.model?.display_name;
if (model) parts.push(model);

process.stdout.write(parts.join(" ⋅ "));
