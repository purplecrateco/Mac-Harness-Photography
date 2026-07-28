import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

/**
 * Resolve /admin to the Sveltia CMS page, which is a static file at
 * static/admin/index.html (see docs/cms.md).
 *
 * Production hosts do this themselves: Cloudflare's static assets default
 * (`html_handling: auto-trailing-slash`) redirects /admin to /admin/ and serves the
 * directory's index.html at the asset layer, before a request ever reaches this hook.
 * `vite dev` doesn't, so /admin 404s locally. This keeps the URL identical in both,
 * which matters because /admin is the address handed to the client.
 *
 * 307 rather than 308: a permanent redirect would stick in browser caches, which is
 * a nuisance if this ever moves.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname === '/admin' || pathname === '/admin/') {
		redirect(307, '/admin/index.html');
	}

	return resolve(event);
};
