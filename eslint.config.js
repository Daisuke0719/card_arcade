import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/*
 * CARD ARCADE の境界ルール。
 *
 * 硬さの基準:
 *   その違反が「他チームに波及するか」で決める。
 *   波及するもの（担当外への import、依存の追加、logic の非純粋化）は error にして機械で止める。
 *   自分のフォルダに閉じるもの（any、行数、console）は warn にしてレビューの題材にする。
 */

const GAMES_IMPORT_RULE = {
  patterns: [
    {
      group: ["../*", "../../*", "../../../*"],
      message:
        "自分のゲームフォルダの外を相対パスで参照しないでください。共通機能は @core と @ui から import します。",
    },
    {
      group: ["@core/*", "@ui/*"],
      message:
        "@core と @ui は入口だけを使ってください（例: import { createDeck } from \"@core\"）。中のファイルを直接指定することはできません。",
    },
    {
      group: ["src/*", "src/**", "@/*"],
      message: "src/... から始まる import は使いません。@core / @ui / 相対パスを使ってください。",
    },
    {
      group: ["**/games/*/**"],
      message:
        "他のチームのゲームを参照しないでください。ゲーム同士は完全に独立している必要があります。",
    },
  ],
};

const PURE_LOGIC_RULES = {
  "no-restricted-imports": ["error", {
    patterns: [
      ...GAMES_IMPORT_RULE.patterns,
      {
        group: ["react", "react-dom", "react/*", "react-dom/*", "@ui"],
        message:
          "logic.ts と cpu.ts は「純粋なルール」だけを書く場所です。画面のことは <Xxx>Game.tsx に書いてください。",
      },
    ],
  }],
  "no-restricted-properties": [
    "error",
    {
      object: "Math",
      property: "random",
      message:
        "Math.random() は使えません。乱数は引数で Rng を受け取り、テストでは createRng(seed) で固定します。",
    },
    {
      object: "Date",
      property: "now",
      message:
        "Date.now() は使えません。時間の扱いは画面側（useCpuTurn）に任せ、ロジックは時間を持たない形にします。",
    },
  ],
  "no-restricted-globals": [
    "error",
    { name: "window", message: "logic.ts / cpu.ts からブラウザの API は触れません。" },
    { name: "document", message: "logic.ts / cpu.ts からブラウザの API は触れません。" },
    { name: "localStorage", message: "保存は @core の useHighScore / gameKey を使ってください。" },
  ],
  "no-restricted-syntax": [
    "error",
    {
      selector: "NewExpression[callee.name='Date']",
      message:
        "new Date() は使えません。ロジックから時間を排除すると、テストが安定します。",
    },
  ],
};

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "node_modules", ".claude/.state"],
  },

  // ---- 全 TypeScript 共通 ----
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.es2023 },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
    },
  },

  // ---- 共通基盤は games を参照しない（依存の向きを固定する） ----
  {
    files: ["src/core/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/games/**", "@ui"],
              message:
                "共通基盤から個別のゲームを参照してはいけません（core <- components <- games の一方向にします）。",
            },
          ],
        },
      ],
    },
  },

  // ---- ゲームフォルダ全体 ----
  {
    files: ["src/games/**/*.{ts,tsx}"],
    rules: {
      // 読みやすさの目安。担当フォルダの中に閉じる話なので warn に留め、レビューの題材にする
      complexity: ["warn", 15],
      "max-lines": ["warn", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 150, skipBlankLines: true, skipComments: true }],
      "no-restricted-imports": ["error", GAMES_IMPORT_RULE],
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message:
            "localStorage を直接使わないでください。@core の useHighScore / gameKey を使えばキーが衝突しません。",
        },
        {
          name: "sessionStorage",
          message: "sessionStorage は使いません。@core の保存機能を使ってください。",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "dangerouslySetInnerHTML は使えません。",
        },
      ],
    },
  },

  // ---- logic.ts と cpu.ts は純粋関数だけ ----
  {
    files: ["src/games/*/logic.ts", "src/games/*/cpu.ts", "src/games/*/rules.ts"],
    rules: PURE_LOGIC_RULES,
  },

  // ---- index.ts は manifest の宣言だけ ----
  {
    files: ["src/games/*/index.ts"],
    rules: {
      "react-refresh/only-export-components": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector: "FunctionDeclaration",
          message:
            "index.ts には manifest（export const game）だけを書きます。処理は logic.ts か <Xxx>Game.tsx へ。",
        },
        {
          selector: "JSXElement",
          message: "index.ts に JSX は書けません。画面は <Xxx>Game.tsx に書きます。",
        },
      ],
    },
  },

  // ---- テストと設定ファイルは緩める ----
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**", "tests/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["vite.config.ts", "eslint.config.js", "scripts/**/*.mjs", ".claude/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
);
