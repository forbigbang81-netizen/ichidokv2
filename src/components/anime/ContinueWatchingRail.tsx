"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, History } from "lucide-react";
import {
  getAnimeById,
  posterUrl,
  type Anime,
} from "@/lib/anime";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Format seconds as M:SS or H:MM:SS */
function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const sec = Math.floor(s % 60);
  const min = Math.floor((s / 60) % 60);
  const hr = Math.floor(s / 3600);
  const ss = sec.toString().padStart(2, "0");
  if (hr > 0) return `${hr}:${min.toString().padStart(2, "0")}:${ss}`;
  return `${min}:${ss}`;
}

type ContinueItem = {
  anime: Anime;
  episode: number;
  position: number;
  /** Timestamp when last watched (for sorting) */
  watchedAt: number;
};

/**
 * Scans localStorage for `pos:{animeId}:{epNum}` entries and returns
 * the most recently watched anime+episode pairs.
 *
 * Each entry also has an optional `time:{animeId}:{epNum}` key with the
 * Unix timestamp of when it was last watched (set by WatchPage).
 */
function useContinueWatching(limit = 12): ContinueItem[] {
  const [items, setItems] = useState<ContinueItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const found: ContinueItem[] = [];
    // Scan all localStorage keys for pos: prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("pos:")) continue;
      // Format: pos:{animeId}:{epNum}
      const m = key.match(/^pos:(.+):(\d+)$/);
      if (!m) continue;
      const animeId = m[1];
      const epNum = parseInt(m[2], 10);
      const posStr = localStorage.getItem(key);
      if (!posStr) continue;
      const pos = parseInt(posStr, 10);
      // Only show items past 10s and not at the very end (~23 min episode)
      if (pos < 10 || pos > 1380) continue;
      const anime = getAnimeById(animeId);
      if (!anime) continue;
      // Make sure the episode exists
      if (!anime.episodes.find((e) => e.ep_num === epNum)) continue;
      // Get watch timestamp (for sorting by recency)
      const timeKey = `time:${animeId}:${epNum}`;
      const watchedAt = parseInt(localStorage.getItem(timeKey) || "0", 10);
      found.push({ anime, episode: epNum, position: pos, watchedAt });
    }
    // Sort by most recently watched first
    found.sort((a, b) => b.watchedAt - a.watchedAt);
    setItems(found.slice(0, limit));
  }, [limit]);

  return items;
}

/** Continue Watching rail — shows anime you've started watching. */
export function ContinueWatchingRail() {
  const items = useContinueWatching(12);
  const go = useApp((s) => s.go);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  useEffect(() => {
    if (!ref) return;
    const onScroll = () => {
      setCanLeft(ref.scrollLeft > 4);
      setCanRight(ref.scrollLeft + ref.clientWidth < ref.scrollWidth - 4);
    };
    onScroll();
    ref.addEventListener("scroll", onScroll, { passive: true });
    return () => ref.removeEventListener("scroll", onScroll);
  }, [ref]);

  const scrollBy = (dir: 1 | -1) => {
    if (!ref) return;
    ref.scrollBy({ left: dir * (ref.clientWidth * 0.8), behavior: "smooth" });
  };

  // Don't render if nothing to show
  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative"
    >
      <div className="mb-3 flex items-end justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            <History className="size-5 text-[var(--brand)]" />
            Continue Watching
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pick up where you left off
          </p>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <button
            onClick={() => scrollBy(-1)}
            disabled={!canLeft}
            className="rounded-full border border-border/60 p-1.5 text-muted-foreground transition-colors hover:border-[var(--brand)]/60 hover:text-[var(--brand)] disabled:opacity-30 disabled:hover:border-border/60 disabled:hover:text-muted-foreground"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            disabled={!canRight}
            className="rounded-full border border-border/60 p-1.5 text-muted-foreground transition-colors hover:border-[var(--brand)]/60 hover:text-[var(--brand)] disabled:opacity-30 disabled:hover:border-border/60 disabled:hover:text-muted-foreground"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={setRef}
        className="no-scrollbar snap-x-row flex gap-3 overflow-x-auto px-4 pb-4 sm:gap-4 sm:px-6 lg:px-8"
      >
        {items.map((item, i) => {
          const { anime, episode, position } = item;
          // Find the episode to get its name
          const ep = anime.episodes.find((e) => e.ep_num === episode);
          const progress = Math.min(100, (position / 1380) * 100); // ~23 min
          return (
            <motion.button
              key={`${anime.id}-${episode}`}
              type="button"
              onClick={() =>
                go({
                  name: "watch",
                  animeId: anime.id,
                  episode,
                })
              }
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.28,
                delay: Math.min(i * 0.04, 0.4),
                ease: [0.22, 0.61, 0.36, 1],
              }}
              whileHover={{ y: -2 }}
              className="group relative w-64 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-card/40 text-left transition-colors hover:border-[var(--brand)]/50 sm:w-72"
            >
              {/* Thumbnail (16:9) using poster as backdrop */}
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <img
                  src={posterUrl(anime)}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-80"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-[var(--brand)]/90 text-[var(--brand-foreground)] opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                    <Play className="size-5 fill-current" />
                  </span>
                </div>

                {/* Episode badge */}
                <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                  EP {episode}
                </span>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-[var(--brand)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="line-clamp-1 text-sm font-semibold tracking-tight group-hover:text-[var(--brand)]">
                  {anime.title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  Episode {episode}
                  {ep?.name && ep.name !== `Episode ${episode}` && (
                    <> · {ep.name.replace(/\.(mp4|mkv|webm)$/i, "")}</>
                  )}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-[var(--brand)]">
                  {fmtTime(position)} left off
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
