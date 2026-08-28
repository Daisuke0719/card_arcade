import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { card, joker } from "@core";
import { Card } from "./Card";

describe("Card", () => {
  it("表向きのときは aria-label が「スペードのA」になる", () => {
    render(<Card card={card("spades", "A")} face="up" />);
    expect(screen.getByLabelText("スペードのA")).toBeInTheDocument();
  });

  it("裏向きのときはスートもランクも DOM に出さない（カンニング防止）", () => {
    const { container } = render(<Card card={card("hearts", "K")} face="down" />);
    expect(screen.getByLabelText("裏向きのカード")).toBeInTheDocument();
    expect(container.textContent).not.toContain("K");
    expect(container.textContent).not.toContain("♥");
    expect(container.innerHTML).not.toContain("hearts");
  });

  it("ジョーカーはジョーカーとして読み上げられる", () => {
    render(<Card card={joker("red")} face="up" />);
    expect(screen.getByLabelText("ジョーカー(赤)")).toBeInTheDocument();
  });

  it("カードを省略すると空きスロットになる", () => {
    render(<Card />);
    expect(screen.getByLabelText("空きスロット")).toBeInTheDocument();
  });

  it("クリックできる", async () => {
    const onClick = vi.fn();
    render(<Card card={card("clubs", "3")} onClick={onClick} />);
    await userEvent.click(screen.getByLabelText("クラブの3"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled のときはクリックしても反応しない", async () => {
    const onClick = vi.fn();
    render(<Card card={card("clubs", "3")} onClick={onClick} disabled />);
    await userEvent.click(screen.getByLabelText("クラブの3"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
