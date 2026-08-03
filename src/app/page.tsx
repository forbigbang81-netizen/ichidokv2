"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Navbar } from "@/components/anime/Navbar";
import { Footer } from "@/components/anime/Footer";
import { HomePage } from "@/components/anime/HomePage";
import { CatalogPage } from "@/components/anime/CatalogPage";
import { DetailsPage } from "@/components/anime/DetailsPage";
import { WatchPage } from "@/components/anime/WatchPage";

/**
 * App shell. The whole site lives on `/` and is driven by the hash router,
 * which lets us share deep links (#/watch/attack-on-titan?ep=1) and still
 * work on platforms that only expose a single route.
 */
export default function Home() {
  const view = useApp((s) => s.view);

  // A unique key per view + its main identifier, so AnimatePresence can
  // animate between them.
  const key =
    view.name === "details"
      ? `details:${view.animeId}`
      : view.name === "watch"
        ? `watch:${view.animeId}:${view.episode}`
        : view.name === "catalog"
          ? "catalog"
          : "home";

  return (
    <div className="grain relative flex min-h-screen flex-col bg-background">
      <Navbar />
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
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
