# DOTS Living Worlds

**A web-native artificial-world experience built around Neural Cellular Automata (NCA), an LLM, and DOTS continual learning.**

This repository is the product source of truth. The public experience will let visitors explore a visually rich world with original voxel-style inhabitants, then gradually add natural-language world authoring, NCA-driven local dynamics, and source-tracked DOTS learning.

## Current status: v0.5 — constrained world specification builder

**Current milestone:** v0.5 — constrained world specification builder. Visitors can describe supported settings, compile a validated JSON spec, inspect the result, and apply it to the local world. The compiler is deterministic and local; the server-side LLM endpoint is not connected. The public deployment is updated manually and should be verified on-device before relying on it.

The v0.5 world specification builder is now the current milestone:

- Responsive dark visual identity and product landing page.
- Three interactive deterministic terrain presets: Moss Basin, Crystal Ridge, and Ashen Frontier.
- Pan/zoom camera, keyboard navigation, reset view, pause/resume, visual pulse speed, and seeded world regeneration.
- Selectable terrain tiles with an inspector panel and live terrain metrics.
- Architecture cards that distinguish LLM, DOTS, and NCA responsibilities.
- NCA channel state and local neighborhood perception, shared 15-feature → 12-hidden-unit → 5-output neural update rule, deterministic per-cell update mask, and explicit initialized weights.
- NCA overlay toggle, single-step control, reset from the world seed, active-cell and tick metrics.
- Constrained world-spec builder supporting preset, seed, population, NCA seed radius, update rate, and overlay/engine toggles; inspectable strict JSON schema with unsafe/unknown keys rejected.
- No API keys, external AI calls, accounts, analytics, or personal data collection.
- Dependency-light app using native HTML, CSS, and JavaScript modules.
- GitHub Actions checks for syntax, tests, and critical page assets.

The NCA executes a shared neural update rule with deterministic initialized weights, but those weights are not trained. It is a real neural cellular computation, not a learned organism; voxel inhabitants still use explicit scripted policies and are not driven by NCA output. The local world-spec compiler does not call an LLM; the server-side LLM integration and evaluation remain future work, with DOTS integration following later.

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

An independent Vercel project named `dots-living-world` exists and its deployment alias is `https://dots-living-world.vercel.app/`. It has no custom domains. The v0.4 deployment is uploaded manually. The GitHub integration status should be verified in Vercel Settings → Git before assuming that pushes will deploy automatically. Do not attach `artifex.engineer` or a subdomain to this project.

The existing repository `sohan-a11y/sohan-a11y.github.io`, its CNAME, DNS and Vercel project are outside this product and must not be changed. See [Hosting Architecture](docs/ARCHITECTURE_AND_HOSTING.md).

## Release plan

- [Production Roadmap](docs/PRODUCTION_ROADMAP.md): nine planned versions and eighteen milestone build artifacts.
- [Architecture and Hosting](docs/ARCHITECTURE_AND_HOSTING.md): browser/runtime boundaries, traffic strategy, and separation from Artifex.
- [v0.1 release notes](docs/RELEASES/v0.1.md).
- [v0.2 release notes](docs/RELEASES/v0.2.md).
- [v0.3 release notes](docs/RELEASES/v0.3.md).
- [v0.4 release notes](docs/RELEASES/v0.4.md).
- [v0.5 release notes](docs/RELEASES/v0.5.md).

## The architecture in one sentence

The **LLM** interprets goals, **DOTS** stores and tracks eligible persistent language-model updates, and the **NCA** executes local cellular dynamics. These are distinct subsystems with different capabilities and deletion guarantees.

## Original visual assets and attribution

The block/voxel visual language will use original models, shapes, and materials. This project does not use Minecraft branding, official textures, or proprietary character assets.
