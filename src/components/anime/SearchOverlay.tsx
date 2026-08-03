"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, CornerDownLeft } from "lucide-react";
import { searchAnime, posterUrl, formatRating } from "@/lib/anime";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Full-screen search overlay.
 * - Auto-focuses the input
 * - Live results with anime posters
 * - Keyboard: ↑/↓ to move selection, Enter to open, Esc to close
 * - Backdrop click closes
 */
export function SearchOverlay({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const go = useApp((s) => s.go);

  const results = useMemo(() => searchAnime(query), [query]);

  // Reset the selected index whenever the query changes — done in the change
  // handler (not an effect) to avoid cascading renders.
  const changeQuery = useCallback((q: string) => {
    setQuery(q);
    setActiveIndex(0);
  }, []);

  // Close + clear the overlay. Centralised so every close path (backdrop,
  // Esc, X) also resets the query.
  const close = useCallback(() => {
    setQuery("");
    setActiveIndex(0);
    onOpenChange(false);
  }, [onOpenChange]);

  // Focus input + lock body scroll when opened
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const picked = results[activeIndex];
        if (picked) {
          close();
          go({ name: "details", animeId: picked.id });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, activeIndex, close, go]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/95 backdrop-blur-xl"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            onClick={close}
          />

          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative z-10 mt-[8vh] w-full max-w-2xl px-4"
          >
            {/* Input */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-2xl shadow-black/40">
              <Search className="size-5 shrink-0 text-[var(--brand)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
                placeholder="Search anime…"
                className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/70"
              />
              <button
                onClick={close}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close search"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Results */}
            <div className="mt-3 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card/80 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
              {query.trim() === "" && (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  Type to search across the whole Ichidoki catalog.
                </div>
              )}

              {query.trim() !== "" && results.length === 0 && (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No results for{" "}
                  <span className="font-medium text-foreground">
                    “{query}”
                  </span>
                  .
                </div>
              )}

              <ul className="space-y-1">
                {results.map((a, i) => (
                  <li key={a.id}>
                    <button
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => {
                        close();
                        go({ name: "details", animeId: a.id });
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                        activeIndex === i
                          ? "bg-accent"
                          : "hover:bg-accent/60",
                      )}
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        <img
                          src={posterUrl(a)}
                          alt={a.title}
                          loading="lazy"
                          className="size-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{a.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.year} · {a.studio} · {a.genres.slice(0, 3).join(", ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded bg-brand-muted px-1.5 py-0.5 font-mono text-[var(--brand)]">
                          ★ {formatRating(a.rating)}
                        </span>
                        <span className="hidden sm:inline">
                          {a.episode_count} eps
                        </span>
                        {activeIndex === i && (
                          <CornerDownLeft className="size-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>{" "}
              navigate ·{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>{" "}
              open ·{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Esc
              </kbd>{" "}
              close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
