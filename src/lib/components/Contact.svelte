<script lang="ts">
	import Kicker from './Kicker.svelte';
	import { copy, lines } from '$lib/content/copy';

	const t = copy.contact;
	const studioLines = lines(t.studio_lines);
	const followLinks = t.follow_links ?? [];
</script>

<section id="contact" class="relative border-t border-white/[0.055] py-20 text-center sm:py-28 lg:py-[140px]">
	<div class="reveal mx-auto w-full max-w-[1320px] px-6 sm:px-10 lg:px-14">
		<Kicker center>{t.kicker}</Kicker>
		<h2
			class="mx-auto mt-[18px] max-w-[14ch] font-serif text-[clamp(52px,9vw,128px)] font-normal leading-[0.94] tracking-[-0.015em]"
		>
			{t.heading} <em class="italic text-gold">{t.heading_accent}</em>.
		</h2>
		<p class="mx-auto mb-12 mt-7 max-w-[48ch] text-[18px] leading-[1.6] text-ink-dim">
			{t.blurb}
		</p>
		<a
			href="mailto:{t.email}"
			class="inline-flex max-w-full flex-wrap items-center justify-center gap-3.5 break-all border-b border-glass-line pb-2 font-serif text-[clamp(24px,3.4vw,44px)] text-ink no-underline transition hover:border-gold hover:text-gold"
		>
			{t.email} <span class="text-[0.7em] opacity-90">→</span>
		</a>

		<div class="mt-16 flex flex-wrap justify-center gap-x-10 gap-y-10 sm:gap-[60px]">
			<div class="text-left">
				<div class="mb-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
					{t.studio_title}
				</div>
				<div class="text-[16px] leading-[1.7] text-ink">
					{#each studioLines as line, i (line)}{#if i}<br />{/if}{line}{/each}
				</div>
			</div>
			<div class="text-left">
				<div class="mb-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
					{t.follow_title}
				</div>
				<div class="text-[16px] leading-[1.7] text-ink">
					{#each followLinks as l, i (l.label)}{#if i}<br />{/if}<a
							href={l.url}
							class="text-ink-dim no-underline transition hover:text-gold">{l.label}</a
						>{/each}
				</div>
			</div>
			<div class="text-left">
				<div class="mb-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
					{t.enquiries_title}
				</div>
				<div class="text-[16px] leading-[1.7] text-ink">
					<a href="mailto:{t.email}" class="text-ink-dim no-underline transition hover:text-gold"
						>{t.email}</a
					><br />{t.phone}
				</div>
			</div>
		</div>
	</div>
</section>
