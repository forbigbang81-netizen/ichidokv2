"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { getAllAnime, getGenres, type Anime } from "@/lib/anime";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  initialQuery?: string;
};

const PAGE_SIZE = 18;

type SortKey = "popularity" | "rating" | "title" | "year";

export function CatalogPage({ initialQuery }: Props) {
  const all = useMemo(() => getAllAnime(), []);
  const genres = useMemo(() => ["All", ...getGenres()], []);
  const [query, setQuery] = useState(initialQuery ?? "");
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState<SortKey>("popularity");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  // Reset pagination to the first page whenever any filter changes.
  // Done through the change handlers (not an effect) to keep renders tight.
  const changeQuery = (q: string) => {
    setQuery(q);
    setVisible(PAGE_SIZE);
  };
  const changeGenre = (g: string) => {
    setGenre(g);
    setVisible(PAGE_SIZE);
  };
  const changeSort = (s: SortKey) => {
    setSort(s);
    setVisible(PAGE_SIZE);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = all;
    if (q) {
      list = list.filter((a) =>
        [a.title, a.studio, a.synopsis, ...a.genres]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    if (genre !== "All") {
      list = list.filter((a) => a.genres.includes(genre));
    }
    const sorted = [...list];
    switch (sort) {
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "year":
        sorted.sort((a, b) => b.year - a.year);
        break;
      case "popularity":
      default:
        sorted.sort((a, b) => a.popularity - b.popularity);
        break;
    }
    return sorted;
  }, [all, query, genre, sort]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Catalog
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "title" : "titles"} ·
          stream every episode free.
        </p>
      </motion.div>

      {/* Search + filter toggle */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="Search titles, studios, genres…"
            className="h-11 rounded-lg border-border/70 bg-card/60 pl-9 pr-9"
          />
          {query && (
            <button
              onClick={() => changeQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters((v) => !v)}
          className="h-11 justify-start gap-2 sm:w-auto"
        >
          <SlidersHorizontal className="size-4" />
          Filters
        </Button>
      </div>

      {/* Filters panel */}
      <motion.div
        initial={false}
        animate={{
          height: showFilters ? "auto" : 0,
          opacity: showFilters ? 1 : 0,
        }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div className="mb-2 flex flex-col gap-4 rounded-lg border border-border/60 bg-card/40 p-4 sm:flex-row sm:items-center sm:gap-6">
          {/* Genres */}
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Genre
            </p>
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => changeGenre(g)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    genre === g
                      ? "bg-[var(--brand)] text-[var(--brand-foreground)]"
                      : "bg-secondary text-secondary-foreground hover:bg-accent",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="sm:w-44">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Sort by
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["popularity", "Popular"],
                  ["rating", "Rating"],
                  ["year", "Newest"],
                  ["title", "A–Z"],
                ] as [SortKey, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => changeSort(k)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    sort === k
                      ? "bg-foreground text-background"
                      : "bg-secondary text-secondary-foreground hover:bg-accent",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid */}
      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-24 text-center">
          <p className="text-lg font-semibold">No results</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different title, studio, or clear your filters.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              changeQuery("");
              changeGenre("All");
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {shown.map((a: Anime, i: number) => (
            <AnimeCard key={a.id} anime={a} index={i} className="w-full" />
          ))}
        </div>
      )}

      {/* Load more */}
      {visible < filtered.length && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="h-11 px-8"
          >
            Load more
            <span className="ml-2 text-xs text-muted-foreground">
              ({filtered.length - visible} left)
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
