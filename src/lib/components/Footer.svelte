<script lang="ts">
	import { page } from '$app/state';
	import Mark from './Mark.svelte';
	import { scrollToTop } from '$lib/scroll';

	// Show "Back to top" on the homepage, or anywhere the top of the document has
	// scrolled out of view (i.e. there's actually somewhere to scroll back to).
	const isHome = $derived(page.url.pathname === '/');
	let scrolled = $state(false);

	$effect(() => {
		const onScroll = () => (scrolled = window.scrollY > 0);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	const showBackToTop = $derived(isHome || scrolled);
</script>

<footer class="border-t border-white/[0.07]">
	<div
		class="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-6 px-6 py-[34px] sm:px-10 lg:px-14"
	>
		<a
			href="/"
			class="flex items-center gap-[11px] font-mono text-xs font-bold uppercase tracking-[0.16em] text-ink no-underline"
		>
			<Mark size={18} /> MAC HARNESS
		</a>
		<span class="font-mono text-[11px] tracking-[0.08em] text-ink-faint">
			© 2026 Mac Harness · Photographer since 2014
		</span>
		{#if showBackToTop}
			<a
				href="#top"
				onclick={(e) => {
					e.preventDefault();
					scrollToTop();
				}}
				class="cursor-pointer font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim no-underline transition hover:text-gold"
				>Back to top ↑</a
			>
		{/if}
		<a
			href="https://portfolio.josephheinz.com"
			target="_blank"
			rel="noopener noreferrer"
			class="font-mono text-[11px] tracking-[0.08em] text-ink-faint no-underline transition hover:text-ink"
			>Built by <span class="text-gold">Joseph Heinz</span></a
		>
	</div>
</footer>
