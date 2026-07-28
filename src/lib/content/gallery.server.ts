import matter from 'gray-matter';
import { pictures, normalizePictureRef, type Picture } from './pictures';

/**
 * Gallery ordering and captions.
 *
 * Each image in ./pictures/ has a sibling metadata file (e.g. IMG_7250.jpg +
 * IMG_7250.md) carrying its caption and explicit sort order. Pairing them here —
 * rather than deriving order from filenames — is what lets the CMS reorder the
 * gallery and add captions without anyone renaming files.
 *
 * Server-only: gray-matter depends on Node's Buffer and can't run in the browser.
 * Route loaders call galleryPictures() and pass the result to components as data,
 * which also keeps the raw markdown out of the client bundle.
 */
const metaFiles = import.meta.glob('./pictures/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

type PictureMeta = {
	/** image filename this metadata describes, e.g. "IMG_7250.jpg" */
	image?: string;
	caption?: string;
	/** explicit sort position, ascending; unset sorts after all ordered entries */
	order?: number;
};

const basename = (path: string) => path.split('/').pop()!.replace(/\.[^.]+$/, '');

const byName = new Map(pictures.map((p) => [p.name, p]));

const naturalCompare = (a: string, b: string) =>
	a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

/** picture `name` -> its parsed metadata. */
function readMeta(): Map<string, PictureMeta> {
	const out = new Map<string, PictureMeta>();

	for (const [path, raw] of Object.entries(metaFiles)) {
		// The folder's README is not a metadata entry.
		if (basename(path) === 'README') continue;

		const data = matter(raw).data as PictureMeta;

		// Prefer the `image` field so an entry keeps working if the CMS names the
		// metadata file differently from the image; fall back to the filename pair.
		const name = data.image ? basename(data.image) : basename(path);

		// Skip metadata with no matching image rather than inventing a broken frame.
		if (!byName.has(name)) continue;

		out.set(name, data);
	}

	return out;
}

/**
 * All gallery pictures in editorial order, with captions applied.
 *
 * Ordering: entries with an explicit `order` come first, ascending; anything
 * without one follows in filename order. Images with no metadata file are still
 * included — dropping a file into ./pictures/ must never make it silently vanish.
 *
 * `id` is reassigned to a dense 1..N over the final order, which is what the
 * masonry layout keys and expand-state track.
 */
export function galleryPictures(): Picture[] {
	const meta = readMeta();

	const ordered = [...pictures].sort((a, b) => {
		const oa = meta.get(a.name)?.order;
		const ob = meta.get(b.name)?.order;

		if (typeof oa === 'number' && typeof ob === 'number' && oa !== ob) return oa - ob;
		if (typeof oa === 'number' && typeof ob !== 'number') return -1;
		if (typeof oa !== 'number' && typeof ob === 'number') return 1;

		return naturalCompare(a.name, b.name);
	});

	return ordered.map((pic, i) => {
		const caption = meta.get(pic.name)?.caption?.trim();
		return { ...pic, id: i + 1, ...(caption ? { caption } : {}) };
	});
}

/**
 * Look up pictures by `name`, preserving the given order and skipping misses.
 * References are normalised, so both `IMG_7250` and `IMG_7250.jpg` resolve.
 */
export function picturesByName(names: readonly string[]): Picture[] {
	const all = new Map(galleryPictures().map((p) => [p.name, p]));
	return names
		.map((n) => all.get(normalizePictureRef(n)))
		.filter((p): p is Picture => p !== undefined);
}
