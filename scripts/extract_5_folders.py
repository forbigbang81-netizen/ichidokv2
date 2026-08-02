#!/usr/bin/env python3
"""Recursively traverse Drive folders to find all video files."""
import urllib.request, re, json, time

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

ROOT_FOLDERS = [
    ("1BGgiPD3gGefv_D0g0PZ0Q6ogAaLTnaZY", "The God of Highschool"),
    ("1YtM8OGNjpUw6Nizmy75biTDcd-7HAKcl", "That Time I Got Reincarnated as a Slime"),
    ("1pt2c1yjz99E-14WOkxh-NLJ80rTUfEXK", "Jujutsu Kaisen"),
    ("1WJsrt0WiCV0sC19xIJSidQzkMJQtQHDN", "Tokyo Ghoul"),
    ("1KFscT64yCWrXKF32RTWzb5TZTze4FQBb", "One Punch Man"),
]

def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")

def parse_folder(html):
    m = re.search(r"AF_initDataCallback\(\{key: 'ds:4',[^}]+data:(.+?), sideChannel", html, re.DOTALL)
    if not m: return [], []
    data_str = m.group(1)

    videos = []
    subfolders = []

    # Video files (AOT-style): [[null,"FILE_ID"],null,"RESOURCE_KEY",null,"video/mp4"
    for m in re.finditer(r'\[\[null,"([a-zA-Z0-9_]{25,44})"\],null,"([a-zA-Z0-9_]+)",null,"(video/[^"]+)"', data_str):
        videos.append((m.group(1), m.group(2)))

    # Subfolders: [null,"FOLDER_ID"] ... "application/vnd.google-apps.folder"
    # Use [\s\S] instead of [^] to avoid regex issues
    for m in re.finditer(r'\[null,"([a-zA-Z0-9_]{25,44})"\][\s\S]{0,400}?"application/vnd\.google-apps\.folder"', data_str):
        fid = m.group(1)
        window = m.group(0)
        name_match = re.search(r'\[\[\[\["([^"]+)",null,1\]\]\]', window)
        name = name_match.group(1) if name_match else "Unknown"
        subfolders.append((fid, "", name))

    # Deduplicate
    seen = set()
    videos = [(v, r) for v, r in videos if not (v in seen or seen.add(v))]
    seen = set()
    subfolders = [(f, r, n) for f, r, n in subfolders if not (f in seen or seen.add(f))]

    return videos, subfolders

def get_file_name(file_id, resource_key=""):
    url = f"https://drive.google.com/file/d/{file_id}/view"
    if resource_key:
        url += f"?resourcekey={resource_key}"
    try:
        html = fetch(url)
        m = re.search(r"<title>([^<]+)</title>", html)
        if m:
            title = m.group(1)
            for suffix in [" - Google 雲端硬碟", " - Google Drive"]:
                title = title.replace(suffix, "")
            return title.strip()
    except: pass
    return None

all_anime = []
for root_id, root_name in ROOT_FOLDERS:
    print(f"\n{'='*60}", flush=True)
    print(f"Anime: {root_name}", flush=True)

    root_url = f"https://drive.google.com/drive/folders/{root_id}"
    try:
        html = fetch(root_url)
    except Exception as e:
        print(f"  Error: {e}", flush=True)
        continue

    videos, subfolders = parse_folder(html)
    print(f"  Direct videos: {len(videos)}, Subfolders: {len(subfolders)}", flush=True)

    anime_data = {"anime_name": root_name, "folder_id": root_id, "seasons": []}

    if videos:
        season_data = {"season_name": "Season 1", "episodes": []}
        for fid, rkey in videos:
            name = get_file_name(fid, rkey)
            season_data["episodes"].append({"file_id": fid, "resource_key": rkey, "name": name or "Unknown"})
            print(f"    {name}", flush=True)
        anime_data["seasons"].append(season_data)

    for sfid, srkey, sname in subfolders:
        print(f"\n  Subfolder: {sname} ({sfid})", flush=True)
        time.sleep(0.5)
        sub_url = f"https://drive.google.com/drive/folders/{sfid}"
        try:
            sub_html = fetch(sub_url)
        except Exception as e:
            print(f"    Error: {e}", flush=True)
            continue

        sub_videos, sub_subfolders = parse_folder(sub_html)
        print(f"    Videos: {len(sub_videos)}, Subfolders: {len(sub_subfolders)}", flush=True)

        season_data = {"season_name": sname, "episodes": []}
        for fid, rkey in sub_videos:
            name = get_file_name(fid, rkey)
            season_data["episodes"].append({"file_id": fid, "resource_key": rkey, "name": name or "Unknown"})
            print(f"      {name}", flush=True)
        anime_data["seasons"].append(season_data)

        # Recurse one more level for nested subfolders
        for ssfid, ssrkey, ssname in sub_subfolders:
            print(f"\n    Nested: {ssname} ({ssfid})", flush=True)
            time.sleep(0.5)
            ss_url = f"https://drive.google.com/drive/folders/{ssfid}"
            try:
                ss_html = fetch(ss_url)
            except: continue
            ss_videos, _ = parse_folder(ss_html)
            nested = {"season_name": f"{sname} - {ssname}", "episodes": []}
            for fid, rkey in ss_videos:
                name = get_file_name(fid, rkey)
                nested["episodes"].append({"file_id": fid, "resource_key": rkey, "name": name or "Unknown"})
                print(f"        {name}", flush=True)
            if nested["episodes"]:
                anime_data["seasons"].append(nested)

    all_anime.append(anime_data)

with open('/tmp/all_gdrive_anime.json', 'w') as f:
    json.dump(all_anime, f, indent=2)

print(f"\n\n=== FINAL SUMMARY ===")
for anime in all_anime:
    total = sum(len(s["episodes"]) for s in anime["seasons"])
    print(f"\n{anime['anime_name']}: {total} episodes, {len(anime['seasons'])} season(s)")
    for s in anime["seasons"]:
        print(f"  {s['season_name']}: {len(s['episodes'])} eps")
        if s["episodes"]:
            print(f"    First: {s['episodes'][0]['name']}")
