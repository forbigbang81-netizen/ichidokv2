#!/usr/bin/env python3
"""
Fetch real anime data + images from Jikan (MyAnimeList unofficial API).

- Replaces the 500 synthetic random anime with 500 real top anime from MAL.
- Enriches the 8 specific anime with real MAL images (preserves their detailed
  season breakdowns from the previous run).
- Updates anime.json in place.

Jikan v4 rate limit: 3 req/sec. We use 0.4s delay (~2.5 req/sec) to stay safe.
"""
import json
import time
import urllib.request
import urllib.error
import re
import hashlib
from pathlib import Path

ANIME_JSON = Path("/home/z/my-project/src/data/anime.json")
CACHE_FILE = Path("/home/z/my-project/scripts/jikan_cache.json")

JIKAN_BASE = "https://api.jikan.moe/v4"

# Specific anime MAL IDs — preserve their existing detailed season breakdowns,
# just enrich with real images/synopsis/genres/etc.
SPECIFIC_MAL_IDS = {
    "akame-ga-kill": 22199,
    "hunter-x-hunter-2011": 11061,
    "jujutsu-kaisen": 40748,
    "highschool-dxd": 11617,
    "naruto": 20,
    "naruto-shippuden": 1735,
    "bleach": 269,
    "bleach-thousand-year-blood-war": 41467,
}

# ---------- cache + HTTP ----------
if CACHE_FILE.exists():
    CACHE = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
else:
    CACHE = {}

def save_cache():
    CACHE_FILE.write_text(json.dumps(CACHE, ensure_ascii=False), encoding="utf-8")

def fetch_json(url, retries=5):
    if url in CACHE:
        return CACHE[url]
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ichidok/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode())
            CACHE[url] = data
            return data
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print("  Rate limited, waiting 5s...")
                time.sleep(5)
            elif e.code >= 500 and attempt < retries - 1:
                wait = 3 + attempt * 2  # 3s, 5s, 7s, 9s
                print(f"  HTTP {e.code}, retrying in {wait}s...")
                time.sleep(wait)
            else:
                print(f"  Failed: HTTP {e.code}")
                return None
        except Exception as e:
            if attempt < retries - 1:
                wait = 3 + attempt * 2
                print(f"  Error ({e}), retrying in {wait}s...")
                time.sleep(wait)
            else:
                print(f"  Failed: {e}")
                return None
    return None

def fetch_top_anime_page(page):
    url = f"{JIKAN_BASE}/top/anime?filter=bypopularity&page={page}&limit=25"
    return fetch_json(url)

def fetch_anime_full(mal_id):
    url = f"{JIKAN_BASE}/anime/{mal_id}/full"
    return fetch_json(url)

# ---------- helpers ----------
def hsl_poster(title):
    """SVG fallback poster config (kept for when image_url is empty or fails)."""
    h = hashlib.sha256(title.encode()).hexdigest()
    variant = int(h[:2], 16) % 6
    l1 = 5 + (int(h[2:4], 16) % 15)
    l2 = 80 + (int(h[4:6], 16) % 18)
    angle = (int(h[6:8], 16) % 8) * 45
    return {"variant": variant, "l1": l1, "l2": l2, "angle": angle, "hash": h[:8]}

def slugify(s):
    s = s.lower()
    out = []
    for ch in s:
        if ch.isalnum():
            out.append(ch)
        elif ch in (" ", "-", "_"):
            out.append("-")
    slug = "".join(out)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")

def parse_duration_minutes(duration_str):
    if not duration_str:
        return 24
    m = re.search(r'(\d+)\s*hr\s*(\d+)?\s*min', duration_str)
    if m:
        hours = int(m.group(1))
        mins = int(m.group(2)) if m.group(2) else 0
        return hours * 60 + mins
    m = re.search(r'(\d+)\s*min', duration_str)
    if m:
        return int(m.group(1))
    m = re.search(r'(\d+)\s*hr', duration_str)
    if m:
        return int(m.group(1)) * 60
    return 24

def normalize_status(jikan_status):
    if not jikan_status:
        return "Finished"
    s = jikan_status.lower()
    if "finished" in s:
        return "Finished"
    if "currently" in s or "airing" in s:
        return "Ongoing"
    if "not yet" in s or "upcoming" in s:
        return "Upcoming"
    return "Finished"

def normalize_type(jikan_type):
    if not jikan_type:
        return "TV"
    t = jikan_type.lower()
    if "tv" in t:
        return "TV"
    if "movie" in t:
        return "Movie"
    if "ova" in t:
        return "OVA"
    if "ona" in t:
        return "ONA"
    if "special" in t:
        return "Special"
    return jikan_type

def extract_year(aired):
    if not aired or not aired.get("from"):
        return 2000
    try:
        return int(aired["from"][:4])
    except:
        return 2000

def extract_season(season, year):
    if season and year:
        return f"{season.capitalize()} {year}"
    if year:
        return str(year)
    return "Unknown"

def make_season(name, episode_count, year=None, synopsis=""):
    return {
        "name": name,
        "episodeCount": episode_count,
        "year": year,
        "synopsis": synopsis,
    }

def synthesize_seasons(total_episodes, year):
    """Split total episodes into reasonable seasons for random anime.
    Real long-running shounen typically have many cours of 12-25 eps each."""
    if not total_episodes or total_episodes <= 0:
        total_episodes = 12
    if total_episodes <= 26:
        return [make_season("Season 1", total_episodes, year)]
    seasons = []
    ep_per_season = 25 if total_episodes > 100 else 12
    remaining = total_episodes
    season_num = 1
    while remaining > 0:
        eps = min(ep_per_season, remaining)
        seasons.append(make_season(
            f"Season {season_num}",
            eps,
            year + (season_num - 1),
            f"Season {season_num} of the series."
        ))
        remaining -= eps
        season_num += 1
    return seasons

# ---------- main ----------
def main():
    print("=== ichidok: Jikan image + data fetch ===\n")

    # Step 1: Fetch top 600+ anime from Jikan (by popularity)
    print("Step 1: Fetching top anime from Jikan (by popularity)...")
    top_anime = []
    for page in range(1, 26):  # 25 pages × 25 = 625 max
        result = fetch_top_anime_page(page)
        if not result or "data" not in result:
            print(f"  Page {page}: failed, stopping")
            break
        page_data = result["data"]
        top_anime.extend(page_data)
        print(f"  Page {page}: +{len(page_data)} (total: {len(top_anime)})")
        time.sleep(0.4)
        save_cache()
        if not result.get("pagination", {}).get("has_next"):
            break

    print(f"\nFetched {len(top_anime)} top anime from Jikan.\n")

    if len(top_anime) < 100:
        print("!! Only fetched a few anime, aborting to preserve existing data.")
        return

    # Step 2: Fetch full data for the 8 specific anime
    print("Step 2: Fetching specific anime (full data with image)...")
    specific_data = {}
    for slug, mal_id in SPECIFIC_MAL_IDS.items():
        result = fetch_anime_full(mal_id)
        if result and "data" in result:
            specific_data[slug] = result["data"]
            print(f"  + {slug} (MAL {mal_id})")
        else:
            print(f"  x {slug} (MAL {mal_id}) -- failed")
        time.sleep(0.4)
        save_cache()

    # Step 3: Load existing anime.json to preserve season breakdowns for specific
    print("\nStep 3: Loading existing anime.json...")
    existing_data = json.loads(ANIME_JSON.read_text(encoding="utf-8"))
    existing_by_id = {a["id"]: a for a in existing_data["anime"]}

    # Step 4: Build the new specific anime (preserve seasons, add image_url)
    print("\nStep 4: Updating specific anime with Jikan images...")
    specific_anime = []
    for slug, mal_id in SPECIFIC_MAL_IDS.items():
        existing = existing_by_id.get(slug)
        jikan = specific_data.get(slug)
        if not existing:
            print(f"  x {slug}: not in existing data, skipping")
            continue

        if jikan:
            jpg = jikan.get("images", {}).get("jpg", {})
            existing["image_url"] = jpg.get("large_image_url", "") or jpg.get("image_url", "")
            existing["mal_id"] = jikan.get("mal_id")
            existing["mal_url"] = jikan.get("url", "")
            existing["rating"] = jikan.get("score") or existing["rating"]
            existing["synopsis"] = jikan.get("synopsis") or existing["synopsis"]
            existing["genres"] = [g["name"] for g in jikan.get("genres", [])] or existing["genres"]
            studios = jikan.get("studios", [])
            existing["studio"] = (studios[0]["name"] if studios else None) or existing["studio"]
            existing["altTitles"] = [
                t for t in [jikan.get("title_english"), jikan.get("title_japanese")] if t
            ] or existing["altTitles"]
            print(f"  + {slug}: {existing['image_url'][:80]}...")
        else:
            existing["image_url"] = ""
            print(f"  x {slug}: no Jikan data, will use SVG fallback")

        specific_anime.append(existing)

    # Step 5: Build 500 random anime from Jikan top (excluding specific)
    print(f"\nStep 5: Building up to 500 random anime from Jikan top list...")
    specific_mal_ids_set = set(SPECIFIC_MAL_IDS.values())
    random_anime = []
    seen_titles = set()
    seen_slugs = set()

    for entry in top_anime:
        mal_id = entry.get("mal_id")
        if mal_id in specific_mal_ids_set:
            continue

        title = entry.get("title", "").strip()
        if not title or title in seen_titles:
            continue

        jpg = entry.get("images", {}).get("jpg", {})
        image_url = jpg.get("large_image_url", "") or jpg.get("image_url", "")
        if not image_url:
            continue

        alt_titles = [
            t for t in [entry.get("title_english"), entry.get("title_japanese")] if t and t != title
        ]
        type_ = normalize_type(entry.get("type"))
        status = normalize_status(entry.get("status"))
        year = extract_year(entry.get("aired"))
        season = extract_season(entry.get("season"), year)
        studios = entry.get("studios", [])
        studio = studios[0]["name"] if studios else "Unknown"
        rating = entry.get("score") or 7.0
        popularity = entry.get("popularity") or 1000
        genres = [g["name"] for g in entry.get("genres", [])]
        synopsis = entry.get("synopsis") or ""
        duration = parse_duration_minutes(entry.get("duration"))
        episodes = entry.get("episodes") or 12
        seasons = synthesize_seasons(episodes, year)

        slug = slugify(title)
        base_slug = slug
        idx = 1
        while slug in seen_slugs:
            slug = f"{base_slug}-{idx}"
            idx += 1
        seen_slugs.add(slug)
        seen_titles.add(title)

        random_anime.append({
            "id": slug,
            "title": title,
            "altTitles": alt_titles,
            "type": type_,
            "status": status,
            "year": year,
            "season": season,
            "studio": studio,
            "rating": rating,
            "popularity": popularity,
            "genres": genres,
            "synopsis": synopsis,
            "duration": duration,
            "totalEpisodes": episodes,
            "featured": False,
            "image_url": image_url,
            "mal_id": mal_id,
            "mal_url": entry.get("url", ""),
            "poster": hsl_poster(title),  # SVG fallback if image fails to load
            "seasons": seasons,
        })

        if len(random_anime) >= 500:
            break

    print(f"  Built {len(random_anime)} random anime.")

    # Step 6: Combine and rebuild indices
    all_anime = specific_anime + random_anime

    # Top 10: 8 specific + 2 most popular random
    top10_ids = [a["id"] for a in specific_anime] + [
        a["id"] for a in sorted(random_anime, key=lambda x: x["popularity"])[:2]
    ]

    # Genre / studio / year indices
    all_genres = set()
    for a in all_anime:
        for g in a["genres"]:
            all_genres.add(g)
    all_genres = sorted(all_genres)

    all_studios = set()
    for a in all_anime:
        if a["studio"] and a["studio"] != "Unknown":
            all_studios.add(a["studio"])
    all_studios = sorted(all_studios)

    all_years = sorted(set(a["year"] for a in all_anime), reverse=True)

    # Step 7: Write
    output = {
        "anime": all_anime,
        "top10": top10_ids,
        "genres": all_genres,
        "studios": all_studios,
        "years": all_years,
    }

    ANIME_JSON.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n>> Wrote {len(all_anime)} anime to {ANIME_JSON}")
    print(f"   Top 10: {top10_ids}")
    print(f"   Genres: {len(all_genres)}, Studios: {len(all_studios)}, Years: {len(all_years)}")

    save_cache()
    print(f"\nCache saved to {CACHE_FILE} ({len(CACHE)} entries)")

if __name__ == "__main__":
    main()
