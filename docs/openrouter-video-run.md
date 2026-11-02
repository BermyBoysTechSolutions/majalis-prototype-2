# Budgeted OpenRouter room video generation

Owner authorized using the existing Gombey OpenRouter credential on 2026-11-01, with approximately $2.12 in existing credit. No top-up, subscription, provider signup, or other paid account is authorized.

## Selection and cost preflight

Available credit was checked privately and matched the owner's stated **$2.12 budget**. Account-wide billing totals are not recorded here. The credential is loaded privately from the owner's existing environment file, never copied into this repository, browser code, prompts, or logs.

Selected **`bytedance/seedance-1-5-pro`**, 1280 × 720, 16:9, six seconds, audio disabled. It accepts both first and last frames and supports 4–12 second clips. Its published video-only price is $0.0000012 per video token. OpenRouter defines tokens as width × height × duration × 24 ÷ 1024.

| Item | Calculation | Estimated USD |
| --- | --- | ---: |
| One six-second silent clip | 1280 × 720 × 6 × 24 ÷ 1024 × 0.0000012 | 0.15552 |
| Six connected moves / 36 seconds | 6 × 0.15552 | 0.93312 |
| Two attempts for each move at most | 12 × 0.15552 | 1.86624 |

Hard local reservation cap: **$1.95**. Minimum account credit reserve: **$0.16858**. Maximum twelve submissions. Live pricing/capabilities and available credit are rechecked before every paid POST. Actual reported cost replaces a job's estimate when available. Submission ambiguity retains its reservation and never triggers an automatic POST retry. No other paid requests are made.

First-result billing correction: the API returned **145 frames at 24fps**, or 6.041667 seconds, for a six-second request. Actual cost was **$0.1566**, consistent with applying the published formula to those 145 frames. The runner now estimates $0.1566 and reserves **$0.16 per submission**. Six clips at the observed cost are **$0.9396**; twelve submissions would be **$1.8792**, below the cap. The table above preserves the initial six-second forecast rather than silently changing it.

Comparison at 720p: Grok Imagine Video 1.5 Lite lists $0.03/second plus $0.01 per image; six six-second clips with one image each would be $1.14. Wan 3.0 lists $0.10/second at 720p, so six six-second clips would cost $3.60. TBC mischief 1 is cheaper ($0.01/second at 720p) but newly listed, accepts only first frames, and lacks the endpoint control useful to this continuity-sensitive tour. Seedance was chosen for affordable controlled camera tests, without claiming guaranteed quality. Its model page currently lists a November 11, 2026 retirement; this affects future regeneration, not downloaded files.

## Revised model test

The first connected study-to-technology attempt in 1.5 Pro reached its endpoints but showed room/figure morphing. A subsequent **Seedance 2.0 Fast** test improved the crossing. The 480p request actually produced **864 × 496**, 145 frames at 24fps, and cost **$0.2548644**. That cost matches the published $0.0000042/token rate applied to the returned dimensions and duration. Future Fast requests reserve at least $0.27 each; the total $1.95 cap remains unchanged. This is a lower-resolution draft tradeoff, not a claim of final quality or artificial upscaling to higher detail.

## Execution and review

`scripts/openrouter_video.py` makes explicit submit, poll, download, and balance calls. `docs/video-scenes.json` saves the actual shared art constraints and six camera instructions. Keep private state and raw API responses outside the public repository; they may contain expiring download URLs. No credential is sent to non-OpenRouter download hosts.

Generate the overview-to-study move first. Inspect its frames before paying for more. Subsequent moves use the preceding acceptable final frame as their first frame. Preserve the original room reference for the return overview if supported. Check every clip for visible facial features, writing, coverage, room/character continuity, scene dissolves, and stable endpoints. Model output must pass visual review before being represented as an accepted website asset.

Initial test: rejected, $0.1566. Camera approached the business table instead of the study nook and added facial features. A shorter camera-first prompt plus an explicit generated last frame corrected the camera direction in the second attempt ($0.1566). Most faces remain blank in that draft, but transient facial-hair detail appears on the foreground fitness figure. Treat it as a draft, not a fully compliant accepted final asset. Subsequent connected moves are being generated and inspected.

Five purpose-made endpoint images were generated with the built-in image tool, without using OpenRouter credit: `assets/majlis-keyframe-{study,technology,business,fitness,community}-v1.png`. Each uses the approved v2 room as design reference, repositions the camera toward its named existing activity, and specifies the same furnishings, lighting, loose full-length clothing, blank pages/screens and entirely featureless heads. The business/fitness views favor backs of heads. The original master serves as the return-overview endpoint.

This is media production, not completion or publication of the room-based website.

Sources: [live video catalog](https://openrouter.ai/api/v1/videos/models), [Seedance 1.5 Pro pricing and token formula](https://openrouter.ai/bytedance/seedance-1-5-pro), [OpenRouter video API guide](https://openrouter.ai/docs/guides/overview/multimodal/video-generation).
