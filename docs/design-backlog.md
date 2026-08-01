# Design backlog

Open design and quality work, derived from an `/impeccable critique` run on 2026-07-28
that scored the site **21/36 (58%, "Acceptable")**. Written to be read cold: a new
session should be able to start from this file without prior context.

The critique's own snapshot lives under `.impeccable/`, which is gitignored, so this
file is the durable record. Findings below were verified by measurement, not inferred.

> **Written before the Eleventy port.** Every finding still applies — the port was 1:1,
> so the markup and CSS these items describe are unchanged. Only the filenames moved:
> a component named `Hero.svelte` below is now
> `eleventy/_includes/sections/hero.njk`, `MasonryGallery.svelte` is
> `sections/masonry.njk` plus `eleventy/assets/masonry.js`, and `src/lib/motion.ts` is
> `eleventy/assets/animate.js`.

## What this site is

A photography portfolio for Mac Harness. Eleventy + Tailwind v4, fully static, dark
editorial aesthetic. Content is file-based and edited through
Sveltia CMS at `/admin` (see [cms.md](cms.md)).

Content lives in three places:

| Content | Source | Edited via |
| --- | --- | --- |
| Site copy (hero, about, contact, footer) | `src/lib/content/settings/homepage.json`, read through `eleventy/_data/site.js` | CMS → Site settings → Homepage |
| Projects | `src/lib/content/projects/*.md` | CMS → Projects |
| Gallery photos + captions + order | `src/lib/content/pictures/` (image + sibling `.md`) | CMS → Gallery |

## Decisions already made

- **Mac shoots portraits and automotive**, not weddings. The copy currently overstates
  weddings; see P1 below. Confirmed 2026-07-28.
- **Hosting moves to Cloudflare Pages** (reversed from Workers on 2026-07-31), *after*
  the repo transfers to Purple Crate Co, so account-bound resources are provisioned once.
  See [cloudflare-migration-plan.md](cloudflare-migration-plan.md).
- **Node 22** is pinned in `.nvmrc`, matching Cloudflare's build image.
- `.claude/` and `.impeccable/` are gitignored as per-machine tooling.

## Open work

Ordered by impact per unit of effort. Each item names the files to touch.

### P0 — Every italic is a browser-synthesised fake

`--font-serif` in `src/app.css` is `'Libre Caslon Display'`, which ships **no italic**.
Verified: `fonts.googleapis.com/css2?family=Libre+Caslon+Display:ital@1` returns HTTP
400, while `Libre+Caslon+Text:ital@1` returns 200. The browser therefore shears the
roman, which on a Caslon destroys the letterforms that make it a Caslon.

Seven files rely on it, including the contact headline at up to 128px:
`Gallery.svelte`, `Contact.svelte`, `About.svelte`, `Project.svelte`,
`gallery/+page.svelte`, `projects/+page.svelte`, `projects/[slug]/+page.svelte`.

Fix: switch to `Libre Caslon Text` with `family=Libre+Caslon+Text:ital,wght@0,400;1,400`
in `src/app.html`, keeping Display for the hero wordmark via a separate token. Or drop
every `italic` class and let `text-gold` carry the emphasis it already carries.

### P0 — 54 of 61 gallery images are announced as camera filenames

Measured in rendered DOM: `alt="_DSC0373"`, `alt="D7324228-2C59-47CB-8FAD-0959AB77B8B0"`.

Two causes:
- `src/lib/components/Pic.svelte` falls back to `pic.name` when the caption is empty,
  and all 61 files in `src/lib/content/pictures/*.md` ship `caption: ''`.
- `src/lib/components/Ph.svelte` uses its placeholder `label` as `alt`, so the two most
  important photographs render as `alt="HERO PORTRAIT"` and `alt="MAC · PORTRAIT"`.

Fix: give `Ph.svelte` an explicit `alt` prop and never fall back to the placeholder
label when a real `src` is supplied. Change `Pic.svelte`'s fallback from `pic.name` to
`''` — an unlabelled decorative image is better for a screen reader than a hex GUID.
Then write the 61 captions in the CMS; the field already exists.

### P1 — /gallery ships 7.5 MB and the responsive ladder has no small rungs

Measured 7,558 KB transferred, **identical at 375×812 and at desktop**. Each `<picture>`
emits only two candidates. For `_DSC0373`/`_DSC0374` (6000×4000 sources) the srcset is
`3000w | 6000w` against a 230 CSS px slot, so the smallest option is 13× too large.

Separately, the 7 files in `static/project-media/` (3.4 MB) bypass image processing
entirely: no srcset, no avif/webp. These are the project heroes and the homepage cover,
and they are also what the projects-table hover prewarm fetches.

Fix: the width ladder is now `WIDTHS` in `eleventy/_data/pictures.js`, already narrowed
to 480/800/1280/2000 by the port — re-measure before acting on this. Routing
`project-media` through the pipeline, or resizing the sources, is still open.

### P1 — Copy still leads with weddings

Given the positioning decision above, these strings in
`src/lib/content/settings/homepage.json` contradict the work:

- `hero.blurb` — "Portrait & wedding photographer…"
- `gallery.note` — "portrait, / wedding & editorial work."
- `contact.blurb` — "portrait sessions, weddings and editorial commissions"
- `about.services` — includes "Weddings"

Also `src/lib/components/Seo.svelte`'s default `description` and the `<Seo>` description
on `gallery/+page.svelte`, which are still in component source rather than the copy file.

This is now mostly a **CMS content edit**, not a code change. Note portraits are also
asserted but not shown: all three projects are automotive or coastal editorial.

### P1 — The homepage gallery is a dead end with a false affordance

`src/lib/components/Gallery.svelte` renders each tile as a `<figure>` with
`group-hover:scale-105` and **no `<a>`**, and the section has no link to `/gallery` at
all. Hover-scale is a universal "clickable" signal, so eight images teach the visitor
that images here don't respond, right before asking them to go look at 61 more.

Fix: wrap each figure in `<a href="/gallery">` with a real `aria-label`, add a "View all
N frames" link beside the year range, and rename the nav item in `NavBar.svelte` from
**Work** to **Gallery** so it matches the destination's own `<h1>`.

### P1 — Placeholder trust signals at the conversion point

In `settings/homepage.json`: `contact.follow_links` point at `https://instagram.com` and
`https://behance.net` (site roots, not profiles), "Journal" points at `#top`, and
`contact.phone` is `+351 912 000 000` as bare text with no `tel:` link. `contact.studio_lines`
claims Lisbon while the work is the Florida panhandle and a pit lane.

Fix: real profile URLs or delete those rows — an absent Instagram link is neutral, a link
to `instagram.com` is a tell. Delete "Journal" until a journal exists.

### P2 — Measured accessibility gaps

- **Contrast**: `--color-ink-faint` (`#6f6c66`) on `#070708` is **3.85:1**, failing
  4.5:1. It is only used at 10.5–13px, so the large-text allowance never applies.
  **26 failing nodes** (12 on `/`, 9 on `/projects`, 3 on `/gallery`, 2 on a project
  page). The other ink tokens pass at 17.8:1, 8.0:1 and 9.1:1.
- **Focus**: only 4 of 21 interactive elements on `/` have an authored `focus-visible`
  style, and 1 of 12 on `/projects`. Nav links, footer links and the mailto have none.
  Only `Button.svelte` and `MasonryGallery.svelte` define one.
- **Tap targets**: nav links are 16px tall ("Work" 37×16, "Contact" 65×16); the mobile
  hamburger is 40×40. Nothing meets 44×44.
- **Two `<h1>`** on the homepage (`MAC` and `HARNESS` in `Hero.svelte`) — one logical
  title split in two.
- **Reduced-motion** is honoured in `app.html`, `motion.ts` and `app.css`, but
  `MasonryGallery.svelte`'s FLIP and its `scrollTo({behavior:'smooth'})` check nothing,
  so the most kinetic surface is the one that ignores the setting. It also has no
  `Escape` handler and no `aria-expanded`.

### P2 — Repo weight before handover

`src/lib/content/pictures/` is **184 MB**, of which **139 MB is six committed `.NEF`
raws** (~23 MB each, all tracked, no gitignore rule). They ship nothing to the browser
(the glob only matches jpg/jpeg/png/webp) but bloat every clone. Worth resolving before
the repo changes hands.

## Smaller items

- `Hero.svelte` styles `.t-film`, an element that no longer exists, and the comment
  above it describes a composition that is gone.
- The hero runs three hardcoded layout regimes with magic percentages, so any copy
  change can break the wordmark overlap.
- Fonts load via a render-blocking third-party stylesheet with no preload, so the 232px
  hero wordmark FOUTs through Space Grotesk on first visit. Self-hosting would also drop
  a third-party dependency the new owner would otherwise inherit.
- `--font-sans` and `--font-display` are both `'Space Grotesk'`, so the display token is
  dead weight pretending to be a system.
- Two `placehold.co` runtime fallbacks (`ProjectsTable.svelte`, `MasonryGallery.svelte`)
  on an otherwise self-contained prerendered site.
- `gallery.note_years` says "2018 → 2026" while `/gallery`'s kicker says "2022 → 2026".
- `+error.svelte` uses `h-screen overflow-hidden`, which can clip the 404's own recovery
  links on a landscape phone with no way to scroll to them.
- `app.css` sets `overflow-x: hidden` on both `html` and `body` — a symptom of the hero's
  absolute positioning that will break any future `position: sticky`.

## Design questions still open

Not defects; genuine decisions.

1. **The palette.** `#c9aa6e` champagne-on-black is bridal-adjacent and fights motorsport
   subject matter. Portraits tolerate it. `pit-lane-pink.md` is offering a bolder accent.
2. **What is the reward for clicking a photograph?** Currently a tile roughly twice as
   wide, capped at 90vh, with no caption, no full resolution, no next/prev, and no exit
   but clicking again. On a photography site the click is the product.
3. **Rounded corners on photographs** (`rounded-2xl`, `RADIUS = 14`) make frames read as
   UI cards rather than prints.
4. **The homepage grid crops for you.** `Gallery.svelte` forces eight photographs into
   `auto-rows-[128px]` with hardcoded spans and `object-cover`, so a CSS array recomposes
   the frames. `/gallery` packs to intrinsic aspect ratios and gets this right.
5. **Does the overlapping wordmark survive being alone?** On mobile the blurb is hidden
   by `max-[760px]:hidden`, so the first screen is two same-size gold words and a
   "Book a session" pill with nothing explaining what is being booked.

## Verification notes

Two things could not be checked in the environment that produced this list, so treat
them as unverified rather than fine:

- **The masonry layout and FLIP animation were never seen running.** The layout effect
  guards on a `ResizeObserver` width, and observers don't fire in a non-compositing
  browser pane. Gallery tile geometry and per-tile tap targets are therefore unmeasured;
  the 7.5 MB payload is real regardless.
- **`:focus-visible` appearance was derived from CSS rules and class attribution**, not
  pixel-measured, because Tab did not move focus in that pane.
