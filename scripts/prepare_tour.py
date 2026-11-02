#!/usr/bin/env python3
"""Extract the seven reduced-motion/loading posters from the saved native clips.

Requires local ffmpeg and Pillow. No model, network, or paid API calls.
"""
from pathlib import Path
import io
import subprocess
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'assets/tour'
clips = ['01-study.mp4', '02-technology.mp4', '03-business.mp4',
         '04-fitness.mp4', '05-community.mp4', '06-overview.mp4']
sources = [(clips[0], 0)] + [(clip, 144) for clip in clips]
output = root / 'stills'
output.mkdir(exist_ok=True)
for index, (clip, frame) in enumerate(sources):
    data = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(root / 'clips' / clip),
        '-vf', f'select=eq(n\\,{frame})', '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', 'pipe:1'])
    image = Image.open(io.BytesIO(data)).convert('RGB')
    image.save(output / f'scene-{index}.webp', 'WEBP', quality=90, method=4)
    print(f'scene-{index}: {image.width}x{image.height}')
