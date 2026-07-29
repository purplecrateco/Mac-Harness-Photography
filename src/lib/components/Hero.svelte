<script lang="ts">
	import Ph from './Ph.svelte';
	import Button from './Button.svelte';
	import { scrollToId } from '$lib/scroll';
	import { copy } from '$lib/content/copy';

	const t = copy.hero;

	/* warm radial wash — kept inline; the arbitrary-value form would be unreadable */
	const warmBg =
		// bottom linear fades the warm wash into the page base (#070708) so there's no seam to the next section
		'linear-gradient(to bottom, transparent 55%, #070708 100%),' +
		'radial-gradient(130% 110% at 22% -10%, #34291c 0%, #1d180f 50%, #131218 100%)';
</script>

<header
	id="top"
	class="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-24 lg:pt-40"
	style="background:{warmBg}"
>
	<!-- The wordmark below is one logical title split across two absolutely-positioned
		 pieces, so it can't be the h1 without shipping two of them. The real h1 is here,
		 visually hidden, and the two pieces are decorative to assistive tech. Nothing about
		 their geometry changed — same classes, same data-anim hooks, div instead of h1. -->
	<h1 class="sr-only">{t.name_top} {t.name_bottom} — photographer</h1>

	<div class="relative mx-auto h-[min(86svh,800px)] w-full max-w-[1320px] px-6 sm:px-10 min-[761px]:max-[1023px]:translate-y-16 lg:translate-y-24 lg:px-14">
		<div
			aria-hidden="true"
			data-anim="hero-name"
			class="t-mac pointer-events-none absolute left-6 top-[-2%] z-[1] m-0 select-none font-serif-display text-[clamp(82px,15.5vw,232px)] leading-[0.78] tracking-[-0.01em] text-gold max-[760px]:top-[7%] sm:left-10 lg:left-14"
		>
			{t.name_top}
		</div>
		<div
			aria-hidden="true"
			data-anim="hero-name"
			class="t-harness pointer-events-none absolute right-6 top-[26%] lg:top-[max(30%,245px)] z-[3] m-0 select-none font-serif-display text-[clamp(66px,12.5vw,188px)] leading-[0.78] tracking-[-0.01em] text-gold max-[760px]:top-[21%] sm:right-10 lg:right-14"
		>
			{t.name_bottom}
		</div>

		<div
			data-anim="hero-portrait"
			class="t-portrait absolute bottom-[260px] left-1/2 z-[2] aspect-[46/68] w-[clamp(280px,32vw,440px)] -translate-x-1/2 max-[760px]:bottom-[380px] max-[760px]:w-[clamp(340px,82vw,420px)]"
		>
			<Ph
				w={920}
				h={1360}
				label="HERO PORTRAIT"
				src="/hero.png"
				alt="Portrait of Mac Harness"
				radius="20px 20px 0 0"
				class="!border-0 !bg-transparent !shadow-none"
			/>
		</div>

		<p
			data-anim="hero-blurb"
			class="t-blurb absolute left-6 top-[46%] z-[4] w-[clamp(210px,22vw,290px)] font-mono text-[13px] uppercase leading-[1.75] tracking-[0.04em] text-ink-dim sm:left-10 lg:left-14 max-[760px]:hidden"
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
		class="t-scroll absolute bottom-6 left-1/2 z-[6] flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.26em] text-ink-faint"
	>
		<span>{t.scroll_hint}</span>
		<i class="h-[34px] w-px bg-gradient-to-b from-ink-faint to-transparent"></i>
	</div>
</header>

<!-- Tablet / medium screens (bigger than phones, smaller than the lg desktop layout).
	 Recompose the hero so the words overlap the portrait the way they do on desktop:
	 MAC drops down-and-right, HARNESS lifts up-and-left, the portrait grows up-and-left
	 to overlap both, and the blurb moves to the right above the CTA. Portrait is
	 positioned via left/bottom/width only — GSAP owns its transform. -->
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
		.t-portrait {
			left: 40%;
			bottom: 90px;
			width: min(58vw, 470px);
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
