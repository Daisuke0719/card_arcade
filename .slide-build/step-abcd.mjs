import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const root = "C:/Users/daisu/project/card_arcade";
const skill = "C:/Users/daisu/.codex/plugins/cache/openai-primary-runtime/presentations/26.905.11957/skills/presentations";
const runtime = "C:/Users/daisu/.cache/codex-runtimes/codex-primary-runtime/dependencies";
process.env.RUNTIME_NODE_MODULES = path.join(runtime, "node/node_modules");
process.env.RUNTIME_NODE = path.join(runtime, "node/bin/node.exe");
const sourcePath = path.join(root, "output/card-arcade-training-phase1-detailed.pptx");
const buildDir = path.join(root, ".slide-build/step-abcd-finalizer");
const candidatePath = path.join(buildDir, "candidate.pptx");
const finalPath = path.join(root, "output/card-arcade-training-step-abcd.pptx");

const { finalizePresentation } = await import(
  pathToFileURL(path.join(skill, "container_tools/artifact_tool_utils.mjs")).href,
);

await fs.mkdir(buildDir, { recursive: true });
const sourceBytes = await fs.readFile(sourcePath);
const sourceSha256 = crypto.createHash("sha256").update(sourceBytes).digest("hex");
const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));

function replaceText(slideNumber, oldText, newText) {
  const slide = presentation.slides.items[slideNumber - 1];
  let count = 0;
  for (const shape of slide.shapes.items) {
    if (!shape.text) continue;
    const current = shape.text.toString();
    if (!current.includes(oldText)) continue;
    shape.text.replace(oldText, newText);
    count += 1;
  }
  if (count === 0) throw new Error(`Text not found on slide ${slideNumber}: ${oldText}`);
}

function setTextById(id, newText) {
  const shape = presentation.resolve(id);
  const current = shape.text.toString();
  shape.text.replace(current, newText);
}

function setExactText(slideNumber, oldText, newText) {
  const slide = presentation.slides.items[slideNumber - 1];
  const shape = slide.shapes.items.find(
    (item) => item.text && item.text.toString() === oldText,
  );
  if (!shape) throw new Error(`Exact text not found on slide ${slideNumber}: ${oldText}`);
  shape.text = newText;
}

// Overview and navigation slides.
setTextById("sh/e9gb61k7", "C-2");
setTextById("sh/jypcrqd4", "C-5");
setTextById("sh/exsrmhsf", "Step D");

setTextById("sh/xcryxg7y", "4 Stepで進める共同開発");
setTextById("sh/wbih4b6d", "全体はStep A〜D、ゲーム制作はC-1〜C-5で現在地を確認します");
setTextById("sh/72t03qp0", "A  開発環境を整える");
setTextById("sh/ofqtgnyt", "B  実装範囲を決める");
setTextById("sh/mdobedg3", "C  ゲーム制作");
setTextById("sh/0b6tc3yx", "D  統合・公開確認");
setTextById("sh/epobatgr", "C-1  作業準備\nC-2  Draft PR");
setTextById("sh/cn6t83y1", "C-3  計画照合\nC-4  実装・試遊");
setTextById("sh/tsnip0ny", "C-5  verify・PR提出");
setTextById("sh/7650nq5s", "Step Cでは、担当IssueのC-1からC-5までを上から順に進めます");

setTextById("sh/zi5c3y98", "Step A・B・D");
setTextById("sh/x4ni9ofy", "Step C");
setTextById(
  "sh/ehwvat8n",
  "スライドと手順書を参照\n<ゲームID>・<Issue番号>などを\n自分の担当情報に置き換える",
);
setTextById(
  "sh/a1wze9g7",
  "担当IssueのC-1〜C-5を利用\nゲームID・ブランチ名・Issue番号は\n担当内容に合わせて記載済み",
);

const issueTable = presentation.resolve("tb/mpk7exwz");
issueTable.cells.set(2, 0, "Step C（C-1〜C-5）");
issueTable.cells.set(2, 1, "担当情報が入ったプロンプト");

// Step A and B.
for (let n = 15; n <= 28; n += 1) {
  replaceText(n, "フェーズ1", "Step A");
}
replaceText(23, "担当情報は、フェーズ3でブランチを作成して起動し直すと反映されます", "担当情報は、C-1でブランチを作成して起動し直すと反映されます");
for (let n = 29; n <= 32; n += 1) {
  replaceText(n, "フェーズ2", "Step B");
}

const titleMap = new Map([
  [33, "Step C｜C-1・C-2をIssueで確認"],
  [34, "C-1｜作業ブランチと5つの雛形を用意"],
  [35, "C-1｜作業ブランチと雛形のプロンプト"],
  [36, "C-2｜変更を確認し、Draft PRを作成"],
  [37, "C-2｜雛形をコミットする"],
  [38, "C-2｜pushとDraft PRを作成する"],
  [39, "C-2｜Closesの番号が違う場合"],
  [40, "C-2｜CI成功を確認して実装へ進む"],
  [41, "C-2｜範囲外のaddが原因でCIが失敗した場合"],
  [42, "Step C｜C-3・C-4をIssueで確認"],
  [43, "C-3｜実装計画を必須要件と照合"],
  [44, "C-3｜実装計画を作成する"],
  [45, "C-3｜計画に要件が不足している場合"],
  [46, "C-3｜対象外のルールが含まれる場合"],
  [47, "C-4｜確認した計画で実装する"],
  [48, "C-4｜実装後にテストと試遊を行う"],
  [49, "C-4｜担当外のファイルが変更された場合"],
  [50, "Step C｜C-4をIssueで確認"],
  [51, "C-4｜3つの観点で動作を検証"],
  [52, "C-4｜不具合は事実と期待を伝える"],
  [53, "C-4｜不具合の原因と改善策を計画"],
  [54, "C-4｜必須要件を満たし、readyにする"],
  [55, "C-4｜残りの必須要件を実装する"],
  [56, "C-4｜statusをreadyへ変更する"],
  [57, "Step C｜C-5をIssueで確認"],
  [58, "C-5｜verifyで提出前の検証を行う"],
  [59, "C-5｜実際の変更に基づいてPRを更新"],
  [60, "C-5｜提出のプロンプト 1/2"],
  [61, "C-5｜提出のプロンプト 2/2"],
  [62, "C-5｜参加者がDraftを解除して提出"],
  [63, "Step D｜講師がマージし、公開する"],
  [64, "Step D｜マージ後にmainへ同期する"],
  [65, "Step D｜mainへ同期し、公開を確認"],
]);

for (const [slideNumber, newTitle] of titleMap) {
  const slide = presentation.slides.items[slideNumber - 1];
  const title = slide.shapes.items.find(
    (shape) => shape.text && shape.position.top === 54 && shape.position.left === 100,
  );
  if (!title) throw new Error(`Title not found on slide ${slideNumber}`);
  const current = title.text.toString();
  title.text.replace(current, newTitle);
}

replaceText(33, "手順書：フェーズ3", "手順書：Step C（C-1・C-2）");
for (let n = 34; n <= 35; n += 1) replaceText(n, "手順書：フェーズ3", "手順書：Step C（C-1）");
for (let n = 36; n <= 41; n += 1) replaceText(n, "手順書：フェーズ3", "手順書：Step C（C-2）");
replaceText(42, "手順書：フェーズ4", "手順書：Step C（C-3・C-4）");
for (let n = 43; n <= 46; n += 1) replaceText(n, "手順書：フェーズ4", "手順書：Step C（C-3）");
for (let n = 47; n <= 49; n += 1) replaceText(n, "手順書：フェーズ4", "手順書：Step C（C-4）");
for (let n = 50; n <= 56; n += 1) replaceText(n, "手順書：フェーズ5", "手順書：Step C（C-4）");
for (let n = 57; n <= 62; n += 1) replaceText(n, "手順書：フェーズ6", "手順書：Step C（C-5）");
for (let n = 63; n <= 65; n += 1) replaceText(n, "手順書：フェーズ7", "手順書：Step D");

for (const n of [33, 42, 50, 57]) {
  replaceText(
    n,
    "Issueの「進め方（フェーズ3〜6）」には、担当ゲーム用のプロンプトが用意されています",
    "IssueのStep Cには、担当ゲーム用のC-1〜C-5とプロンプトが用意されています",
  );
}
setExactText(33, "「1. ブランチを作成し、雛形を生成する」\n「2. 最初のコミットと Draft の Pull Request 作成」", "「C-1　作業ブランチと雛形を用意する」\n「C-2　Draft PRを作り、提出経路を確認する」");
setExactText(42, "「3. 実装の計画を先に立てる」\n「4. 最後まで遊べる状態にする」", "「C-3　実装計画を必須要件と照合する」\n「C-4　実装し、試遊しながら修正する」");
replaceText(50, "「4. 最後まで遊べる状態にする」", "「C-4　実装し、試遊しながら修正する」");
replaceText(57, "「5. Pull Request を提出する」", "「C-5　verifyを実行し、Pull Requestを提出する」");
replaceText(48, "不具合はフェーズ5で修正", "不具合は続けて修正");

await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const tableOwners = presentation.slides.items
  .map((slide, index) => (slide.tables.items.length ? index + 1 : null))
  .filter(Boolean);
const fontPolicy = {
  basis: "reference",
  families: ["Meiryo"],
  referencePath: sourcePath,
  referenceSha256: sourceSha256,
};

const result = await finalizePresentation({
  workspaceDir: root,
  candidatePath,
  finalPath,
  pythonExecutable: path.join(runtime, "python/python.exe"),
  integrityValidatorPath: path.join(skill, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skill, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu",
    "15240000,8572500",
    "--validate-bullet-geometry",
    "--validate-heading-fit",
    ...tableOwners.flatMap((n) => ["--require-native-table-slide", String(n)]),
  ],
  explicitTotalSlideCount: 66,
  sourceTemplatePath: sourcePath,
  requiredTemplateReferenceSlides: Array.from({ length: 66 }, (_, i) => i + 1),
  minimumTemplateCoverageRatio: 1,
  requiredNativeTableOwnerSlides: tableOwners,
  requiredNativeChartOwnerSlides: [],
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, "validation.json"),
});

const finalDeck = await PresentationFile.importPptx(await FileBlob.load(finalPath));
const inspect = await finalDeck.inspect({
  kind: "slide,textbox,table,layout",
  maxChars: 250000,
});
await fs.writeFile(path.join(buildDir, "inspect.ndjson"), inspect.ndjson);
const renderDir = path.join(buildDir, "renders");
await fs.mkdir(renderDir, { recursive: true });
for (let i = 0; i < finalDeck.slides.items.length; i += 1) {
  const png = await finalDeck.export({ slide: finalDeck.slides.items[i], format: "png", scale: 1 });
  await fs.writeFile(
    path.join(renderDir, `${String(i + 1).padStart(2, "0")}.png`),
    new Uint8Array(await png.arrayBuffer()),
  );
}

console.log(`Validated ${finalDeck.slides.items.length} slides: ${result.finalPath}`);
