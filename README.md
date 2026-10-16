# DOTS Living Worlds

**A web-native artificial-world experience built around Neural Cellular Automata (NCA), an LLM, and DOTS continual learning.**

This repository is the product source of truth. The public experience will let visitors explore a visually rich world with original voxel-style inhabitants, then gradually add natural-language world authoring, NCA-driven local dynamics, and source-tracked DOTS learning.

## Current status: v0.6 — server-side LLM world-spec compiler

**Current milestone:** v0.6 — server-side LLM world-spec compiler. Visitors can ask a server-side model to produce a strict versioned world spec, review the JSON, and explicitly apply it, or use the deterministic local compiler. The endpoint calls OpenAI Responses API and requires `OPENAI_API_KEY` in the DOTS Living World Vercel Production environment. The API key's presence could not be verified through the current Vercel connector scope, so live LLM activation must not be assumed until a real provider request succeeds.

The v0.6 world specification workflow is the current milestone:

- Responsive dark visual identity and product landing page.
- Three interactive deterministic terrain presets: Moss Basin, Crystal Ridge, and Ashen Frontier.
- Pan/zoom camera, keyboard navigation, reset view, pause/resume, visual pulse speed, and seeded world regeneration.
- Selectable terrain tiles with an inspector panel and live terrain metrics.
- Architecture cards that distinguish LLM, DOTS, and NCA responsibilities.
- NCA channel state and local neighborhood perception, shared 15-feature → 12-hidden-unit → 5-output neural update rule, deterministic per-cell update mask, and explicit initialized weights.
- NCA overlay toggle, single-step control, reset from the world seed, active-cell and tick metrics.
- Constrained world-spec builder supporting preset, seed, population, NCA seed radius, update rate, and overlay/engine toggles; strict versioned JSON schema and explicit review/apply flow.
- Same-origin `POST /api/world-spec` serverless endpoint uses OpenAI Responses API Structured Outputs, then validates the output again using the application schema before returning it.
- Separate Ask AI and Compile locally buttons; model errors do not silently trigger the local compiler. Request size/prompt bounds, same-origin browser check, response timeout, no-store API responses, and a per-function-instance burst guard.
- No API key is exposed in the browser or committed to this repository. Ask AI sends the entered prompt and current bounded world settings to OpenAI; the API requests `store: false`. Provider processing remains subject to its terms and account-level controls.
- Dependency-light app using native HTML, CSS, and JavaScript modules.
- GitHub Actions checks for syntax, tests, and critical page assets.

The NCA executes a shared neural update rule with deterministic initialized weights, but those weights are not trained. It is a real neural cellular computation, not a learned organism; voxel inhabitants still use explicit scripted policies and are not driven by NCA output. The deterministic local world-spec compiler remains available as an explicit alternative. The server-side endpoint is implemented, but live AI operation still depends on a configured provider key and a successful production smoke test. Its in-memory burst limiter is not a global quota; a durable rate limiter and cost controls are required before broad public launch.

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

An independent Vercel project named `dots-living-world` exists and its deployment alias is `https://dots-living-world.vercel.app/`. It has no custom domains. The v0.5 deployment is uploaded manually. The GitHub integration status should be verified in Vercel Settings → Git before assuming that pushes will deploy automatically. Do not attach `artifex.engineer` or a subdomain to this project.

The existing repository `sohan-a11y/sohan-a11y.github.io`, its CNAME, DNS and Vercel project are outside this product and must not be changed. See [Hosting Architecture](docs/ARCHITECTURE_AND_HOSTING.md).

## Release plan

- [Production Roadmap](docs/PRODUCTION_ROADMAP.md): nine planned versions and eighteen milestone build artifacts.
- [Architecture and Hosting](docs/ARCHITECTURE_AND_HOSTING.md): browser/runtime boundaries, traffic strategy, and separation from Artifex.
- [v0.1 release notes](docs/RELEASES/v0.1.md).
- [v0.2 release notes](docs/RELEASES/v0.2.md).
- [v0.3 release notes](docs/RELEASES/v0.3.md).
- [v0.4 release notes](docs/RELEASES/v0.4.md).
- [v0.5 release notes](docs/RELEASES/v0.5.md).
- [v0.6 release notes](docs/RELEASES/v0.6.md).

## The architecture in one sentence

The **LLM** interprets goals, **DOTS** stores and tracks eligible persistent language-model updates, and the **NCA** executes local cellular dynamics. These are distinct subsystems with different capabilities and deletion guarantees.

## Original visual assets and attribution

The block/voxel visual language will use original models, shapes, and materials. This project does not use Minecraft branding, official textures, or proprietary character assets.
