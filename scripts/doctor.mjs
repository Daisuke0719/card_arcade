/**
 * 環境の健康診断。事前課題の最後にこれを実行してもらう。
 *
 *   npm run doctor
 *
 * 当日の朝に「動かない」で時間を溶かさないための道具。
 * 落ちた項目には必ず「次に何をすればよいか」を出す。
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadConfig, repoRoot } from "./lib/harness.mjs";

const root = repoRoot();
const results = [];

function check(name, fn, hint) {
  try {
    const detail = fn();
    results.push({ ok: true, name, detail });
  } catch (error) {
    results.push({ ok: false, name, detail: String(error.message ?? error).split("\n")[0], hint });
  }
}

function run(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: "pipe" }).trim();
}

check(
  "Node.js のバージョン",
  () => {
    const major = Number(process.versions.node.split(".")[0]);
    if (major < 22) throw new Error("Node " + process.versions.node + " は古すぎます");
    return "v" + process.versions.node;
  },
  "Node.js 22 以上を入れてください（.nvmrc に 22.15.0 を書いています）",
);

check(
  "git が使えるか",
  () => run("git", ["--version"]),
  "git をインストールしてください",
);

check(
  "リポジトリの中にいるか",
  () => {
    const top = run("git", ["rev-parse", "--show-toplevel"]);
    return top;
  },
  "card_arcade を clone したフォルダで実行してください",
);

check(
  "依存がインストールされているか",
  () => {
    if (!existsSync(path.join(root, "node_modules"))) throw new Error("node_modules がありません");
    return "node_modules あり";
  },
  "npm ci を実行してください（npm install ではありません）",
);

check(
  "コミット前チェックが有効か",
  () => {
    const value = run("git", ["config", "core.hooksPath"]);
    if (value !== ".githooks") throw new Error("core.hooksPath が " + (value || "未設定") + " です");
    return ".githooks";
  },
  "npm ci を実行し直してください（prepare スクリプトが自動で設定します）",
);

check(
  "改行コードの設定が効いているか",
  () => {
    const status = run("git", ["status", "--porcelain"]);
    const dirty = status.split("\n").filter((line) => line.trim()).length;
    if (dirty > 0) return dirty + "件の変更あり（作業中なら問題ありません）";
    return "変更なし";
  },
  "clone 直後なのに大量の変更が出る場合は .gitattributes が効いていません。講師に連絡してください",
);

check(
  "gh コマンドが使えるか",
  () => run("gh", ["--version"]).split("\n")[0],
  "GitHub CLI を入れてください: https://cli.github.com/",
);

check(
  "GitHub にログインしているか",
  () => {
    const output = execFileSync("gh", ["auth", "status"], { encoding: "utf8", stdio: "pipe" });
    if (!/Logged in/.test(output)) throw new Error("ログインしていません");
    const scopes = /Token scopes: (.+)/.exec(output);
    if (scopes && !scopes[1].includes("repo")) {
      throw new Error("トークンに repo 権限がありません（" + scopes[1] + "）");
    }
    return "ログイン済み";
  },
  "gh auth login を実行してください（scope に repo が必要です）",
);

check(
  "リポジトリにアクセスできるか",
  () => {
    const config = loadConfig(root);
    execFileSync("gh", ["repo", "view", config.repo, "--json", "name"], { stdio: "pipe" });
    return config.repo;
  },
  "招待メールを承諾しているか確認してください（未承諾だと 403 になります）",
);

console.log("");
console.log("CARD ARCADE 環境チェック");
console.log("");

let failed = 0;
for (const item of results) {
  if (item.ok) {
    console.log("  ✓ " + item.name.padEnd(28) + " " + item.detail);
  } else {
    failed += 1;
    console.log("  ✗ " + item.name.padEnd(28) + " " + item.detail);
    console.log("      → " + item.hint);
  }
}

console.log("");
if (failed === 0) {
  console.log("すべて問題ありません。npm run dev で画面が出れば準備完了です。");
  console.log("");
  process.exit(0);
}

console.log(failed + "件の問題があります。上の → に従って直してください。");
console.log("直らない場合は、この出力をそのまま講師に見せてください。");
console.log("");
process.exit(1);
