import { afterEach, describe, expect, it, vi } from "vitest";
import { OnlineApiError, createRoom, createSession } from "./apiClient";

afterEach(() => vi.unstubAllGlobals());

describe("online API client", () => {
  it("creates an anonymous session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ token: "t", playerId: "p" }), { status: 200 })));
    await expect(createSession("https://api.example", "ゲスト")).resolves.toEqual({ token: "t", playerId: "p" });
  });

  it("preserves the server error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "オンライン認証が未設定です" }), { status: 503 })));
    await expect(createRoom("https://api.example", { token: "t", playerId: "p" })).rejects.toMatchObject({ kind: "http", status: 503, message: "オンライン認証が未設定です" });
  });

  it("classifies an unreachable API separately from an HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(createSession("https://api.example", "ゲスト")).rejects.toBeInstanceOf(OnlineApiError);
    await expect(createSession("https://api.example", "ゲスト")).rejects.toMatchObject({ kind: "connection" });
  });

  it("normalizes room codes without changing what the user typed", async () => {
    const fetchMock = vi.fn().mockImplementation(() => new Response(JSON.stringify({ roomId: "ab12cd34", token: "t", websocketPath: "/v1/rooms/ab12cd34/ws" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await createRoom("https://api.example", { token: "t", playerId: "p" });
    await import("./apiClient").then(({ joinRoom }) => joinRoom("https://api.example", { token: "t", playerId: "p" }, " AB12CD34 "));
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.example/v1/rooms/ab12cd34/join");
  });
});
