"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Navbar } from "@/components/anime/Navbar";
import { Footer } from "@/components/anime/Footer";
import { HomePage } from "@/components/anime/HomePage";
import { CatalogPage } from "@/components/anime/CatalogPage";
import { DetailsPage } from "@/components/anime/DetailsPage";
import { WatchPage } from "@/components/anime/WatchPage";
import { IchiflixPage } from "@/components/anime/IchiflixPage";
import { MoviePlayerPage } from "@/components/anime/MoviePlayerPage";

export default function Home() {
  const view = useApp((s) => s.view);

  const key =
    view.name === "details"
      ? `details:${view.animeId}`
      : view.name === "watch"
        ? `watch:${view.animeId}:${view.episode}`
        : view.name === "catalog"
          ? "catalog"
          : view.name === "ichiflix"
            ? "ichiflix"
            : view.name === "movie"
              ? `movie:${view.movieId}`
              : "home";

  // Ichiflix and Movie views are full-screen (no navbar/footer)
  const isFullScreen = view.name === "ichiflix" || view.name === "movie";

  return (
    <div className="grain relative flex min-h-screen flex-col bg-background">
      {!isFullScreen && <Navbar />}
      <main className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {view.name === "home" && <HomePage />}
            {view.name === "catalog" && (
              <CatalogPage initialQuery={view.initialQuery} />
            )}
            {view.name === "details" && <DetailsPage animeId={view.animeId} />}
            {view.name === "watch" && (
              <WatchPage animeId={view.animeId} episode={view.episode} />
            )}
            {view.name === "ichiflix" && <IchiflixPage />}
            {view.name === "movie" && <MoviePlayerPage movieId={view.movieId} />}
          </motion.div>
        </AnimatePresence>
      </main>
      {!isFullScreen && <Footer />}
    </div>
  );
}
