<script lang="ts">
	import { onMount } from 'svelte';
	import Seo from '$lib/components/Seo.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import Kicker from '$lib/components/Kicker.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { initPageMotion } from '$lib/motion';

	let { data } = $props();
	const project = $derived(data.project);

	let pageEl: HTMLDivElement;
	onMount(() => initPageMotion(pageEl));
</script>

<Seo
	title={project.title}
	description={project.intro}
	image={project.cover ?? '/og.png'}
	type="article"
/>

<div class="page" bind:this={pageEl}>
	<NavBar />

	<article class="relative px-6 pb-[120px] pt-[120px] sm:px-10 sm:pt-[150px] lg:px-14 lg:pt-[172px]">
		<div class="mx-auto w-full max-w-[820px]">
			<header data-anim="intro" class="reveal">
				<div data-load>
					<Kicker>
						{#if project.cat}{project.cat}{/if}
						{#if project.cat && project.year} · {/if}
						{#if project.year}{project.year}{/if}
					</Kicker>
				</div>
				<h1
					data-load
					class="mt-4 font-serif text-[clamp(44px,6.5vw,92px)] font-normal leading-[0.96] tracking-[-0.015em] text-ink"
				>
					{project.title}
				</h1>
				{#if project.intro}
					<p
						data-load
						class="mt-6 max-w-[640px] font-sans text-[clamp(16px,1.6vw,20px)] leading-[1.65] text-ink-dim"
					>
						{project.intro}
					</p>
				{/if}
			</header>

			{#if project.cover}
				<figure
					data-load
					class="reveal mt-12 overflow-hidden rounded-[14px] border border-glass-line shadow-[0_40px_90px_-34px_rgba(0,0,0,0.85)]"
				>
					<img src={project.cover} alt={project.title} class="block aspect-[16/9] w-full object-cover" />
				</figure>
			{/if}

			<!-- Rendered markdown body. Styling is scoped via the .prose class below. -->
			<div data-load class="prose reveal mt-14">
				{@html project.html}
			</div>

			<div data-load class="reveal mt-16 border-t border-white/10 pt-8">
				<a
					href="/projects"
					class="inline-flex items-center gap-2 font-mono text-[12.5px] uppercase tracking-[0.18em] text-ink-dim no-underline transition-colors duration-300 hover:text-accent"
				>
					<span aria-hidden="true">←</span> All projects
				</a>
			</div>
		</div>
	</article>

	<Footer />
</div>

<style>
	/* Editorial prose styling for the rendered markdown — tuned to the site's
	   ink/accent palette and serif/mono type scale. */
	.prose {
		color: var(--color-ink-dim);
		font-size: 17px;
		line-height: 1.75;
	}
	.prose :global(h2) {
		margin: 2.4em 0 0.6em;
		font-family: var(--font-serif);
		font-size: clamp(28px, 3.4vw, 40px);
		font-weight: 400;
		line-height: 1.1;
		letter-spacing: -0.01em;
		color: var(--color-ink);
	}
	.prose :global(h3) {
		margin: 1.8em 0 0.5em;
		font-family: var(--font-sans);
		font-size: clamp(18px, 2vw, 22px);
		font-weight: 500;
		color: var(--color-ink);
	}
	.prose :global(p) {
		margin: 1.1em 0;
	}
	.prose :global(a) {
		color: var(--color-accent);
		text-underline-offset: 3px;
	}
	.prose :global(strong) {
		color: var(--color-ink);
		font-weight: 600;
	}
	.prose :global(ul),
	.prose :global(ol) {
		margin: 1.2em 0;
		padding-left: 1.4em;
	}
	.prose :global(ul) {
		list-style: disc;
	}
	.prose :global(ol) {
		list-style: decimal;
	}
	.prose :global(li) {
		margin: 0.4em 0;
	}
	.prose :global(li::marker) {
		color: var(--color-accent);
	}
	.prose :global(blockquote) {
		margin: 1.6em 0;
		padding: 0.2em 0 0.2em 1.2em;
		border-left: 2px solid var(--color-accent);
		font-family: var(--font-serif);
		font-style: italic;
		font-size: clamp(20px, 2.4vw, 26px);
		line-height: 1.4;
		color: var(--color-ink);
	}
	.prose :global(code) {
		font-family: var(--font-mono);
		font-size: 0.88em;
		color: var(--color-ink);
		background: rgba(255, 255, 255, 0.06);
		padding: 0.15em 0.4em;
		border-radius: 4px;
	}
	.prose :global(pre) {
		margin: 1.4em 0;
		padding: 1.1em 1.3em;
		overflow-x: auto;
		border-radius: 10px;
		border: 1px solid var(--color-glass-line);
		background: rgba(255, 255, 255, 0.04);
	}
	.prose :global(pre code) {
		background: none;
		padding: 0;
	}
	.prose :global(hr) {
		margin: 2.4em 0;
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
	.prose :global(img) {
		margin: 1.6em 0;
		border-radius: 12px;
		max-width: 100%;
	}

	:global(.gsap-ready .reveal) {
		animation: none;
	}
	:global(.motion-armed [data-load]) {
		visibility: hidden;
	}
</style>
