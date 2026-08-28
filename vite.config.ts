/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * エイリアスは配列（正規表現）で書く。
 * オブジェクト形式だと前方一致置換になり、`@core/deck` が
 * `src/core/index.ts/deck` に化けてしまう。
 * 完全一致にしておくことで「深い import はモジュール解決の時点で失敗する」
 * ＝ ESLint を無効化されても公開 API の境界が守られる。
 */
export default defineConfig({
  // GitHub Pages のサブパス配信・dist の直開き・リポジトリ名変更のいずれでも動く
  base: "./",
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@core$/,
        replacement: fileURLToPath(new URL("./src/core/index.ts", import.meta.url)),
      },
      {
        find: /^@ui$/,
        replacement: fileURLToPath(new URL("./src/components/index.ts", import.meta.url)),
      },
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/core/**", "src/components/**", "src/games/**"],
    },
  },
});
