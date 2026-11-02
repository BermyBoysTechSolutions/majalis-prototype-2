# MAJALIS — Prototype 2

An independent, animation-focused second direction for the MAJALIS Muslim educational platform. Prototype 1 remains preserved in its original repository and `prototype-1` tag.

- Prototype 2: https://bermyboystechsolutions.github.io/majalis-prototype-2/
- Prototype 1: https://bermyboystechsolutions.github.io/majalis-prototype/

## Motion

Seven original vector illustrations become a 5,600-point WebGL field. A custom GPU shader handles staggered scatter, vortex motion, depth, color interpolation, and reassembly as the user scrolls. The JavaScript loop updates uniforms; geometry is uploaded only when the active scene pair changes.

Native browser scroll timelines handle masked typography, atmosphere, and a 3D fan-to-grid learning-card sequence. Phones retain the same particle artwork, with a scroll-driven card deck that leaves room for readable text.

There is no video, scroll-jacking library, or mandatory scroll snapping. Reduced motion uses the same vectors in normal document flow. WebGL and scroll-timeline fallbacks are included. Icons are shared SVG designs; there is no Arabic text.

## Local preview

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Open http://127.0.0.1:4174/ in native Chrome. No build or dependency installation is needed. GitHub Pages serves the repository root from `main`.

## Reference and limits

See [the public reference study and motion direction](docs/motion-direction.md). All MAJALIS illustrations and motion code are original to this prototype; the reference site's illustrations, text, and crest are not included.

Sign up / Log in open an explicit coming-soon account preview. Authentication, credential collection, courses, payments, and member accounts are not connected.
