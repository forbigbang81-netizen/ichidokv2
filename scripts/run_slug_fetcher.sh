#!/usr/bin/env bash
# Run the slug fetcher in a loop, restarting if it dies, until all slugs are fetched.
cd /home/z/my-project
while true; do
  remaining=$(python3 -c "
import json
data = json.load(open('src/data/anime.json'))
print(sum(1 for a in data['anime'] if not a.get('gdrive_slug')))
")
  if [ "$remaining" = "0" ]; then
    echo "All slugs fetched!"
    break
  fi
  echo "=== $(date +%H:%M:%S) — $remaining anime remaining ==="
  timeout 90 python3 scripts/fetch_gdrive_slugs.py 2>&1 | tail -20
  echo ""
  sleep 3  # brief pause between runs
done
