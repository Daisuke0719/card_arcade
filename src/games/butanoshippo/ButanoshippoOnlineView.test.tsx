import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { card } from "@core";
import { game } from ".";
import { ButanoshippoOnlineView } from "./ButanoshippoOnlineView";
import type { ButanoshippoView } from "./onlineAdapter";

const baseView: ButanoshippoView = {
  ringCount: 40,
  pileCount: 1,
  pileTop: card("spades", "7"),
  players: [
    { id: "a", name: "アリス", collected: 0 },
    { id: "b", name: "ボブ", collected: 3 },
  ],
  currentPlayerId: "a",
  phase: "playing",
  lastCollectorId: null,
  canFlip: true,
};

function renderView(overrides: Partial<ButanoshippoView> = {}, canAct = true, sendAction = vi.fn()) {
  render(
    <ButanoshippoOnlineView
      manifest={game}
      view={{ ...baseView, ...overrides }}
      playerId="a"
      players={[]}
      canAct={canAct}
      finished={false}
      result={null}
      sendAction={sendAction}
      onExit={() => {}}
    />,
  );
  return sendAction;
}

describe("ButanoshippoOnlineView", () => {
  it("輪は ringCount 枚の裏向きで描画され、カードの中身が DOM に出ない", () => {
    renderView();

    expect(screen.getAllByLabelText("裏向きのカード")).toHaveLength(40);
    expect(screen.getByText("残り 40 枚")).toBeInTheDocument();
  });

  it("手番のとき先頭のカードを押すと flip を送る", async () => {
    const sendAction = renderView();

    await userEvent.click(screen.getAllByLabelText("裏向きのカード")[0]);

    expect(sendAction).toHaveBeenCalledWith({ type: "flip" });
  });

  it("canAct が false の間は操作を送らない", async () => {
    const sendAction = renderView({}, false);

    await userEvent.click(screen.getAllByLabelText("裏向きのカード")[0]);

    expect(sendAction).not.toHaveBeenCalled();
  });

  it("手番外のときは操作を送らず、相手の手番を表示する", async () => {
    const sendAction = renderView({ canFlip: false, currentPlayerId: "b" });

    await userEvent.click(screen.getAllByLabelText("裏向きのカード")[0]);

    expect(sendAction).not.toHaveBeenCalled();
    expect(screen.getByText("ボブ の手番です")).toBeInTheDocument();
  });
});
