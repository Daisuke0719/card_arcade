import { useCallback, useSyncExternalStore } from "react";

export type Route =
  | { readonly name: "arcade" }
  | { readonly name: "game"; readonly id: string }
  | { readonly name: "not-found"; readonly hash: string };

/**
 * ハッシュだけを使う小さなルータ。
 * react-router を入れない理由:
 * - GitHub Pages でリロードしても 404 にならない（サーバー設定が不要）
 * - 依存を増やさない（参加者が覚えることを増やさない）
 * - バージョン差でつまずかない
 */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "");
  if (path === "" || path === "/") return { name: "arcade" };

  const match = /^\/games\/([a-z0-9-]+)\/?$/.exec(path);
  if (match) return { name: "game", id: match[1] };

  return { name: "not-found", hash: path };
}

export function toHash(route: Route): string {
  switch (route.name) {
    case "arcade":
      return "#/";
    case "game":
      return "#/games/" + route.id;
    default:
      return "#" + route.hash;
  }
}

export function gameHref(id: string): string {
  return "#/games/" + id;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getSnapshot(): string {
  return window.location.hash;
}

export function useRoute(): { route: Route; navigate: (route: Route) => void } {
  const hash = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const navigate = useCallback((next: Route) => {
    window.location.hash = toHash(next);
  }, []);
  return { route: parseHash(hash), navigate };
}
