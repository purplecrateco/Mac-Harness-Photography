<script lang="ts">
	import { onMount } from 'svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import Kicker from '$lib/components/Kicker.svelte';
	import ProjectsTable from '$lib/components/ProjectsTable.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { initPageMotion } from '$lib/motion';

	let pageEl: HTMLDivElement;

	onMount(() => initPageMotion(pageEl, { batch: '[data-anim="row"]' }));
</script>

<svelte:head>
	<title>Mac Harness — Projects</title>
</svelte:head>

<div class="page" bind:this={pageEl}>
	<NavBar />

	<header class="relative px-6 pb-[70px] pt-[120px] sm:px-10 sm:pt-[150px] lg:px-14 lg:pt-[172px]">
		<div class="mx-auto w-full max-w-[1320px]">
			<div data-anim="intro" class="reveal flex flex-wrap items-end justify-between gap-10">
				<div>
					<div data-load><Kicker>Index · 2022 → 2026</Kicker></div>
					<h1
						data-load
						class="mt-4 font-serif text-[clamp(48px,7vw,104px)] font-normal leading-[0.94] tracking-[-0.015em] text-ink"
					>
						Selected <em class="italic text-accent">Projects</em>
					</h1>
				</div>
				<div
					data-load
					class="max-w-[280px] font-mono text-[12.5px] leading-[1.9] tracking-[0.04em] text-ink-dim max-[760px]:text-left sm:text-right"
				>
					Nine bodies of work —<br />portrait, wedding &amp; editorial.<br />
					<span class="text-ink-faint">Hover a row to preview.</span>
				</div>
			</div>
		</div>
	</header>

	<ProjectsTable />

	<Footer />
</div>

<!-- Homepage-style motion (scoped to this page). With JS off or reduced-motion, the
	 original CSS .reveal fade remains and nothing is hidden. -->
<style>
	:global(.gsap-ready .reveal) {
		animation: none;
	}
	:global(.motion-armed [data-load]),
	:global(.motion-armed [data-anim='row']) {
		visibility: hidden;
	}
</style>
