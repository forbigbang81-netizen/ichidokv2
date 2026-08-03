"use client";
/**
 * MoviePlayerPage — Netflix-style movie player.
 * Uses the same custom player as anime, but for movies (single video).
 */
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/store";
import { getMovieById, movieStreamUrl, moviePosterUrl } from "@/lib/movies";
import { CustomPlayer } from "./CustomPlayer";

export function MoviePlayerPage({ movieId }: { movieId: string }) {
  const go = useApp((s) => s.go);
  const back = useApp((s) => s.back);
  const movie = getMovieById(movieId);

  if (!movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg font-bold">Movie not found.</p>
          <button
            onClick={() => go({ name: "ichiflix" })}
            className="mt-4 text-sm text-[#E50914] hover:underline"
          >
            Back to Ichiflix
          </button>
        </div>
      </div>
    );
  }

  const streamUrl = movieStreamUrl(movie);
  const poster = moviePosterUrl(movie);

  return (
    <div className="min-h-screen bg-black">
      {/* Top bar */}
      <div className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-black/90 to-transparent px-4 py-3">
        <button
          onClick={back}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to Ichiflix</span>
        </button>
      </div>

      {/* Player */}
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-5xl aspect-video">
          <CustomPlayer
            src={streamUrl}
            poster={poster}
            title={movie.title}
            subtitle={`${movie.year} · Ichiflix`}
            autoPlay
          />
        </div>
      </div>
    </div>
  );
}
