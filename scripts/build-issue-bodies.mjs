/**
 * docs/games/<id>.md（ルールの正典）から Issue 本文を組み立てる（講師用）。
 *
 *   node scripts/build-issue-bodies.mjs
 *
 * Issue 本文を手で書くと、正典と Issue でルールがずれます。
 * ここで機械的に転記することで、直す場所を docs/games/<id>.md の1つに保ちます。
 *
 * 出力先: .github/issue-bodies/<team>-<gameId>.md（UTF-8 BOM なし / LF）
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadConfig, repoRoot } from "./lib/harness.mjs";

const root = repoRoot();
const config = loadConfig(root);

const DIFFICULTY_JA = { easy: "初級", normal: "中級", hard: "上級" };

/** 「## 見出し」から次の「## 」までを取り出す。 */
function section(markdown, headingStartsWith) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex(
    (line) => line.startsWith("## ") && line.slice(3).trim().startsWith(headingStartsWith),
  );
  if (start < 0) return "";

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  const body = (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
  return body;
}

function buildBody(team) {
  const docPath = path.join(root, "docs", "games", team.gameId + ".md");
  const doc = readFileSync(docPath, "utf8");

  const required = section(doc, "必須要件");
  const steps = section(doc, "実装の進め方");
  const cutOrder = section(doc, "時間が足りないとき");
  const stretch = section(doc, "発展課題");

  return `# ${team.name}（\`${team.gameId}\`）を実装する

CARD ARCADE に **${team.name}** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| チーム | ${team.label} |
| 難易度 | ${DIFFICULTY_JA[team.difficulty] ?? team.difficulty} |
| ブランチ | \`feature/${team.gameId}\` |
| 編集してよい範囲 | \`src/games/${team.gameId}/\` の中**だけ** |
| ルールの正典 | [\`docs/games/${team.gameId}.md\`](../blob/main/docs/games/${team.gameId}.md) |

**この Issue に書かれていないローカルルールは実装しません。** 迷ったら正典を見てください。

## 最初にやること（Step 5〜7）

\`\`\`powershell
git switch -c feature/${team.gameId}
npm run scaffold -- --game ${team.gameId}
npm test
\`\`\`

テストが緑になったら、**実装を始める前に**一度コミットして Draft の Pull Request を作ります。
権限や CI の問題を早い段階で表に出すためです。

\`\`\`powershell
git add src/games/${team.gameId}
git commit -m "chore: ${team.name}の雛形を追加"
git push -u origin HEAD
gh pr create --draft --title "${team.name}を実装" --body "Closes #<この Issue の番号>"
\`\`\`

CI が緑になったのを確認してから、Claude Code で計画を立てます。

\`\`\`
/kickoff <この Issue の番号>
\`\`\`

\`/kickoff\` はコードを変更できないようになっています。計画が出たら、**人間が読んで合意してから** \`/implement\` へ進んでください。

## 必須要件

${required}

## 実装の進め方

${steps}

## 完了条件

- [ ] \`npm run verify\` が緑（範囲チェック / lint / 型 / テスト / ビルド）
- [ ] \`index.ts\` の \`status\` を \`"ready"\` にした
- [ ] \`README.md\` に「遊び方 / ルール / 実装メモ」を書いた
- [ ] アーケード一覧から開いて、最初から最後まで1回遊べた
- [ ] リセットして2回目が正しく始まる
- [ ] テストのアサーションを1つ逆にして、赤くなることを確認した
- [ ] Pull Request にスクリーンショットを添付した
- [ ] 「レビューしてほしい点」を自分の言葉で書いた

## 時間が足りないとき

${cutOrder}

**発展課題より先に、必須要件を削る相談を講師にしてください。**

## 発展課題（必須要件が全部終わってから）

${stretch}

## 参考

| 見るもの | 内容 |
|---|---|
| \`src/games/example-game/\` | お手本。**最初に読む** |
| \`docs/game-plugin-guide.md\` | ゲームの作り方（主教材） |
| \`src/games/CLAUDE.md\` | \`@core\` / \`@ui\` の早見表 |
| \`docs/troubleshooting.md\` | エラーで詰まったとき |
| \`/stuck\` | 詰まったときに状況を整理するコマンド |

## 困ったときは

- 共通基盤（\`src/core\` / \`src/components\`）を変えたくなったら、**自分で直さずに講師へ相談**してください
- 範囲チェックで止められたら、\`npm run scope\` が出す \`git restore ...\` をそのまま実行すれば戻せます
- 時間内に終わらなそうなら、70分の中間チェックポイントで講師に相談してください
`;
}

const outDir = path.join(root, ".github", "issue-bodies");

for (const team of config.teams) {
  const body = buildBody(team);
  const outPath = path.join(outDir, team.team + "-" + team.gameId + ".md");
  // BOM なし / LF で書く（gh issue create --body-file がそのまま渡すため）
  writeFileSync(outPath, body.replace(/\r\n/g, "\n"), { encoding: "utf8" });
  console.log(
    "  作成 .github/issue-bodies/" +
      team.team +
      "-" +
      team.gameId +
      ".md  (" +
      body.split("\n").length +
      "行)",
  );
}

console.log("");
console.log("次: powershell -ExecutionPolicy Bypass -File scripts/setup-issues.ps1");
console.log("");
