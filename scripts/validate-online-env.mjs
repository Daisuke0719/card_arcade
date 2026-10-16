const required = [
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "SESSION_SECRET",
  "ALLOWED_ORIGINS",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`オンラインWorkerの必須設定が不足しています: ${missing.join(", ")}`);
  console.error("GitHub ActionsのSecretsに値を登録してから再実行してください。");
  process.exit(1);
}

if (process.env.SESSION_SECRET.trim().length < 32) {
  console.error("SESSION_SECRETは32文字以上で設定してください。");
  process.exit(1);
}

const origins = process.env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean);
if (!origins.every((origin) => /^https?:\/\/[^/]+$/.test(origin))) {
  console.error("ALLOWED_ORIGINSはカンマ区切りのOrigin（例: https://example.com）で設定してください。");
  process.exit(1);
}

console.log(`オンラインWorker設定を確認しました（Origin ${origins.length}件）。`);
