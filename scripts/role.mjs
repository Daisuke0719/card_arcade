/**
 * この端末のロールを切り替える。
 *
 *   npm run role                  今のロールを表示する
 *   npm run role -- instructor    講師モードにする
 *   npm run role -- participant   参加者モードに戻す
 *
 * 書き込み先は .claude/.state/role.json。gitignore 済みなので、
 * 誰かのロールが Pull Request に混ざることはない。
 *
 * 講師モードでも「運営管理のファイルを変更しますか？」の確認は必ず出る。
 * 止めるのが目的ではなく、意図しない共通基盤の書き換えに気づくための確認。
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./lib/harness.mjs";
import { ROLES, currentRole, isValidRole, roleFile, saveRole } from "./lib/role.mjs";

const root = repoRoot();
const requested = process.argv.slice(2).find((arg) => !arg.startsWith("-"));

function describe(role) {
  return role === "instructor"
    ? "講師モード（運営管理のファイルも、確認のうえ変更できます）"
    : "参加者モード（編集できるのは src/games/<自分のゲームID>/ の中だけ）";
}

function showOwner() {
  const file = path.join(root, ".claude", ".state", "owner.json");
  if (!existsSync(file)) return;
  try {
    const gameId = JSON.parse(readFileSync(file, "utf8")).gameId;
    if (gameId) console.log("  記録されている担当: " + gameId + "  (.claude/.state/owner.json)");
  } catch {
    /* 壊れていても表示だけの話なので無視する */
  }
}

console.log("");

if (!requested) {
  console.log("今のロール: " + currentRole(root));
  console.log("  " + describe(currentRole(root)));
  showOwner();
  if (process.env.CARD_ARCADE_ROLE) {
    console.log("  ※ 環境変数 CARD_ARCADE_ROLE が設定されているため、そちらが優先されます。");
  }
  console.log("");
  console.log("切り替える:");
  console.log("  npm run role -- instructor    講師モードにする");
  console.log("  npm run role -- participant   参加者モードに戻す");
  console.log("");
  process.exit(0);
}

if (!isValidRole(requested)) {
  console.log("✗ 「" + requested + "」は知らないロールです。");
  console.log("  指定できるのは " + ROLES.join(" / ") + " です。");
  console.log("");
  process.exit(1);
}

saveRole(requested, root);

console.log("ロールを " + requested + " にしました。");
console.log("  " + describe(requested));
console.log("  記録先: " + path.relative(root, roleFile(root)).split(path.sep).join("/"));

if (requested === "instructor") {
  showOwner();
  console.log("");
  console.log("参加者モードに戻すには: npm run role -- participant");
}

console.log("");
console.log("Claude Code のセッションを開き直すと、ステータスラインに反映されます。");
console.log("");
