"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Play, Calendar, Layers, CheckCircle2 } from "lucide-react";
import {
  getSeasons,
  posterUrl,
  formatRating,
  type Anime,
} from "@/lib/anime";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  anime: Anime;
};

export function SeasonsTab({ anime }: Props) {
  const go = useApp((s) => s.go);
  const seasons = useMemo(() => getSeasons(anime), [anime]);

  // Don't render if only one season (or none)
  if (seasons.length <= 1) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Seasons
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {seasons.length} seasons in this series
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.map((season, i) => {
          const isCurrent = season.id === anime.id;
          const seasonLabel = season.season
            ? `Season ${season.season}`
            : season.title;
          return (
            <motion.button
              key={season.id}
              type="button"
              onClick={() =>
                go({
                  name: "details",
                  animeId: season.id,
                })
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.28,
                delay: Math.min(i * 0.04, 0.4),
                ease: [0.22, 0.61, 0.36, 1],
              }}
              whileHover={{ y: -2 }}
              className={cn(
                "group flex items-center gap-3 overflow-hidden rounded-lg border bg-card/40 p-2 text-left transition-colors hover:bg-card",
                isCurrent
                  ? "border-[var(--brand)]/60 ring-1 ring-[var(--brand)]/30"
                  : "border-border/50 hover:border-[var(--brand)]/50",
              )}
            >
              {/* Poster thumbnail */}
              <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-md bg-muted sm:w-20">
                <img
                  src={posterUrl(season)}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
                {isCurrent && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <CheckCircle2 className="size-5 text-[var(--brand)]" />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[var(--brand)]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand)]">
                    {season.season ? `S${season.season}` : "S1"}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand)]">
                      Watching
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-sm font-semibold tracking-tight group-hover:text-[var(--brand)]">
                  {seasonLabel}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {season.year}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="size-3" />
                    {season.episode_count} eps
                  </span>
                  <span className="font-semibold text-[var(--brand)]">
                    ★ {formatRating(season.rating)}
                  </span>
                </div>
              </div>

              {/* Play icon */}
              {!isCurrent && (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Play className="size-4 fill-current" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Quick watch buttons for each season */}
      <div className="mt-4 flex flex-wrap gap-2">
        {seasons.map((season) => {
          const isCurrent = season.id === anime.id;
          return (
            <button
              key={season.id}
              onClick={() =>
                go({
                  name: "watch",
                  animeId: season.id,
                  episode: 1,
                })
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                isCurrent
                  ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-foreground)]"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:border-[var(--brand)]/50 hover:text-foreground",
              )}
            >
              <Play className="size-3 fill-current" />
              {season.season ? `S${season.season}` : "S1"} · Ep 1
            </button>
          );
        })}
      </div>
    </section>
  );
}
