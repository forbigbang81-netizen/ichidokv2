# ichidok

A clean black & white anime streaming UI. 508 titles (8 specific picks + 500 random), seasons tabs, episode lists, a gdriveplayer-powered watch page, and a custom non-Google "Send to Device" cast button.

## Stack
- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4 + shadcn/ui
- Zustand (in-app router with hash sync)
- No external image dependencies — posters are generated SVGs

## Deploy to Vercel as `ichidokV2`

### Option A — Vercel CLI
```bash
npm i -g vercel
vercel login
# when prompted, set project name to: ichidokV2
vercel --name ichidokV2
vercel --prod
```

### Option B — Vercel dashboard
1. Push this repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. **Project Name:** `ichidokV2` (must match exactly — Vercel will use this for the URL `ichidokV2.vercel.app`).
4. Framework Preset: **Next.js** (auto-detected).
5. Build Command: `next build` (auto-detected).
6. Output Directory: `.next` (auto-detected).
7. Click **Deploy**.

> If `ichidokV2` is taken, Vercel will suggest `ichidokV2-<random>` — to force the exact name, use the CLI with `--name ichidokV2`.

## Local dev
```bash
bun install
bun run dev    # http://localhost:3000
bun run lint   # eslint
```

## Project structure
```
src/
  app/
    layout.tsx           # root layout, dark theme by default
    page.tsx             # app shell — switches between views based on Zustand state
    globals.css          # pure black & white theme tokens
  components/anime/
    Navbar.tsx           # sticky top nav with Home / Catalog / Search
    Footer.tsx
    HomePage.tsx         # hero + search + Top 10 + featured + popular/recents rows
    CatalogPage.tsx      # filters (genre/year/type/status/studio) + sort + load-more
    DetailsPage.tsx      # poster, info, seasons tabs, episode list, recs
    WatchPage.tsx        # gdriveplayer iframe + episode search + list + Cast button
    AnimeCard.tsx        # poster card used everywhere
    AnimePoster.tsx      # deterministic black & white SVG poster generator
    CastButton.tsx       # custom "Send to Device" via QR code (no Google SDK)
  lib/
    anime.ts             # data accessors, filters, episode list, gdriveplayer URL
    store.ts             # Zustand in-app router with hash sync
  data/
    anime.json           # generated database (508 titles, ~600 KB)
scripts/
  generate_anime.py      # regenerates anime.json (8 specific + 500 random)
vercel.json              # Vercel deployment config (project name: ichidokV2)
```

## Notes
- **Episodes** are derived client-side from each season's `episodeCount`, keeping the JSON small.
- **gdriveplayer** embed URL: `https://gdriveplayer.biz/embed.php?title=<title>&episode=<n>`.
- **Cast** button uses a QR code (no Google Cast SDK, no API key, no account). Works on any device with a camera.
