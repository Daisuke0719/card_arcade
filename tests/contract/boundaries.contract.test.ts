/**
 * 境界の契約テスト（ソースの静的な走査）。
 *
 * 同じ内容を ESLint でも止めているが、ESLint は eslint-disable コメントで
 * 無効化できてしまう。ここはその抜け道を塞ぐ二重の網。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const gamesDir = path.join(process.cwd(), "src", "games");

type SourceFile = { relative: string; name: string; content: string; raw: string };

function collectFiles(dir: string, base = ""): { relative: string; name: string; raw: string }[] {
  const files: { relative: string; name: string; raw: string }[] = [];

  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const relative = base ? base + "/" + entry : entry;

    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full, relative));
      continue;
    }

    files.push({
      relative: "src/games/" + relative,
      name: entry,
      raw: readFileSync(full, "utf8"),
    });
  }

  return files;
}

/**
 * コメント行を落とす。
 * 雛形のコメントには「Math.random() を使わない」といった説明が書いてあるので、
 * そのまま探すと説明文まで違反として拾ってしまう。
 */
function stripComments(content: string): string {
  return content
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return (
        !trimmed.startsWith("//") &&
        !trimmed.startsWith("*") &&
        !trimmed.startsWith("/*") &&
        !trimmed.startsWith("{/*")
      );
    })
    .join(" ");
}

const sources: SourceFile[] = collectFiles(gamesDir).map((file) => ({
  ...file,
  content: stripComments(file.raw),
}));

const codeFiles = sources.filter(
  (file) => file.name.endsWith(".ts") || file.name.endsWith(".tsx"),
);

/** import 文から、読み込んでいるモジュール名だけを取り出す。 */
function importedModules(content: string): string[] {
  const matches = content.match(/from\s+["'][^"']+["']/g) ?? [];
  return matches.map((line) => line.replace(/from\s+["']/, "").replace(/["']$/, ""));
}

describe("ゲームフォルダの境界", () => {
  it("TypeScript 以外のソースファイルが置かれていない", () => {
    const bad = sources
      .filter((file) => file.name.endsWith(".js") || file.name.endsWith(".jsx"))
      .map((file) => file.relative);
    expect(bad).toEqual([]);
  });

  it("自分のフォルダの外を相対パスで参照していない", () => {
    const bad: string[] = [];
    for (const file of codeFiles) {
      for (const moduleName of importedModules(file.content)) {
        if (moduleName.startsWith("../")) bad.push(file.relative + " -> " + moduleName);
      }
    }
    expect(bad).toEqual([]);
  });

  it("他のチームのゲームを参照していない", () => {
    const bad: string[] = [];
    for (const file of codeFiles) {
      for (const moduleName of importedModules(file.content)) {
        if (moduleName.includes("games/")) bad.push(file.relative + " -> " + moduleName);
      }
    }
    expect(bad).toEqual([]);
  });

  it("共通機能は @core と @ui の入口だけから読み込んでいる", () => {
    const bad: string[] = [];
    for (const file of codeFiles) {
      for (const moduleName of importedModules(file.content)) {
        if (moduleName.startsWith("@core/") || moduleName.startsWith("@ui/")) {
          bad.push(file.relative + " -> " + moduleName);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("eslint のルールを無効化していない", () => {
    const bad = sources
      .filter((file) => file.raw.includes("eslint-disable"))
      .map((file) => file.relative);
    expect(bad).toEqual([]);
  });
});

describe("logic.ts と cpu.ts の純粋性", () => {
  const pureFiles = codeFiles.filter(
    (file) => file.name === "logic.ts" || file.name === "cpu.ts" || file.name === "rules.ts",
  );

  it("乱数と時刻を直接使っていない", () => {
    const bad: string[] = [];

    for (const file of pureFiles) {
      if (file.content.includes("Math.random")) bad.push(file.relative + ": Math.random");
      if (file.content.includes("Date.now")) bad.push(file.relative + ": Date.now");
      if (file.content.includes("new Date(")) bad.push(file.relative + ": new Date()");
      if (file.content.includes("setTimeout")) bad.push(file.relative + ": setTimeout");
      if (file.content.includes("setInterval")) bad.push(file.relative + ": setInterval");
    }

    expect(bad).toEqual([]);
  });

  it("画面のことを知らない（react と @ui を読み込んでいない）", () => {
    const bad: string[] = [];

    for (const file of pureFiles) {
      for (const moduleName of importedModules(file.content)) {
        if (moduleName === "react" || moduleName === "react-dom" || moduleName === "@ui") {
          bad.push(file.relative + " -> " + moduleName);
        }
      }
    }

    expect(bad).toEqual([]);
  });
});
