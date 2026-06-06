<script lang="ts">
	import Ph from './Ph.svelte';
	import Kicker from './Kicker.svelte';
	import Button from './Button.svelte';

	const PROJECT_SHOTS = [
		{ w: 480, h: 640, label: 'PLATE 01' },
		{ w: 480, h: 360, label: 'PLATE 02' },
		{ w: 480, h: 360, label: 'PLATE 03' },
		{ w: 480, h: 600, label: 'PLATE 04' }
	];
</script>

<section id="project" class="relative border-t border-white/[0.055] py-20 sm:py-28 lg:py-[140px]">
	<div
		class="mx-auto grid w-full max-w-[1320px] grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-[72px] px-6 sm:px-10 lg:px-14 max-[900px]:grid-cols-1 max-[900px]:gap-12"
	>
		<div class="reveal">
			<Kicker>Latest Project</Kicker>
			<h2
				class="mb-7 mt-3.5 font-serif text-[clamp(40px,5.4vw,76px)] font-normal leading-[0.96] tracking-[-0.01em] text-ink"
			>
				Salt &amp; <em class="italic text-accent">Silver</em>
			</h2>
			<p class="mb-5 max-w-[46ch] text-[18px] leading-[1.65] text-ink-dim">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris.
			</p>
			<p
				class="mb-[34px] font-mono text-[13px] leading-[1.7] tracking-[0.02em] text-ink-faint"
			>
				A six-week series shot entirely on hand-developed 35mm — coastline, salt, and the people who
				work it.
			</p>
			<Button variant="ghost" href="/projects">
				View all projects <span class="text-sm opacity-90">→</span>
			</Button>
		</div>

		<div class="reveal columns-2 gap-x-4">
			{#each PROJECT_SHOTS as s (s.label)}
				<div class="group mb-4 break-inside-avoid overflow-hidden rounded-xl">
					<Ph
						w={s.w}
						h={s.h}
						label={s.label}
						radius="12px"
						class="!h-auto transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover:scale-[1.04]"
					/>
				</div>
			{/each}
		</div>
	</div>
</section>
