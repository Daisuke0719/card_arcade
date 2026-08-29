/**
 * ゲームフォルダの雛形を作る。
 *
 *   npm run scaffold -- --game babanuki    1つ作る（参加者はこれを使う）
 *   npm run scaffold -- --all              6チーム分まとめて作る（運営用）
 *   npm run scaffold -- --game babanuki --dry-run   何が作られるか見るだけ
 *   npm run scaffold -- --game babanuki --force     まだ手を入れていないファイルだけ作り直す
 *
 * 同じスクリプトが「参加者が構造を間違えられなくする道具」と
 * 「運営が6チーム分を用意する道具」を兼ねている。
 * これにより、お手本・スケルトン・契約テストの前提が絶対にズレない。
 *
 * 対話モードは用意していない（Claude Code から実行したときに
 * 入力待ちでセッションが止まるのを避けるため）。引数なしで実行すると一覧が出る。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadConfig, repoRoot } from "./lib/harness.mjs";

const MARKER = "@scaffold:untouched";
const RESERVED = ["core", "components", "app", "pages"];

const root = repoRoot();
const config = loadConfig(root);
const args = process.argv.slice(2);

const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

function argValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function templateFor(item) {
  return {
    GAME_ID: item.gameId,
    GAME_NAME: item.name,
    COMPONENT: item.component,
    STATE: item.stateType,
    ACTION: item.actionType,
    OWNER: item.participant,
    OWNER_LABEL: item.displayName,
    DIFFICULTY: item.difficulty,
    DESCRIPTION: item.description,
    ICON: item.icon,
    ISSUE: String(item.issue ?? 0),
    MIN_PLAYERS: String(item.minPlayers),
    MAX_PLAYERS: String(item.maxPlayers),
  };
}

function render(content, values) {
  let output = content;
  for (const [key, value] of Object.entries(values)) {
    output = output.split("{{" + key + "}}").join(value);
  }
  return output;
}

function targetName(templateName, item) {
  if (templateName === "Game.tsx.tmpl") return item.component + ".tsx";
  return templateName.replace(".tmpl", "");
}

function scaffoldOne(item) {
  const templateDir = path.join(root, "templates", "game");
  const outDir = path.join(root, "src", "games", item.gameId);
  const values = templateFor(item);

  const created = [];
  const skipped = [];

  if (!dryRun) mkdirSync(outDir, { recursive: true });

  for (const templateName of readdirSync(templateDir)) {
    const outName = targetName(templateName, item);
    const outPath = path.join(outDir, outName);
    const relative = path.join("src", "games", item.gameId, outName).split(path.sep).join("/");

    if (existsSync(outPath)) {
      const existing = readFileSync(outPath, "utf8");
      const untouched = existing.includes(MARKER);

      if (!force || !untouched) {
        skipped.push({
          path: relative,
          reason: untouched ? "既にあります（--force で作り直せます）" : "編集済みなので触りません",
        });
        continue;
      }
    }

    const content = render(readFileSync(path.join(templateDir, templateName), "utf8"), values);
    if (!dryRun) writeFileSync(outPath, content, "utf8");
    created.push(relative);
  }

  return { created, skipped };
}

function printUsage() {
  console.log("");
  console.log("使い方:");
  console.log("  npm run scaffold -- --game <ゲームID>");
  console.log("  npm run scaffold -- --all            （運営用: 6チーム分まとめて）");
  console.log("");
  console.log("指定できるゲームID:");
  for (const item of config.participants) {
    console.log("  " + item.gameId.padEnd(16) + item.displayName + " / " + item.name);
  }
  console.log("");
}

function main() {
  const gameId = argValue("--game");
  const all = args.includes("--all");

  if (!gameId && !all) {
    printUsage();
    return 0;
  }

  const targets = all
    ? config.participants
    : config.participants.filter((item) => item.gameId === gameId);

  if (targets.length === 0) {
    console.log("");
    console.log("✗ 「" + gameId + "」は harness/config.json に登録されていないゲームIDです。");
    if (RESERVED.includes(gameId) || gameId === config.exampleGameId) {
      console.log("  （その名前は運営が使っているため指定できません）");
    }
    printUsage();
    return 1;
  }

  console.log("");
  if (dryRun) console.log("--dry-run: 実際にはファイルを作りません");

  for (const item of targets) {
    const { created, skipped } = scaffoldOne(item);
    console.log("");
    console.log("[" + item.displayName + "] " + item.name + "  src/games/" + item.gameId + "/");
    for (const file of created) console.log("  作成  " + file);
    for (const item of skipped) console.log("  そのまま  " + item.path + "  … " + item.reason);
  }

  console.log("");
  console.log("次にやること:");
  console.log("  1. npm run test    … 生成直後でもテストが通ることを確認する");
  console.log("  2. npm run dev     … アーケードに自分のゲームが出ることを確認する");
  console.log("  3. Issue の必須要件を logic.ts のテストから書き始める");
  console.log("");
  return 0;
}

process.exit(main());
