import { latestProject } from '$lib/content/projects';
import { GALLERY_PEEK_COUNT } from '$lib/content/pictures';
import { galleryPictures, picturesByName } from '$lib/content/gallery.server';
import type { PageServerLoad } from './$types';

export const prerender = true;

// Number of gallery ("meta") images to feed the homepage collage alongside the cover.
const META_COUNT = 3;

// Resolved on the server — both the project frontmatter and the picture metadata are
// parsed with gray-matter, which relies on Node's Buffer and can't run in the browser.
// Only the homepage feature's meta is sent to the client (not the rendered html).
export const load: PageServerLoad = () => {
	const p = latestProject();

	// Editorial order + captions, same source the /gallery page uses.
	const all = galleryPictures();

	// The "Selected Work" peek (Gallery.svelte) shows the leading slice.
	const peekPics = all.slice(0, GALLERY_PEEK_COUNT);

	// Skip these below so the project collage never repeats a frame already on the page.
	const shownInGallery = new Set(peekPics.map((pic) => pic.name));

	// Resolve the project's gallery `name`s into enhanced-img Picture objects so the
	// collage can render responsive variants with correct aspect ratios. Preserves
	// frontmatter order, drops any name with no matching file, and skips frames the
	// gallery peek already shows above.
	const metaPics = picturesByName(p?.gallery ?? [])
		.filter((pic) => !shownInGallery.has(pic.name))
		.slice(0, META_COUNT);

	return {
		peekPics,
		latest: p
			? {
					slug: p.slug,
					title: p.title,
					cat: p.cat ?? null,
					year: p.year ?? null,
					cover: p.cover ?? null,
					intro: p.intro ?? null,
					metaPics
				}
			: null
	};
};
