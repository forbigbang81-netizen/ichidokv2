"use client";
import { useMemo, useState } from "react";
import { Search, ArrowRight, Flame, Star, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { getAllAnime, getTop10, filterAnime } from "@/lib/anime";
import { AnimeCard } from "./AnimeCard";
import { AnimePoster } from "./AnimePoster";
import { cn } from "@/lib/utils";

export function HomePage() {
  const go = useApp((s) => s.go);
  const [query, setQuery] = useState("");
  const all = getAllAnime();
  const top10 = getTop10();

  const hero = useMemo(() => {
    // pick a featured "hero" — rotate based on date so it feels alive
    const featured = all.filter((a) => a.featured);
    const day = new Date().getDate();
    return featured[day % featured.length] ?? top10[0] ?? all[0];
  }, [all, top10]);

  const liveSearch = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return filterAnime({ query: q, sort: "popularity" }).slice(0, 6);
  }, [query]);

  // curated rows
  const popular = useMemo(
    () =>
      filterAnime({ sort: "popularity" })
        .filter((a) => !a.featured)
        .slice(0, 18),
    [],
  );
  const recent = useMemo(
    () => filterAnime({ sort: "year-desc" }).slice(0, 18),
    [],
  );
  const topRated = useMemo(
    () => filterAnime({ sort: "rating" }).slice(0, 18),
    [],
  );
  const featuredRow = useMemo(
    () => all.filter((a) => a.featured),
    [all],
  );

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    go({ name: "catalog", initialQuery: query });
  };

  return (
    <div className="view-enter">
      {/* ===== Hero ===== */}
      <section className="relative border-b border-border">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-0 md:grid-cols-[1.4fr_1fr]">
          {/* left: copy + search */}
          <div className="flex flex-col justify-between gap-8 px-6 py-10 md:px-10 md:py-16">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 border border-border bg-background/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Now streaming · {all.length} titles
              </div>
              <h1 className="text-balance text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
                Anime,
                <br />
                undiluted.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                A clean black &amp; white player. No ads, no clutter. Browse
                the catalog, dive into seasons, watch via gdriveplayer.
              </p>
            </div>

            <form onSubmit={onSubmitSearch} className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anime, genre, studio..."
                className="w-full border border-border bg-card py-3 pl-10 pr-24 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 bg-foreground px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-background hover:opacity-90"
              >
                Search <ArrowRight className="h-3 w-3" />
              </button>

              {/* live results dropdown */}
              {liveSearch.length > 0 && (
                <div className="absolute z-30 mt-2 w-full border border-border bg-card shadow-xl">
                  {liveSearch.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => go({ name: "details", animeId: a.id })}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent"
                    >
                      <div className="h-12 w-9 shrink-0 overflow-hidden border border-border">
                        <AnimePoster
                          title={a.title}
                          poster={a.poster}
                          imageUrl={a.image_url}
                          className="h-full w-full"
                          showTitle={false}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-semibold">
                          {a.title}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {a.year} · {a.studio}
                        </p>
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {a.rating.toFixed(1)}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => go({ name: "catalog", initialQuery: query })}
                    className="w-full border-t border-border px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    See all results →
                  </button>
                </div>
              )}
            </form>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => go({ name: "catalog" })}
                className="inline-flex items-center gap-1.5 border border-border bg-background px-4 py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
              >
                Browse catalog <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() =>
                  hero &&
                  go({ name: "watch", animeId: hero.id, episode: 1 })
                }
                className="inline-flex items-center gap-1.5 border border-border bg-foreground px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity"
              >
                Play featured
              </button>
            </div>
          </div>

          {/* right: featured poster */}
          {hero && (
            <button
              onClick={() => go({ name: "details", animeId: hero.id })}
              className="group relative block aspect-[4/5] w-full overflow-hidden border-l border-border bg-card md:aspect-auto"
              aria-label={`Featured: ${hero.title}`}
            >
              <AnimePoster
                title={hero.title}
                poster={hero.poster}
                imageUrl={hero.image_url}
                className="h-full w-full transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-6 md:p-8">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Featured today
                </p>
                <h2 className="text-balance text-2xl font-black leading-tight tracking-tight md:text-3xl">
                  {hero.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span>{hero.year}</span>
                  <span className="opacity-50">·</span>
                  <span>{hero.studio}</span>
                  <span className="opacity-50">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {hero.rating.toFixed(2)}
                  </span>
                  <span className="opacity-50">·</span>
                  <span>{hero.totalEpisodes} ep</span>
                </div>
                <p className="mt-3 line-clamp-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                  {hero.synopsis}
                </p>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* ===== Top 10 ===== */}
      <section className="mx-auto max-w-[1400px] px-6 py-10 md:px-10">
        <SectionHeader
          icon={<Flame className="h-4 w-4" />}
          title="Top 10"
          subtitle="Your picks, ranked."
        />
        <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
          {top10.map((a, i) => (
            <AnimeCard key={a.id} anime={a} index={i} />
          ))}
        </div>
      </section>

      {/* ===== Featured (the user's specific picks) ===== */}
      <Section className="mx-auto max-w-[1400px] px-6 py-6 md:px-10">
        <SectionHeader
          title="Featured"
          subtitle="The lineup you asked for."
        />
        <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {featuredRow.map((a) => (
            <AnimeCard key={a.id} anime={a} />
          ))}
        </div>
      </Section>

      {/* ===== Popular ===== */}
      <Section className="mx-auto max-w-[1400px] px-6 py-6 md:px-10">
        <SectionHeader title="Popular" subtitle="What everyone's watching." />
        <Row items={popular} />
      </Section>

      {/* ===== Top rated ===== */}
      <Section className="mx-auto max-w-[1400px] px-6 py-6 md:px-10">
        <SectionHeader title="Top rated" subtitle="Highest scores across the catalog." />
        <Row items={topRated} />
      </Section>

      {/* ===== Recent ===== */}
      <Section className="mx-auto max-w-[1400px] px-6 py-6 md:px-10">
        <SectionHeader title="Recently added" subtitle="Fresh releases and restocks." />
        <Row items={recent} />
      </Section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-black tracking-tight md:text-2xl">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function Section({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn(className)}>{children}</section>;
}

function Row({ items }: { items: ReturnType<typeof getAllAnime> }) {
  return (
    <div className="no-scrollbar mt-5 flex gap-x-3 overflow-x-auto pb-2">
      {items.map((a) => (
        <div key={a.id} className="w-[140px] shrink-0 md:w-[160px]">
          <AnimeCard anime={a} />
        </div>
      ))}
    </div>
  );
}
