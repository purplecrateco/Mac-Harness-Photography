/* Homepage blocks — the ordered section list from homepage.json, enriched with the data
 * the build computes.
 *
 * The homepage is a block list so the CMS can render a live preview of it: the preview
 * endpoint renders one partial at a time with the block bound to `sec`, so a partial may
 * only read `sec.*`. Anything a section needs that an editor doesn't type therefore has to
 * be folded into its block object HERE rather than read as a global in the template. That
 * is why `pics` and `project` below hang off blocks instead of being returned alongside
 * them.
 *
 * The two derivations are real logic, not presentation: "first four" means the first four
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

/** How many frames the "Selected Work" peek shows. */
const GALLERY_PEEK_COUNT = 8;

/** Strips a trailing image extension only, matching normalizePictureRef. */
const normalizePictureRef = (ref) => String(ref).replace(/\.(jpe?g|png|webp|avif|gif)$/i, '');

export default async function () {
	const all = await pictures();
	const { copy, featured } = await site();

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

	const project = featured
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
		: null;

	/* Attach the computed data to the blocks that need it. A type appearing more than once
	   is enriched every time, so duplicating a section in the CMS still renders. */
	const blocks = (copy.blocks ?? []).map((block) => {
		if (block.type === 'selected-work') return { ...block, pics: peekPics };
		if (block.type === 'featured-project') return { ...block, project };
		return block;
	});

	return { blocks };
}
