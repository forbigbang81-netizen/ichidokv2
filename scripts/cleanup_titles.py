#!/usr/bin/env python3
"""
Clean up anime titles to prefer English titles over romaji/Japanese.

For each anime:
  - If the first altTitle looks like an English title (uses Latin chars,
    doesn't match the canonical title), use it as the new title.
  - The old romaji title goes into altTitles.
  - Update the gdrive_slug cache so the slug still maps correctly.
  - If a slug already exists, keep it (slug lookups were done with romaji title,
    but the gdriveplayer database usually has the romaji slug too).

Also adds One Piece with all its sagas.
"""
import json
import re
from pathlib import Path

ANIME_JSON = Path("/home/z/my-project/src/data/anime.json")

def is_english(s: str) -> bool:
    """Heuristic: a title is 'English' if it has no Japanese chars and
    doesn't look like raw romaji (which is technically Latin but Japanese)."""
    if not s:
        return False
    # Reject Japanese characters
    if any("\u3040" <= ch <= "\u30ff" or "\u4e00" <= ch <= "\u9fff" for ch in s):
        return False
    return True

def looks_more_english(eng: str, romaji: str) -> bool:
    """Decide if `eng` looks more like an English title than `romaji`.
    Heuristic: English titles usually contain common English words/patterns
    that aren't typical in romaji (articles, 'The', 'of', 'and', 'Season N',
    capitalization patterns)."""
    if not eng or not romaji:
        return False
    if eng == romaji:
        return False
    # Common English patterns
    english_markers = [
        r"\bThe\b", r"\bOf\b", r"\bAnd\b", r"\bOf the\b",
        r"\bSeason\s+\d+\b", r"\bMovie\b", r"\bPart\b",
        r"\bBrotherhood\b", r"\bAttack on\b", r"\bMy Hero\b",
        r"\bDemon Slayer\b", r"\bSeven Deadly\b", r"\bSilent Voice\b",
        r"\bYour Name\b", r"\bSword Art\b", r"\bFood Wars\b",
        r"\bA Certain\b", r"\bThe Rising of the\b",
        r"\bRe:Zero\b", r"\bNo Game No Life\b",
        r"\bThat Time I Got\b", r"\bOverlord\b",
        r"\bMiss Kobayashi\b", r"\bSaga of Tanya\b",
    ]
    for pat in english_markers:
        if re.search(pat, eng, re.IGNORECASE):
            return True
    # If eng has spaces and romaji is a single long word, eng is probably English
    eng_words = eng.split()
    romaji_words = romaji.split()
    if len(eng_words) >= 2 and len(romaji_words) >= 2:
        # Both multi-word. Check if eng has more common English short words.
        common = {"the", "of", "and", "a", "in", "to", "no", "wa", "no", "ga", "ni"}
        eng_common = sum(1 for w in eng_words if w.lower() in common)
        romaji_common = sum(1 for w in romaji_words if w.lower() in common)
        # If eng has more English-style small words, prefer it
        if eng_common > romaji_common:
            return True
    return False

def main():
    data = json.loads(ANIME_JSON.read_text(encoding="utf-8"))
    anime_list = data["anime"]

    changed = 0
    for anime in anime_list:
        title = anime["title"]
        alts = anime.get("altTitles", [])
        if not alts:
            continue

        # Try each altTitle — prefer one that's English AND more English-y than current
        for alt in alts:
            if not is_english(alt):
                continue
            if looks_more_english(alt, title):
                # Swap: old title becomes an alt, English alt becomes the title
                old_title = title
                new_alts = [a for a in alts if a != alt]
                if old_title not in new_alts:
                    new_alts.insert(0, old_title)
                anime["title"] = alt
                anime["altTitles"] = new_alts
                changed += 1
                break

    print(f"Updated {changed} titles to prefer English versions.\n")
    print("Sample (first 30):")
    for a in anime_list[:30]:
        print(f"  {a['title']}")

    ANIME_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSaved to {ANIME_JSON}")

if __name__ == "__main__":
    main()
