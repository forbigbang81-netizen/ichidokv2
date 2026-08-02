"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { filterAnime } from "@/lib/anime";
import { AnimePoster } from "./AnimePoster";

/**
 * SearchOverlay — full-screen search overlay triggered by the navbar search button.
 * Shows a large search input at the top of the screen with live results below.
 * Closes on Escape, backdrop click, or selecting a result.
 */
export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const go = useApp((s) => s.go);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (open) {
      // small delay to let the overlay render
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Reset query when overlay closes — uses the "adjust state during render"
  // pattern (track previous open state and clear on transition).
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open && query !== "") setQuery("");
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return filterAnime({ query: q, sort: "popularity" }).slice(0, 12);
  }, [query]);

  if (!open) return null;

  const selectAnime = (id: string) => {
    go({ name: "details", animeId: id });
    onClose();
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      go({ name: "catalog", initialQuery: query });
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full max-w-[900px] flex-col px-4 py-6 md:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <form onSubmit={submitSearch} className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an anime — title, genre, studio..."
            className="w-full border border-border bg-card py-4 pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:text-lg"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </form>

        {/* Results */}
        <div className="mt-4 flex-1 overflow-y-auto">
          {query.trim() === "" ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Start typing to search {`${"\u00A0"}`}the catalog
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No matches for "{query}"
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {results.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => selectAnime(a.id)}
                    className="group flex items-center gap-3 border border-border bg-card p-2.5 text-left hover:bg-foreground hover:text-background"
                  >
                    <div className="h-14 w-10 shrink-0 overflow-hidden border border-border">
                      <AnimePoster
                        title={a.title}
                        poster={a.poster}
                        imageUrl={a.image_url}
                        className="h-full w-full"
                        showTitle={false}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold">
                        {a.title}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider opacity-60">
                        {a.year} · {a.studio} · {a.totalEpisodes} ep
                      </p>
                    </div>
                    <span className="text-[10px] tabular-nums opacity-60">
                      {a.rating.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={submitSearch}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-border bg-card py-3 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background"
              >
                See all results for "{query}" <ArrowRight className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
