import { getAllProjects } from '$lib/content/projects';
import type { PageServerLoad } from './$types';

export const prerender = true;

// Build the project index on the server — gray-matter (frontmatter parsing) relies
// on Node's Buffer and can't run in the browser. Only the table meta is sent to the
// client (not the rendered html), sorted most-recent-first by getAllProjects().
export const load: PageServerLoad = () => {
	const projects = getAllProjects().map((p) => ({
		slug: p.slug,
		title: p.title,
		cat: p.cat ?? null,
		year: p.year ?? null,
		cover: p.cover ?? null
	}));
	return { projects };
};
