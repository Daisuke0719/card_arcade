import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { cardLabel, hand } from "@core";
import type { OnlineGameViewProps, Player, PlayingCard } from "@core";
import { describe, expect, it, vi } from "vitest";
import { PokerOnlineView } from "./PokerOnlineView";
import { onlineAdapter } from "./onlineAdapter";
import type { OnlinePokerAction, OnlinePokerState, PokerView } from "./onlineAdapter";
import { game } from ".";

const PLAYERS: Player[] = [
  { id: "a", name: "A", kind: "human" },
  { id: "b", name: "B", kind: "human" },
];

const PAIR_OF_ACES = hand("spades-A", "hearts-A", "clubs-9", "diamonds-6", "spades-2");
const KING_HIGH = hand("clubs-K", "diamonds-Q", "hearts-7", "spades-5", "clubs-3");

function stateWith(handA: PlayingCard[], handB: PlayingCard[]): OnlinePokerState {
  return { ...onlineAdapter.createInitialState(1, PLAYERS), hands: { a: handA, b: handB } };
}

function viewOf(state: OnlinePokerState, viewerId: string): PokerView {
  return onlineAdapter.toPublicState(state, viewerId) as PokerView;
}

function props(
  view: PokerView,
  overrides: Partial<OnlineGameViewProps<PokerView, OnlinePokerAction>> = {},
): OnlineGameViewProps<PokerView, OnlinePokerAction> {
  return {
    manifest: game,
    view,
    playerId: "a",
    players: PLAYERS.map((player) => ({ id: player.id, name: player.name, connected: true })),
    canAct: true,
    finished: false,
    result: null,
    sendAction: vi.fn(),
    onExit: () => {},
    onRematch: vi.fn(),
    ...overrides,
  };
}

describe("PokerOnlineView", () => {
  it("選んだカードを sendAction で送り、サーバーから届くまで手札を変えない", async () => {
    const p = props(viewOf(stateWith(PAIR_OF_ACES, KING_HIGH), "a"));
    render(<PokerOnlineView {...p} />);

    await userEvent.click(screen.getByLabelText(cardLabel(PAIR_OF_ACES[4])));
    await userEvent.click(screen.getByRole("button", { name: "交換する（1枚）" }));

    expect(p.sendAction).toHaveBeenCalledWith({ type: "exchange", cardIds: ["spades-2"] });
    expect(screen.getByLabelText(cardLabel(PAIR_OF_ACES[4]))).toBeInTheDocument();
  });

  it("決着前は相手の手札を裏向きで並べ、中身を DOM に出さない", () => {
    render(<PokerOnlineView {...props(viewOf(stateWith(PAIR_OF_ACES, KING_HIGH), "a"))} />);

    expect(screen.getAllByLabelText("裏向きのカード")).toHaveLength(5);
    for (const c of KING_HIGH) expect(screen.queryByLabelText(cardLabel(c))).toBeNull();
  });

  it("canAct が false の間は交換を送れない", async () => {
    const p = props(viewOf(stateWith(PAIR_OF_ACES, KING_HIGH), "a"), { canAct: false });
    render(<PokerOnlineView {...p} />);

    await userEvent.click(screen.getByLabelText(cardLabel(PAIR_OF_ACES[0])));
    expect(screen.getByRole("button", { name: "交換する（0枚）" })).toBeDisabled();
    expect(p.sendAction).not.toHaveBeenCalled();
  });

  it("自分の交換が済んだら、相手を待つ表示にして交換ボタンを無効にする", () => {
    const afterA = onlineAdapter.reduce(stateWith(PAIR_OF_ACES, KING_HIGH), { type: "exchange", cardIds: [] }, "a");
    render(<PokerOnlineView {...props(viewOf(afterA, "a"))} />);

    expect(screen.getByText("相手の交換を待っています")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "交換する（0枚）" })).toBeDisabled();
  });

  it("試合結果から再戦でき、再戦後は結果表示が消える", async () => {
    const start = stateWith(PAIR_OF_ACES, KING_HIGH);
    const finished = onlineAdapter.reduce(
      onlineAdapter.reduce(start, { type: "exchange", cardIds: [] }, "a"),
      { type: "exchange", cardIds: [] },
      "b",
    );
    const p = props(viewOf(finished, "a"), { finished: true, result: onlineAdapter.getResult(finished) });
    const { rerender } = render(<PokerOnlineView {...p} />);

    expect(screen.getByText("あなたの勝ち")).toBeInTheDocument();
    expect(screen.getByLabelText(cardLabel(KING_HIGH[0]))).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "同じルームで再戦" }));
    expect(p.onRematch).toHaveBeenCalled();

    const rematch = onlineAdapter.createInitialState(2, PLAYERS);
    rerender(<PokerOnlineView {...p} view={viewOf(rematch, "a")} finished={false} result={null} />);
    expect(screen.queryByText("あなたの勝ち")).toBeNull();
    expect(screen.queryByRole("button", { name: "同じルームで再戦" })).toBeNull();
    expect(screen.getByRole("button", { name: "交換する（0枚）" })).toBeEnabled();
  });
});
