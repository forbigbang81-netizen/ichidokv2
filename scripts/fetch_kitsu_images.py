#!/usr/bin/env python3
"""
Fetch real anime data + images from the Kitsu API (kitsu.io).

Kitsu is an open anime/manga database with a JSON:API at https://kitsu.io/api/edge.
It exposes poster images on media.kitsu.app and is much more reliable than
Jikan for bulk fetches (no aggressive rate limiting).

- Replaces the 500 synthetic random anime with 500 real top anime from Kitsu.
- Enriches the 8 specific anime with real Kitsu images (preserves their detailed
  season breakdowns from the previous run).
- Updates anime.json in place.
"""
import json
import time
import urllib.request
import urllib.error
import urllib.parse
import re
import hashlib
from pathlib import Path

ANIME_JSON = Path("/home/z/my-project/src/data/anime.json")
CACHE_FILE = Path("/home/z/my-project/scripts/kitsu_cache.json")

KITSU_API = "https://kitsu.io/api/edge"

# Specific anime Kitsu slugs (Kitsu uses kebab-case slugs).
# These resolve to the exact entry we want.
SPECIFIC_KITSU_SLUGS = {
    "akame-ga-kill": "akame-ga-kill",
    "hunter-x-hunter-2011": "hunter-x-hunter-2011",
    "jujutsu-kaisen": "jujutsu-kaisen",
    "highschool-dxd": "high-school-dxd",
    "naruto": "naruto",
    "naruto-shippuden": "naruto-shippuden",
    "bleach": "bleach",
    "bleach-thousand-year-blood-war": "bleach-sennen-kessen-hen",
}

# ---------- cache + HTTP ----------
if CACHE_FILE.exists():
    CACHE = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
else:
    CACHE = {}

def save_cache():
    CACHE_FILE.write_text(json.dumps(CACHE, ensure_ascii=False), encoding="utf-8")

def fetch_json(url, retries=4):
    if url in CACHE:
        return CACHE[url]
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "ichidok/1.0",
                    "Accept": "application/vnd.api+json",
                },
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode())
            CACHE[url] = data
            return data
        except urllib.error.HTTPError as e:
            if e.code == 429:
                print("  Rate limited, waiting 5s...")
                time.sleep(5)
            elif e.code >= 500 and attempt < retries - 1:
                wait = 3 + attempt * 2
                print(f"  HTTP {e.code}, retrying in {wait}s...")
                time.sleep(wait)
            else:
                print(f"  Failed: HTTP {e.code} - {url}")
                return None
        except Exception as e:
            if attempt < retries - 1:
                wait = 3 + attempt * 2
                print(f"  Error ({e}), retrying in {wait}s...")
                time.sleep(wait)
            else:
                print(f"  Failed: {e} - {url}")
                return None
    return None

# ---------- Kitsu fetchers ----------
def fetch_by_slug(slug):
    """Fetch a single anime by its Kitsu slug, including genres and studio."""
    q = urllib.parse.urlencode({
        "filter[slug]": slug,
        "include": "genres,animeProductions.producer",
    })
    # urlencoded already escapes [ and ]
    url = f"{KITSU_API}/anime?{q}"
    return fetch_json(url)

def fetch_top_anime_page(offset, limit=20):
    """Fetch a page of top anime by popularity, including genres and studios."""
    q = urllib.parse.urlencode({
        "page[limit]": limit,
        "page[offset]": offset,
        "sort": "popularityRank",
        "include": "genres,animeProductions.producer",
    })
    url = f"{KITSU_API}/anime?{q}"
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

def clean_html(text):
    """Strip HTML tags and normalize whitespace."""
    if not text:
        return ""
    # Remove <br> and <br/>
    text = re.sub(r'<br\s*/?>', ' ', text)
    # Remove any other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_status(kitsu_status):
    if not kitsu_status:
        return "Finished"
    s = kitsu_status.lower()
    if "finished" in s or "current" not in s and "upcoming" not in s:
        # Kitsu statuses: current | finished | upcoming | unreleased | tba
        if "current" in s:
            return "Ongoing"
        if "upcoming" in s or "unreleased" in s or "tba" in s:
            return "Upcoming"
        return "Finished"
    if "current" in s:
        return "Ongoing"
    if "upcoming" in s or "unreleased" in s or "tba" in s:
        return "Upcoming"
    return "Finished"

def normalize_type(kitsu_subtype):
    """Kitsu uses subtype: TV, movie, OVA, ONA, special, music."""
    if not kitsu_subtype:
        return "TV"
    t = kitsu_subtype.lower()
    if t == "tv":
        return "TV"
    if t == "movie":
        return "Movie"
    if t == "ova":
        return "OVA"
    if t == "ona":
        return "ONA"
    if t == "special":
        return "Special"
    if t == "music":
        return "Music"
    return kitsu_subtype.title()

def extract_year(start_date):
    """Extract year from Kitsu startDate.
    Kitsu returns startDate as a string like '2014-07-07'."""
    if not start_date:
        return 2000
    if isinstance(start_date, str):
        try:
            return int(start_date[:4])
        except (ValueError, IndexError):
            return 2000
    if isinstance(start_date, dict) and start_date.get("year"):
        return start_date["year"]
    return 2000

def extract_season(kitsu_season, year):
    """Kitsu season is lowercase: winter, spring, summer, fall."""
    if kitsu_season and year:
        return f"{kitsu_season.capitalize()} {year}"
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
    """Split total episodes into reasonable seasons for random anime."""
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

def extract_genres(entry, included):
    """Extract genre names from a Kitsu entry's relationships using the included list."""
    if not included:
        return []
    genres = []
    rels = entry.get("relationships", {}).get("genres", {}).get("data", [])
    for g in rels:
        gid = g.get("id")
        for inc in included:
            if inc.get("type") == "genres" and inc.get("id") == gid:
                name = inc.get("attributes", {}).get("name")
                if name:
                    genres.append(name)
                break
    return genres

def extract_studio(entry, included):
    """Extract the main studio name from a Kitsu entry's animeProductions.
    We look for the animeProduction with role='studio' and resolve its producer."""
    if not included:
        return "Unknown"
    rels = entry.get("relationships", {}).get("animeProductions", {}).get("data", [])
    if not rels:
        return "Unknown"

    # Build a map of producer_id -> producer name from the included list
    producers = {}
    for inc in included:
        if inc.get("type") == "producers":
            pid = inc.get("id")
            name = inc.get("attributes", {}).get("name")
            if pid and name:
                producers[pid] = name

    # Build a map of animeProduction_id -> {role, producer_id}
    anime_productions = {}
    for inc in included:
        if inc.get("type") == "animeProductions":
            apid = inc.get("id")
            role = inc.get("attributes", {}).get("role", "")
            producer_id = inc.get("relationships", {}).get("producer", {}).get("data", {}).get("id")
            if apid:
                anime_productions[apid] = {"role": role, "producer_id": producer_id}

    # Find the first animeProduction with role='studio'
    for ap_ref in rels:
        ap_id = ap_ref.get("id")
        ap = anime_productions.get(ap_id)
        if ap and ap.get("role") == "studio" and ap.get("producer_id"):
            return producers.get(ap["producer_id"], "Unknown")

    # Fallback: any animeProduction's producer
    for ap_ref in rels:
        ap_id = ap_ref.get("id")
        ap = anime_productions.get(ap_id)
        if ap and ap.get("producer_id"):
            return producers.get(ap["producer_id"], "Unknown")

    return "Unknown"

def parse_kitsu_entry(entry, included=None):
    """Parse a Kitsu anime entry into our anime.json format (without id/slug)."""
    attrs = entry.get("attributes", {})
    title = attrs.get("canonicalTitle", "Unknown") or "Unknown"
    
    # alt titles
    alt_titles = []
    titles = attrs.get("titles", {}) or {}
    for k in ("en", "en_jp", "en_us", "ja_jp"):
        v = titles.get(k)
        if v and v != title and v not in alt_titles:
            alt_titles.append(v)
    
    # poster image
    poster = attrs.get("posterImage", {}) or {}
    image_url = poster.get("large") or poster.get("medium") or poster.get("original") or ""
    
    # other fields
    subtype = attrs.get("subtype", "TV")
    status = normalize_status(attrs.get("status"))
    start_date = attrs.get("startDate") or {}
    year = extract_year(start_date)
    season_str = extract_season(attrs.get("season"), year)
    
    # studios - extracted from the included animeProductions + producers
    studio = extract_studio(entry, included) if included else "Unknown"
    
    # rating: Kitsu averageRating is on 0-100 scale, convert to 0-10
    avg_rating = attrs.get("averageRating")
    try:
        rating = round(float(avg_rating) / 10, 2) if avg_rating else 7.0
    except (ValueError, TypeError):
        rating = 7.0
    
    popularity = attrs.get("popularityRank") or 1000
    
    # genres
    genres = extract_genres(entry, included) if included else []
    
    # synopsis - Kitsu uses plain text, no HTML stripping needed but be safe
    synopsis = clean_html(attrs.get("synopsis", "")) or ""
    
    # duration
    episode_length = attrs.get("episodeLength") or 24
    duration = episode_length if isinstance(episode_length, int) else 24
    
    # episodes
    episodes = attrs.get("episodeCount") or 12
    
    return {
        "title": title,
        "altTitles": alt_titles,
        "type": normalize_type(subtype),
        "status": status,
        "year": year,
        "season": season_str,
        "studio": studio,
        "rating": rating,
        "popularity": popularity,
        "genres": genres,
        "synopsis": synopsis,
        "duration": duration,
        "totalEpisodes": episodes,
        "image_url": image_url,
        "kitsu_id": entry.get("id"),
        "kitsu_url": f"https://kitsu.io/anime/{attrs.get('slug', '')}",
        "poster": hsl_poster(title),  # SVG fallback
        "seasons": synthesize_seasons(episodes, year),
    }

# ---------- main ----------
def main():
    print("=== ichidok: Kitsu image + data fetch ===\n")

    # Step 1: Fetch 8 specific anime by slug
    print("Step 1: Fetching 8 specific anime by Kitsu slug...")
    specific_data = {}
    for slug, kitsu_slug in SPECIFIC_KITSU_SLUGS.items():
        result = fetch_by_slug(kitsu_slug)
        if result and result.get("data") and len(result["data"]) > 0:
            specific_data[slug] = {
                "entry": result["data"][0],
                "included": result.get("included", []),
            }
            title = result["data"][0]["attributes"].get("canonicalTitle", "")
            print(f"  + {slug} -> '{title}'")
        else:
            print(f"  x {slug}: not found by slug '{kitsu_slug}'")
        time.sleep(0.5)
        save_cache()

    # Step 2: Fetch top anime by popularityRank (25 pages of 20 = 500 max)
    print("\nStep 2: Fetching top anime from Kitsu (by popularity)...")
    top_anime = []
    page_size = 20
    for page_idx in range(30):  # 30 pages × 20 = 600 max
        offset = page_idx * page_size
        result = fetch_top_anime_page(offset, page_size)
        if not result or "data" not in result:
            print(f"  Page {page_idx + 1}: failed, stopping")
            break
        page_data = result["data"]
        included = result.get("included", [])
        # carry the included data with each entry for parsing
        for entry in page_data:
            top_anime.append({
                "entry": entry,
                "included": included,
            })
        print(f"  Page {page_idx + 1}: +{len(page_data)} (total: {len(top_anime)})")
        time.sleep(0.5)
        save_cache()
        # Kitsu doesn't always send a "next" link when at end
        if not result.get("links", {}).get("next"):
            break

    print(f"\nFetched {len(top_anime)} top anime from Kitsu.\n")

    if len(top_anime) < 100:
        print("!! Only fetched a few anime, aborting to preserve existing data.")
        return

    # Step 3: Load existing anime.json to preserve season breakdowns for specific
    print("Step 3: Loading existing anime.json...")
    existing_data = json.loads(ANIME_JSON.read_text(encoding="utf-8"))
    existing_by_id = {a["id"]: a for a in existing_data["anime"]}

    # Step 4: Build the 8 specific anime (preserve seasons, add image_url)
    print("\nStep 4: Updating specific anime with Kitsu images...")
    specific_anime = []
    for slug, kitsu_slug in SPECIFIC_KITSU_SLUGS.items():
        existing = existing_by_id.get(slug)
        kitsu_data = specific_data.get(slug)
        if not existing:
            print(f"  x {slug}: not in existing data, skipping")
            continue

        if kitsu_data:
            parsed = parse_kitsu_entry(kitsu_data["entry"], kitsu_data["included"])
            # Preserve seasons from existing (detailed breakdown)
            existing["image_url"] = parsed["image_url"]
            existing["kitsu_id"] = parsed["kitsu_id"]
            existing["kitsu_url"] = parsed["kitsu_url"]
            existing["rating"] = parsed["rating"]
            existing["synopsis"] = parsed["synopsis"] or existing["synopsis"]
            existing["genres"] = parsed["genres"] or existing["genres"]
            existing["altTitles"] = parsed["altTitles"] or existing["altTitles"]
            # Update studio from Kitsu if available
            if parsed["studio"] and parsed["studio"] != "Unknown":
                existing["studio"] = parsed["studio"]
            # Update popularity from Kitsu for consistency
            existing["popularity"] = parsed["popularity"]
            print(f"  + {slug}: {existing['image_url'][:80]}...")
        else:
            existing["image_url"] = ""
            print(f"  x {slug}: no Kitsu data, will use SVG fallback")

        specific_anime.append(existing)

    # Step 5: Build 500 random anime from Kitsu top (excluding specific)
    print(f"\nStep 5: Building up to 500 random anime from Kitsu top list...")
    specific_kitsu_ids = set()
    for slug, kitsu_data in specific_data.items():
        if kitsu_data:
            specific_kitsu_ids.add(kitsu_data["entry"].get("id"))

    random_anime = []
    seen_titles = set()
    seen_slugs = set()

    for item in top_anime:
        entry = item["entry"]
        included = item["included"]
        kitsu_id = entry.get("id")
        if kitsu_id in specific_kitsu_ids:
            continue

        parsed = parse_kitsu_entry(entry, included)
        title = parsed["title"]
        if not title or title == "Unknown" or title in seen_titles:
            continue
        if not parsed["image_url"]:
            continue

        slug = slugify(title)
        base_slug = slug
        idx = 1
        while slug in seen_slugs:
            slug = f"{base_slug}-{idx}"
            idx += 1
        seen_slugs.add(slug)
        seen_titles.add(title)

        parsed["id"] = slug
        parsed["featured"] = False
        random_anime.append(parsed)

        if len(random_anime) >= 500:
            break

    print(f"  Built {len(random_anime)} random anime.")

    # Step 6: Combine and rebuild indices
    all_anime = specific_anime + random_anime

    # Top 10: 8 specific + 2 most popular random (random_anime is already sorted by popularity)
    top10_ids = [a["id"] for a in specific_anime] + [
        a["id"] for a in random_anime[:2]
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
