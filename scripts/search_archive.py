#!/usr/bin/env python3
"""Efficiently search Archive.org for complete anime series."""
import urllib.request, json, re, time, sys

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

# Step 1: Search for anime items (fast — just metadata)
print("=== Step 1: Searching Archive.org ===", flush=True)
QUERIES = [
    "anime 1080p", "anime dual audio", "anime english dub",
    "anime eng dub", "kayoanime", "anime bluray",
    "anime complete", "death note anime", "attack on titan anime",
    "naruto anime", "one punch man", "cowboy bebop anime",
    "black clover anime", "btooom anime", "beastars anime",
    "danmachi anime", "welcome to the nhk anime", "bobobo anime",
    "dr stone anime", "golden kamuy anime", "overlord anime",
    "prison school anime", "rwby", "zoids anime",
    "sonic x anime", "how not to summon anime",
]

all_items = {}
for q in QUERIES:
    url = f"https://archive.org/advancedsearch.php?q={q.replace(' ', '+')}&fl[]=identifier&fl[]=title&fl[]=downloads&sort[]=downloads+desc&rows=50&output=json"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
        for doc in data.get("response", {}).get("docs", []):
            ident = doc.get("identifier", "")
            if ident and ident not in all_items:
                all_items[ident] = {"identifier": ident, "title": doc.get("title", ""), "downloads": doc.get("downloads", 0)}
    except:
        pass
    time.sleep(0.3)

print(f"Found {len(all_items)} unique items.", flush=True)

# Step 2: Check each item for video files (batch with short timeouts)
print("=== Step 2: Checking for video files ===", flush=True)
import urllib.parse
results = []
items_list = sorted(all_items.values(), key=lambda x: -x["downloads"])[:150]

for i, item in enumerate(items_list):
    if (i+1) % 10 == 0:
        print(f"  [{i+1}/{len(items_list)}] — {len(results)} anime found", flush=True)
    ident = item["identifier"]
    try:
        api_url = f"https://archive.org/metadata/{ident}/files"
        req = urllib.request.Request(api_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=8) as resp:
            fdata = json.loads(resp.read().decode())
        files = fdata.get("result", [])
        
        mp4_files = [f for f in files 
                     if f.get("name", "").lower().endswith(".mp4") 
                     and not f.get("name", "").endswith(".ia.mp4")
                     and int(f.get("size", 0)) > 5_000_000]
        
        if len(mp4_files) >= 3:
            episodes = []
            for f in mp4_files:
                name = f.get("name", "")
                m = re.search(r'[Ee](\d+)', name) or re.search(r'Episode\s+(\d+)', name, re.I) or re.search(r'(\d+)', name.split('/')[-1])
                ep_num = int(m.group(1)) if m else 0
                episodes.append({
                    "name": name,
                    "size_mb": int(f.get("size", 0)) // (1024*1024),
                    "ep_num": ep_num,
                    "url": f"https://archive.org/download/{ident}/{urllib.parse.quote(name)}",
                })
            episodes.sort(key=lambda e: e["ep_num"] if e["ep_num"] > 0 else 999)
            
            results.append({
                "identifier": ident,
                "title": item["title"],
                "episode_count": len(episodes),
                "episodes": episodes,
            })
            print(f"  ✓ {item['title'][:50]} — {len(episodes)} eps", flush=True)
    except:
        pass
    time.sleep(0.1)

print(f"\n=== {len(results)} anime found ===", flush=True)
for r in sorted(results, key=lambda x: -x["episode_count"]):
    print(f"{r['title'][:60]:60s} | {r['episode_count']:3d} eps | {r['identifier']}", flush=True)

with open('/home/z/my-project/src/data/anime-archive.json', 'w') as f:
    json.dump(results, f, indent=2)
print(f"\nSaved to src/data/anime-archive.json", flush=True)
