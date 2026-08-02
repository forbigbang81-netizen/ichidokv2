"use client";
import { Anime } from "@/lib/anime";
import { useApp } from "@/lib/store";
import { AnimePoster } from "./AnimePoster";
import { cn } from "@/lib/utils";

type Props = {
  anime: Anime;
  index?: number; // for numbered top-10 cards
  className?: string;
};

export function AnimeCard({ anime, index, className }: Props) {
  const go = useApp((s) => s.go);

  return (
    <button
      onClick={() => go({ name: "details", animeId: anime.id })}
      className={cn(
        "group relative block w-full text-left",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={`View ${anime.title}`}
    >
      <div
        className={cn(
          "relative aspect-[2/3] w-full overflow-hidden bg-card border border-border",
          "transition-all duration-300 group-hover:border-foreground/60 group-hover:-translate-y-1",
        )}
      >
        <AnimePoster
          title={anime.title}
          poster={anime.poster}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {/* hover overlay */}
        <div className="pointer-events-none absolute inset-0 bg-background/0 transition-colors duration-300 group-hover:bg-background/20" />

        {/* type badge top-right */}
        <span className="absolute right-1.5 top-1.5 bg-background/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-foreground backdrop-blur-sm">
          {anime.type}
        </span>

        {/* top-10 number */}
        {typeof index === "number" && (
          <span className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center bg-background/85 text-xs font-black tabular-nums backdrop-blur-sm">
            {index + 1}
          </span>
        )}

        {/* rating badge bottom-right */}
        <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current">
            <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21.2l1.6-7L2 9.5l7.1-.6z" />
          </svg>
          {anime.rating.toFixed(2)}
        </span>
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-1 text-[13px] font-semibold leading-tight tracking-tight text-foreground">
          {anime.title}
        </h3>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {anime.year} · {anime.totalEpisodes} ep
        </p>
      </div>
    </button>
  );
}
