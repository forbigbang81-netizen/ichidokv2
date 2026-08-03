/**
 * Ichidoki — client-side hash router.
 *
 * The sandbox preview only exposes the `/` route, so we run an in-app
 * router based on view state. The URL hash stays in sync so links are
 * shareable and the browser back/forward buttons work everywhere.
 *
 * Hash format:
 *   #/                         home
 *   #/catalog                  catalog
 *   #/anime/<id>               details
 *   #/watch/<id>?ep=<n>        watch
 */
import { create } from "zustand";

export type View =
  | { name: "home" }
  | { name: "catalog"; initialQuery?: string }
  | { name: "details"; animeId: string }
  | { name: "watch"; animeId: string; episode: number }
  | { name: "ichiflix" }
  | { name: "movie"; movieId: string };

type AppState = {
  view: View;
  history: View[];
  /** Navigate to a new view (pushes onto history). */
  go: (view: View) => void;
  /** Navigate to a new view, replacing the current entry (no history push). */
  replace: (view: View) => void;
  /** Go back one step in history. */
  back: () => void;
  /** Whether there's a view to go back to. */
  canGoBack: () => boolean;
};

function parseHash(): View | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hash.replace(/^#\/?/, "");
  if (!h) return null;
  const [path, query] = h.split("?");
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "catalog") {
    const params = new URLSearchParams(query || "");
    const q = params.get("q");
    return { name: "catalog", initialQuery: q ?? undefined };
  }
  if (parts[0] === "anime" && parts[1]) {
    return { name: "details", animeId: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === "watch" && parts[1]) {
    const params = new URLSearchParams(query || "");
    const ep = parseInt(params.get("ep") || "1", 10);
    return {
      name: "watch",
      animeId: decodeURIComponent(parts[1]),
      episode: ep || 1,
    };
  }
  if (parts[0] === "ichiflix") return { name: "ichiflix" };
  if (parts[0] === "movie" && parts[1]) return { name: "movie", movieId: decodeURIComponent(parts[1]) };
  return null;
}

export function toHash(view: View): string {
  switch (view.name) {
    case "home":
      return "#/";
    case "catalog":
      return view.initialQuery
        ? `#/catalog?q=${encodeURIComponent(view.initialQuery)}`
        : "#/catalog";
    case "details":
      return `#/anime/${encodeURIComponent(view.animeId)}`;
    case "watch": {
      const q = new URLSearchParams();
      q.set("ep", String(view.episode));
      return `#/watch/${encodeURIComponent(view.animeId)}?${q.toString()}`;
    }
    case "ichiflix":
      return "#/ichiflix";
    case "movie":
      return `#/movie/${encodeURIComponent(view.movieId)}`;
  }
}

function scrollTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

const initialView: View =
  (typeof window !== "undefined" && parseHash()) || { name: "home" };

export const useApp = create<AppState>((set, get) => ({
  view: initialView,
  history: [],
  go: (view) => {
    const { view: current, history } = get();
    if (typeof window !== "undefined") {
      window.history.pushState({ view }, "", toHash(view));
    }
    set({ view, history: [...history, current] });
    scrollTop();
  },
  replace: (view) => {
    if (typeof window !== "undefined") {
      window.history.replaceState({ view }, "", toHash(view));
    }
    set({ view });
    scrollTop();
  },
  back: () => {
    const { history } = get();
    if (history.length > 0) {
      const prev = history[history.length - 1];
      if (typeof window !== "undefined") {
        window.history.pushState({ view: prev }, "", toHash(prev));
      }
      set({ view: prev, history: history.slice(0, -1) });
      scrollTop();
    } else if (typeof window !== "undefined") {
      window.history.pushState({ view: { name: "home" } }, "", "#/");
      set({ view: { name: "home" } });
      scrollTop();
    }
  },
  canGoBack: () => get().history.length > 0,
}));

// Keep the store in sync with browser back/forward.
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    const v = parseHash();
    if (v) useApp.setState({ view: v });
  });
}
