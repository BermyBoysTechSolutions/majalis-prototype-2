# Prototype 2 motion direction

Prototype 1 is preserved at https://github.com/BermyBoysTechSolutions/majalis-prototype/tree/prototype-1 and its existing Pages URL. This is an independent repository and design.

## Public reference study

The rendered homepage and public `routes-DsZetEw4.js` bundle of https://thecompanionscollective.com/ reveal a custom WebGL POINTS renderer, a second 2D canvas for labels, generated point positions sampled from SVG illustrations, staggered swirling morphs, scroll-velocity deformation, and spring-smoothed chapter progress. Its public configuration uses roughly 9,600 desktop / 6,000 compact points. The application is React-based and exposes Motion scroll utilities. The main scene is a pinned viewport with chapter navigation; the phone layout retains the particle artwork. No private server source was accessible or inspected.

Source inspected: https://thecompanionscollective.com/assets/routes-DsZetEw4.js and https://thecompanionscollective.com/assets/hero-section-I_hpMUIY.js . Reference source and screenshots are retained locally outside this repository. No reference illustrations, text, crest, or implementation code are copied into this prototype.

## MAJALIS implementation

- Seven continuous scroll chapters: introduction, Islamic knowledge, health, business, technology, community, and purposeful growth.
- Original vector drawings sampled once into a deterministic particle field.
- GPU shader performs stagger, vortex scatter, depth, color interpolation, and reassembly; buffers change only when the chapter pair changes.
- Native scroll timelines drive masked line reveals and layered atmosphere; no scroll jacking, cursor repulsion, or mandatory scroll snapping.
- A second pinned sequence unfolds three learning cards from a 3D fan into a readable layout with hover feedback.
- Native Chrome only for preview. Phone keeps the same art and choreography, fitted to a stable touch viewport.
- Shared SVG icons; no emoji substitutions or Arabic text.
- Sign up / Log in retain honest account-preview behavior; no credentials or accounts are collected.
- Reduced motion uses the same vector artwork in normal document flow. WebGL failure has an SVG fallback.

## Acceptance

Confirm desktop / 390x844 / 320x568 / phone landscape layouts, functional chapter navigation and account dialog, readable hold intervals, working reduced motion / WebGL fallback, no script errors, frame cadence on the attached 60Hz display, independent GitHub repository and deployed Pages URL. Do not claim actual 120Hz or physical phone measurements.
