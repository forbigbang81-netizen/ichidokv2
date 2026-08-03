"use client";

import { motion } from "framer-motion";
import { Play, Star, Layers } from "lucide-react";
import { posterUrl, formatRating, type Anime } from "@/lib/anime";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  anime: Anime;
  /** stagger index for fade-in on mount */
  index?: number;
  /** compact shows a smaller card (used in rails) */
  compact?: boolean;
  className?: string;
};

/**
 * Poster card used across home rails + catalog grid.
 * - Archive.org thumbnail as the poster
 * - Hover: scale + glow + show title overlay + play affordance
 * - Framer Motion: staggered fade-in on mount, scale on hover
 */
export function AnimeCard({ anime, index = 0, compact = false, className }: Props) {
  const go = useApp((s) => s.go);
  const width = compact ? "w-36 sm:w-40" : "w-40 sm:w-44 md:w-48";

  return (
    <motion.button
      type="button"
      onClick={() => go({ name: "details", animeId: anime.id })}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index * 0.04, 0.32),
        ease: [0.22, 0.61, 0.36, 1],
      }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative shrink-0 snap-start text-left",
        width,
        className,
      )}
      aria-label={`View ${anime.title}`}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border/50 bg-muted shadow-lg shadow-black/40 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-black/50">
        <img
          src={posterUrl(anime)}
          alt={anime.title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            // Fallback to a branded gradient block if the poster fails.
            img.style.display = "none";
            const parent = img.parentElement;
            if (parent && !parent.querySelector("[data-fallback]")) {
              const fb = document.createElement("div");
              fb.dataset.fallback = "true";
              fb.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, ${anime.backdropColor}, #0a0a0a);color:#fff;font-weight:800;font-size:1.25rem;padding:1rem;text-align:center;letter-spacing:-0.02em;`;
              fb.textContent = anime.title;
              parent.appendChild(fb);
            }
          }}
        />

        {/* Top badges */}
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand)] backdrop-blur-sm">
            <Star className="size-2.5 fill-current" />
            {formatRating(anime.rating)}
          </span>
        </div>
        <div className="absolute right-2 top-2">
          <span className="flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            <Layers className="size-2.5" />
            {anime.episode_count}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-2 p-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-[var(--brand)] text-[var(--brand-foreground)] shadow-lg shadow-[var(--brand)]/30">
              <Play className="size-3.5 fill-current" />
            </span>
            <span className="text-xs font-medium text-white/90">View details</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-[var(--brand)]">
          {anime.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {anime.year} · {anime.genres.slice(0, 2).join(" · ")}
        </p>
      </div>
    </motion.button>
  );
}
