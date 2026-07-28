<script lang="ts">
	import { onMount } from 'svelte';
	import Seo from '$lib/components/Seo.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Gallery from '$lib/components/Gallery.svelte';
	import Project from '$lib/components/Project.svelte';
	import About from '$lib/components/About.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pageEl: HTMLDivElement;

	onMount(() => {
		// Respect reduced-motion: leave the CSS .reveal fades in place and skip GSAP.
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		let ctx: { revert: () => void } | undefined;
		let cancelled = false;

		(async () => {
			const [{ gsap }, { ScrollTrigger }] = await Promise.all([
				import('gsap'),
				import('gsap/ScrollTrigger')
			]);
			if (cancelled) return;
			gsap.registerPlugin(ScrollTrigger);

			ctx = gsap.context(() => {
				// Hand reveal control to GSAP (neutralises the CSS .reveal fade on this page).
				pageEl.classList.add('gsap-ready');

				// ---------- LOAD: hero entrance ----------
				const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
				tl.from('[data-anim="hero-name"]', {
					yPercent: 24,
					autoAlpha: 0,
					duration: 1.1,
					stagger: 0.15
				})
					.from(
						'[data-anim="hero-portrait"] img',
						{ y: 70, autoAlpha: 0, duration: 1.1 },
						'-=0.8'
					)
					.from('[data-anim="hero-blurb"]', { y: 18, autoAlpha: 0, duration: 0.8 }, '-=0.7')
					.from(
						'[data-anim="hero-fade"]',
						{ autoAlpha: 0, duration: 0.8, stagger: 0.12 },
						'-=0.6'
					);

				// ---------- SCROLL: section reveals ----------
				gsap.utils.toArray<HTMLElement>('.reveal:not([data-anim])').forEach((el) => {
					gsap.from(el, {
						autoAlpha: 0,
						y: 40,
						duration: 0.9,
						ease: 'power3.out',
						scrollTrigger: { trigger: el, start: 'top 85%' }
					});
				});

				// ---------- SCROLL: gallery tiles stagger in ----------
				const grid = pageEl.querySelector<HTMLElement>('[data-anim="gallery"]');
				if (grid) {
					gsap.from(Array.from(grid.children), {
						autoAlpha: 0,
						y: 50,
						duration: 0.7,
						ease: 'power3.out',
						stagger: 0.07,
						scrollTrigger: { trigger: grid, start: 'top bottom' }
					});
				}

				// ---------- SCROLL: subtle portrait parallax ----------
				// xPercent:-50 preserves the centering (it owns the transform once GSAP touches it).
				gsap.fromTo(
					'[data-anim="hero-portrait"]',
					{ xPercent: -50, yPercent: 0 },
					{
						xPercent: -50,
						yPercent: 12,
						ease: 'none',
						scrollTrigger: {
							trigger: '#top',
							start: 'top top',
							end: 'bottom top',
							scrub: true
						}
					}
				);

				// images settle the layout after load → recompute trigger positions
				requestAnimationFrame(() => ScrollTrigger.refresh());
				window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
			}, pageEl);
		})();

		return () => {
			cancelled = true;
			ctx?.revert();
		};
	});
</script>

<Seo title="Mac Harness" />

<div class="page" bind:this={pageEl}>
	<NavBar />
	<Hero />
	<!-- Default section order from homepageApp.jsx: gallery → project → about → contact -->
	<Gallery pictures={data.peekPics} />
	<Project project={data.latest} />
	<About />
	<Contact />
	<Footer />
</div>

<!-- Only active on the homepage (scoped by .gsap-ready, added by JS). If JS is off or
	 reduced-motion is set, the original CSS .reveal fades remain and nothing is hidden. -->
<style>
	:global(.gsap-ready .reveal) {
		animation: none;
	}
</style>
