"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, Search, Home, LayoutGrid, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { SearchOverlay } from "@/components/anime/SearchOverlay";
import { cn } from "@/lib/utils";

/**
 * Sticky top navigation.
 * - Blurred translucent background once the user scrolls
 * - Logo "Ichidoki" with an orange "I"
 * - Home / Catalog links (active state from the router)
 * - Search button opens the full-screen SearchOverlay
 * - Framer Motion slide-down on mount
 * - Mobile: collapses to icon + search
 */
export function Navbar() {
  const view = useApp((s) => s.view);
  const go = useApp((s) => s.go);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Toggle the "scrolled" blurred style once the user scrolls down.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (e.key === "/" && tag !== "input" && tag !== "textarea") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isHome = view.name === "home";
  const isCatalog = view.name === "catalog";

  const navItem = (active: boolean, label: string, icon: React.ReactNode, onClick: () => void) => (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-[var(--brand)]"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
    </button>
  );

  return (
    <>
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        className={cn(
          "sticky top-0 z-40 w-full border-b transition-colors duration-300",
          scrolled
            ? "border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
            : "border-transparent bg-gradient-to-b from-background/90 to-transparent",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left — logo + nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => go({ name: "home" })}
              className="select-none pr-2 font-sans text-2xl font-extrabold tracking-tight"
              aria-label="Ichidoki home"
            >
              <span className="text-[var(--brand)] text-glow-brand">I</span>
              chidoki
            </button>

            <nav className="ml-2 hidden items-center gap-1 md:flex">
              {navItem(isHome, "Home", <Home className="size-4" />, () =>
                go({ name: "home" }),
              )}
              {navItem(isCatalog, "Catalog", <LayoutGrid className="size-4" />, () =>
                go({ name: "catalog" }),
              )}
            </nav>
          </div>

          {/* Right — search + mobile menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="group flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-sm text-muted-foreground hover:border-[var(--brand)]/60 hover:text-foreground"
              aria-label="Search anime"
            >
              <Search className="size-4 text-muted-foreground group-hover:text-[var(--brand)]" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-2 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                /
              </kbd>
            </button>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent/60 hover:text-foreground md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              <button
                onClick={() => {
                  go({ name: "home" });
                  setMobileOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  isHome ? "bg-accent text-foreground" : "text-muted-foreground",
                )}
              >
                <Home className="size-4" /> Home
              </button>
              <button
                onClick={() => {
                  go({ name: "catalog" });
                  setMobileOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  isCatalog ? "bg-accent text-foreground" : "text-muted-foreground",
                )}
              >
                <LayoutGrid className="size-4" /> Catalog
              </button>
            </div>
          </motion.div>
        )}
      </motion.header>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
