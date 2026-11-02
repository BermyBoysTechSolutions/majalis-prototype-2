# MAJALIS — Prototype 2

A scroll-controlled journey through one connected 3D CGI majlis, with liquid-glass panels for Islamic knowledge, technology, business, wellbeing, and community. The approved 36.25-second room tour drives the camera. Each space has its own CTA, and the header includes Sign up / Log in.

- [Public Prototype 2](https://bermyboystechsolutions.github.io/majalis-prototype-2/)
- [Preserved Prototype 1](https://bermyboystechsolutions.github.io/majalis-prototype/)
- [Motion direction and art requirements](docs/motion-direction.md)
- [Performance and verification](docs/performance.md)
- [Video prompts](docs/majlis-video-prompts.md)
- [Generation costs and selected footage](docs/openrouter-video-run.md)

## Run locally

```sh
python3 scripts/serve.py --port 4175
```

Open http://127.0.0.1:4175/ in native Chrome. The server supports HTTP byte ranges, which are necessary for reliable video seeking. A basic Python static server does not provide that support. No build, package install, API key, or backend is needed. GitHub Pages serves the repository root (`main`, `/`); `.nojekyll` is included.

## How it works

Native page scrolling controls six saved camera clips. Video decoding replaces the earlier image-atlas experiment, preserving the clips without another compression pass. Only the mobile opening clip has a smaller derivative; the desktop opening retains its original 1280×720 pixels. The remaining clips are natively 864×496. Source footage is 24fps; no claim of native 120fps or added image detail is made.

Readable holds follow each camera move. The browser preloads the next clip and retains at most three video elements. Mobile portrait shows the entire room above the same panels and vector icons; touchscreen scrolling uses native browser behavior. Reduced-motion users see matching stills with no background video decoding. The full tour is also available through “Watch the room.”

Sign up / Log in open honest account previews. No credentials are requested or stored, and authentication is not connected. Guidelines and video playback use native accessible dialogs.

## Assets

Artwork has featureless faces, predominantly male figures, modest clothing, a fully covered man lifting weights, and no Arabic writing. The owner approved the selected tour. Generation was completed within the previously authorized OpenRouter balance: $1.9146168 total. The run is closed; integration and performance work make no paid API calls. Credentials, API responses, local review exports, and performance captures remain outside the public repository.

`assets/tour/clips/` contains the six selected native MP4s and the mobile opening derivative. `assets/tour/majalis-tour.mp4` is the approved combined tour. `scripts/prepare_tour.py` regenerates the seven loading/reduced-motion posters using local ffmpeg and Pillow, without network access. Source image and controlled endpoints are retained in `assets/`.

Prototype 1 remains unchanged in its separate repository and `prototype-1` tag. Reference research and the superseded particle direction are preserved in Git history and `docs/reference-study-archive.md`.
