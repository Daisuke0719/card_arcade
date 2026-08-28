import type { Player, PlayerId, TurnState } from "../types";

/** プレイヤー一覧を作る。名前を省略すると「あなた」「CPU 1」…になる。 */
export function createPlayers(
  spec: readonly { id?: PlayerId; name?: string; kind: Player["kind"] }[],
): Player[] {
  let cpuIndex = 0;
  return spec.map((item) => {
    if (item.kind === "cpu") cpuIndex += 1;
    return {
      id: item.id ?? (item.kind === "human" ? "you" : `cpu-${cpuIndex}`),
      name: item.name ?? (item.kind === "human" ? "あなた" : `CPU ${cpuIndex}`),
      kind: item.kind,
    };
  });
}

/** 「あなた + CPU n人」を一発で作る。多くのゲームはこれで足りる。 */
export function createSoloVsCpu(cpuCount: number, humanName = "あなた"): Player[] {
  return createPlayers([
    { kind: "human", name: humanName },
    ...Array.from({ length: cpuCount }, () => ({ kind: "cpu" as const })),
  ]);
}

export function findPlayer(players: readonly Player[], id: PlayerId): Player | undefined {
  return players.find((player) => player.id === id);
}

export function createTurnState(
  players: readonly Player[],
  options: { startId?: PlayerId; direction?: 1 | -1 } = {},
): TurnState {
  const { startId, direction = 1 } = options;
  const currentId = startId ?? players[0]?.id ?? "";
  return { players, currentId, direction, finishedIds: [] };
}

export function isCurrent(state: TurnState, id: PlayerId): boolean {
  return state.currentId === id;
}

export function isFinished(state: TurnState, id: PlayerId): boolean {
  return state.finishedIds.includes(id);
}

/** まだ上がっていないプレイヤー。 */
export function alivePlayers(state: TurnState): Player[] {
  return state.players.filter((player) => !isFinished(state, player.id));
}

/** 残り1人以下ならゲーム終了。 */
export function isOver(state: TurnState): boolean {
  return alivePlayers(state).length <= 1;
}

/**
 * 現在の手番から offset 人先の「まだ上がっていない」プレイヤーの id。
 * ババ抜きの「左隣から引く」は neighborId(state) の1行で書ける。
 * 生存者が自分だけなら undefined。
 */
export function neighborId(state: TurnState, offset = 1): PlayerId | undefined {
  const { players, direction } = state;
  const size = players.length;
  if (size === 0) return undefined;

  const currentIndex = players.findIndex((player) => player.id === state.currentId);
  if (currentIndex < 0) return undefined;

  let found = 0;
  for (let step = 1; step <= size; step += 1) {
    const index = (((currentIndex + step * direction) % size) + size) % size;
    const candidate = players[index];
    if (candidate.id === state.currentId) continue;
    if (isFinished(state, candidate.id)) continue;
    found += 1;
    if (found === offset) return candidate.id;
  }
  return undefined;
}

/** 次の手番へ。上がった人は自動的に飛ばす。 */
export function nextTurn(state: TurnState): TurnState {
  const next = neighborId(state, 1);
  if (!next) return state;
  return { ...state, currentId: next };
}

/**
 * 上がり処理。手番だったプレイヤーが上がった場合は次の人へ手番を移す。
 * 上がった順は finishedIds の並びとして残るので、そのまま順位になる。
 */
export function finishPlayer(state: TurnState, id: PlayerId): TurnState {
  if (isFinished(state, id)) return state;

  const nextId = state.currentId === id ? neighborId(state, 1) : state.currentId;
  const finishedIds = [...state.finishedIds, id];
  return {
    ...state,
    finishedIds,
    currentId: nextId ?? state.currentId,
  };
}

export function reverseDirection(state: TurnState): TurnState {
  return { ...state, direction: state.direction === 1 ? -1 : 1 };
}
