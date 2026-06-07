<script lang="ts">
	import Ph from './Ph.svelte';
	import Kicker from './Kicker.svelte';
	import Pic from './Pic.svelte';
	import { pictures, GALLERY_PEEK_COUNT } from '$lib/content/pictures';

	/* `span` carries the asymmetric editorial grid placement (+ mobile collapse).
	   The peek shows the first GALLERY_PEEK_COUNT (8) pictures from
	   src/lib/content/pictures/, mapped onto the editorial grid below — one span per
	   tile. If no pictures exist yet, it falls back to placeholders. */
	const SPANS = [
		'col-span-2 row-span-3 max-[760px]:col-span-1 max-[760px]:row-span-2',
		'col-span-2 row-span-2 max-[760px]:col-span-1',
		'col-span-2 row-span-3 max-[760px]:col-span-1 max-[760px]:row-span-2',
		'col-span-2 row-span-2 max-[760px]:col-span-1',
		'col-span-2 row-span-2 max-[760px]:col-span-1',
		'col-span-2 row-span-2 max-[760px]:col-span-1',
		'col-span-3 row-span-2 max-[760px]:col-span-2',
		'col-span-3 row-span-2 max-[760px]:col-span-2'
	];

	const tiles = pictures.slice(0, GALLERY_PEEK_COUNT).map((pic, i) => ({ pic, span: SPANS[i] }));

	// Placeholder fallback (only when src/lib/content/pictures/ is empty).
	const PLACEHOLDER = [
		{ w: 720, h: 1040, t: 'Plate 01' },
		{ w: 760, h: 560, t: 'Plate 02' },
		{ w: 720, h: 1040, t: 'Plate 03' },
		{ w: 760, h: 560, t: 'Plate 04' },
		{ w: 760, h: 560, t: 'Plate 05' },
		{ w: 760, h: 560, t: 'Plate 06' },
		{ w: 1100, h: 640, t: 'Plate 07' },
		{ w: 1100, h: 640, t: 'Plate 08' }
	].map((p, i) => ({ ...p, span: SPANS[i] }));

	const SIZES = '(max-width: 760px) 50vw, 33vw';
</script>

<section id="gallery" class="t-gallery relative py-20 sm:py-28 lg:py-[140px]">
	<div class="mx-auto w-full max-w-[1320px] px-6 sm:px-10 lg:px-14">
		<div class="reveal mb-[60px] flex flex-wrap items-end justify-between gap-10">
			<div>
				<Kicker>Selected Work</Kicker>
				<h2
					class="mt-3.5 font-serif text-[clamp(44px,6vw,84px)] font-normal leading-[0.96] tracking-[-0.01em] text-ink"
				>
					Frames that <em class="italic text-accent">last</em>.
				</h2>
			</div>
			<div
				class="max-w-[280px] font-mono text-[12.5px] leading-[1.9] tracking-[0.04em] text-ink-dim max-[760px]:text-left sm:text-right"
			>
				A rotating edit of portrait,<br />wedding &amp; editorial work.<br />
				<span class="text-ink-faint">— 2018 → 2026</span>
			</div>
		</div>

		<div
			data-anim="gallery"
			class="reveal grid grid-cols-6 auto-rows-[128px] gap-[18px] max-[760px]:grid-cols-2 max-[760px]:auto-rows-[120px]"
		>
			{#if tiles.length}
				{#each tiles as { pic, span }, i (pic.id)}
					<figure class="group relative overflow-hidden rounded-2xl {span}">
						<Pic
							{pic}
							sizes={SIZES}
							eager={i < 4}
							class="rounded-2xl transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover:scale-105"
						/>
					</figure>
				{/each}
			{:else}
				{#each PLACEHOLDER as s (s.t)}
					<figure class="group relative overflow-hidden rounded-2xl {s.span}">
						<Ph
							w={s.w}
							h={s.h}
							label={s.t.toUpperCase()}
							radius="16px"
							class="transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover:scale-105"
						/>
					</figure>
				{/each}
			{/if}
		</div>
	</div>
</section>

<!-- Tablet/medium: tighten the gap between the hero and Selected Work. -->
<style>
	@media (min-width: 761px) and (max-width: 1023px) {
		.t-gallery {
			padding-top: 2.5rem;
		}
	}

	/* Phones + tablets: never let a gallery tile grow taller than ~90% of the viewport. */
	@media (max-width: 1023px) {
		.t-gallery figure {
			max-height: 90vh;
		}
	}
</style>
