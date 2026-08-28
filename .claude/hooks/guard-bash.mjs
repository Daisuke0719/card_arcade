/**
 * コマンド経由の迂回を止める（PreToolUse: Bash / PowerShell）。
 *
 * settings.json の deny はコマンドの先頭を見るので、
 * リダイレクトや sed -i のような「シェル経由で保護領域に書く」形を塞げない。
 * ここはその穴を埋める役目。
 *
 * 悪意ある回避への対策ではなく、うっかりへの対策と割り切っている。
 */
import { currentBranch, gameIdFromBranch, loadConfig, repoRoot } from "../../scripts/lib/harness.mjs";
import { deny, harnessDisabled, pass, readInput } from "./lib/io.mjs";

const input = await readInput();
if (harnessDisabled()) pass();

const command = input.tool_input?.command ?? "";
if (!command.trim()) pass();

const config = loadConfig(repoRoot());

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

// 4. テストの watch モード（セッションが返ってこなくなる）
if (/\bvitest\b(?!\s+run)/.test(command) && !/npm\s+run\s+test:watch/.test(command)) {
  violation(
    "vitest を直接起動すると監視モードになり、実行が終わらなくなります。",
    "テストは npm test（= vitest run）を使ってください。",
  );
}

// 5. シェル経由で保護領域に書き込む形
//    作業ブランチ（feature/*）にいるときだけ見る。
//    運営が main で共通基盤を整備するときに邪魔をしないため
//    （参加者は必ず feature/* で作業するので、実害はない）。
const root2 = repoRoot();
const onFeatureBranch = gameIdFromBranch(currentBranch(root2)) !== null;
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

// 6. 設定ファイル自体の無効化
if (command.includes(".claude/settings.json") || command.includes("CARD_ARCADE_HARNESS=off")) {
  violation(
    "ハーネスの設定を変更・無効化することはできません。",
    "止められた理由に心当たりがない場合は、講師に状況を伝えてください。",
  );
}

pass();
