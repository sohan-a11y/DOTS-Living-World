# DOTS Living Worlds

**A public, interactive artificial-world experience powered by Neural Cellular Automata (NCA), an LLM, and DOTS continual learning.**

The goal is to let visitors enter a visually rich world, watch original voxel-style humanoid inhabitants interact with their environment, and eventually create or teach new world behaviors through natural language.

## Product principles

- **NCA is the local dynamics engine.** Cells update from neighborhood state using a learned local rule. It is responsible for self-organizing spatial behavior, not language understanding.
- **The LLM is the world-authoring interface.** It translates user requests into a constrained, validated world specification and proposes experiments. It must not generate code that is executed directly.
- **DOTS is the persistent knowledge layer.** It tracks learnable knowledge units and supports controlled source-specific removal under its design assumptions. The product must distinguish DOTS-owned information from facts already present in the base model and from behavior learned by an NCA.
- **Voxel inhabitants are original characters.** Use a blocky, Minecraft-like visual language without copying Minecraft characters, textures, logos, or proprietary assets.
- **Public browsing should be cheap.** Static assets and the main simulation should run in the visitor's browser where feasible. LLM and DOTS operations must be rate-limited and handled by a separate backend.
- **Security and privacy by design.** Do not share one user's private learning ledger with another user by default.

## Hosting isolation

The source of truth for this product is this repository only. Deploy it as a separate Vercel project connected only to this repository, using its separate default `.vercel.app` hostname. Do not attach `artifex.engineer` or any Artifex subdomain without a separate explicit decision.

Do not modify `sohan-a11y/sohan-a11y.github.io`, its deployment workflow, CNAME, DNS, or project settings. GitHub Pages is not the chosen default because the Artifex user-site custom domain can affect project-site URL behavior.

Hosting and production choices are documented in [the architecture plan](docs/ARCHITECTURE_AND_HOSTING.md).

## Release plan

We plan **9 milestone versions** from v0.1 to v1.0, with **18 planned milestone build artifacts** (one Preview build and one Verified Candidate build per version). CI runs on individual commits and pull requests will add more test builds, so 18 is a planning baseline, not a cap on CI executions.

See [Production Roadmap](docs/PRODUCTION_ROADMAP.md) for version-by-version scope, acceptance gates, and release criteria.

## Current status

Planning baseline only. The application has not been implemented or deployed yet. Each version should be built, tested, and reviewed separately before moving to the next milestone.
