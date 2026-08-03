"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getFeaturedAnime,
  getPopularAnime,
  getTopAnime,
  getRecentlyAdded,
  posterUrl,
  formatRating,
  type Anime,
} from "@/lib/anime";
import { useApp } from "@/lib/store";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { cn } from "@/lib/utils";

/** A horizontal rail of cards with snap-scrolling + hidden scrollbar. */
function Rail({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: Anime[];
}) {
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
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
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
        {items.map((a, i) => (
          <AnimeCard key={a.id} anime={a} index={i} compact />
        ))}
      </div>
    </motion.section>
  );
}

/** Big rotating hero banner using the featured anime list. */
function Hero({ items }: { items: Anime[] }) {
  const go = useApp((s) => s.go);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      9000,
    );
    return () => clearInterval(t);
  }, [items.length]);

  const anime = items[idx];

  const meta = useMemo(() => {
    if (!anime) return null;
    return [
      anime.year.toString(),
      anime.studio,
      `${anime.episode_count} Episodes`,
      anime.genres.slice(0, 2).join(" · "),
    ];
  }, [anime]);

  if (!anime || !meta) return null;

  return (
    <section className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={anime.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Backdrop: stretched, blurred poster tinted with the anime color */}
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
                background: `linear-gradient(90deg, ${anime.backdropColor}cc 0%, rgba(10,10,10,0.85) 45%, rgba(10,10,10,0.6) 100%)`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>

          <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-16 sm:px-6 sm:pb-14 sm:pt-20 md:flex-row md:items-center lg:px-8 lg:pb-20 lg:pt-28">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
              className="max-w-xl"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/40 bg-brand-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--brand)]">
                <span className="brand-pulse size-1.5 rounded-full bg-[var(--brand)]" />
                Featured
              </span>

              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {anime.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold text-[var(--brand)]">
                  <Star className="size-3.5 fill-current" />
                  {formatRating(anime.rating)}
                </span>
                {meta.map((m, i) => (
                  <span key={i} className="flex items-center gap-3">
                    {i > 0 && <span className="text-muted-foreground/40">·</span>}
                    {m}
                  </span>
                ))}
              </div>

              <p className="mt-4 max-w-lg text-sm leading-relaxed text-foreground/80 line-clamp-3 sm:text-base">
                {anime.synopsis}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() =>
                    go({
                      name: "watch",
                      animeId: anime.id,
                      episode: 1,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-[var(--brand-foreground)] shadow-lg shadow-[var(--brand)]/25 hover:bg-[var(--brand)]/90 hover:shadow-[var(--brand)]/40"
                >
                  <Play className="size-4 fill-current" />
                  Watch Now
                </button>
                <button
                  onClick={() => go({ name: "details", animeId: anime.id })}
                  className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm hover:border-[var(--brand)]/50 hover:text-[var(--brand)]"
                >
                  <Info className="size-4" />
                  More Info
                </button>
              </div>
            </motion.div>

            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="relative hidden shrink-0 md:block"
            >
              <div className="relative w-56 overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/60 lg:w-64">
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
              <div
                className="absolute -inset-3 -z-10 rounded-2xl opacity-60 blur-2xl"
                style={{ background: anime.backdropColor }}
              />
            </motion.div>
          </div>

          {/* Dots */}
          {items.length > 1 && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 sm:left-6 lg:left-8">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === idx
                      ? "w-6 bg-[var(--brand)]"
                      : "w-1.5 bg-muted-foreground/50 hover:bg-muted-foreground",
                  )}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export function HomePage() {
  const featured = useMemo(() => getFeaturedAnime(), []);
  const popular = useMemo(() => getPopularAnime(12), []);
  const top = useMemo(() => getTopAnime(12), []);
  const recent = useMemo(() => getRecentlyAdded(12), []);

  return (
    <div className="pb-16">
      <Hero items={featured} />

      <div className="mt-8 space-y-10 sm:mt-12">
        <Rail
          title="Popular Now"
          subtitle="What everyone's watching this week"
          items={popular}
        />
        <Rail
          title="Top Rated"
          subtitle="The highest-scored anime on Ichidoki"
          items={top}
        />
        <Rail
          title="Recently Added"
          subtitle="Fresh episodes waiting for you"
          items={recent}
        />
      </div>
    </div>
  );
}
