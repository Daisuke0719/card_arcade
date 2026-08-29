/**
 * 担当範囲の外にファイルを書こうとしたら止める（PreToolUse: Write / Edit）。
 *
 * settings.json の deny ルールでも同じ場所を塞いでいるが、
 * こちらは「なぜダメか」と「次にどうすべきか」を日本語で伝えるのが役目。
 */
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
