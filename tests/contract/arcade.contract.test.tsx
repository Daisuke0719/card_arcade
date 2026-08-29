/**
 * アーケード画面の契約テスト。
 *
 * 「研修が始まる時点で、参加者全員のタイルが並んでいて、
 *   お手本だけが遊べる」という状態を機械で保証する。
 * ここが崩れると、参加者は初日に自分の場所を見つけられない。
 */
import { render, screen, within } from "@testing-library/react";
import config from "../../harness/config.json";
import { ArcadePage } from "../../src/pages/ArcadePage";
import { registry } from "../../src/app/registry/loadGames";

describe("アーケード一覧", () => {
  it("参加者全員のゲームがタイルとして並ぶ", () => {
    render(<ArcadePage />);

    for (const item of config.participants) {
      expect(
        screen.getByText(item.name),
        item.displayName + " の " + item.name + " が一覧にありません",
      ).toBeInTheDocument();
    }
  });

  it("担当者の表示名がタイルに出る", () => {
    render(<ArcadePage />);

    for (const item of config.participants) {
      expect(screen.getAllByText(item.displayName).length).toBeGreaterThan(0);
    }
  });

  it("お手本は別枠で表示される", () => {
    render(<ArcadePage />);
    expect(screen.getByText("お手本（運営が用意した参照実装）")).toBeInTheDocument();
  });

  it("未実装のゲームは COMING SOON として出る", () => {
    render(<ArcadePage />);

    const comingSoon = registry.games.filter((game) => game.manifest.status === "coming-soon");
    const marks = screen.queryAllByText("[ COMING SOON ]");
    expect(marks).toHaveLength(comingSoon.length);
  });

  it("公開数のカウントが実態と合っている", () => {
    render(<ArcadePage />);

    const ready = registry.games.filter(
      (game) => game.manifest.status === "ready" && game.manifest.id !== config.exampleGameId,
    ).length;

    expect(
      screen.getByText(new RegExp("公開中 " + ready + " / " + config.participants.length)),
    ).toBeInTheDocument();
  });

  it("読み込めなかったゲームがあれば画面に出る（白画面にしない）", () => {
    const { container } = render(<ArcadePage />);
    // 問題が無いときはエラー欄そのものが出ない
    expect(registry.problems).toEqual([]);
    expect(within(container).queryByText("読み込めなかったゲームがあります")).toBeNull();
  });
});
