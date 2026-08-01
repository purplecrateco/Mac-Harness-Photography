/* Site-level metadata a static build can't derive from a request.
 *
 * Seo.svelte read the origin from `page.url.origin`, which doesn't exist at build time.
 * Set SITE_ORIGIN in the build environment (Cloudflare Pages exposes CF_PAGES_URL for
 * preview deploys) so absolute OG image URLs resolve when scraped.
 */
export default {
	origin: (process.env.SITE_ORIGIN || process.env.CF_PAGES_URL || 'https://macharness.com').replace(
		/\/$/,
		''
	),
	description:
		'Portrait and automotive photography by Mac Harness. Shooting since 2024.'
};
