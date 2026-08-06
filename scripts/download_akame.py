#!/usr/bin/env python3
"""Download Akame ga Kill torrent and serve files locally."""
import libtorrent as lt
import time, sys, os, json

ses = lt.session()
ses.listen_on(6881, 6891)

magnet = 'magnet:?xt=urn:btih:04f852e11ad620435097c26b08c670b9328f79ed'
params = lt.add_torrent_params()
params.save_path = '/tmp/akame'
params.url = magnet

h = ses.add_torrent(params)
print('Starting torrent download...', flush=True)

# Wait for metadata
while not h.status().has_metadata:
    time.sleep(1)

ti = h.get_torrent_info()
files = ti.files()
print(f'Torrent: {ti.name()}', flush=True)
print(f'Files: {files.num_files()}', flush=True)
print(f'Total size: {sum(files.file_size(i) for i in range(files.num_files())) // (1024*1024)}MB', flush=True)

# Download to completion
start = time.time()
while True:
    s = h.status()
    elapsed = time.time() - start
    pct = s.progress * 100
    speed = s.download_rate / 1024
    remaining = (100 - pct) / (pct / elapsed) if pct > 0.1 and elapsed > 0 else 999
    print(f'  {pct:.1f}% | {speed:.0f}KB/s | {s.num_peers} peers | {s.num_seeds} seeds | ETA: {remaining:.0f}s', flush=True)
    
    if s.progress >= 1.0:
        print('\nDownload complete!', flush=True)
        break
    
    time.sleep(10)

# List downloaded files
print('\nDownloaded files:', flush=True)
download_dir = '/tmp/akame/' + ti.name()
file_list = []
for i in range(files.num_files()):
    fpath = files.file_path(i)
    fname = os.path.basename(fpath)
    fsize = files.file_size(i)
    full_path = os.path.join('/tmp/akame', fpath)
    exists = os.path.exists(full_path)
    print(f'  {fname} ({fsize // (1024*1024)}MB) {"✓" if exists else "✗"}', flush=True)
    if exists:
        file_list.append({
            "name": fname,
            "path": full_path,
            "size_mb": fsize // (1024*1024),
            "ep_num": int(''.join(filter(str.isdigit, fname.split('-')[-1].split('.')[0]))) if any(c.isdigit() for c in fname) else 0,
        })

# Save file list
with open('/tmp/akame_files.json', 'w') as f:
    json.dump(file_list, f, indent=2)

print(f'\nSaved {len(file_list)} files to /tmp/akame_files.json', flush=True)
print(f'Download directory: {download_dir}', flush=True)
