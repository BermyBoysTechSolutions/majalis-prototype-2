#!/usr/bin/env python3
"""Decode every video frame and make chronological review sheets; no API calls."""
import argparse
import json
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw

p = argparse.ArgumentParser(description=__doc__)
p.add_argument("video", type=Path)
p.add_argument("output", type=Path)
a = p.parse_args()
a.output.mkdir(parents=True, exist_ok=True)
frames = a.output / "frames"
frames.mkdir(exist_ok=True)
probe = json.loads(subprocess.check_output([
    "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(a.video)
]))
(a.output / "probe.json").write_text(json.dumps(probe, indent=2))
video = next(s for s in probe["streams"] if s["codec_type"] == "video")
rate_n, rate_d = map(int, video["avg_frame_rate"].split("/"))
fps = rate_n / rate_d
subprocess.run(["ffmpeg", "-v", "error", "-i", str(a.video), "-vsync", "0",
                "-q:v", "2", str(frames / "frame-%04d.jpg")], check=True)
paths = sorted(frames.glob("frame-*.jpg"))
per_sheet = 24
for offset in range(0, len(paths), per_sheet):
    sheet = Image.new("RGB", (6 * 320, 4 * 202), "#111a16")
    draw = ImageDraw.Draw(sheet)
    for local, path in enumerate(paths[offset:offset + per_sheet]):
        frame = Image.open(path)
        frame.thumbnail((320, 180))
        x, y = (local % 6) * 320, (local // 6) * 202
        sheet.paste(frame, (x, y))
        index = offset + local
        draw.text((x + 5, y + 183), f"frame {index} / {index / fps:.3f}s", fill="white")
    sheet.save(a.output / f"contact-{offset // per_sheet:02d}.jpg", quality=92)
# Retain the exact decoded last frame as a lossless continuation input.
last = Image.open(paths[-1])
last.save(a.output / "last-frame.png")
print(json.dumps({"video": str(a.video), "width": video["width"], "height": video["height"],
                  "fps": fps, "frames": len(paths), "duration": probe["format"]["duration"],
                  "audio_streams": sum(s["codec_type"] == "audio" for s in probe["streams"]),
                  "review_sheets": (len(paths) + per_sheet - 1) // per_sheet}))
