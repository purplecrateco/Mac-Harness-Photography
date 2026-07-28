<script lang="ts">
	import { page } from '$app/state';

	/* Centralised <head> metadata: title, description, Open Graph and Twitter
	   card tags. Absolute URLs are derived from the current request origin so
	   the OG image resolves correctly when scraped. */
	let {
		title,
		description = 'Portrait, wedding and editorial photography by Mac Harness. Shooting since 2014.',
		image = '/og.png',
		type = 'website'
	}: {
		title: string;
		description?: string;
		image?: string;
		type?: 'website' | 'article';
	} = $props();

	const fullTitle = $derived(title === 'Mac Harness' ? title : `Mac Harness · ${title}`);
	const origin = $derived(page.url.origin);
	const canonical = $derived(origin + page.url.pathname);
	const imageUrl = $derived(image.startsWith('http') ? image : origin + image);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content="Mac Harness" />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
</svelte:head>
