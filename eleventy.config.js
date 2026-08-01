/* Eleventy build — 1:1 port of the SvelteKit site, Tailwind retained.
 *
 * Content deliberately stays where it is (src/lib/content/**), so the CMS configs in
 * .pages.yml and static/admin/config.yml keep pointing at the same paths and no content
 * migration is needed. Only the rendering layer moves.
 *
 * The SvelteKit tree is still present during the port so the two builds can be diffed;
 * it comes out once parity is signed off.
 */
export default async function (eleventyConfig) {
	// static/ is served from the site root, exactly as SvelteKit did
	eleventyConfig.addPassthroughCopy({ static: '.' });

	/* Client JS is BUNDLED by esbuild (see the `js:11ty` script), not passed through:
	   motion.js imports gsap from node_modules, so native ES modules are not an option.
	   Deliberately no passthrough here — copying the sources as well would ship two
	   copies and let a stale unbundled motion.js shadow the built one. */

	// Tailwind is built separately by @tailwindcss/cli (see the `css:*` npm scripts) —
	// keeping it out of Eleventy avoids a plugin that would need to re-run per template.
	eleventyConfig.ignores.add('eleventy/css/**');

	// Content lives outside the input dir, so Eleventy has to be told to watch it.
	eleventyConfig.addWatchTarget('src/lib/content/');
	eleventyConfig.addWatchTarget('src/app.css');

	// Rendered project bodies. `marked` is already a dependency and is what the
	// SvelteKit build used, so output stays byte-identical.
	const { marked } = await import('marked');
	eleventyConfig.addFilter('markdown', (s) => (s ? marked.parse(String(s)) : ''));

	// One line per line break, blank lines dropped — the convention documented for
	// `note`, `studio_lines` and similar CMS fields.
	eleventyConfig.addFilter('lines', (s) =>
		String(s ?? '')
			.split('\n')
			.map((l) => l.trim())
			.filter(Boolean)
	);

	eleventyConfig.addFilter('json', (v) => JSON.stringify(v));

	return {
		dir: {
			input: 'eleventy',
			output: '_site',
			includes: '_includes',
			data: '_data'
		},
		markdownTemplateEngine: 'njk',
		htmlTemplateEngine: 'njk',
		templateFormats: ['njk', 'md', '11ty.js']
	};
}
