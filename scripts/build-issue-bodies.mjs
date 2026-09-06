/**
 * docs/games/<id>.md（ルール文書）から Issue 本文を組み立てる（講師用）。
 *
 *   node scripts/build-issue-bodies.mjs
 *
 * Issue 本文とルール文書の不一致を防ぐため、必要な節を自動で転記します。
 * ゲーム固有の内容は docs/games/<id>.md で管理します。
 *
 * 「進め方」に載せるプロンプトは docs/handson-steps.md のフェーズ3〜6をもとにしています。
 * 手順書を直したら、ここも直して再生成してください。
 *
 * 出力先: .github/issue-bodies/<participant>-<gameId>.md（UTF-8 BOM なし / LF）
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

function buildBody(item) {
  // Issue 作成前は番号が分からないのでプレースホルダのままにする
  const issueRef = item.issue > 0 ? "#" + item.issue : "<この Issue の番号>";
  const issueNumber = item.issue > 0 ? String(item.issue) : "<この Issue の番号>";
  const docPath = path.join(root, "docs", "games", item.gameId + ".md");
  const doc = readFileSync(docPath, "utf8");

  const required = section(doc, "必須要件");
  const steps = section(doc, "実装の進め方");
  const cutOrder = section(doc, "時間が足りないとき");
  const stretch = section(doc, "発展課題");

  return `# ${item.name}（\`${item.gameId}\`）を実装する

CARD ARCADE に **${item.name}** を追加してください。

## 担当

| 項目 | 値 |
|---|---|
| 担当 | ${item.displayName} |
| 難易度 | ${DIFFICULTY_JA[item.difficulty] ?? item.difficulty} |
| ブランチ | \`feature/${item.gameId}\` |
| 編集してよい範囲 | \`src/games/${item.gameId}/\` の中**だけ** |
| ルール文書 | [\`docs/games/${item.gameId}.md\`](../blob/main/docs/games/${item.gameId}.md) |

実装するルールは、この Issue とルール文書に記載されたものに限ります。

## 進め方（フェーズ3〜6）

この研修では、Claude Code にプロンプトを入力して作業を進めます。
次のコードブロックは、ターミナルAにそのまま貼り付けて使用できます。
各フェーズの詳しい説明は \`docs/handson-steps.md\` に掲載しています。

### 2つのターミナルを使う

| | ターミナルA（Claude Code） | ターミナルB（参加者が操作） |
|---|---|---|
| 常駐するもの | \`claude\` のセッション | \`npm run dev\`（研修中は起動したままにする） |
| ここで行うこと | 調査・実装の依頼・差分の確認・文章の下書き | ブラウザでの動作確認 / \`npm test\` の結果確認 / CI の確認 / 承認の判断 |

開発サーバーは、参加者がターミナルBから起動します。

\`\`\`powershell
npm run dev
\`\`\`

ブラウザで \`http://localhost:5173/\` を開き、研修中は開いたままにします。

> **ターミナルAで \`npm run dev\` の実行を依頼すると、拒否メッセージが表示されます。**
> コマンドを実行するとセッションを操作できなくなり、ターミナルBで使う \`5173\` 番ポートとも競合するためです。
> 画面は、ターミナルBの開発サーバーとブラウザで確認します。

### 1. ブランチを作成し、雛形を生成する

次のプロンプトをターミナルAに入力します。

\`\`\`text
これから ${item.gameId} の実装を始めます。次の5つを、この順番で実行してください。

1. git switch main
2. git pull
3. git switch -c feature/${item.gameId}
4. npm run scaffold -- --game ${item.gameId}
5. npm test

実行後、src/games/${item.gameId}/ に生成された5つのファイルについて、
「ファイル名 … 役割」の形式で1行ずつ、合計5行で説明してください。

ファイルは変更せず、まだ実装を始めないでください。
\`\`\`

処理が終わったら、いったん \`/exit\` し、\`claude\` を起動し直します。
起動時の案内とステータスラインに、担当ゲームが反映されます。

\`index.ts\` の \`owner\` には担当者が設定されています。
\`id\`、\`name\`、\`owner\`、\`difficulty\` はあらかじめ決められた値です。変更すると契約テストと CI が失敗するため、そのまま使用してください。

ターミナルBでブラウザを \`F5\` キーで再読み込みし、一覧に「${item.name}」が「準備中」と表示されることを確認します。

### 2. 最初のコミットと Draft の Pull Request 作成

実装前の雛形の段階で Draft の Pull Request を作成し、権限、CI、改行コードに関する問題がないことを確認します。

push や Pull Request の作成前に変更内容を確認できるよう、プロンプトを2つに分けます。

1つ目のプロンプトでは、変更内容を確認してからコミットします。

\`\`\`text
コミットの前に git status --short を実行し、変更されたファイルの一覧をそのまま表示してください。

そのうえで、git add の対象は src/games/${item.gameId} だけにして、
次のメッセージでコミットしてください。

  chore(${item.gameId}): 雛形を追加する

src/games/${item.gameId} の外にあるファイルは、1つも add しないでください。
\`\`\`

2つ目のプロンプトでは、push と Draft の Pull Request 作成を依頼します。実行前に承認画面が表示されます。

\`\`\`text
push して、Draft の Pull Request を作ってください。

- push: git push -u origin HEAD
- PR: gh pr create --draft --title "${item.gameId} を実装する" --body "雛形を置いただけの Draft です。実装はこれから進めます。Closes ${issueRef}"

作成した Pull Request の番号を最後に教えてください。
gh pr ready は実行しないでください。Draft のままにします。
\`\`\`

> 承認する前に、画面に表示されたコマンドを確認します。
> 特に \`Closes ${issueRef}\` が担当の Issue 番号になっているかを確認してください。
> 番号が違うと、別の Issue を閉じてしまいます。
>
> 番号が違う場合は \`n\` を押し、次のプロンプトで修正を依頼します。
>
> \`\`\`text
> Closes の番号が違います。私の Issue は ${issueRef} です。そこだけ直してもう一度出してください。
> \`\`\`

CI が成功したことは、ターミナルBで確認します。

\`\`\`powershell
gh pr checks <自分のPR番号> --watch
\`\`\`

\`verify\` が失敗した場合は、実装へ進む前に修正します。担当フォルダの外を \`git add\` したことが原因であれば、次のプロンプトをターミナルAに入力します。

\`\`\`text
npm run scope を実行して、範囲外の変更があるか確認してください。
範囲外があれば、scope の出力に示された git restore のコマンドをそのまま実行して戻してください。
src/games/${item.gameId} の中身は消さないでください。
\`\`\`

### 3. 実装の計画を先に立てる

CI が成功したことを確認してから、ターミナルAで実装計画の作成を依頼します。

\`\`\`text
GitHub の Issue ${issueRef} と docs/games/${item.gameId}.md を読んで、
src/games/${item.gameId}/ にこのゲームをどう実装するか計画を立ててください。

- Issue にも docs/games/${item.gameId}.md にも書かれていないルールは足さないでください。
- まだコードは書かないでください。ファイルも変更しないでください。
\`\`\`

作成された計画を、この Issue の「必須要件」と上から順に照合します。
どの実装が対応するのか分からない要件があれば、その要件を示して計画の修正を依頼します。

\`\`\`text
必須要件の「<この Issue の要件の文言をそのまま貼る>」に対応する項目が計画にありません。
どの項目で実現するか分かるように、計画へ追記してください。まだ実装はしないでください。
\`\`\`

\`\`\`text
計画の「<計画の中の1行をそのまま貼る>」は、Issue にも docs/games/${item.gameId}.md にも書かれていないルールです。
実装対象ではないため、計画から外してください。まだ実装はしないでください。
\`\`\`

### 4. 最後まで遊べる状態にする

計画が Issue とルール文書に一致していれば、実装を依頼します。この段階では、細かい仕上げよりも最後まで遊べる状態にすることを優先します。

\`\`\`text
その計画で実装してください。まず最後まで遊べる状態にすることを優先し、発展課題には手を付けないでください。
\`\`\`

ここからは、ブラウザで動作を確認しながら修正します。
プランモード（\`/plan\`）で改善計画を作成し、内容を確認してから修正を依頼します。

\`\`\`text
ブラウザでゲームを操作すると、<起きたこと> が発生しました。期待する動作は <期待していたこと> です。

原因を特定して改善策を計画してください。
まだファイルは変更しないでください。
\`\`\`

提示された計画が報告した不具合に対応していることを確認してから、修正を依頼します。修正後は、ブラウザを再読み込みして同じ操作を試します。

必須要件をすべて満たしたら、アーケードの一覧から遊べる状態にします。

\`\`\`text
src/games/${item.gameId}/index.ts の status を "ready" にしてください。
ほかの項目（id / name / owner / difficulty）は変更しないでください。
変更後に npm test を実行し、結果を報告してください。
\`\`\`

### 5. Pull Request を提出する

\`\`\`text
Pull Request を提出します。次を順に実行してください。

1. npm run verify
2. git add src/games/${item.gameId}
3. git commit -m "feat(${item.gameId}): ゲームを実装する"
4. git push
5. .github/PULL_REQUEST_TEMPLATE.md の形式で、Pull Request の本文を .pr-body.md に書く
6. gh pr edit <自分のPR番号> --body-file .pr-body.md

npm run verify が失敗したら、そこで止めて最初のエラーだけを報告してください。
本文は git diff origin/main...HEAD を確認し、実際の変更内容にもとづいて書いてください。
満たせていない必須要件があれば、「発展課題・未対応事項」に明記してください。

gh pr ready は実行しないでください。ターミナルBで実行します。
\`\`\`

Draft の解除は、参加者がターミナルBで実行します。

\`\`\`powershell
gh pr ready <自分のPR番号>
gh pr checks <自分のPR番号> --watch
\`\`\`

\`verify\` が成功したら、講師に PR 番号を伝えてください。マージは講師が行います。

## 必須要件

${required}

## 実装の進め方

${steps}

## 完了条件

- [ ] ターミナルBのブラウザで、アーケード一覧から担当ゲームを開き、最初から最後まで1回遊んだ
- [ ] 無効になるべき操作（連打 / 出せないカード / 0枚のとき）を試した
- [ ] リセットして2回目が正しく始まる
- [ ] \`logic.test.ts\` に \`it(\` が3件以上ある
- [ ] \`README.md\` に「遊び方 / ルール / 実装メモ」を書いた
- [ ] \`index.ts\` の \`status\` を \`"ready"\` にした
- [ ] \`npm run verify\` が成功する（範囲チェック / lint / 型 / テスト / ビルド）
- [ ] Pull Request の Draft を解除し、CI の \`verify\` が成功した
- [ ] 満たせていない必須要件を「発展課題・未対応事項」に書いた

## 時間が足りないとき

${cutOrder}

必須要件を省略する場合は、事前に講師へ相談してください。

## 発展課題（必須要件の完了後）

${stretch}

## 参考

| 資料 | 内容 |
|---|---|
| \`docs/handson-steps.md\` | 入力するプロンプトと各フェーズの手順 |
| \`src/games/example-game/\` | 実装例 |
| \`docs/game-plugin-guide.md\` | ゲームの作り方（主教材） |
| \`src/games/CLAUDE.md\` | \`@core\` / \`@ui\` の早見表 |
| \`docs/harness.md\` | 拒否される操作と、承認が必要な操作の一覧 |
| \`docs/troubleshooting.md\` | エラーへの対処方法 |

## 作業を続けられない場合

- 共通基盤（\`src/core\` / \`src/components\`）の変更が必要な場合は、講師に相談してください
- 範囲チェックが失敗した場合は、\`npm run scope\` の案内を確認し、表示された \`git restore ...\` を実行します
- \`npm run dev\` が拒否された場合は、ターミナルBで実行してください
- 時間内に終わる見込みがない場合は、早めに講師へ相談してください
`;
}

const outDir = path.join(root, ".github", "issue-bodies");

for (const item of config.participants) {
  const body = buildBody(item);
  const outPath = path.join(outDir, item.participant + "-" + item.gameId + ".md");
  // BOM なし / LF で書く（gh issue create --body-file がそのまま渡すため）
  writeFileSync(outPath, body.replace(/\r\n/g, "\n"), { encoding: "utf8" });
  console.log(
    "  作成 .github/issue-bodies/" +
      item.participant +
      "-" +
      item.gameId +
      ".md  (" +
      body.split("\n").length +
      "行)",
  );
}

console.log("");
console.log("次: node scripts/setup-github.mjs issues");
console.log("");
