#!/usr/bin/env python3
"""
Add the proper One Piece main series to anime.json, replacing the existing
entry that has the wrong episode count (12 eps — that's a side story, not
the main series).

One Piece main series has 1122+ episodes across 14 major sagas.
"""
import json
import hashlib
from pathlib import Path

ANIME_JSON = Path("/home/z/my-project/src/data/anime.json")

def hsl_poster(title: str) -> dict:
    h = hashlib.sha256(title.encode()).hexdigest()
    variant = int(h[:2], 16) % 6
    l1 = 5 + (int(h[2:4], 16) % 15)
    l2 = 80 + (int(h[4:6], 16) % 18)
    angle = (int(h[6:8], 16) % 8) * 45
    return {"variant": variant, "l1": l1, "l2": l2, "angle": angle, "hash": h[:8]}

def make_season(name, episode_count, year=None, synopsis=""):
    return {
        "name": name,
        "episodeCount": episode_count,
        "year": year,
        "synopsis": synopsis,
    }

# One Piece sagas with approximate episode ranges and years
# Total: 1122 episodes (as of late 2024)
ONE_PIECE_SEASONS = [
    ("East Blue Saga", 61, 1999, "Luffy gathers his first crew members and sets sail across the East Blue."),
    ("Arabasta Saga", 74, 2000, "The crew ventures into the Grand Line and helps Princess Vivi save her country from Crocodile."),
    ("Skypiea Saga", 63, 2002, "The Straw Hats sail to a sky island to uncover a 400-year-old mystery."),
    ("Water 7 Saga", 119, 2005, "The crew reaches Water 7, faces the CP9, and rescues Robin from Enies Lobby."),
    ("Thriller Bark Saga", 59, 2007, "The crew enters the haunted Thriller Bark and faces the Warlord Gecko Moria."),
    ("Summit War Saga", 132, 2008, "Separation at Sabaody, Luffy's journey through Amazon Lily, Impel Down, and the Marineford War."),
    ("Fishman Island Saga", 58, 2012, "The crew reunites and ventures underwater to Fishman Island."),
    ("Punk Hazard Saga", 54, 2013, "The crew teams up with Law to take down Caesar Clown on a frozen island."),
    ("Dressrosa Saga", 118, 2014, "Luffy enters a tournament and battles Doflamingo to free the kingdom of Dressrosa."),
    ("Zou Saga", 36, 2016, "The crew arrives at Zou and learns about the Yonko Kaido."),
    ("Whole Cake Island Saga", 96, 2017, "Luffy and half the crew infiltrate Big Mom's territory to rescue Sanji."),
    ("Reverie Saga", 11, 2018, "The Reverie summit and the beginning of the Wano arc setup."),
    ("Wano Country Saga", 195, 2019, "The alliance assaults Wano to take down Kaido and Orochi in a massive samurai war."),
    ("Egghead Saga", 38, 2023, "The crew arrives at Egghead Island and meets Dr. Vegapunk as the World Government closes in."),
]

def main():
    data = json.loads(ANIME_JSON.read_text(encoding="utf-8"))

    # Find and remove existing "One Piece" entries (keep the side-story films)
    new_anime_list = []
    removed = []
    for a in data["anime"]:
        if a["id"] == "one-piece" and a["title"] == "One Piece" and a["totalEpisodes"] < 100:
            removed.append(a)
            continue
        new_anime_list.append(a)

    print(f"Removed {len(removed)} incorrect One Piece entries.")

    # Build the proper One Piece main series
    seasons = [
        make_season(name, eps, year, synopsis)
        for (name, eps, year, synopsis) in ONE_PIECE_SEASONS
    ]
    total_eps = sum(s["episodeCount"] for s in seasons)

    one_piece = {
        "id": "one-piece",
        "title": "One Piece",
        "altTitles": ["ワンピース", "One Piece"],
        "type": "TV",
        "status": "Ongoing",
        "year": 1999,
        "season": "Fall 1999",
        "studio": "Toei Animation",
        "rating": 8.7,
        "popularity": 1,
        "genres": ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Shounen", "Super Power"],
        "synopsis": "Monkey D. Luffy sets out to become the King of the Pirates and find the legendary treasure known as the One Piece. Along the way he gathers a crew of loyal friends, sails across the Grand Line, and battles emperors, warlords, and the World Government in a sweeping epic spanning decades.",
        "duration": 24,
        "totalEpisodes": total_eps,
        "featured": True,
        "image_url": "https://media.kitsu.app/anime/poster_images/12/large.jpg",
        "kitsu_id": "12",
        "kitsu_url": "https://kitsu.io/anime/one-piece",
        "gdrive_slug": "one-piece",
        "poster": hsl_poster("One Piece"),
        "seasons": seasons,
    }

    # Insert One Piece right after the other specific anime (after Bleach TYBW)
    # The first 8 are the specific anime — insert One Piece as #9 (featured too)
    # Find Bleach TYBW index
    bleach_tybw_idx = next(
        (i for i, a in enumerate(new_anime_list) if a["id"] == "bleach-thousand-year-blood-war"),
        7,
    )
    new_anime_list.insert(bleach_tybw_idx + 1, one_piece)

    # Update top10 to include One Piece after Bleach TYBW
    top10 = data.get("top10", [])
    if "one-piece" not in top10:
        # Insert after the specific anime (after bleach-thousand-year-blood-war)
        try:
            tybw_idx = top10.index("bleach-thousand-year-blood-war")
            top10.insert(tybw_idx + 1, "one-piece")
            # Remove the last item to keep top10 at 10 items
            if len(top10) > 10:
                top10.pop()
        except ValueError:
            top10.insert(0, "one-piece")

    # Write back
    data["anime"] = new_anime_list
    data["top10"] = top10

    ANIME_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nAdded One Piece:")
    print(f"  Total episodes: {total_eps}")
    print(f"  Sagas: {len(seasons)}")
    print(f"  Position in list: {bleach_tybw_idx + 2} (right after Bleach TYBW)")
    print(f"  Top 10: {top10}")
    print(f"\nSaved to {ANIME_JSON}")
    print(f"Total anime: {len(new_anime_list)}")

if __name__ == "__main__":
    main()
