# Mac Harness Photography

Portfolio site for a portrait and automotive photographer. Static site built with
[Eleventy](https://www.11ty.dev/) and Tailwind v4, hosted on Cloudflare Pages, with
content edited through a CMS rather than in the repo.

## Running it

```bash
npm install
```

```bash
npm run dev
```

That starts three watchers at once — Eleventy on `http://localhost:8080`, Tailwind, and
esbuild. All three are needed: Eleventy renders templates but builds neither the CSS nor
the client JS bundle.

```bash
npm run build
```

Writes the whole site to `_site/`. This is what Cloudflare Pages runs.

## Layout

| Path | What's there |
| --- | --- |
| `eleventy/` | Templates (`.njk`), page data (`_data/`), client JS (`assets/`), Tailwind entry (`css/`) |
| `src/lib/content/` | All editable content — homepage copy, projects, and the gallery's photo sidecars |
| `static/` | Copied to the site root as-is, including the Sveltia CMS at `/admin` |
| `scripts/` | Favicon and OG image generation, plus the headless assertion checks |
| `docs/` | Start at [docs/README.md](docs/README.md) |

Content stays under `src/lib/content/` because both CMS configs (`.pages.yml` and
`static/admin/config.yml`) point at those paths and the hosted CMS is live against them.

## Checks

```bash
npm run check:masonry
```

Runs the gallery's packing algorithm headlessly across 6 widths, collapsed and expanded:
asserts no overlapping frames, nothing off-stage, and aspect ratios preserved.

```bash
npm run check:contrast
```

Samples the actual hero photograph through the same cover-scale, brightness and scrim the
browser applies, and asserts every text zone clears WCAG AA at 6 viewports. Run it
separately from `check:masonry` — both use libvips and contend if run back to back.

## Notes

- **Copy is data, not markup.** Hero, about, contact and footer strings live in
  `src/lib/content/settings/homepage.json`. Edit that (or use the CMS), not the templates.
- **Everything is static.** No server, no Pages Functions, no `_worker.js` — content
  changes need a rebuild, which a CMS commit triggers.
- The site was ported 1:1 from SvelteKit. Comments naming a `.svelte` file are historical
  provenance; those files are in the git history, and the Nunjucks equivalents are
  `eleventy/_includes/sections/<name>.njk`.
