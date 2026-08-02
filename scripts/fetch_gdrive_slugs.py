#!/usr/bin/env python3
"""
Fetch the gdriveplayer embed URL for each anime in our database.

For each anime:
  1. Search https://database.gdriveplayer.me/anime.php?s=<title>
  2. Parse the search results to find the matching title (preferring exact matches,
     then "TV Series" type, then non-dub versions)
  3. Extract the slug from the result link
  4. Build the embed URL: https://databasegdriveplayer.xyz/player.php?type=anime&slug=<slug>&episode=<N>

Writes the slug + embed URL template back into anime.json (one field per anime).
"""
import json
import time
import urllib.request
import urllib.parse
import re
import sys
from pathlib import Path

ANIME_JSON = Path("/home/z/my-project/src/data/anime.json")
CACHE_FILE = Path("/home/z/my-project/scripts/gdrive_slug_cache.json")
SEARCH_URL = "https://database.gdriveplayer.me/anime.php"

EMBED_TEMPLATE = "https://databasegdriveplayer.xyz/player.php?type=anime&slug={slug}&episode={ep}"

# Load cache
if CACHE_FILE.exists():
    CACHE = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
else:
    CACHE = {}

def save_cache():
    CACHE_FILE.write_text(json.dumps(CACHE, ensure_ascii=False, indent=2), encoding="utf-8")

def fetch_url(url, retries=4):
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Referer": "https://database.gdriveplayer.me/",
                },
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except Exception as e:
            last_err = e
            wait = 3 + attempt * 3  # 3s, 6s, 9s, 12s
            print(f"    Retry {attempt+1}/{retries} in {wait}s ({e})", flush=True)
            time.sleep(wait)
    raise last_err if last_err else RuntimeError("fetch failed")

def search_anime(title):
    """Search gdriveplayer for an anime title. Returns list of {slug, title, type, episodes, status}."""
    cache_key = f"search:{title.lower()}"
    if cache_key in CACHE:
        return CACHE[cache_key]

    q = urllib.parse.urlencode({"s": title})
    url = f"{SEARCH_URL}?{q}"
    try:
        html = fetch_url(url)
    except Exception as e:
        print(f"    Search failed: {e}", file=sys.stderr)
        CACHE[cache_key] = []
        return []

    # Parse the table rows. Each row looks like:
    # <tr>
    #   <td>1</td>
    #   <td><img src="...poster..."></td>
    #   <td><a href="anime.php?slug=NARUTO">Naruto</a></td>
    #   <td>220</td>
    #   <td>Completed</td>
    #   <td>TV Series</td>
    #   <td><a href="...">Click Here</a></td>
    # </tr>
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.DOTALL)
    results = []
    for row in rows:
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.DOTALL)
        if len(cells) < 6:
            continue
        # cell 2 = title (contains the slug link)
        title_cell = cells[2]
        slug_match = re.search(r"anime\.php\?slug=([\w\-]+)", title_cell)
        title_match = re.search(r">([^<]+)</a>", title_cell)
        if not slug_match or not title_match:
            continue
        slug = slug_match.group(1)
        result_title = title_match.group(1).strip()
        # cell 3 = episode count
        try:
            episodes = int(re.sub(r"<[^>]+>", "", cells[3]).strip())
        except (ValueError, IndexError):
            episodes = 0
        # cell 4 = status
        status = re.sub(r"<[^>]+>", "", cells[4]).strip() if len(cells) > 4 else ""
        # cell 5 = type
        type_ = re.sub(r"<[^>]+>", "", cells[5]).strip() if len(cells) > 5 else ""

        results.append({
            "slug": slug,
            "title": result_title,
            "episodes": episodes,
            "status": status,
            "type": type_,
        })

    CACHE[cache_key] = results
    return results

def pick_best_result(search_title, results):
    """Pick the best matching result from a list of search results.
    Preference order:
      1. Exact title match (case-insensitive), non-dub, TV Series
      2. Exact title match (case-insensitive), non-dub, any type
      3. Exact title match (case-insensitive), any
      4. Starts-with match, non-dub, TV Series
      5. Contains match, non-dub, TV Series
      6. First result
    """
    if not results:
        return None

    st = search_title.lower().strip()
    # Strip parentheticals like "(2011)" or "(TV)"
    st_clean = re.sub(r"\s*\([^)]*\)\s*", "", st).strip()
    st_clean = re.sub(r"[^a-z0-9 ]", "", st_clean).strip()

    def normalize(s):
        s = s.lower().strip()
        s = re.sub(r"\s*\([^)]*\)\s*", "", s).strip()
        s = re.sub(r"[^a-z0-9 ]", "", s).strip()
        return s

    # 1. Exact, non-dub, TV
    for r in results:
        n = normalize(r["title"])
        if n == st_clean and "dub" not in n and r["type"] == "TV Series":
            return r
    # 2. Exact, non-dub, any
    for r in results:
        n = normalize(r["title"])
        if n == st_clean and "dub" not in n:
            return r
    # 3. Exact, any
    for r in results:
        n = normalize(r["title"])
        if n == st_clean:
            return r
    # 4. Starts with, non-dub, TV
    for r in results:
        n = normalize(r["title"])
        if n.startswith(st_clean) and "dub" not in n and r["type"] == "TV Series":
            return r
    # 5. Contains, non-dub, TV
    for r in results:
        n = normalize(r["title"])
        if st_clean in n and "dub" not in n and r["type"] == "TV Series":
            return r
    # 6. First non-dub result
    for r in results:
        n = normalize(r["title"])
        if "dub" not in n:
            return r
    # 7. First
    return results[0]

# Specific anime known slugs (overrides — these we want exactly right)
SPECIFIC_SLUGS = {
    "akame-ga-kill": "akame-ga-kill",
    "hunter-x-hunter-2011": "hunter-x-hunter-2011",
    "jujutsu-kaisen": "jujutsu-kaisen",
    "highschool-dxd": "high-school-dxd",
    "naruto": "naruto",
    "naruto-shippuden": "naruto-shippuden",
    "bleach": "bleach",
    "bleach-thousand-year-blood-war": "bleach-sennen-kessen-hen",
}

def main():
    print("=== ichidok: gdriveplayer slug lookup ===", flush=True)
    data = json.loads(ANIME_JSON.read_text(encoding="utf-8"))
    anime_list = data["anime"]
    print(f"Total anime: {len(anime_list)}\n", flush=True)

    found = 0
    missing = 0
    save_every = 10

    for i, anime in enumerate(anime_list):
        anime_id = anime["id"]
        title = anime["title"]

        # Skip if already has slug
        if anime.get("gdrive_slug"):
            found += 1
            continue

        # Check cache for the slug first
        cache_key = f"slug:{anime_id}"
        if cache_key in CACHE:
            anime["gdrive_slug"] = CACHE[cache_key]
            if CACHE[cache_key]:
                found += 1
            else:
                missing += 1
            continue

        # Use override for specific anime
        if anime_id in SPECIFIC_SLUGS:
            slug = SPECIFIC_SLUGS[anime_id]
            anime["gdrive_slug"] = slug
            CACHE[cache_key] = slug
            found += 1
            print(f"  [{i+1}/{len(anime_list)}] {title} → {slug} (override)", flush=True)
            continue

        # Search gdriveplayer
        try:
            results = search_anime(title)
            best = pick_best_result(title, results)
            if best:
                anime["gdrive_slug"] = best["slug"]
                CACHE[cache_key] = best["slug"]
                found += 1
                print(f"  [{i+1}/{len(anime_list)}] {title} → {best['slug']}", flush=True)
            else:
                anime["gdrive_slug"] = ""
                CACHE[cache_key] = ""
                missing += 1
                print(f"  [{i+1}/{len(anime_list)}] {title} → NOT FOUND", flush=True)
        except Exception as e:
            anime["gdrive_slug"] = ""
            CACHE[cache_key] = ""
            missing += 1
            print(f"  [{i+1}/{len(anime_list)}] {title} → ERROR: {e}", flush=True)

        # Rate limit + periodic save
        time.sleep(0.5)
        if (i + 1) % save_every == 0:
            try:
                save_cache()
                ANIME_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"    (saved at {i+1}, found={found}, missing={missing})", flush=True)
            except Exception as e:
                print(f"    SAVE ERROR: {e}", flush=True)

    # Final save
    save_cache()
    ANIME_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n=== Done ===", flush=True)
    print(f"  Found slugs: {found}", flush=True)
    print(f"  Not found:   {missing}", flush=True)
    print(f"  Total:       {len(anime_list)}", flush=True)
    print(f"\nEach anime now has a 'gdrive_slug' field. The embed URL is:", flush=True)
    print(f"  https://database.gdriveplayer.me/embed.php?type=anime&slug=<slug>&episode=<N>", flush=True)

if __name__ == "__main__":
    main()
