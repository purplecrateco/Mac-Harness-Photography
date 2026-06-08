<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'inline-flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-full font-display font-semibold no-underline transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
		variants: {
			variant: {
				solid: 'bg-gold text-gold-ink border border-transparent hover:brightness-110',
				ghost: 'bg-white/[0.085] text-ink border border-glass-line backdrop-blur-[20px] hover:bg-white/[0.13]'
			},
			size: {
				default: 'px-[26px] py-[14px] text-[15px]',
				sm: 'px-[22px] py-[11px] text-[14px]'
			}
		},
		defaultVariants: {
			variant: 'solid',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		variant = 'solid' as ButtonVariant,
		size = 'default' as ButtonSize,
		href,
		onclick,
		class: className,
		children
	}: {
		variant?: ButtonVariant;
		size?: ButtonSize;
		href?: string;
		onclick?: (e: MouseEvent) => void;
		class?: string;
		children: Snippet;
	} = $props();
</script>

{#if href}
	<a {href} class={cn(buttonVariants({ variant, size }), className)} {onclick}>
		{@render children()}
	</a>
{:else}
	<button class={cn(buttonVariants({ variant, size }), className)} {onclick}>
		{@render children()}
	</button>
{/if}
