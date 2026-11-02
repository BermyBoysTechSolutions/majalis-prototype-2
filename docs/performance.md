# Room-tour performance and verification

Verified on 2026-11-01 in the installed, visible native Chrome Beta, using its DevTools protocol. No in-app browser was used. Runtime captures and JSON evidence are local under `output/majalis-p2/`, outside this public repository.

## Rendering change

The initial image-atlas experiment added WebP compression, a canvas-size cap, and many image requests. It has been replaced with native video elements using the six saved MP4 camera moves directly. Desktop now uses the original **1280×720 study clip**, without the extra compression/downscale in the combined master. The later five clips remain their original **864×496**. No artificial upscale, frame generation, or paid API calls were made. Matching loading and reduced-motion posters are extracted at native resolution.

The browser seeks only when the target source frame changes, permits one outstanding seek per video, preloads the next clip, and retains at most three video elements. Removed clips release their source and callbacks. The previous ready frame remains visible during a seek. No continuous page render loop runs while idle; scrolling uses a time-based 62ms settling filter and passive native scroll events. Glass effects are limited to small content surfaces. HTTP byte ranges are supported by the local preview server and GitHub Pages.

## Measured results

Fast native scrolling through all seven chapters at 1100px/s, starting from a cold cache:

| Native Chrome profile | UI frame interval, mean / p95 | UI frames over 50ms | Long tasks | Presented video callbacks | Mean completed seek |
| --- | --- | --- | --- | --- | --- |
| Desktop 1440×900 | 16.71ms / 17.5ms | 0 | 0 | 256 | 6.24ms |
| Mobile layout 390×844, 4× CPU slowdown, 10Mbps, 55ms latency | 16.69ms / 17.5ms | 0 | 0 | 92 | 72.05ms |

Both runs reached source frame 869 and the final section without media errors; three background videos were retained at most. Counters include holding intervals, loading frames and background preloads, so they must not be treated as a camera-FPS measurement. The slower emulated mobile profile visibly updates the camera less often even though UI timing stays smooth. A physical phone and 120Hz display have not been measured. The source clips themselves are 24fps, and this prototype does not claim native 120fps or resolution beyond its source assets.

## Functional and responsive checks

- All seven chapters at 1440×900, 390×844, and 320×667: 21 correct source-frame checkpoints; primary CTAs visible and interactive; no horizontal overflow or overlap with navigation.
- Landscape phone 844×390 and tablet 820×1180: representative welcome, wellbeing and final panels stay within the viewport. Short landscape panels can scroll internally.
- All 21 contextual account CTAs open the correct preview, with zero credential inputs. Log in and Sign up remain launch previews.
- Native touch scroll moves the page; no wheel/touch cancellation or custom scroll trap.
- Reduced motion releases all background videos and shows the matching still. Chapter links retain all content.
- Native guidelines dialog, Escape, video playback/close, and account dialog focus behavior checked. Closing the film stops playback and clears its source.
- Local range request returns HTTP 206 and the exact requested byte count. No runtime exceptions in the primary layout/CTA run.

## Preview commands

```sh
python3 scripts/serve.py --port 4175
```

Tailscale routes `/majalis-2` to port 4175 while preserving `/`, Prototype 1 `/majalis`, and the separate review gallery `/majalis-videos`. Prototype 1 code and its existing public Pages deployment are unchanged.
