# DOTS Living Worlds

**A web-native artificial-world experience built around Neural Cellular Automata (NCA), an LLM, and DOTS continual learning.**

This repository is the product source of truth. The public experience will let visitors explore a visually rich world with original voxel-style inhabitants, then gradually add natural-language world authoring, NCA-driven local dynamics, and source-tracked DOTS learning.

## Current status: v0.3 — voxel inhabitants and rule-based ecology

**Current milestone and public deployment:** v0.3 — voxel inhabitants and rule-based ecology. The production alias [dots-living-world.vercel.app](https://dots-living-world.vercel.app/) now points to a Vercel `READY` deployment containing the v0.3 frontend, including enlarged high-contrast inhabitant sprites and phone-friendly selection targets. This is an early prototype, not the v1.0 production product.

The v0.3 inhabitant prototype is now the current milestone:

- Responsive dark visual identity and product landing page.
- Three interactive deterministic terrain presets: Moss Basin, Crystal Ridge, and Ashen Frontier.
- Pan/zoom camera, keyboard navigation, reset view, pause/resume, visual pulse speed, and seeded world regeneration.
- Selectable terrain tiles with an inspector panel and live terrain metrics.
- Architecture cards that distinguish LLM, DOTS, and NCA responsibilities.
- No API keys, external AI calls, accounts, analytics, or personal data collection.
- Dependency-light app using native HTML, CSS, and JavaScript modules.
- GitHub Actions checks for syntax, tests, and critical page assets.

The terrain is a procedural preset map and the inhabitants use small scripted policies, not a trained NCA, LLM-driven agent, or evidence of consciousness. The learned NCA runtime remains planned for v0.4, LLM world authoring for v0.5, and DOTS integration for v0.6.

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

An independent Vercel project named `dots-living-world` exists and its deployment alias is `https://dots-living-world.vercel.app/`. It has no custom domains. The current v0.2 deployment was uploaded manually because the Vercel GitHub integration is not installed; pushes to GitHub will not automatically deploy until that integration is connected to this repository. Do not attach `artifex.engineer` or a subdomain to this project.

The existing repository `sohan-a11y/sohan-a11y.github.io`, its CNAME, DNS and Vercel project are outside this product and must not be changed. See [Hosting Architecture](docs/ARCHITECTURE_AND_HOSTING.md).

## Release plan

- [Production Roadmap](docs/PRODUCTION_ROADMAP.md): nine planned versions and eighteen milestone build artifacts.
- [Architecture and Hosting](docs/ARCHITECTURE_AND_HOSTING.md): browser/runtime boundaries, traffic strategy, and separation from Artifex.
- [v0.1 release notes](docs/RELEASES/v0.1.md).
- [v0.2 release notes](docs/RELEASES/v0.2.md).
- [v0.3 release notes](docs/RELEASES/v0.3.md).

## The architecture in one sentence

The **LLM** interprets goals, **DOTS** stores and tracks eligible persistent language-model updates, and the **NCA** executes local cellular dynamics. These are distinct subsystems with different capabilities and deletion guarantees.

## Original visual assets and attribution

The block/voxel visual language will use original models, shapes, and materials. This project does not use Minecraft branding, official textures, or proprietary character assets.
