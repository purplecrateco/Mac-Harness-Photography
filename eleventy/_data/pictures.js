/* Gallery pictures — the Eleventy port of src/lib/content/pictures.ts +
 * gallery.server.ts.
 *
 * Two things this has to preserve, because the masonry depends on both:
 *
 *  1. Intrinsic width/height known at BUILD time. MasonryGallery packs a greedy
 *     skyline from each frame's aspect ratio, so the layout is correct on first paint
 *     with no reflow. eleventy-img returns per-format metadata including width and
 *     height, which is what makes that possible without Vite.
 *  2. The same responsive ladder the enhanced-img build used —
 *     480/800/1280/2000 in avif + webp, with a jpeg fallback. Rungs are clamped to the
 *     intrinsic width and de-duplicated, so a 1560px original yields 480/800/1280/1560
 *     and nothing is ever upscaled. `widths` below includes null for exactly that: it
 *     emits the original width as its own rung rather than upscaling to 2000.
 *
 * Sidecar pairing matches gallery.server.ts: prefer the `image` field so an entry keeps
 * working when the CMS names the metadata file differently, and fall back to the
 * filename pair. `basename()` strips directory and extension both, which is why the
 * CMS-written `src/lib/content/pictures/IMG_7250.jpg` and the older bare `IMG_7250.jpg`
 * resolve identically.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import Image from '@11ty/eleventy-img';
import matter from 'gray-matter';

const PICTURES_DIR = 'src/lib/content/pictures';
const WIDTHS = [480, 800, 1280, 2000, null];
const IMAGE_RE = /\.(jpg|jpeg|png|webp)$/i;

const basename = (p) => p.split('/').pop().replace(/\.[^.]+$/, '');

/** Natural sort so IMG_9 precedes IMG_10, matching naturalCompare in pictures.ts. */
const naturalCompare = (a, b) =>
	a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

export default async function () {
	const entries = await fs.readdir(PICTURES_DIR);
	const imageFiles = entries.filter((f) => IMAGE_RE.test(f)).sort(naturalCompare);

	// --- sidecar metadata, keyed by picture name -----------------------------------
	const meta = new Map();
	for (const f of entries.filter((f) => f.endsWith('.md') && f !== 'README.md')) {
		const raw = await fs.readFile(path.join(PICTURES_DIR, f), 'utf8');
		const { data } = matter(raw);
		const name = data.image ? basename(data.image) : basename(f);
		// Skip metadata with no matching image rather than inventing a broken frame.
		if (!imageFiles.some((img) => basename(img) === name)) continue;
		meta.set(name, data);
	}

	// --- process every image ---------------------------------------------------------
	const pictures = [];
	for (const [i, file] of imageFiles.entries()) {
		const stats = await Image(path.join(PICTURES_DIR, file), {
			widths: WIDTHS,
			formats: ['avif', 'webp', 'jpeg'],
			outputDir: '_site/img/',
			urlPath: '/img/',
			// Content-hashed, so long-lived immutable caching stays correct.
			filenameFormat: (id, src, width, format) => `${basename(src)}-${width}.${id}.${format}`
		});

		// Largest jpeg is the <img src> fallback and carries the intrinsic dimensions.
		const jpegs = stats.jpeg;
		const largest = jpegs[jpegs.length - 1];
		const name = basename(file);
		const m = meta.get(name) ?? {};
		const caption = typeof m.caption === 'string' ? m.caption.trim() : '';

		pictures.push({
			name,
			caption: caption || undefined,
			order: typeof m.order === 'number' ? m.order : undefined,
			w: largest.width,
			h: largest.height,
			src: largest.url,
			// `sources` mirrors the enhanced-img shape the Svelte components consumed:
			// one srcset string per format, most-preferred first.
			sources: {
				'image/avif': stats.avif.map((s) => `${s.url} ${s.width}w`).join(', '),
				'image/webp': stats.webp.map((s) => `${s.url} ${s.width}w`).join(', ')
			},
			srcset: jpegs.map((s) => `${s.url} ${s.width}w`).join(', ')
		});
	}

	/* Editorial order: explicit `order` ascending first, then anything without one in
	 * natural filename order. Mirrors galleryPictures() in gallery.server.ts branch for
	 * branch, including the equal-order fallthrough to natural compare — images with no
	 * metadata file still appear, so nothing vanishes when a file is added outside the
	 * CMS. */
	pictures.sort((a, b) => {
		const oa = a.order;
		const ob = b.order;
		if (typeof oa === 'number' && typeof ob === 'number' && oa !== ob) return oa - ob;
		if (typeof oa === 'number' && typeof ob !== 'number') return -1;
		if (typeof oa !== 'number' && typeof ob === 'number') return 1;
		return naturalCompare(a.name, b.name);
	});

	/* `id` is a dense 1..N over the FINAL order, not the file order — the masonry keys
	 * frames and tracks expand state by it, so this has to be assigned after sorting. */
	return pictures.map((pic, i) => ({ ...pic, id: i + 1 }));
}
