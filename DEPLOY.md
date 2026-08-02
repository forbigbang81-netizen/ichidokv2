# ichidok — Deploy to Vercel

The sandbox **cannot run `vercel login` for you** (it requires an interactive browser OAuth flow tied to your account). But the project is 100% deploy-ready — production build passes in 11s.

You have **two paths**. Pick whichever you prefer.

---

## Path A — Vercel CLI (fastest, ~2 min)

```bash
# 1. Download the project (or open a terminal in your sandbox)

# 2. Install Vercel CLI + login (one time, on your machine)
npm i -g vercel
vercel login              # opens browser, pick GitHub/email login

# 3. From the project root, deploy as PREVIEW
./scripts/deploy-vercel.sh

# 4. When you're happy, ship to PRODUCTION
./scripts/deploy-vercel.sh prod
```

Your site goes live at **`https://ichidokV2.vercel.app`** (if the name is taken, Vercel suggests `ichidokV2-<random>` — to force the exact name, the script passes `--name ichidokV2`).

---

## Path B — GitHub → Vercel dashboard (auto-redeploys on every push)

```bash
# 1. Push to GitHub
git init
git add -A
git commit -m "ichidok initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/ichidok.git
git push -u origin main
```

```text
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. Project Name: ichidokV2      ← type it exactly
5. Framework Preset: Next.js    ← auto-detected
6. Build Command: next build    ← auto-detected
7. Output Directory: .next      ← auto-detected
8. Click "Deploy"
```

Every future `git push` to `main` triggers an automatic redeploy.

---

## Why I can't do it for you

- `vercel login` opens a browser OAuth flow that must be completed by **your** GitHub/email account — the sandbox has no access to your Vercel account.
- The sandbox doesn't have the Vercel CLI installed, and even if it did, the OAuth callback can't reach back here.
- This is the same reason you'd never want a sandbox deploying to your account — it would be a security hole.

## What I *did* verify for you

- ✅ `next build` completes in 11s (the exact command Vercel runs)
- ✅ `vercel.json` configured with project name `ichidokV2`, Next.js framework, security headers
- ✅ `next.config.ts` updated with `images.remotePatterns` for `media.kitsu.app` + `api.qrserver.com` (so Vercel Image Optimization works)
- ✅ `.gitignore` excludes `node_modules`, `.next`, `.vercel`, logs — clean repo
- ✅ `package.json` has the right `build` script
- ✅ `scripts/deploy-vercel.sh` — one-command deploy helper
- ✅ No environment variables needed (Kitsu API is public, gdriveplayer is public)

## Need help?

If `vercel login` or `git push` errors out, paste the error here and I'll walk you through it.
