<script lang="ts">
	/* Dark-toned placeholder image, ported from shared.jsx.
	   `radius` stays inline since some call-sites need asymmetric corners. */
	let {
		w,
		h,
		label,
		radius,
		class: cls = ''
	}: { w: number; h: number; label: string; radius?: string; class?: string } = $props();

	const src = $derived(
		`https://placehold.co/${w}x${h}/16161c/4c4c58?text=${encodeURIComponent(label)}`
	);
</script>

<img
	{src}
	alt={label}
	class="block h-full w-full border border-glass-line bg-[#15151a] object-cover shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)] {cls}"
	style={radius ? `border-radius:${radius}` : undefined}
	draggable="false"
/>
