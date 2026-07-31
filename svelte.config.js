import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// Cloudflare Pages. Same adapter Cloudflare recommends for Workers — it covers
		// both — and it builds to .svelte-kit/cloudflare, which is the output directory
		// to set in the Pages project. See https://svelte.dev/docs/kit/adapter-cloudflare
		adapter: adapter()
	}
};

export default config;
