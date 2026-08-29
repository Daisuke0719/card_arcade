/**
 * GitHub 側の初期設定（講師用）。
 *
 *   node scripts/setup-github.mjs labels        ラベル15種を作る
 *   node scripts/setup-github.mjs milestone     マイルストーンを作る
 *   node scripts/setup-github.mjs issues        Issue 9件を作り、番号を config.json へ書き戻す
 *   node scripts/setup-github.mjs collaborators [ユーザー名...]  招待と未承諾の確認
 *   node scripts/setup-github.mjs protect       マージ方式とブランチ保護を適用する
 *   node scripts/setup-github.mjs unprotect     ブランチ保護を外す（緊急用。研修後に必ず戻す）
 *   node scripts/setup-github.mjs all           labels → milestone → issues をまとめて
 *
 * --dry-run を付けると、実行内容を表示するだけで何も変更しません。
 *
 * PowerShell ではなく Node で書いている理由:
 *   1. 企業端末の ExecutionPolicy に引っかからない
 *   2. PowerShell 5.1 は BOM なし UTF-8 のスクリプトを ANSI として読むため、
 *      日本語を含むスクリプトがパースエラーになる（実際に起きた）
 *   3. Node は前提条件として必ず入っている
 *   4. Mac の参加者がいても同じものが動く
 *
 * 【重要】実行する順番
 *   1. collaborators … 参加者を招待し、全員に承諾させる（当日 403 の最大要因）
 *   2. labels → milestone → issues
 *   3. **テスト用の Pull Request を1本流して、CI のチェック名 "verify" を確定させる**
 *   4. protect … ブランチ保護を適用
 *   5. GitHub Pages を有効化（Settings > Pages > Source: GitHub Actions）
 *
 *   3 を飛ばすと、必須チェックの名前が GitHub 側に登録されておらず、
 *   すべての Pull Request が永久に pending のままになります。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadConfig, repoRoot } from "./lib/harness.mjs";

const root = repoRoot();
const config = loadConfig(root);
const repo = config.repo;

const args = process.argv.slice(2);
const command = args[0] ?? "help";
const dryRun = args.includes("--dry-run");

function gh(params, options = {}) {
  if (dryRun) {
    console.log("  [dry-run] gh " + params.join(" "));
    return "";
  }
  return execFileSync("gh", params, {
    cwd: root,
    encoding: "utf8",
    stdio: options.quiet ? "pipe" : ["pipe", "pipe", "pipe"],
  });
}

function tryGh(params) {
  try {
    return { ok: true, output: gh(params, { quiet: true }) };
  } catch (error) {
    return { ok: false, output: String(error.stderr ?? error.message ?? error) };
  }
}

const LABELS = [
  { name: "game", color: "1d76db", description: "参加者が担当するゲームの実装" },
  { name: "participant-1", color: "5319e7", description: "担当1 / ババ抜き" },
  { name: "participant-2", color: "5319e7", description: "担当2 / 大富豪" },
  { name: "participant-3", color: "5319e7", description: "担当3 / 神経衰弱" },
  { name: "participant-4", color: "5319e7", description: "担当4 / ポーカー" },
  { name: "participant-5", color: "5319e7", description: "担当5 / ぶたのしっぽ" },
  { name: "participant-6", color: "5319e7", description: "担当6 / スピード" },
  { name: "participant-7", color: "5319e7", description: "担当7 / 七並べ" },
  { name: "participant-8", color: "5319e7", description: "担当8 / ダウト" },
  { name: "participant-9", color: "5319e7", description: "担当9 / ページワン" },
  { name: "difficulty:easy", color: "0e8a16", description: "初級" },
  { name: "difficulty:normal", color: "0075ca", description: "中級" },
  { name: "difficulty:hard", color: "d93f0b", description: "上級" },
  { name: "stretch-goal", color: "fbca04", description: "発展課題（必須ではない）" },
  { name: "blocked", color: "b60205", description: "詰まっている・講師の判断待ち" },
  { name: "bug", color: "d73a4a", description: "大会で見つかった不具合" },
  { name: "core-change", color: "e99695", description: "共通基盤の変更を含む（講師レビュー必須）" },
  { name: "harness:override", color: "c5def5", description: "講師のみ: 範囲チェックを警告に降格する" },
];

const MILESTONE_TITLE = "CARD ARCADE v1";

function setupLabels() {
  console.log("");
  console.log("ラベルを作成します: " + repo);
  console.log("");

  for (const label of LABELS) {
    const result = tryGh([
      "label",
      "create",
      label.name,
      "--repo",
      repo,
      "--color",
      label.color,
      "--description",
      label.description,
      "--force",
    ]);
    console.log((result.ok ? "  作成 " : "  失敗 ") + label.name);
    if (!result.ok) console.log("        " + result.output.split("\n")[0]);
  }
  console.log("");
}

function setupMilestone() {
  console.log("");
  console.log("マイルストーンを作成します: " + MILESTONE_TITLE);

  const existing = tryGh([
    "api",
    "repos/" + repo + "/milestones",
    "--jq",
    '.[] | select(.title=="' + MILESTONE_TITLE + '") | .number',
  ]);

  if (existing.ok && existing.output.trim()) {
    console.log("  既にあります（#" + existing.output.trim() + "）。何もしません。");
    console.log("");
    return;
  }

  const result = tryGh([
    "api",
    "repos/" + repo + "/milestones",
    "-f",
    "title=" + MILESTONE_TITLE,
    "-f",
    "description=研修当日に9ゲームすべてを公開する",
  ]);
  console.log(result.ok ? "  作成しました。" : "  失敗: " + result.output.split("\n")[0]);
  console.log("");
}

function setupIssues() {
  console.log("");
  console.log("Issue を作成します: " + repo);
  console.log("");

  const created = new Map();

  for (const item of config.participants) {
    // 既に作ってある Issue は作り直さない（番号が変わると全部の参照がずれる）
    if (item.issue > 0) {
      console.log("  済み #" + item.issue + "  " + item.name + "（" + item.gameId + "）");
      continue;
    }

    const bodyFile = path.join(".github", "issue-bodies", item.participant + "-" + item.gameId + ".md");
    if (!existsSync(path.join(root, bodyFile))) {
      console.log("  スキップ " + item.displayName + " : " + bodyFile + " がありません");
      console.log("           先に node scripts/build-issue-bodies.mjs を実行してください");
      continue;
    }

    const title = item.name + "（" + item.gameId + "）を実装する";
    const labels = ["game", item.participant, "difficulty:" + item.difficulty].join(",");

    const result = tryGh([
      "issue",
      "create",
      "--repo",
      repo,
      "--title",
      title,
      "--body-file",
      bodyFile,
      "--label",
      labels,
      "--milestone",
      MILESTONE_TITLE,
    ]);

    if (result.ok) {
      const number = Number(result.output.trim().split("/").pop());
      created.set(item.gameId, number);
      console.log("  作成 #" + number + "  " + title);
    } else {
      console.log("  失敗 " + title);
      console.log("       " + result.output.split("\n").slice(0, 2).join(" / "));
    }
  }

  if (dryRun || created.size === 0) {
    console.log("");
    return;
  }

  // Issue 番号を単一の真実源へ書き戻す
  const configPath = path.join(root, "harness", "config.json");
  const raw = JSON.parse(readFileSync(configPath, "utf8"));
  for (const item of raw.participants) {
    if (created.has(item.gameId)) item.issue = created.get(item.gameId);
  }
  // 既存の番号はそのまま残る（上書きしない）
  writeFileSync(configPath, JSON.stringify(raw, null, 2) + "\n", "utf8");

  console.log("");
  console.log("harness/config.json に Issue 番号を書き戻しました。");
  console.log("次を実行して、雛形とタイルに Issue 番号を反映してください:");
  console.log("");
  console.log("  node scripts/build-issue-bodies.mjs");
  console.log("  npm run scaffold -- --all --force");
  console.log("  npm run verify");
  console.log("");
}

function setupCollaborators() {
  const users = args.slice(1).filter((value) => !value.startsWith("--"));

  console.log("");
  console.log("リポジトリ: " + repo);
  console.log("");

  for (const user of users) {
    const result = tryGh([
      "api",
      "-X",
      "PUT",
      "repos/" + repo + "/collaborators/" + user,
      "-f",
      "permission=push",
    ]);
    console.log((result.ok ? "  招待 " : "  失敗 ") + user);
  }

  console.log("");
  console.log("現在の共同作業者:");
  const collaborators = tryGh([
    "api",
    "repos/" + repo + "/collaborators",
    "--jq",
    '.[] | "  - " + .login',
  ]);
  console.log(collaborators.output.trimEnd() || "  （取得できませんでした）");

  console.log("");
  console.log("未承諾の招待:");
  const invitations = tryGh([
    "api",
    "repos/" + repo + "/invitations",
    "--jq",
    '.[] | "  - " + .invitee.login',
  ]);

  if (!invitations.output.trim()) {
    console.log("  なし（全員が承諾済みです）");
  } else {
    console.log(invitations.output.trimEnd());
    console.log("");
    console.log("  上の人には、GitHub から届いた招待メールを承諾してもらってください。");
    console.log("  承諾していないと、当日 push した瞬間に 403 になります。");
  }
  console.log("");
}

function protectBranch() {
  console.log("");
  console.log("マージ方式を Squash のみにします");
  const edit = tryGh([
    "repo",
    "edit",
    repo,
    "--enable-squash-merge",
    "--enable-merge-commit=false",
    "--enable-rebase-merge=false",
    "--delete-branch-on-merge",
  ]);
  console.log(edit.ok ? "  設定しました。" : "  失敗: " + edit.output.split("\n")[0]);

  console.log("");
  console.log("main の保護を適用します");
  const result = tryGh([
    "api",
    "-X",
    "PUT",
    "repos/" + repo + "/branches/main/protection",
    "--input",
    ".github/branch-protection.json",
  ]);

  if (!result.ok) {
    console.log("  失敗: " + result.output.split("\n").slice(0, 3).join(" / "));
    console.log("");
    return;
  }

  const contexts = tryGh([
    "api",
    "repos/" + repo + "/branches/main/protection",
    "--jq",
    ".required_status_checks.contexts",
  ]);

  console.log("");
  console.log("適用後の必須チェック: " + contexts.output.trim());
  console.log("");
  console.log('上に ["verify"] と出ていれば成功です。');
  console.log("空だった場合は、テスト用の Pull Request を1本流してから、もう一度実行してください。");
  console.log("");
  console.log("研修中に詰まったときの逃げ道（優先度順）:");
  console.log("  1. gh pr merge <番号> --squash --admin --delete-branch");
  console.log('  2. gh pr review <番号> --approve --body "講師承認"');
  console.log("  3. node scripts/setup-github.mjs unprotect（最終手段。研修後に必ず戻す）");
  console.log("");
}

function unprotectBranch() {
  console.log("");
  console.log("main の保護を解除します: " + repo);
  const result = tryGh(["api", "-X", "DELETE", "repos/" + repo + "/branches/main/protection"]);
  console.log(result.ok ? "  解除しました。" : "  失敗: " + result.output.split("\n")[0]);
  console.log("");
  console.log("研修が終わったら必ず戻してください:");
  console.log("  node scripts/setup-github.mjs protect");
  console.log("");
}

function help() {
  console.log("");
  console.log("使い方: node scripts/setup-github.mjs <コマンド> [--dry-run]");
  console.log("");
  console.log("  labels         ラベル15種を作る");
  console.log("  milestone      マイルストーンを作る");
  console.log("  issues         Issue 6件を作り、番号を harness/config.json へ書き戻す");
  console.log("  collaborators  [ユーザー名...] 招待と未承諾の確認");
  console.log("  protect        マージ方式とブランチ保護を適用する");
  console.log("  unprotect      ブランチ保護を外す（緊急用）");
  console.log("  all            labels → milestone → issues");
  console.log("");
}

switch (command) {
  case "labels":
    setupLabels();
    break;
  case "milestone":
    setupMilestone();
    break;
  case "issues":
    setupIssues();
    break;
  case "collaborators":
    setupCollaborators();
    break;
  case "protect":
    protectBranch();
    break;
  case "unprotect":
    unprotectBranch();
    break;
  case "all":
    setupLabels();
    setupMilestone();
    setupIssues();
    break;
  default:
    help();
}
