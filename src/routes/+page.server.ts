import { latestProject } from '$lib/content/projects';
import type { PageServerLoad } from './$types';

export const prerender = true;

// Resolve the most recent project on the server — gray-matter (used to parse the
// markdown frontmatter) relies on Node's Buffer, so it can't run in the browser.
// Only the homepage feature's meta is sent to the client (not the rendered html).
export const load: PageServerLoad = () => {
	const p = latestProject();
	return {
		latest: p
			? {
					slug: p.slug,
					title: p.title,
					cat: p.cat ?? null,
					year: p.year ?? null,
					cover: p.cover ?? null,
					intro: p.intro ?? null
				}
			: null
	};
};
