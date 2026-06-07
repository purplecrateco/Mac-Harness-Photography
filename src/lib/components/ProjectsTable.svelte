<script lang="ts">
	/* Editorial full-width project table. Each row reveals a square photo preview
	   that follows the cursor with eased lag and crossfades between projects.
	   Ported from projects.jsx — the cursor follow keeps its rAF loop; the row
	   hover / dim-others / crossfade states are expressed as Tailwind variants. */
	type Project = {
		slug: string;
		title: string;
		cat: string | null;
		year: string | null;
		cover: string | null;
	};

	// Projects come from the markdown files in src/lib/content/projects/, loaded
	// server-side and passed down from +page.svelte. No hardcoded list.
	let { projects = [] }: { projects?: Project[] } = $props();

	// Hover preview uses the project's own cover image. Fall back to a neutral
	// placeholder only when a project has no cover set in its frontmatter.
	const previewSrc = (p: Project) =>
		p.cover ?? `https://placehold.co/640x640/16161c/4c4c58?text=${encodeURIComponent(p.title.toUpperCase())}`;

	const lag = 0.12; // eased cursor follow factor (was a design tweak; sensible default)

	let hovering = $state(false);
	let stack = $state<{ key: number; src: string; shown: boolean }[]>([]);
	let counter = 0;

	let previewEl: HTMLDivElement | null = $state(null);
	const target = { x: -9999, y: -9999 };
	const pos = { x: -9999, y: -9999 };

	// eased cursor follow — preview centered on the cursor (client-only via $effect)
	$effect(() => {
		const ease = Math.min(0.35, Math.max(0.04, lag));
		let raf = 0;
		const tick = () => {
			pos.x += (target.x - pos.x) * ease;
			pos.y += (target.y - pos.y) * ease;
			if (previewEl)
				previewEl.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	function onMove(e: MouseEvent) {
		target.x = e.clientX;
		target.y = e.clientY;
	}

	function enterRow(p: Project, e: MouseEvent) {
		// seed position on first contact so the preview doesn't fly in from the corner
		if (pos.x < -9000) {
			pos.x = e.clientX;
			pos.y = e.clientY;
		}
		const src = previewSrc(p);
		const top = stack[stack.length - 1];
		hovering = true;
		if (top && top.src === src) return;
		const layer = { key: ++counter, src, shown: false };
		stack = [...stack.slice(-1), layer];
		requestAnimationFrame(() => {
			const last = stack[stack.length - 1];
			if (last && last.key === layer.key) last.shown = true;
		});
	}

	const rowGrid =
		'grid items-center gap-9 grid-cols-[minmax(0,1fr)_220px_92px] max-[760px]:grid-cols-[1fr_auto] max-[760px]:gap-x-[18px] max-[760px]:gap-y-2';
</script>

<section class="relative pb-[150px]">
	<div class="mx-auto w-full max-w-[1320px] px-6 sm:px-10 lg:px-14">
		<!-- group/tbl + data-hovering drive the "dim every row except the hovered one" effect -->
		<div
			class="group/tbl w-full border-t border-white/10"
			data-hovering={hovering}
			role="list"
			onmousemove={onMove}
			onmouseleave={() => (hovering = false)}
		>
			<div
				class="{rowGrid} px-1 py-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint max-[760px]:hidden"
			>
				<span>Project</span>
				<span>Category</span>
				<span class="text-right">Year</span>
			</div>

			{#each projects as p, i (p.slug)}
				<a
					href="/projects/{p.slug}"
					data-anim="row"
					onmouseenter={(e) => enterRow(p, e)}
					class="group/row relative block cursor-pointer border-b border-white/[0.07] no-underline"
				>
					<div class="{rowGrid} px-1 py-[30px] max-[760px]:py-[22px]">
						<span class="flex min-w-0 items-center gap-[18px]">
							<span
								class="flex-none font-mono text-xs tabular-nums tracking-[0.08em] text-ink-faint transition-colors duration-[350ms] group-hover/row:text-accent"
								>{String(i + 1).padStart(2, '0')}</span
							>
							<span
								class="flex-none whitespace-nowrap font-serif text-[clamp(28px,3.4vw,46px)] font-normal leading-none tracking-[-0.01em] text-ink transition-[color,transform] duration-[450ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] group-data-[hovering=true]/tbl:text-ink-faint group-hover/row:translate-x-2.5 group-hover/row:!text-ink"
								>{p.title}</span
							>
							<span
								class="h-[22px] w-[22px] flex-none translate-x-[-7px] translate-y-[7px] text-accent opacity-0 transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover/row:translate-x-0 group-hover/row:translate-y-0 group-hover/row:opacity-100"
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.7"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="block h-full w-full"
								>
									<path d="M14 4 h6 v6" />
									<path d="M20 4 L11.5 12.5" />
									<path
										d="M18 13.5 V18.5 a1.5 1.5 0 0 1 -1.5 1.5 H6.5 a1.5 1.5 0 0 1 -1.5 -1.5 V8.5 a1.5 1.5 0 0 1 1.5 -1.5 H11"
									/>
								</svg>
							</span>
						</span>
						<span
							class="font-mono text-[13px] tracking-[0.05em] text-ink-dim transition-colors duration-[350ms] group-hover/row:text-ink max-[760px]:col-start-1 max-[760px]:text-[11px] max-[760px]:text-ink-faint"
							>{p.cat}</span
						>
						<span
							class="text-right font-mono text-[13px] tabular-nums tracking-[0.05em] text-ink-dim transition-colors duration-[350ms] group-hover/row:text-ink max-[760px]:hidden"
							>{p.year}</span
						>
					</div>
				</a>
			{/each}
		</div>
	</div>

	<!-- cursor-following crossfade preview (hidden on touch / narrow screens) -->
	<div
		bind:this={previewEl}
		aria-hidden="true"
		class="pointer-events-none fixed left-0 top-0 z-40 aspect-square w-[clamp(280px,25vw,400px)] overflow-hidden rounded-[14px] border border-glass-line shadow-[0_40px_90px_-34px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)] transition-opacity duration-[400ms] [will-change:transform] max-[760px]:hidden [@media(hover:none)]:hidden {hovering
			? 'opacity-100'
			: 'opacity-0'}"
	>
		{#each stack as s, i (s.key)}
			<img
				src={s.src}
				alt=""
				draggable="false"
				class="absolute inset-0 h-full w-full bg-[#15151a] object-cover transition-all duration-700 ease-[cubic-bezier(0.2,0.7,0.3,1)] {i ===
				stack.length - 1
					? s.shown
						? 'scale-100 opacity-100'
						: 'scale-[1.08] opacity-0'
					: 'scale-[0.96] opacity-0'}"
			/>
		{/each}
	</div>
</section>
