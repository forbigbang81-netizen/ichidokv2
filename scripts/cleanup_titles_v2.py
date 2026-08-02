#!/usr/bin/env python3
"""
Title cleanup v2 — use the Kitsu cache to get the canonical English title.

For each anime that has a kitsu_id, look it up in the cache and:
  - Prefer titles.en (or titles.en_us), fallback to canonicalTitle
  - If the new title differs from the current title, swap them
  - Update altTitles to include the romaji (en_jp) and Japanese (ja_jp) versions
"""
import json
from pathlib import Path

ANIME_JSON = Path("/home/z/my-project/src/data/anime.json")
CACHE_FILE = Path("/home/z/my-project/scripts/kitsu_cache.json")

def main():
    data = json.loads(ANIME_JSON.read_text(encoding="utf-8"))
    cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))

    # Build a map of kitsu_id -> Kitsu entry from the cache
    kitsu_by_id = {}
    for url, resp in cache.items():
        if not isinstance(resp, dict) or "data" not in resp:
            continue
        entries = resp["data"]
        if not isinstance(entries, list):
            entries = [entries]
        for entry in entries:
            if not isinstance(entry, dict) or "id" not in entry:
                continue
            kitsu_by_id[str(entry["id"])] = entry

    print(f"Cache has {len(kitsu_by_id)} Kitsu entries.\n")

    changed = 0
    for anime in data["anime"]:
        kitsu_id = str(anime.get("kitsu_id") or "")
        if not kitsu_id or kitsu_id not in kitsu_by_id:
            continue

        entry = kitsu_by_id[kitsu_id]
        attrs = entry.get("attributes", {})
        titles = attrs.get("titles", {}) or {}
        canonical = attrs.get("canonicalTitle", "")

        # Pick the best English title
        new_title = titles.get("en") or titles.get("en_us") or canonical or ""
        if not new_title or new_title == anime["title"]:
            continue

        # Build new altTitles: keep romaji + japanese, plus the old title if different
        romaji = titles.get("en_jp", "")
        japanese = titles.get("ja_jp", "")
        new_alts = []
        for candidate in [romaji, japanese, anime["title"]]:
            if candidate and candidate != new_title and candidate not in new_alts:
                new_alts.append(candidate)
        # Append any existing altTitles that aren't duplicates
        for alt in anime.get("altTitles", []):
            if alt and alt != new_title and alt not in new_alts:
                new_alts.append(alt)

        old_title = anime["title"]
        anime["title"] = new_title
        anime["altTitles"] = new_alts
        changed += 1

    print(f"Updated {changed} titles.\n")
    print("Sample (first 30):")
    for a in data["anime"][:30]:
        print(f"  {a['title']}")

    ANIME_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSaved to {ANIME_JSON}")

if __name__ == "__main__":
    main()
