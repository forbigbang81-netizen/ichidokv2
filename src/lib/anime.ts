/**
 * Ichidoki — anime data layer.
 *
 * Loads the bundled `anime-archive.json` (17 anime with Archive.org
 * episode URLs) and exposes typed accessors for the UI.
 *
 * The archive JSON only carries the bare minimum (id / title / identifier /
 * episodes). Editorial metadata — synopsis, genres, year, studio, rating —
 * is merged in from a hand-curated `META` map so the product feels real.
 */
import archiveData from "@/data/anime-archive.json";
import posterMap from "@/data/anime-posters.json";

export type Episode = {
  name: string;
  ep_num: number;
  url: string;
  /** Optional: URL for the dubbed-audio version of the same episode. */
  dub_url?: string;
};

export type Anime = {
  id: string;
  title: string;
  identifier: string;
  episode_count: number;
  episodes: Episode[];
  // Merged editorial metadata (with sensible fallbacks).
  year: number;
  studio: string;
  rating: number; // 0–10
  popularity: number; // lower = more popular (rank)
  genres: string[];
  synopsis: string;
  featured: boolean;
  backdropColor: string; // tailwind gradient stop used for hero/poster fallback
  /** "sub" = Japanese audio + English subtitles only (default).
   *  "dub" = English-dubbed audio only.
   *  "both" = both versions available — player shows a Sub/Dub toggle. */
  audio: "sub" | "dub" | "both";
  /** Franchise key — anime with the same `franchise` value are different seasons
   *  of the same show (e.g. "attack-on-titan" for AoT S1 + S2 + S3 + S4).
   *  Used by the Seasons tab on the details page. */
  franchise?: string;
  /** Season number within the franchise (1, 2, 3, ...). */
  season?: number;
};

export type ArchiveAnime = {
  id: string;
  title: string;
  identifier: string;
  episode_count: number;
  episodes: Episode[];
};

const archive = archiveData as ArchiveAnime[];

/** Hand-curated editorial metadata keyed by anime id. */
const META: Record<
  string,
  {
    year: number;
    studio: string;
    rating: number;
    popularity: number;
    genres: string[];
    synopsis: string;
    featured?: boolean;
    backdropColor: string;
    audio?: "sub" | "dub" | "both";
    franchise?: string;
    season?: number;
  }
> = {
  "death-note": {
    year: 2006,
    studio: "Madhouse",
    rating: 9.0,
    popularity: 1,
    genres: ["Mystery", "Psychological", "Supernatural", "Thriller"],
    synopsis:
      "Brilliant high-school student Light Yagami stumbles upon a notebook that kills anyone whose name is written inside it. What begins as a god-complex experiment in justice spirals into a cat-and-mouse thriller against the enigmatic detective L.",
    featured: true,
    backdropColor: "#3a0d0d",
    audio: "both",
  },
  "attack-on-titan": {
    year: 2013,
    studio: "Wit Studio",
    rating: 8.5,
    popularity: 2,
    genres: ["Action", "Drama", "Fantasy", "Horror"],
    synopsis:
      "Behind colossal walls, the last remnants of humanity live in fear of man-eating Titans. When a young soldier witnesses his home fall, he vows to eradicate every Titan and reclaim the world.",
    featured: true,
    backdropColor: "#1c2a3a",
    audio: "both",
    franchise: "attack-on-titan",
    season: 1,
  },
  "attack-on-titan-s2": {
    year: 2017,
    studio: "Wit Studio",
    rating: 8.5,
    popularity: 18,
    genres: ["Action", "Drama", "Fantasy", "Horror"],
    synopsis:
      "Season 2 — Eren and the Survey Corps uncover the truth behind the Titans within the walls, including the secret of his own powers. The Beast Titan makes its first move.",
    backdropColor: "#1c2a3a",
    audio: "both",
    franchise: "attack-on-titan",
    season: 2,
  },
  "attack-on-titan-s3": {
    year: 2018,
    studio: "Wit Studio",
    rating: 8.7,
    popularity: 19,
    genres: ["Action", "Drama", "Fantasy", "Horror"],
    synopsis:
      "Season 3 — the Survey Corps ventures beyond the walls to uncover the truth of the world, while a coup d'etat rocks the interior. The origins of the Titans are finally revealed.",
    backdropColor: "#1c2a3a",
    audio: "both",
    franchise: "attack-on-titan",
    season: 3,
  },
  "attack-on-titan-s4": {
    year: 2020,
    studio: "MAPPA",
    rating: 9.0,
    popularity: 20,
    genres: ["Action", "Drama", "Fantasy", "Horror"],
    synopsis:
      "The Final Season — war erupts as Marley launches an assault on Paradis, and Eren embraces a dark new path. The fate of humanity hangs in the balance.",
    backdropColor: "#1c2a3a",
    audio: "both",
    franchise: "attack-on-titan",
    season: 4,
  },
  "cowboy-bebop": {
    year: 1998,
    studio: "Sunrise",
    rating: 8.8,
    popularity: 3,
    genres: ["Action", "Sci-Fi", "Space", "Drama"],
    synopsis:
      "A ragtag crew of bounty hunters drifts through space aboard the Bebop, chasing criminals and outrunning their own pasts. Jazz, blues, and existential cool.",
    featured: true,
    backdropColor: "#2a1c0d",
    audio: "both",
  },
  "dr-stone": {
    year: 2019,
    studio: "TMS Entertainment",
    rating: 8.2,
    popularity: 4,
    genres: ["Adventure", "Comedy", "Sci-Fi"],
    synopsis:
      "A mysterious flash petrifies all of humanity for thousands of years. Teenage genius Senku awakens and sets out to rebuild civilization from scratch — using the power of science.",
    backdropColor: "#0d2a1c",
    audio: "both",
  },
  "black-clover": {
    year: 2017,
    studio: "Studio Pierrot",
    rating: 8.2,
    popularity: 5,
    genres: ["Action", "Comedy", "Fantasy", "Magic"],
    synopsis:
      "Born without magic in a world where it's everything, Asta refuses to give up. He trains his body raw and aims for the title of Wizard King alongside his rival Yuno.",
    backdropColor: "#1c1c3a",
    audio: "both",
  },
  "danmachi": {
    year: 2015,
    studio: "J.C.Staff",
    rating: 7.6,
    popularity: 6,
    genres: ["Action", "Adventure", "Comedy", "Fantasy"],
    synopsis:
      "Bell Cranel dreams of becoming the greatest adventurer in Orario. Beneath the city lies a sprawling dungeon — and a goddess who sees something special in him.",
    backdropColor: "#2a1c2a",
    audio: "both",
  },
  "akame-ga-kill": {
    year: 2014,
    studio: "White Fox",
    rating: 7.5,
    popularity: 5,
    genres: ["Action", "Adventure", "Drama", "Fantasy"],
    synopsis:
      "Tatsumi, a young fighter, sets out for the capital to earn money for his starving village — only to be recruited into Night Raid, a secret assassination group fighting the corrupt Empire with powerful weapons called Teigu.",
    backdropColor: "#2a0d0d",
    audio: "both",
  },
  "100-girlfriends": {
    year: 2023,
    studio: "Bibury Animation Studios",
    rating: 7.4,
    popularity: 15,
    genres: ["Comedy", "Romance", "Harem", "Supernatural"],
    synopsis: "Aijou Rentarou has 100 soulmates. That's what the God of Love told him. The catch? If he doesn't return their feelings, they'll die. So he resolves to date all 100 of them.",
    backdropColor: "#1c2a0d",
    audio: "both",
  },
  "overlord": {
    year: 2015,
    studio: "Madhouse",
    rating: 7.9,
    popularity: 7,
    genres: ["Action", "Fantasy", "Adventure"],
    synopsis:
      "When his favorite MMORPG shuts down, Momonga stays logged in — and wakes up as his skeletal overlord avatar, ruling a tomb of fanatically loyal NPCs in a strange new world.",
    backdropColor: "#1a0d2a",
    audio: "both",
  },
  "overlord-ii": {
    year: 2018,
    studio: "Madhouse",
    rating: 7.7,
    popularity: 8,
    genres: ["Action", "Fantasy", "Adventure"],
    synopsis:
      "Ainz Ooal Gown expands his grip on the new world, dispatching his Floor Guardians to crush kingdoms while uncovering the truth behind this reality.",
    backdropColor: "#1a0d2a",
    audio: "both",
  },
  "rwby": {
    year: 2013,
    studio: "Rooster Teeth",
    rating: 7.6,
    popularity: 9,
    genres: ["Action", "Adventure", "Fantasy"],
    synopsis:
      "At Beacon Academy, young warriors train as Huntsmen and Huntresses to defend Remnant from the shadowy Creatures of Grimm. Team RWBY takes the stage.",
    backdropColor: "#2a0d1c",
  },
  "welcome-to-the-nhk": {
    year: 2006,
    studio: "Gonzo",
    rating: 8.0,
    popularity: 10,
    genres: ["Comedy", "Drama", "Romance"],
    synopsis:
      "A shut-in college dropout is convinced a conspiracy — the N.H.K. — is to blame for his hikikomori life. Then a mysterious girl offers to cure him.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "prison-school": {
    year: 2015,
    studio: "J.C.Staff",
    rating: 7.7,
    popularity: 11,
    genres: ["Comedy", "Ecchi", "Romance"],
    synopsis:
      "Five boys enroll at a formerly all-girls academy and are immediately thrown into the school's underground prison by the secretive Underground Student Council.",
    backdropColor: "#2a2a1c",
    audio: "both",
  },
  "how-not-to-summon-a-demon-lord": {
    year: 2018,
    studio: "Ajiado",
    rating: 6.7,
    popularity: 12,
    genres: ["Comedy", "Ecchi", "Fantasy"],
    synopsis:
      "A socially-anxious gamer is summoned to a fantasy world as his max-level demon-lord avatar — and the two girls who called him there become his reluctant servants.",
    backdropColor: "#2a1c3a",
    audio: "both",
  },
  "btooom": {
    year: 2012,
    studio: "Madhouse",
    rating: 6.7,
    popularity: 13,
    genres: ["Action", "Horror", "Psychological", "Sci-Fi"],
    synopsis:
      "A top-ranked Btooom! player wakes on a real island where he must survive the game he mastered online — armed only with bombs and surrounded by killers.",
    backdropColor: "#1c2a1c",
    audio: "both",
  },
  "bobobo-bo-bo-bobo": {
    year: 2003,
    studio: "Toei Animation",
    rating: 7.0,
    popularity: 14,
    genres: ["Action", "Comedy", "Sci-Fi"],
    synopsis:
      "In a world ruled by the bald Margarita Empire, a golden-afro'd hero fights tyranny with the power of nose hair and pure, unfiltered absurdity.",
    backdropColor: "#2a2a0d",
    audio: "both",
  },
  "sonic-x": {
    year: 2003,
    studio: "TMS Entertainment",
    rating: 6.8,
    popularity: 15,
    genres: ["Action", "Adventure", "Comedy", "Sci-Fi"],
    synopsis:
      "A hyper-speed hedgehog and his friends are transported to the human world, where they team up with a boy named Chris to foil Dr. Eggman's schemes.",
    backdropColor: "#0d2a3a",
    audio: "both",
  },
  "zoids-new-century-zero": {
    year: 2001,
    studio: "Xebec",
    rating: 7.5,
    popularity: 16,
    genres: ["Action", "Adventure", "Mecha", "Sci-Fi"],
    synopsis:
      "Pilots battle in mechanized combat beasts called Zoids. The Blitz Team, led by the rookie Bit Cloud, races toward the S-Class league championship.",
    backdropColor: "#1c1c2a",
  },
  "zoids-chaotic-century": {
    year: 1999,
    studio: "Xebec",
    rating: 7.6,
    popularity: 17,
    genres: ["Action", "Adventure", "Mecha", "Sci-Fi"],
    synopsis:
      "Stranded in a desert, a boy discovers an ancient Zoid and an amnesiac girl — kicking off a continent-spanning war between mechanized beasts.",
    backdropColor: "#2a1c1c",
  },
  "a-hundred-scenes-of-awajima": {
    year: 2026,
    studio: "Madhouse",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "This omnibus adolescent drama is about a group of young girls who all attend a 'girls-only musical school,' recounting the formative years they shared, at times shifting between different characters' viewpoints and time.Awajima Musical School Training Camp, dubbed the 'boarding house,' is where y...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "a-livid-ladys-guide-to-getting-even-how-i-crushed-my-homeland-with-my-mighty-grimoires": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Elizabeth Leiston, the daughter of Haldoria's powerful prime minister, is the picture of a refined noble lady and the perfect future queen. But when her fiancé publicly humiliates her, calls off their engagement, and starts spreading nasty rumors about her, Elizabeth reaches her breaking point. W...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "a-misanthrope-teaches-a-class-for-demi-humans": {
    year: 2026,
    studio: "asread.",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "I'm Rei Hitoma, a self-professed misanthrope thanks to some past trauma. Just when I thought my new teaching job in the mountains would provide a chill, rejuvenating environment, it turns out that this school is actually for demi-humans who want to become full-fledged human beings! There's a merm...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "agents-of-the-four-seasons-dance-of-spring": {
    year: 2026,
    studio: "Wit Studio",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Winter was once the only season in the world-but such an existence was too lonely to bear, and so it created Spring to love. Before long, the earth wished for more time to rest in the cycle, and Summer and Autumn were born. The ones who carry the cycle are called the Agents of the Four Seasons. H...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "always-a-catch": {
    year: 2026,
    studio: "TROYCA",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Maria, the daughter of a duke, grew up believing she would one day inherit her father's dukedom. Accordingly, she focused her attentions on honing her martial arts prowess, while thoughts of marriage fell by the wayside. But the arrival of a baby brother in her family means she's losing her role ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "ascendance-of-a-bookworm-adopted-daughter-of-an-archduke": {
    year: 2026,
    studio: "Wit Studio",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Anime adaptation of part three of the Honzuki no Gekokujou light novel.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "azur-lane-slow-ahead-season-2": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Azur Lane: Bisoku Zenshin!.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "black-torch": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Seventeen-year-old Jirou Azuma lives a quiet life with his grandfather, utilizing his supernatural ability to speak with animals to befriend and protect them. Both Jirou and his grandfather are descendants of a long-standing shinobi clan, training in combat to keep the art of battle alive within ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "bleach-thousand-year-blood-war-the-calamity": {
    year: 2026,
    studio: "Pierrot",
    rating: 9.1,
    popularity: 8,
    genres: ["Action", "Adventure", "Supernatural"],
    synopsis:
      "The final arc of Bleach — the Quincy King Yhwach launches an all-out war against the Soul Society.",
    backdropColor: "#3a0d1c",
    audio: "both",
  },
  "blue-miburo-season-2": {
    year: 2025,
    studio: "Maho Film",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Ao no Miburo.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "boku-no-hero-academia-i-am-a-hero-too": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Boku no Hero Academia: I am a hero too — streaming now on Ichidoki.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "cardfight-vanguard-divinez-parallactic-clash": {
    year: 2026,
    studio: "Gift-o’-Animation",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "An abnormal phenomenon has been observed in Kaga, where Akina and his friends live. A town shrouded in thick fog, a great tower standing sentinel… This is the Fantasma.——On the night when the crimson moon rises, they shall become 'Fantôme.'",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "case-closed": {
    year: 1996,
    studio: "TMS Entertainment",
    rating: 8.2,
    popularity: 55,
    genres: ["Mystery", "Adventure", "Comedy"],
    synopsis:
      "Teenage detective Conan Edogawa solves murders and mysteries while searching for the men who shrunk him.",
    backdropColor: "#1c1c2a",
    audio: "both",
  },
  "classroom-of-the-elite-4th-season-second-year-first-semester": {
    year: 2026,
    studio: "Lerche",
    rating: 8.0,
    popularity: 22,
    genres: ["Drama", "Psychological", "School"],
    synopsis:
      "Season 4 — Ayanokoji Kiyotaka returns to Tokyo Metropolitan Advanced Nurturing School.",
    backdropColor: "#1c1c3a",
    audio: "both",
  },
  "clevatess-season-2": {
    year: 2026,
    studio: "Lay-duce",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Clevatess.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "dark-moon-the-blood-altar": {
    year: 2026,
    studio: "TROYCA",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Ever since she was a young girl, Sooha was told to hide her superhuman abilities to avoid getting mistaken for a vampire. Having been accused of being one and blamed for her childhood friend's death, Sooha enrolls in Decelis Academy—a night school where supernatural beings, such as vampires and w...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "dead-account": {
    year: 2026,
    studio: "SynergySP",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Always ready for a fight! Destruction for destruction's sake! The online streamer Aoringo is a troll, making the worst of the worst of boundary-pushing flamebait content and raking in the revenue from the hate-watchers. You may think he's nothing more than a bottom feeder and a drain on society, ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "digimon-beatbreak": {
    year: 2025,
    studio: "Toei Animation",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Tomorou Tenma possesses a uniquely strong e-Pulse—the energy created by human thoughts and emotions that powers egg-shaped AI devices named Sapotama. The world's everyday life relies on the assistance of Sapotamas, but the force of Tomorou's e-Pulse often causes glitches in them. One night, a str...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "dorohedoro-season-2": {
    year: 2026,
    studio: "MAPPA",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Dorohedoro.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "dr-stone-science-future-part-3": {
    year: 2026,
    studio: "TMS Entertainment",
    rating: 8.4,
    popularity: 24,
    genres: ["Adventure", "Comedy", "Sci-Fi"],
    synopsis:
      "Senku and the Kingdom of Science push forward into the science future.",
    backdropColor: "#1c3a3a",
    audio: "both",
  },
  "draw-this-then-die": {
    year: 2026,
    studio: "Shin-Ei Animation",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Ai Yasumi, a first-year high school student living on Izu-Oshima, loves manga more than anything. When she learns that her long-admired, yet long-inactive, favorite manga artist Hoshi no Rei will be exhibiting at COMITIA, she sets off on a journey to Tokyo.What she doesn't expect, however, is tha...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "eren-the-southpaw-se": {
    year: 2026,
    studio: "Production I.G",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The story follows Koichi Asakura, a designer for an ad agency who works hard but receives no recognition. After being dropped from a project, he visits a place from his past, where he met Eren Yamagishi. Eren, meanwhile, is recognized as a genius left-handed graffiti artist in New York, while end...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "even-a-replica-can-fall-in-love": {
    year: 2026,
    studio: "Voil",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "On days when Sunao is sick, or not feeling like going to school, she is called to take her place. She was born to this world when Sunao wished to have a substitute. No one knows that she exists, but she tries to do her best for Sunao whenever she is called. One day she talks with Sanada, one of h...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "fabulous-beasts-5th-season": {
    year: 2026,
    studio: "Fenz",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Fifth season of You Shou Yan.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "farming-life-in-another-world-season-2": {
    year: 2026,
    studio: "Zero-G",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Isekai Nonbiri Nouka.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "fate-strange-fake": {
    year: 2026,
    studio: "A-1 Pictures",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "A new Holy Grail War is emerging in Snowfield, Nevada, where mages from around the world summon Servants, heroic spirits drawn from myth and history, to fight on their behalf. However, this war seems to differ from previous ones. The organization behind it appears to have used data from the Fuyuk...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "fire-force-season-3-part-2": {
    year: 2026,
    studio: "David Production",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second part of Enen no Shouboutai: San no Shou.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "frieren-beyond-journeys-end-season-2": {
    year: 2026,
    studio: "Madhouse",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Following the First-Class Mage Exam, the trio—elven mage Frieren, warrior Stark, and first-class mage Fern—gains access to the dangerous Northern Plateau. As the party presses onward toward Aureole, formidable adversaries force Stark to confront his insecurities, solidifying his resolve and his r...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "from-old-country-bumpkin-to-master-swordsman-season-2": {
    year: 2026,
    studio: "Hayabusa Film",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Katainaka no Ossan, Kensei ni Naru.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "gals-cant-be-kind-to-otaku": {
    year: 2026,
    studio: "TMS Entertainment",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Meet Takuya Seo, an otaku who sits behind the popular gals in class, Ijichi and Amane. Since they're people from different 'castes,' you wouldn't expect them to have much in common. But when their worlds collide over a borrowed eraser, Takuya slips up about his favorite anime, and Amane'is rather...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "ganglion": {
    year: 2025,
    studio: "studio maf",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Early 2000s Tokyo. Isobe, a combatant for the evil corporation Ganglion, spends his days on the battlefield. Whether it's the 'Tokyo Cedar Pollen Operation' or the 'Mount Fuji Demolition Plan,' he faces off in nothing but a bodysuit, only to be crushed by the hero Hopeman time and again. As he st...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "gnosia": {
    year: 2025,
    studio: "domerica",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Saddled with amnesia, Yuuri awakens on an interstellar cruiser drifting through space. Unfortunately, a lack of memories is the least of Yuuri's problems. Among the four other crew members is a Gnosia: a Gnos infectee whose goal is the eradication of humanity. The Gnosia appears human in all othe...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "go-for-it-nakamura-kun": {
    year: 2026,
    studio: "Drive",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Okuto Nakamura is a timid and gloomy-looking student who cherishes only two things in this world: his pet octopus and his kind-hearted classmate, Aiki Hirose. Ever since the school entrance ceremony, Nakamura has admired his jovial classmate, albeit from a distance due to his poor social skills. ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "golden-kamuy-final-season": {
    year: 2026,
    studio: "Brain's Base",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Ex-convict Keiji Ueji appears in Sapporo, causing all the different factions to travel to the city in hopes of obtaining part of the map to the Ainu gold that is tattooed on his skin. At the same time, a figure who appears to be a copycat of Jack the Ripper terrorizes the streets of Sapporo. Saic...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "goodbye-lara": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Long, long ago, there lived a mermaid princess named Lara. She was raised with love by her father, the king of sea and her sisters. One day, Lara fell in love with a human prince who lived on land. It was a forbidden love—one that was not allowed in the world of mermaids. Still, Lara journeyed to...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "grand-blue-dreaming-season-3": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Third season of Grand Blue.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "grow-up-show-sunflower-circus": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "In Japan during the height of its economic boom in the mid-1950s, the circus was a form of entertainment that became a central part of many people's lives. The best troupes are permitted to participate in the world-renowned 'Circus Collection' festival, and many come from all over Japan to compet...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "haibaras-teenage-new-game": {
    year: 2026,
    studio: "Studio Comet",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "We all have embarrassing memories or deep regrets from high school, right? Socially anxious college senior Natsuki Haibara sure does. When he thinks back on that time of his life, all he has are fleeting fantasies of a happy adolescence that could have been. Imagine his bewilderment and surprise,...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "hana-kimi": {
    year: 2026,
    studio: "Signal.MD",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "To most people around Mizuki Ashiya, her sudden choice to move to Japan from the United States comes as a shock. Her sole reason for the transfer is to attend the same high school as her idol Izumi Sano, who stole her heart after she saw him compete in a high jump competition. However, there is o...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "hanaori-san-still-wants-to-fight-in-the-next-life": {
    year: 2026,
    studio: "LIDENFILMS",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Narukami Ryusei is your typical NEET. He spends his days shut in his room playing video games without a care in the world, living a lazy life. But the truth is, Ryusei used to be a powerful demon king in another world! So why not spend this new life doing whatever he wants? Except, he wasn't the ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "hell-mode-the-hardcore-gamer-dominates-in-another-world-with-garbage-balancing": {
    year: 2026,
    studio: "Yokohama Animation Lab",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "'Level up even while offline?! That's not a game on 'easy mode'—that's just an AFK game!' The online game Kenichi Yamada had been playing religiously is shutting down its servers, leaving him with a void in his heart. He looks for a new game to fill it, but everything he finds is way too easy. Th...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "hell-mode-the-hardcore-gamer-dominates-in-another-world-with-garbage-balancing-season-2": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Hell Mode: Yarikomizuki no Gamer wa Hai Settei no Isekai de Musou suru.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "hell-teacher-jigoku-sensei-nube-part-2": {
    year: 2026,
    studio: "Studio KAI",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second part of Jigoku Sensei Nube (2025).",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "hells-paradise-season-2": {
    year: 2026,
    studio: "MAPPA",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Seeking the key to the elixir of immortality, the group arrives at the fortress of the island's monstrous ruler, the 'Tensen.' To survive and escape the island, cooperation becomes essential—regardless of whether one is a condemned criminal or an executioner.Meanwhile, the shogunate orders additi...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "high-school-kimengumi-2026": {
    year: 2026,
    studio: "Seven",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Rei Ichidou, Gou Reietsu, Kiyoshi Shusse, Jin Daima, and Dai Monohoshi are five mischievous boys attending Ichiou Junior High. Each with an eccentric personality and a knack for chaos, they've earned a reputation as the infamous 'Kimen-gumi.'One day, new transfer student Yui Kawa and her friend C...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "i-became-a-legend-after-my-10-year-long-last-stand": {
    year: 2026,
    studio: "Gekkou",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The sorcerer Luck believes this to be the end. Besieged by powerful demons, he makes the noble sacrifice of holding back their onslaught while his friends escape. Never sleeping or resting, Luck endures the clash of swords, rain of blood, and never-ending stream of enemies. Against all odds, he v...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "i-made-friends-with-the-second-prettiest-girl-in-my-class": {
    year: 2026,
    studio: "Connect",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "I, Maehara Maki, struggled to connect with anyone during my high school years, finding it hard to make friends. Then, a turning point arrived. A girl named Asanagi entered my life. Despite being clandestinely referred to as the 'second cutest girl in class' by the boys, she chose to spend her Fri...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "i-want-to-end-this-love-game": {
    year: 2026,
    studio: "Felix Film",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "In sixth grade, childhood friends Yukiya Asagi and Miku Sakura created a game with the objective to embarrass the other person by taking turns saying 'I love you.' Four years later, even as they are entering high school, the two are still trying to one-up the other and claim victory. However, as ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "i-want-to-love-you-till-your-dying-day": {
    year: 2026,
    studio: "ROLL2",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The death of Sheena Totsuki's roommate is casually announced at the start of class, and the day carries on as usual. In an orphanage that raises children as soldiers, death is nothing new to the residents. With their home country embroiled in a war that has dragged on for too many years and shows...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "ill-live-a-long-life-to-dote-on-my-favorite-stepbrother": {
    year: 2026,
    studio: "Imageworks Studio",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Alba is reborn as the son of a poor nobleman. He is unable to use magic due to a disease and is destined to have a short life, so he is taken in by the duke's family. There, he meets Orsis, who was his favorite person in a previous life. While this coincidence seems to good to be true, he remembe...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "in-the-clear-moonlit-dusk": {
    year: 2026,
    studio: "Atelier Peuplier",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Every time Yoi Takiguchi so much as lets out a sigh, her female classmates squeal in admiration and awe. She has been dubbed the school's 'prince' by virtue of her boyishly attractive appearance and casual disposition. However, she chooses to be indifferent toward the attention she receives and s...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "iron-wok-jan": {
    year: 2026,
    studio: "TROYCA",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The original Iron Wok Jan! manga centers on a brilliant young chef named Jan Akiyama, who works at a top class restaurant where he is constantly challenging Kiriko Gobanchou, the granddaughter of the restaurant's owner and a great chef in her own right. While Kiriko believes that food should be m...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "isekai-office-worker-the-other-worlds-books-depend-on-the-bean-counter": {
    year: 2026,
    studio: "Studio Deen",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Overworked office employee Seiichirou Kondou would be fine spending the rest of his days in the same exhausting routine, but an unexpected act of heroism causes him to be sucked into a parallel world. His abductors, residents of the magic-filled Romany Kingdom, promise him a life of comfort as an...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "iya-na-kao-sare-nagara-opantsu-misete-moraitai-returns": {
    year: 2026,
    studio: "UWAN Pictures",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "New anime for Iya na Kao sare nagara Opantsu Misete Moraitai.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "jaadugar-a-witch-in-mongolia": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "In the harem of the Khan, wisdom is beauty. The time: the thirteenth century. The place: Yeke Mongol Ulus, the greatest empire the world has ever known. The woman: Fatima, hailing from Persia, where medical technique and scientific knowledge have been perfected beyond all precedent. Fatima's desi...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "journal-with-witch": {
    year: 2026,
    studio: "Shuka",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Thirty-five-year-old novelist Makio Koudai never had a good relationship with her older sister Minori, who always berated her for being different. Due to this, Makio is not stricken with grief upon hearing the news that Minori and her husband died in a car crash. But when Makio is asked to identi...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "kamui-hes-behind-you": {
    year: 2026,
    studio: "Zero-G",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Shizuka is a normal high school girl with the ability to see ghosts. Due to her peculiar tendency to attract ghosts, she works as an assistant to Kamui, a famous psychic. Kamui takes pride in his top-notch psychic abilities, but the way he exorcises ghosts is rather unusual!",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "kaya-chan-isnt-scary": {
    year: 2026,
    studio: "East Fish Studio",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Kaya-chan is infamous at kindergarten for being a troublemaker. But Ms. Chie, who's been assigned to look after her, soon discovers Kaya's hidden abilities. Get ready for the ultimate horror-action adventure set in kindergarten!",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "killed-again-mr-detective": {
    year: 2026,
    studio: "LIDENFILMS",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Sakuya Otsuki is the son of a legendary detective, working to follow in his father's footsteps with his assistant, Lilithea. However, something's different about this high-school sleuth. Wherever he goes, he always manages to get himself entangled in his cases—as a murder victim! When Sakuya is t...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "kirio-fanclub": {
    year: 2026,
    studio: "Satelight",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Miyoshi Aimi and Nami Sometani are two high school girls who often find themselves talking about a boy in their class, Kirio. This lighthearted romantic comedy follows the daily lives of these two friends and rivals on a journey that, for now, seems to be heading everywhere but love.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "komekami-girls": {
    year: 2026,
    studio: "Daily Plan.net",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "This is the story of the seven-sister unit 'Komekami! Girls,' children of the rice deity, born from the tradition: 'In a single grain of rice, seven gods reside.'When their mother(the deity of rice, or the rice-god queen) was called back in haste to the celestial realm and no longer able to retur...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "kujima-why-sing-when-you-can-warble": {
    year: 2026,
    studio: "Studio Hibari",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "In the autumn of his first year of middle school, Arata Kouda meets Kujima, a strange creature that sort-of looks like a bird. Since Kujima is hungry, Arata brings it home with him' But because of his older brother who failed his entrance exams, Kujima gets carried away by the situation and ends ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "kunon-the-sorcerer-can-see": {
    year: 2026,
    studio: "Platinum Vision",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Born blind, Kunon aims to be the first person to use water magic to create new eyes for himself. After five months of study, he has already surpassed his teacher, and continues to grow his talents. Not only can his magic help him sense color, but he can also use it to make handy items and even co...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "kusunokis-garden-of-gods": {
    year: 2026,
    studio: "Juvenage",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Deep in the countryside, Minato Kusunoki is left in charge of a terrifying house overflowing with evil spirits—or at least it was, until his extraordinary ability cleared them all out! Instead, a procession of unique and peculiar gods is drawn to the comfort of the purified Kusunoki residence, an...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "lets-go-kaikigumi": {
    year: 2026,
    studio: "C-Station",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The story of Let's Go Kaiki-gumi follows a nameless protagonist who is six times more vulnerable to spiritual phenomena than the average human being. One day, the protagonist encounters Mechako, a mysterious girl who runs the Kaiki-gumi, an organization that polices the behavior of the ghosts and...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "liar-game": {
    year: 2026,
    studio: "Madhouse",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "College student Nao Kanzaki has always adhered to her name's meaning: 'foolishly honest.' However, after opening an unsolicited package containing one hundred million yen, she inadvertently accepts an invitation for the 'Liar Game.' In this tournament, contestants are encouraged to betray and dec...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "love-unseen-beneath-the-clear-night-sky": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "On an April night in Tokyo, still too early for fireworks, university student Kakeru Mano meets a woman named Koharu Fuyutsuki. She is a beautiful girl who stands out from the crowd, laughs a lot, and exudes a warmth that contrasts sharply with Kakeru's own introversion. But there was something K...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "magical-girl-lyrical-nanoha-exceeds-gun-blaze-vengeance": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Thirty years ago, the sudden appearance of unknown invasive alien lifeforms nearly brought about the end of the world.Since then, humanity and these creatures, known as Invasion Species, have continued to clash over living territory. Although human safety is barely being maintained, the world rem...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "magilumiere-magical-girls-inc-season-2": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Kabushikigaisha Magi-Lumière.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "marriagetoxin": {
    year: 2026,
    studio: "Bones Film",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "For centuries, the Poison Masters have perfected the art of assassination. Among them, the Gero family stands as one of the five most powerful families of Masters, wielding unmatched skill and influence. Hikaru Gero, heir to this infamous bloodline, has lived his life deep in the shadows of the u...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "mebius-dust": {
    year: 2026,
    studio: "Doga Kobo",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "10 years after a mysterious meteorite crashes to Earth, people called 'Rams Carriers' develop superhuman abilities called 'Rams'. However, those who develop these special abilities can only survive in the presence of the 'Mebius Dust' released by a giant crystal, and so they are forbidden from le...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "medalist-season-2": {
    year: 2026,
    studio: "ENGI",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Ever since the novice coach Tsukasa Akeuraji took Inori Yuitsuka under his mentorship, she has improved her figure skating at a fast pace. After passing a qualifying badge test, she earns a spot to compete in the upcoming Chubu Block Tournament, where only five of the 15 competitors can move forw...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "mushoku-tensei-jobless-reincarnation-season-3": {
    year: 2025,
    studio: "Studio Bind",
    rating: 8.7,
    popularity: 14,
    genres: ["Adventure", "Drama", "Fantasy", "Isekai"],
    synopsis:
      "Season 3 — Rudeus Greyrat continues his second life in a richly detailed fantasy world.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "my-hero-academia": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The appearance of 'quirks,' newly discovered super powers, has been steadily increasing over the years, with 80 percent of humanity possessing various abilities from manipulation of elements to shapeshifting. This leaves the remainder of the world completely powerless, and Izuku Midoriya is one s...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "my-hero-academia-vigilantes-season-2": {
    year: 2026,
    studio: "Bones Film",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Vigilante: Boku no Hero Academia Illegals.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "my-ribdiculous-reincarnation": {
    year: 2026,
    studio: "Qzil.la",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The protagonist of the tale, simply referred to as 'I,' experiences an endless cycle of reincarnation. The narrative takes place in a different universe where people are free to select their next form. However, the waiting list for popular roles, like 'Demon King' or 'Hero with Cheat Skills and a...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "my-stepmother-and-stepsisters-arent-wicked": {
    year: 2026,
    studio: "Newon",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Miya is the illegitimate child of a certain prominent family. When her mother dies, she's convinced she knows what awaits her in her new home: a life of servitude and misery at the hands of her wicked stepmother and stepsisters! Yet when she finally meets the women she expects to treat her like d...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "naruto": {
    year: 2002,
    studio: "Pierrot",
    rating: 8.4,
    popularity: 5,
    genres: ["Action", "Adventure", "Shounen"],
    synopsis:
      "Twelve years after a demon fox attacked the Hidden Leaf Village, Naruto Uzumaki dreams of becoming the Hokage. Branded an outcast, he joins Team 7 and embarks on a journey of growth, rivalry, and discovery.",
    backdropColor: "#1c2a5a",
    audio: "both",
    featured: true,
  },
  "noble-reincarnation-born-blessed-so-ill-obtain-ultimate-power": {
    year: 2026,
    studio: "CompTown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Noah, the world's strongest six-year-old, holds the fortunate position of being the Thirteenth Prince of the emperor. Born with an infinite level cap and a cheat skill that allows him to add the abilities of those he commands to his own, he is unmatched. Reincarnated into a noble family, Noah thr...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "oedo-fire-slayer-the-legend-of-phoenix": {
    year: 2026,
    studio: "SynergySP",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The fire extinguishing samurai who stopped the great fire was called 'The fire-eating bird'. Matsunaga Gengo, once known as the 'Fire-eating Bird', was the best fire-fighting samurai in Edo. He had resigned from the fire brigade for a reason but suddenly received an invitation to serve in the Shi...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "oh-boy-was-i-wrong-about-her": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "I met my childhood friend again, and she had become a beautiful and innocent girl.'It's been a while, Hayato.' 'Haruki, is it?'In the past, I used to play in the mud with my childhood friend in the countryside, and when I saw him again, there was no trace of the bratty young man I thought he was ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "one-piece": {
    year: 1999,
    studio: "Toei Animation",
    rating: 8.7,
    popularity: 1,
    genres: ["Action", "Adventure", "Comedy", "Fantasy"],
    synopsis:
      "Monkey D. Luffy sets sail with his pirate crew, the Straw Hat Pirates, to find the legendary One Piece treasure and become the King of the Pirates. 1000+ episodes of epic adventure.",
    backdropColor: "#1c3a5a",
    audio: "both",
    featured: true,
  },
  "pardon-the-intrusion-im-home": {
    year: 2026,
    studio: "Tatsunoko Production",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "So is this what it means to have roommates now?! Office worker Rinko, 24, lives alone and is secretly an otaku. One day, her apartment gets connected to the two neighboring rooms through a 'hole' in the wall.In the room on the left is a fresh-faced yet mysterious guy who is overly-sweet to Rinko....",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "petals-of-reincarnation-dv": {
    year: 2026,
    studio: "BENTEN Film",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "There exists an object known as the 'Branch of Reincarnation' that can grant people the talents of the past lives, so long as they slit their own throat with it.Touya Senji is a teenage boy struggling with low self-esteem after growing up in the shadow of his gifted older brother. He comes to the...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "please-excuse-my-younger-brothers": {
    year: 2026,
    studio: "Lay-duce",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "During spring break at the end of her first year of high school, Ito learns she has to move because her mother is getting remarried. What she didn't expect is suddenly gaining four younger stepbrothers under the same roof.Determined to get along with her new family, Ito does her best to adjust, b...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "reborn-as-a-vending-machine-i-now-wander-the-dungeon-season-3": {
    year: 2026,
    studio: "AXsiZ",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The third season of Jidou Hanbaiki ni Umarekawatta Ore wa Meikyuu wo Samayou.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "recommendations-from-iwamoto-senpai": {
    year: 2026,
    studio: "Studio Deen",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The 1910s. Iwamoto Kodo, a student at Suho Junior High School under direct command of the army, is investigating paranormal phenomena across the country as per military instruction. In a village rumoured to have 'black snow,' he meets a boy with special powers who believes them to be an illness; ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "red-river": {
    year: 2026,
    studio: "Tatsunoko Production",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Yuri, a pretty Japanese girl, is ecstatic after passing her college entrance exam and having her first kiss with her childhood friend-turned boyfriend. However, her luck soon changes. She starts to notice that water becomes agitated whenever she goes near it. One night, hands appear out of a pudd...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "reincarnated-as-a-dragon-hatchling": {
    year: 2026,
    studio: "Felix Film",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Our hero wakes up one day in a brand new world…but his new life doesn’t come with fighting skills or magic powers, or even arms and legs! He’s reborn as a helpless egg, stuck in an unfamiliar forest surrounded by terrifying, hungry beasts. But eggs hatch, hatchlings grow up, and humble beginnings...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "rent-a-girlfriend-season-5": {
    year: 2026,
    studio: "TMS Entertainment",
    rating: 7.2,
    popularity: 35,
    genres: ["Comedy", "Romance", "Slice of Life"],
    synopsis:
      "Season 5 — Kazuya Kinoshita continues his fake relationship with Chizuru Mizuhara.",
    backdropColor: "#3a1c2a",
    audio: "both",
  },
  "rezero-starting-life-in-another-world-season-4": {
    year: 2026,
    studio: "White Fox",
    rating: 8.6,
    popularity: 13,
    genres: ["Drama", "Fantasy", "Psychological", "Thriller"],
    synopsis:
      "Season 4 — Subaru Natsuki returns, facing new trials in his journey of death and rebirth.",
    backdropColor: "#3a1c3a",
    audio: "both",
  },
  "rich-girl-caretaker-im-secretly-the-caregiver-of-the-most-popular-girl-in-this-rich-kid-school": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Hinako Konohana is the perfect young lady—graceful, elegant, and flawless' or so everyone thinks. Behind closed doors, she's a total disaster who can't handle basic chores! When ordinary student Itsuki Tomonari becomes her caretaker, he's thrown into 24/7 damage control, maintaining her 'perfect'...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "saga-of-tanya-the-evil-ii": {
    year: 2026,
    studio: "NUT",
    rating: 8.0,
    popularity: 50,
    genres: ["Action", "Fantasy", "Isekai", "Military"],
    synopsis:
      "Tanya Degurechaff returns for more magical warfare.",
    backdropColor: "#3a3a1c",
    audio: "both",
  },
  "scum-of-the-brave": {
    year: 2026,
    studio: "OLM",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "By the mid-21st century, Tokyo's criminal underworld is ruled by Demon Lords—crime bosses who have undergone ether enhancement surgery, granting them terrifying superpowers. The only ones who can take them down are Heroes, bounty hunters who boost their own ether powers using the drug E3 (E-Three...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "skeleton-knight-in-another-world-ii": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Gaikotsu Kishi-sama, Tadaima Isekai e Odekakechuu.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "smoking-behind-the-supermarket-with-you": {
    year: 2026,
    studio: "Asahi Production",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The sole thing that gets the middle-aged Sasaki through his soul-sucking job is a cheerful smile from Yamada—the young woman who works at a nearby 24-hour supermarket he frequents. After every tiring day of getting berated by his boss, Sasaki stops by the store to have his spirit healed by his fa...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "solo-leveling": {
    year: 2024,
    studio: "A-1 Pictures",
    rating: 8.5,
    popularity: 6,
    genres: ["Action", "Adventure", "Fantasy"],
    synopsis:
      "In a world of hunters with supernatural abilities, Sung Jinwoo is the weakest E-rank hunter. After a deadly dungeon raid, he gains a mysterious System that lets him level up infinitely.",
    backdropColor: "#1c0d3a",
    audio: "both",
    featured: true,
  },
  "solo-leveling-season-2-arise-from-the-shadow": {
    year: 2025,
    studio: "A-1 Pictures",
    rating: 8.7,
    popularity: 7,
    genres: ["Action", "Adventure", "Fantasy"],
    synopsis:
      "Season 2 — Sung Jinwoo returns as the Shadow Monarch, commanding an army of the dead.",
    backdropColor: "#2a0d3a",
    audio: "both",
    franchise: "solo-leveling",
    season: 2,
  },
  "sparks-of-tomorrow": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "In an alternate version of the early 20th century where technological progress evolved along a different path shaped by steam power, Kyoto is blanketed in constant smoke.A boy, hardened by the loss of his brother, grows distrustful after their shared dream of an 'Age of Electricity' is cut short....",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "star-detective-precure": {
    year: 2026,
    studio: "Toei Animation",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Anna Akechi is a second-year junior high student living in Makoto Mirai Town. On her 14th birthday, she has a chance encounter with a fairy named Pochitan, and a magical pendant caused her to travel back in time from 2027 to 1999! In the Makoto Mirai Town 28 years in the past, Anna meets Mikuru K...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "tamons-b-side": {
    year: 2026,
    studio: "J.C.Staff",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Idol group F/ACE has recently risen in popularity all thanks to Tamon Fukuhara—its handsome, wild, and talented leader. Seventeen-year-old Utage Kinoshita is one of the vocal fans who greatly admires F/ACE. As her life revolves around worshiping Tamon, Utage works at a housecleaning company to ea...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-100-girlfriends-who-really-really-really-really-really-love-you-season-3": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Third season of Kimi no Koto ga Daidaidaidaidaisuki na 100-nin no Kanojo.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-beginning-after-the-end-season-2": {
    year: 2026,
    studio: "Studio A-Cat",
    rating: 8.0,
    popularity: 42,
    genres: ["Action", "Adventure", "Fantasy", "Isekai"],
    synopsis:
      "Season 2 — King Grey is reborn in a world of magic.",
    backdropColor: "#1c3a2a",
    audio: "both",
  },
  "the-case-book-of-arne": {
    year: 2026,
    studio: "SILVER LINK.",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Arne Neuntöte is a vampire detective who manipulates supernatural powers. Lynn Reinweiß is a nobleman's daughter who loves vampires. Their worlds should never have crossed, but they join hands to solve a bloody mystery. In the darkest of nights, Lynn finds herself in desperate need of help. Then ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-daily-life-of-a-part-time-torturer": {
    year: 2026,
    studio: "Diomedéa",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "This is a world where killing and torture are legalized. Sero, a part-time worker at a torture company, enjoys torturing people every day with his senior colleague, Siu. With the addition of new part-timers Mike and Hugh, fun torture life continues!The gap between the at-home, easy-going workplac...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-darwin-incident": {
    year: 2026,
    studio: "Bellnox Films",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The Animal Liberation Alliance, an eco-terrorist organization, rescues a pregnant chimpanzee from an animal testing lab—only for it to give birth to a half-human, half-chimpanzee 'humanzee' named Charlie! Fifteen years later, Charlie's human foster parents are finally ready to send him to a norma...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-demon-kings-daughter-is-too-kind": {
    year: 2026,
    studio: "EMT Squared",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Demon King Ahriman has a problem: his daughter, Doux, loves everyone! Consequently, Ahriman had to halt his invasion of the world in the worry that his daughter's behavior is not one befitting someone of her kind. She loves making friends, helping others, and bringing happiness to all creatures i...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-dukes-son-claims-he-wont-love-me-yet-showers-me-with-adoration": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "An arranged marriage. Two complete strangers. One adorable romance! When cheerful noblewoman Elsa is suddenly wed to the reserved duke-to-be Julius, neither expects their political marriage to spark something more. As awkward misunderstandings, sweet gestures, and growing feelings pile up, these ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-elusive-samurai-season-2": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Nige Jouzu no Wakagimi.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-forsaken-saintess-and-her-foodie-roadtrip-in-another-world": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Rin Takanashi, a caregiver in her thirties, was unceremoniously discarded as 'trash' despite being summoned as a saint.However, as a lover of the great outdoors and all things camping, she was blessed with a special skill, [Survival], as well as another unique skill! Thus, a riveting tale begins:...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-frontier-lord-begins-with-zero-subjects": {
    year: 2026,
    studio: "animation studio42",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Dias finally returns home after decades of war. He's hailed a hero and promptly rewarded with his own domain'which turns out to be little more than empty plains. Population: zero. Dias, who has only ever known battle, finds himself at a loss. How is he supposed to survive, let alone cultivate his...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-ghost-in-the-shell": {
    year: 2026,
    studio: "Science SARU",
    rating: 8.2,
    popularity: 44,
    genres: ["Action", "Cyberpunk", "Sci-Fi"],
    synopsis:
      "A new chapter in the Ghost in the Shell saga.",
    backdropColor: "#1c1c2a",
    audio: "both",
  },
  "the-insipid-princes-furtive-grab-for-the-throne": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "The Adrasia empire on the Vogel continent. There is a battle over the throne of such an empire that possesses powerful military and vast territory. With the successor undecided, the children of the emperor are vying to expand their power. However, there was one prince that everyone says will defi...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-klutzy-class-monitor-and-the-girl-with-the-short-skirt": {
    year: 2026,
    studio: "Zero-G",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Sakuradaimon takes his role on the school's Public Morals Committee very seriously. Every day, he dutifully checks students' appearances at the school gate—most often scolding Kohinata, a rule-breaking girl with bright hair and a short skirt.Though she finds his constant lecturing annoying, every...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-most-heretical-last-boss-queen-from-villainess-to-savior-season-2": {
    year: 2026,
    studio: "OLM",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Higeki no Genkyou to Naru Saikyou Gedou Last Boss Joou wa Tami no Tame ni Tsukushimasu..",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-ogres-bride": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "A Japanese-style ayakashi Cinderella story! The ayakashi and humans coexist in harmony. The ayakashi, having superior abilities and beautiful appearances, sometimes find their partner among human women, making them their 'bride.' The bride, in exchange for bringing prosperity, receives absolute l...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-ogres-bride-2": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "A Japanese-style ayakashi Cinderella story! The ayakashi and humans coexist in harmony. The ayakashi, having superior abilities and beautiful appearances, sometimes find their partner among human women, making them their 'bride.' The bride, in exchange for bringing prosperity, receives absolute l...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-outcast-season-6": {
    year: 2026,
    studio: "Qiyuan Yinghua",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Following the incident in Bi You Village, Zhang Chulan continues his investigation into Feng Baobao's origins, leading him to visit Lu Jin. From Lu Jin, Zhang Chulan obtains the list of the Thirty-Six Thieves and unexpectedly learns the reason for Jin Feng's abduction. To prevent Wu Gengsheng's c...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-ramparts-of-ice": {
    year: 2026,
    studio: "Studio KAI",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Inept at dealing with people, Koyuki Hikawa maintains a wall between herself and others. She spends her time in high school away from others, all alone. At least until she encounters Minato Amamiya who keeps closing the distance between them for some reason. The aloof Koyuki, the popular Miki, th...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-villainess-is-adored-by-the-prince-of-the-neighbor-kingdom": {
    year: 2026,
    studio: "Studio Deen",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "On the day before her downfall, Lady Tiararose Lapis Clementille recalls that she is in an otome game that she had once played in her former life. She used to adore the main love interest Prince Hartknights Lapis-Lazuli Lactomuth, but unfortunately, she was not reincarnated as the heroine, but ra...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-warrior-princess-and-the-barbaric-king": {
    year: 2026,
    studio: "Jumondou",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "'Just kill me!' These are the words of Serafina de Lavillant, the strongest female knight in the West. After being defeated in a war with the East, she has become a prisoner of the barbarians! What awaits the captive Serafina is a life of revenge, torture, and humiliation' or so she thought! What...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "the-worlds-strongest-rearguard": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Corporate slave Arihito Atobe's death in a freak bus accident marks the beginning of his new life as a kind of adventurer called a Seeker. Reborn into a fantasy world, he settles into a previously unknown job class called 'rearguard,' capable of providing his (all-female) party with critical atta...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "theatre-of-darkness-yamishibai-16": {
    year: 2026,
    studio: "ILCA",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Sixteenth season of Yami Shibai.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "there-was-a-cute-girl-in-the-heros-party-so-i-tried-confessing-to-her": {
    year: 2026,
    studio: "Gekkou",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Youki died in a traffic accident and was reborn in a fantasy world! However, instead of being the hero of legends, he ended up reincarnating into an overpowered demon. Having no desires to become the Demon Lord, he sits around in the Demon Lord's castle as a random low rank guardian. One day, the...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "though-i-am-an-inept-villainess": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Within the Kingdom of Ei's opulent inner court is the thriving Maiden Court, where the empress and the four imperial consorts are chosen from five prominent clans. Among them, one pristine consort-in-training, Reirin Kou, stands out as the perfect candidate for the future empress. Her virtue and ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "tis-time-for-torture-princess-season-2": {
    year: 2026,
    studio: "PINE JAM",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Himesama 'Goumon' no Jikan desu.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "to-your-eternity-season-3": {
    year: 2025,
    studio: "Drive",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Third season of Fumetsu no Anata e.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "tojima-wants-to-be-a-kamen-rider": {
    year: 2025,
    studio: "LIDENFILMS",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Tanzaburou Toujima has spent his entire life chasing a dream: to become Kamen Rider. Now, at 40, reality has nearly caught up with him, and he's on the verge of letting go of his childhood fantasy.That is, until he gets caught up in a crime wave led by the 'Fake Shocker' gang—turning his long-tim...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "tomb-raider-king": {
    year: 2026,
    studio: "Studio Eek",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Undercover behind enemy lines, Jooheon's newest plan to torment TKBM will involve taking them down from the inside! Stealing their relics and causing infighting is just the tip of the iceberg on what he'll do to make the group pay for their sins. But with the appearance of the Tower of Pride, Joo...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "trapped-in-a-dating-sim-the-world-of-otome-games-is-tough-for-mobs-2": {
    year: 2026,
    studio: "ENGI",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Otome Game Sekai wa Mob ni Kibishii Sekai desu.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "trigun-stargaze": {
    year: 2026,
    studio: "Orange",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Two and a half years have passed since the Lost July incident, a catastrophe that reduced an entire city to ruins and sent shockwaves across the world.On the desert planet of No Man's Land, Vash the Stampede, a gunslinger who swore never to take a life, faces his final confrontation with his brot...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "tune-in-to-the-midnight-heart": {
    year: 2026,
    studio: "Gekkou",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "When Arisu Yamabuki was all alone in bed at night, he was able to find solace in the voice of a radio host who went by 'Apollo.' However, one day, she simply stopped broadcasting without any explanation. Years then passed, and Arisu is now a second-year high-schooler. He makes it his mission to s...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "victoria-of-many-faces": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "In an age when spies act behind the scenes in every land, Chloe spends her days successfully carrying out even the most difficult missions due to her unparalleled disguise skills and martial arts abilities. However, after the betrayal of her boss, she suddenly disappears—as Chloe plans to redo he...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "wash-it-all-away": {
    year: 2026,
    studio: "Okuruto Noboru",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "With an endearing protagonist and luscious art, this seaside slice-of-life story offers tranquility in the chaos of the modern world. For two years, Wakana Kinme has run a laundry service in the seaside resort town of Atami, where she's built a fulfilling life making friends with the locals and v...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "welcome-to-demon-school-iruma-kun-season-4": {
    year: 2026,
    studio: "Bandai Namco Pictures",
    rating: 8.4,
    popularity: 36,
    genres: ["Comedy", "Fantasy", "School"],
    synopsis:
      "Season 4 — Iruma continues his unlikely life in the demon world.",
    backdropColor: "#3a2a1c",
    audio: "both",
  },
  "witch-hat-atelier": {
    year: 2026,
    studio: "BUG FILMS",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Coco, a humble dressmaker's daughter, has always been fascinated by magic and the witches who cast it, despite the strict precautions they take to hide their methods from the public. However, when Coco takes advantage of a golden chance to spy on the skilled witch Qifrey, she realizes that her fa...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "yoroi-shinden-samurai-troopers": {
    year: 2026,
    studio: "Sunrise",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Sequel to Yoroiden Samurai Troopers.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "yoroi-shinden-samurai-troopers-part-2": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second part of Yoroi Shin Den Samurai Troopers.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "you-and-i-are-polar-opposites": {
    year: 2026,
    studio: "Lapin Track",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Next to Miyu Suzuki, a trendy and bubbly high school girl, sits Yuusuke Tani, a quiet and frank boy. Their interactions are brief, limited to Suzuki's unprompted random questions and Tani's succinct answers. Yet, beneath these simple exchanges, feelings of love are quietly blossoming.Suzuki sees ...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "you-and-i-are-polar-opposites-season-2": {
    year: 2026,
    studio: "Lapin Track",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "Second season of Seihantai na Kimi to Boku.",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "you-cant-be-in-a-rom-com-with-your-childhood-friends": {
    year: 2026,
    studio: "Tezuka Productions",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "High schooler Eiyuu has a dilemma—his two childhood friends, Shio and Akari, have grown up to be almost too cute! Even though they don't seem to think much of it, he can't help but see them in a different light. If they ever realized how his feelings had changed, the embarrassment would be overwh...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
  "young-ladies-dont-play-fighting-games": {
    year: 2025,
    studio: "Studio Unknown",
    rating: 7.5,
    popularity: 60,
    genres: ["Anime"],
    synopsis:
      "A hot fighting game played at the girls' school!!Aya transferred into Kuromi Girls Academy a month ago with the goal of changing herself into a proper lady. After meeting the breathtaking Shirayuri, Aya is blown away by her elegance and posterity. Imagine her surprise when she finds Shirayuri aft...",
    backdropColor: "#1c2a3a",
    audio: "both",
  },
};

/** Build the fully-merged Anime list (memoised once at module load). */
function buildAnimeList(): Anime[] {
  return archive.map((a) => {
    const m = META[a.id] ?? {
      year: 2010,
      studio: "Studio Unknown",
      rating: 7.0,
      popularity: 99,
      genres: ["Anime"],
      synopsis: `${a.title} — streaming now on Ichidoki.`,
      backdropColor: "#1c1c1c",
    };
    return {
      id: a.id,
      title: a.title,
      identifier: a.identifier,
      episode_count: a.episode_count,
      episodes: a.episodes,
      year: m.year,
      studio: m.studio,
      rating: m.rating,
      popularity: m.popularity,
      genres: m.genres,
      synopsis: m.synopsis,
      featured: Boolean(m.featured),
      backdropColor: m.backdropColor,
      audio: m.audio ?? (a.episodes.some((e) => Boolean(e.dub_url)) ? "both" : "sub"),
      franchise: m.franchise,
      season: m.season,
    };
  });
}

const ANIME: Anime[] = buildAnimeList();
const BY_ID = new Map<string, Anime>(ANIME.map((a) => [a.id, a]));

export function getAllAnime(): Anime[] {
  return ANIME;
}

export function getAnimeById(id: string): Anime | undefined {
  return BY_ID.get(id);
}

/** Returns all seasons of the same franchise (including the current one),
 *  sorted by season number. Used by the Seasons tab on the details page. */
export function getSeasons(anime: Anime): Anime[] {
  if (!anime.franchise) return [anime];
  return ANIME.filter((a) => a.franchise === anime.franchise).sort(
    (a, b) => (a.season ?? 0) - (b.season ?? 0),
  );
}

/** Top rated — used on the home page "Top Rated" rail. */
export function getTopAnime(limit = 10): Anime[] {
  return [...ANIME].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

/** Featured anime for the hero carousel. */
export function getFeaturedAnime(): Anime[] {
  const featured = ANIME.filter((a) => a.featured);
  // Fallback: if none flagged, pick top 3 by rating.
  return featured.length ? featured : getTopAnime(3);
}

/** Recently added — we simulate this by reversing the source order. */
export function getRecentlyAdded(limit = 10): Anime[] {
  return [...ANIME].reverse().slice(0, limit);
}

/** Popular — sorted by editorial popularity rank. */
export function getPopularAnime(limit = 10): Anime[] {
  return [...ANIME].sort((a, b) => a.popularity - b.popularity).slice(0, limit);
}

/** All distinct genres across the catalog. */
export function getGenres(): string[] {
  const set = new Set<string>();
  ANIME.forEach((a) => a.genres.forEach((g) => set.add(g)));
  return Array.from(set).sort();
}

/** Search across title + genres + studio. */
export function searchAnime(query: string): Anime[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ANIME.filter((a) => {
    const hay = [a.title, a.studio, a.synopsis, ...a.genres]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

/**
 * The poster image used everywhere — Archive.org's thumbnail service.
 * Falls back gracefully if missing (handled by the <AnimeCard/>).
 */
export function posterUrl(anime: Pick<Anime, "id" | "identifier">): string {
  const official = (posterMap as Record<string, string>)[anime.id];
  if (official) return official;
  return `https://archive.org/services/img/${encodeURIComponent(anime.identifier)}`;
}

/** Stream URL routed through our own proxy.
 * - Local MKV files → /api/transcode (ffmpeg HEVC → H.264)
 * - Remote MKV files (archive.org, etc.) → /api/transcode?url=... (ffmpeg remux)
 * - Local MP4 files → served directly (browsers play H.264 natively)
 * - Remote MP4 / other → /api/stream (follows redirects, handles CORS)
 * - ZokoAnime / Megaplay embed URLs → return as-is (iframe player)
 *
 * Optional `audioIndex` picks which audio track to use for dual-audio MKVs.
 * 0 = first track (usually English dub), 1 = second track (usually Japanese).
 */
export function streamProxyUrl(
  episodeUrl: string,
  audioIndex?: number,
): string {
  // Local MKV files — need ffmpeg remuxing (browsers can't open MKV container)
  if (episodeUrl.startsWith("/") && episodeUrl.includes(".mkv")) {
    const base = `/api/transcode?path=${encodeURIComponent(episodeUrl)}`;
    return audioIndex != null ? `${base}&audio=${audioIndex}` : base;
  }
  // Remote MKV files — also need ffmpeg remuxing.
  if (/^https?:\/\//i.test(episodeUrl) && /\.mkv(\?|$)/i.test(episodeUrl)) {
    const base = `/api/transcode?url=${encodeURIComponent(episodeUrl)}`;
    return audioIndex != null ? `${base}&audio=${audioIndex}` : base;
  }
  // ZokoAnime / HLS embed URLs — these are iframe-embed pages that load
  // a JW Player with HLS streams. Return as-is (the player detects these
  // and uses an iframe instead of a <video> element).
  if (
    episodeUrl.includes("zokoanime.video") ||
    episodeUrl.includes("megaplay.buzz")
  ) {
    return episodeUrl;
  }
  // Local MP4 files — serve directly (browsers can play H.264 mp4 natively)
  if (episodeUrl.startsWith("/") && episodeUrl.includes(".mp4")) {
    return episodeUrl;
  }
  // Remote URLs — use the stream proxy (follows redirects, handles CORS)
  return `/api/stream?url=${encodeURIComponent(episodeUrl)}`;
}

/** Check if a URL is an embed URL (iframe player from a streaming site).
 *  These URLs should be loaded in an <iframe> rather than a <video> element. */
export function isEmbedUrl(url: string): boolean {
  return (
    url.includes("zokoanime.video") ||
    url.includes("megaplay.buzz") ||
    url.includes("dailymotion.com/embed/") ||
    url.includes("youtube.com/embed/") ||
    url.includes("player.vimeo.com/")
  );
}

/** Format a rating for the rating badge. */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** Format seconds as M:SS / H:MM:SS. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}
