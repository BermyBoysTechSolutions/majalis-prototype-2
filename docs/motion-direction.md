# Prototype 2 — the majlis room journey

## Revised goal

Preserve Prototype 1. Build an original MAJALIS experience around one coherent stylized 3D CGI Arabian majlis. Scrolling will move the camera through the five activity areas of the same room, using a user-generated Veo video. The earlier particle-based direction was rejected as too similar to the reference and is superseded; its research is retained in `reference-study-archive.md`.

## Fixed art requirements

- Premium digitally rendered 3D environment, not live-action photography or a flat cartoon.
- One connected room with Islamic geometric mosaics, arches, green seating, warm cream plaster, wood and brass.
- Rear-left Quran study; rear-right technology; front-right business; front-left health and fitness; central community gathering.
- Mostly men. Current starting frame has seven men and one modestly dressed woman at the computer.
- All faces completely featureless; prefer back and rear three-quarter views. No eyes, eyebrows, nose, mouth, facial hair, expressions, or facial details in reflections/screens.
- Fitness is a man lifting dumbbells. Loose opaque full-length trousers and a long-sleeved top extending below the hips keep his torso, hips, thighs and knees covered throughout the animation.
- Modest loose full-length clothing throughout. Do not claim religious certification of the artwork.
- No Arabic or other generated writing, labels, calligraphy, logos or UI baked into the video.
- Same room, furniture, people, materials, and light across all shots. No disconnected rooms or montage.

## Camera and implementation

A continuous tour starts with the whole room, then approaches study, technology, business, fitness, and community, before returning to an overview. After the first Veo output failed visual review, the user authorized autonomous OpenRouter video generation within their existing $2.12 balance. See `openrouter-video-run.md` for the chosen model, live price calculation, spending limits and results. Website scroll will control movement through an accepted camera journey; it must include readable viewing intervals and retain the same artwork on mobile.

Keep native Chrome preview, touch-friendly responsive layouts, shared vector icons, reduced-motion behavior, and honest Sign up / Log in account-preview CTAs. No actual account backend exists yet.

## Current assets and next dependency

- `assets/majlis-room-start-v1.png`: preserved initial image.
- `assets/majlis-room-start-v2.png`: current mostly-men/dumbbell revision, generated with the built-in image tool, 1672 × 941.
- `docs/majlis-video-prompts.md`: generation prompts, the first image-to-video prompt, and connected extension prompts.
- Next dependency: acceptable connected video clips, before replacing the exploratory renderer and validating/publishing the finished room-based site. Paid OpenRouter tests are in progress; do not assume their output passes the art constraints.

Prototype 1 remains at its existing GitHub Pages URL and its `prototype-1` tag. Prototype 2 is not yet a finished room-based website.
