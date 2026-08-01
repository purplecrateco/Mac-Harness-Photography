/* Per-project page data — the port of projects/[slug]/+page.server.ts.
 *
 * Each project gets its `gallery` frontmatter resolved into full picture objects so the
 * mini-gallery renders responsive variants with correct aspect ratios. Frontmatter order
 * is preserved and any name with no matching file is dropped, matching picturesByName().
 *
 * Paginated over in eleventy/project.njk, which is what replaces SvelteKit's
 * EntryGenerator: one output page per markdown file, at build time.
 */
import pictures from './pictures.js';
import site from './site.js';

const normalizePictureRef = (ref) => String(ref).replace(/\.(jpe?g|png|webp|avif|gif)$/i, '');

export default async function () {
	const all = await pictures();
	const { projects } = await site();
	const byName = new Map(all.map((p) => [p.name, p]));

	return projects.map((p) => ({
		...p,
		// Kicker shows "cat · year" with the separator only when both exist.
		meta: [p.cat, p.year].filter(Boolean).join(' · '),
		galleryPics: (p.gallery ?? [])
			.map((ref) => byName.get(normalizePictureRef(ref)))
			.filter(Boolean)
	}));
}
