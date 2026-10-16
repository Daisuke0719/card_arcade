import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ButanoshippoGame } from "./ButanoshippoGame";
import { game } from ".";

describe("ButanoshippoGame", () => {
  it("輪の52枚が裏向きで並び、カードの中身が DOM に出ない", () => {
    render(<ButanoshippoGame manifest={game} onExit={() => {}} />);

    expect(screen.getAllByLabelText("裏向きのカード")).toHaveLength(52);
    expect(screen.queryByLabelText(/^(スペード|ハート|ダイヤ|クラブ)の/)).toBeNull();
  });

  it("先頭のカードをめくると場札が1枚になり、輪が51枚に減る", async () => {
    render(<ButanoshippoGame manifest={game} onExit={() => {}} />);

    await userEvent.click(screen.getAllByLabelText("裏向きのカード")[0]);

    expect(screen.getAllByLabelText("裏向きのカード")).toHaveLength(51);
    expect(screen.getByText("1枚")).toBeInTheDocument();
  });
});
