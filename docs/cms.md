# CMS

Content is edited through a git-based CMS: every save is a commit to this repo, and the
site rebuilds from it. There is no database and no separate content service — the content
lives in `src/lib/content/` and travels with the repo.

**Two CMSes are configured right now, deliberately.**

| | Pages CMS | Sveltia CMS |
| --- | --- | --- |
| Where | Purple Crate's instance at `cms.purplecrate.co` | `/admin` on this site |
| Config | [`.pages.yml`](../.pages.yml) (`type:` syntax) | [static/admin/config.yml](../static/admin/config.yml) (`widget:` syntax) |
| Auth | Already solved — the instance holds the GitHub App | Needs an OAuth relay ([oauth-setup.md](oauth-setup.md)) or the token button |
| Local editing | No | Yes — zero-auth, straight into your working tree |

**Pages CMS is the intended path for Mac**, because the shared instance already handles
GitHub auth — that's what makes the Sveltia OAuth relay unnecessary for the handover.

Sveltia is kept because it is the only one offering **local mode**: `/admin` →
"Work with Local Repository" edits your working tree directly with no auth at all
(Chromium only). Don't delete `static/admin/` to tidy up — that's the feature you'd lose.

Two known differences after the switch:

- **Two different previews.** [static/admin/preview.js](../static/admin/preview.js) is
  Sveltia-only — a hand-written copy proof, useful for judging headlines that split across
  two fields. Pages CMS instead renders the **site's own templates**: the `_preview` field
  in [`.pages.yml`](../.pages.yml) makes it fetch `eleventy/_includes/blocks/<type>.html` out
  of this repo and run each one against the section in the form, so it cannot drift from
  what ships. That is what the Eleventy port bought.

  Two things to know about it. It needs the **site deployed** — the preview iframe loads
  `/assets/app.css` over the network, so until hosting exists the pane renders unstyled;
  set `baseHref` in `.pages.yml` once it does. And block partials must stay
  self-contained: see
  [eleventy/\_includes/blocks/README.md](../eleventy/_includes/blocks/README.md), because
  an `{% import %}` there breaks the preview and nothing else.
- **Gallery sidecars store a repo path, not a bare filename.** All 61 were migrated from
  `image: IMG_7250.jpg` to `image: src/lib/content/pictures/IMG_7250.jpg`, because Pages
  CMS resolves an image field's preview by matching the stored value against its media
  source's `output` prefix — a bare filename matches nothing, so the thumbnail comes up
  empty. The site is indifferent: `basename()` in `eleventy/_data/pictures.js` strips
  directory and extension both.

  **Project `gallery:` references are the opposite and must stay bare** (`IMG_7250`),
  because `normalizePictureRef()` strips the extension but *not* a directory. Two
  different fields, two different formats, on purpose. Don't "unify" them.

Nothing is installed into the app. The admin page is a static file that loads the
CMS from a CDN, so it adds nothing to the site bundle and has no build step.

## Running it locally (no auth needed)

Local mode edits files in your working tree directly — no GitHub, no tokens.
**Chromium only** (Chrome, Edge, or Brave with `#file-system-access-api` enabled);
it needs the File System Access API, which Firefox and Safari don't support.

```bash
npm run dev
```

Then open <http://localhost:8080/admin>, choose **Work with Local
Repository**, and pick this repo's root directory when prompted.

Edits land in your working tree as ordinary file changes. Sveltia performs no git
operations in local mode — review with `git diff` and commit yourself.

## What Mac needs

Exactly one thing: **a GitHub account with write access to this repo.**

He can sign up using **Continue with Google** — GitHub has supported Google social
login since July 2025 — so he never creates or remembers a GitHub password. Then he
accepts the repo invite and opens `/admin`.

**Which button he clicks depends on whether the OAuth Worker is deployed yet.**

| Button | Works? | What it needs |
| --- | --- | --- |
| **Sign In Using Access Token** | Yes, today | Nothing deployed. He generates a PAT from a link the dialog gives him (scopes pre-selected) and pastes it in. |
| **Sign In with GitHub** | Not yet | `base_url` in the config, pointing at a deployed OAuth relay — see below. |

Until the Worker exists, the token button is the way in. Two caveats that make it an
interim measure rather than the destination:

- **Tokens expire.** He has to generate a new one when it lapses, which is exactly the
  kind of task you don't want to walk a client through repeatedly.
- **The token lives in his browser's local storage**, so it's per-browser — a new
  laptop or a cleared profile means generating another.

That's the argument for finishing the OAuth setup before handover, not a blocker on
him starting to edit.

Set expectations with him on two points:

- **Saves are commits.** A change appears on the live site after a rebuild — a minute
  or two, not instantly.
- **Renaming a photo breaks its project links.** Project pages reference pictures by
  filename. Upload a new file rather than renaming an existing one.

## Still to do before handing it over

**Why "Sign in with GitHub" currently dead-ends.** Sveltia supports the OAuth
authorization code flow, but it needs an OAuth client server to hold the app secret —
the flow can't be completed from the browser alone. When `base_url` is absent, Sveltia
falls back to **using Netlify as the OAuth provider**, purely for Netlify CMS
backward compatibility. That fallback is the default, so a config with no `base_url`
silently points sign-in at Netlify. This site isn't on Netlify and has no Netlify
OAuth app, so the button goes nowhere.

To be explicit: **setting up Netlify is not the fix.** It's a compatibility path for
existing Netlify customers, and adopting it would mean taking on a hosting account the
project doesn't otherwise use. Deploy the relay instead.

**The fix is a step-by-step runbook: [docs/oauth-setup.md](oauth-setup.md).** In short —
deploy [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) as a Cloudflare
Worker, register a GitHub OAuth App, give the Worker the client ID and secret, then set
`base_url` in the config. Only that last step touches this repo.

Do the dashboard work **after** the repo transfers to Purple Crate Co, and register the
OAuth App to that org rather than a personal account — otherwise you stay permanently in
the loop for the client's logins. Same reasoning as
[the migration plan](cloudflare-migration-plan.md).

Meanwhile nothing is blocked: **local mode** covers your own editing, and the
**access-token** button covers Mac's (see the table above).

Note that PKCE — which would remove the need for a relay entirely — is *not* available
for GitHub. It's on GitHub's roadmap and was slated for Q4 2025 with no ship date;
Sveltia's docs call it out as unimplemented, and specifically warn that AI assistants
tend to claim otherwise by confusing it with GitLab, which does support it. Don't plan
around it until GitHub ships it.

## Content model

### Site settings → Homepage

One form, editing `src/lib/content/settings/homepage.json`. It holds two things.

The homepage copy is an ordered list of **sections** (Hero, Selected Work, Featured
project, About, Contact), which is what makes the rendered preview possible. They can be
reordered and removed, but they are not interchangeable: the hero carries the page's `<h1>`
and its own background, the tablet spacing rules assume Selected Work follows the hero, and
the scroll animations target sections by name. Reordering is safe; deleting the hero costs
the page its heading.

**Which project the homepage features.** *Featured project* is a picker over the
Projects collection storing that project's slug. The section then pulls the project's
title, intro, category, year and the **first four of its featured gallery pictures**
automatically — none of that is retyped here. Leave the field empty and the homepage
falls back to the newest project by year, which is what it did before the field
existed. A slug pointing at a deleted or renamed project falls back the same way, so
the section can't go blank.

Pictures already shown in the homepage's *Selected Work* peek are skipped, so the
same frame never appears twice on the page. A project whose first four pictures are
all in that peek will show fewer — pick pictures further down the gallery, or reorder
the gallery, if that happens.

**All homepage copy**, grouped by the section it appears in: Hero, Selected Work,
Featured project (the kicker only), About, Contact, plus the footer line. Two
conventions worth knowing:

- **Heading + accent.** Headings that end in italic gold words are split in two —
  *Heading* (`Frames that`) and *Heading — accent* (`last`). The full stop is added by
  the site, so don't type one.
- **Multi-line fields.** *Note*, *Studio lines* and similar render one line per line
  break. Blank lines are dropped.

The copy is loaded by [eleventy/\_data/site.js](../eleventy/_data/site.js) and reaches
templates as `site.copy`. To add a field: add it to the JSON, to the CMS config, and to
the section template that renders it. The *Footer line* renders on every page, not just
the homepage.

Nav links and the nav's own button label are not CMS-editable — they're site
navigation rather than copy, and live in
[eleventy/\_includes/sections/navbar.njk](../eleventy/_includes/sections/navbar.njk).

#### Preview pane

This file has a custom preview
([static/admin/preview.js](../static/admin/preview.js)) that lays the copy out section
by section in the site's fonts and updates as you type. Sveltia's default preview
lists fields one by one, which is no use for judging a headline that splits across two
fields.

It's a copy proof, not a staging site: no photos, no hero layout, no animation. To see
the real thing, save and look at the site.

### Gallery

One entry per photo, editing the paired files in `src/lib/content/pictures/`
(`IMG_7250.jpg` + `IMG_7250.md`):

| Field | Purpose |
| --- | --- |
| **Photo** | The image. Lowercase `.jpg`/`.jpeg`/`.png`/`.webp` — RAW is ignored by the build. |
| **Caption** | Alt text and the frame's label. Falls back to the filename when empty. |
| **Order** | Ascending; lowest first. Entries with no order sort last, by filename. |

Ordering is a numeric field, not drag-and-drop — sort the list by **Order** and edit
the numbers. Git-based CMSes can't drag-reorder entries stored as separate files.

An image with no metadata entry still appears on the site, so nothing vanishes if a
file is added outside the CMS. See
[the folder README](../src/lib/content/pictures/README.md) for the file format.

### Projects

Editing `src/lib/content/projects/*.md`: title, category, year, cover image, intro,
featured pictures, and a markdown body.

**Featured gallery pictures** is a picker over the Gallery collection, so photos are
selected rather than typed. It stores the filename; the site strips the extension when
matching, so both `IMG_7250` and `IMG_7250.jpg` resolve to the same photo. That's what
makes the existing hand-written frontmatter and CMS-written values interchangeable.

## Media folders

Two roots, deliberately:

- **`static/project-media/`** (default) — project cover images and images embedded in
  project bodies. Served at a real URL (`/project-media/...`), which those need: a
  `cover:` doubles as the page's `og:image` (scrapers want a plain JPEG at a stable
  URL, not an `avif`/`webp` srcset), and body images are rendered from markdown by
  `marked`, which emits raw `<img src>` with no chance to swap in a processed asset.
  Nothing here gets responsive variants, so **keep uploads at or under 2000px on the
  long edge** — the browser downloads whatever is in this folder at full size. The
  committed files were re-encoded once to that budget (progressive JPEG, quality 76).
- **`src/lib/content/pictures/`** (Gallery collection override) — gallery photos.
  Processed at build time by `@11ty/eleventy-img` into hashed responsive variants,
  so they're never served from that path directly and its `public_folder` is
  meaningless.

## Editing the config

The config is validated against a published JSON schema, referenced on line 1 of the
file, so an editor with YAML language support will flag mistakes inline. Two things
that schema validation will *not* catch:

- **Conditionals don't exist.** `{{#if field}}` renders literally. Use the `default`
  filter: `{{caption | default('(no caption)')}}`. Available transformations are
  `upper`, `lower`, `slugify`, `truncate`, `default`, `ternary`, and `date`.
- **There's no extension-stripping filter**, which is why the Gallery collection sets
  no explicit `slug`. Entries created through the CMS get a filename derived from the
  image including its extension (`img_7250-jpg.md`). That's cosmetic only — metadata is
  paired to images by the `image` field, not the filename.
