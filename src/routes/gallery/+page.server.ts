import { pictureProjectMap } from '$lib/content/projects';
import { galleryPictures } from '$lib/content/gallery.server';
import type { PageServerLoad } from './$types';

export const prerender = true;

// Both of these are resolved on the server because they parse markdown frontmatter
// with gray-matter, which relies on Node's Buffer and can't run in the browser:
//   - the ordered/captioned picture set, from the pictures metadata collection
//   - the picture-name -> project lookup, used to tag an expanded frame
export const load: PageServerLoad = () => {
	return {
		pictures: galleryPictures(),
		projectByPicture: pictureProjectMap()
	};
};
