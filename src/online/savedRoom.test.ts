import { afterEach, describe, expect, it } from "vitest";
import { clearSavedRoom, loadSavedRoom, saveRoom } from "./savedRoom";

const saved = {
  name: "たろう",
  session: { token: "session-token", playerId: "p1" },
  room: { roomId: "ab12cd34", token: "session-token", websocketPath: "/v1/rooms/ab12cd34/ws" },
};

afterEach(() => sessionStorage.clear());

describe("再読み込み後の復帰用の記録", () => {
  it("保存したルームをゲームごとに読み戻せる", () => {
    saveRoom("pageone", saved);
    expect(loadSavedRoom("pageone")).toEqual(saved);
    expect(loadSavedRoom("doubt")).toBeNull();
  });

  it("退出したら記録を消す", () => {
    saveRoom("pageone", saved);
    clearSavedRoom("pageone");
    expect(loadSavedRoom("pageone")).toBeNull();
  });

  it("壊れた記録は無視する", () => {
    sessionStorage.setItem("card-arcade:online:pageone", "{broken");
    expect(loadSavedRoom("pageone")).toBeNull();
    sessionStorage.setItem("card-arcade:online:pageone", JSON.stringify({ name: "x" }));
    expect(loadSavedRoom("pageone")).toBeNull();
  });
});
