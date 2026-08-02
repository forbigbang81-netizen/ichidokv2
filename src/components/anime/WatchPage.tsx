"use client";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Play,
  ChevronLeft,
  ChevronRight,
  ListVideo,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import {
  getAnimeById,
  buildEpisodeList,
  gdriveEmbedUrl,
  type Episode,
} from "@/lib/anime";
import { CustomPlayer } from "./CustomPlayer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// (sub/dub toggle removed — our custom player plays whatever source URL the
// user pastes. Audio language is controlled inside the source itself.)

export function WatchPage({
  animeId,
  episode,
  seasonIndex,
}: {
  animeId: string;
  episode: number;
  seasonIndex?: number;
}) {
  const go = useApp((s) => s.go);
  const back = useApp((s) => s.back);
  const canGoBack = useApp((s) => s.canGoBack());

  const anime = getAnimeById(animeId);

  const allEpisodes = useMemo(
    () => (anime ? buildEpisodeList(anime) : []),
    [anime],
  );

  // Resolve current episode object (clamp)
  const currentEp: Episode | undefined = useMemo(() => {
    if (!anime) return undefined;
    const idx = Math.max(1, Math.min(episode, allEpisodes.length));
    return allEpisodes[idx - 1];
  }, [anime, episode, allEpisodes]);

  const resolvedSeasonIndex =
    seasonIndex !== undefined
      ? seasonIndex
      : currentEp?.seasonIndex ?? 0;

  const [activeSeason, setActiveSeason] = useState(resolvedSeasonIndex);
  const [search, setSearch] = useState("");

  // When the URL episode changes (browser back/forward), keep season tab in sync.
  // Uses the "adjust state during render" pattern.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const currentEpNumber = currentEp?.number ?? 0;
  const [prevEpNumber, setPrevEpNumber] = useState(currentEpNumber);
  if (currentEp && prevEpNumber !== currentEpNumber) {
    setPrevEpNumber(currentEpNumber);
    if (activeSeason !== currentEp.seasonIndex) {
      setActiveSeason(currentEp.seasonIndex);
    }
  }

  if (!anime || !currentEp) {
    return (
      <div className="view-enter mx-auto max-w-[1400px] px-6 py-20 text-center md:px-10">
        <p className="text-sm font-semibold">Episode not found.</p>
        <button
          onClick={() => go({ name: "home" })}
          className="mt-4 inline-flex items-center gap-1 border border-border bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background"
        >
          Back home
        </button>
      </div>
    );
  }

  const playerStorageKey = `${anime.id}:ep:${currentEp.number}`;
  const playerTitle = `${anime.title} — Episode ${currentEp.episodeInSeason}`;
  const playerSubtitle = `${currentEp.seasonName} · Ep ${currentEp.number} / ${allEpisodes.length}`;
  const playerEmbedUrl = gdriveEmbedUrl(anime, currentEp);

  // Build a "shareable" URL for the CastButton — points to the current
  // watch page on our site, not the source URL (which may be ephemeral).
  const castTargetUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/#/watch/${encodeURIComponent(anime.id)}?ep=${currentEp.number}&s=${currentEp.seasonIndex}`
      : "";

  const seasonEpisodes = allEpisodes.filter((e) => e.seasonIndex === activeSeason);
  const filteredSeason = search.trim()
    ? seasonEpisodes.filter((e) =>
        `${e.episodeInSeason} ${e.seasonName} ${e.title} ${e.number}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      )
    : seasonEpisodes;

  const hasPrev = currentEp.number > 1;
  const hasNext = currentEp.number < allEpisodes.length;

  const navigateTo = (epNumber: number) => {
    const target = allEpisodes[epNumber - 1];
    if (!target) return;
    go({
      name: "watch",
      animeId: anime.id,
      episode: epNumber,
      seasonIndex: target.seasonIndex,
    });
  };

  return (
    <div className="view-enter">
      {/* Top bar */}
      <div className="border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 md:px-8">
          {canGoBack ? (
            <button
              onClick={back}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <button
              onClick={() => go({ name: "details", animeId: anime.id })}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Details
            </button>
          )}
          <span className="line-clamp-1 max-w-[80%] text-center text-[11px] uppercase tracking-wider text-muted-foreground">
            {anime.title} · {currentEp.seasonName} · Ep {currentEp.episodeInSeason}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        {/* Player — our own custom HTML5 player, no iframes */}
        <div className="overflow-hidden border border-border bg-black">
          <div className="relative aspect-video w-full">
            <CustomPlayer
              storageKey={playerStorageKey}
              title={playerTitle}
              subtitle={playerSubtitle}
              poster={anime.image_url}
              embedUrl={playerEmbedUrl}
              castUrl={castTargetUrl}
              onNext={() => hasNext && navigateTo(currentEp.number + 1)}
              onPrev={() => hasPrev && navigateTo(currentEp.number - 1)}
              hasNext={hasNext}
              hasPrev={hasPrev}
            />
          </div>
        </div>

        {/* Player controls row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Now playing · {currentEp.seasonName}
            </p>
            <h1 className="mt-0.5 truncate text-lg font-bold tracking-tight md:text-xl">
              {anime.title} — Episode {currentEp.episodeInSeason}
            </h1>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              Global ep {currentEp.number} / {allEpisodes.length} · {currentEp.duration}m
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => hasPrev && navigateTo(currentEp.number - 1)}
              disabled={!hasPrev}
              className="inline-flex items-center gap-1 border border-border bg-card px-3 py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-30 disabled:hover:bg-card disabled:hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              onClick={() => hasNext && navigateTo(currentEp.number + 1)}
              disabled={!hasNext}
              className="inline-flex items-center gap-1 bg-foreground px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-background hover:opacity-90 disabled:opacity-30"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Synopsis block */}
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {anime.synopsis}
        </p>

        {/* Episode list with search above */}
        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
                <ListVideo className="h-4 w-4" /> Episodes
              </h2>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                {anime.seasons.length} season{anime.seasons.length === 1 ? "" : "s"} · {allEpisodes.length} episodes
              </p>
            </div>

            {/* Episode search */}
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search episodes..."
                className="w-full border border-border bg-card py-2 pl-9 pr-8 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
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
                <TabsContent key={i} value={String(i)} className="mt-3">
                  <EpisodeGrid
                    episodes={
                      search.trim()
                        ? allEpisodes
                            .filter((e) => e.seasonIndex === i)
                            .filter((e) =>
                              `${e.episodeInSeason} ${e.seasonName} ${e.number}`
                                .toLowerCase()
                                .includes(search.trim().toLowerCase()),
                            )
                        : allEpisodes.filter((e) => e.seasonIndex === i)
                    }
                    currentNumber={currentEp.number}
                    startNumber={
                      allEpisodes.filter((e) => e.seasonIndex < i).length + 1
                    }
                    onSelect={(n) => navigateTo(n)}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <EpisodeGrid
              episodes={filteredSeason}
              currentNumber={currentEp.number}
              startNumber={1}
              onSelect={(n) => navigateTo(n)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EpisodeGrid({
  episodes,
  currentNumber,
  startNumber,
  onSelect,
}: {
  episodes: Episode[];
  currentNumber: number;
  startNumber: number;
  onSelect: (n: number) => void;
}) {
  if (episodes.length === 0) {
    return (
      <div className="border border-dashed border-border py-10 text-center">
        <p className="text-xs font-semibold">No episodes match.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {episodes.map((ep, i) => {
        const isCurrent = ep.number === currentNumber;
        return (
          <button
            key={ep.number}
            onClick={() => onSelect(ep.number)}
            className={cn(
              "group flex items-center gap-3 border p-2.5 text-left transition-colors",
              isCurrent
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card hover:bg-foreground hover:text-background",
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center border text-sm font-bold tabular-nums",
                isCurrent ? "border-background" : "border-border group-hover:border-background",
              )}
            >
              {startNumber + i}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-semibold">
                Episode {ep.episodeInSeason}
              </p>
              <p className="text-[10px] uppercase tracking-wider opacity-60">
                {ep.duration}m · ep {ep.number}
              </p>
            </div>
            {isCurrent ? (
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Playing
              </span>
            ) : (
              <Play className="h-3.5 w-3.5 fill-current opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </button>
        );
      })}
    </div>
  );
}
