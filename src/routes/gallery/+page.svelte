<script lang="ts">
	import { onMount } from 'svelte';
	import Seo from '$lib/components/Seo.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import Kicker from '$lib/components/Kicker.svelte';
	import MasonryGallery from '$lib/components/MasonryGallery.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { initPageMotion } from '$lib/motion';
	import { pictures } from '$lib/content/pictures';

	let pageEl: HTMLDivElement;

	// Falls back to the built-in placeholder set's count when no pictures are added yet.
	const frameCount = pictures.length || 18;

	onMount(() => initPageMotion(pageEl, { batch: '.mtile' }));
</script>

<Seo title="Gallery" description="Selected photographic work — portrait, wedding and editorial frames from Mac Harness." />

<div class="page" bind:this={pageEl}>
	<NavBar />

	<!-- gal-wrap: a wider 85vw stage (max 1680px), 90vw on small screens -->
	<header class="px-0 pb-16 pt-[120px] sm:pt-[150px] lg:pt-[168px]">
		<div class="mx-auto w-[85vw] max-w-[1680px] max-[680px]:w-[90vw]">
			<div data-anim="intro" class="reveal flex flex-wrap items-end justify-between gap-10">
				<div>
					<div data-load><Kicker>Gallery · 2022 → 2026</Kicker></div>
					<h1
						data-load
						class="mt-4 font-serif text-[clamp(48px,7vw,104px)] font-normal leading-[0.94] tracking-[-0.015em] text-ink"
					>
						The <em class="italic text-accent">Gallery</em>
					</h1>
				</div>
				<div
					data-load
					class="max-w-[280px] font-mono text-[12.5px] leading-[1.9] tracking-[0.04em] text-ink-dim max-[760px]:text-left sm:text-right"
				>
					{frameCount} frames, loosely sequenced.<br />
					<span class="text-ink-faint">Click any image to enlarge.</span>
				</div>
			</div>
		</div>
	</header>

	<section class="pb-40">
		<div class="mx-auto w-[85vw] max-w-[1680px] max-[680px]:w-[90vw]">
			<MasonryGallery />
		</div>
	</section>

	<Footer />
</div>

<!-- Homepage-style motion (scoped to this page). The masonry tiles handle the scroll
	 reveal, so the container's own fade is skipped while motion is active. With JS off or
	 reduced-motion, the masonry's native fade-in remains and nothing is hidden. -->
<style>
	:global(.gsap-ready .reveal) {
		animation: none;
	}
	:global(.gsap-ready .masonry) {
		opacity: 1 !important;
	}
	:global(.motion-armed [data-load]),
	:global(.motion-armed .mtile) {
		visibility: hidden;
	}
</style>
