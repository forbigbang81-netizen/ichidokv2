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
  image_url?: string;       // Kitsu poster image (large)
  kitsu_id?: string;
  kitsu_url?: string;
  mal_id?: number;
  mal_url?: string;
  gdrive_slug?: string;     // gdriveplayer slug for subbed version
  gdrive_slug_dub?: string; // gdriveplayer slug for dubbed version (falls back to gdrive_slug)
  poster: AnimePoster;       // SVG fallback config (used if image fails to load)
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
 * Build a cast / share URL for an episode (points back at our own watch page,
 * not at any external source).
 */
export function shareUrlForEpisode(
  anime: Anime,
  episode: Episode,
): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/#/watch/${encodeURIComponent(anime.id)}?ep=${episode.number}&s=${episode.seasonIndex}`;
}

/**
 * Build the gdriveplayer embed URL for an episode.
 *
 * gdriveplayer's database has a slug per anime (e.g. "naruto", "bleach",
 * "jujutsu-kaisen"). The embed endpoint is:
 *   https://database.gdriveplayer.me/embed.php?type=anime&slug=<slug>&episode=<N>
 *
 * Returns null if the anime doesn't have a gdrive_slug.
 *
 * `lang` selects sub (Japanese audio + English subs) or dub (English dubbed).
 * For dub, we use the `gdrive_slug_dub` field if available, else fall back to
 * the sub slug.
 *
 * Episode number here is the episode within the SEASON.
 */
export type PlayerLang = "sub" | "dub";

export function gdriveEmbedUrl(
  anime: Anime,
  episode: Episode,
  lang: PlayerLang = "sub",
): string | null {
  const slug =
    lang === "dub"
      ? anime.gdrive_slug_dub || anime.gdrive_slug
      : anime.gdrive_slug;
  if (!slug) return null;
  const encodedSlug = encodeURIComponent(slug);
  const ep = episode.episodeInSeason;
  return `https://database.gdriveplayer.me/embed.php?type=anime&slug=${encodedSlug}&episode=${ep}`;
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
