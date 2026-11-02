# MAJALIS — Prototype 2

The current direction is an original 3D CGI majlis camera journey. Six camera clips and a 36.25-second combined tour have been generated and reviewed. The owner requested restoring the original six-second study shot; that saved version is now back in the compilation. The starting image and five camera endpoint images are in this repository. Selected videos and the private review gallery are kept in the local output folder described in the run report. The earlier particle narrative was an exploratory direction and has been superseded by the user's room concept.

- [Current starting image](assets/majlis-room-start-v2.png)
- [Full Veo animation and continuation prompts](docs/majlis-video-prompts.md)
- [Revised goal and art requirements](docs/motion-direction.md)
- [OpenRouter costs, limits and results](docs/openrouter-video-run.md)
- [Current six camera prompts](docs/video-scenes.json)
- [Preserved Prototype 1](https://bermyboystechsolutions.github.io/majalis-prototype/)

The room connects Quran learning, technology, business, health/fitness, and community. Figures have featureless faces and modest clothing; the gathering is predominantly men, with a fully covered man lifting dumbbells in the fitness area. No Arabic writing is included in the artwork.

The owner authorized using an existing OpenRouter credential within their existing $2.12 balance. Actual generation cost was $1.9146168, including superseded tests. The runner has a $1.95 spending cap, never retries a paid submission automatically, and this run is closed to further paid requests. Credentials and raw job responses stay outside this repository. Footage integration with scroll control remains the next website step. Native Chrome, mobile readability, reduced motion, and Sign up / Log in CTAs remain requirements. Account previews collect no credentials; authentication is not connected.

## Local exploratory build

The existing source files are the superseded particle experiment, retained until the room video is supplied:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Prototype 1 remains unchanged in its own repository and tag. The reference study is archived in `docs/reference-study-archive.md`.
