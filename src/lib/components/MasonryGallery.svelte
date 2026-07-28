<script lang="ts">
	/* Interactive masonry gallery — ported from gallery.jsx.
	   A true masonry layout packed explicitly in JS (greedy skyline); one featured
	   tile expands to ~2 columns and the rest reflow. Each layout change animates as
	   a single cohesive FLIP transition — done with the native Web Animations API
	   instead of GSAP, so no animation dependency is pulled in. The viewport eases to
	   center the opened frame and the stage height grows/shrinks smoothly.

	   Images come from src/lib/content/pictures/ via @sveltejs/enhanced-img (see
	   pictures.ts), so their intrinsic dimensions are known at build time — the layout
	   is correct on first paint with no reflow, and the browser pulls small responsive
	   variants instead of the full-size originals. When no pictures are passed in we
	   fall back to a built-in placeholder set so the page is never blank. */

	import type { Picture } from '$lib/content/pictures';
	import Pic from './Pic.svelte';

	type Frame = Pick<Picture, 'id' | 'w' | 'h' | 'src' | 'name' | 'caption' | 'sources'>;

	/* `pictures` arrives from the route loader already in editorial order with
	   captions applied (galleryPictures() in gallery.server.ts) — the metadata
	   parsing behind that needs Node's Buffer, so it can't happen in this component.
	   `projectByPicture` maps picture `name` -> the project featuring it, driving the
	   "from project" tag over an expanded frame. */
	let {
		pictures = [],
		projectByPicture = {}
	}: {
		pictures?: Frame[];
		projectByPicture?: Record<string, { slug: string; title: string }>;
	} = $props();

	// design defaults from galleryApp.jsx (the Tweaks panel is omitted)
	const GAP = 12;
	const TILE = 340; // target column width — larger ⇒ fewer columns ⇒ bigger tiles
	const RADIUS = 14;
	const MOTION = 0.72; // seconds
	const EASE = 'cubic-bezier(0.65,0,0.35,1)'; // ≈ power3.inOut

	// Tiles span ~1/5 of the 85vw stage on desktop, ~1/2 of 90vw on phones.
	const SIZES = '(max-width: 680px) 45vw, 18vw';

	// How many leading frames load eagerly. Roughly two rows at the widest layout,
	// which covers the first screen; everything after this loads lazily on scroll.
	const EAGER_COUNT = 12;

	// Built-in fallback (used only when no pictures have been added yet).
	const PLACEHOLDER_TONES: { id: number; w: number; h: number; tone: string }[] = [
		{ id: 1, w: 800, h: 1000, tone: '1a1712' },
		{ id: 2, w: 1200, h: 800, tone: '12161a' },
		{ id: 3, w: 1000, h: 1000, tone: '171318' },
		{ id: 4, w: 760, h: 1140, tone: '16140f' },
		{ id: 5, w: 1200, h: 760, tone: '131713' },
		{ id: 6, w: 1000, h: 800, tone: '1b1610' },
		{ id: 7, w: 900, h: 1200, tone: '12141a' },
		{ id: 8, w: 1280, h: 720, tone: '181318' },
		{ id: 9, w: 1000, h: 920, tone: '151310' },
		{ id: 10, w: 820, h: 1120, tone: '10151a' },
		{ id: 11, w: 1100, h: 760, tone: '1a1513' },
		{ id: 12, w: 800, h: 800, tone: '141417' },
		{ id: 13, w: 1200, h: 800, tone: '171210' },
		{ id: 14, w: 900, h: 1120, tone: '11161a' },
		{ id: 15, w: 1280, h: 720, tone: '181612' },
		{ id: 16, w: 1000, h: 1000, tone: '131217' },
		{ id: 17, w: 780, h: 1040, tone: '1a1714' },
		{ id: 18, w: 1120, h: 760, tone: '10161a' }
	];

	const PLACEHOLDER_FRAMES: Frame[] = PLACEHOLDER_TONES.map((f) => ({
		id: f.id,
		w: f.w,
		h: f.h,
		src: `https://placehold.co/${f.w}x${f.h}/${f.tone}/3a3a44?text=${f.id}`,
		name: `Frame ${f.id}`
	}));

	const frames: Frame[] = $derived(pictures.length ? pictures : PLACEHOLDER_FRAMES);

	/** Human label for a frame — the caption when Mac has written one, else the filename. */
	const label = (im: Frame) => im.caption?.trim() || im.name;

	type Pos = { x: number; y: number; w: number; h: number };

	/* greedy skyline packing: N equal columns; each frame drops into the shortest
	   slot. The expanded frame reserves two columns and the rest reflow around it. */
	function computeLayout(items: Frame[], width: number, expandedId: number | null) {
		const cols = Math.max(2, Math.min(6, Math.round(width / TILE)));
		const colW = (width - GAP * (cols - 1)) / cols;
		const colH = new Array(cols).fill(0);
		const maxH = window.innerHeight * 0.9;
		const pos: Pos[] = new Array(items.length);

		items.forEach((im, idx) => {
			const aspect = im.w / im.h;
			const expanded = im.id === expandedId;
			const span = expanded ? Math.min(2, cols) : 1;

			let start = 0;
			if (span === 1) {
				let best = Infinity;
				for (let c = 0; c < cols; c++) {
					if (colH[c] < best - 0.5) {
						best = colH[c];
						start = c;
					}
				}
			} else {
				let best = Infinity;
				for (let c = 0; c <= cols - span; c++) {
					const top = Math.max(colH[c], colH[c + 1]);
					if (top < best - 0.5) {
						best = top;
						start = c;
					}
				}
			}

			const slotW = colW * span + GAP * (span - 1);
			let w = slotW;
			let h = w / aspect;
			if (expanded && h > maxH) {
				h = maxH;
				w = h * aspect;
			}

			const top = span === 1 ? colH[start] : Math.max(colH[start], colH[start + 1]);
			const slotX = start * (colW + GAP);
			const x = slotX + (slotW - w) / 2;
			pos[idx] = { x, y: top, w, h };

			const bottom = top + h + GAP;
			for (let c = start; c < start + span; c++) colH[c] = bottom;
		});

		const totalH = Math.max(...colH, 0) - GAP;
		return { pos, totalH };
	}

	let containerEl: HTMLDivElement | null = $state(null);
	let expandedId = $state<number | null>(null);
	let width = $state(0);
	let ready = $state(false);

	let first = true;
	let lastWidth = 0;
	let prevExpanded: number | null = null;

	// observe stage width
	$effect(() => {
		const el = containerEl;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			const w = Math.round(entries[0].contentRect.width);
			width = w;
		});
		ro.observe(el);
		return () => ro.disconnect();
	});

	// layout + FLIP — re-runs when expandedId or width change
	$effect(() => {
		const w = width;
		const exp = expandedId;
		const container = containerEl;
		if (!container || !w) return;

		const tiles = Array.from(container.querySelectorAll<HTMLElement>('.mtile'));
		if (!tiles.length) return;

		const layout = computeLayout(frames, w, exp);
		const widthChanged = w !== lastWidth;
		const expandChanged = exp !== prevExpanded;
		const isFirst = first;
		const animate = !isFirst && !widthChanged && typeof tiles[0].animate === 'function';

		const prevH = container.offsetHeight;

		// FIRST — record current boxes from committed inline geometry
		const old = animate
			? tiles.map((t) => ({
					x: parseFloat(t.style.left) || 0,
					y: parseFloat(t.style.top) || 0,
					w: parseFloat(t.style.width) || 1,
					h: parseFloat(t.style.height) || 1
				}))
			: null;

		// LAST — commit new geometry
		tiles.forEach((t, i) => {
			const p = layout.pos[i];
			t.style.left = `${p.x}px`;
			t.style.top = `${p.y}px`;
			t.style.width = `${p.w}px`;
			t.style.height = `${p.h}px`;
		});

		if (animate && old) {
			// INVERT + PLAY — translate/scale each tile from its old box to the new one
			tiles.forEach((t, i) => {
				const o = old[i];
				const n = layout.pos[i];
				const dx = o.x - n.x;
				const dy = o.y - n.y;
				const sx = o.w / n.w;
				const sy = o.h / n.h;
				if (
					Math.abs(dx) < 0.5 &&
					Math.abs(dy) < 0.5 &&
					Math.abs(sx - 1) < 0.002 &&
					Math.abs(sy - 1) < 0.002
				)
					return;
				t.animate(
					[
						{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
						{ transform: 'none' }
					],
					{ duration: MOTION * 1000, easing: EASE }
				);
			});

			// height eases independently so the document grows/shrinks without snapping
			container.animate([{ height: `${prevH}px` }, { height: `${layout.totalH}px` }], {
				duration: MOTION * 1000,
				easing: EASE
			});
			container.style.height = `${layout.totalH}px`;

			// center the opened frame in the viewport (never on collapse).
			// The fixed nav overlaps the top, so center within the area *below* it.
			if (expandChanged && exp != null) {
				const idx = frames.findIndex((im) => im.id === exp);
				const p = layout.pos[idx];
				const nav = document.querySelector('nav')?.getBoundingClientRect().height ?? 70;
				const contTop = container.getBoundingClientRect().top + window.scrollY;
				const frameCenter = contTop + p.y + p.h / 2;
				// center within the window, then drop by the full nav height so it clears the bar
				const y = Math.max(0, frameCenter - window.innerHeight / 2 - nav);
				window.scrollTo({ top: y, behavior: 'smooth' });
			}
		} else {
			container.style.height = `${layout.totalH}px`;
			if (isFirst) requestAnimationFrame(() => (ready = true));
		}

		first = false;
		lastWidth = w;
		prevExpanded = exp;
	});

	const toggle = (id: number) => (expandedId = expandedId === id ? null : id);
</script>

<div
	bind:this={containerEl}
	class="masonry"
	class:ready
	class:has-open={expandedId !== null}
	style="border-radius:{RADIUS}px"
>
	{#each frames as im, i (im.id)}
		{@const proj = projectByPicture[im.name]}
		<!-- .mtile carries the packed geometry (set inline by the FLIP effect) and the
			 is-expanded flag the dim-others CSS keys off of. The button inside handles the
			 expand/collapse toggle; the project tag is a sibling link so it can navigate
			 without nesting an <a> in a <button> (invalid HTML). -->
		<!-- No blanket will-change here: with 60+ frames it asks the compositor for a
			 layer per tile, each holding a large decoded image, which costs far more
			 than it saves. The FLIP below uses the Web Animations API, so the browser
			 promotes the tiles it is actually animating on its own. -->
		<div
			class="mtile absolute left-0 top-0 origin-top-left overflow-hidden bg-[#141318] {expandedId ===
			im.id
				? 'is-expanded'
				: ''}"
			style="border-radius:{RADIUS}px"
		>
			<button
				type="button"
				class="absolute inset-0 block h-full w-full border-0 bg-transparent p-0 outline-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-gold {expandedId ===
				im.id
					? 'cursor-zoom-out'
					: 'cursor-pointer'}"
				onclick={() => toggle(im.id)}
				aria-label={expandedId === im.id ? `Collapse ${label(im)}` : `Expand ${label(im)}`}
			>
				<!-- Eager only for the frames that can plausibly be on screen at load.
					 Eager-loading all 61 put that many simultaneous decodes in front of the
					 first paint and the entrance animation; the rest stream in on scroll. -->
				<Pic pic={im} sizes={SIZES} eager={i < EAGER_COUNT} />
			</button>

			{#if proj && expandedId === im.id}
				<a
					href="/projects/{proj.slug}"
					class="tag-from group absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-1 px-5 pb-5 pt-16 no-underline"
				>
					<span class="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/70">
						From the project
					</span>
					<span
						class="flex items-center gap-2 font-serif text-[clamp(17px,1.7vw,24px)] leading-tight text-white"
					>
						{proj.title}
						<span
							aria-hidden="true"
							class="text-gold transition-transform duration-300 group-hover:translate-x-1"
						>
							→
						</span>
					</span>
				</a>
			{/if}
		</div>
	{/each}
</div>

<style>
	.masonry {
		position: relative;
		width: 100%;
		margin: 0 auto;
		opacity: 0;
		transition: opacity 0.55s ease;
	}
	.masonry.ready {
		opacity: 1;
	}
	/* "From the project" tag over an expanded frame: a dark bottom gradient with a
		 subtle backdrop blur, masked so the blur itself fades out toward the top
		 (otherwise it would blur the whole image, not just the caption band). */
	.tag-from {
		background-image: linear-gradient(
			to top,
			rgba(0, 0, 0, 0.85),
			rgba(0, 0, 0, 0.55) 50%,
			transparent
		);
		backdrop-filter: blur(3px);
		-webkit-backdrop-filter: blur(3px);
		-webkit-mask-image: linear-gradient(to top, #000 62%, transparent);
		mask-image: linear-gradient(to top, #000 62%, transparent);
		mix-blend-mode: normal;
		text-shadow: 0 1px 8px rgba(0, 0, 0, 0.8);
		animation: tag-rise 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) 0.5s both;
	}
	@keyframes tag-rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tag-from {
			animation-duration: 0.01ms;
			animation-delay: 0ms;
		}
	}

	/* Dimming uses opacity rather than a filter. `filter` forces a repaint of every
		 affected image, and with one frame open that meant animating a filter across
		 sixty large images at once, which is a visible stall (Firefox especially).
		 Opacity is composited, so the same recede costs almost nothing. The tiles sit
		 on a near-black stage, so fading toward it reads much like the old darkening. */
	.mtile :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform: scale(1.001); /* avoids hairline edge on scale-in */
		transition:
			transform 0.7s cubic-bezier(0.2, 0.7, 0.3, 1),
			opacity 0.4s ease;
	}
	@media (hover: hover) {
		.mtile:hover :global(img) {
			transform: scale(1.045);
		}
		/* gently recede the rest while one frame is open */
		.masonry.has-open .mtile:not(.is-expanded) :global(img) {
			opacity: 0.5;
		}
		.masonry.has-open .mtile:not(.is-expanded):hover :global(img) {
			opacity: 0.82;
		}
	}
</style>
