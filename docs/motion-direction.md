# Prototype 2 — the majlis room journey

## Revised goal

Preserve Prototype 1. Build an original MAJALIS experience around one coherent stylized 3D CGI Arabian majlis. Scrolling will move the camera through the five activity areas of the same room, using the owner-approved generated camera clips. The earlier particle-based direction was rejected as too similar to the reference and is superseded; its research is retained in `reference-study-archive.md`.

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

## Current implementation and assets

- `assets/majlis-room-start-v1.png`: preserved initial image.
- `assets/majlis-room-start-v2.png`: current mostly-men/dumbbell revision, generated with the built-in image tool, 1672 × 941.
- `docs/majlis-video-prompts.md`: generation prompts, the first image-to-video prompt, and connected extension prompts.
- Video asset run complete: six selected drafts and a 36.25-second compilation, with the original six-second study clip restored at the owner's request. Total paid cost $1.9146168; the run is closed. The owner said the overall results were good. Some crossing geometry shifts and a long foreground-column occlusion remain documented. The website now uses these saved native clips for scroll-controlled movement, with liquid-glass panels and distinct CTAs. Camera travel occupies the first half of each chapter, followed by a reading hold. Portrait mobile retains the whole room above the same content and icons. Reduced motion uses the corresponding stills. Performance and browser checks are recorded in `performance.md`.

Prototype 1 remains at its existing GitHub Pages URL and its `prototype-1` tag. Prototype 2 has its own repository and separate Pages preview. Account CTAs are previews, not a connected authentication service.


## Mobile, navigation and VDI revision — 2026-11-02

The camera now follows the scroll destination with native forward/reverse playback instead of continuous random seeks. UI panels follow the camera actually presented, so fast touch gestures and chapter shortcuts cannot flash unrelated content while a decoder catches up. Mobile uses the desktop camera sequence, chapter heights and reading holds. Navigation uses a distance-based eased scroll and can be interrupted by natural wheel, touch or keyboard input.

Keep original desktop resolution. Use locally encoded 640×368 baseline H.264 on small-core or limited-decoder devices; reverse assets avoid unsupported negative playback rates. Reduced-motion, blocked-autoplay and unavailable-video cases retain usable content and the explicit full-tour viewer. Do not promise consistent FPS across all VDI hardware or remote-display configurations, or claim that the actual work PC has been tested.
