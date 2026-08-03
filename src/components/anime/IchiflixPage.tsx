"use client";
/**
 * IchiflixPage — Netflix-style movie browsing experience.
 * Red/black theme, horizontal rows, large hero banner.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Play, ChevronLeft, Search } from "lucide-react";
import { useApp } from "@/lib/store";
import {
  getAllMovies,
  getFranchises,
  moviePosterUrl,
  type Movie,
} from "@/lib/movies";

export function IchiflixPage() {
  const go = useApp((s) => s.go);
  const back = useApp((s) => s.back);
  const movies = getAllMovies();
  const franchises = getFranchises();

  const featured = useMemo(() => movies[0], [movies]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Netflix-style nav bar */}
      <div className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-black/90 to-transparent px-4 py-3 md:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={back}
              className="text-white/60 hover:text-white"
              aria-label="Back to Ichidoki"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-black tracking-tighter text-[#E50914]">
              ICHIFLIX
            </h1>
          </div>
          <button
            onClick={() => go({ name: "home" })}
            className="text-sm font-medium text-white/60 hover:text-white"
          >
            Back to Ichidoki
          </button>
        </div>
      </div>

      {/* Hero banner */}
      {featured && (
        <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
          <img
            src={moviePosterUrl(featured)}
            alt={featured.title}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />

          {/* Hero content */}
          <div className="relative z-10 flex h-full flex-col justify-end pb-16 px-4 md:px-10 md:pb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#E50914]">
                Featured Movie
              </p>
              <h2 className="mb-3 text-4xl font-black tracking-tight md:text-6xl">
                {featured.title}
              </h2>
              <p className="mb-4 max-w-md text-sm text-white/70">
                {featured.year} · {featured.size_gb}GB · Streamed from Archive.org
              </p>
              <button
                onClick={() => go({ name: "movie", movieId: featured.id })}
                className="inline-flex items-center gap-2 bg-white px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-white/80"
              >
                <Play className="h-5 w-5 fill-black" />
                Play
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Movie rows */}
      <div className="relative z-10 -mt-20 space-y-8 px-4 pb-20 md:px-10">
        {franchises.map((franchise, fIdx) => (
          <motion.section
            key={franchise.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: fIdx * 0.1 }}
          >
            <h3 className="mb-3 text-lg font-bold tracking-tight md:text-xl">
              {franchise.name}
            </h3>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
              {franchise.movies.map((movie, mIdx) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => go({ name: "movie", movieId: movie.id })}
                  index={mIdx}
                />
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}

function MovieCard({
  movie,
  onClick,
  index,
}: {
  movie: Movie;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.08 }}
      onClick={onClick}
      className="relative shrink-0 overflow-hidden rounded-md bg-zinc-900 w-[140px] md:w-[200px]"
    >
      <div className="aspect-[2/3] w-full">
        <img
          src={moviePosterUrl(movie)}
          alt={movie.title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            img.style.display = "none";
          }}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-8">
        <p className="line-clamp-2 text-xs font-bold leading-tight">
          {movie.title}
        </p>
        <p className="mt-0.5 text-[10px] text-white/50">{movie.year}</p>
      </div>
    </motion.button>
  );
}
