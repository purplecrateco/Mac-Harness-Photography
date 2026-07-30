<script lang="ts">
	/* Dark-toned placeholder image, ported from shared.jsx.
	   `radius` stays inline since some call-sites need asymmetric corners. */
	let {
		w,
		h,
		label,
		radius,
		src: realSrc,
		alt = '',
		class: cls = ''
	}: {
		w: number;
		h: number;
		label: string;
		radius?: string;
		src?: string;
		alt?: string;
		class?: string;
	} = $props();

	// ponytail: real src wins; otherwise fall back to the placeholder.
	// Inline SVG data URI rather than placehold.co, so the site never
	// fetches from a third party at runtime (same tones as before).
	const src = $derived(
		realSrc ??
			`data:image/svg+xml,${encodeURIComponent(
				`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#16161c"/><text x="50%" y="50%" fill="#4c4c58" font-family="monospace" font-size="${Math.round(Math.min(w, h) / 12)}" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
			)}`
	);
</script>

<img
	{src}
	{alt}
	class="block h-full w-full border border-glass-line bg-[#15151a] object-cover shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)] {cls}"
	style={radius ? `border-radius:${radius}` : undefined}
	draggable="false"
/>
