/* Shared homepage-style GSAP motion for the secondary pages (/projects, /gallery).
   - LOAD: the intro header staggers in.
   - SCROLL: content reveals (table rows / masonry tiles) batch in as they enter view.
   GSAP + ScrollTrigger are dynamically imported (code-split, client-only).

   Safety: respects prefers-reduced-motion, and "arms" animatable elements (hides them
   via a class) synchronously before paint so there's no reveal flash — with a failsafe
   timeout + try/catch that un-hides everything if GSAP never loads, so content is never
   stranded with JS off or on error. Returns a cleanup for onMount. */

type MotionOptions = {
	/** selector (scoped to root) for elements that batch-reveal on scroll */
	batch?: string;
};

export function initPageMotion(root: HTMLElement, opts: MotionOptions = {}): () => void {
	if (typeof window === 'undefined') return () => {};
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

	// hide animatable elements before first paint (see route <style> for the rules)
	root.classList.add('motion-armed');

	let ctx: { revert: () => void } | undefined;
	let cancelled = false;
	const failsafe = window.setTimeout(() => root.classList.remove('motion-armed'), 4000);

	(async () => {
		try {
			const [{ gsap }, { ScrollTrigger }] = await Promise.all([
				import('gsap'),
				import('gsap/ScrollTrigger')
			]);
			if (cancelled) return;
			gsap.registerPlugin(ScrollTrigger);

			ctx = gsap.context(() => {
				root.classList.add('gsap-ready');

				// ---------- LOAD: intro header entrance ----------
				const loadEls = gsap.utils.toArray<HTMLElement>('[data-anim="intro"] [data-load]', root);
				if (loadEls.length) {
					gsap.from(loadEls, {
						y: 26,
						autoAlpha: 0,
						duration: 0.9,
						ease: 'power3.out',
						stagger: 0.12
					});
				}

				// ---------- SCROLL: generic reveals (parity with the homepage) ----------
				gsap.utils.toArray<HTMLElement>('.reveal:not([data-anim])', root).forEach((el) => {
					gsap.from(el, {
						autoAlpha: 0,
						y: 40,
						duration: 0.9,
						ease: 'power3.out',
						scrollTrigger: { trigger: el, start: 'top 85%' }
					});
				});

				// ---------- SCROLL: staggered batch reveal (rows / tiles) ----------
				if (opts.batch) {
					const items = gsap.utils.toArray<HTMLElement>(opts.batch, root);
					if (items.length) {
						gsap.set(items, { autoAlpha: 0, y: 40 });
						ScrollTrigger.batch(items, {
							start: 'top 88%',
							onEnter: (b) =>
								gsap.to(b, {
									autoAlpha: 1,
									y: 0,
									duration: 0.7,
									ease: 'power3.out',
									stagger: 0.07,
									overwrite: true
								})
						});
					}
				}

				// content/images settle the layout → recompute trigger positions
				requestAnimationFrame(() => ScrollTrigger.refresh());
				window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
			}, root);
		} catch {
			root.classList.remove('motion-armed'); // never strand content
		}
	})();

	return () => {
		cancelled = true;
		window.clearTimeout(failsafe);
		ctx?.revert();
		root.classList.remove('motion-armed');
	};
}
