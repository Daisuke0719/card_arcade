import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { card, cardLabel } from "@core";
import type { OnlineGameViewProps, Player, PlayingCard } from "@core";
import { DoubtOnlineView } from "./DoubtOnlineView";
import type { DoubtState, DoubtView } from "./logic";
import { onlineAdapter } from "./onlineAdapter";
import type { OnlineDoubtAction } from "./onlineAdapter";
import { game } from ".";

const PLAYERS: Player[] = [
  { id: "a", name: "A", kind: "human" },
  { id: "b", name: "B", kind: "human" },
];

function stateWith(handA: PlayingCard[], handB: PlayingCard[]): DoubtState {
  return { ...onlineAdapter.createInitialState(1, PLAYERS), hands: { a: handA, b: handB } };
}

function viewOf(state: DoubtState, viewerId: string): DoubtView {
  return onlineAdapter.toPublicState(state, viewerId) as DoubtView;
}

function props(
  view: DoubtView,
  overrides: Partial<OnlineGameViewProps<DoubtView, OnlineDoubtAction>> = {},
): OnlineGameViewProps<DoubtView, OnlineDoubtAction> {
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

const spadeA = card("spades", "A");
const heart3 = card("hearts", "3");
const club9 = card("clubs", "9");

describe("DoubtOnlineView", () => {
  it("選んだカードを sendAction で送り、サーバーから届くまで手札を変えない", async () => {
    const p = props(viewOf(stateWith([spadeA, heart3], [club9]), "a"));
    render(<DoubtOnlineView {...p} />);

    await userEvent.click(screen.getByLabelText(cardLabel(heart3)));
    await userEvent.click(screen.getByRole("button", { name: "1枚出す" }));

    expect(p.sendAction).toHaveBeenCalledWith({ type: "play", cardIds: ["hearts-3"] });
    expect(screen.getByLabelText(cardLabel(heart3))).toBeInTheDocument();
    expect(screen.queryByLabelText(cardLabel(club9))).toBeNull();
  });

  it("canAct が false の間は手札もボタンも操作できない", () => {
    render(<DoubtOnlineView {...props(viewOf(stateWith([spadeA], [club9]), "a"), { canAct: false })} />);

    expect(screen.getByLabelText(cardLabel(spadeA))).toBeDisabled();
    expect(screen.getByRole("button", { name: "0枚出す" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "ダウト！" })).toBeDisabled();
  });

  it("自分がダウトを判断する番ならダウトを送れる", async () => {
    const played = onlineAdapter.reduce(stateWith([spadeA, heart3], [club9]), { type: "play", cardIds: ["hearts-3"] }, "a");
    const p = props(viewOf(played, "b"), { playerId: "b" });
    render(<DoubtOnlineView {...p} />);

    await userEvent.click(screen.getByRole("button", { name: "ダウト！" }));

    expect(p.sendAction).toHaveBeenCalledWith({ type: "doubt" });
    expect(screen.queryByLabelText(cardLabel(heart3))).toBeNull();
  });

  it("試合結果から再戦でき、再戦後は結果表示が消える", async () => {
    const start = stateWith([spadeA], [club9]);
    const finished = onlineAdapter.reduce(
      onlineAdapter.reduce(start, { type: "play", cardIds: ["spades-A"] }, "a"),
      { type: "pass" },
      "b",
    );
    const p = props(viewOf(finished, "a"), { finished: true, result: onlineAdapter.getResult(finished) });
    const { rerender } = render(<DoubtOnlineView {...p} />);

    expect(screen.getByText("Aが1位")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "同じルームで再戦" }));
    expect(p.onRematch).toHaveBeenCalled();

    const rematch = onlineAdapter.createInitialState(2, PLAYERS);
    rerender(<DoubtOnlineView {...p} view={viewOf(rematch, "a")} finished={false} result={null} />);
    expect(screen.queryByText("Aが1位")).toBeNull();
    expect(screen.queryByRole("button", { name: "同じルームで再戦" })).toBeNull();
  });
});
