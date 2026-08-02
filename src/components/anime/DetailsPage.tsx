"use client";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Play,
  Star,
  Calendar,
  Clock,
  Tv,
  Building2,
  CheckCircle2,
  ListVideo,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { getAnimeById, buildEpisodeList } from "@/lib/anime";
import { AnimePoster } from "./AnimePoster";
import { AnimeCard } from "./AnimeCard";
import { filterAnime } from "@/lib/anime";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function DetailsPage({ animeId }: { animeId: string }) {
  const go = useApp((s) => s.go);
  const back = useApp((s) => s.back);
  const canGoBack = useApp((s) => s.canGoBack());
  const anime = getAnimeById(animeId);

  const [activeSeason, setActiveSeason] = useState(0);

  const episodes = useMemo(
    () => (anime ? buildEpisodeList(anime) : []),
    [anime],
  );

  const seasonEpisodes = useMemo(
    () => episodes.filter((e) => e.seasonIndex === activeSeason),
    [episodes, activeSeason],
  );

  // recommendations — same-genre, exclude self
  const recs = useMemo(() => {
    if (!anime) return [];
    return filterAnime({ genre: anime.genres[0], sort: "popularity" })
      .filter((a) => a.id !== anime.id)
      .slice(0, 10);
  }, [anime]);

  if (!anime) {
    return (
      <div className="view-enter mx-auto max-w-[1400px] px-6 py-20 text-center md:px-10">
        <p className="text-sm font-semibold">Anime not found.</p>
        <button
          onClick={() => go({ name: "home" })}
          className="mt-4 inline-flex items-center gap-1 border border-border bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background"
        >
          Back home
        </button>
      </div>
    );
  }

  return (
    <div className="view-enter">
      {/* Top bar with back button */}
      <div className="border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3 md:px-10">
          {canGoBack ? (
            <button
              onClick={back}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <button
              onClick={() => go({ name: "home" })}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Home
            </button>
          )}
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Details
          </span>
        </div>
      </div>

      {/* Hero header */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-6 py-8 md:grid-cols-[280px_1fr] md:px-10 md:py-10">
          {/* Poster */}
          <div className="mx-auto w-full max-w-[260px] md:mx-0">
            <div className="aspect-[2/3] w-full overflow-hidden border border-border">
              <AnimePoster
                title={anime.title}
                poster={anime.poster}
                imageUrl={anime.image_url}
                className="h-full w-full"
              />
            </div>
            <button
              onClick={() =>
                go({
                  name: "watch",
                  animeId: anime.id,
                  episode: 1,
                  seasonIndex: 0,
                })
              }
              className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-foreground py-3 text-[11px] font-semibold uppercase tracking-wider text-background hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Start watching
            </button>
          </div>

          {/* Info */}
          <div>
            {anime.altTitles.length > 0 && (
              <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {anime.altTitles[0]}
              </p>
            )}
            <h1 className="text-balance text-3xl font-black leading-tight tracking-tight md:text-5xl">
              {anime.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-foreground" />
                <span className="font-semibold text-foreground">
                  {anime.rating.toFixed(2)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {anime.season}
              </span>
              <span className="inline-flex items-center gap-1">
                <Tv className="h-3 w-3" /> {anime.type}
              </span>
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {anime.studio}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {anime.duration}m/ep
              </span>
              <span className="inline-flex items-center gap-1">
                <ListVideo className="h-3 w-3" /> {anime.totalEpisodes} ep
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {anime.status}
              </span>
            </div>

            {/* genres */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {anime.genres.map((g) => (
                <button
                  key={g}
                  onClick={() => go({ name: "catalog" })}
                  className="border border-border bg-card px-2 py-1 text-[10px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background"
                >
                  {g}
                </button>
              ))}
            </div>

            {/* synopsis */}
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {anime.synopsis}
            </p>

            {/* season summary */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Seasons" value={String(anime.seasons.length)} />
              <Stat label="Episodes" value={String(anime.totalEpisodes)} />
              <Stat label="Rating" value={anime.rating.toFixed(2)} />
              <Stat label="Year" value={String(anime.year)} />
            </div>
          </div>
        </div>
      </section>

      {/* Seasons tabs + episode list */}
      <section className="mx-auto max-w-[1400px] px-6 py-8 md:px-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Episodes</h2>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              {anime.seasons.length} season{anime.seasons.length === 1 ? "" : "s"} ·{" "}
              {anime.totalEpisodes} total episodes
            </p>
          </div>
        </div>

        {anime.seasons.length > 1 ? (
          <Tabs
            value={String(activeSeason)}
            onValueChange={(v) => setActiveSeason(parseInt(v, 10))}
          >
            <TabsList className="flex h-auto flex-wrap gap-1 border border-border bg-card p-1">
              {anime.seasons.map((s, i) => (
                <TabsTrigger
                  key={i}
                  value={String(i)}
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background"
                >
                  {s.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {anime.seasons.map((s, i) => (
              <TabsContent key={i} value={String(i)} className="mt-4">
                <SeasonBlock
                  animeId={anime.id}
                  seasonIndex={i}
                  seasonName={s.name}
                  seasonSynopsis={s.synopsis}
                  seasonYear={s.year}
                  episodes={episodes.filter((e) => e.seasonIndex === i)}
                  startEpisodeNumber={
                    episodes.filter((e) => e.seasonIndex < i).length + 1
                  }
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <SeasonBlock
            animeId={anime.id}
            seasonIndex={0}
            seasonName={anime.seasons[0].name}
            seasonSynopsis={anime.seasons[0].synopsis}
            seasonYear={anime.seasons[0].year}
            episodes={seasonEpisodes}
            startEpisodeNumber={1}
          />
        )}
      </section>

      {/* Recommendations */}
      {recs.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-6 pb-12 md:px-10">
          <h2 className="mb-4 text-2xl font-black tracking-tight">
            More like this
          </h2>
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {recs.map((a) => (
              <AnimeCard key={a.id} anime={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-black tabular-nums">{value}</p>
    </div>
  );
}

function SeasonBlock({
  animeId,
  seasonIndex,
  seasonName,
  seasonSynopsis,
  seasonYear,
  episodes,
  startEpisodeNumber,
}: {
  animeId: string;
  seasonIndex: number;
  seasonName: string;
  seasonSynopsis?: string;
  seasonYear?: number;
  episodes: ReturnType<typeof buildEpisodeList>;
  startEpisodeNumber: number;
}) {
  const go = useApp((s) => s.go);

  return (
    <div>
      <div className="mb-4 border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-lg font-bold tracking-tight">{seasonName}</h3>
          {seasonYear && (
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {seasonYear} · {episodes.length} ep
            </span>
          )}
        </div>
        {seasonSynopsis && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {seasonSynopsis}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {episodes.map((ep, i) => (
          <button
            key={ep.number}
            onClick={() =>
              go({
                name: "watch",
                animeId,
                episode: ep.number,
                seasonIndex,
              })
            }
            className={cn(
              "group flex items-center gap-3 border border-border bg-card p-2.5 text-left transition-colors",
              "hover:bg-foreground hover:text-background",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border text-sm font-bold tabular-nums group-hover:border-background">
              {startEpisodeNumber + i}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-semibold">
                Episode {ep.episodeInSeason}
              </p>
              <p className="text-[10px] uppercase tracking-wider opacity-60">
                {ep.duration}m · ep {ep.number}
              </p>
            </div>
            <Play className="h-3.5 w-3.5 fill-current opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
