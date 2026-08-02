"use client";
import { useApp } from "@/lib/store";
import { Navbar } from "@/components/anime/Navbar";
import { Footer } from "@/components/anime/Footer";
import { HomePage } from "@/components/anime/HomePage";
import { CatalogPage } from "@/components/anime/CatalogPage";
import { DetailsPage } from "@/components/anime/DetailsPage";
import { WatchPage } from "@/components/anime/WatchPage";

export default function Home() {
  const view = useApp((s) => s.view);

  return (
    <div className="grain flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {view.name === "home" && <HomePage />}
        {view.name === "catalog" && (
          <CatalogPage initialQuery={view.initialQuery} />
        )}
        {view.name === "details" && <DetailsPage animeId={view.animeId} />}
        {view.name === "watch" && (
          <WatchPage
            animeId={view.animeId}
            episode={view.episode}
            seasonIndex={view.seasonIndex}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
