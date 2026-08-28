import type { Player, PlayerId, Ranking, RankingRow, ScoreEntry } from "../types";

/**
 * 点数で順位をつける。同点は同じ順位になり、その分だけ次の順位が飛ぶ
 * （1位, 1位, 3位）。
 */
export function rankByScore(
  entries: readonly ScoreEntry[],
  order: "higher-is-better" | "lower-is-better" = "higher-is-better",
): Ranking {
  const sorted = entries
    .slice()
    .sort((a, b) => (order === "higher-is-better" ? b.score - a.score : a.score - b.score));

  const rows: RankingRow[] = [];
  let lastScore: number | null = null;
  let lastRank = 0;

  sorted.forEach((entry, index) => {
    const rank = lastScore !== null && entry.score === lastScore ? lastRank : index + 1;
    rows.push({ rank, name: entry.name, detail: `${entry.score}点` });
    lastScore = entry.score;
    lastRank = rank;
  });

  return rows;
}

/**
 * 上がった順で順位をつける。ババ抜き・大富豪・七並べのように
 * 「早く手札を無くした人が勝ち」のゲーム用。
 * 上がれなかった人（＝ババを持っていた人）は最後に並ぶ。
 */
export function rankByFinishOrder(
  finishedIds: readonly PlayerId[],
  players: readonly Player[],
  detailOf?: (player: Player) => string | undefined,
): Ranking {
  const rows: RankingRow[] = [];

  finishedIds.forEach((id, index) => {
    const player = players.find((item) => item.id === id);
    if (!player) return;
    rows.push({ rank: index + 1, name: player.name, detail: detailOf?.(player) });
  });

  const remaining = players.filter((player) => !finishedIds.includes(player.id));
  remaining.forEach((player) => {
    rows.push({
      rank: finishedIds.length + 1,
      name: player.name,
      detail: detailOf?.(player) ?? "最下位",
    });
  });

  return rows;
}

export function formatRank(rank: number): string {
  return `${rank}位`;
}

/** 12345 → "12.3秒" / 83000 → "1分23秒" */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "-";
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}秒`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}分${seconds}秒`;
}
