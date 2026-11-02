#!/usr/bin/env python3
"""Make forward/reverse H.264 camera moves locally. Originals are preserved.

Independent-frame compatibility clips reduce random-seek decoding work.
Reverse clips allow real backward playback without negative playbackRate.
Requires ffmpeg; no network or paid API calls.
"""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1] / 'assets/tour'
files = ['01-study.mp4', '02-technology.mp4', '03-business.mp4',
         '04-fitness.mp4', '05-community.mp4', '06-overview.mp4']
for folder, reverse, light in [('compat', False, True), ('compat-reverse', True, True), ('reverse', True, False)]:
    output = root / folder
    output.mkdir(exist_ok=True)
    for name in files:
        dest = output / name
        if dest.exists():
            continue
        filters = (['scale=640:368:flags=lanczos'] if light else []) + (['reverse'] if reverse else [])
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(root / 'clips' / name),
            '-vf', ','.join(filters), '-c:v', 'libx264', '-preset', 'fast', '-tune', 'fastdecode',
            '-profile:v', 'baseline', '-crf', '24' if light else '18', '-g', '1' if light else '6',
            '-bf', '0', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', str(dest)], check=True)
        print(f'{folder}/{name}: {dest.stat().st_size} bytes', flush=True)
