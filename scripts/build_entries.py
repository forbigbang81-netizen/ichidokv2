#!/usr/bin/env python3
"""
Build anime-archive.json entries from scraped anigo.re data.
- Pairs sub + dub versions where applicable
- For /mal/ and /ani/ patterns: constructs zokoanime URLs (sub + dub always)
- For /s-N/ patterns: uses exact megaplay URLs
- Also generates dub URLs for all anime that use /mal/ or /ani/ pattern (zokoanime supports /dub)
"""
import json
import re
import sys
from pathlib import Path

DATA_PATH = Path("/home/z/my-project/scripts/anigo_data.json")
OUTPUT_PATH = Path("/home/z/my-project/scripts/new_entries.json")


def slug_to_id(slug: str) -> str:
    s = slug
    if s.endswith("-dub"):
        s = s[:-4]
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def slug_to_title(slug: str) -> str:
    s = slug_to_id(slug)
    return " ".join(w.capitalize() for w in s.split("-"))


def build_zoko_url(mal_id: int, ep: int, audio: str) -> str:
    return f"https://zokoanime.video/stream/mal/{mal_id}/{ep}/{audio}?color=35d5bf"


def process_entry(entry: dict) -> dict | None:
    """Build an archive entry from a scraped anime."""
    slug = entry["slug"]
    mal_id = entry.get("mal_id")
    prefix = entry["embed_prefix"]
    audio = entry["audio"]  # "sub" or "dub" (which version this anigo page is)
    is_dub = entry["is_dub"]
    ep_count = entry["ep_count_actual"]
    title = entry["title"] or slug_to_title(slug)

    episodes = []
    if prefix in ("ani", "mal"):
        # Constant MAL ID — construct zokoanime URLs for both sub AND dub
        for ep_num in range(1, ep_count + 1):
            ep = {
                "name": f"Episode {ep_num}",
                "ep_num": ep_num,
                "url": build_zoko_url(mal_id, ep_num, "sub"),
                "dub_url": build_zoko_url(mal_id, ep_num, "dub"),
            }
            episodes.append(ep)
        audio_mode = "both"
    else:
        # /s-N/ pattern — use exact megaplay URLs from embeds
        embeds = entry.get("embeds", {})
        for ep_num in sorted(embeds.keys(), key=int):
            sub_url = embeds[ep_num]
            # Construct dub URL by replacing /sub with /dub (megaplay supports this)
            dub_url = sub_url.replace("/sub", "/dub")
            ep = {
                "name": f"Episode {ep_num}",
                "ep_num": int(ep_num),
                "url": sub_url,
                "dub_url": dub_url,
            }
            episodes.append(ep)
        audio_mode = "both"

    if not episodes:
        return None

    return {
        "slug": slug,
        "id": slug_to_id(slug),
        "title": title,
        "identifier": f"zokoanime-{slug_to_id(slug)}",
        "episode_count": len(episodes),
        "episodes": episodes,
        "audio_mode": audio_mode,
        "mal_id": mal_id,
        "prefix": prefix,
        "status": entry.get("status", ""),
        "genres": entry.get("genres", []),
        "studio": entry.get("studio", ""),
        "synopsis": entry.get("synopsis", ""),
        "year": entry.get("year", 0),
        "is_dub": is_dub,
    }


def pair_sub_dub(entries: list[dict]) -> list[dict]:
    """For anime with both sub and dub anigo pages, only keep the sub version
    (we already have dub URLs in each episode)."""
    seen = set()
    paired = []
    for e in entries:
        if e["id"] in seen:
            continue
        seen.add(e["id"])
        paired.append(e)
    return paired


def main():
    data = json.loads(DATA_PATH.read_text())
    print(f"Loaded {len(data)} scraped anime")

    all_entries = []
    for entry in data:
        e = process_entry(entry)
        if e:
            all_entries.append(e)
    print(f"Processed {len(all_entries)} entries (before pairing)")

    # Pair sub+dub (just dedupe by id, since we already have both URLs in each entry)
    paired = pair_sub_dub(all_entries)
    print(f"After pairing: {len(paired)} unique anime")

    # Save
    OUTPUT_PATH.write_text(json.dumps(paired, indent=2), encoding="utf-8")
    print(f"\nSaved {len(paired)} entries to {OUTPUT_PATH}")
    total_eps = sum(e["episode_count"] for e in paired)
    print(f"Total episodes: {total_eps}")

    # Top 20 by episode count
    print("\n=== Top 20 by episode count ===")
    for e in sorted(paired, key=lambda x: -x["episode_count"])[:20]:
        print(f"  {e['episode_count']:4d} eps  {e['id']}  ({e['title']})")


if __name__ == "__main__":
    main()
