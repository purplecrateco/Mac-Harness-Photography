import { error } from '@sveltejs/kit';
import { getProject, projectSlugs } from '$lib/content/projects';
import type { PageServerLoad, EntryGenerator } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const project = getProject(params.slug);
	if (!project) error(404, `No project found for “${params.slug}”`);
	return { project };
};

// Pre-render a page for each markdown file at build time.
export const entries: EntryGenerator = () => projectSlugs().map((slug) => ({ slug }));

export const prerender = true;
