#!/usr/bin/env python3
"""
Merge new entries into anime-archive.json and add META entries to anime.ts.
- Uses scraped metadata (genres, studio, synopsis, year) from anigo.re
- Adds META entries for all new anime with sensible defaults
- Pairs AoT seasons with their META entries
"""
import json
import re
import sys
from pathlib import Path

NEW_ENTRIES_PATH = Path("/home/z/my-project/scripts/new_entries.json")
ARCHIVE_PATH = Path("/home/z/my-project/src/data/anime-archive.json")
ANIME_TS_PATH = Path("/home/z/my-project/src/lib/anime.ts")

# Hand-curated META for the most popular new anime
HAND_CURATED_META = {
    "one-piece": {
        "year": 1999,
        "studio": "Toei Animation",
        "rating": 8.7,
        "popularity": 1,
        "genres": ["Action", "Adventure", "Comedy", "Fantasy"],
        "synopsis": "Monkey D. Luffy sets sail with his pirate crew, the Straw Hat Pirates, to find the legendary One Piece treasure and become the King of the Pirates. 1000+ episodes of epic adventure.",
        "backdropColor": "#1c3a5a",
        "audio": "both",
        "featured": True,
    },
    "naruto": {
        "year": 2002,
        "studio": "Pierrot",
        "rating": 8.4,
        "popularity": 5,
        "genres": ["Action", "Adventure", "Shounen"],
        "synopsis": "Twelve years after a demon fox attacked the Hidden Leaf Village, Naruto Uzumaki dreams of becoming the Hokage. Branded an outcast, he joins Team 7 and embarks on a journey of growth, rivalry, and discovery.",
        "backdropColor": "#1c2a5a",
        "audio": "both",
        "featured": True,
    },
    "solo-leveling": {
        "year": 2024,
        "studio": "A-1 Pictures",
        "rating": 8.5,
        "popularity": 6,
        "genres": ["Action", "Adventure", "Fantasy"],
        "synopsis": "In a world of hunters with supernatural abilities, Sung Jinwoo is the weakest E-rank hunter. After a deadly dungeon raid, he gains a mysterious System that lets him level up infinitely.",
        "backdropColor": "#1c0d3a",
        "audio": "both",
        "featured": True,
    },
    "solo-leveling-season-2-arise-from-the-shadow": {
        "year": 2025,
        "studio": "A-1 Pictures",
        "rating": 8.7,
        "popularity": 7,
        "genres": ["Action", "Adventure", "Fantasy"],
        "synopsis": "Season 2 — Sung Jinwoo returns as the Shadow Monarch, commanding an army of the dead.",
        "backdropColor": "#2a0d3a",
        "audio": "both",
        "franchise": "solo-leveling",
        "season": 2,
    },
    "bleach-thousand-year-blood-war-the-calamity": {
        "year": 2026,
        "studio": "Pierrot",
        "rating": 9.1,
        "popularity": 8,
        "genres": ["Action", "Adventure", "Supernatural"],
        "synopsis": "The final arc of Bleach — the Quincy King Yhwach launches an all-out war against the Soul Society.",
        "backdropColor": "#3a0d1c",
        "audio": "both",
    },
    "that-time-i-got-reincarnated-as-a-slime-season-4": {
        "year": 2025,
        "studio": "8bit",
        "rating": 8.3,
        "popularity": 12,
        "genres": ["Action", "Comedy", "Fantasy", "Isekai"],
        "synopsis": "Season 4 — Rimuru Tempest continues to grow his nation of monsters.",
        "backdropColor": "#1c3a1c",
        "audio": "both",
    },
    "rezero-starting-life-in-another-world-season-4": {
        "year": 2026,
        "studio": "White Fox",
        "rating": 8.6,
        "popularity": 13,
        "genres": ["Drama", "Fantasy", "Psychological", "Thriller"],
        "synopsis": "Season 4 — Subaru Natsuki returns, facing new trials in his journey of death and rebirth.",
        "backdropColor": "#3a1c3a",
        "audio": "both",
    },
    "mushoku-tensei-jobless-reincarnation-season-3": {
        "year": 2025,
        "studio": "Studio Bind",
        "rating": 8.7,
        "popularity": 14,
        "genres": ["Adventure", "Drama", "Fantasy", "Isekai"],
        "synopsis": "Season 3 — Rudeus Greyrat continues his second life in a richly detailed fantasy world.",
        "backdropColor": "#1c2a3a",
        "audio": "both",
    },
    "classroom-of-the-elite-4th-season-second-year-first-semester": {
        "year": 2026,
        "studio": "Lerche",
        "rating": 8.0,
        "popularity": 22,
        "genres": ["Drama", "Psychological", "School"],
        "synopsis": "Season 4 — Ayanokoji Kiyotaka returns to Tokyo Metropolitan Advanced Nurturing School.",
        "backdropColor": "#1c1c3a",
        "audio": "both",
    },
    "dr-stone-science-future-part-3": {
        "year": 2026,
        "studio": "TMS Entertainment",
        "rating": 8.4,
        "popularity": 24,
        "genres": ["Adventure", "Comedy", "Sci-Fi"],
        "synopsis": "Senku and the Kingdom of Science push forward into the science future.",
        "backdropColor": "#1c3a3a",
        "audio": "both",
    },
    "rent-a-girlfriend-season-5": {
        "year": 2026,
        "studio": "TMS Entertainment",
        "rating": 7.2,
        "popularity": 35,
        "genres": ["Comedy", "Romance", "Slice of Life"],
        "synopsis": "Season 5 — Kazuya Kinoshita continues his fake relationship with Chizuru Mizuhara.",
        "backdropColor": "#3a1c2a",
        "audio": "both",
    },
    "welcome-to-demon-school-iruma-kun-season-4": {
        "year": 2026,
        "studio": "Bandai Namco Pictures",
        "rating": 8.4,
        "popularity": 36,
        "genres": ["Comedy", "Fantasy", "School"],
        "synopsis": "Season 4 — Iruma continues his unlikely life in the demon world.",
        "backdropColor": "#3a2a1c",
        "audio": "both",
    },
    "the-angel-next-door-spoils-me-rotten-2": {
        "year": 2026,
        "studio": "Project No.9",
        "rating": 8.1,
        "popularity": 40,
        "genres": ["Comedy", "Romance", "Slice of Life"],
        "synopsis": "Season 2 — Amane and Mahiru's quiet, heartwarming relationship continues to bloom.",
        "backdropColor": "#2a3a1c",
        "audio": "both",
    },
    "the-beginning-after-the-end-season-2": {
        "year": 2026,
        "studio": "Studio A-Cat",
        "rating": 8.0,
        "popularity": 42,
        "genres": ["Action", "Adventure", "Fantasy", "Isekai"],
        "synopsis": "Season 2 — King Grey is reborn in a world of magic.",
        "backdropColor": "#1c3a2a",
        "audio": "both",
    },
    "the-ghost-in-the-shell": {
        "year": 2026,
        "studio": "Science SARU",
        "rating": 8.2,
        "popularity": 44,
        "genres": ["Action", "Cyberpunk", "Sci-Fi"],
        "synopsis": "A new chapter in the Ghost in the Shell saga.",
        "backdropColor": "#1c1c2a",
        "audio": "both",
    },
    "saga-of-tanya-the-evil-ii": {
        "year": 2026,
        "studio": "NUT",
        "rating": 8.0,
        "popularity": 50,
        "genres": ["Action", "Fantasy", "Isekai", "Military"],
        "synopsis": "Tanya Degurechaff returns for more magical warfare.",
        "backdropColor": "#3a3a1c",
        "audio": "both",
    },
    "case-closed": {
        "year": 1996,
        "studio": "TMS Entertainment",
        "rating": 8.2,
        "popularity": 55,
        "genres": ["Mystery", "Adventure", "Comedy"],
        "synopsis": "Teenage detective Conan Edogawa solves murders and mysteries while searching for the men who shrunk him.",
        "backdropColor": "#1c1c2a",
        "audio": "both",
    },
}


def make_default_meta(entry: dict) -> dict:
    """Generate META from scraped data with sensible defaults."""
    title = entry["title"]
    # Use scraped data if available, fall back to defaults
    genres = entry.get("genres") or ["Anime"]
    # Clean genres
    genres = [g.strip() for g in genres if g and g.strip()][:5]
    if not genres:
        genres = ["Anime"]
    studio = entry.get("studio") or "Studio Unknown"
    synopsis = entry.get("synopsis") or f"{title} — streaming now on Ichidoki."
    # Clean HTML entities from synopsis
    synopsis = re.sub(r"&[#0-9a-zA-Z]+;", "'", synopsis)
    if len(synopsis) > 300:
        synopsis = synopsis[:297] + "..."
    year = entry.get("year") or 2025
    audio_mode = entry.get("audio_mode", "both")
    audio_field = "both" if audio_mode == "both" else "sub"
    return {
        "year": year,
        "studio": studio,
        "rating": 7.5,
        "popularity": 60,
        "genres": genres,
        "synopsis": synopsis,
        "backdropColor": "#1c2a3a",
        "audio": audio_field,
    }


def meta_to_ts_entry(anime_id: str, meta: dict) -> str:
    """Convert a META dict to a TypeScript object literal entry for anime.ts."""
    genres_ts = "[" + ", ".join(f'"{g}"' for g in meta["genres"]) + "]"
    audio_ts = f'"{meta["audio"]}"'
    # Escape quotes in synopsis
    synopsis = meta["synopsis"].replace('"', '\\"').replace("\n", " ")
    lines = [
        f'  "{anime_id}": {{',
        f'    year: {meta["year"]},',
        f'    studio: "{meta["studio"]}",',
        f'    rating: {meta["rating"]},',
        f'    popularity: {meta["popularity"]},',
        f'    genres: {genres_ts},',
        f'    synopsis:',
        f'      "{synopsis}",',
        f'    backdropColor: "{meta["backdropColor"]}",',
        f'    audio: {audio_ts},',
    ]
    if meta.get("featured"):
        lines.append(f'    featured: true,')
    if meta.get("franchise"):
        lines.append(f'    franchise: "{meta["franchise"]}",')
    if meta.get("season"):
        lines.append(f'    season: {meta["season"]},')
    lines.append("  },")
    return "\n".join(lines)


def main():
    new_entries = json.loads(NEW_ENTRIES_PATH.read_text())
    archive = json.loads(ARCHIVE_PATH.read_text())

    # Skip entries that already exist
    existing_ids = {a["id"] for a in archive}
    new_entries = [e for e in new_entries if e["id"] not in existing_ids]
    print(f"Adding {len(new_entries)} new anime to archive...")

    # Strip helper fields from each new entry
    clean_entries = []
    for e in new_entries:
        clean = {
            "id": e["id"],
            "title": e["title"],
            "identifier": e["identifier"],
            "episode_count": e["episode_count"],
            "episodes": e["episodes"],
        }
        clean_entries.append(clean)

    # Append to archive
    archive.extend(clean_entries)
    ARCHIVE_PATH.write_text(json.dumps(archive, indent=2), encoding="utf-8")
    print(f"  Updated {ARCHIVE_PATH}")

    # Generate META entries — skip those that already have META in the file
    # (like attack-on-titan-s2/s3/s4 which were added manually)
    ts_content = ANIME_TS_PATH.read_text(encoding="utf-8")
    # Check which IDs already have META entries in the file
    existing_meta_ids = set(re.findall(r'^\s*"([^"]+)":\s*\{', ts_content, re.MULTILINE))
    # Filter out the IDs that are already in the META block
    entries_needing_meta = [e for e in new_entries if e["id"] not in existing_meta_ids]
    print(f"  Adding META for {len(entries_needing_meta)} entries (skipping {len(new_entries) - len(entries_needing_meta)} already present)")

    meta_ts_lines = []
    for e in entries_needing_meta:
        anime_id = e["id"]
        if anime_id in HAND_CURATED_META:
            meta = HAND_CURATED_META[anime_id]
        else:
            meta = make_default_meta(e)
        meta_ts_lines.append(meta_to_ts_entry(anime_id, meta))

    new_meta_block = "\n".join(meta_ts_lines)
    # Find the META block's closing `};` — specifically the one after "zoids-chaotic-century"
    pattern = re.compile(r'(  "zoids-chaotic-century":\s*\{.*?\n  \},)\n(\};)', re.DOTALL)
    if not pattern.search(ts_content):
        print("ERROR: Could not find insertion point in anime.ts", file=sys.stderr)
        sys.exit(1)
    new_ts = pattern.sub(rf'\1\n{new_meta_block}\n\2', ts_content, count=1)
    ANIME_TS_PATH.write_text(new_ts, encoding="utf-8")
    print(f"  Added {len(new_entries)} META entries to {ANIME_TS_PATH}")

    print(f"\nTotal new anime added: {len(new_entries)}")
    total_eps = sum(e["episode_count"] for e in new_entries)
    print(f"Total new episodes: {total_eps}")


if __name__ == "__main__":
    main()
