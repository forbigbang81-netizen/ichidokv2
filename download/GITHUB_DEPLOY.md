# ichidok — Deploy via GitHub (most reliable method)

The `vercel` CLI from Termux was fighting you (file not found, project name
conflicts, OAuth friction). The **GitHub → Vercel dashboard** method is much
more reliable because:

- No tarball juggling — git handles the upload
- Every future `git push` auto-redeploys
- You pick the project name `ichidokv2` in the Vercel UI (no CLI guessing)
- Works even from a fresh Termux install

---

## Step 1 — Get the project into Termux

**Re-download `ichidok.tar.gz`** (423 KB) from the sandbox preview.

Then in Termux:

```bash
termux-setup-storage
mkdir ~/ichidok
cd ~/ichidok
# Try Downloads folder first:
cp /storage/emulated/0/Download/ichidok.tar.gz ~/
# If that fails, find where it actually downloaded:
find /storage/emulated/0 -name "ichidok.tar.gz" 2>/dev/null
# ...then cp from the path that find printed

tar -xzf ~/ichidok.tar.gz -C ~/ichidok
cd ~/ichidok

# Set the project name to ichidokv2 (lowercase) if not already
sed -i 's/"ichidokV2"/"ichidokv2"/' vercel.json
grep '"name"' vercel.json
# Should print:  "name": "ichidokv2",
```

## Step 2 — Install git + GitHub CLI

```bash
pkg install -y git gh
```

## Step 3 — Authenticate with GitHub (one time)

```bash
gh auth login
```

Choose:
- **GitHub.com**
- **HTTPS** protocol
- **Login with a web browser**
- It prints a one-time code (e.g. `XXXX-XXXX`) — long-press it → Copy
- Long-press the URL it prints → Open in browser
- Paste the code, log into GitHub, authorize

## Step 4 — Create a GitHub repo + push the code

```bash
cd ~/ichidok
gh repo create ichidok --public --source=. --push
```

This creates a public GitHub repo at `https://github.com/<your-username>/ichidok`
and pushes all the code there.

## Step 5 — Import to Vercel (the easy part)

1. Open your phone browser → **https://vercel.com/new**
2. Log in with **GitHub** if not already
3. Find your `ichidok` repo in the list → click **Import**
4. Configure:
   - **Project Name:** `ichidokv2` ← type this exactly (all lowercase)
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** `next build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `bun install` (auto-detected from vercel.json)
5. Click **Deploy**

Wait ~30 seconds. Your site goes live at **https://ichidokv2.vercel.app** 🎉

## Step 6 — Future updates

Every time you make changes in the sandbox:

1. Re-download `ichidok.tar.gz`
2. In Termux:
```bash
cd ~/ichidok
cp /storage/emulated/0/Download/ichidok.tar.gz ~/
tar -xzf ~/ichidok.tar.gz -C .
git add -A
git commit -m "update ichidok"
git push
```

Vercel auto-redeploys within ~30s of the push landing. No CLI, no
prompts, no project name conflicts.

---

## Troubleshooting

**`gh: command not found`** — run `pkg install -y gh` again. If still missing, run `pkg update && pkg upgrade` first.

**`gh auth login` says "device flow unsupported"** — pick HTTPS instead of SSH when prompted.

**Vercel says project name already taken** — that means another user got `ichidokv2.vercel.app` first. Pick something unique like `ichidok-v2`, `ichidokv3`, or `<your-username>-ichidok`.

**`git push` asks for password** — you forgot to `gh auth login` or the token expired. Re-run `gh auth login`.

**Push fails with "refusing to allow an OAuth App to create or update workflow"** — when `gh auth login` asks about scopes, make sure to include `repo` and `workflow`.

---

## Why this is better than the CLI method

| | `vercel` CLI | GitHub → Vercel dashboard |
|---|---|---|
| Initial setup | `npm i -g vercel` + OAuth | `gh auth login` (one-time) |
| Each deploy | Run `vercel --prod --yes` and hope it links right | `git push` — automatic |
| Project name control | Read from `vercel.json` (sometimes ignored if linked) | Typed into UI (always wins) |
| Updates from sandbox | Re-download tarball every time | Same, but git remembers your repo |
| Recovery from broken state | Manually delete `.vercel`, `.env.local` | Just `git push` again — no state to break |
