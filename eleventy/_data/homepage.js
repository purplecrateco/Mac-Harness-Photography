/* Homepage-specific derivations — the port of src/routes/+page.server.ts.
 *
 * Kept in its own data file rather than computed in the template because the
 * de-duplication below is real logic, not presentation: "first four" means the first four
 * that aren't already on the page. Getting that wrong shows the same photograph twice.
 *
 * pictures() is re-invoked here rather than threaded through. eleventy-img skips images
 * whose output already exists, so the second call is a metadata pass (~200ms), not a
 * reprocess.
 */
import pictures from './pictures.js';
import site from './site.js';

/** How many of the featured project's own gallery pictures fill the homepage collage. */
const META_COUNT = 4;

/** How many frames the "Selected Work" peek shows. GALLERY_PEEK_COUNT in pictures.ts. */
const GALLERY_PEEK_COUNT = 8;

/** Strips a trailing image extension only, matching normalizePictureRef. */
const normalizePictureRef = (ref) => String(ref).replace(/\.(jpe?g|png|webp|avif|gif)$/i, '');

export default async function () {
	const all = await pictures();
	const { featured } = await site();

	// The "Selected Work" peek shows the leading slice of the ordered set.
	const peekPics = all.slice(0, GALLERY_PEEK_COUNT);

	// Skip these below so the project collage never repeats a frame already on the page.
	const shownInGallery = new Set(peekPics.map((pic) => pic.name));

	/* Resolve the project's gallery `name`s into picture objects so the collage renders
	   responsive variants with correct aspect ratios. Preserves the order they were
	   selected in, drops any name with no matching file, and skips frames the peek already
	   shows above. */
	const byName = new Map(all.map((p) => [p.name, p]));
	const metaPics = (featured?.gallery ?? [])
		.map((ref) => byName.get(normalizePictureRef(ref)))
		.filter(Boolean)
		.filter((pic) => !shownInGallery.has(pic.name))
		.slice(0, META_COUNT);

	/* Title split for the italic accent on the final word ("Salt & Silver" -> Silver), and
	   the "cat · year" line. Derived here rather than in the template: Nunjucks has no
	   split/reject filters, and this is string logic, not presentation. */
	const words = String(featured?.title ?? '')
		.trim()
		.split(/\s+/)
		.filter(Boolean);

	return {
		peekPics,
		featured: featured
			? {
					slug: featured.slug,
					title: featured.title,
					titleHead: words.slice(0, -1).join(' '),
					titleTail: words.at(-1) ?? '',
					cat: featured.cat ?? null,
					year: featured.year ?? null,
					meta: [featured.cat, featured.year].filter(Boolean).join(' · '),
					cover: featured.cover ?? null,
					intro: featured.intro ?? null,
					metaPics
				}
			: null
	};
}
