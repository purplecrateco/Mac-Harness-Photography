<script lang="ts">
	import type { Snippet } from 'svelte';

	/* Eyebrow label with a leading accent rule — used by every section heading. */
	let { center = false, children }: { center?: boolean; children: Snippet } = $props();
</script>

<span
	class="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] text-gold
		before:h-px before:w-[34px] before:bg-gold before:opacity-60 before:content-['']
		{center ? 'justify-center' : ''}"
>
	{@render children()}
</span>
