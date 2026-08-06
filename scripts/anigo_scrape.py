#!/usr/bin/env python3
"""
Sequential version of the anigo.re scraper — processes one anime at a time
to avoid OOM. Caches HTML to disk so re-runs are fast.
"""
import json
import re
import sys
import time
from pathlib import Path

import requests

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
HEADERS = {"User-Agent": UA}

CACHE_DIR = Path("/tmp/anigo_cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def cache_path(url: str) -> Path:
    h = abs(hash(url)) % (10**12)
    return CACHE_DIR / f"{h}.html"


def fetch(url: str, timeout: int = 20) -> str:
    p = cache_path(url)
    if p.exists() and (time.time() - p.stat().st_mtime) < 6 * 3600:
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
TITLE_RE = re.compile(r"<title>([^<]+)</title>")
EP_COUNT_RE = re.compile(r"<b>Episodes:</b>\s*(\d+)")
STATUS_RE = re.compile(r"<b>Status:</b>\s*([^<]+)")
SYNOPSIS_RE = re.compile(
    r'<div class="entry-content"[^>]*itemprop="description"><p>(.+?)</p></div></div>',
    re.DOTALL,
)
GENRE_RE = re.compile(r'<a href="https://anigo\.re/genre/[^"]+" rel="tag">([^<]+)</a>')
STUDIO_RE = re.compile(r'<b>Studio:</b>\s*<a[^>]*>([^<]+)</a>')
YEAR_RE = re.compile(r'<b>Released:</b>\s*[A-Za-z]+\s+\d+,?\s*(\d{4})')


def parse_anime_page(html: str) -> dict:
    out = {"ep_count": 0, "episodes": [], "status": "", "genres": [], "studio": "",
           "synopsis": "", "year": 0}
    m = EP_COUNT_RE.search(html)
    if m:
        out["ep_count"] = int(m.group(1))
    m = STATUS_RE.search(html)
    if m:
        out["status"] = m.group(1).strip()
    eps = []
    seen = set()
    for m in EPISODE_RE.finditer(html):
        url = m.group(1)
        num = int(m.group(2))
        if num in seen:
            continue
        seen.add(num)
        eps.append((num, url))
    eps.sort(key=lambda x: x[0])
    out["episodes"] = eps
    out["genres"] = list(set(GENRE_RE.findall(html)))
    m = STUDIO_RE.search(html)
    if m:
        out["studio"] = m.group(1).strip()
    m = SYNOPSIS_RE.search(html)
    if m:
        s = re.sub(r"<[^>]+>", "", m.group(1))
        s = re.sub(r"&[#0-9a-zA-Z]+;", "'", s)
        out["synopsis"] = s.strip()
    m = YEAR_RE.search(html)
    if m:
        try:
            out["year"] = int(m.group(1))
        except ValueError:
            pass
    return out


def parse_episode_page(html: str) -> str | None:
    for m in EMBED_RE.finditer(html):
        return m.group(1)
    return None


TWO_NUM_RE = re.compile(
    r"https://(?:megaplay\.buzz/stream/(?:ani|mal)|zokoanime\.video/stream/mal)/(\d+)/(\d+)/(sub|dub)"
)
ONE_NUM_RE = re.compile(
    r"https://megaplay\.buzz/stream/(s-\d+)/(\d+)/(sub|dub)"
)
PREFIX_RE = re.compile(r"/(mal|ani|s-\d+)/")


def parse_embed(url: str):
    m = TWO_NUM_RE.search(url)
    if m:
        pm = PREFIX_RE.search(url)
        prefix = pm.group(1) if pm else "?"
        return (prefix, int(m.group(1)), int(m.group(2)), m.group(3))
    m = ONE_NUM_RE.search(url)
    if m:
        return (m.group(1), None, int(m.group(2)), m.group(3))
    return None


def fetch_anime_list() -> list[str]:
    html = fetch("https://anigo.re/anime/list-mode/")
    slugs = []
    seen = set()
    for m in re.finditer(r'href="https://anigo\.re/anime/([^/"]+)/"', html):
        slug = m.group(1)
        if slug in ("list-mode", "feed", "page"):
            continue
        if slug.startswith("page/"):
            continue
        if slug in seen:
            continue
        seen.add(slug)
        slugs.append(slug)
    return slugs


def process_anime(slug: str) -> dict | None:
    main_url = f"https://anigo.re/anime/{slug}/"
    html = fetch(main_url)
    if not html:
        return None
    info = parse_anime_page(html)
    if not info["episodes"]:
        return None
    title_match = TITLE_RE.search(html)
    title = ""
    if title_match:
        t = title_match.group(1)
        m = re.match(r"Watch\s+(.+?)\s+All Episode", t)
        if m:
            title = m.group(1).strip()
        else:
            m = re.match(r"Watch\s+(.+?)\s+(?:Episode|English)", t)
            if m:
                title = m.group(1).strip()
            else:
                title = t.replace(" - AniGo", "").strip()
    is_dub = slug.endswith("-dub") or "-dub-" in slug
    if title.endswith(" (Dub)"):
        title = title[:-6].strip()
    first_ep_url = info["episodes"][0][1]
    ep_html = fetch(first_ep_url)
    if not ep_html:
        return None
    embed_url = parse_episode_page(ep_html)
    if not embed_url:
        return None
    parsed = parse_embed(embed_url)
    if not parsed:
        return None
    prefix, mal_id, _, audio = parsed
    title = re.sub(r"&[#0-9a-zA-Z]+;", "'", title)
    out = {
        "slug": slug,
        "title": title,
        "ep_count": info["ep_count"],
        "ep_count_actual": len(info["episodes"]),
        "episodes": info["episodes"],
        "embed_prefix": prefix,
        "mal_id": mal_id,
        "audio": audio,
        "is_dub": is_dub,
        "status": info["status"],
        "genres": info["genres"],
        "studio": info["studio"],
        "synopsis": info["synopsis"],
        "year": info["year"],
    }
    # For /s-N/ patterns, scrape ALL episode embeds sequentially (memory-safe)
    if prefix not in ("ani", "mal"):
        embeds = {}
        for num, url in info["episodes"]:
            h = fetch(url)
            if h:
                e = parse_episode_page(h)
                if e:
                    embeds[num] = e
        out["embeds"] = embeds
    return out


def main():
    # Allow resume — load existing data
    out_path = Path("/home/z/my-project/scripts/anigo_data.json")
    existing = {}
    if out_path.exists():
        try:
            for r in json.loads(out_path.read_text()):
                existing[r["slug"]] = r
        except Exception:
            pass

    print("=== Fetching anime list ===", flush=True)
    slugs = fetch_anime_list()
    print(f"Found {len(slugs)} anime slugs", flush=True)

    print("\n=== Processing each anime (sequential) ===", flush=True)
    results = []
    for i, slug in enumerate(slugs, 1):
        # Use cached result if exists
        if slug in existing:
            results.append(existing[slug])
            continue
        try:
            data = process_anime(slug)
        except Exception as e:
            sys.stderr.write(f"ERR {slug}: {e}\n")
            data = None
        if data:
            results.append(data)
            print(f"[{i}/{len(slugs)}] OK  {slug} ({data['ep_count_actual']} eps, prefix={data['embed_prefix']})", flush=True)
        else:
            print(f"[{i}/{len(slugs)}] SKIP {slug}", flush=True)
        # Save incrementally every 10 anime
        if i % 10 == 0:
            out_path.write_text(json.dumps(results, indent=2), encoding="utf-8")

    # Save final
    out_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\n=== Saved {len(results)} anime to {out_path} ===", flush=True)
    total_eps = sum(r["ep_count_actual"] for r in results)
    print(f"Total episodes across all anime: {total_eps}", flush=True)


if __name__ == "__main__":
    main()
