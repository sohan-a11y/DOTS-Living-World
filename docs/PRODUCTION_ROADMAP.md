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

### v0.2 — Interactive world viewer
**Status: implemented in the v0.2 milestone build.**

- Interactive browser-rendered terrain with deterministic presets: Moss Basin, Crystal Ridge, and Ashen Frontier.
- Pan/zoom camera, keyboard navigation, reset view, pause/resume, visual pulse-speed selection, and reproducible seed regeneration.
- Selected-tile inspection and live world metrics.
- Runs locally in the browser with no LLM/DOTS backend dependency. It is not yet a trained NCA or living-agent simulator.

**Acceptance gate:** visitors can explore a stable demo without signing in or invoking an LLM backend.

### v0.3 — Voxel inhabitants and ecology
**Status: implemented as a bounded prototype.**

- Eight original pixel-block inhabitants with names, roles, and distinct colors, placed reproducibly on land tiles.
- Basic hunger and energy values, food-seeking/foraging, exploration, and resting through transparent scripted rules.
- Selectable inhabitants with state, recent event, movement-step count, and coordinates; simulation tick and population count are visible.
- Deterministic tests cover placement, state bounds, immutable step results, replay, and population limits.
- Resources/vegetation serve as renewable markers in this prototype; advanced resource depletion, hazards, reproduction, and learned policies are not implemented.

**Acceptance gate:** met for the prototype's scripted policies and inspectability. This is not a trained NCA, LLM-driven agent, or evidence of consciousness.

### v0.4 — NCA simulation core
**Status: implemented as an untrained local runtime prototype.**

- Five bounded state channels: alive, pigment, nutrient, signal, and age.
- Eight-neighbor perception per channel (center, local mean, and Laplacian response), fed to a shared 15-feature → 12-unit tanh hidden layer → 5-channel update network.
- Deterministically initialized network parameters with a stable growth prior, plus a reproducible per-cell update mask.
- Integrated 2D field overlay, show/hide control, single-step button, reset-to-seed, active-cell/tick metrics, and seed-based replay.
- Kept the NCA field separate from scripted voxel-agent controllers.
- Network weights have **not been trained**; no training loop, target organism, or learned behavior claim is included. Heavy use should be moved to a worker after profiling on representative devices.

**Acceptance gate:** bounded state, local neural updates, deterministic replay, inspectable controls, and unit tests are implemented. Training, visual acceptance in real browsers, and performance profiling remain future work.

### v0.5 — World specification builder
**Status: implemented as a constrained local authoring prototype; superseded by the v0.6 model-backed compiler path.**

- Natural-language instruction box with deterministic extraction of supported preset, seed, population, NCA radius, update rate, and overlay/engine toggles.
- Strict versioned JSON schema with explicit keys/ranges; unknown keys, unbounded populations, invalid seeds, and unsupported values are rejected.
- Inspectable JSON preview and explicit Apply-to-world action so users can review settings before the running world changes.
- The local compiler is retained as an explicit alternative and does not send prompt text to a server.

**Acceptance gate:** deterministic compilation, strict schema validation, visible preview/apply workflow, and tests pass.

### v0.6 — Server-side LLM world-spec compiler
**Status: endpoint and interface implemented; live provider activation remains credential-gated.**

- Same-origin `POST /api/world-spec` calls the OpenAI Responses API from the server using strict JSON Schema Structured Outputs.
- Revalidate model output through the existing application validator; reject unknown keys and out-of-range values before the result reaches the browser.
- Ask AI and Compile locally are separate actions. The app never silently disguises local compilation as an AI response.
- Server secret is `OPENAI_API_KEY`; optional `OPENAI_MODEL` defaults to `gpt-5-mini`. No key is shipped to the client or checked into source control.
- Apply request/body limits, same-origin checks, no-store API responses, timeout and provider error handling, plus a per-warm-instance burst guard.
- Production acceptance requires a configured key, a successful live provider test, a durable global quota, and cost ceilings.

**Acceptance gate:** unit tests cover bounded prompts/defaults, schema, output parsing/validation, refusals, incomplete responses, and local rate-limit behavior. Live LLM acceptance is explicitly pending until the production credential and smoke test are confirmed.

### v0.7 — DOTS knowledge integration
**Goal:** connect the existing Open DOTS continual-learning implementation without weakening its guarantees.

- Isolate a backend service/API for DOTS and the selected base LLM; do not load the training stack into every visitor's browser.
- Store each learned Dot's source, consent, timestamp, and removal status.
- Add teach/list/inspect/remove/reset APIs with authorization and audit logs.
- Preserve the distinction between exact removal of DOTS-written knowledge and model knowledge acquired during pretraining.
- Keep DOTS ledgers per user/workspace by default; do not silently mix public users' learning.
- Benchmark memory footprint, inference latency, deletion replay time, and concurrent-user cost before choosing a tenancy strategy.

**Acceptance gate:** tests cover learning, retrieval, removal, reset, user isolation, and known limits. No “forget everything” claim may be made for knowledge outside the DOTS ledger.

### v0.8 — World learning loop and sharing
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
