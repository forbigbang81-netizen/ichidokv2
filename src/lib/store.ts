/**
 * Zustand store for client-side navigation.
 * The sandbox preview only exposes the `/` route, so we run an in-app router
 * based on view state. On Vercel this still works perfectly — it behaves
 * like a SPA, and the URL hash is synced for shareable links.
 */
import { create } from "zustand";

export type View =
  | { name: "home" }
  | { name: "catalog"; initialQuery?: string }
  | { name: "details"; animeId: string }
  | { name: "watch"; animeId: string; episode: number; seasonIndex?: number };

type AppState = {
  view: View;
  history: View[];
  // navigation
  go: (view: View) => void;
  back: () => void;
  canGoBack: () => boolean;
};

function parseHash(): View | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hash.replace(/^#\/?/, "");
  if (!h) return null;
  const [path, query] = h.split("?");
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "catalog") return { name: "catalog" };
  if (parts[0] === "anime" && parts[1]) return { name: "details", animeId: decodeURIComponent(parts[1]) };
  if (parts[0] === "watch" && parts[1]) {
    const params = new URLSearchParams(query || "");
    const ep = parseInt(params.get("ep") || "1", 10);
    const seasonIdx = params.get("s") ? parseInt(params.get("s")!, 10) : undefined;
    return { name: "watch", animeId: decodeURIComponent(parts[1]), episode: ep || 1, seasonIndex: seasonIdx };
  }
  return null;
}

function toHash(view: View): string {
  switch (view.name) {
    case "home":
      return "#/";
    case "catalog":
      return "#/catalog";
    case "details":
      return `#/anime/${encodeURIComponent(view.animeId)}`;
    case "watch": {
      const q = new URLSearchParams();
      q.set("ep", String(view.episode));
      if (view.seasonIndex !== undefined) q.set("s", String(view.seasonIndex));
      return `#/watch/${encodeURIComponent(view.animeId)}?${q.toString()}`;
    }
  }
}

const initialView: View =
  (typeof window !== "undefined" && parseHash()) || { name: "home" };

export const useApp = create<AppState>((set, get) => ({
  view: initialView,
  history: [],
  go: (view) => {
    const { view: current, history } = get();
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", toHash(view));
    }
    set({ view, history: [...history, current] });
    // scroll to top on view change
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  },
  back: () => {
    const { history } = get();
    if (history.length > 0) {
      const prev = history[history.length - 1];
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", toHash(prev));
      }
      set({ view: prev, history: history.slice(0, -1) });
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
    } else if (typeof window !== "undefined") {
      // fallback to home
      window.history.pushState(null, "", "#/");
      set({ view: { name: "home" } });
    }
  },
  canGoBack: () => get().history.length > 0,
}));

// Sync browser back/forward with the store
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    const v = parseHash();
    if (v) {
      useApp.setState({ view: v });
    }
  });
}
