<script lang="ts">
	import Ph from './Ph.svelte';
	import Kicker from './Kicker.svelte';
	import { copy } from '$lib/content/copy';

	const t = copy.about;
	const services = t.services ?? [];
	const stats = t.stats ?? [];
</script>

<section id="about" class="relative border-t border-white/[0.055] py-20 sm:py-28 lg:py-[140px]">
	<div
		class="mx-auto grid w-full max-w-[1320px] grid-cols-[minmax(0,440px)_1fr] items-center gap-[72px] px-6 sm:px-10 lg:px-14 max-[900px]:grid-cols-1 max-[900px]:gap-16"
	>
		<div class="reveal">
			<div class="aspect-[44/56] w-full">
				<Ph w={880} h={1120} label="MAC · PORTRAIT" src="/portrait.jpeg" alt="Mac Harness" radius="20px" />
			</div>
		</div>

		<div class="reveal">
			<Kicker>{t.kicker}</Kicker>
			<h2
				class="mb-8 mt-3.5 font-serif text-[clamp(40px,5vw,68px)] font-normal leading-[0.98] tracking-[-0.01em] text-ink"
			>
				{t.heading}
			</h2>
			<p class="mb-[22px] max-w-[54ch] text-[24px] leading-[1.5] text-ink">
				{t.lead}
			</p>
			<p class="mb-[22px] max-w-[54ch] text-[19px] leading-[1.65] text-ink-dim">
				{t.body}
			</p>

			{#if stats.length}
				<div class="my-[42px] mb-9 grid grid-cols-[repeat(3,auto)] gap-x-6 gap-y-9 sm:gap-x-12">
					{#each stats as s (s.label)}
						<div>
							<div class="font-serif text-[48px] leading-none text-gold">{s.num}</div>
							<div class="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
								{s.label}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class="mb-9 mt-[42px] flex flex-wrap gap-2.5">
				{#each services as s (s)}
					<span
						class="rounded-full border border-glass-line bg-white/[0.055] px-4 py-[9px] font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-dim"
						>{s}</span
					>
				{/each}
			</div>

			<div class="font-serif text-[34px] italic text-ink">{t.signature}</div>
		</div>
	</div>
</section>
