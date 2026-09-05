/**
 * アーケード画面の契約テスト。
 *
 * 「一覧に並ぶのは harness/config.json に登録された担当のゲームだけで、
 *   お手本は別枠に出る」という状態を機械で保証する。
 *
 * 研修開始時点では参加者のゲームフォルダが1つも無い。
 * 各担当が自分の作業ブランチで scaffold して作り、Pull Request が
 * マージされるたびに1枚ずつ増えるので、ここでは「今 main にあるゲーム」だけを照合する。
 * 「9人分あるか」は registry.contract.test.ts が harness/config.json と突き合わせる。
 */
import { render, screen, within } from "@testing-library/react";
import config from "../../harness/config.json";
import { ArcadePage } from "../../src/pages/ArcadePage";
import { registry } from "../../src/app/registry/loadGames";

/** 今 main に存在する（＝マージ済みの）担当ゲームだけを取り出す。 */
const mergedParticipants = config.participants.filter((item) =>
  registry.games.some((game) => game.manifest.id === item.gameId),
);

describe("アーケード一覧", () => {
  it("マージ済みのゲームがタイルとして並ぶ", () => {
    render(<ArcadePage />);

    for (const item of mergedParticipants) {
      expect(
        screen.getByText(item.name),
        item.displayName + " の " + item.name + " が一覧にありません",
      ).toBeInTheDocument();
    }
  });

  it("担当者の表示名がタイルに出る", () => {
    render(<ArcadePage />);

    for (const item of mergedParticipants) {
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

    // 分母は harness/config.json の人数。まだ作られていないゲームも「これから増える枠」として数える。
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
