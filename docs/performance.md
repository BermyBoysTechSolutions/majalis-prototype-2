# Room-tour playback and verification

## Current revision — 2026-11-02

The scroll target now drives **native forward/reverse video playback**. The previous implementation changed `currentTime` repeatedly while scrolling; the browser had to perform a new random seek for most camera updates. The current player uses seeks when aligning a newly selected clip or settling an exact endpoint, then plays the camera move continuously. Matching reverse files avoid reliance on negative playback rates. Native callbacks track the camera actually presented, and the content panels follow that camera rather than jumping ahead to the scroll destination.

Navigation buttons follow the camera timeline with distance-based easing and skip intermediate reading holds. Ordinary wheel/touch input remains native and can interrupt navigation. Mobile and desktop use the same camera sequence, chapter heights and viewing holds. The camera can catch up after a fast fling instead of skipping directly to its final still. Background playback pauses for dialogs and hidden pages. At most three videos are retained, and idle page animation stops after settling.

## Quality and fallback

- Capable devices keep the original desktop footage: 1280×720 opening, 864×496 later scenes. This applies to capable phones as well.
- Small-core/save-data devices, a browser reporting unsuitable decoding capability, persistent missed presentations at modest playback speed, or a standard-video decoding error select compatibility mode.
- Compatibility assets are local 640×368 baseline H.264, without B-frames, with independent frames and fast-start metadata. No model/API calls are involved. They reduce decoding work; native-resolution posters restore detail during reading holds. Reduced glass filtering also lowers compositing cost.
- Blocked autoplay retains a seek-based fallback and an explicit full-film control. A real pointer/touch gesture retries native playback. A browser unable to decode even compatibility footage retains every chapter using stills.
- No source resolution or 120fps has been invented. The source remains 24fps. VDI remote-display refresh rates, GPU policy, multimedia redirection, bandwidth, and host contention remain outside website control. Physical phones and the owner's actual work VDI have not been tested.

The browser's media-capability report is a hint, not a guarantee. Observed presentation stalls are checked at modest playback speed; normal frame dropping while accelerating a camera move does not by itself select lower quality.

## Native Chrome verification

Verification uses the installed native Chrome Beta, not the in-app browser. Device sizing, touch and 4× CPU slowdown are DevTools emulation, not physical-device results. The QA browser was kept active through focus emulation while the host display was inactive. Captures and reports are local under `output/majalis-p2/` outside the public repository.

The integration run checks a real chapter-button click into study, reverse playback back home, native wheel/touch scrolling, a long navigation to the final section, all seven exact arrival checkpoints, readable/interactable CTAs, no horizontal overflow or navigation overlap, and reduced motion releasing all background videos. Tested desktop at 1440×900 and constrained mobile at 390×844 with 4× CPU slowdown and two reported cores. The constrained profile automatically selects compatibility mode; desktop retains original resolution. Camera presentation counts are measured using actual video-frame callbacks, separately from UI animation timing. No universal FPS promise is made.

The study chapter-button move presented 64 actual video callbacks on desktop and 63 on the constrained mobile profile, with one final alignment seek in each run. The reverse moves presented 96 and 106 callbacks. Long skips reached frame 869 without media errors, retaining at most three videos. These are presentation counts over variable-duration moves, not FPS claims. All seven checkpoints and visible CTAs passed at 1440×900, 390×844 and 320×667 (21 layouts). Supplemental checks passed for manual interruption, reduced motion (zero background videos), forced autoplay denial and fully blocked background-video delivery (matching stills and usable content).

Earlier image-atlas and seek-only experiments, measurements and assets are retained in Git history/local output. Their UI-frame timing must not be used as a camera-FPS result for this revision.

## References

- [MDN: changing currentTime seeks the media](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime)
- [MDN: reverse playback-rate support varies](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate)
- [MDN: media decoding capability reports](https://developer.mozilla.org/en-US/docs/Web/API/MediaCapabilities/decodingInfo)
- [Microsoft: remote-session video redirection](https://learn.microsoft.com/en-us/azure/virtual-desktop/multimedia-redirection)

## Preview

```sh
python3 scripts/serve.py --port 4175
```

The server and GitHub Pages support HTTP byte ranges. Tailscale `/majalis-2` proxies 4175; existing root, Prototype 1 and video-review routes are preserved. Public sharing remains https://bermyboystechsolutions.github.io/majalis-prototype-2/ . No duplicate third repository is needed: Prototype 2 already has its separate repo and Pages site.


## Stationary mobile stage — 2026-11-02

Portrait mobile now uses a larger room viewport, with focal framing that makes the study, computer desk, business table, fitness and community activities prominent. Framing moves on a shared composited room layer, so the video and native-resolution stills stay aligned without re-encoding footage.

The description area has one persistent, fixed-size glass shell. All chapter cards occupy exactly that rectangle; their contents fade without translating or scaling. Section labels, icons and description text are larger, and CTA rows have a consistent bottom anchor. The room, description frame and navigation use a stable mobile stage height rather than following browser-toolbar expansion/collapse. Rotation and substantial resizes still reflow. Chapter scroll distances use that same stable height. No wheel/touch cancellation was added.

Native Chrome checks passed all seven sections at390×844,430×932,320×667 and320×568 (28 layouts): matching card/shell rectangles, no internal card scrolling, no clipped/overlapping CTAs, no horizontal overflow, no card translation or scaling. During a real touch gesture starting over the description area, 256 frame samples kept the room, shell and navigation rectangles identical while actual video frames advanced. An80px same-width viewport-height change kept the stage geometry and typography unchanged. Desktop camera playback and its original card layout passed a representative check. No runtime/media errors. Reports/captures: local `output/majalis-p2/pinned-*`. Physical-phone browser-toolbar behavior remains subject to user verification; the height-change check uses DevTools emulation.


## Mobile CTA spacing correction — 2026-11-02

Owner's iPhone screenshot exposed an overlap at a393×664 CSS viewport: the absolutely positioned CTA began21.25px above the bottom of the topic tags. Mobile card contents now use a column layout with a normal-flow action row and explicit separation after tags. The fixed outer card frame remains unchanged. A stable-height short-screen typography mode also covers wider phones whose browser chrome leaves less vertical room. The closing login link participates in normal flow as well.

Native Chrome checked all seven sections at393×664,390×640,390×740,390×844,320×568,320×667 and430×932 (49 layouts). Minimum measured content-to-button gap16.98px; no CTA clipping, internal card scrolling, navigation overlap, horizontal overflow or card movement. Before/after screenshots and report: local `output/majalis-p2/cta-overlap-*` and `cta-spacing-qa.json`. These are emulated viewport checks; the owner's supplied screenshot is the physical-phone evidence of the original bug.
