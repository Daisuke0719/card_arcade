/**
 * git の hooksPath を .githooks に向けるだけのスクリプト。
 * package.json の "prepare" から呼ばれるので、参加者は npm ci をするだけで
 * pre-commit フックが有効になる（husky などの追加依存は不要）。
 */
import { execFileSync } from "node:child_process";

try {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "pipe" });
  console.log("[card-arcade] git hooks を .githooks に設定しました。");
} catch {
  // git リポジトリでない場合（CI の一部や tarball 展開時）は黙って抜ける
  console.log("[card-arcade] git hooks の設定をスキップしました（git リポジトリではありません）。");
}
