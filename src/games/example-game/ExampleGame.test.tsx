import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExampleGame } from "./ExampleGame";
import { game } from ".";

describe("ExampleGame", () => {
  it("ゲームの外枠（GameShell）を使って描画される", () => {
    render(<ExampleGame manifest={game} onExit={() => {}} />);
    expect(screen.getByTestId("game-shell")).toBeInTheDocument();
  });

  it("HIGH を押すと自分と CPU の予想が表示される", async () => {
    render(<ExampleGame manifest={game} onExit={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "HIGH ↑" }));

    expect(screen.getByText("あなた: HIGH")).toBeInTheDocument();
    expect(screen.getByText(/^CPU: (HIGH|LOW)$/)).toBeInTheDocument();
  });

  it("判定中は HIGH / LOW を押せない（連打で先に進めない）", async () => {
    render(<ExampleGame manifest={game} onExit={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "HIGH ↑" }));

    expect(screen.getByRole("button", { name: "HIGH ↑" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "LOW ↓" })).toBeDisabled();
  });
});
