# Ichidoki — Anime Streaming Site

**Task ID:** ichidoki-build
**Agent:** Z.ai Code (single-agent full build)
**Status:** ✅ Complete — all files written, lint clean, dev server returns 200, stream proxy returns 206.

## What was built

A complete, production-ready anime streaming site ("Ichidoki") built on the
existing Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui scaffold. Dark theme
(#0a0a0a) with a warm orange (#FF6B00) Funimation/Crunchyroll-style accent.

### Files written / rewritten
- `next.config.ts` — added `archive.org` + `api.qrserver.com` to image remotePatterns.
- `src/lib/anime.ts` — data layer: loads `anime-archive.json` (17 anime), merges hand-curated editorial metadata (synopsis, genres, year, studio, rating, popularity, backdropColor). Exposes `getAllAnime`, `getAnimeById`, `getTopAnime`, `getFeaturedAnime`, `getPopularAnime`, `getRecentlyAdded`, `getGenres`, `searchAnime`, `posterUrl`, `streamProxyUrl`, `formatRating`, `formatTime`.
- `src/lib/store.ts` — Zustand hash router. Views: home / catalog / details(id) / watch(id, episode). Hash format `#/`, `#/catalog`, `#/anime/<id>`, `#/watch/<id>?ep=<n>`. Supports `go` / `replace` / `back` + browser popstate sync.
- `src/app/globals.css` — dark theme, orange `--brand` accent, thin orange custom scrollbar, smooth transitions on all interactive elements, film-grain overlay, snap-x row helper, brand pulse + shimmer keyframes, `.ichidoki-range` styling for the seek bar.
- `src/app/layout.tsx` — title "Ichidoki — Stream Anime", `.dark` on `<html>`, Geist + Geist Mono fonts, dark Sonner toaster.
- `src/app/page.tsx` — app shell: Navbar + AnimatePresence view transitions (fade+slide) keyed per view + Footer. Sticky footer via `min-h-screen flex flex-col`.
- `src/app/api/stream/route.ts` — **rewritten** to use Node `http`/`https` modules with manual 3xx redirect-following instead of undici `fetch` (undici timed out connecting to archive.org's CDN host `dnXXX.us.archive.org` in this sandbox; the `https` module connects fine). Streams bytes via `Readable.toWeb`, passes through Content-Type/Length/Range, sets CORS + `Accept-Ranges: bytes`. Verified: returns `HTTP 206` with `content-range: bytes 0-2047/136047953` for Death Note E01.
- `src/components/anime/Footer.tsx` — brand footer, sticky to bottom, social links.
- `src/components/anime/Navbar.tsx` — sticky blurred bar, orange-accent "I"chidoki logo, Home/Catalog nav with `layoutId` active indicator, search button (opens overlay), `/` keyboard shortcut, mobile menu, Framer Motion slide-down on mount.
- `src/components/anime/SearchOverlay.tsx` — full-screen overlay, auto-focus input, live results with Archive.org posters + rating badges, ↑/↓/Enter/Esc keyboard nav, backdrop click closes.
- `src/components/anime/AnimeCard.tsx` — poster card with Archive.org thumbnail, rating + episode-count badges, hover overlay (scale + glow + play affordance), staggered fade-in, branded gradient fallback when poster fails.
- `src/components/anime/HomePage.tsx` — rotating hero carousel (featured anime, blurred poster backdrop, synopsis, Watch Now / More Info), three horizontal snap-scroll rails (Popular / Top Rated / Recently Added) with scroll buttons.
- `src/components/anime/CatalogPage.tsx` — search bar + genre filter chips + sort (Popular/Rating/Newest/A–Z) + responsive grid (2 cols mobile → 6 cols desktop) + Load more pagination.
- `src/components/anime/DetailsPage.tsx` — hero banner with metadata badges, genres, synopsis, Play Episode 1 CTA, episode grid with thumbnails + play affordance, slide-in transition.
- `src/components/anime/CustomPlayer.tsx` — Crunchyroll-style HTML5 player: center play button when paused, bottom control bar with gradient overlay, custom seek bar (buffered indicator + hover preview + drag), volume slider, speed settings (0.5–2×), ±10s skip, fullscreen, auto-hide controls after 3s, keyboard shortcuts (space/k, ←→/jl, ↑↓ volume, f, m, 0–9 seek %), loading + error states, retry button.
- `src/components/anime/CastDialog.tsx` — "Cast to TV" dialog (no Google Cast SDK): detects Presentation API via `useMemo`, offers "Start Cast" (`new PresentationRequest(url).start()`) when supported, always shows a QR code of the absolute stream URL as the reliable fallback. Resets status via an `onOpenChange` wrapper (no setState-in-effect).

### Legacy files removed
`AnimePoster.tsx`, `CastButton.tsx`, `lib/archive-sources.ts`, `lib/gdrive-sources.ts`,
`app/api/video-source/route.ts`, `app/api/drive-stream/route.ts`, `data/anime.json` —
all superseded by the new archive.org-based implementation.

### Verification
- `bun run lint` → clean (0 errors, 0 warnings).
- `GET /` → HTTP 200, renders "Ichidoki", "Featured", "Watch Now", "Popular Now", "Top Rated", "Recently Added".
- `GET /api/stream?url=<archive url>` with `Range: bytes=0-2047` → HTTP 206, `content-type: video/mp4`, `content-range: bytes 0-2047/136047953`, valid MP4 bytes.
- Archive.org poster service `https://archive.org/services/img/<identifier>` → HTTP 200 JPEG.

### Key engineering decisions
1. **Stream proxy uses Node `https` not `fetch`.** Node v24's undici `fetch` times out
   (`ConnectTimeoutError`) on archive.org's CDN redirect target in this sandbox;
   the `https` module connects instantly. Manual redirect-following + `Readable.toWeb`
   streams bytes straight to the Response without buffering.
2. **No setState-in-effect cascades.** CatalogPage resets pagination in change handlers;
   SearchOverlay resets selection in `changeQuery` and closes via a memoised `close`;
   CastDialog detects Presentation API support via `useMemo` (client-only, safe because
   the dialog only renders post-hydration after a click).
3. **Remount-based player state.** WatchPage keys `<CustomPlayer key={current.ep_num}>`
   so a new episode fully remounts the player — no per-src reset effect needed.
4. **Hash router** so deep links (`#/watch/attack-on-titan?ep=1`) work even though the
   sandbox only exposes `/`.
