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
    await expect(createSession("https://api.example", "ゲスト")).rejects.toMatchObject({ kind: "cors" });
  });
});
