"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Search, Home, LayoutGrid, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const view = useApp((s) => s.view);
  const go = useApp((s) => s.go);
  const back = useApp((s) => s.back);
  const canGoBack = useApp((s) => s.canGoBack());

  // detect scroll for sticky shadow
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = view.name === "home";
  const isCatalog = view.name === "catalog";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur transition-shadow",
        scrolled && "shadow-[0_1px_0_0_var(--border)]",
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8">
        {/* Left: logo + back */}
        <div className="flex items-center gap-4">
          {canGoBack && (
            <button
              onClick={back}
              className="hidden items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground md:inline-flex"
              aria-label="Go back"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
          <button
            onClick={() => go({ name: "home" })}
            className="group flex items-center gap-2"
            aria-label="ichidok home"
          >
            <span className="flex h-7 w-7 items-center justify-center bg-foreground text-background">
              <span className="text-sm font-black leading-none">i</span>
            </span>
            <span className="text-base font-black tracking-tight">
              ichidok
            </span>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:inline">
              · anime
            </span>
          </button>
        </div>

        {/* Center: nav */}
        <nav className="flex items-center gap-1">
          <NavLink
            active={isHome}
            onClick={() => go({ name: "home" })}
            icon={<Home className="h-3.5 w-3.5" />}
            label="Home"
          />
          <NavLink
            active={isCatalog}
            onClick={() => go({ name: "catalog" })}
            icon={<LayoutGrid className="h-3.5 w-3.5" />}
            label="Catalog"
          />
        </nav>

        {/* Right: search shortcut */}
        <button
          onClick={() => go({ name: "catalog" })}
          className="inline-flex items-center gap-1.5 border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-foreground hover:text-background transition-colors"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden border border-border px-1 text-[9px] sm:inline">/</kbd>
        </button>
      </div>

      {/* keyboard shortcut for search */}
      <KeyboardShortcuts />
    </header>
  );
}

function NavLink({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function KeyboardShortcuts() {
  const go = useApp((s) => s.go);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ignore if typing in an input
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (e.key === "/") {
        e.preventDefault();
        go({ name: "catalog" });
      }
      if (e.key === "Escape") {
        go({ name: "home" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);
  return null;
}
