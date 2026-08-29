/**
 * ハーネス共通処理。
 * scripts/ と .claude/hooks/ の両方がこれを読むので、
 * 「ローカルでは許されたのに CI で落ちる」が原理的に起きない。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export function repoRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  } catch {
    return process.cwd();
  }
}

/** Windows の \ を / に統一し、リポジトリルートからの相対パスにする。 */
export function toRepoPath(filePath, root = repoRoot()) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  return path.relative(root, absolute).split(path.sep).join("/");
}

export function loadConfig(root = repoRoot()) {
  const raw = readFileSync(path.join(root, "harness", "config.json"), "utf8");
  return JSON.parse(raw);
}

/**
 * "src/core/**" や "package.json" のような書き方をそのまま扱える簡易グロブ。
 *   1個のアスタリスク  … スラッシュを含まない任意の文字
 *   2個のアスタリスク  … スラッシュを含む任意の文字
 *   2個のアスタリスク + スラッシュ … 0階層以上のディレクトリ
 */
const BACKSLASH = String.fromCharCode(92);
const REGEXP_SPECIAL = ".+^${}()|[]";

export function globToRegExp(pattern) {
  let out = "";
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === "*") {
      if (pattern[i + 1] === "*" && pattern[i + 2] === "/") {
        out += "(?:[^/]*/)*";
        i += 3;
        continue;
      }
      if (pattern[i + 1] === "*") {
        out += ".*";
        i += 2;
        continue;
      }
      out += "[^/]*";
      i += 1;
      continue;
    }

    out += REGEXP_SPECIAL.includes(ch) ? BACKSLASH + ch : ch;
    i += 1;
  }

  return new RegExp("^" + out + "$");
}

export function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(filePath));
}

/**
 * ファイルがどこに属するかを判定する。
 * 判定の順番が重要:
 *   1. いつでも書いてよいもの
 *   2. 運営管理（example-game を含む）
 *   3. ゲームフォルダ
 *   4. それ以外（未知の場所）
 */
export function classifyPath(filePath, config) {
  const target = filePath.split(BACKSLASH).join("/");

  if (matchesAny(target, config.alwaysWritable ?? [])) {
    return { kind: "always-writable", path: target };
  }
  if (matchesAny(target, config.protectedPaths ?? [])) {
    return { kind: "protected", path: target };
  }

  const gameMatch = /^src\/games\/([a-z0-9-]+)\//.exec(target);
  if (gameMatch) {
    return { kind: "game", path: target, gameId: gameMatch[1] };
  }

  return { kind: "unknown", path: target };
}

export function currentBranch(root = repoRoot()) {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
      cwd: root,
    }).trim();
  } catch {
    return "";
  }
}

/** feature/babanuki -> babanuki */
export function gameIdFromBranch(branch) {
  const match = /^feature\/([a-z0-9-]+)$/.exec(branch ?? "");
  return match ? match[1] : null;
}

export function findParticipantByGameId(config, gameId) {
  return config.participants.find((item) => item.gameId === gameId) ?? null;
}

export function gameIds(config) {
  return config.participants.map((item) => item.gameId);
}
