# CMS (Sveltia)

The site's content is edited through [Sveltia CMS](https://sveltiacms.app), served
from `/admin`. It's a git-based CMS: every save is a commit to this repo, and the
site rebuilds from it. There is no database and no separate content service — the
content lives in `src/lib/content/` and travels with the repo.

- Admin page: [static/admin/index.html](../static/admin/index.html)
- Config: [static/admin/config.yml](../static/admin/config.yml)

Nothing is installed into the app. The admin page is a static file that loads the
CMS from a CDN, so it adds nothing to the site bundle and has no build step.

## Running it locally (no auth needed)

Local mode edits files in your working tree directly — no GitHub, no tokens.
**Chromium only** (Chrome, Edge, or Brave with `#file-system-access-api` enabled);
it needs the File System Access API, which Firefox and Safari don't support.

```bash
npm run dev
```

Then open <http://localhost:5173/admin>, choose **Work with Local
Repository**, and pick this repo's root directory when prompted.

Edits land in your working tree as ordinary file changes. Sveltia performs no git
operations in local mode — review with `git diff` and commit yourself.

## What Mac needs

Exactly one thing: **a GitHub account with write access to this repo.**

He can sign up using **Continue with Google** — GitHub has supported Google social
login since July 2025 — so he never creates or remembers a GitHub password. Then he
accepts the repo invite, opens `/admin`, clicks **Sign in with GitHub**, and approves
once. After that it's just a URL he visits.

Set expectations with him on two points:

- **Saves are commits.** A change appears on the live site after a rebuild — a minute
  or two, not instantly.
- **Renaming a photo breaks its project links.** Project pages reference pictures by
  filename. Upload a new file rather than renaming an existing one.

## Still to do before handing it over

Remote editing needs an OAuth relay — the CMS can't complete a GitHub sign-in without
one. Deploy [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) as a
Cloudflare Worker, register a GitHub OAuth App, and add the Worker's URL as
`base_url` under `backend` in the config.

Do that **after** the repo transfers to Purple Crate Co, and register the OAuth App
to that org rather than a personal account — otherwise you stay permanently in the
loop for the client's logins. Same reasoning as
[the migration plan](cloudflare-migration-plan.md).

Until then, local mode is fully functional for your own editing.

## Content model

### Site settings → Homepage

One form, editing `src/lib/content/settings/homepage.json`. It holds two things.

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

The copy is read by [src/lib/content/copy.ts](../src/lib/content/copy.ts), which is
the place to look when adding a field: add it to the JSON, the type there, the config,
and the component. The *Footer line* renders on every page, not just the homepage.

Nav links and the nav's own button label are not CMS-editable — they're site
navigation rather than copy, and live in `NavBar.svelte`.

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
  project bodies. Served at a real URL (`/project-media/...`), which those need.
- **`src/lib/content/pictures/`** (Gallery collection override) — gallery photos.
  Processed at build time by `@sveltejs/enhanced-img` into hashed responsive variants,
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
