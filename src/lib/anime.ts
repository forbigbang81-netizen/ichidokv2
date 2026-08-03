/**
 * Ichidoki — anime data layer.
 *
 * Loads the bundled `anime-archive.json` (17 anime with Archive.org
 * episode URLs) and exposes typed accessors for the UI.
 *
 * The archive JSON only carries the bare minimum (id / title / identifier /
 * episodes). Editorial metadata — synopsis, genres, year, studio, rating —
 * is merged in from a hand-curated `META` map so the product feels real.
 */
import archiveData from "@/data/anime-archive.json";

export type Episode = {
  name: string;
  ep_num: number;
  url: string;
};

export type Anime = {
  id: string;
  title: string;
  identifier: string;
  episode_count: number;
  episodes: Episode[];
  // Merged editorial metadata (with sensible fallbacks).
  year: number;
  studio: string;
  rating: number; // 0–10
  popularity: number; // lower = more popular (rank)
  genres: string[];
  synopsis: string;
  featured: boolean;
  backdropColor: string; // tailwind gradient stop used for hero/poster fallback
};

export type ArchiveAnime = {
  id: string;
  title: string;
  identifier: string;
  episode_count: number;
  episodes: Episode[];
};

const archive = archiveData as ArchiveAnime[];

/** Hand-curated editorial metadata keyed by anime id. */
const META: Record<
  string,
  {
    year: number;
    studio: string;
    rating: number;
    popularity: number;
    genres: string[];
    synopsis: string;
    featured?: boolean;
    backdropColor: string;
  }
> = {
  "death-note": {
    year: 2006,
    studio: "Madhouse",
    rating: 9.0,
    popularity: 1,
    genres: ["Mystery", "Psychological", "Supernatural", "Thriller"],
    synopsis:
      "Brilliant high-school student Light Yagami stumbles upon a notebook that kills anyone whose name is written inside it. What begins as a god-complex experiment in justice spirals into a cat-and-mouse thriller against the enigmatic detective L.",
    featured: true,
    backdropColor: "#3a0d0d",
  },
  "attack-on-titan": {
    year: 2013,
    studio: "Wit Studio",
    rating: 8.5,
    popularity: 2,
    genres: ["Action", "Drama", "Fantasy", "Horror"],
    synopsis:
      "Behind colossal walls, the last remnants of humanity live in fear of man-eating Titans. When a young soldier witnesses his home fall, he vows to eradicate every Titan and reclaim the world.",
    featured: true,
    backdropColor: "#1c2a3a",
  },
  "cowboy-bebop": {
    year: 1998,
    studio: "Sunrise",
    rating: 8.8,
    popularity: 3,
    genres: ["Action", "Sci-Fi", "Space", "Drama"],
    synopsis:
      "A ragtag crew of bounty hunters drifts through space aboard the Bebop, chasing criminals and outrunning their own pasts. Jazz, blues, and existential cool.",
    featured: true,
    backdropColor: "#2a1c0d",
  },
  "dr-stone": {
    year: 2019,
    studio: "TMS Entertainment",
    rating: 8.2,
    popularity: 4,
    genres: ["Adventure", "Comedy", "Sci-Fi"],
    synopsis:
      "A mysterious flash petrifies all of humanity for thousands of years. Teenage genius Senku awakens and sets out to rebuild civilization from scratch — using the power of science.",
    backdropColor: "#0d2a1c",
  },
  "black-clover": {
    year: 2017,
    studio: "Studio Pierrot",
    rating: 8.2,
    popularity: 5,
    genres: ["Action", "Comedy", "Fantasy", "Magic"],
    synopsis:
      "Born without magic in a world where it's everything, Asta refuses to give up. He trains his body raw and aims for the title of Wizard King alongside his rival Yuno.",
    backdropColor: "#1c1c3a",
  },
  "danmachi": {
    year: 2015,
    studio: "J.C.Staff",
    rating: 7.6,
    popularity: 6,
    genres: ["Action", "Adventure", "Comedy", "Fantasy"],
    synopsis:
      "Bell Cranel dreams of becoming the greatest adventurer in Orario. Beneath the city lies a sprawling dungeon — and a goddess who sees something special in him.",
    backdropColor: "#2a1c2a",
  },
  "overlord": {
    year: 2015,
    studio: "Madhouse",
    rating: 7.9,
    popularity: 7,
    genres: ["Action", "Fantasy", "Adventure"],
    synopsis:
      "When his favorite MMORPG shuts down, Momonga stays logged in — and wakes up as his skeletal overlord avatar, ruling a tomb of fanatically loyal NPCs in a strange new world.",
    backdropColor: "#1a0d2a",
  },
  "overlord-ii": {
    year: 2018,
    studio: "Madhouse",
    rating: 7.7,
    popularity: 8,
    genres: ["Action", "Fantasy", "Adventure"],
    synopsis:
      "Ainz Ooal Gown expands his grip on the new world, dispatching his Floor Guardians to crush kingdoms while uncovering the truth behind this reality.",
    backdropColor: "#1a0d2a",
  },
  "rwby": {
    year: 2013,
    studio: "Rooster Teeth",
    rating: 7.6,
    popularity: 9,
    genres: ["Action", "Adventure", "Fantasy"],
    synopsis:
      "At Beacon Academy, young warriors train as Huntsmen and Huntresses to defend Remnant from the shadowy Creatures of Grimm. Team RWBY takes the stage.",
    backdropColor: "#2a0d1c",
  },
  "welcome-to-the-nhk": {
    year: 2006,
    studio: "Gonzo",
    rating: 8.0,
    popularity: 10,
    genres: ["Comedy", "Drama", "Romance"],
    synopsis:
      "A shut-in college dropout is convinced a conspiracy — the N.H.K. — is to blame for his hikikomori life. Then a mysterious girl offers to cure him.",
    backdropColor: "#1c2a3a",
  },
  "prison-school": {
    year: 2015,
    studio: "J.C.Staff",
    rating: 7.7,
    popularity: 11,
    genres: ["Comedy", "Ecchi", "Romance"],
    synopsis:
      "Five boys enroll at a formerly all-girls academy and are immediately thrown into the school's underground prison by the secretive Underground Student Council.",
    backdropColor: "#2a2a1c",
  },
  "how-not-to-summon-a-demon-lord": {
    year: 2018,
    studio: "Ajiado",
    rating: 6.7,
    popularity: 12,
    genres: ["Comedy", "Ecchi", "Fantasy"],
    synopsis:
      "A socially-anxious gamer is summoned to a fantasy world as his max-level demon-lord avatar — and the two girls who called him there become his reluctant servants.",
    backdropColor: "#2a1c3a",
  },
  "btooom": {
    year: 2012,
    studio: "Madhouse",
    rating: 6.7,
    popularity: 13,
    genres: ["Action", "Horror", "Psychological", "Sci-Fi"],
    synopsis:
      "A top-ranked Btooom! player wakes on a real island where he must survive the game he mastered online — armed only with bombs and surrounded by killers.",
    backdropColor: "#1c2a1c",
  },
  "bobobo-bo-bo-bobo": {
    year: 2003,
    studio: "Toei Animation",
    rating: 7.0,
    popularity: 14,
    genres: ["Action", "Comedy", "Sci-Fi"],
    synopsis:
      "In a world ruled by the bald Margarita Empire, a golden-afro'd hero fights tyranny with the power of nose hair and pure, unfiltered absurdity.",
    backdropColor: "#2a2a0d",
  },
  "sonic-x": {
    year: 2003,
    studio: "TMS Entertainment",
    rating: 6.8,
    popularity: 15,
    genres: ["Action", "Adventure", "Comedy", "Sci-Fi"],
    synopsis:
      "A hyper-speed hedgehog and his friends are transported to the human world, where they team up with a boy named Chris to foil Dr. Eggman's schemes.",
    backdropColor: "#0d2a3a",
  },
  "zoids-new-century-zero": {
    year: 2001,
    studio: "Xebec",
    rating: 7.5,
    popularity: 16,
    genres: ["Action", "Adventure", "Mecha", "Sci-Fi"],
    synopsis:
      "Pilots battle in mechanized combat beasts called Zoids. The Blitz Team, led by the rookie Bit Cloud, races toward the S-Class league championship.",
    backdropColor: "#1c1c2a",
  },
  "zoids-chaotic-century": {
    year: 1999,
    studio: "Xebec",
    rating: 7.6,
    popularity: 17,
    genres: ["Action", "Adventure", "Mecha", "Sci-Fi"],
    synopsis:
      "Stranded in a desert, a boy discovers an ancient Zoid and an amnesiac girl — kicking off a continent-spanning war between mechanized beasts.",
    backdropColor: "#2a1c1c",
  },
};

/** Build the fully-merged Anime list (memoised once at module load). */
function buildAnimeList(): Anime[] {
  return archive.map((a) => {
    const m = META[a.id] ?? {
      year: 2010,
      studio: "Studio Unknown",
      rating: 7.0,
      popularity: 99,
      genres: ["Anime"],
      synopsis: `${a.title} — streaming now on Ichidoki.`,
      backdropColor: "#1c1c1c",
    };
    return {
      id: a.id,
      title: a.title,
      identifier: a.identifier,
      episode_count: a.episode_count,
      episodes: a.episodes,
      year: m.year,
      studio: m.studio,
      rating: m.rating,
      popularity: m.popularity,
      genres: m.genres,
      synopsis: m.synopsis,
      featured: Boolean(m.featured),
      backdropColor: m.backdropColor,
    };
  });
}

const ANIME: Anime[] = buildAnimeList();
const BY_ID = new Map<string, Anime>(ANIME.map((a) => [a.id, a]));

export function getAllAnime(): Anime[] {
  return ANIME;
}

export function getAnimeById(id: string): Anime | undefined {
  return BY_ID.get(id);
}

/** Top rated — used on the home page "Top Rated" rail. */
export function getTopAnime(limit = 10): Anime[] {
  return [...ANIME].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

/** Featured anime for the hero carousel. */
export function getFeaturedAnime(): Anime[] {
  const featured = ANIME.filter((a) => a.featured);
  // Fallback: if none flagged, pick top 3 by rating.
  return featured.length ? featured : getTopAnime(3);
}

/** Recently added — we simulate this by reversing the source order. */
export function getRecentlyAdded(limit = 10): Anime[] {
  return [...ANIME].reverse().slice(0, limit);
}

/** Popular — sorted by editorial popularity rank. */
export function getPopularAnime(limit = 10): Anime[] {
  return [...ANIME].sort((a, b) => a.popularity - b.popularity).slice(0, limit);
}

/** All distinct genres across the catalog. */
export function getGenres(): string[] {
  const set = new Set<string>();
  ANIME.forEach((a) => a.genres.forEach((g) => set.add(g)));
  return Array.from(set).sort();
}

/** Search across title + genres + studio. */
export function searchAnime(query: string): Anime[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ANIME.filter((a) => {
    const hay = [a.title, a.studio, a.synopsis, ...a.genres]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

/**
 * The poster image used everywhere — Archive.org's thumbnail service.
 * Falls back gracefully if missing (handled by the <AnimeCard/>).
 */
export function posterUrl(anime: Pick<Anime, "identifier">): string {
  return `https://archive.org/services/img/${encodeURIComponent(anime.identifier)}`;
}

/** Stream URL routed through our own proxy so we can follow Archive.org 302s. */
export function streamProxyUrl(episodeUrl: string): string {
  return `/api/stream?url=${encodeURIComponent(episodeUrl)}`;
}

/** Format a rating for the rating badge. */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** Format seconds as M:SS / H:MM:SS. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}
