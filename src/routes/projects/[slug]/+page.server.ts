import { error } from '@sveltejs/kit';
import { getProject, projectSlugs } from '$lib/content/projects';
import { pictures } from '$lib/content/pictures';
import type { PageServerLoad, EntryGenerator } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const project = getProject(params.slug);
	if (!project) error(404, `No project found for “${params.slug}”`);

	// Resolve the project's gallery `name`s into full enhanced-img Picture objects
	// (preserving frontmatter order, skipping any name with no matching file) so the
	// page can render a responsive mini-gallery with correct aspect ratios.
	const galleryPics = (project.gallery ?? [])
		.map((name) => pictures.find((p) => p.name === name))
		.filter((p): p is (typeof pictures)[number] => p !== undefined);

	return { project, galleryPics };
};

// Pre-render a page for each markdown file at build time.
export const entries: EntryGenerator = () => projectSlugs().map((slug) => ({ slug }));

export const prerender = true;
