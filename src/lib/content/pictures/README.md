# Gallery pictures

Drop image files (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`) into this folder
and they are picked up automatically by the `/gallery` page — no code change needed.

- Images are ordered by filename using a natural/numeric sort, so prefixing names
  with `01-`, `02-`, … controls the sequence.
- Aspect ratios are detected from each image as it loads; the masonry layout reflows
  to fit. Mixed portrait/landscape sizes are fine.
- The filename (without extension) is used as the image alt text.

While this folder has no images, the gallery falls back to a built-in placeholder set.
