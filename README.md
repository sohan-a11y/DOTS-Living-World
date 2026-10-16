# DOTS Living Worlds

**A web-native artificial-world experience built around Neural Cellular Automata (NCA), an LLM, and DOTS continual learning.**

This repository is the product source of truth. The public experience will let visitors explore a visually rich world with original voxel-style inhabitants, then gradually add natural-language world authoring, NCA-driven local dynamics, and source-tracked DOTS learning.

## v0.1 status

The first web foundation is being established:

- Responsive dark visual identity and product landing page.
- Animated procedural field preview, explicitly labelled as an illustration rather than a running NCA.
- Architecture cards that distinguish LLM, DOTS, and NCA responsibilities.
- No API keys, external AI calls, accounts, analytics, or personal data collection.
- Dependency-light app using native HTML, CSS, and JavaScript modules.
- GitHub Actions checks for syntax, tests, and critical page assets.

**This is not yet the NCA engine or the final public simulator.** Milestones v0.2 to v1.0 add the real viewer, original voxel inhabitants, tested NCA dynamics, LLM world authoring, DOTS integration, sharing, scale controls, and production hardening in sequence.

## Run locally

Requires Node.js 20 or newer. No package installation is required.

```bash
npm test
npm run check
npm run dev
```

Then open the local URL printed by the static development server. If you do not have a static file server, use:

```bash
python -m http.server 4173
```

and open http://localhost:4173.

## Hosting separation

Deploy this repository to an independent Vercel project named `dots-living-world` (if available) and keep the default Vercel hostname. Do not attach `artifex.engineer` or a subdomain to this project.

The existing repository `sohan-a11y/sohan-a11y.github.io`, its CNAME, DNS and Vercel project are outside this product and must not be changed. See [Hosting Architecture](docs/ARCHITECTURE_AND_HOSTING.md).

## Release plan

- [Production Roadmap](docs/PRODUCTION_ROADMAP.md): nine planned versions and eighteen milestone build artifacts.
- [Architecture and Hosting](docs/ARCHITECTURE_AND_HOSTING.md): browser/runtime boundaries, traffic strategy, and separation from Artifex.
- [v0.1 release notes](docs/RELEASES/v0.1.md).

## The architecture in one sentence

The **LLM** interprets goals, **DOTS** stores and tracks eligible persistent language-model updates, and the **NCA** executes local cellular dynamics. These are distinct subsystems with different capabilities and deletion guarantees.

## Original visual assets and attribution

The block/voxel visual language will use original models, shapes, and materials. This project does not use Minecraft branding, official textures, or proprietary character assets.
