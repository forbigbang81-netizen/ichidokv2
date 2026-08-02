#!/usr/bin/env bash
# ichidok GitHub → Vercel deploy script.
# Run from the project root (where package.json lives).
set -e

echo "=== ichidok GitHub setup ==="
echo ""

# 1. Init git repo
if [ ! -d ".git" ]; then
  git init -b main
  echo "✓ Initialized git repo"
else
  echo "✓ Git repo already exists"
fi

# 2. Stage everything (respecting .gitignore)
git add -A

# 3. Commit
git commit -m "ichidok — deploy to Vercel as ichidokv2" --allow-empty
echo "✓ Committed"

# 4. Check if remote exists
if git remote get-url origin >/dev/null 2>&1; then
  echo "✓ Remote 'origin' already exists: $(git remote get-url origin)"
else
  echo ""
  echo "No remote set. Create a GitHub repo first:"
  echo ""
  echo "  Option A (CLI, fastest):"
  echo "    pkg install -y gh"
  echo "    gh auth login"
  echo "    gh repo create ichidok --public --source=. --push"
  echo ""
  echo "  Option B (manual):"
  echo "    1. Go to https://github.com/new"
  echo "    2. Repository name: ichidok"
  echo "    3. Click 'Create repository'"
  echo "    4. Run:"
  echo "       git remote add origin https://github.com/<your-username>/ichidok.git"
  echo "       git push -u origin main"
  echo ""
  echo "After the repo is pushed to GitHub, run this script again to confirm everything is up-to-date."
  exit 0
fi

# 5. Push
git push -u origin main
echo "✓ Pushed to GitHub"

echo ""
echo "=== Next step: Import to Vercel ==="
echo ""
echo "1. Go to: https://vercel.com/new"
echo "2. Find your 'ichidok' GitHub repo and click Import"
echo "3. Project Name:  ichidokv2   ← type this exactly (all lowercase)"
echo "4. Framework Preset: Next.js  (auto-detected)"
echo "5. Click Deploy"
echo ""
echo "Live URL: https://ichidokv2.vercel.app"
echo ""
echo "Every future 'git push' will auto-redeploy."
