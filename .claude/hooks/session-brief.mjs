/**
 * セッション開始時に「今どのチームの担当で作業しているか」を伝える（SessionStart）。
 *
 * CLAUDE.md には書けない動的な情報（今のブランチ = 誰の担当か）を毎回渡すのが役目。
 * Driver が交代してもセッションの前提がずれない。
 *
 * 講師モードのときは、参加者向けの案内ではなく講師向けの前提を渡す。
 */
import { currentBranch, findParticipantByGameId, gameIdFromBranch, loadConfig, repoRoot } from "../../scripts/lib/harness.mjs";
import { currentRole } from "../../scripts/lib/role.mjs";
import { readInput } from "./lib/io.mjs";

await readInput();

const root = repoRoot();
const config = loadConfig(root);
const branch = currentBranch(root);
const gameId = gameIdFromBranch(branch);
const item = gameId ? findParticipantByGameId(config, gameId) : null;
const role = currentRole(root);

const lines = ["# 今のセッションの前提", ""];

if (role === "instructor") {
  lines.push(
    "- ロール: **講師モード**",
    "- 今のブランチ: " + (branch || "不明"),
    "- 運営管理のファイル（src/core / tests / docs など）も変更できます。",
    "  変更するたびに確認が出るので、意図した変更かどうかを見てください。",
    "- 参加者モードに戻す: `npm run role -- participant`",
  );
} else if (item) {
  lines.push(
    "- 担当: " + item.displayName + " / " + item.name + "（ゲームID: " + item.gameId + "）",
    "- ブランチ: " + branch,
    "- 編集してよい場所: src/games/" + item.gameId + "/ の中だけ",
    "- 担当 Issue: #" + (item.issue || "未設定"),
    "- 難易度: " + item.difficulty,
  );
} else {
  lines.push(
    "- 今のブランチ: " + (branch || "不明"),
    "- **まだ作業ブランチを作っていません。**",
    "  実装を始める前に `git switch -c feature/<自分のゲームID>` を実行してください。",
    "",
    "  ゲームID: " + config.participants.map((item) => item.gameId).join(" / "),
  );
}

lines.push(
  "",
  "詳しい決まりは CLAUDE.md と src/games/CLAUDE.md にあります。",
  "作業の進め方: /kickoff → 計画を人間が確認 → /implement → /verify → /pr",
);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: lines.join("\n"),
    },
  }),
);
