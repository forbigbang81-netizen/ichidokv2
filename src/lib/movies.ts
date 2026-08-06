/**
 * Ichiflix movie data — loaded from src/data/ichiflix-movies.json.
 * Movies are from Archive.org with direct streamable URLs.
 */
import moviesData from "@/data/ichiflix-movies.json";

export type Movie = {
  id: string;
  title: string;
  year: number;
  identifier: string;
  url: string;
  size_gb: number;
  poster: string;
  poster_url?: string;
};

const movies = moviesData as Movie[];

export function getAllMovies(): Movie[] {
  return movies;
}

export function getMovieById(id: string): Movie | undefined {
  return movies.find((m) => m.id === id);
}

export function getMoviesByFranchise(franchise: string): Movie[] {
  const f = franchise.toLowerCase();
  return movies.filter((m) => m.title.toLowerCase().includes(f));
}

export function getFranchises(): { name: string; movies: Movie[] }[] {
  return [
    { name: "Spider-Man", movies: getMoviesByFranchise("spider") },
    { name: "Thor", movies: getMoviesByFranchise("thor") },
    { name: "All Movies", movies },
  ].filter((f) => f.movies.length > 0);
}

export function moviePosterUrl(movie: Movie): string {
  // Use official TMDB poster if available, otherwise fall back to Archive.org thumbnail
  if (movie.poster_url) return movie.poster_url;
  return `https://archive.org/services/img/${encodeURIComponent(movie.identifier)}`;
}

export function movieStreamUrl(movie: Movie): string {
  return `/api/stream?url=${encodeURIComponent(movie.url)}`;
}
