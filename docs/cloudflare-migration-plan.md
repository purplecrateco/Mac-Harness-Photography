# Vercel → Cloudflare Migration Plan

Status: not started
Target: Cloudflare Workers (static assets), not Cloudflare Pages

## Why Workers rather than Pages

Cloudflare's SvelteKit framework guide now lives under Workers and is written for it —
`wrangler deploy` auto-detects SvelteKit and points at `.svelte-kit/cloudflare`. New
platform work (Vite plugin, gradual deployments, remote dev, better observability)
lands on Workers. Pages retains only native Early Hints and finer-grained branch
deploy controls, neither of which this site uses.

Pages is not deprecated and the docs carry no such banner, but there's no reason to
start a new deploy on the older path.

Build quotas also favour Workers for a CMS-driven site: 3,000 build-*minutes*/month
(per account) versus Pages' 500 build-*counts*/month. A ~90s rebuild triggered by a
CMS save costs 1/2000th of the monthly budget instead of 1/500th.

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

```bash
npm rm @sveltejs/adapter-vercel @sveltejs/adapter-auto && npm i -D @sveltejs/adapter-cloudflare wrangler
```

`adapter-auto` goes too — unused once the adapter is explicit, and leaving it invites
confusion about which adapter is actually live.

## 2. Adapter swap

In `svelte.config.js`, replace the import and drop the stale doc comment:

```js
import adapter from '@sveltejs/adapter-cloudflare';
```

The `adapter()` call and the `runes` compiler option stay exactly as they are.

## 3. Add `wrangler.jsonc`

```jsonc
{
  "name": "mac-harness-photography",
  "main": ".svelte-kit/cloudflare/_worker.js",
  "compatibility_date": "2026-07-28",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".svelte-kit/cloudflare",
    "binding": "ASSETS"
  }
}
```

Paths match Cloudflare's SvelteKit guide. `nodejs_compat` is probably unnecessary —
`gray-matter` and `marked` run at build time during prerendering, not in the worker —
but it's free insurance against a confusing failure if a server route is ever added.

## 4. Pin the Node version

Cloudflare's build image defaults to Node 22.16.0; local is 20.20.2. Both satisfy
Vite 8, but silent local/CI version drift produces builds that only fail in CI.

Add `.nvmrc`:

```
22
```

Aside: `.npmrc` sets `engine-strict=true` but `package.json` has no `engines` field,
so the flag currently does nothing. Either add `engines` or drop the flag. Optional,
not blocking.

`.gitignore` already covers `.wrangler` and `.vercel` — no change needed.

## 5. Local verification (before touching DNS)

```bash
npm run build && npx wrangler dev
```

Walk every route shape the app produces:

- [ ] `/` — hero, gallery peek, latest-project block
- [ ] `/gallery` — all 61 processed images, masonry aspect ratios correct, expand
      interaction, "from project" tag
- [ ] `/projects` — the table
- [ ] `/projects/golden-hour-gulf`, `/projects/idle-revs`, `/projects/pit-lane-pink` —
      the `entries` generator in `src/routes/projects/[slug]/+page.server.ts` must
      emit all three
- [ ] `/does-not-exist` — renders `src/routes/+error.svelte`, not a Cloudflare
      default page

Then verify assets, where hosts differ most:

- [ ] `static/project-media/` — all 7 files resolve (referenced from project
      frontmatter and markdown body)
- [ ] `enhanced-img` output: `avif`/`webp` variants present in `srcset` and served
      with correct `Content-Type`
- [ ] Hashed assets carry long-lived `Cache-Control: immutable`
- [ ] Trailing-slash behaviour matches what Vercel served

## 6. Create the Cloudflare project

Smoke-test manually first, then wire up Git:

```bash
npx wrangler deploy
```

Verify the `*.workers.dev` URL end to end using the checklist above. Only then
connect the repo in the dashboard (Workers → Connect to Git):

| Setting                       | Value                                |
| ----------------------------- | ------------------------------------ |
| Build command                 | `npm run build`                      |
| Deploy command                | `npx wrangler deploy` (default)      |
| Non-production branch command | `npx wrangler versions upload` (default) |
| Production branch             | `master`                             |
| Root directory                | *(blank)*                            |

No environment variables or secrets to migrate — there are none.

## 7. DNS cutover

The only step with real user-visible risk. Order matters:

1. Lower TTL on the current records 24h in advance
2. Confirm the `workers.dev` URL is fully verified
3. Add the custom domain in Cloudflare, let the cert issue
4. Switch DNS
5. Leave the Vercel deployment running until propagation completes — it's the
   instant rollback
6. Verify from a fresh network/device, not just a warm browser

## 8. Post-cutover cleanup

- Disconnect the Vercel GitHub integration, or every CMS commit triggers a wasted
  double build on both platforms
- Delete the local `.vercel/` directory (contains only stale `output/`)
- Delete or pause the Vercel project after a week of stable Cloudflare traffic

## Risks, ranked

**`sharp` native install on the build image.** The most likely build failure. The
image is Ubuntu 24.04 / x86_64, so npm should pull the prebuilt `linux-x64` binary
cleanly — but `sharp` and `@resvg/resvg-js` are the only native deps, and native
binaries are where CI diverges from a Windows dev machine. This surfaces in step 6,
before any DNS change, which is why the manual `wrangler deploy` comes first.

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
