import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	// enhancedImages must come before sveltekit().
	//
	// enhancedImages() takes no options, so the responsive width ladder can't be
	// set here — it is passed per-import as imagetools' `w` directive. See the
	// glob in src/lib/content/pictures.ts, which is the single place the gallery's
	// srcset rungs are defined.
	plugins: [tailwindcss(), enhancedImages(), sveltekit()]
});
