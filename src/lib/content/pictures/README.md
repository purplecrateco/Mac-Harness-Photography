# Gallery pictures

Each gallery photo is a pair of files in this folder:

```
IMG_7250.jpg   the image itself
IMG_7250.md    its metadata (caption + sort order)
```

Drop an image in and it appears on `/gallery` automatically. Add the sibling `.md`
to give it a caption and an explicit position.

## Metadata format

```yaml
---
image: IMG_7250.jpg
caption: 'Panning shot, front wheel sharp'
order: 12
---
```

- **`image`** — the image filename this entry describes. Preferred over the `.md`
  filename, so an entry keeps working if the CMS names the metadata file
  differently from the image.
- **`caption`** — used as the image's alt text and as its label in the gallery UI.
  Falls back to the filename when empty.
- **`order`** — ascending sort position. Entries with an `order` come first;
  anything without one follows in filename order.

## Behaviour notes

- An image with **no** `.md` file still shows up — it sorts after all ordered
  entries, by filename. Dropping a file in never makes it silently vanish.
- A `.md` file whose `image` doesn't match a real file is ignored rather than
  rendering a broken frame.
- Aspect ratios and responsive `webp`/`avif` variants are generated at build time
  by `@sveltejs/enhanced-img`, so the masonry layout is correct on first paint.
- Use **lowercase** extensions: enhanced-img only processes `.jpg`, `.jpeg`,
  `.png`, `.webp`; RAW (`.NEF`) files are ignored entirely.
- Project pages reference pictures by **filename without extension** in their
  `gallery:` frontmatter — see `../projects/*.md`. Renaming an image breaks those
  references.

While this folder has no images, the gallery falls back to a built-in placeholder
set.

## Where the code lives

- `../pictures.ts` — globs the images via enhanced-img (client-safe)
- `../gallery.server.ts` — parses this metadata and applies order + captions
  (server-only; gray-matter needs Node's Buffer)
