#!/usr/bin/env python3
"""
Extract all video file IDs and resource keys from a public Google Drive folder.

Usage:
    python3 extract_gdrive_folder.py <FOLDER_URL> [output_file]

Example:
    python3 extract_gdrive_folder.py "https://drive.google.com/drive/folders/0BwNIVETrodXLQ3V1b083NmVQRk0?resourcekey=0-CxKPqZEcknurrX3Z8OYhjg" aot_s1.json

The script:
  1. Fetches the Drive folder page
  2. Parses the AF_initDataCallback data to extract video file IDs + resource keys
  3. Fetches each file's preview page to get its filename
  4. Sorts by episode number (extracted from filename)
  5. Outputs a JSON file + prints TypeScript code to paste into gdrive-sources.ts
"""
import sys
import re
import json
import urllib.request

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")

def extract_folder_id(url):
    """Extract folder ID and resource key from a Drive folder URL."""
    folder_id_match = re.search(r"/folders/([a-zA-Z0-9_-]+)", url)
    resource_key_match = re.search(r"resourcekey=([a-zA-Z0-9_-]+)", url)
    if not folder_id_match:
        print("Error: could not find folder ID in URL")
        sys.exit(1)
    return folder_id_match.group(1), resource_key_match.group(1) if resource_key_match else ""

def extract_file_ids(folder_html):
    """Extract video file IDs and resource keys from the folder page HTML."""
    m = re.search(r"AF_initDataCallback\(\{key: 'ds:4',[^}]+data:(.+?), sideChannel", folder_html, re.DOTALL)
    if not m:
        print("Error: could not find folder data in page")
        return []
    data_str = m.group(1)
    # Pattern: [[null,"FILE_ID"],null,"RESOURCE_KEY",null,"video/mp4"
    pattern = re.compile(r'\[\[null,"([a-zA-Z0-9_-]{25,44})"\],null,"([a-zA-Z0-9_-]+)",null,"(video/[^"]+)"')
    return pattern.findall(data_str)

def get_file_name(file_id, resource_key):
    """Fetch the file's preview page to get its filename."""
    url = f"https://drive.google.com/file/d/{file_id}/view"
    if resource_key:
        url += f"?resourcekey={resource_key}"
    try:
        html = fetch(url)
        title_match = re.search(r"<title>([^<]+)</title>", html)
        if title_match:
            title = title_match.group(1)
            # Strip Drive suffixes
            for suffix in [" - Google 雲端硬碟", " - Google Drive", " - Google Drive"]:
                title = title.replace(suffix, "")
            return title.strip()
    except Exception as e:
        print(f"  Warning: could not fetch name for {file_id}: {e}", file=sys.stderr)
    return None

def extract_episode_number(name):
    """Extract episode number from a filename like 'AttackOnTitanDubS1E01.mp4'."""
    if not name:
        return 999
    # Try patterns: E01, E1, Ep01, Episode01, 01
    patterns = [
        r"[Ee](\d+)",
        r"[Ee]p(?:isode)?[\s_-]?(\d+)",
        r"(\d+)",
    ]
    for p in patterns:
        m = re.search(p, name)
        if m:
            return int(m.group(1))
    return 999

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    folder_url = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "gdrive_episodes.json"

    print(f"Fetching folder: {folder_url}", flush=True)
    folder_html = fetch(folder_url)
    print(f"Folder page size: {len(folder_html)} bytes", flush=True)

    file_ids = extract_file_ids(folder_html)
    print(f"Found {len(file_ids)} video files\n", flush=True)

    episodes = []
    for i, (fid, rkey, mime) in enumerate(file_ids):
        print(f"  [{i+1}/{len(file_ids)}] {fid} — fetching name...", end=" ", flush=True)
        name = get_file_name(fid, rkey)
        ep_num = extract_episode_number(name)
        embed_url = f"https://drive.google.com/file/d/{fid}/preview?resourcekey={rkey}"
        episodes.append({
            "file_id": fid,
            "resource_key": rkey,
            "title": name or f"Episode {i+1}",
            "episode_number": ep_num,
            "embed_url": embed_url,
        })
        print(f"{name} (ep {ep_num})", flush=True)

    # Sort by episode number
    episodes.sort(key=lambda x: x["episode_number"])

    # Save JSON
    with open(output_file, "w") as f:
        json.dump(episodes, f, indent=2)
    print(f"\nSaved {len(episodes)} episodes to {output_file}")

    # Print TypeScript code
    print("\n=== TypeScript code to paste into src/lib/gdrive-sources.ts ===\n")
    print('  "your-anime-id": [')
    print("    [")
    for ep in episodes:
        print(f'      ep("{ep["file_id"]}", "{ep["resource_key"]}", "{ep["title"]}"),')
    print("    ],")
    print("  ],")

if __name__ == "__main__":
    main()
