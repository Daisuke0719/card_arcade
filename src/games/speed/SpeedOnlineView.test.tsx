import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { card, cardLabel } from "@core";
import type { OnlineGameViewProps, Player, PlayingCard } from "@core";
import { SpeedOnlineView } from "./SpeedOnlineView";
import { onlineAdapter } from "./onlineAdapter";
import type { OnlineSpeedAction, OnlineSpeedState, SpeedView } from "./onlineAdapter";
import { game } from ".";

const PLAYERS: Player[] = [
  { id: "a", name: "A", kind: "human" },
  { id: "b", name: "B", kind: "human" },
];

function stateWith(parts: {
  aHand: PlayingCard[];
  aDeck?: PlayingCard[];
  bHand: PlayingCard[];
  bDeck?: PlayingCard[];
  piles: [PlayingCard, PlayingCard];
}): OnlineSpeedState {
  const base = onlineAdapter.createInitialState(1, PLAYERS);
  return {
    ...base,
    game: {
      ...base.game,
      you: { hand: parts.aHand, deck: parts.aDeck ?? [] },
      cpu: { hand: parts.bHand, deck: parts.bDeck ?? [] },
      piles: parts.piles,
    },
  };
}

function viewOf(state: OnlineSpeedState, viewerId: string): SpeedView {
  return onlineAdapter.toPublicState(state, viewerId) as SpeedView;
}

function props(
  view: SpeedView,
  overrides: Partial<OnlineGameViewProps<SpeedView, OnlineSpeedAction>> = {},
): OnlineGameViewProps<SpeedView, OnlineSpeedAction> {
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

const piles: [PlayingCard, PlayingCard] = [card("spades", "7"), card("hearts", "J")];
const club8 = card("clubs", "8");
const club2 = card("clubs", "2");
const heart10 = card("hearts", "10");
const heart3 = card("hearts", "3");

describe("SpeedOnlineView", () => {
  it("出せるカードを sendAction で送り、サーバーから届くまで手札を変えない", async () => {
    const p = props(viewOf(stateWith({ aHand: [club8, club2], bHand: [heart10], piles }), "a"));
    render(<SpeedOnlineView {...p} />);

    await userEvent.click(screen.getByLabelText(cardLabel(club8)));

    expect(p.sendAction).toHaveBeenCalledWith({ type: "play_card", cardId: "clubs-8" });
    expect(screen.getByLabelText(cardLabel(club8))).toBeInTheDocument();
  });

  it("出せないカードは送信されない", async () => {
    const p = props(viewOf(stateWith({ aHand: [club8, club2], bHand: [heart10], piles }), "a"));
    render(<SpeedOnlineView {...p} />);

    await userEvent.click(screen.getByLabelText(cardLabel(club2)));

    expect(p.sendAction).not.toHaveBeenCalled();
  });

  it("canAct が false の間は手札も台札の更新も操作できない", async () => {
    const stuck = stateWith({ aHand: [club2], aDeck: [club8], bHand: [heart3], bDeck: [club8], piles });
    const p = props(viewOf(stuck, "a"), { canAct: false });
    render(<SpeedOnlineView {...p} />);

    expect(screen.getByLabelText(cardLabel(club2))).toBeDisabled();
    expect(screen.queryByRole("button", { name: "台札を更新" })).toBeNull();
  });

  it("両者とも出せないときだけ台札の更新を送れる", async () => {
    const stuck = stateWith({ aHand: [club2], aDeck: [club8], bHand: [heart3], bDeck: [club8], piles });
    const p = props(viewOf(stuck, "a"));
    render(<SpeedOnlineView {...p} />);

    await userEvent.click(screen.getByRole("button", { name: "台札を更新" }));
    expect(p.sendAction).toHaveBeenCalledWith({ type: "refill_piles" });
  });

  it("出せるカードがあるときは台札の更新を表示しない", () => {
    render(<SpeedOnlineView {...props(viewOf(stateWith({ aHand: [club8], bHand: [heart10], piles }), "a"))} />);
    expect(screen.queryByRole("button", { name: "台札を更新" })).toBeNull();
  });

  it("終了後は結果と再戦ボタンを表示し、再戦を呼べる", async () => {
    const done = onlineAdapter.reduce(
      stateWith({ aHand: [club8], bHand: [heart10], bDeck: [club2], piles }),
      { type: "play_card", cardId: "clubs-8" },
      "a",
    );
    const p = props(viewOf(done, "a"), { finished: true, result: onlineAdapter.getResult(done) });
    render(<SpeedOnlineView {...p} />);

    expect(screen.getByText("あなたの勝ち！")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "同じルームで再戦" }));
    expect(p.onRematch).toHaveBeenCalled();
  });

  it("再戦後の新しい状態では前の結果が残らない", () => {
    const fresh = viewOf(onlineAdapter.createInitialState(5, PLAYERS), "a");
    render(<SpeedOnlineView {...props(fresh, { finished: false, result: null })} />);
    expect(screen.queryByText("あなたの勝ち！")).toBeNull();
    expect(screen.queryByText("あなたの負け")).toBeNull();
  });
});
