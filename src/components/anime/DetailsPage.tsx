"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Play, Star, Clock, Layers, ArrowLeft, Calendar } from "lucide-react";
import {
  getAnimeById,
  getSeasons,
  posterUrl,
  formatRating,
  type Anime,
} from "@/lib/anime";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeasonsTab } from "@/components/anime/SeasonsTab";
import { CastButton } from "@/components/anime/CastButton";

export function DetailsPage({ animeId }: { animeId: string }) {
  const anime = useMemo(() => getAnimeById(animeId), [animeId]);
  const go = useApp((s) => s.go);
  const back = useApp((s) => s.back);
  const canGoBack = useApp((s) => s.canGoBack());
  const seasons = useMemo(() => (anime ? getSeasons(anime) : []), [anime]);
  const hasMultipleSeasons = seasons.length > 1;

  if (!anime) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-32 text-center">
        <h1 className="text-2xl font-bold">Anime not found</h1>
        <p className="text-sm text-muted-foreground">
          The title you were looking for isn't in the catalog.
        </p>
        <Button onClick={() => go({ name: "catalog" })}>Back to catalog</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {/* Hero banner */}
      <section className="relative w-full overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0">
          <img
            src={posterUrl(anime)}
            alt=""
            aria-hidden="true"
            className="size-full object-cover opacity-30 blur-2xl scale-110"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${anime.backdropColor}dd 0%, rgba(10,10,10,0.85) 50%, rgba(10,10,10,0.95) 100%)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 lg:pb-16">
          {/* Top bar: Back button (left) + Cast button (right) */}
          <div className="mb-6 flex items-center justify-between gap-2">
            {canGoBack ? (
              <button
                onClick={back}
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm hover:text-foreground hover:border-[var(--brand)]/50"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
            ) : (
              <span />
            )}
            <CastButton
              size={5}
              className="size-10 border-border/60 bg-background/40"
            />
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mx-auto w-40 shrink-0 sm:w-48 md:mx-0 lg:w-56"
            >
              <div className="relative overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/60">
                <img
                  src={posterUrl(anime)}
                  alt={anime.title}
                  className="aspect-[2/3] w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility =
                      "hidden";
                  }}
                />
              </div>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="min-w-0 flex-1"
            >
              <div className="flex flex-wrap items-center gap-2">
                {anime.featured && (
                  <Badge className="bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--brand)]">
                    Featured
                  </Badge>
                )}
                {hasMultipleSeasons && anime.season && (
                  <Badge className="bg-[var(--brand)]/15 text-[var(--brand)] hover:bg-[var(--brand)]/20">
                    Season {anime.season}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="size-3" />
                  {anime.year}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Layers className="size-3" />
                  {anime.episode_count} eps
                </Badge>
              </div>

              <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {anime.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold text-[var(--brand)]">
                  <Star className="size-3.5 fill-current" />
                  {formatRating(anime.rating)}
                </span>
                <span>{anime.studio}</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />~24 min/ep
                </span>
              </div>

              {/* Genres */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {anime.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-border/60 bg-card/40 px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/80 sm:text-base">
                {anime.synopsis}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={() =>
                    go({
                      name: "watch",
                      animeId: anime.id,
                      episode: 1,
                    })
                  }
                  className="gap-2 bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--brand)]/90 shadow-lg shadow-[var(--brand)]/25"
                >
                  <Play className="size-4 fill-current" />
                  Play Episode 1
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Seasons (only shows if multiple seasons exist) */}
      <SeasonsTab anime={anime} />

      {/* Episodes */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Episodes
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {anime.episode_count} episodes · {anime.title}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {anime.episodes.map((ep, i) => (
            <motion.button
              key={ep.ep_num}
              type="button"
              onClick={() =>
                go({
                  name: "watch",
                  animeId: anime.id,
                  episode: ep.ep_num,
                })
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.28,
                delay: Math.min(i * 0.02, 0.4),
                ease: [0.22, 0.61, 0.36, 1],
              }}
              whileHover={{ y: -2 }}
              className="group flex items-center gap-3 overflow-hidden rounded-lg border border-border/50 bg-card/40 p-2 text-left transition-colors hover:border-[var(--brand)]/50 hover:bg-card"
            >
              {/* Thumb */}
              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-muted sm:w-36">
                <img
                  src={posterUrl(anime)}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="flex size-9 items-center justify-center rounded-full bg-[var(--brand)]/90 text-[var(--brand-foreground)] opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                    <Play className="size-4 fill-current" />
                  </span>
                </div>
                <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                  EP {ep.ep_num}
                </span>
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold tracking-tight group-hover:text-[var(--brand)]">
                  Episode {ep.ep_num}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {ep.name.replace(/\.(mp4|mkv|webm)$/i, "")}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

// Re-export the Anime type so other modules can import it from here if needed.
export type { Anime };
