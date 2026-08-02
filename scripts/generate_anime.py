"""
Generate the ichidok anime database:
- 6 specific anime (with full season breakdowns)
- 500 random anime
- Top 10 ranking
- Writes src/data/anime.json (used by the site)
"""
import json
import random
import hashlib
import os
from pathlib import Path

random.seed(20260802)

OUT = Path("/home/z/my-project/src/data/anime.json")
OUT.parent.mkdir(parents=True, exist_ok=True)

# ---------- helpers ----------

def slugify(s: str) -> str:
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

def hsl_poster(title: str) -> dict:
    """Generate a deterministic black/white poster config based on title."""
    h = hashlib.sha256(title.encode()).hexdigest()
    # choose a pattern variant 0..5
    variant = int(h[:2], 16) % 6
    # 0..100 lightness anchor
    l1 = 5 + (int(h[2:4], 16) % 15)        # dark base 5..20
    l2 = 80 + (int(h[4:6], 16) % 18)        # light overlay 80..97
    angle = (int(h[6:8], 16) % 8) * 45
    return {"variant": variant, "l1": l1, "l2": l2, "angle": angle, "hash": h[:8]}

# ---------- specific anime (full seasons) ----------

specific = []

def make_season(name, episodes, year=None, synopsis=""):
    # Note: episodes are generated client-side from episodeCount + season.index
    # so we don't ship per-episode metadata in the JSON (saves ~95% size).
    return {
        "name": name,
        "episodeCount": episodes,
        "year": year,
        "synopsis": synopsis,
    }

# 1. Akame ga Kill!
specific.append({
    "id": "akame-ga-kill",
    "title": "Akame ga Kill!",
    "altTitles": ["アカメが斬る!", "Akame ga Kiru!"],
    "type": "TV",
    "status": "Finished",
    "year": 2014,
    "season": "Summer 2014",
    "studio": "White Fox",
    "rating": 7.46,
    "popularity": 95,
    "genres": ["Action", "Adventure", "Drama", "Fantasy", "Shounen"],
    "synopsis": "Tatsumi, a young fighter, sets out for the capital to earn money for his starving village but instead uncovers corruption. He is recruited into Night Raid, an assassin group fighting the corrupt Empire using powerful weapons called Teigu.",
    "duration": 24,
    "totalEpisodes": 24,
    "featured": True,
    "poster": hsl_poster("Akame ga Kill!"),
    "seasons": [
        make_season("Season 1", 24, 2014,
            "The complete series following Tatsumi and Night Raid in their fight against the Empire."),
    ],
})

# 2. Hunter x Hunter (2011)
specific.append({
    "id": "hunter-x-hunter-2011",
    "title": "Hunter x Hunter",
    "altTitles": ["ハンター×ハンター", "HxH 2011"],
    "type": "TV",
    "status": "Finished",
    "year": 2011,
    "season": "Fall 2011",
    "studio": "Madhouse",
    "rating": 9.04,
    "popularity": 5,
    "genres": ["Action", "Adventure", "Fantasy", "Shounen", "Super Power"],
    "synopsis": "Gon Freecss sets out to become a Hunter and find his father, who left him as a child. Along the way he befriends Killua, Kurapika, and Leorio, facing dangerous creatures, ancient secrets, and powerful foes.",
    "duration": 23,
    "totalEpisodes": 148,
    "featured": True,
    "poster": hsl_poster("Hunter x Hunter"),
    "seasons": [
        make_season("Hunter Exam Arc", 21, 2011, "Gon and friends take the Hunter Exam."),
        make_season("Heavens Arena Arc", 27, 2012, "Gon and Killua climb Heavens Arena."),
        make_season("Phantom Troupe Arc", 27, 2012, "The Phantom Troupe wreaks havoc in Yorknew City."),
        make_season("Greed Island Arc", 17, 2013, "Gon and Killua enter the game Greed Island."),
        make_season("Chimera Ant Arc", 56, 2014, "Humanity faces the terrifying Chimera Ants."),
    ],
})

# 3. Jujutsu Kaisen
specific.append({
    "id": "jujutsu-kaisen",
    "title": "Jujutsu Kaisen",
    "altTitles": ["呪術廻戦", "JJK"],
    "type": "TV",
    "status": "Ongoing",
    "year": 2020,
    "season": "Fall 2020",
    "studio": "MAPPA",
    "rating": 8.58,
    "popularity": 2,
    "genres": ["Action", "Supernatural", "Horror", "School", "Shounen"],
    "synopsis": "Yuji Itadori swallows a cursed finger to save his friends and becomes the host of the powerful Curse Sukuna. He joins Tokyo Jujutsu High to learn to control Cursed Energy and protect humanity.",
    "duration": 24,
    "totalEpisodes": 47,
    "featured": True,
    "poster": hsl_poster("Jujutsu Kaisen"),
    "seasons": [
        make_season("Season 1", 24, 2020, "Yuji enters Jujutsu High and faces rising curses."),
        make_season("Season 2 - Hidden Inventory / Shibuya", 23, 2023,
            "Gojo's past and the devastating Shibuya Incident."),
    ],
})

# 4. High School DxD
specific.append({
    "id": "highschool-dxd",
    "title": "High School DxD",
    "altTitles": ["ハイスクールD×D", "Highschool DxD"],
    "type": "TV",
    "status": "Finished",
    "year": 2012,
    "season": "Winter 2012",
    "studio": "TNK",
    "rating": 7.39,
    "popularity": 65,
    "genres": ["Action", "Comedy", "Ecchi", "Fantasy", "Harem", "Romance", "Supernatural"],
    "synopsis": "Issei Hyoudou is killed on his first date and resurrected as a devil by Rias Gremory. He becomes her servant and enters the world of angels, fallen angels, and devils at Kuoh Academy.",
    "duration": 24,
    "totalEpisodes": 48,
    "featured": True,
    "poster": hsl_poster("High School DxD"),
    "seasons": [
        make_season("Season 1", 12, 2012, "Issei is resurrected as a devil."),
        make_season("Season 2 - New", 12, 2013, "New threats emerge with the Khaos Brigade."),
        make_season("Season 3 - Born", 12, 2015, "The Rating Game and Loki's plot."),
        make_season("Season 4 - Hero", 12, 2018, "Issei unlocks his Balance Breaker."),
    ],
})

# 5. Naruto (+ Shippuden)
specific.append({
    "id": "naruto",
    "title": "Naruto",
    "altTitles": ["ナルト"],
    "type": "TV",
    "status": "Finished",
    "year": 2002,
    "season": "Fall 2002",
    "studio": "Pierrot",
    "rating": 8.0,
    "popularity": 8,
    "genres": ["Action", "Adventure", "Martial Arts", "Shounen", "Super Power"],
    "synopsis": "Naruto Uzumaki, a young ninja, seeks recognition and dreams of becoming Hokage. He is shunned by his village for holding the Nine-Tailed Fox, but trains hard with Team 7.",
    "duration": 24,
    "totalEpisodes": 220,
    "featured": True,
    "poster": hsl_poster("Naruto"),
    "seasons": [
        make_season("Prologue / Land of Waves Arc", 19, 2002, "Team 7 forms and faces Zabuza."),
        make_season("Chunin Exam Arc", 41, 2003, "The Chunin Exams and Orochimaru's plot."),
        make_season("Invasion / Search for Tsunade", 39, 2003, "Konoha is invaded; Tsunade becomes Hokage."),
        make_season("Land of Tea / Sasuke Retrieval", 41, 2004, "The Sasuke Retrieval Arc."),
        make_season("Filler Arcs", 80, 2005, "Various filler episodes concluding Part 1."),
    ],
})

specific.append({
    "id": "naruto-shippuden",
    "title": "Naruto: Shippuden",
    "altTitles": ["ナルト 疾風伝", "Naruto Shippuuden"],
    "type": "TV",
    "status": "Finished",
    "year": 2007,
    "season": "Winter 2007",
    "studio": "Pierrot",
    "rating": 8.25,
    "popularity": 6,
    "genres": ["Action", "Adventure", "Martial Arts", "Shounen", "Super Power"],
    "synopsis": "Two and a half years after Naruto leaves to train with Jiraiya, he returns to Konoha to face the threat of the Akatsuki and search for Sasuke.",
    "duration": 24,
    "totalEpisodes": 500,
    "featured": True,
    "poster": hsl_poster("Naruto Shippuden"),
    "seasons": [
        make_season("Kazekage Rescue Arc", 32, 2007, "Rescue Gaara from the Akatsuki."),
        make_season("Long-Haired Akatsuki / Sai Arc", 21, 2008, "Sasori's aftermath and Team Yamato."),
        make_season("Twelve Guardian Ninja Arc", 28, 2008, "Filler arc with the Guardian Ninjas."),
        make_season("Immortal Beings Arc", 16, 2008, "Hidan and Kakuzu."),
        make_season("Three-Tails Arc", 23, 2008, "Three-Tails suppression filler."),
        make_season("Itachi Pursuit Arc", 16, 2009, "Hunt for Itachi."),
        make_season("Tale of Jiraiya / Fated Battle", 25, 2009, "Jiraiya's last stand and Sasuke vs Itachi."),
        make_season("Six-Tails / Pain Arc", 27, 2009, "Pain's assault on Konoha."),
        make_season("Past Arc / Five Kage Summit", 28, 2010, "Sasuke's path of darkness."),
        make_season("Paradise on Ship / Outbreak", 27, 2010, "Island filler and outbreak."),
        make_season("Fourth Shinobi World War (Climax)", 53, 2011, "War begins."),
        make_season("Power Arc", 18, 2012, "Final war filler."),
        make_season("Fourth Shinobi World War (Continued)", 60, 2012, "War intensifies."),
        make_season("Infinite Tsukuyomi Arc", 41, 2014, "Madara and the Infinite Tsukuyomi."),
        make_season("Kaguya Otsutsuki Strikes", 23, 2015, "Kaguya's return."),
        make_season("Farewell / Final Episodes", 22, 2016, "The final battle and farewell."),
    ],
})

# 6. Bleach (all)
specific.append({
    "id": "bleach",
    "title": "Bleach",
    "altTitles": ["ブリーチ"],
    "type": "TV",
    "status": "Finished",
    "year": 2004,
    "season": "Fall 2004",
    "studio": "Pierrot",
    "rating": 8.16,
    "popularity": 7,
    "genres": ["Action", "Adventure", "Supernatural", "Shounen", "Super Power"],
    "synopsis": "Ichigo Kurosaki gains Soul Reaper powers from Rukia Kuchiki and must protect humans from evil spirits called Hollows, while navigating the world of Soul Reapers.",
    "duration": 24,
    "totalEpisodes": 366,
    "featured": True,
    "poster": hsl_poster("Bleach"),
    "seasons": [
        make_season("Agent of the Shinigami Arc", 20, 2004, "Ichigo becomes a Soul Reaper."),
        make_season("Soul Society: The Sneak Entry", 22, 2005, "Sneaking into Soul Society."),
        make_season("Soul Society: The Rescue", 22, 2005, "Rescuing Rukia."),
        make_season("Bount Arc", 32, 2005, "Bount filler arc."),
        make_season("Arrancar: The Arrival", 22, 2006, "Arrancar appear in Karakura."),
        make_season("Arrancar: Fierce Fight", 18, 2006, "Battles with the Espada."),
        make_season("Hueco Mundo: Sneak Entry", 22, 2007, "Infiltrating Hueco Mundo."),
        make_season("Hueco Mundo: Grimmjow", 16, 2007, "Fighting Grimmjow."),
        make_season("New Captain Shusuke Amagai", 21, 2008, "Amagai filler."),
        make_season("Arrancar vs Shinigami", 24, 2008, "Continued Arrancar war."),
        make_season("Zanpakuto: Alternate Tale", 26, 2009, "Zanpakuto rebellion filler."),
        make_season("Zanpakuto: Rebellion Extension", 9, 2009, "Continuation of the rebellion."),
        make_season("Arrancar: Decisive Battle", 17, 2009, "Final Arrancar fights."),
        make_season("Gotei 13 Invading Army", 26, 2010, "Gotei 13 filler."),
        make_season("Lost Agent Arc", 24, 2011, "Fullbring arc."),
        make_season("Final Battle / 1000 Year Blood War Prologue", 25, 2012, "End of original run."),
    ],
})

specific.append({
    "id": "bleach-thousand-year-blood-war",
    "title": "Bleach: Thousand-Year Blood War",
    "altTitles": ["BLEACH 千年血戦篇", "Bleach TYBW"],
    "type": "TV",
    "status": "Ongoing",
    "year": 2022,
    "season": "Fall 2022",
    "studio": "Pierrot",
    "rating": 9.0,
    "popularity": 12,
    "genres": ["Action", "Adventure", "Supernatural", "Shounen", "Super Power"],
    "synopsis": "The Wandenreich, a hidden Quincy empire, declares war on the Soul Society. Ichigo and the Gotei 13 face their greatest threat yet in the final arc.",
    "duration": 24,
    "totalEpisodes": 39,
    "featured": True,
    "poster": hsl_poster("Bleach Thousand Year Blood War"),
    "seasons": [
        make_season("Cour 1 - Blood Warfare", 13, 2022, "The Quincies declare war."),
        make_season("Cour 2 - Separation", 13, 2023, "Squad Zero vs Yhwach's elites."),
        make_season("Cour 3 - Conflict", 13, 2024, "The final battle unfolds."),
    ],
})

# ---------- random anime pool ----------

# Synthesized but plausible-sounding titles
PREFIXES = [
    "Crimson", "Azure", "Silent", "Eternal", "Forgotten", "Sacred", "Phantom", "Twilight",
    "Midnight", "Cursed", "Burning", "Frozen", "Hidden", "Lost", "Divine", "Fallen",
    "Endless", "Shattered", "Wandering", "Wild", "Iron", "Shadow", "Starlight", "Velvet",
    "Storm", "Crystal", "Ancient", "Silver", "Golden", "Spectral", "Roaring", "Forsaken",
    "Hollow", "Radiant", "Wicked", "Sovereign", "Bleeding", "Abyssal", "Celestial", "Emerald",
]
CENTRAL = [
    "Blade", "Requiem", "Sword", "Chronicle", "Saga", "Destiny", "Pact", "Requiem",
    "Symphony", "Covenant", "Chronicle", "Empire", "Legacy", "Mystery", "Echo", "Verse",
    "Hunter", "Requiem", "Tide", "Veil", "Embrace", "Ascension", "Reckoning", "Vow",
    "Oracle", "Lament", "Fable", "Harvest", "Reverie", "Carnival", "Parade", "Masquerade",
    "Genesis", "Exodus", "Apocalypse", "Frontier", "Tactics", "Protocol", "Solitude", "Rebellion",
]
SUFFIXES = [
    "of the Abyss", "in the Sky", "of the Damned", "of the Forgotten", "Beyond Time",
    "of the Holy Sword", "of the End", "of the Crimson Moon", "in the Dark", "of Eternity",
    "of the Forsaken", "of the Stars", "of the New World", "of the Damned", "of the Wild Hunt",
    "of the Black Sun", "of the Last Dawn", "of the Sacred Throne", "of the Hollow Crown",
    "of the Final Hour", "of the Iron Throne", "of the Forgotten Gods", "of the Deep",
    "of the Velvet Night", "of the Crystal Kingdom", "", "", "", "", "", "", "", "", "",
]

STUDIOS = [
    "MAPPA", "Bones", "Wit Studio", "Ufotable", "Madhouse", "A-1 Pictures", "Kyoto Animation",
    "Studio Pierrot", "Trigger", "Production I.G", "Shaft", "Sunrise", "Toei Animation",
    "Silver Link", "JC Staff", "White Fox", "CloverWorks", "WIT", "Brain's Base", "TROYCA",
    "Eight Bit", "Liden Films", "Telecom Animation Film", "Science SARU", "Doga Kobo",
    "Studio 3Hz", "Orange", "Lerche", "David Production", "Ajia-do",
]

GENRE_POOL = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance",
    "Sci-Fi", "Slice of Life", "Supernatural", "Thriller", "Mecha", "Psychological",
    "Ecchi", "Harem", "School", "Shounen", "Seinen", "Shoujo", "Sports", "Music",
    "Historical", "Military", "Martial Arts", "Magic", "Game", "Demons", "Vampire",
    "Police", "Samurai", "Space", "Super Power", "Cars", "Parody", "Kids",
]

TYPES = ["TV", "TV", "TV", "TV", "TV", "Movie", "OVA", "ONA", "TV", "TV"]
STATUSES = ["Finished", "Finished", "Finished", "Ongoing", "Finished", "Upcoming"]

SYNOPSIS_TEMPLATES = [
    "In a world where {concept} reigns supreme, {protagonist} must uncover the truth behind {mystery} before {danger} consumes everything.",
    "After a mysterious incident, {protagonist} awakens with the power of {power}. Hunted by {enemy}, they join a secret order to protect humanity.",
    "Long ago, the {kingdom} fell to {enemy}. Now, a young warrior named {protagonist} sets out to reclaim what was lost, wielding the legendary {weapon}.",
    "When {protagonist} transfers to a new academy, they discover that students are secretly {secret}. Now they must navigate alliances, betrayal, and forbidden romance.",
    "The year is 20XX. {protagonist}, a skilled {profession}, is recruited into an elite squad to combat the rising threat of {enemy}.",
    "In the city of {city}, where {concept} and reality blur, {protagonist} investigates a string of bizarre disappearances tied to an ancient {artifact}.",
    "Five strangers are summoned to the realm of {kingdom}. Each carries a unique {power}, and together they may be the only ones who can stop {danger}.",
    "Betrayed and left for dead, {protagonist} is reborn with the cursed mark of {enemy}. Now they walk the line between hero and monster.",
    "In a school where {concept} determines your fate, {protagonist} challenges the system after meeting a mysterious transfer student with a dark past.",
    "As war engulfs the {kingdom}, {protagonist} - a young {profession} - discovers a hidden power that could turn the tide. But using it may cost them everything.",
]
CONCEPTS = ["magic", "destiny", "war", "spirits", "machines", "the void", "karma", "fate", "chaos", "light", "shadow", "dragons", "the curse", "the dream", "the game"]
PROTAGONISTS = ["Ren", "Yuki", "Haru", "Kai", "Sora", "Aoi", "Rin", "Kenji", "Akira", "Hina", "Suzu", "Toma", "Mika", "Riku", "Noa", "Sho", "Daichi", "Ibara", "Hibiki", "Kotone"]
MYSTERIES = ["their family's murder", "an ancient prophecy", "a forbidden ritual", "a forgotten war", "a sealed god", "their own past", "a hidden kingdom", "a cursed bloodline", "a missing friend", "an unsolved crime"]
DANGERS = ["the Abyss", "the Eternal Night", "the Chaos King", "the Hollow Army", "the Black Plague", "the Last Song", "the Void", "the Cursed Moon", "the End Times", "the False God"]
ENEMIES = ["demons", "the Syndicate", "the Order", "the Hollow Ones", "fallen angels", "rogue spirits", "the Witch Coven", "the Crimson Court", "corrupted officials", "the Machine Cult"]
KINGDOMS = ["Aethelgard", "Velka", "the Shattered Realm", "the Sunless Empire", "Karastan", "the Iron Dominion", "Veyra", "the Crystal Kingdom", "the Forgotten Lands", "the Holy City of Mira"]
POWERS = ["the Crimson Eye", "the Spirit Blade", "the Soul Chain", "the Void Mark", "the Starforge", "the Heavenly Mandate", "the Demon Pact", "the Phoenix Flame", "the Shadow Step", "the Infinite Codex"]
WEAPONS = ["sword of eternal flame", "bow of fallen stars", "spear of destiny", "twin daggers of the void", "warhammer of the gods", "scythe of the reaper", "chain whip of the abyss", "katana of the crimson moon"]
SECRETS = ["trained as assassins", "possessed by spirits", "bound by ancient contracts", "fighting in an underground war", "the reincarnations of legendary heroes", "participants in a deadly game", "vampires in disguise", "wielding forbidden magic"]
PROFESSIONS = ["mercenary", "detective", "exorcist", "knight", "alchemist", "ninja", "mage", "samurai", "gunman", "spirit hunter", "thief", "strategist"]
CITIES = ["Neo Tokyo", "Eldoria", "Karasuno", "the White City", "the Underworld", "Verdant Bay", "Saint Helios", "the Ninth Ward", "Mizahar", "Aetheria"]
ARTIFACTS = ["tome", "relic", "mirror", "idol", "blade", "mask", "compass", "bell", "crown", "key"]

def make_synopsis():
    tpl = random.choice(SYNOPSIS_TEMPLATES)
    return tpl.format(
        concept=random.choice(CONCEPTS),
        protagonist=random.choice(PROTAGONISTS),
        mystery=random.choice(MYSTERIES),
        danger=random.choice(DANGERS),
        enemy=random.choice(ENEMIES),
        kingdom=random.choice(KINGDOMS),
        power=random.choice(POWERS),
        weapon=random.choice(WEAPONS),
        secret=random.choice(SECRETS),
        profession=random.choice(PROFESSIONS),
        city=random.choice(CITIES),
        artifact=random.choice(ARTIFACTS),
    )

def make_title():
    style = random.randint(0, 4)
    if style == 0:
        return f"{random.choice(PREFIXES)} {random.choice(CENTRAL)}{': ' + random.choice(SUFFIXES) if random.random() < 0.3 and random.choice(SUFFIXES) else ''}"
    elif style == 1:
        return f"{random.choice(PREFIXES)} {random.choice(CENTRAL)} {random.choice(SUFFIXES)}".strip()
    elif style == 2:
        return f"{random.choice(CENTRAL)} {random.choice(SUFFIXES)}".strip()
    elif style == 3:
        return f"The {random.choice(CENTRAL)} of {random.choice(KINGDOMS)}"
    else:
        # subtitle style
        return f"{random.choice(PROTAGONISTS)} no {random.choice(CENTRAL)}"

def make_random_anime(idx: int) -> dict:
    title = make_title()
    while not title.strip():
        title = make_title()
    slug = slugify(title)
    # ensure uniqueness
    slug = f"{slug}-{idx}"

    year = random.randint(1995, 2025)
    seasons_count = random.choices([1, 1, 1, 1, 2, 2, 3, 4, 5, 6], k=1)[0]
    base_eps = random.randint(12, 26)
    seasons = []
    total_eps = 0
    for s in range(seasons_count):
        eps = base_eps if s == 0 else max(10, base_eps + random.randint(-2, 6))
        s_year = year + s
        seasons.append(make_season(
            f"Season {s + 1}",
            eps,
            s_year,
            f"Season {s + 1} continues the story."
        ))
        total_eps += eps

    genres = random.sample(GENRE_POOL, k=random.randint(2, 5))
    rating = round(random.uniform(5.5, 9.4), 2)
    popularity = random.randint(100, 5000)

    season_str_map = ["Winter", "Spring", "Summer", "Fall"]
    season_str = f"{random.choice(season_str_map)} {year}"

    return {
        "id": slug,
        "title": title,
        "altTitles": [],
        "type": random.choice(TYPES),
        "status": random.choice(STATUSES),
        "year": year,
        "season": season_str,
        "studio": random.choice(STUDIOS),
        "rating": rating,
        "popularity": popularity,
        "genres": genres,
        "synopsis": make_synopsis(),
        "duration": random.choice([23, 24, 24, 24, 25]),
        "totalEpisodes": total_eps,
        "featured": False,
        "poster": hsl_poster(title),
        "seasons": seasons,
    }

# generate 500 unique random anime
random_anime = []
seen_titles = set()
i = 0
attempts = 0
while len(random_anime) < 500 and attempts < 5000:
    a = make_random_anime(i)
    if a["title"] in seen_titles:
        attempts += 1
        continue
    seen_titles.add(a["title"])
    random_anime.append(a)
    i += 1
    attempts += 1

# Combine: specific first, then random
all_anime = specific + random_anime

# Top 10 ranking (specific user picks first, then highest rated random)
# Order by user priority: the 8 specific series (Bleach TYBW counts), then top-rated randoms
top10_ids = [a["id"] for a in specific] + [
    a["id"] for a in sorted(random_anime, key=lambda x: (-x["rating"], x["popularity"]))[:max(0, 10 - len(specific))]
][:10]

# ---------- build genre index ----------
all_genres = set()
for a in all_anime:
    for g in a["genres"]:
        all_genres.add(g)
all_genres = sorted(all_genres)

# ---------- write ----------
data = {
    "anime": all_anime,
    "top10": top10_ids,
    "genres": all_genres,
    "studios": sorted(set(STUDIOS)),
    "years": sorted(set(a["year"] for a in all_anime), reverse=True),
}

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(all_anime)} anime ({len(specific)} specific + {len(random_anime)} random)")
print(f"Top 10: {top10_ids}")
print(f"Genres: {len(all_genres)}")
print(f"Output: {OUT}")
