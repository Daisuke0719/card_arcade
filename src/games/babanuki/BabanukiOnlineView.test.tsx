import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { card, cardLabel, joker } from "@core";
import type { AnyCard, OnlineGameViewProps, Player } from "@core";
import { BabanukiOnlineView } from "./BabanukiOnlineView";
import type { BabanukiState, BabanukiView } from "./logic";
import { onlineAdapter } from "./onlineAdapter";
import type { OnlineBabanukiAction } from "./onlineAdapter";
import { game } from ".";

const PLAYERS: Player[] = [
  { id: "a", name: "A", kind: "human" },
  { id: "b", name: "B", kind: "human" },
];

function stateWith(handA: AnyCard[], handB: AnyCard[]): BabanukiState {
  return { ...onlineAdapter.createInitialState(1, PLAYERS), hands: { a: handA, b: handB } };
}

function viewOf(state: BabanukiState, viewerId: string): BabanukiView {
  return onlineAdapter.toPublicState(state, viewerId) as BabanukiView;
}

function props(
  view: BabanukiView,
  overrides: Partial<OnlineGameViewProps<BabanukiView, OnlineBabanukiAction>> = {},
): OnlineGameViewProps<BabanukiView, OnlineBabanukiAction> {
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

const spade2 = card("spades", "2");
const heart4 = card("hearts", "4");
const heart5 = card("hearts", "5");

describe("BabanukiOnlineView", () => {
  it("選んだ位置を sendAction で送り、サーバーから届くまで手札を変えない", async () => {
    const p = props(viewOf(stateWith([spade2], [heart4, heart5]), "a"));
    render(<BabanukiOnlineView {...p} />);

    const backs = screen.getAllByLabelText("裏向きのカード");
    expect(backs).toHaveLength(2);
    await userEvent.click(backs[1]);

    expect(p.sendAction).toHaveBeenCalledWith({ type: "draw", index: 1 });
    expect(screen.getAllByLabelText("裏向きのカード")).toHaveLength(2);
    expect(screen.getByLabelText(cardLabel(spade2))).toBeInTheDocument();
    expect(screen.queryByLabelText(cardLabel(heart5))).toBeNull();
  });

  it("相手の手札は裏向きの枚数だけを表示し、中身を描かない", () => {
    render(<BabanukiOnlineView {...props(viewOf(stateWith([spade2], [heart4, heart5]), "a"))} />);

    expect(screen.queryByLabelText(cardLabel(heart4))).toBeNull();
    expect(screen.queryByLabelText(cardLabel(heart5))).toBeNull();
  });

  it("canAct が false の間は相手の手札を引けない", () => {
    render(<BabanukiOnlineView {...props(viewOf(stateWith([spade2], [heart4, heart5]), "a"), { canAct: false })} />);

    for (const back of screen.getAllByLabelText("裏向きのカード")) expect(back).toBeDisabled();
  });

  it("相手の手番の間は引けない", () => {
    const p = props(viewOf(stateWith([spade2], [heart4, heart5]), "b"), { playerId: "b" });
    render(<BabanukiOnlineView {...p} />);

    for (const back of screen.getAllByLabelText("裏向きのカード")) expect(back).toBeDisabled();
  });

  it("引いたカードは引いた本人の画面にだけ表示する", () => {
    const drawn = onlineAdapter.reduce(stateWith([spade2], [heart4, heart5]), { type: "draw", index: 0 }, "a");

    const { unmount } = render(<BabanukiOnlineView {...props(viewOf(drawn, "a"))} />);
    expect(screen.getByText("引いたカード")).toBeInTheDocument();
    unmount();

    render(<BabanukiOnlineView {...props(viewOf(drawn, "b"), { playerId: "b" })} />);
    expect(screen.queryByText("引いたカード")).toBeNull();
    expect(screen.getByText("Aが1枚引きました")).toBeInTheDocument();
    expect(screen.queryByLabelText(cardLabel(heart4))).toBeNull();
  });

  it("試合結果から再戦でき、再戦後は結果表示が消える", async () => {
    const finished = onlineAdapter.reduce(stateWith([spade2], [card("hearts", "2"), joker()]), { type: "draw", index: 0 }, "a");
    expect(onlineAdapter.isFinished(finished)).toBe(true);

    const p = props(viewOf(finished, "a"), { finished: true, result: onlineAdapter.getResult(finished) });
    const { rerender } = render(<BabanukiOnlineView {...p} />);

    expect(screen.getByText("Aが1位")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "同じルームで再戦" }));
    expect(p.onRematch).toHaveBeenCalled();

    const rematch = onlineAdapter.createInitialState(2, PLAYERS);
    rerender(<BabanukiOnlineView {...p} view={viewOf(rematch, "a")} finished={false} result={null} />);
    expect(screen.queryByText("Aが1位")).toBeNull();
    expect(screen.queryByRole("button", { name: "同じルームで再戦" })).toBeNull();
  });
});
