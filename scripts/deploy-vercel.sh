#!/usr/bin/env bash
# ichidok one-shot Vercel deploy script.
# Run this from the project root after `npm i -g vercel` and `vercel login`.
#
# Usage:
#   ./scripts/deploy-vercel.sh         # preview deployment
#   ./scripts/deploy-vercel.sh prod    # production deployment
set -e

PROJECT_NAME="ichidokV2"

# Check vercel CLI is installed
if ! command -v vercel >/dev/null 2>&1; then
  echo "✗ Vercel CLI is not installed."
  echo "  Install with:  npm i -g vercel"
  echo "  Then run:      vercel login"
  exit 1
fi

# Check we're in the project root
if [ ! -f "package.json" ] || [ ! -f "next.config.ts" ]; then
  echo "✗ Run this from the project root (where package.json lives)."
  exit 1
fi

echo "=== Deploying ichidok to Vercel as: $PROJECT_NAME ==="
echo ""

if [ "$1" = "prod" ]; then
  echo "Target: PRODUCTION"
  vercel --prod --yes --name "$PROJECT_NAME"
  echo ""
  echo "✓ Deployed to production."
  echo "  Your site: https://$PROJECT_NAME.vercel.app"
else
  echo "Target: PREVIEW"
  vercel --yes --name "$PROJECT_NAME"
  echo ""
  echo "✓ Preview deployment created."
  echo "  Run this again with 'prod' arg to ship to production:"
  echo "    ./scripts/deploy-vercel.sh prod"
fi
