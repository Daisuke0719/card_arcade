import { render, screen } from "@testing-library/react";
import { hand } from "@core";
import { Hand } from "./Hand";

describe("Hand", () => {
  it("表向きの手札を並べる", () => {
    render(<Hand cards={hand("spades-A", "hearts-K")} />);
    expect(screen.getByLabelText("スペードのA")).toBeInTheDocument();
    expect(screen.getByLabelText("ハートのK")).toBeInTheDocument();
  });

  it("variant=hidden では枚数だけを出し、カードを DOM に入れない", () => {
    const { container } = render(<Hand variant="hidden" count={7} label="CPU 1" />);
    expect(screen.getByText("7枚")).toBeInTheDocument();
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("空の手札にはメッセージを出す", () => {
    render(<Hand cards={[]} emptyText="手札がありません" />);
    expect(screen.getByText("手札がありません")).toBeInTheDocument();
  });
});
