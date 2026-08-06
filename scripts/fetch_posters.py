#!/usr/bin/env python3
"""
Fetch poster URLs for all anime using the Kitsu API.
Kitsu allows looking up anime by MAL ID: https://kitsu.app/api/edge/anime?filter[mal_id]=XXX
"""
import json
import re
import sys
import time
from pathlib import Path

import requests

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
HEADERS = {"User-Agent": UA, "Accept": "application/vnd.api+json"}

CACHE_FILE = Path("/home/z/my-project/scripts/kitsu_cache.json")
CACHE = {}
if CACHE_FILE.exists():
    try:
        CACHE = json.loads(CACHE_FILE.read_text())
    except Exception:
        pass


def fetch_poster_by_mal_id(mal_id: int) -> str | None:
    """Fetch poster URL from Kitsu API by MAL ID."""
    if not mal_id:
        return None
    key = f"mal_{mal_id}"
    if key in CACHE:
        return CACHE[key]
    try:
        r = requests.get(
            "https://kitsu.app/api/edge/anime",
            params={"filter[mal_id]": mal_id, "page[limit]": 1},
            headers=HEADERS,
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()
        if data.get("data"):
            attrs = data["data"][0].get("attributes", {})
            poster = attrs.get("posterImage", {})
            url = poster.get("large") or poster.get("medium") or poster.get("original")
            if url:
                CACHE[key] = url
                return url
    except Exception as e:
        sys.stderr.write(f"FAIL mal_id={mal_id}: {e}\n")
    CACHE[key] = None
    return None


def fetch_poster_by_slug(slug: str) -> str | None:
    """Fetch poster URL from anigo.re anime page (uses og:image)."""
    key = f"slug_{slug}"
    if key in CACHE:
        return CACHE[key]
    try:
        r = requests.get(f"https://anigo.re/anime/{slug}/", headers={"User-Agent": UA}, timeout=15)
        r.raise_for_status()
        m = re.search(r'<meta property="og:image" content="([^"]+)"', r.text)
        if m:
            url = m.group(1)
            CACHE[key] = url
            return url
    except Exception as e:
        sys.stderr.write(f"FAIL slug={slug}: {e}\n")
    CACHE[key] = None
    return None


def main():
    entries = json.loads(Path("/home/z/my-project/scripts/new_entries.json").read_text())
    print(f"Fetching posters for {len(entries)} anime...")

    # Load existing poster map
    posters_path = Path("/home/z/my-project/src/data/anime-posters.json")
    existing_posters = json.loads(posters_path.read_text())
    print(f"Existing posters: {len(existing_posters)}")

    new_posters = {}
    for i, e in enumerate(entries, 1):
        anime_id = e["id"]
        if anime_id in existing_posters:
            continue
        # Try slug first (more reliable than Kitsu API which fails often)
        poster = fetch_poster_by_slug(e["slug"])
        if not poster and e.get("mal_id"):
            poster = fetch_poster_by_mal_id(e["mal_id"])
        if poster:
            new_posters[anime_id] = poster
            print(f"[{i}/{len(entries)}] OK  {anime_id} -> {poster}", flush=True)
        else:
            print(f"[{i}/{len(entries)}] MISS {anime_id}", flush=True)
        # Save cache every 5 entries
        if i % 5 == 0:
            CACHE_FILE.write_text(json.dumps(CACHE, indent=2))

    # Merge and save
    merged = {**existing_posters, **new_posters}
    posters_path.write_text(json.dumps(merged, indent=2))
    CACHE_FILE.write_text(json.dumps(CACHE, indent=2))
    print(f"\nAdded {len(new_posters)} new posters (total: {len(merged)})")


if __name__ == "__main__":
    main()
