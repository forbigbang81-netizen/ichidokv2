"use client";
import { useMemo, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  filterAnime,
  getGenres,
  getStudios,
  getYears,
  type Filters,
  type Anime,
} from "@/lib/anime";
import { AnimeCard } from "./AnimeCard";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

const SORTS = [
  { id: "popularity", label: "Popularity" },
  { id: "rating", label: "Rating" },
  { id: "year-desc", label: "Newest" },
  { id: "year-asc", label: "Oldest" },
  { id: "title", label: "A–Z" },
] as const;

const TYPES = ["TV", "Movie", "OVA", "ONA"];
const STATUSES = ["Finished", "Ongoing", "Upcoming"];

export function CatalogPage({ initialQuery }: { initialQuery?: string }) {
  const genres = getGenres();
  const studios = getStudios();
  const years = getYears();

  const [query, setQuery] = useState(initialQuery ?? "");
  const [genre, setGenre] = useState<string>("all");
  const [year, setYear] = useState<number | "all">("all");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [studio, setStudio] = useState<string>("all");
  const [sort, setSort] = useState<Filters["sort"]>("popularity");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  const filters: Filters = {
    query,
    genre,
    year,
    type,
    status,
    studio,
    sort,
  };

  const results = useMemo(() => filterAnime(filters), [
    query,
    genre,
    year,
    type,
    status,
    studio,
    sort,
  ]);

  const activeCount =
    (genre !== "all" ? 1 : 0) +
    (year !== "all" ? 1 : 0) +
    (type !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (studio !== "all" ? 1 : 0);

  const reset = () => {
    setGenre("all");
    setYear("all");
    setType("all");
    setStatus("all");
    setStudio("all");
    setSort("popularity");
  };

  // Reset pagination when any filter changes — using the
  // "adjust state during render" pattern rather than useEffect.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const filterKey = `${query}|${genre}|${year}|${type}|${status}|${studio}|${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setVisible(PAGE_SIZE);
  }

  return (
    <div className="view-enter mx-auto max-w-[1400px] px-6 py-8 md:px-10">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Catalog
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
          Browse the library
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {results.length} title{results.length === 1 ? "" : "s"} match your filters.
        </p>
      </div>

      {/* Search + filter toggle */}
      <div className="sticky top-[56px] z-20 -mx-6 mt-4 border-b border-border bg-background/85 px-6 py-3 backdrop-blur md:-mx-10 md:px-10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, synopsis, studio..."
              className="w-full border border-border bg-card py-2 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 border border-border bg-card px-3 py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors",
              showFilters && "bg-foreground text-background",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center bg-background px-1 text-[9px] text-foreground">
                {activeCount}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-1 border border-border bg-card p-0.5 md:flex">
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id as Filters["sort"])}
                className={cn(
                  "px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  sort === s.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile sort dropdown */}
        <div className="mt-2 flex items-center gap-1 overflow-x-auto md:hidden">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id as Filters["sort"])}
              className={cn(
                "shrink-0 border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                sort === s.id
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 md:grid-cols-5">
            <FilterSelect
              label="Genre"
              value={genre}
              onChange={setGenre}
              options={[{ value: "all", label: "All genres" }, ...genres.map((g) => ({ value: g, label: g }))]}
            />
            <FilterSelect
              label="Year"
              value={String(year)}
              onChange={(v) => setYear(v === "all" ? "all" : parseInt(v, 10))}
              options={[{ value: "all", label: "All years" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
            />
            <FilterSelect
              label="Type"
              value={type}
              onChange={setType}
              options={[{ value: "all", label: "All types" }, ...TYPES.map((t) => ({ value: t, label: t }))]}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={[{ value: "all", label: "All statuses" }, ...STATUSES.map((t) => ({ value: t, label: t }))]}
            />
            <FilterSelect
              label="Studio"
              value={studio}
              onChange={setStudio}
              options={[{ value: "all", label: "All studios" }, ...studios.map((s) => ({ value: s, label: s }))]}
            />

            {activeCount > 0 && (
              <button
                onClick={reset}
                className="col-span-2 inline-flex items-center justify-center gap-1 border border-border bg-card py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background md:col-span-1"
              >
                <X className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active chips */}
      {activeCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {genre !== "all" && <Chip label={`Genre: ${genre}`} onClear={() => setGenre("all")} />}
          {year !== "all" && <Chip label={`Year: ${year}`} onClear={() => setYear("all")} />}
          {type !== "all" && <Chip label={`Type: ${type}`} onClear={() => setType("all")} />}
          {status !== "all" && <Chip label={`Status: ${status}`} onClear={() => setStatus("all")} />}
          {studio !== "all" && <Chip label={`Studio: ${studio}`} onClear={() => setStudio("all")} />}
        </div>
      )}

      {/* Grid */}
      <div className="mt-6">
        {results.length === 0 ? (
          <div className="border border-dashed border-border py-20 text-center">
            <p className="text-sm font-semibold">No matches.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try removing a filter or searching for something else.
            </p>
            <button
              onClick={reset}
              className="mt-4 inline-flex items-center gap-1 border border-border bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
              {results.slice(0, visible).map((a: Anime) => (
                <AnimeCard key={a.id} anime={a} />
              ))}
            </div>

            {visible < results.length && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="inline-flex items-center gap-1.5 border border-border bg-card px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
                >
                  Load more ({results.length - visible} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border bg-card px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 border border-border bg-card px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
      {label}
      <button
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground"
        aria-label={`Clear ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
