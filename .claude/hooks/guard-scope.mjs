/**
 * 担当範囲の外にファイルを書こうとしたら止める（PreToolUse: Write / Edit）。
 *
 * 保護領域の判定はここが一手に引き受ける。
 * settings.json の permissions.deny では、講師と参加者で振る舞いを変えられない
 * （deny は全設定ファイルの和集合で、上位のファイルからも打ち消せない）ため、
 * 「なぜダメか」「次にどうすべきか」を日本語で伝える役目と合わせてフックに寄せている。
 *
 * 保護されている場所の正本は harness/config.json の protectedPaths。
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
import { currentRole } from "../../scripts/lib/role.mjs";
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
const role = currentRole(root);

if (result.kind === "always-writable") pass();

/**
 * 講師モードは「止める」ではなく「1回聞く」。
 *
 * 共通基盤を直すのは講師の仕事なので、deny だと作業そのものができない。
 * かといって素通しにすると、講師モードのままなのを忘れたときに
 * 気づかず共通基盤を書き換えてしまう。だから確認だけは必ず出す。
 *
 * ロールの既定は participant なので、参加者の端末は今までと同じ厳しさのまま。
 */
if (role === "instructor") {
  if (result.kind === "protected") {
    ask(
      [
        relative + " は運営が管理している場所です。",
        "",
        "講師モードなので変更できます。意図した変更かどうかを確認してください。",
        "参加者モードに戻すには: npm run role -- participant",
      ].join("\n"),
    );
  }
  pass();
}

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
