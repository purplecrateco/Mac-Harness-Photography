import { latestProject } from '$lib/content/projects';
import { pictures, GALLERY_PEEK_COUNT } from '$lib/content/pictures';
import type { PageServerLoad } from './$types';

export const prerender = true;

// Number of gallery ("meta") images to feed the homepage collage alongside the cover.
const META_COUNT = 3;

// Resolve the most recent project on the server — gray-matter (used to parse the
// markdown frontmatter) relies on Node's Buffer, so it can't run in the browser.
// Only the homepage feature's meta is sent to the client (not the rendered html).
export const load: PageServerLoad = () => {
	const p = latestProject();

	// Pictures already shown in the homepage "Selected Work" peek (Gallery.svelte).
	// Skip these so the project collage never repeats a frame already on the page.
	const shownInGallery = new Set(pictures.slice(0, GALLERY_PEEK_COUNT).map((pic) => pic.name));

	// Resolve the project's gallery `name`s into enhanced-img Picture objects so the
	// collage can render responsive variants with correct aspect ratios. Preserves
	// frontmatter order, drops any name with no matching file, and skips frames the
	// gallery peek already shows above.
	const metaPics = (p?.gallery ?? [])
		.map((name) => pictures.find((pic) => pic.name === name))
		.filter((pic): pic is (typeof pictures)[number] => pic !== undefined)
		.filter((pic) => !shownInGallery.has(pic.name))
		.slice(0, META_COUNT);

	return {
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
