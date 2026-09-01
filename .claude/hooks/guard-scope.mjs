/**
 * 担当範囲の外にファイルを書こうとしたら止める（PreToolUse: Write / Edit）。
 *
 * settings.json の deny ルールでも同じ場所を塞いでいるが、
 * こちらは「なぜダメか」と「次にどうすべきか」を日本語で伝えるのが役目。
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  classifyPath,
  currentBranch,
  findParticipantByGameId,
  gameIdFromBranch,
  loadConfig,
  repoRoot,
  toRepoPath,
} from "../../scripts/lib/harness.mjs";
import { ask, deny, harnessDisabled, pass, readInput } from "./lib/io.mjs";

const REPORT_TEMPLATE = [
  "",
  "共通基盤への変更が必要かもしれません。次の形で人間に報告してください:",
  "",
  "  - やりたいこと:",
  "  - 足りないと思うもの:",
  "  - ゲーム側だけで実現する案（あれば）:",
  "",
  "自分で書き換えたり、コマンド経由で回り込んだりしないでください。",
].join("\n");

const input = await readInput();

if (harnessDisabled()) pass();

const filePath = input.tool_input?.file_path;
if (!filePath) pass();

const root = repoRoot();
const relative = toRepoPath(filePath, root);

// リポジトリの外（一時ファイルなど）は関与しない
if (relative.startsWith("../")) pass();

const config = loadConfig(root);
const result = classifyPath(relative, config);
const branch = currentBranch(root);
const branchGameId = gameIdFromBranch(branch);

/**
 * scaffold が記録した「自分の担当」。
 * gh pr checkout でブランチが相手のものになっている間も、これは変わらない。
 */
function ownedGameId() {
  const file = path.join(root, ".claude", ".state", "owner.json");
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8")).gameId ?? null;
  } catch {
    return null;
  }
}

const myGameId = ownedGameId();

if (result.kind === "always-writable") pass();

if (result.kind === "protected") {
  deny(
    [
      relative + " は運営が管理している場所なので変更できません。",
      "",
      "編集してよいのは src/games/<自分のゲームID>/ の中だけです。",
      REPORT_TEMPLATE,
    ].join("\n"),
  );
}

if (result.kind === "unknown") {
  deny(
    relative +
      " はどのゲームフォルダにも属していません。ファイルは src/games/<自分のゲームID>/ の中に作ってください。",
  );
}

// ここから先はゲームフォルダ
if (!branchGameId) {
  ask(
    [
      "まだ作業ブランチを作っていません（今: " + (branch || "不明") + "）。",
      "",
      "  git switch -c feature/" + result.gameId,
      "",
      "を実行してから編集するのが正しい進め方です。このまま続けますか？",
    ].join("\n"),
  );
}

// レビュー中（相手のブランチを checkout している）に相手のコードを触らせない。
// ブランチ名は相手のものになっているので、記録した担当と突き合わせて判定する。
if (myGameId && result.gameId !== myGameId) {
  const owner = findParticipantByGameId(config, result.gameId);
  deny(
    [
      relative +
        " は " +
        (owner ? owner.displayName + "（" + owner.name + "）" : "他の人") +
        " の担当です。",
      "",
      "あなたの担当は " + myGameId + " です。",
      "いま相手のブランチを取ってきている（レビュー中）だけなので、",
      "相手のコードは変更できません。",
      "",
      "気づいたことは、直すのではなく Pull Request のコメントで伝えてください。",
      "自分の作業に戻るときは git switch feature/" + myGameId + " です。",
    ].join("\n"),
  );
}

if (result.gameId !== branchGameId) {
  const item = findParticipantByGameId(config, result.gameId);
  deny(
    [
      relative +
        " は " +
        (item ? item.displayName + "（" + item.name + "）" : "他の人") +
        " の担当です。",
      "",
      "今のブランチ " + branch + " の担当は " + branchGameId + " です。",
      "他の人のゲームは変更しないでください。",
    ].join("\n"),
  );
}

pass();
