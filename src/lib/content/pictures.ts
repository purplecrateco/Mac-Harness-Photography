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
	/** filename without extension — used as alt text */
	name: string;
	/** fallback src (original-format, full-size) */
	src: string;
	w: number;
	h: number;
	/** mime-type → srcset of generated responsive variants */
	sources?: Record<string, string>;
};

/** All gallery pictures, ordered by filename (natural/numeric sort). */
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
