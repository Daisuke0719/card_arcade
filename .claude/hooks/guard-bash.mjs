/**
 * コマンド経由の迂回を止める（PreToolUse: Bash / PowerShell）。
 *
 * settings.json の deny はコマンドの先頭を見るので、
 * リダイレクトや sed -i のような「シェル経由で保護領域に書く」形を塞げない。
 * ここはその穴を埋める役目。
 *
 * 悪意ある回避への対策ではなく、うっかりへの対策と割り切っている。
 */
import { currentBranch, gameIdFromBranch, repoRoot } from "../../scripts/lib/harness.mjs";
import { deny, harnessDisabled, pass, readInput } from "./lib/io.mjs";

const input = await readInput();
if (harnessDisabled()) pass();

const command = input.tool_input?.command ?? "";
if (!command.trim()) pass();

/** 保護領域のうち、コマンド文字列から見つけやすい代表的な入口。 */
const PROTECTED_PREFIXES = [
  "src/core",
  "src/components",
  "src/app",
  "src/pages",
  "src/styles",
  "src/test/",
  "src/games/example-game",
  "src/games/CLAUDE.md",
  "tests/",
  "scripts/",
  "templates/",
  "harness/",
  "docs/",
  ".github/",
  ".claude/",
  ".githooks/",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "eslint.config.js",
  "CLAUDE.md",
];

const WRITE_TOKENS = [">", ">>", "tee ", "sed -i", "cp ", "mv ", "rm ", "Set-Content", "Out-File", "Add-Content"];

/** 復旧のために使う正当なコマンドは通す。 */
const RECOVERY_PATTERNS = [
  /^\s*git\s+(restore|checkout|stash|reset|revert|diff|status|log|show)\b/,
  /^\s*git\s+add\b/,
];

function violation(reason, hint) {
  deny([reason, "", hint].join("\n"));
}

// 1. 依存の追加・削除（lockfile が変わると6チーム全員の PR が競合する）
if (/\b(npm|yarn|pnpm|bun)\s+(install|i|add|uninstall|remove|up|update)\b/.test(command)) {
  if (!/\bnpm\s+(ci|install)\s*$/.test(command.trim())) {
    violation(
      "依存パッケージの追加・更新はできません: " + command,
      [
        "必要な機能は @core と @ui にすべて揃っています（src/games/CLAUDE.md の早見表を見てください）。",
        "どうしても必要な場合は、自分で入れずに講師に相談してください。",
        "（依存を入れると package-lock.json が変わり、6チーム全員の Pull Request が競合します）",
      ].join("\n"),
    );
  }
}

// 2. 検証の飛ばし
if (/--no-verify\b/.test(command)) {
  violation(
    "--no-verify でコミット前のチェックを飛ばすことはできません。",
    "落ちた理由を直してからコミットしてください。原因が分からないときは docs/troubleshooting.md を見てください。",
  );
}

// 3. 強制 push と main への直接 push
if (/git\s+push\b.*(--force|-f)\b/.test(command)) {
  violation("強制 push はできません。", "履歴を書き換えると他のチームの作業が壊れます。講師に相談してください。");
}
if (/git\s+push\b.*\bmain\b/.test(command)) {
  violation(
    "main ブランチへ直接 push することはできません。",
    "作業ブランチを push して Pull Request を作ってください: git push -u origin feature/<ゲームID>",
  );
}

// 4. 起動したままになるもの（セッションが返ってこなくなる）
//
//    以前は vitest という語だけを見ていたが、
//    "npm run test:watch" にはその語が含まれないので素通りしていた。
const DEV_SERVER =
  /\b(npm\s+run\s+(dev|preview)\b|npx\s+vite(?!st)\b|^\s*vite\b(?!\s+build))/;
const WATCH_MODE =
  /(\bnpm\s+run\s+test:watch\b|\bvitest\b(?!\s+run\b)|\bnpm\s+(run\s+)?test\b[^|;&]*--watch\b)/;

if (DEV_SERVER.test(command)) {
  violation(
    "npm run dev は Claude Code からは実行できません。" +
      "\n起動したままになるので、このセッションが返ってこなくなります。",
    [
      "開発サーバーは「あなたが、別のターミナルで」動かします。研修中はつけっぱなしです。",
      "",
      "  1. PowerShell をもう1つ開く（これを「ターミナルB」と呼びます）",
      "  2. cd してリポジトリのフォルダへ移動する",
      "  3. npm run dev",
      "  4. ブラウザで http://localhost:5173/ を開く",
      "",
      "すでにターミナルB で動いていれば、ブラウザを再読み込みするだけで最新のコードが反映されます。",
      "画面を見て「遊べるかどうか」を判断するのは人間の仕事です。Claude Code は代わりに遊べません。",
    ].join("\n"),
  );
}

if (WATCH_MODE.test(command)) {
  violation(
    "テストの監視モード（watch）は Claude Code からは実行できません。" +
      "\n終わらないので、このセッションが返ってこなくなります。",
    [
      "テストは1回で終わる形を使ってください。",
      "",
      "  npm test        （= vitest run。ふだんはこれ）",
      "  npm run verify  （提出前の全部入り。CI とまったく同じ内容）",
      "",
      "保存のたびに流したいときは、ターミナルB で自分で起動してください。",
    ].join("\n"),
  );
}

// 作業ブランチ（feature/*）にいるかどうか。
// 運営が main で共通基盤を整えるときに邪魔をしないため、
// 講師も使うコマンドは作業ブランチのときだけ止める。
const root2 = repoRoot();
const onFeatureBranch = gameIdFromBranch(currentBranch(root2)) !== null;

// 6. Pull Request / Issue への投稿
//    レビューに書いてよいのは「自分が実機で確認したこと」だけ、という約束なので、
//    確認したかどうかを知っている人間が投稿する。
if (/\bgh\s+(pr\s+(review|comment)|issue\s+comment)\b/.test(command)) {
  violation(
    "Pull Request や Issue への投稿は、Claude Code からは行いません。",
    [
      "レビューに書いてよいのは「自分が実機で確認したこと」だけ、という約束です。",
      "確認したかどうかを知っているのは人間だけなので、投稿も人間が行います。",
      "",
      "  コメント / Approve : GitHub の画面（Files changed → Review changes）",
      "  コマンドで出す場合 : ターミナルB で自分の手で打つ",
      "",
      "Claude Code にできるのは下書きを出すところまでです（/review と /fix-review）。",
    ].join("\n"),
  );
}

// 7. 講師専用のコマンド（9人分をまとめて壊せる）
//    運営は main で作業するので、作業ブランチにいるときだけ止める。
if (onFeatureBranch) {
  const INSTRUCTOR_ONLY =
    /(node\s+scripts\/(setup-github|build-issue-bodies)\.mjs|npm\s+run\s+scaffold\b[^|;&]*--(all|force)\b)/;
  if (INSTRUCTOR_ONLY.test(command)) {
    violation(
      "このコマンドは講師用です。参加者の端末では実行しません。",
      [
        "9人分の Issue や雛形をまとめて作り直してしまい、全員の作業に影響します。",
        "",
        "自分の雛形を作るときは、ゲームIDを1つだけ指定してください。",
        "",
        "  npm run scaffold -- --game <自分のゲームID>",
      ].join("\n"),
    );
  }

  // 8. gh api（上の判定をすべて迂回できる裏口）
  if (/\bgh\s+api\b/.test(command)) {
    violation(
      "gh api は使いません。",
      [
        "ここで止めている操作（PR のマージ・コメント投稿・Issue の書き換え）を",
        "すべて回り込めてしまうためです。",
        "",
        "回り込む方法ではなく「やりたいこと」を言葉で言ってください。",
        "必要なら手を止めて講師に相談してください。",
      ].join("\n"),
    );
  }

  // 9. 他人の Issue 本文の書き換え
  if (/\bgh\s+issue\s+edit\b/.test(command)) {
    violation(
      "Issue 本文の書き換えは講師が行います。",
      [
        "Issue の必須要件は全員が同じ条件で進むための基準なので、参加者は変更しません。",
        "",
        "進捗のチェックボックスは GitHub の Issue 画面で自分でクリックしてください。",
        "これが今日の唯一の進捗指標です。",
      ].join("\n"),
    );
  }
}

// 5. シェル経由で保護領域に書き込む形
//    作業ブランチ（feature/*）にいるときだけ見る。
//    運営が main で共通基盤を整備するときに邪魔をしないため
//    （参加者は必ず feature/* で作業するので、実害はない）。
const isRecovery = RECOVERY_PATTERNS.some((pattern) => pattern.test(command));
if (onFeatureBranch && !isRecovery) {
  const writesSomething = WRITE_TOKENS.some((token) => command.includes(token));
  if (writesSomething) {
    const target = PROTECTED_PREFIXES.find((prefix) => command.includes(prefix));
    if (target) {
      violation(
        target + " は運営が管理している場所です。コマンド経由でも変更できません。",
        [
          "編集してよいのは src/games/<自分のゲームID>/ の中だけです。",
          "共通基盤に手を入れたくなったら、回り込む方法を探さずに講師へ相談してください。",
        ].join("\n"),
      );
    }
  }
}

// 設定ファイル自体の書き換えは 5 の判定（.claude/ が保護パスに入っている）で止まる。
//
// 環境変数 CARD_ARCADE_HARNESS=off はここでは止めない。
// これは講師が緊急時に使う逃げ道として設計書に載せているもので、
// 塞ぐと運営が共通基盤を直せなくなる。
// 参加者が使うものではないことは docs/harness.md と instructor-guide.md に明記している。

pass();
