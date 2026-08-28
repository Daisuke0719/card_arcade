/** フック共通の入出力ヘルパー。 */

export async function readInput() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

/** ツールの実行を止める。理由は Claude にそのまま渡る。 */
export function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

/** 人間に確認してもらう。 */
export function ask(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

/** 何も言わずに通す（通常の権限フローに任せる）。 */
export function pass() {
  process.exit(0);
}

export function harnessDisabled() {
  return process.env.CARD_ARCADE_HARNESS === "off";
}
