<script lang="ts">
	import { page } from '$app/state';
	import Mark from './Mark.svelte';
	import Button from './Button.svelte';
	import { scrollToId } from '$lib/scroll';
	import * as Sheet from '$lib/components/ui/sheet/index.js';

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
		{ label: 'Gallery', href: '/gallery', path: '/gallery' },
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
		<!-- min-h-11 gives the 44px hit area; the symmetric negative margin keeps the
			 bar exactly as tall as it was (the row is still sized by the CTA button). -->
		<a
			href="/"
			class="-my-2.5 flex min-h-11 items-center gap-3 rounded-sm no-underline focus-visible:focus-ring"
		>
			<Mark size={22} />
			<span class="font-mono text-xs font-bold uppercase tracking-[0.16em] text-ink">MAC HARNESS</span>
		</a>

		<!-- desktop links. The label itself is only 16px tall, so each link gets a 44px
			 hit area (min-h-11 + px-2) and an equal negative margin back, which leaves the
			 outer box — and therefore the bar height, the 34px gaps and every glyph
			 position — exactly where it was. Grow the target, not the type. -->
		<div class="hidden items-center gap-[34px] min-[881px]:flex">
			{#each links as l (l.label)}
				<a
					href={l.href}
					onclick={onLink(l)}
					aria-current={isCurrent(l) ? 'page' : undefined}
					class="-mx-2 -my-3.5 inline-flex min-h-11 cursor-pointer items-center rounded-sm px-2 font-mono text-xs uppercase tracking-[0.16em] transition-colors hover:text-ink focus-visible:focus-ring {isCurrent(
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

		<!-- mobile nav via Sheet -->
		<Sheet.Root bind:open>
			<!-- 44×44 hit area; -m-0.5 pulls the outer box back to the 40px it was, so the
				 bars stay put on both axes. -->
			<Sheet.Trigger
				class="-m-0.5 flex h-11 w-11 flex-col items-center justify-center gap-[5px] min-[881px]:hidden bg-transparent border-0 p-0 cursor-pointer rounded-sm focus-visible:focus-ring"
				aria-label="Toggle menu"
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
			</Sheet.Trigger>

			<Sheet.Content
				side="right"
				class="border-white/[0.07] flex flex-col gap-1 p-6 min-[881px]:hidden"
				style="background: rgba(11,11,14,0.92); backdrop-filter: blur(34px) saturate(170%); -webkit-backdrop-filter: blur(34px) saturate(170%);"
			>
				<Sheet.Header class="p-0 mb-4">
					<Sheet.Title class="sr-only">Navigation</Sheet.Title>
				</Sheet.Header>
				{#each links as l (l.label)}
					<a
						href={l.href}
						onclick={onLink(l)}
						aria-current={isCurrent(l) ? 'page' : undefined}
						class="cursor-pointer border-b border-white/[0.06] py-3 font-mono text-sm uppercase tracking-[0.16em] no-underline transition-colors hover:text-ink focus-visible:focus-ring {isCurrent(
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
			</Sheet.Content>
		</Sheet.Root>
	</nav>
</div>
