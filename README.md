# MAJALIS — Prototype 2

The current direction is an original 3D CGI majlis camera journey. A starting image and Veo prompts are ready; video generation and integration are the next steps. The earlier particle narrative was an exploratory direction and has been superseded by the user's room concept.

- [Current starting image](assets/majlis-room-start-v2.png)
- [Full Veo animation and continuation prompts](docs/majlis-video-prompts.md)
- [Revised goal and art requirements](docs/motion-direction.md)
- [Preserved Prototype 1](https://bermyboystechsolutions.github.io/majalis-prototype/)

The room connects Quran learning, technology, business, health/fitness, and community. Figures have featureless faces and modest clothing; the gathering is predominantly men, with a fully covered man lifting dumbbells in the fitness area. No Arabic writing is included in the artwork.

The user will generate a connected camera tour in Veo/Flow and return it for scroll-controlled website integration. Native Chrome, mobile readability, reduced motion, and Sign up / Log in CTAs remain requirements. Account previews collect no credentials; authentication is not connected.

## Local exploratory build

The existing source files are the superseded particle experiment, retained until the room video is supplied:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Prototype 1 remains unchanged in its own repository and tag. The reference study is archived in `docs/reference-study-archive.md`.
