"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  ListVideo,
  Star,
  Calendar,
  Layers,
} from "lucide-react";
import {
  getAnimeById,
  posterUrl,
  formatRating,
  type Anime,
  type Episode,
} from "@/lib/anime";
import { useApp } from "@/lib/store";
import { CustomPlayer } from "@/components/anime/CustomPlayer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  animeId: string;
  episode: number;
};

export function WatchPage({ animeId, episode }: Props) {
  const anime = useMemo(() => getAnimeById(animeId), [animeId]);
  const go = useApp((s) => s.go);
  const back = useApp((s) => s.back);
  const canGoBack = useApp((s) => s.canGoBack());
  const replace = useApp((s) => s.replace);

  // Current + prev/next episodes.
  const current = useMemo(
    () => anime?.episodes.find((e) => e.ep_num === episode),
    [anime, episode],
  );
  const prevEp = useMemo(
    () =>
      anime?.episodes.find((e) => e.ep_num === episode - 1),
    [anime, episode],
  );
  const nextEp = useMemo(
    () => anime?.episodes.find((e) => e.ep_num === episode + 1),
    [anime, episode],
  );

  // Update document title for nicer browser tab / share.
  useEffect(() => {
    if (anime && current) {
      document.title = `${anime.title} — Ep ${current.ep_num} · Ichidoki`;
    }
    return () => {
      document.title = "Ichidoki — Stream Anime";
    };
  }, [anime, current]);

  if (!anime || !current) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-32 text-center">
        <h1 className="text-2xl font-bold">Episode not found</h1>
        <p className="text-sm text-muted-foreground">
          This episode isn&apos;t available. Pick another from the catalog.
        </p>
        <Button onClick={() => go({ name: "catalog" })}>Browse catalog</Button>
      </div>
    );
  }

  const navigateEp = (ep: Episode | undefined) => {
    if (!ep) return;
    // Replace history (so back doesn't step through every watched ep).
    replace({ name: "watch", animeId: anime.id, episode: ep.ep_num });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* Back */}
      <div className="mb-4 flex items-center gap-2">
        {canGoBack ? (
          <button
            onClick={back}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted-foreground hover:border-[var(--brand)]/50 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        ) : (
          <button
            onClick={() => go({ name: "details", animeId: anime.id })}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted-foreground hover:border-[var(--brand)]/50 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Details
          </button>
        )}
        <button
          onClick={() => go({ name: "details", animeId: anime.id })}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {anime.title}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Player + info */}
        <div className="lg:col-span-2">
          <CustomPlayer
            key={current.ep_num}
            title={anime.title}
            subtitle={`Episode ${current.ep_num} — ${current.name.replace(/\.(mp4|mkv|webm)$/i, "")}`}
            src={current.url}
            poster={posterUrl(anime)}
            hasPrev={Boolean(prevEp)}
            hasNext={Boolean(nextEp)}
            onPrev={() => navigateEp(prevEp)}
            onNext={() => navigateEp(nextEp)}
            onEnded={() => {
              if (nextEp) navigateEp(nextEp);
            }}
          />

          {/* Title + meta */}
          <div className="mt-4">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Episode {current.ep_num}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {current.name.replace(/\.(mp4|mkv|webm)$/i, "")} · {anime.title}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-[var(--brand)]">
                <Star className="size-3.5 fill-current" />
                {formatRating(anime.rating)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" /> {anime.year}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="size-3.5" /> {anime.episode_count} eps
              </span>
              <span>{anime.studio}</span>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/80">
              {anime.synopsis}
            </p>

            {/* Prev / Next */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigateEp(prevEp)}
                disabled={!prevEp}
                className="gap-2"
              >
                <ChevronLeft className="size-4" />
                Prev
                {prevEp && (
                  <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">
                    Ep {prevEp.ep_num}
                  </span>
                )}
              </Button>
              <Button
                onClick={() => navigateEp(nextEp)}
                disabled={!nextEp}
                className="gap-2 bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--brand)]/90"
              >
                Next
                {nextEp && (
                  <span className="ml-1 hidden text-xs text-[var(--brand-foreground)]/70 sm:inline">
                    Ep {nextEp.ep_num}
                  </span>
                )}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Episode list */}
        <aside className="lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <ListVideo className="size-4 text-[var(--brand)]" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Episodes
            </h2>
          </div>
          <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-border/50 bg-card/40 p-1.5">
            <ul className="space-y-1">
              {anime.episodes.map((ep) => {
                const active = ep.ep_num === current.ep_num;
                return (
                  <li key={ep.ep_num}>
                    <button
                      onClick={() => navigateEp(ep)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors",
                        active
                          ? "bg-brand-muted"
                          : "hover:bg-accent/60",
                      )}
                    >
                      {/* Number */}
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold tabular-nums",
                          active
                            ? "bg-[var(--brand)] text-[var(--brand-foreground)]"
                            : "bg-muted text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {ep.ep_num}
                      </span>
                      {/* Title */}
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-medium",
                            active
                              ? "text-[var(--brand)]"
                              : "text-foreground",
                          )}
                        >
                          {ep.name.replace(/\.(mp4|mkv|webm)$/i, "")}
                        </span>
                      </span>
                      {active ? (
                        <span className="brand-pulse size-1.5 rounded-full bg-[var(--brand)]" />
                      ) : (
                        <Play className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

export type { Anime, Episode };
