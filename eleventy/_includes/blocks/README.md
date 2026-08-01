# Homepage blocks

One partial per homepage section. `index.njk` renders them in the order the `blocks` array
in `src/lib/content/settings/homepage.json` lists them, with the block object bound to
`sec`.

## These are `.html`, not `.njk`

Deliberately, and it is not cosmetic. The CMS looks a partial up at
`<templatesDir>/<type>.html` — the extension is hardcoded in `getTemplatePath`
(`lib/preview/github-templates.ts`) — so a `.njk` file here is a partial the preview
reports as missing while the site renders it perfectly. That failure shows up in the CMS
only, which is exactly the kind of thing nobody notices for a week.

They're still Nunjucks: `htmlTemplateEngine` is `njk`, and `{% include %}` doesn't care
about the extension. Everything outside this directory stays `.njk`.

## The one rule: a block partial must be self-contained

Every partial here has to render correctly **on its own**, given nothing but `sec`. That
means no `{% import %}`, no `{% include %}`, no `{% extends %}`, and no reading of `site`,
`homepage`, `pictures` or any other global.

This isn't style. The CMS renders the live preview by fetching these partials out of the
repo and running them one at a time against the block currently in the editor form
(`lib/preview/render.ts` in `purplecrateco/purplecrate-cms`). It fetches *only* the partial
named by the block's `type` — a sibling like `macros.njk` isn't in its loader, so an
`{% import %}` throws and the section degrades to an error placeholder in the pane. Globals
are simply absent.

Consequences worth knowing before editing:

- **Shared markup is duplicated as a local `{% macro %}`.** `pic` and `ph` appear in more
  than one partial. That's the cost of the contract; the alternative was reimplementing the
  templates in the CMS, which is what this design exists to avoid. `_includes/macros.njk`
  is still shared by everything that is *not* a block (the layout, `projects.njk`,
  `project.njk`, `gallery.njk`, `404.njk`).
- **Computed data is attached to the block, not read as a global.** `sec.pics` and
  `sec.project` are folded in by `_data/homepage.js`. In the CMS preview they're absent,
  because it doesn't run Eleventy's data files — so each partial that uses them falls back
  to placeholder frames. An editor sees the real copy and layout with grey plates where the
  photographs go, which is the point: the copy is what they're editing.
- **Only `markdownify` and `{% icon %}` exist in the preview renderer.** Don't reach for
  `markdown`, `lines` or `json` here — those are this build's own filters, and a partial
  using one throws in the preview. Note that Nunjucks has no `split` either, so a block
  partial cannot break a string into lines at all: that's why the Selected Work note is
  stored as a **list of strings** rather than as text with line breaks. Multi-line copy in
  a block wants a list field.

`site.copy.footer_note` is deliberately *not* a block: the footer renders on every page,
not just the homepage, so it stays in the layout and keeps using `macros.njk`.
