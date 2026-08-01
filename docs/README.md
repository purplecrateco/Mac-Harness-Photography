# Docs

Start here in a new session.

| Doc | What it covers |
| --- | --- |
| [design-backlog.md](design-backlog.md) | Open design and quality work, with decisions already made. The entry point for "what should I do next?" |
| [critique-2026-07-28.md](critique-2026-07-28.md) | The raw design critique the backlog came from (21/36), with the full heuristic table, persona walkthroughs, and what's working |
| [cms.md](cms.md) | How content is edited (Sveltia at `/admin`), what Mac needs, and the one step left before handing it to him |
| [oauth-setup.md](oauth-setup.md) | Runbook for the CMS "Sign In with GitHub" button — deploy the OAuth relay, register the app, set `base_url` |
| [cloudflare-migration-plan.md](cloudflare-migration-plan.md) | Moving hosting off Vercel, and what to provision only after the repo transfers. Written pre-port — see the note at its top |

Three things worth knowing before touching anything:

- **Site copy is data, not markup.** Hero, about, contact and footer strings live in
  `src/lib/content/settings/homepage.json` and reach templates as `site.copy`, loaded by
  `eleventy/_data/site.js`. Edit the JSON (or the CMS), not the templates.
- **The site is fully static.** Eleventy writes plain HTML — no server, no Pages
  Functions — so content changes require a rebuild, which a CMS commit triggers.
- **It was ported 1:1 from SvelteKit** (commits up to `2231317`). Docs and comments that
  name a `.svelte` file are describing what a thing used to be; the file is in the git
  history, and the template that replaced it is `eleventy/_includes/sections/<name>.njk`.

`svelte-preview-plan.md` is gone: it designed a way to render Svelte components inside
the Pages CMS for live preview, and the Eleventy port was chosen instead precisely so
that wasn't needed. It's in the git history if the reasoning is ever wanted.
