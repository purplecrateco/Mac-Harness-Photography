# Docs

Start here in a new session.

| Doc | What it covers |
| --- | --- |
| [design-backlog.md](design-backlog.md) | Open design and quality work, with decisions already made. The entry point for "what should I do next?" |
| [critique-2026-07-28.md](critique-2026-07-28.md) | The raw design critique the backlog came from (21/36), with the full heuristic table, persona walkthroughs, and what's working |
| [cms.md](cms.md) | How content is edited (Sveltia at `/admin`), what Mac needs, and the one step left before handing it to him |
| [oauth-setup.md](oauth-setup.md) | Runbook for the CMS "Sign In with GitHub" button — deploy the OAuth relay, register the app, set `base_url` |
| [cloudflare-migration-plan.md](cloudflare-migration-plan.md) | Moving hosting off Vercel, and what to provision only after the repo transfers |

Two things worth knowing before touching anything:

- **Site copy is data, not markup.** Hero, about, contact and footer strings live in
  `src/lib/content/settings/homepage.json` and reach components through
  `src/lib/content/copy.ts`. Edit the JSON (or the CMS), not the components.
- **Every content route is prerendered.** `src/routes/**` sets `prerender = true`, so
  the site builds to static HTML and content changes require a rebuild.
