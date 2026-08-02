"use client";
import { useMemo } from "react";
import { ArrowRight, TrendingUp, Star, Flame, Clock } from "lucide-react";
import { useApp } from "@/lib/store";
import { getAllAnime, getTop10, filterAnime } from "@/lib/anime";
import { AnimeCard } from "./AnimeCard";
import { AnimePoster } from "./AnimePoster";
import { cn } from "@/lib/utils";

export function HomePage() {
  const go = useApp((s) => s.go);
  const all = getAllAnime();
  const top10 = getTop10();

  // Pick a hero — featured only, rotates daily
  const hero = useMemo(() => {
    const featured = all.filter((a) => a.featured);
    const day = new Date().getDate();
    return featured[day % featured.length] ?? top10[0] ?? all[0];
  }, [all, top10]);

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

  return (
    <div className="view-enter">
      {/* ===== Hero — single anime, clean, full-bleed ===== */}
      {hero && (
        <section className="relative">
          {/* Backdrop: poster image with subtle blur and gradient fade */}
          <div className="absolute inset-0 overflow-hidden">
            <AnimePoster
              title={hero.title}
              poster={hero.poster}
              imageUrl={hero.image_url}
              className="h-full w-full scale-110 blur-md"
              showTitle={false}
            />
            {/* Side gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 py-12 md:grid-cols-[1fr_260px] md:px-10 md:py-16">
            <div className="flex flex-col justify-end">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Now streaming
              </p>
              <h1 className="text-balance text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                {hero.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-foreground" />
                  <span className="font-semibold text-foreground">
                    {hero.rating.toFixed(2)}
                  </span>
                </span>
                <span className="opacity-40">/</span>
                <span>{hero.year}</span>
                <span className="opacity-40">/</span>
                <span>{hero.studio}</span>
                <span className="opacity-40">/</span>
                <span>{hero.totalEpisodes} episodes</span>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {truncate(hero.synopsis, 220)}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    go({ name: "watch", animeId: hero.id, episode: 1 })
                  }
                  className="inline-flex items-center gap-2 bg-foreground px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-background hover:opacity-90"
                >
                  Watch now <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  onClick={() => go({ name: "details", animeId: hero.id })}
                  className="inline-flex items-center gap-2 border border-border bg-background/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider backdrop-blur hover:bg-foreground hover:text-background"
                >
                  Details
                </button>
              </div>
            </div>

            {/* Poster card on the right (desktop only) */}
            <div className="hidden md:block">
              <button
                onClick={() => go({ name: "details", animeId: hero.id })}
                className="group block aspect-[2/3] w-full overflow-hidden border border-border/60 bg-card transition-all hover:border-foreground"
                aria-label={`View ${hero.title}`}
              >
                <AnimePoster
                  title={hero.title}
                  poster={hero.poster}
                  imageUrl={hero.image_url}
                  className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ===== Top 10 ===== */}
      <section className="mx-auto max-w-[1400px] px-6 py-10 md:px-10">
        <SectionHeader
          icon={<Flame className="h-4 w-4" />}
          title="Top 10"
          subtitle="The most popular anime in the catalog."
        />
        <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
          {top10.map((a, i) => (
            <AnimeCard key={a.id} anime={a} index={i} />
          ))}
        </div>
      </section>

      {/* ===== Featured ===== */}
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
        <SectionHeader
          icon={<TrendingUp className="h-4 w-4" />}
          title="Popular"
          subtitle="What everyone's watching."
        />
        <Row items={popular} />
      </Section>

      {/* ===== Top rated ===== */}
      <Section className="mx-auto max-w-[1400px] px-6 py-6 md:px-10">
        <SectionHeader
          icon={<Star className="h-4 w-4" />}
          title="Top rated"
          subtitle="The highest-scored titles in the library."
        />
        <Row items={topRated} />
      </Section>

      {/* ===== Recent ===== */}
      <Section className="mx-auto max-w-[1400px] px-6 py-6 md:px-10">
        <SectionHeader
          icon={<Clock className="h-4 w-4" />}
          title="Recently added"
          subtitle="Fresh releases and restocks."
        />
        <Row items={recent} />
      </Section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
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

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}
