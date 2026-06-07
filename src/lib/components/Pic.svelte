<script lang="ts">
	/* Renders a responsive <picture> for an enhanced-img Picture (see pictures.ts).
	   Falls back to a plain <img> when no generated `sources` exist (e.g. the
	   placeholder set). The intrinsic width/height are emitted so the browser can
	   reserve space and the layout stays stable before pixels arrive. */
	import type { Picture } from '$lib/content/pictures';

	let {
		pic,
		class: cls = '',
		sizes,
		eager = false
	}: {
		pic: Pick<Picture, 'src' | 'w' | 'h' | 'name'> & { sources?: Record<string, string> };
		class?: string;
		sizes?: string;
		eager?: boolean;
	} = $props();
</script>

<picture class="block h-full w-full">
	{#if pic.sources}
		{#each Object.entries(pic.sources) as [type, srcset] (type)}
			<source {type} {srcset} {sizes} />
		{/each}
	{/if}
	<img
		src={pic.src}
		width={pic.w}
		height={pic.h}
		{sizes}
		alt={pic.name ?? ''}
		loading={eager ? 'eager' : 'lazy'}
		decoding="async"
		draggable="false"
		class="block h-full w-full object-cover {cls}"
	/>
</picture>
