/* Shared homepage-style GSAP motion for the secondary pages (/projects, /gallery).
   - LOAD: the intro header staggers in.
   - SCROLL: content reveals (table rows / masonry tiles) batch in as they enter view.
   GSAP + ScrollTrigger are dynamically imported (code-split, client-only).

   Safety: respects prefers-reduced-motion. Animatable elements are hidden before the
   first paint by the inline script in app.html, which adds .motion-armed to <html> (see
   the rules in app.css); this releases that class once GSAP owns the start states. A
   failsafe timeout here and in that script un-hides everything if GSAP never loads, so
   content is never stranded with JS off or on error. Returns a cleanup for onMount.

   Everything below fades `opacity` and never GSAP's `autoAlpha` shorthand. autoAlpha
   also writes `visibility: hidden`, which drops the element out of the accessibility
   tree and makes its descendants unfocusable — and since a scroll reveal holds its
   start state until the trigger fires, that hid most of the page indefinitely. On the
   gallery it meant 4 of 61 frames were reachable by keyboard and one Tab jumped from
   the fourth frame to the footer. opacity alone leaves the elements focusable and
   exposed to a screen reader; the :focus-within rules in app.css then snap a reveal to
   its end state if the keyboard reaches it before the scroll trigger does. */

type MotionOptions = {
	/** selector (scoped to root) for elements that batch-reveal on scroll */
	batch?: string;
};

export function initPageMotion(root: HTMLElement, opts: MotionOptions = {}): () => void {
	if (typeof window === 'undefined') return () => {};
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

	// Already armed before first paint by app.html; this only ever releases it.
	const disarm = () => document.documentElement.classList.remove('motion-armed');

	let ctx: { revert: () => void } | undefined;
	let cancelled = false;
	const failsafe = window.setTimeout(disarm, 4000);

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
						opacity: 0,
						duration: 0.9,
						ease: 'power3.out',
						stagger: 0.12
					});
				}

				// `from` tweens apply their start state on creation, so the intro is now held
				// hidden by GSAP and the arming class can go.
				disarm();

				// ---------- SCROLL: generic reveals (parity with the homepage) ----------
				gsap.utils.toArray<HTMLElement>('.reveal:not([data-anim])', root).forEach((el) => {
					gsap.from(el, {
						opacity: 0,
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
						gsap.set(items, { opacity: 0, y: 40 });
						ScrollTrigger.batch(items, {
							start: 'top 88%',
							onEnter: (b) =>
								gsap.to(b, {
									opacity: 1,
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
			disarm(); // never strand content
		}
	})();

	return () => {
		cancelled = true;
		window.clearTimeout(failsafe);
		ctx?.revert();
		disarm();
	};
}
