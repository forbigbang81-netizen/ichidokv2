/**
 * Anime data layer — loads the generated JSON and exposes typed accessors.
 */
import data from "@/data/anime.json";

export type AnimeSeason = {
  name: string;
  episodeCount: number;
  year?: number;
  synopsis?: string;
};

export type AnimePoster = {
  variant: number;
  l1: number;
  l2: number;
  angle: number;
  hash: string;
};

export type Anime = {
  id: string;
  title: string;
  altTitles: string[];
  type: string;
  status: string;
  year: number;
  season: string;
  studio: string;
  rating: number;
  popularity: number;
  genres: string[];
  synopsis: string;
  duration: number;
  totalEpisodes: number;
  featured: boolean;
  poster: AnimePoster;
  seasons: AnimeSeason[];
};

export type AnimeDatabase = {
  anime: Anime[];
  top10: string[];
  genres: string[];
  studios: string[];
  years: number[];
};

const db = data as AnimeDatabase;

// Index for fast lookups
const byId = new Map<string, Anime>(db.anime.map((a) => [a.id, a]));

export function getAllAnime(): Anime[] {
  return db.anime;
}

export function getAnimeById(id: string): Anime | undefined {
  return byId.get(id);
}

export function getTop10(): Anime[] {
  return db.top10
    .map((id) => byId.get(id))
    .filter((a): a is Anime => Boolean(a));
}

export function getGenres(): string[] {
  return db.genres;
}

export function getStudios(): string[] {
  return db.studios;
}

export function getYears(): number[] {
  return db.years;
}

export type Episode = {
  number: number;       // global number within the entire series
  seasonIndex: number;
  seasonName: string;
  episodeInSeason: number;
  title: string;
  duration: number;
};

/**
 * Build a flat episode list for an anime (across all seasons).
 * Episodes are derived from each season's `episodeCount`.
 */
export function buildEpisodeList(anime: Anime): Episode[] {
  const eps: Episode[] = [];
  let global = 0;
  anime.seasons.forEach((season, sIdx) => {
    for (let i = 1; i <= season.episodeCount; i++) {
      global += 1;
      eps.push({
        number: global,
        seasonIndex: sIdx,
        seasonName: season.name,
        episodeInSeason: i,
        title: `${anime.title} — ${season.name} · Ep ${i}`,
        duration: anime.duration,
      });
    }
  });
  return eps;
}

/**
 * Build the gdriveplayer embed URL for an episode.
 * gdriveplayer.biz exposes a search-based embed that takes a title + episode.
 */
export function gdrivePlayerUrl(
  anime: Anime,
  episode: Episode,
): string {
  const title = encodeURIComponent(anime.title);
  const ep = episode.episodeInSeason;
  // gdriveplayer's anime embed endpoint
  return `https://gdriveplayer.biz/embed.php?title=${title}&episode=${ep}`;
}

export type Filters = {
  query?: string;
  genre?: string;
  year?: number | "all";
  type?: string | "all";
  status?: string | "all";
  studio?: string | "all";
  sort?: "popularity" | "rating" | "year-desc" | "year-asc" | "title";
};

export function filterAnime(filters: Filters): Anime[] {
  let list = getAllAnime();
  const q = filters.query?.trim().toLowerCase();
  if (q) {
    list = list.filter((a) => {
      const haystack = [a.title, ...a.altTitles, a.synopsis, a.studio, ...a.genres]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }
  if (filters.genre && filters.genre !== "all") {
    list = list.filter((a) => a.genres.includes(filters.genre as string));
  }
  if (filters.year && filters.year !== "all") {
    list = list.filter((a) => a.year === filters.year);
  }
  if (filters.type && filters.type !== "all") {
    list = list.filter((a) => a.type === filters.type);
  }
  if (filters.status && filters.status !== "all") {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters.studio && filters.studio !== "all") {
    list = list.filter((a) => a.studio === filters.studio);
  }

  switch (filters.sort) {
    case "rating":
      list = [...list].sort((a, b) => b.rating - a.rating);
      break;
    case "year-desc":
      list = [...list].sort((a, b) => b.year - a.year);
      break;
    case "year-asc":
      list = [...list].sort((a, b) => a.year - b.year);
      break;
    case "title":
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "popularity":
    default:
      // Specific anime first (featured flag), then by popularity
      list = [...list].sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return a.popularity - b.popularity;
      });
      break;
  }
  return list;
}
