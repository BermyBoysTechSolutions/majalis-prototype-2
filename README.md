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

Native page scrolling sets a camera destination. The room then plays the saved camera moves forward or backward using native video playback, keeping content panels aligned with the camera actually presented. It pauses at the destination for reading. Chapter buttons use a distance-based eased journey; wheel, touch or keyboard input can interrupt it immediately. Mobile follows the same camera sequence and chapter timing as desktop. Its larger room view focuses on each activity; a persistent glass description frame and bottom navigation stay still as scene content fades between chapters. Browser-toolbar height changes do not shift the stage.

Desktop retains the original 1280×720 opening and 864×496 later clips. Matching reverse clips support backward travel without relying on negative playback rates. Small-core devices and browsers reporting limited decoding capability use 640×368 baseline H.264 compatibility assets. Persistent presentation stalls also select compatibility mode. Capable phones keep the original video detail. Compatibility mode restores the native-resolution poster at reading holds. Only the current/next moves and at most three video elements are retained. Reduced motion uses matching stills with no background decoding; unsupported video falls back to those stills while keeping every section accessible.

The camera is allowed to catch up after a quick fling. Its source is 24fps; neither 120fps nor identical performance on every device is promised. VDI graphics policies, video redirection, network and remote-display frame rates remain outside the page’s control. The full film is available through “Watch the room.”
Sign up / Log in open honest account previews. No credentials are requested or stored, and authentication is not connected. Guidelines and video playback use native accessible dialogs.

## Assets

Artwork has featureless faces, predominantly male figures, modest clothing, a fully covered man lifting weights, and no Arabic writing. The owner approved the selected tour. Generation was completed within the previously authorized OpenRouter balance: $1.9146168 total. The run is closed; integration and performance work make no paid API calls. Credentials, API responses, local review exports, and performance captures remain outside the public repository.

`assets/tour/clips/` contains the six selected native MP4s. `reverse/` has matching reverse moves; `compat/` and `compat-reverse/` contain independent-frame lightweight variants. `scripts/prepare_compat.py` regenerates these locally with ffmpeg, without network access. `assets/tour/majalis-tour.mp4` is the approved combined tour. `scripts/prepare_tour.py` regenerates the seven loading/reduced-motion posters using local ffmpeg and Pillow, without network access. Source image and controlled endpoints are retained in `assets/`.

Prototype 1 remains unchanged in its separate repository and `prototype-1` tag. Reference research and the superseded particle direction are preserved in Git history and `docs/reference-study-archive.md`.
