# Vercel → Cloudflare Migration Plan

Status: repo-side work done (steps 1–5). Account-bound work not started (steps 6–8).
Target: **Cloudflare Pages** — reversed from Workers on 2026-07-31, see "Decision" below.

## Context: this is a pre-launch first deploy, not a migration

The site has not launched. The Vercel deployment is a dev preview with no real
traffic, and ownership of the repo transfers to **Purple Crate Co** imminently.
Two consequences shape everything below:

1. **No cutover risk.** There is no live production traffic to protect, so this
   is a first-time domain setup rather than a migration with rollback. The
   elaborate DNS choreography an in-place migration would need does not apply.
2. **Provision account-bound resources exactly once, under the final owner.**
   Do not create a Cloudflare project under a personal account and move it
   later.

Split the work accordingly:

| Ownership-agnostic (do now, transfers free) | Account-bound (after transfer, in Purple Crate's accounts) |
| --- | --- |
| Adapter swap, `wrangler.jsonc`, `.nvmrc` | Cloudflare account + Pages project |
| Pictures-as-collection refactor | GitHub OAuth App (owned by the org) |
| `static/admin/` CMS config | `sveltia-cms-auth` Worker |
| Local verification via `wrangler pages dev` | Domain registration + DNS |
|  | `backend.repo` in the CMS config |

Sequence: repo work → transfer repo → provision in Purple Crate's accounts →
invite Mac → Mac populates real content → launch.

Note that the current project markdown is placeholder content, so Mac loading
real work through the CMS is part of launch. That puts the CMS refactor on the
critical path, not beside it.

## Decision: Pages

**Target is Cloudflare Pages.** An earlier revision of this plan argued for Workers;
that was reversed on 2026-07-31. What's built and verified is Pages:
`@sveltejs/adapter-cloudflare` in `svelte.config.js`, output `.svelte-kit/cloudflare`,
and a [`wrangler.jsonc`](../wrangler.jsonc) carrying `pages_build_output_dir`.

The case for Workers is recorded here because it hasn't gone away — it's the tradeoff
being accepted, not a mistake:

- **Build quota is the real cost.** Pages Free allows **500 builds/month** with **1
  build at a time**; Workers allows 3,000 build-*minutes* (~2,000 rebuilds at 90s).
  Every CMS save is a commit is a build, so the ceiling is on *editing activity*, not
  traffic. Steady state for a photography site is nowhere near 500 — but populating
  captions for 61 gallery photos one save at a time is a few hundred builds in an
  afternoon, and concurrent saves queue behind each other. Pro raises it to 5,000 if it
  ever bites.
- Cloudflare's SvelteKit framework guide now lives under Workers, and new platform work
  (Vite plugin, gradual deployments, remote dev, observability) lands there. The Pages
  docs carry a "Migrate to Workers" link in the sidebar.

Pages is **not deprecated**, its SvelteKit guide is current, and the same
`@sveltejs/adapter-cloudflare` serves both — so this is reversible. Switching later
means changing `wrangler.jsonc` and the deploy target, not the app.

What Pages gives in exchange: a simpler Git-integration flow, per-branch deploy
controls, and instant rollbacks in the dashboard.

## Migration surface

Grepping the codebase for Vercel-specific code turns up two hits, both the adapter
import and its doc comment in `svelte.config.js`. There is no `vercel.json`, no
`$env` usage, no `platform` access, no ISR config, and no Vercel image optimization.

Every content route is `prerender = true` (`/`, `/gallery`, `/projects`,
`/projects/[slug]`), so the build output is a static bundle plus a minimal
asset-serving worker. This is a config migration, not a port.

## 0. Prerequisite: clean the working tree

Uncommitted work must land first — migrating on a dirty tree makes it impossible to
distinguish a migration break from a pending-change break.

- Modified: `src/app.css`, `src/lib/components/About.svelte`,
  `src/lib/components/Hero.svelte`, `src/lib/components/Ph.svelte`
- Untracked: `static/hero.png`, `static/portrait.jpeg`, `hero.original.png`

`hero.original.png` (226 KB) sits in the repo root, outside `static/` — it looks like
a working file rather than a deployed asset. Decide whether it belongs in the repo
before committing.

Commit, push, confirm Vercel builds green. That green build is the rollback baseline.

## 1. Dependencies

Done.

```bash
npm rm @sveltejs/adapter-vercel @sveltejs/adapter-auto && npm i -D @sveltejs/adapter-cloudflare wrangler
```

`adapter-auto` goes too — unused once the adapter is explicit, and leaving it invites
confusion about which adapter is actually live.

`wrangler` is installed **explicitly** even though `@sveltejs/adapter-cloudflare` pulls
it in transitively — the `pages dev` / `pages deploy` commands here invoke it directly,
and depending on another package's transitive bin is how that breaks on a minor bump.

## 2. Adapter swap

Done — `svelte.config.js` imports `@sveltejs/adapter-cloudflare`; the `adapter()` call
and the `runes` compiler option are unchanged.

```js
import adapter from '@sveltejs/adapter-cloudflare';
```

## 3. Add `wrangler.jsonc`

Done — see [`wrangler.jsonc`](../wrangler.jsonc). The Pages shape, which is **not** the
Workers shape:

```jsonc
{
  "name": "mac-harness",
  "pages_build_output_dir": ".svelte-kit/cloudflare",
  "compatibility_date": "2026-07-31",
  "compatibility_flags": ["nodejs_compat"]
}
```

`pages_build_output_dir` is the Pages-only key, and it's what marks this as a Pages
project rather than a Worker — there's no `main` and no `assets` binding. One
consequence worth knowing: once that key is present, a deploy treats this file as
production config, so it has to stay production-ready.

**`nodejs_compat` is required, not insurance.** An earlier revision of this plan guessed
it was probably unnecessary since `gray-matter` and `marked` run at build time. That's
wrong: SvelteKit's own server entry imports `node:async_hooks` (via
`@sveltejs/kit`'s internal event module), and `wrangler pages dev` warns that the Worker
may throw at runtime without the flag. Adding it silences the warning; removing it
brings it straight back. Verified both ways.

## 4. Pin the Node version

Done — `.nvmrc` already pins `22`.

Cloudflare's build image defaults to Node 22.16.0; local is currently **Node 26.4.0**, which
is why the pin matters: silent local/CI drift produces builds that only fail in CI. (Node
26 is also what the old Vercel adapter refused outright — that failure disappeared with
the adapter swap, but the drift it exposed is real.)

`.nvmrc`:

```
22
```

Aside: `.npmrc` sets `engine-strict=true` but `package.json` has no `engines` field,
so the flag currently does nothing. Either add `engines` or drop the flag. Optional,
not blocking.

`.gitignore` already covers `.wrangler` and `.vercel` — no change needed.

## 5. Local verification (before touching DNS)

Note `pages dev`, not `dev` — the Workers command won't serve a Pages build. No path
argument needed; it reads `pages_build_output_dir` from `wrangler.jsonc`.

```bash
npm run build && npx wrangler pages dev
```

Route shapes — all confirmed on the real Pages build, 2026-07-31:

- [x] `/` — 200, hero photo serves and renders
- [x] `/gallery` — 200
- [x] `/projects` — 200
- [x] `/projects/[slug]` — all three (`golden-hour-gulf`, `idle-revs`, `pit-lane-pink`)
      return 200, so the `entries` generator in
      `src/routes/projects/[slug]/+page.server.ts` is emitting every one
- [x] `/does-not-exist` — 404 serving `src/routes/+error.svelte` (site nav present),
      not a Cloudflare default page
- [x] `/admin/` — 200, CMS loads with `config.yml`

Assets, where hosts differ most — all confirmed:

- [x] `static/project-media/` — all 7 files 200
- [x] `enhanced-img` output — `avif` **and** `webp` variants present in `srcset` at
      480w/800w/…, served as `Content-Type: image/avif`
- [x] Hashed assets — `Cache-Control: public, immutable, max-age=31536000`
- [x] Trailing slash — `/gallery/` 308s to `/gallery`. Worth an eye on the live site:
      this is Pages' redirect, and a change from what Vercel served would matter for
      any existing inbound links (there are none pre-launch).

Not yet checked: masonry aspect ratios and the expand interaction on `/gallery`, which
need a real browser rather than a status code.

## 6. Create the Cloudflare Pages project

Smoke-test with a direct upload first, then wire up Git:

```bash
npm run build && npx wrangler pages deploy
```

That gives a `*.pages.dev` URL — verify it end to end with the checklist above. Only
then connect the repo in the dashboard (**Workers & Pages → Pages → Connect to Git**):

| Setting                     | Value                    |
| --------------------------- | ------------------------ |
| Framework preset            | SvelteKit                |
| Build command               | `npm run build`          |
| Build output directory      | `.svelte-kit/cloudflare` |
| Production branch           | `master`                 |
| Root directory              | *(blank)*                |

Two notes:

- **Compatibility flags come from [`wrangler.jsonc`](../wrangler.jsonc)**, so there's no
  need to set `nodejs_compat` in the dashboard — and no risk of losing it if the project
  is recreated. If you ever delete that file, set the flag in the dashboard instead or
  the deploy can throw at runtime.
- **Node version.** The `.nvmrc` from step 4 is what Pages reads; don't rely on the
  build image default. Local is currently Node 26, which the *Vercel* adapter rejected
  outright — that failure is gone with the adapter swap, but the pin still matters to
  keep CI and local from drifting.

No environment variables or secrets to migrate — there are none. (The CMS OAuth relay of
[oauth-setup.md](oauth-setup.md) is a *separate* Worker with its own secrets; don't put
them here.)

## 7. Domain setup

Pre-launch, so this is a first-time setup with nothing to roll back to. No TTL
lowering, no parallel-running fallback, no propagation anxiety.

1. Confirm the `pages.dev` URL passes the step 5 checklist
2. Add the custom domain in Cloudflare, let the cert issue
3. Point DNS at it
4. Verify once from any device

If the domain isn't registered yet, register it in the Purple Crate account
directly — registering personally and transferring later is avoidable work.

## 8. Decommission Vercel

- Disconnect the Vercel GitHub integration, or every CMS commit triggers a
  wasted double build on both platforms
- Delete the local `.vercel/` directory (contains only stale `output/`)
- Delete the Vercel project — no need to keep it warm as a fallback, since it
  was never serving real traffic

## Risks, ranked

**`sharp` native install on the build image.** The most likely build failure. The
image is Ubuntu 24.04 / x86_64, so npm should pull the prebuilt `linux-x64` binary
cleanly — but `sharp` and `@resvg/resvg-js` are the only native deps, and native
binaries are where CI diverges from a Windows dev machine. This surfaces in step 6,
before any DNS change, which is why the manual `wrangler pages deploy` comes first.

**Build duration vs. the 20-minute cap.** 61 images through `sharp` on every commit,
no incremental cache. Fine today. Measure actual build time in step 6 and treat it as
the budget — if it's already several minutes, the gallery can't grow much before this
bites.

**404 handling.** The likeliest silent regression. Vercel and Cloudflare resolve
unmatched paths differently, and a broken error page won't appear in a happy-path
check. Test it explicitly.

**`scripts/generate-assets.js`** is invoked only by `npm run assets`, never by
`npm run build`, so it stays a local-only tool and needs no migration. Confirm that
never running it in CI is acceptable.

## Relevant limits (per account unless noted)

| Limit                | Workers Builds Free | Pages Free    |
| -------------------- | ------------------- | ------------- |
| Builds               | 3,000 build-min/mo  | 500 builds/mo |
| Concurrent builds    | 1                   | 1             |
| Build timeout        | 20 min per build    | —             |
| Max size per asset   | 25 MiB              | 25 MiB        |

Build minutes and concurrency are per *account*, not per domain or per project — so
other projects in the same account share the pool and the single concurrent-build
slot. Largest processable image in this repo is 8.5 MB (`DSC_0735.jpg`), well under
the asset cap; the 6 `.NEF` files never reach the build output.

## Licensing note

Cloudflare's free plan has no non-commercial restriction, so commercial use of the
site is fine — unlike Vercel's Hobby plan, which would require Pro for a site selling
photography. The old ToS §2.8 non-HTML concern does not apply: it was restructured in
May 2023, and Cloudflare's supplemental terms explicitly permit using Workers and
Pages to serve non-HTML content including image files (video is the carve-out).

## References

- SvelteKit on Workers: https://developers.cloudflare.com/workers/framework-guides/web-apps/svelte/
- Workers Builds limits: https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/
- Workers Builds build image: https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
- Workers Builds configuration: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Migrate from Pages to Workers: https://developers.cloudflare.com/workers/static-assets/migrate-from-pages/
- Updated Cloudflare ToS: https://blog.cloudflare.com/updated-tos
