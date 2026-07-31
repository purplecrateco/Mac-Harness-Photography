<script lang="ts">
	import Button from './Button.svelte';
	import { scrollToId } from '$lib/scroll';
	import { copy } from '$lib/content/copy';

	const t = copy.hero;

	/* warm radial wash — kept inline; the arbitrary-value form would be unreadable.
	   Now the base *behind* the hero photo: it still shows through the scrim's warmth
	   and covers the frame before the photo decodes. */
	const warmBg =
		// bottom linear fades the warm wash into the page base (#070708) so there's no seam to the next section
		'linear-gradient(to bottom, transparent 55%, #070708 100%),' +
		'radial-gradient(130% 110% at 22% -10%, #34291c 0%, #1d180f 50%, #131218 100%)';

	/* Two stacked layers:
	   1. bottom fade, so the hero lands on the page base (#070708) with no seam;
	   2. a flat 0.60 wash — the WCAG floor, not a mood choice.

	   The photo runs from blown highlight (relative luminance 1.0) to black silhouette
	   (0.0) *within a single line of text*, so no text colour clears 4.5:1 on its own —
	   measured, not assumed. 0.60 is the lightest wash that clears 3:1 for the wordmarks
	   and 4.5:1 for the 10–13px copy (with --color-gold-hero; plain --color-gold would
	   need 0.70). Lower it and the hero fails AA. */
	const scrim =
		'linear-gradient(to bottom, transparent 62%, #070708 100%),' +
		'linear-gradient(rgba(7,7,8,0.6), rgba(7,7,8,0.6))';
</script>

<header
	id="top"
	class="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-24 lg:pt-40"
	style="background:{warmBg}"
>
	<!-- Full-bleed hero photo — object-cover, so the crop is the viewport's job and this
		 holds up from phone to ultrawide with no fixed aspect ratio.

		 The 66% horizontal anchor is the mobile fix, and it is not cosmetic: Mac sits at
		 x=962 of 1560 in the source, so on a narrow portrait viewport a centred crop
		 lands him at 95% of the frame with his head clipped off. 66% puts him at 49% on
		 a 375px screen. It costs desktop almost nothing (64% -> 61%) and nothing at all
		 above ~1780px, where the full width is visible and the crop is vertical. -->
	<img
		data-anim="hero-photo"
		src="/IMG_7387.JPG"
		alt="Mac Harness seated on the hood of a Cadillac at dusk"
		class="absolute inset-0 z-0 h-full w-full object-cover object-[66%_center] brightness-[1.35] saturate-[1.05]"
		draggable="false"
	/>
	<div aria-hidden="true" class="absolute inset-0 z-[1]" style="background:{scrim}"></div>

	<!-- The wordmark below is one logical title split across two absolutely-positioned
		 pieces, so it can't be the h1 without shipping two of them. The real h1 is here,
		 visually hidden, and the two pieces are decorative to assistive tech. Nothing about
		 their geometry changed — same classes, same data-anim hooks, div instead of h1. -->
	<h1 class="sr-only">{t.name_top} {t.name_bottom} — photographer</h1>

	<!-- z-[2] lifts the whole text layer above the scrim; the z-indices inside are
		 scoped to this element's own stacking context and are unchanged. -->
	<div class="relative z-[2] mx-auto h-[min(86svh,800px)] w-full max-w-[1320px] px-6 sm:px-10 min-[761px]:max-[1023px]:translate-y-16 lg:translate-y-24 lg:px-14">
		<div
			aria-hidden="true"
			data-anim="hero-name"
			class="t-mac pointer-events-none absolute left-6 top-[-2%] z-[1] m-0 select-none font-serif-display text-[clamp(82px,15.5vw,232px)] leading-[0.78] tracking-[-0.01em] text-gold-hero max-[760px]:top-[7%] sm:left-10 lg:left-14"
		>
			{t.name_top}
		</div>
		<div
			aria-hidden="true"
			data-anim="hero-name"
			class="t-harness pointer-events-none absolute right-6 top-[26%] lg:top-[max(30%,245px)] z-[3] m-0 select-none font-serif-display text-[clamp(66px,12.5vw,188px)] leading-[0.78] tracking-[-0.01em] text-gold-hero max-[760px]:top-[21%] sm:right-10 lg:right-14"
		>
			{t.name_bottom}
		</div>

		<p
			data-anim="hero-blurb"
			class="t-blurb absolute left-6 top-[46%] z-[4] w-[clamp(210px,22vw,290px)] font-mono text-[13px] uppercase leading-[1.75] tracking-[0.04em] text-ink sm:left-10 lg:left-14 max-[760px]:hidden"
		>
			{t.blurb}
		</p>


		<div
			data-anim="hero-fade"
			class="t-cta absolute right-[7%] top-[62%] z-[5] max-[760px]:bottom-[15%] max-[760px]:right-1/2 max-[760px]:top-auto max-[760px]:translate-x-1/2"
		>
			<Button onclick={() => scrollToId('contact')}>
				{t.cta} <span class="text-sm opacity-90">→</span>
			</Button>
		</div>
	</div>

	<div
		data-anim="hero-fade"
		class="t-scroll absolute bottom-6 left-1/2 z-[6] flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.26em] text-ink"
	>
		<span>{t.scroll_hint}</span>
		<i class="h-[34px] w-px bg-gradient-to-b from-ink-faint to-transparent"></i>
	</div>
</header>

<!-- Tablet / medium screens (bigger than phones, smaller than the lg desktop layout).
	 Recompose the hero the way it sits on desktop: MAC drops down-and-right, HARNESS
	 lifts up-and-left, and the blurb moves to the right above the CTA. -->
<style>
	@media (min-width: 761px) and (max-width: 1023px) {
		.t-mac {
			top: -4%;
			left: 4%;
		}
		.t-harness {
			top: 16%;
			right: 16%;
		}
		.t-blurb {
			left: auto;
			right: 7%; /* aligned over the CTA button */
			top: 38%;
			width: clamp(200px, 30vw, 280px);
			text-align: right;
		}
		.t-cta {
			top: 58%;
		}
		.t-scroll {
			display: flex; /* show the scroll prompt on tablet */
			bottom: 90px; /* lift it up off the bottom edge */
		}
	}
</style>
