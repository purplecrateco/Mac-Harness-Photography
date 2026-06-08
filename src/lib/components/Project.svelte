<script lang="ts">
	import Ph from './Ph.svelte';
	import Pic from './Pic.svelte';
	import Kicker from './Kicker.svelte';
	import Button from './Button.svelte';
	import type { Picture } from '$lib/content/pictures';

	// The most recent project (by year) is resolved server-side in +page.server.ts
	// and passed in here, so the homepage feature always reflects the newest project
	// with no edits to this component when one is added.
	type LatestProject = {
		slug: string;
		title: string;
		cat: string | null;
		year: string | null;
		cover: string | null;
		intro: string | null;
		// A few of the project's gallery pictures ("meta" images) for the collage.
		metaPics: Picture[];
	};

	let { project }: { project: LatestProject | null } = $props();

	// Accent the final word of the title in italic (e.g. "Salt & Silver" → Silver).
	const words = $derived((project?.title ?? '').trim().split(/\s+/));
	const titleHead = $derived(words.slice(0, -1).join(' '));
	const titleTail = $derived(words.at(-1) ?? '');

	// Right-hand collage: lead with the cover, then the project's meta images. The
	// collage targets 3 plates below the cover; when the project has fewer meta
	// images the remaining slots fall back to placeholders so it still reads full.
	const SLOTS = [
		{ w: 480, h: 360, label: 'PLATE 02' },
		{ w: 480, h: 360, label: 'PLATE 03' },
		{ w: 480, h: 600, label: 'PLATE 04' }
	];
	const metaPics = $derived(project?.metaPics ?? []);
	// Placeholder slots only for positions not covered by a real meta image.
	const fillerSlots = $derived(SLOTS.slice(metaPics.length));
</script>

{#if project}
	<section
		id="project"
		class="relative border-t border-white/[0.055] py-20 sm:py-28 lg:py-[140px]"
	>
		<div
			class="mx-auto grid w-full max-w-[1320px] grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-[72px] px-6 sm:px-10 lg:px-14 max-[900px]:grid-cols-1 max-[900px]:gap-12"
		>
			<div class="reveal">
				<Kicker>Latest Project</Kicker>
				<h2
					class="mb-7 mt-3.5 font-serif text-[clamp(40px,5.4vw,76px)] font-normal leading-[0.96] tracking-[-0.01em] text-ink"
				>
					{#if titleHead}{titleHead}&nbsp;{/if}<em class="italic text-gold">{titleTail}</em>
				</h2>
				{#if project.intro}
					<p class="mb-5 max-w-[46ch] text-[18px] leading-[1.65] text-ink-dim">
						{project.intro}
					</p>
				{/if}
				{#if project.cat || project.year}
					<p class="mb-[34px] font-mono text-[13px] leading-[1.7] tracking-[0.02em] text-ink-faint">
						{[project.cat, project.year].filter(Boolean).join(' · ')}
					</p>
				{/if}
				<div class="flex flex-wrap items-center gap-3">
					<Button variant="ghost" href="/projects/{project.slug}">
						View project <span class="text-sm opacity-90">→</span>
					</Button>
					<Button variant="ghost" href="/projects">
						View all projects <span class="text-sm opacity-90">→</span>
					</Button>
				</div>
			</div>

			<div class="reveal columns-2 gap-x-4">
				{#if project.cover}
					<div class="group mb-4 break-inside-avoid overflow-hidden rounded-xl">
						<img
							src={project.cover}
							alt={project.title}
							draggable="false"
							class="block h-auto w-full border border-glass-line bg-[#15151a] object-cover shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)] transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover:scale-[1.04]"
							style="border-radius:12px"
						/>
					</div>
				{/if}
				{#each metaPics as pic (pic.id)}
					<a
						href="/projects/{project.slug}"
						class="group mb-4 block break-inside-avoid overflow-hidden rounded-xl border border-glass-line bg-[#15151a] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)]"
						aria-label="View {project.title}"
					>
						<Pic
							{pic}
							sizes="(max-width: 900px) 90vw, 420px"
							class="!h-auto transition-transform duration-[600ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover:scale-[1.04]"
						/>
					</a>
				{/each}
				{#each fillerSlots as s (s.label)}
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
{/if}
