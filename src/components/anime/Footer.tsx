"use client";

import { Github, Twitter, Twitch } from "lucide-react";
import { useApp } from "@/lib/store";

/**
 * Site footer. Sticks to the bottom of the viewport on short pages and is
 * pushed down naturally when content overflows (handled by the app shell's
 * `min-h-screen flex flex-col` wrapper).
 */
export function Footer() {
  const go = useApp((s) => s.go);

  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          {/* Brand */}
          <div className="max-w-sm">
            <button
              onClick={() => go({ name: "home" })}
              className="select-none text-left font-sans text-2xl font-extrabold tracking-tight"
            >
              <span className="text-[var(--brand)]">I</span>chidoki
            </button>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Stream anime in glorious quality. Clean, fast, free — the home for
              anime you love. Episodes served via Archive.org.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:gap-12">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Browse
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => go({ name: "home" })}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => go({ name: "catalog" })}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Catalog
                  </button>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                About
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://archive.org/details/movies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Archive.org
                  </a>
                </li>
                <li>
                  <a
                    href="https://archive.org/about/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ichidoki. All content is hosted by
            Archive.org. For archival & educational use.
          </p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a
              href="https://archive.org"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Archive.org"
              className="hover:text-[var(--brand)]"
            >
              <Github className="size-4" />
            </a>
            <a
              href="https://archive.org"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="hover:text-[var(--brand)]"
            >
              <Twitter className="size-4" />
            </a>
            <a
              href="https://archive.org"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitch"
              className="hover:text-[var(--brand)]"
            >
              <Twitch className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
