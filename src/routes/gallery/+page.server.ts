import { pictureProjectMap } from '$lib/content/projects';
import type { PageServerLoad } from './$types';

export const prerender = true;

// Build the picture-name -> project lookup on the server (gray-matter, used to read
// project frontmatter, relies on Node's Buffer and can't run in the browser). The
// gallery uses it to tag an expanded frame with the project it belongs to.
export const load: PageServerLoad = () => {
	return { projectByPicture: pictureProjectMap() };
};
