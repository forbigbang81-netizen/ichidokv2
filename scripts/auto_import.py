#!/usr/bin/env python3
"""
Auto-import script for airing anime.
Checks anigo.re for new episodes of anime already in our archive, and updates
the archive with new episodes when found.

Designed to be run periodically (e.g. daily via cron/GitHub Actions).

Strategy:
1. Load existing anime-archive.json
2. For each anime that uses zokoanime/megaplay embeds:
   a. Fetch the corresponding anigo.re anime page (by slug = anime_id)
   b. Get the current episode count from anigo.re
   c. If anigo has more episodes than us, fetch the new episode embed URLs
      and add them to the archive.
3. Save the updated archive.
4. If any changes were made, commit and push (when run in CI).

Usage:
  python3 scripts/auto_import.py [--dry-run]
"""
import json
import re
import sys
import os
import time
import subprocess
from pathlib import Path

import requests

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
HEADERS = {"User-Agent": UA}

ARCHIVE_PATH = Path("/home/z/my-project/src/data/anime-archive.json")
CACHE_DIR = Path("/tmp/anigo_cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def fetch(url: str, timeout: int = 20) -> str:
    p = CACHE_DIR / f"{abs(hash(url)) % (10**12)}.html"
    if p.exists() and (time.time() - p.stat().st_mtime) < 3 * 3600:
        return p.read_text(encoding="utf-8", errors="replace")
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        p.write_text(r.text, encoding="utf-8")
        return r.text
    except Exception as e:
        sys.stderr.write(f"FAIL {url}: {e}\n")
        return ""


EPISODE_RE = re.compile(
    r'<a [^>]*href="(https://anigo\.re/[^"]*?)"[^>]*class="item ep-item "[^>]*data-number="(\d+)"'
)
EMBED_RE = re.compile(
    r'(?:data-litespeed-src|src)="(https://(?:megaplay\.buzz|zokoanime\.video)[^"]*)"'
)
EP_COUNT_RE = re.compile(r"<b>Episodes:</b>\s*(\d+)")


def get_anigo_anime_page(slug: str) -> dict:
    """Fetch anigo.re anime page and extract episode list + count.
    Returns {'count': int, 'episodes': [(num, url), ...]} or empty dict."""
    url = f"https://anigo.re/anime/{slug}/"
    html = fetch(url)
    if not html:
        return {"count": 0, "episodes": []}
    eps = []
    seen = set()
    for m in EPISODE_RE.finditer(html):
        u = m.group(1)
        n = int(m.group(2))
        if n in seen:
            continue
        seen.add(n)
        eps.append((n, u))
    eps.sort(key=lambda x: x[0])
    count_match = EP_COUNT_RE.search(html)
    count = int(count_match.group(1)) if count_match else len(eps)
    return {"count": count, "episodes": eps}


def get_embed_url(episode_url: str) -> str | None:
    """Get the embed URL from an anigo.re episode page.
    Returns None if the episode is 'COMING SOON' or has no embed."""
    html = fetch(episode_url)
    if not html:
        return None
    # Check for "COMING SOON" — episode listed but not yet available
    if "COMING SOON" in html.upper():
        return None
    # Try to find a direct embed URL
    for m in EMBED_RE.finditer(html):
        return m.group(1)
    # Some episode pages use base64-encoded data-hash attributes
    # Try to decode them
    for m in re.finditer(r'data-hash="([^"]+)"', html):
        try:
            import base64
            decoded = base64.b64decode(m.group(1)).decode("utf-8", errors="replace")
            # Look for embed URL in the decoded HTML
            for em in EMBED_RE.finditer(decoded):
                return em.group(1)
        except Exception:
            continue
    return None


def verify_embed_url(url: str) -> bool:
    """Verify that a megaplay /s-N/ URL actually has a working video.
    For zokoanime /mal/ URLs and megaplay /ani/ URLs, trust anigo.re's episode list."""
    # Verify megaplay /s-N/ and /ani/ URLs (which return "Error" for non-existent eps)
    if "megaplay.buzz/stream/s-" in url or "megaplay.buzz/stream/ani/" in url:
        try:
            r = requests.get(url, headers=HEADERS, timeout=10, allow_redirects=True)
            if r.status_code != 200:
                return False
            if "Error - MegaPlay" in r.text:
                return False
        except Exception:
            return False
    # For zokoanime /mal/ URLs, trust anigo.re's episode list
    return True


TWO_NUM_RE = re.compile(
    r"https://(?:megaplay\.buzz/stream/(?:ani|mal)|zokoanime\.video/stream/mal)/(\d+)/(\d+)/(sub|dub)"
)
ONE_NUM_RE = re.compile(
    r"https://megaplay\.buzz/stream/(s-\d+)/(\d+)/(sub|dub)"
)


def parse_embed(url: str):
    m = TWO_NUM_RE.search(url)
    if m:
        return ("mal", int(m.group(1)), int(m.group(2)), m.group(3))
    m = ONE_NUM_RE.search(url)
    if m:
        return (m.group(1), None, int(m.group(2)), m.group(3))
    return None


def main():
    dry_run = "--dry-run" in sys.argv
    
    archive = json.loads(ARCHIVE_PATH.read_text())
    print(f"Loaded {len(archive)} anime from archive")
    
    changes = []
    
    for anime in archive:
        anime_id = anime["id"]
        title = anime["title"]
        ep_count = anime["episode_count"]
        episodes = anime["episodes"]
        if not episodes:
            continue
        
        first_ep = episodes[0]
        first_url = first_ep.get("url", "")
        
        # Check if this is a zokoanime/megaplay anime
        if "zokoanime.video" not in first_url and "megaplay.buzz" not in first_url:
            continue  # Skip archive.org anime
        
        # Parse the embed URL to determine pattern
        parsed = parse_embed(first_url)
        if not parsed:
            continue
        
        prefix, mal_id, _, audio = parsed
        
        # Always check anigo.re for the actual current episode count
        anigo_info = get_anigo_anime_page(anime_id)
        if not anigo_info["episodes"]:
            continue  # Anime not on anigo.re or page failed
        
        anigo_eps = anigo_info["episodes"]
        our_max_ep = max(ep["ep_num"] for ep in episodes)
        
        # Find episodes we don't have yet
        existing_eps = {ep["ep_num"] for ep in episodes}
        new_anigo_eps = [(n, u) for n, u in anigo_eps if n not in existing_eps]
        # Limit to 10 new episodes per run to avoid timeouts
        new_anigo_eps = new_anigo_eps[:10]
        if not new_anigo_eps:
            continue  # No new episodes
        
        print(f"CHECKING: {title} (id={anime_id}) — anigo has {len(anigo_eps)}, we have {our_max_ep}, checking {len(new_anigo_eps)} new ep(s)")
        
        # For each new episode, fetch the embed URL
        new_episodes_added = 0
        for n, ep_url in new_anigo_eps:
            embed = get_embed_url(ep_url)
            if not embed:
                # Episode is COMING SOON or no embed available — skip
                continue
            
            new_parsed = parse_embed(embed)
            if not new_parsed:
                continue
            
            new_prefix, new_mal_id, _, new_audio = new_parsed
            
            # Use the exact embed URL from anigo.re
            # For /mal/ and /ani/ patterns, convert to zokoanime URL (works for most anime)
            # For /s-N/ patterns, use the exact megaplay URL
            if new_prefix in ("mal", "ani") and new_mal_id:
                url_sub = f"https://zokoanime.video/stream/mal/{new_mal_id}/{n}/sub?color=35d5bf"
                url_dub = f"https://zokoanime.video/stream/mal/{new_mal_id}/{n}/dub?color=35d5bf"
            else:
                url_sub = embed
                url_dub = embed.replace("/sub", "/dub")
            
            # Verify the URL actually works before adding
            if not verify_embed_url(url_sub):
                print(f"  - Ep {n}: SKIPPED (URL not valid: {url_sub})")
                continue
            
            episodes.append({
                "name": f"Episode {n}",
                "ep_num": n,
                "url": url_sub,
                "dub_url": url_dub,
            })
            new_episodes_added += 1
            print(f"  + Ep {n}: {url_sub}")
        
        if new_episodes_added > 0:
            episodes.sort(key=lambda e: e["ep_num"])
            anime["episode_count"] = len(episodes)
            changes.append(f"Added {new_episodes_added} new ep(s) to {anime_id} (now {len(episodes)} total)")
    
    if not changes:
        print("No new episodes found.")
        return
    
    print(f"\n=== {len(changes)} changes ===")
    for c in changes:
        print(f"  - {c}")
    
    if dry_run:
        print("\n(dry-run mode — not saving)")
        return
    
    # Save
    ARCHIVE_PATH.write_text(json.dumps(archive, indent=2), encoding="utf-8")
    print(f"\nSaved updated archive to {ARCHIVE_PATH}")
    
    # Commit and push (for CI)
    if os.environ.get("CI"):
        try:
            subprocess.run(["git", "add", str(ARCHIVE_PATH)], check=True)
            subprocess.run(
                ["git", "commit", "-m", f"auto-import: {len(changes)} updates\n\n{chr(10).join(changes)}"],
                check=True,
            )
            subprocess.run(["git", "push"], check=True)
            print("Committed and pushed changes")
        except subprocess.CalledProcessError as e:
            sys.stderr.write(f"Git error: {e}\n")


if __name__ == "__main__":
    main()

# Add a verification function
