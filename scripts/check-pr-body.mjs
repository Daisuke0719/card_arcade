/**
 * Pull Request の書き方を確認する（参考情報。必須チェックにはしない）。
 *
 * レビュアーが「何を見ればいいか分からない」状態を減らすのが目的。
 * 落としても直せるものだけを見る。
 */
const body = process.env.PR_BODY ?? "";
const notices = [];

if (!/Closes\s+#\d+/i.test(body)) {
  notices.push(
    "`Closes #<Issue番号>` が見つかりません。書いておくとマージ時に Issue が自動で閉じます。",
  );
}

if (/<!--/.test(body) && /-->/.test(body)) {
  const placeholders = (body.match(/<!--[\s\S]*?-->/g) ?? []).length;
  if (placeholders >= 4) {
    notices.push(
      "テンプレートの説明コメント（<!-- ... -->）が " +
        placeholders +
        "個残っています。埋めた項目のコメントは消すと読みやすくなります。",
    );
  }
}

const reviewSection = /##\s*レビューしてほしい点\s*\n([\s\S]*?)(\n##|$)/.exec(body);
const reviewText = (reviewSection?.[1] ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();
if (reviewText.length < 15) {
  notices.push(
    "「レビューしてほしい点」が空、または短すぎます。ここが具体的だとレビューの質が変わります。" +
      "（例: 同じ数字が出たときの引き分け処理を重点的に見てください）",
  );
}

if (/TODO:/.test(body)) {
  notices.push("本文に TODO: が残っています。");
}

const ruleSection = /##\s*採用したルール\s*\n([\s\S]*?)(\n##|$)/.exec(body);
const ruleText = (ruleSection?.[1] ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();
if (ruleText.length < 10) {
  notices.push(
    "「採用したルール」が空です。トランプゲームは家庭ごとにルールが違うので、" +
      "ここを書いておくと「このルールが無い」という誤解を防げます。",
  );
}

console.log("");
if (notices.length === 0) {
  console.log("✓ Pull Request の説明は十分です。");
  console.log("");
  process.exit(0);
}

console.log("Pull Request の説明について、いくつか気づいた点があります（これで CI は落ちません）:");
console.log("");
for (const notice of notices) {
  console.log("  - " + notice);
}
console.log("");
process.exit(0);
