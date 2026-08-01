# Plan: rendered preview for Svelte sites in the Pages CMS fork

Goal: give the `preview` field in `purplecrateco/purplecrate-cms` a second renderer so it
works for SvelteKit sites, not just Eleventy/Nunjucks ones — so Mac edits the homepage in
the page-builder view and sees the real page.

This plan belongs with the fork; it lives here because that's where the companion endpoint
would be built.

---

## The constraint that decides the design

Rendering a Svelte component server-side is trivial:

```js
import { render } from 'svelte/server';   // svelte 5.56.2, exports exactly one thing
const { head, body } = render(Component, { props });
```

The problem is getting `Component`. The current Nunjucks renderer fetches partials from the
target repo and renders them — text in, HTML out, no build step. **Svelte components cannot
be treated that way**, because this repo's components depend on the Vite module graph, not
just on Svelte:

| Dependency in the source | Who resolves it | Works with `svelte/compiler` alone? |
| --- | --- | --- |
| `$lib/components/Hero.svelte` (7 such imports in `+page.svelte`) | SvelteKit alias config | No |
| `import.meta.glob('./pictures/*.{jpg,jpeg,png,webp}', …)` in `pictures.ts` | Vite | No — Vite-only API |
| `query: { enhanced: true, w: '480;800;1280;2000' }` on that glob | `@sveltejs/enhanced-img` Vite plugin | No — build-time image processing |
| `$app/*`, `$env/*` | SvelteKit runtime | No |
| Tailwind v4 utility classes | `@tailwindcss/vite`, emitted as **hashed** files (`0.BrHSzHs8.css`) | No, and the filename changes every build |

So "embed a Svelte renderer" is really "embed a **Vite** module graph", which is a different
proposition from embedding a template engine. The hashed CSS also rules out the static
`stylesheets:` list the Eleventy sites use — sheets must be discovered from a built page.

---

## Options

| | A. Vite SSR in the CMS | B. Proxy to the site's own SSR | C. Prebuilt render bundle |
| --- | --- | --- | --- |
| Where Svelte runs | In the Next.js process | In the target site's deployment | In the CMS, sandboxed |
| Needs repo checkout + `npm install` per site | Yes | No | No |
| Real `enhanced-img` output | Yes | Yes | Yes (baked at build) |
| Real Tailwind CSS | Yes | Yes | Yes |
| Executes client repo code in the CMS | **Yes — RCE by design** | No | Yes, isolated |
| Per-site work | None | One endpoint | Build step + contract |
| Ops weight | High (memory, cold start, disk) | Low | Medium |

### Recommended: B — proxy to the site's own SSR

The site already knows how to render itself. Give it an endpoint, and have the CMS treat it
the way it currently treats Nunjucks partials — as something fetched, never reimplemented.
That is the same principle the existing renderer was built on (the README notes the old
Decap preview reimplemented templates in React and rotted); B just applies it one level up.

```
entry form (react-hook-form)
   │ useWatch(<section object>) ──debounce 300ms──┐
   │                                              ▼
   │        POST /api/[owner]/[repo]/[branch]/preview   { name, data }
   │                                              │
   │        renderer: "proxy" → POST {previewUrl}/__preview  { data }
   │        (URL resolved server-side from repo config, never the client)
   │                                              │
   ▼                                              ▼
side pane ◀── postMessage("render") ── sandboxed iframe (site's own CSS)
```

Everything above the renderer — debounce, iframe, `postMessage`, drawer, split view,
click-to-select — is reused unchanged. The only new code in the fork is a renderer strategy
that forwards instead of templating.

---

## Work breakdown

### Fork: `purplecrateco/purplecrate-cms`

1. **Renderer strategy indirection.** `lib/preview/render.ts` currently assumes Nunjucks.
   Introduce `options.renderer: nunjucks | proxy` (default `nunjucks`, so every existing
   Eleventy site is untouched). Add `lib/preview/render-proxy.ts`.
2. **New `preview` options**, resolved server-side only, like `templates` is today:
   `renderer`, `previewUrl`, and a shared-secret env var name. Never trust a
   client-supplied URL — same rule the README already states for template paths.
3. **Watch a fixed object, not just `blocks`.** The field currently does
   `useWatch("blocks")` and previews an array of typed blocks. `homepage.json` is a fixed
   object of named sections (`hero`, `gallery`, `project`, `about`, `contact`,
   `footer_note`). Allow `watch` to name an object and pass it through whole. This is the
   smaller half of the "page builder" ask and avoids rearchitecting the site.
4. **Section mapping for click-to-select.** Builder view maps a click to a form path. With
   blocks that's an array index; with named sections it's a key. Have the site emit
   `data-preview-section="hero"` and map on that.
5. **Degradation.** A non-200 or timeout from the site renders a labelled placeholder, the
   way a missing partial does now — one failure never blanks the pane.

### This repo: `Mac-Harness-Photography`

6. **`POST /__preview` endpoint** (`src/routes/__preview/+server.ts`), `prerender = false`:
   accepts a homepage-copy object, validates it against the `HomepageCopy` type in
   [copy.ts](../src/lib/content/copy.ts), merges over the committed values so a partial
   payload is fine, and renders the real section components with `render()` from
   `svelte/server`.
7. **Make copy injectable.** `copy.ts` currently imports `homepage.json` at module scope.
   The sections need to accept copy as props (or via context) so the endpoint can pass draft
   values. Mechanical but touches every section component.
8. **Return the CSS links.** Read the built `<head>` so the response carries the current
   hashed stylesheet URLs. Solves the hashing problem without the CMS guessing.
9. **Protect it.** Require a shared secret header; refuse when absent. It renders arbitrary
   supplied copy, so it should not be an open endpoint.
10. **Add `data-preview-section`** to each section wrapper for click-to-select.

### `.pages.yml` here, once both sides exist

```yaml
- name: _preview
  label: Preview
  type: preview
  options:
    renderer: proxy
    watch: .                       # the whole settings object, not a blocks array
    previewUrl: https://<pages-preview-host>
```

---

## Security

Non-negotiable, and the main reason B beats A: option A compiles and executes code from a
client repository inside the CMS process, which holds GitHub App credentials and the Neon
connection string. That is arbitrary code execution with access to every client's secrets.
If A is ever pursued it needs a separate process with no env access, no database, and egress
blocked — not a library call inside Next.js.

B has no such exposure: the site renders its own code in its own deployment, and the CMS
only forwards JSON and receives HTML. The HTML still lands in a **sandboxed** iframe.

---

## What still won't be perfect

Inherited from the existing preview, and worth setting expectations with Mac:

- **Site JavaScript doesn't run** in the preview — it's CSS-only. Here that means the GSAP
  intro and scroll reveals don't play, and the gallery's expand interaction is inert.
  Sections whose start state is `opacity: 0` need their armed state neutralised, or the
  preview looks empty. (The `.motion-armed` rules in `app.css` are exactly this hazard.)
- **Images uploaded this session** aren't deployed yet, so they 404 until save + deploy.
- **Entrance animations** are collapsed to near-zero so they don't restart on every
  keystroke; a looping animation appears frozen.

---

## Phasing

1. **Ship the cheap win first**: point the CMS at a `draft` branch with its own Cloudflare
   Pages URL, or add an `actions` button that dispatches a deploy workflow. Mac gets the
   real page in ~90s with zero renderer work. Do this regardless — it's the fallback when
   the preview is wrong, and the only thing that shows animations correctly.
2. Endpoint in this repo (6–10), verified by POSTing draft copy with curl and diffing
   against the built homepage.
3. Renderer strategy in the fork (1–2), pointed at the endpoint.
4. Named-section `watch` and click-to-select (3–5).
5. Only then consider whether any of this generalises enough to be worth option C.

Steps 2 and 3 are independently testable, which is the point of the ordering: a broken
preview should never be ambiguous about which side broke.
