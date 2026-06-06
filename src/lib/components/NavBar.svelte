<script lang="ts">
	import { page } from '$app/state';
	import Mark from './Mark.svelte';
	import Button from './Button.svelte';
	import { scrollToId } from '$lib/scroll';

	let scrolled = $state(false);
	let open = $state(false);

	$effect(() => {
		const onScroll = () => (scrolled = window.scrollY > 24);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	const isHome = $derived(page.url.pathname === '/');

	type Link = { label: string; href: string; section?: string; path?: string };
	const links: Link[] = [
		{ label: 'Work', href: '/gallery', path: '/gallery' },
		{ label: 'Projects', href: '/projects', path: '/projects' },
		{ label: 'About', href: '/#about', section: 'about' },
		{ label: 'Contact', href: '/#contact', section: 'contact' }
	];

	// On the homepage, section links scroll in-page; elsewhere they navigate to /#section.
	const onLink = (l: { section?: string }) => (e: MouseEvent) => {
		open = false;
		if (isHome && l.section) {
			e.preventDefault();
			scrollToId(l.section);
		}
	};

	const isCurrent = (l: Link) => !!l.path && page.url.pathname === l.path;
</script>

<div class="fixed inset-x-0 top-0 z-[100]">
<nav
	class="relative flex items-center justify-between border-b px-6 backdrop-blur-[22px] backdrop-saturate-150 transition-all duration-300 sm:px-10 lg:px-14
		{scrolled || open
		? 'border-white/[0.07] bg-[rgba(8,8,11,0.62)] py-[14px]'
		: 'border-transparent bg-[rgba(8,8,11,0.3)] py-5'}"
>
	<a href="/" class="flex items-center gap-3 no-underline">
		<Mark size={22} />
		<span class="font-mono text-xs font-bold uppercase tracking-[0.16em] text-ink">MAC HARNESS</span>
	</a>

	<!-- desktop links -->
	<div class="hidden items-center gap-[34px] min-[881px]:flex">
		{#each links as l (l.label)}
			<a
				href={l.href}
				onclick={onLink(l)}
				aria-current={isCurrent(l) ? 'page' : undefined}
				class="cursor-pointer font-mono text-xs uppercase tracking-[0.16em] transition-colors hover:text-ink {isCurrent(
					l
				)
					? 'text-ink'
					: 'text-ink-dim'}">{l.label}</a
			>
		{/each}
	</div>

	<!-- desktop CTA -->
	<div class="hidden items-center gap-[22px] min-[881px]:flex">
		<Button size="sm" href="/#contact" onclick={onLink({ section: 'contact' })}>
			Book a session <span class="text-sm opacity-90">→</span>
		</Button>
	</div>

	<!-- mobile hamburger -->
	<button
		type="button"
		aria-label="Toggle menu"
		aria-expanded={open}
		onclick={() => (open = !open)}
		class="flex h-10 w-10 flex-col items-center justify-center gap-[5px] min-[881px]:hidden"
	>
		<span
			class="h-px w-6 bg-ink transition-transform duration-200 {open
				? 'translate-y-[6px] rotate-45'
				: ''}"
		></span>
		<span class="h-px w-6 bg-ink transition-opacity duration-200 {open ? 'opacity-0' : ''}"></span>
		<span
			class="h-px w-6 bg-ink transition-transform duration-200 {open
				? '-translate-y-[6px] -rotate-45'
				: ''}"
		></span>
	</button>
</nav>

	<!-- mobile dropdown panel — sibling of <nav> (not a child) so its backdrop-filter
		 isn't isolated by the nav's own backdrop-blur, and can blur the page behind it -->
	{#if open}
		<div
			class="glass absolute inset-x-0 top-full flex flex-col gap-1 border-t border-white/[0.07] p-6 min-[881px]:hidden"
			style="background: rgba(11,11,14,0.55); backdrop-filter: blur(34px) saturate(170%); -webkit-backdrop-filter: blur(34px) saturate(170%);"
		>
			{#each links as l (l.label)}
				<a
					href={l.href}
					onclick={onLink(l)}
					aria-current={isCurrent(l) ? 'page' : undefined}
					class="cursor-pointer border-b border-white/[0.06] py-3 font-mono text-sm uppercase tracking-[0.16em] transition-colors hover:text-ink {isCurrent(
						l
					)
						? 'text-ink'
						: 'text-ink-dim'}">{l.label}</a
				>
			{/each}
			<div class="pt-4">
				<Button href="/#contact" onclick={onLink({ section: 'contact' })}>
					Book a session <span class="text-sm opacity-90">→</span>
				</Button>
			</div>
		</div>
	{/if}
</div>
