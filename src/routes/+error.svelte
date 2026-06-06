<script lang="ts">
	import { page } from '$app/state';
	import NavBar from '$lib/components/NavBar.svelte';
	import Button from '$lib/components/Button.svelte';
	import Footer from '$lib/components/Footer.svelte';

	const status = $derived(page.status);
</script>

<svelte:head>
	<title>Mac Harness — {status}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="page flex h-screen flex-col overflow-hidden">
	<NavBar />

	<main class="flex flex-1 flex-col items-center justify-center px-6 text-center">
		<h1
			class="reveal font-serif text-[clamp(96px,20vw,260px)] font-normal leading-[0.9] tracking-[-0.02em] text-ink"
		>
			404
		</h1>

		<p class="reveal mt-2 font-sans text-[clamp(18px,2vw,24px)] leading-[1.4] text-ink-dim">
			Page doesn’t exist
		</p>

		<div class="reveal mt-10 flex flex-wrap items-center justify-center gap-3">
			<Button href="/">Back to homepage</Button>
			<Button href="/projects" variant="ghost">View projects</Button>
		</div>
	</main>

	<Footer />
</div>
