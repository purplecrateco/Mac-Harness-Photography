/**
 * Gallery pictures live in ./pictures/* and are processed at build time by
 * @sveltejs/enhanced-img (configured in vite.config.ts). Each match resolves to a
 * Picture object carrying the intrinsic width/height *and* responsive webp/avif
 * variants, so:
 *   - the masonry layout knows aspect ratios up front (no client reflow / SSR-safe), and
 *   - the browser downloads small, format-optimised images instead of the multi-MB
 *     originals.
 *
 * Drop image files into src/lib/content/pictures/ and they appear automatically —
 * no manifest to maintain. Use lowercase extensions: enhanced-img only processes
 * lowercase, and RAW (.NEF) files are ignored.
 */
type EnhancedPicture = {
	img: { src: string; w: number; h: number };
	sources?: Record<string, string>;
};

const files = import.meta.glob('./pictures/*.{jpg,jpeg,png,webp}', {
	eager: true,
	query: { enhanced: true },
	import: 'default'
}) as Record<string, EnhancedPicture | string>;

export type Picture = {
	id: number;
	/**
	 * Filename without extension. This is the picture's stable *identity*, not its
	 * label: project frontmatter `gallery:` entries reference it, and the gallery's
	 * "from project" tag is looked up by it. Do not repurpose it for display text —
	 * use `caption` for that.
	 */
	name: string;
	/**
	 * Editorial caption from the picture's metadata file, used as alt text when
	 * present. Populated server-side by gallery.server.ts; undefined here.
	 */
	caption?: string;
	/** fallback src (original-format, full-size) */
	src: string;
	w: number;
	h: number;
	/** mime-type → srcset of generated responsive variants */
	sources?: Record<string, string>;
};

/**
 * Every gallery image found on disk, ordered by filename (natural/numeric sort).
 *
 * This is the raw set. Editorial ordering and captions live in the sibling
 * metadata collection (`pictures/*.md`) and are applied by `galleryPictures()`
 * in gallery.server.ts — that parsing needs gray-matter, which depends on Node's
 * Buffer and can't run in the browser, so it stays server-side.
 *
 * Consumers that just need "which images exist" (or a fallback when no metadata
 * has been written yet) can use this directly; it is client-safe.
 */
export const pictures: Picture[] = Object.entries(files)
	.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
	// Defensive: enhanced-img leaves unprocessable files as a plain URL string
	// (e.g. an uppercase extension). Skip those rather than crash the build.
	.filter((entry): entry is [string, EnhancedPicture] => typeof entry[1] === 'object' && !!entry[1]?.img)
	.map(([path, data], i) => ({
		id: i + 1,
		name: path.split('/').pop()!.replace(/\.[^.]+$/, ''),
		src: data.img.src,
		w: data.img.w,
		h: data.img.h,
		sources: data.sources
	}));

/**
 * Normalise a picture reference to a `name`.
 *
 * References reach us in two shapes: bare (`IMG_7250`) from hand-written project
 * frontmatter, and with an extension (`IMG_7250.jpg`) from the CMS, which stores
 * the uploaded filename. Strip a trailing image extension so both resolve to the
 * same picture — otherwise a photo added through the CMS would silently fail to
 * link to its project.
 */
export const normalizePictureRef = (ref: string) =>
	ref.replace(/\.(jpe?g|png|webp|avif|gif)$/i, '');

/**
 * How many pictures the homepage "Selected Work" peek shows (Gallery.svelte).
 * Shared so the homepage project collage can skip these and avoid showing the
 * same frame twice on one page.
 */
export const GALLERY_PEEK_COUNT = 8;
