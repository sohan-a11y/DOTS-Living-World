# Architecture and Hosting Decisions

## Hosting isolation decision

Use a dedicated Vercel project connected only to this repository. Keep its default project hostname (a unique `.vercel.app` address) and do not assign a custom domain during the initial releases.

The GitHub source repository and public web deployment are separate concepts: this repository remains the source of truth, while Vercel builds and serves the web experience. A project slug derived from `DOTS-Living-World` is preferred, subject to availability. Do not reuse the existing Artifex Vercel project.

### Why not use GitHub Pages by default?

The separate Artifex site repository `sohan-a11y/sohan-a11y.github.io` is configured with a root `CNAME` containing `artifex.engineer`. GitHub's documented behavior says a user-site custom domain can be used by project sites under that account by default unless a project-specific custom domain overrides it. As a result, simply enabling Pages for this repository is not the safest way to guarantee separation from Artifex.

Reference: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages

A dedicated Vercel project without a custom domain avoids changing Artifex DNS or the existing Artifex site configuration. Do not create a `CNAME` file here for `artifex.engineer`.

## Current Vercel setup (2026-10-16)

- Separate Vercel project: `dots-living-world`.
- Project ID: `prj_J2w6vhYi2MZAiJffovY7l0luUwjy`.
- The current production alias is `https://dots-living-world.vercel.app/` and points to the manually uploaded v0.4 frontend deployment (`READY`), including `src/nca.js`, the NCA controls, and the cell-overlay renderer. Deploy the latest verified `main` commit to publish v0.5 authoring UI.
- The current deployment was uploaded manually. Vercel has not consistently allowed deployment inspection from every connector context, so treat the build state and uploaded file inventory—not a browser-based visual audit—as the verified evidence. Connect the GitHub integration as described below to automate future pushes.
- No custom domains are attached. Project SSO protection is configured for Preview deployments only; production is intended to be public.
- Initial frontend files were uploaded to this project manually. Vercel reported that the GitHub integration must be installed before it can connect the repository, so automatic deployment-on-push is not yet configured.

### Finish GitHub-to-Vercel automation

In the Vercel dashboard, open the **dots-living-world** project, go to **Settings → Git**, and connect `sohan-a11y/DOTS-Living-World`. Install/authorize Vercel's GitHub integration if requested, and grant access to this repository only if the provider offers repository-level access selection. Confirm that `main` is the production branch. Do not connect `sohan-a11y/sohan-a11y.github.io` or change the Artifex project.

After this connection, pushes to `main` should deploy this separate project, and pull requests should receive preview deployments subject to the project's protection settings. Verify the first automatic deployment before relying on it.

## Proposed web architecture

- **Web client:** Next.js/React + TypeScript, independently deployed. Three.js/React Three Fiber for 3D rendering and original voxel characters.
- **Render/simulation separation:** renderer and UI are separate from the NCA simulation worker. Keep expensive cell updates off the main UI thread. Use WebGPU where supported, benchmark a fallback, and degrade gracefully on lower-end devices.
- **NCA runtime:** begin with a bounded 2D/2.5D cellular field and a shared update rule. Humanoid voxel characters are world entities, not automatically NCA cells. Agent movement needs an explicit policy that consumes observations and optional NCA-generated signals.
- **LLM API:** server-side only; keys remain in secret storage. Convert prompts into a versioned, constrained JSON schema, validate it, and never execute arbitrary model-generated code.
- **DOTS service:** separate backend worker/service for the existing Open DOTS code. Keep source records and ledgers isolated by user or workspace. Benchmark before selecting a memory-sharing strategy.
- **Data services:** use durable storage for user accounts, saved world specs, experiment metadata, and ledger references. Store large artifacts separately from relational metadata.
- **Queue and limits:** long-running model operations use a bounded asynchronous job queue with quotas, concurrency controls, timeouts, idempotency keys, and retry policies.
- **Telemetry:** monitor client performance, errors, queue depth, model latency, GPU utilization, costs, abuse, and service health.

## High-traffic strategy

1. Make the public landing page and preset read-only world demos static/CDN-cacheable.
2. Simulate the world in the visitor's browser by default; do not send every simulation tick to the server.
3. Use presets and cached world specifications to avoid duplicate LLM calls.
4. Route write-enabled DOTS learning and LLM world generation through separately scaled backend services.
5. Apply anonymous quotas and per-user limits; expensive actions must not be unlimited public endpoints.
6. Add progressive degradation: if model services are overloaded or down, the visitor can still watch preset worlds.
7. Load test measured goals before claiming production traffic capacity.

High traffic can be handled with this division of responsibilities, but capacity is not guaranteed until the chosen host, model backend, rate limits, hardware, and budget have been load-tested.

## DOTS-specific safety boundary

Open DOTS uses a sparse memory branch added to a frozen transformer and logs source-associated write information for removal. Its paper's exact-removal result applies under stated assumptions to knowledge written through this mechanism; it is not a guarantee that pretraining knowledge or behavior independently learned by another model can be erased.

The paper reports a 262,144-slot value table holding approximately 235M fp32 parameters (about 0.94 GB) in its evaluated configuration. Do not allocate a full separate memory table per anonymous visitor without an explicit memory/concurrency benchmark. Investigate sparse per-tenant overlays, bounded active sessions, isolated workspaces, and cold persistence before production.

Reference implementation: https://github.com/sohan-a11y/open-dots

## Scope protection

This product must not:
- modify `sohan-a11y/sohan-a11y.github.io`;
- change the Artifex CNAME, DNS, Vercel project, or environment variables;
- publish a DOTS Living Worlds URL on `artifex.engineer` without a separate approval;
- claim Minecraft branding or copy Minecraft-owned textures, characters, or assets.
