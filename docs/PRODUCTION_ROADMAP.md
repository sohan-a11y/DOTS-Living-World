# DOTS Living Worlds: Production Roadmap

## Plan at a glance

- **Milestone versions:** 9 (v0.1, v0.2, v0.3, v0.4, v0.5, v0.6, v0.7, v0.8, v1.0).
- **Planned milestone build artifacts:** 18 (Preview + Verified Candidate for each milestone).
- **Additional CI builds:** every relevant commit and pull request runs quality checks; these are not included in the 18-artifact planning baseline.
- **Production launch:** only v1.0, after the v0.8 public-beta gates and a final release candidate pass.
- **Hosting:** separate Vercel project connected to this repository, on its own default `.vercel.app` hostname. Do not attach `artifex.engineer` or change the Artifex website repository.

A “build artifact” means a versioned result from the build pipeline; it is different from a product version and from a user session. Each milestone gets a Preview artifact for review and a Verified Candidate artifact for acceptance testing. Earlier versions are not automatically published as the production experience.

## Product vision

A public web experience where visitors can watch a living artificial world with original block/voxel humanoid inhabitants; observe resource competition, movement, collective patterns, and recovery; and later describe changes to the world in natural language. DOTS supplies a source-tracked continual-learning mechanism for supported language-model knowledge. NCA supplies local cellular dynamics. These are distinct subsystems and must not be represented as one undifferentiated “learning brain.”

## Version-by-version plan

### v0.1 — Repository and deployment foundation
**Goal:** establish an isolated, testable web app.

- Create the app scaffold, routes, design tokens, responsive shell, and project-specific README.
- Configure type/lint/unit checks and a preview deployment connected only to this repository.
- Add environment-variable templates and secret scanning; no secrets committed.
- Verify the deployment uses a distinct default `.vercel.app` hostname and has no custom domain.
- Establish bundle-size and performance baselines.

**Acceptance gate:** the site builds reproducibly, works on mobile and desktop, automated checks pass, and the Artifex repo/domain remains untouched.

### v0.2 — Public world viewer
**Goal:** first visually meaningful page.

- Add the world viewport, camera controls, zoom, pause/resume, reset, speed controls, and a readable event/metric panel.
- Add a small deterministic demo world with preset seeds.
- Make world rendering resilient to resize and tab visibility changes.
- Add reduced-motion behavior and graceful fallback when GPU features are unavailable.

**Acceptance gate:** visitors can explore a stable demo without signing in or invoking an LLM backend.

### v0.3 — Voxel inhabitants and ecology
**Goal:** make the world feel inhabited.

- Add original blocky humanoid/voxel characters, simple skeleton/animations, names/roles, and readable silhouettes.
- Add resources, hazards, destinations, and basic needs/energy.
- Give inhabitants transparent, inspectable behavior policies and event history.
- Keep original models/materials; do not reuse Minecraft's protected assets or branding.

**Acceptance gate:** a short demo visibly shows inhabitants making distinct, explainable choices and responding to environmental changes.

### v0.4 — NCA simulation core
**Goal:** implement actual Neural Cellular Automata, not a visual effect labelled NCA.

- Define cell-state channels, neighborhood perception, a shared learned update rule, alive masks, update frequency, seeding, and deterministic run configuration.
- Start with a bounded 2D or 2.5D NCA field integrated into the 3D voxel world. Only add volumetric 3D NCA if benchmarks justify the cost.
- Run the simulation off the UI thread; use WebGPU where supported and a tested fallback path where practical.
- Add checkpoint/replay for seeds and simulation parameters.
- Separate the NCA field from the humanoid actor controller: NCA can influence environment and local signals, while agents use an explicit policy to move.

**Acceptance gate:** unit tests validate update rules, deterministic seed replay is documented, target behavior is measured against a baseline, and the UI stays responsive on representative devices.

### v0.5 — LLM world builder
**Goal:** let users describe a world and configure it safely.

- Implement natural-language prompt to strict JSON world-specification schema.
- Validate ranges, supported cell channels, available assets, runtime budget, and allowed objectives.
- Use server-side LLM calls; never expose API keys in the browser.
- Do not execute arbitrary code returned by the LLM. Only allow validated declarative specs.
- Add user-visible explanation of which settings the LLM changed and an undo/restore flow.

**Acceptance gate:** malformed or malicious output is rejected safely; common prompts produce reproducible configurations; request rate/cost limits work.

### v0.6 — DOTS knowledge integration
**Goal:** connect the existing Open DOTS continual-learning implementation without weakening its guarantees.

- Isolate a backend service/API for DOTS and the selected base LLM; do not load the training stack into every visitor's browser.
- Store each learned Dot's source, consent, timestamp, and removal status.
- Add teach/list/inspect/remove/reset APIs with authorization and audit logs.
- Preserve the distinction between exact removal of DOTS-written knowledge and model knowledge acquired during pretraining.
- Keep DOTS ledgers per user/workspace by default; do not silently mix public users' learning.
- Benchmark memory footprint, inference latency, deletion replay time, and concurrent-user cost before choosing a tenancy strategy.

**Acceptance gate:** tests cover learning, retrieval, removal, reset, user isolation, and known limits. No “forget everything” claim may be made for knowledge outside the DOTS ledger.

### v0.7 — World learning loop and sharing
**Goal:** connect language instruction, world execution, and measured feedback.

- Let users teach a supported rule or objective, run a controlled experiment, and compare before/after outcomes.
- Save world configurations, seeds, experiment summaries, and versioned rule/spec changes.
- Add shareable read-only world snapshots; private learning data is excluded unless explicitly shared.
- Add lineage for world specs, DOTS changes, NCA model versions, and evaluation results.
- Do not automatically convert user demonstrations into NCA weight updates until a reproducible training and rollback pipeline exists.

**Acceptance gate:** the system can reproduce a saved run, explain the source of each learned item, and compare outcomes under controlled conditions.

### v0.8 — Public beta, security, and scale
**Goal:** handle real visitors without making the website dependent on a single expensive model process.

- Serve static app assets through CDN-backed hosting.
- Run NCA updates in the client where practical; keep expensive DOTS/LLM jobs on a separately scaled backend.
- Add authentication where needed, anonymous-demo quotas, per-user/workspace limits, global rate limits, request validation, timeouts, concurrency limits, and abuse protection.
- Use a bounded asynchronous queue for expensive work, cache common safe specifications/results, and separate public demo state from private saved worlds.
- Add observability: errors, latency, WebGPU fallback rates, model costs, queue depth, rate-limit hits, and deployment health.
- Perform load, soak, recovery, dependency, accessibility, and cross-browser tests. Establish a cost budget and automatic shutdown/throttling rules.
- Document data retention and deletion behavior.

**Acceptance gate:** pass pre-agreed load targets and cost ceilings; no secrets exposed; no cross-user data leakage; the system degrades gracefully when the LLM/DOTS service is unavailable.

### v1.0 — Production release
**Goal:** release a stable, documented public product.

- Freeze feature scope and release a versioned candidate.
- Complete production security review, dependency and license audit, backup/restore check, operational runbooks, incident procedure, accessibility pass, and privacy disclosures.
- Verify production deployment, rollback, analytics consent, terms, content policy, and costs.
- Keep production launch separate from any Artifex domain change. A future custom domain is a separate approved project.

**Acceptance gate:** all v1.0 release criteria pass, the rollback path is tested, and the public demo does not require paid model calls for basic browsing.

## Definition of a build

For each milestone version:

1. **Preview build:** automatically deployed to an isolated preview URL for visual review and feedback.
2. **Verified Candidate build:** built from a named commit/tag and passed automated acceptance checks.

That gives a baseline of 18 milestone build artifacts. Every commit and PR may trigger further CI builds. A failed candidate is fixed and rebuilt; the number 18 is not a reason to ship a failing version.

## Shared release gates

Every version must pass:
- Static analysis, formatting/linting, type checks, and unit tests.
- Build verification and critical-path browser smoke tests.
- No credentials in client bundles or repository history.
- A responsive UI check at mobile and desktop widths.
- A documented known-limitations section.
- A working rollback or revert path.

Performance budgets and load targets will be defined by v0.2/v0.4 measurements rather than guessed before a baseline exists.
