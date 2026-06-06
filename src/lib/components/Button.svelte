<script lang="ts">
	import type { Snippet } from 'svelte';

	/* The "pill" button — the design's only reusable UI primitive.
	   Variant + size driven, in the spirit of shadcn-svelte but without the
	   bits-ui/registry dependency. Renders as <a> when `href` is given so it
	   can navigate (nav CTA, "view all projects"), else as <button>. */
	type Variant = 'solid' | 'ghost';
	type Size = 'default' | 'sm';

	let {
		variant = 'solid',
		size = 'default',
		href,
		onclick,
		children
	}: {
		variant?: Variant;
		size?: Size;
		href?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const base =
		'inline-flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-full font-display font-semibold no-underline transition duration-150';

	const variants: Record<Variant, string> = {
		solid: 'bg-accent text-accent-ink border border-transparent hover:brightness-110',
		ghost:
			'bg-white/[0.085] text-ink border border-glass-line backdrop-blur-[20px] hover:bg-white/[0.13]'
	};

	const sizes: Record<Size, string> = {
		default: 'px-[26px] py-[14px] text-[15px]',
		sm: 'px-[22px] py-[11px] text-[14px]'
	};

	const cls = $derived(`${base} ${variants[variant]} ${sizes[size]}`);
</script>

{#if href}
	<a {href} class={cls} {onclick}>{@render children()}</a>
{:else}
	<button class={cls} {onclick}>{@render children()}</button>
{/if}
