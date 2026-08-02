# ichidok — Auto-Deploy to Vercel via GitHub Actions

Every time you `git push` to `main`, this workflow auto-deploys to Vercel.
No CLI, no manual steps after the one-time setup below.

## One-time setup (5 minutes)

### Step 1 — Get your Vercel credentials

You need three values from Vercel:

**1. Vercel access token:**
- Go to https://vercel.com/account/tokens
- Click "Create Token"
- Name it `github-actions`, set scope to "Full Account", expiration to whatever
- Copy the token (starts with `vercel_...`)

**2 & 3. Vercel Org ID and Project ID:**
- In your `ichidok` repo on your machine (or in Termux), run:
  ```bash
  cat ~/ichidok/.vercel/project.json
  ```
- That file was created when you ran `vercel link` earlier. It looks like:
  ```json
  {"orgId":"team_xxxxxxxx","projectId":"prj_yyyyyyyy"}
  ```
- If the file doesn't exist, run `vercel link` once and follow the prompts
  (link to your existing `ichidokv2` project on Vercel).

### Step 2 — Add the secrets to GitHub

1. Go to your GitHub repo: `https://github.com/<your-username>/ichidokv2`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these three:

| Name | Value |
|---|---|
| `VERCEL_TOKEN` | your `vercel_...` token from Step 1 |
| `VERCEL_ORG_ID` | the `orgId` value from `project.json` |
| `VERCEL_PROJECT_ID` | the `projectId` value from `project.json` |

### Step 3 — Push the workflow file

```bash
cd ~/ichidok
git add .github/workflows/deploy.yml
git commit -m "add auto-deploy workflow"
git push
```

## How it works

- Every `git push` to `main` triggers the workflow
- The workflow installs Vercel CLI, pulls your Vercel project config, builds, and deploys
- The deployment goes to your existing `ichidokv2` project on Vercel
- Vercel also auto-deploys on its own (it watches the same GitHub repo) — having
  both is fine, they don't conflict
- Check the workflow status: GitHub repo → **Actions** tab
- Check the deployment: https://vercel.com/dashboard → your `ichidokv2` project

## Updating

After making changes in the sandbox:
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
3. Wait ~60 seconds — your site is live

## Troubleshooting

**Workflow fails with "Vercel project not found"** — your `VERCEL_PROJECT_ID` is wrong. Re-run `vercel link` and grab the new ID from `.vercel/project.json`.

**Workflow fails with "Unauthorized"** — your `VERCEL_TOKEN` expired or was revoked. Generate a new one at https://vercel.com/account/tokens and update the GitHub secret.

**Workflow never triggers** — make sure you pushed to `main` (not `master`). Check the Actions tab in GitHub — if the workflow isn't even listed, the `.github/workflows/deploy.yml` file isn't in the repo.

**You already imported via Vercel dashboard** — that's fine, both methods work in parallel. The dashboard auto-deploy is faster (~30s vs ~90s for the action) but the action is more reliable and lets you see full build logs in GitHub.
