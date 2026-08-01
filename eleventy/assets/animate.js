/* GSAP entrance and scroll motion — port of the onMount block in src/routes/+page.svelte
 * and src/lib/motion.ts.
 *
 * Safety properties carried over verbatim, because each exists for a reason:
 *
 * - Everything fades `opacity` and never GSAP's `autoAlpha`. autoAlpha also writes
 *   visibility:hidden, which drops the element out of the accessibility tree and makes its
 *   descendants unfocusable — and since a scroll reveal holds its start state until the
 *   trigger fires, that hid most of the page indefinitely. On the gallery it meant 4 of 61
 *   frames were reachable by keyboard and one Tab jumped from the fourth frame to the
 *   footer. opacity alone leaves elements focusable and exposed to a screen reader; the
 *   :focus-within rules in app.css then snap a reveal to its end state if the keyboard
 *   reaches it before the scroll trigger does.
 * - `from` tweens apply their start state on creation, so by the time disarm() runs the
 *   elements are held hidden by GSAP rather than by the arming class. Disarming before the
 *   timeline exists would flash content at its final position.
 * - Reduced motion skips GSAP entirely and leaves the CSS .reveal fades in place. The
 *   inline script in the layout skips arming in that case, so there is nothing to release.
 * - A failsafe timeout un-arms even if the dynamic import throws, so content is never
 *   stranded invisible.
 */
const disarm = () => document.documentElement.classList.remove('motion-armed');

export async function initAnimations() {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		// Nothing was armed, and the CSS fades handle the entrance.
		return;
	}

	/* Pages with no animation hooks get no GSAP at all — which is 404, matching
	   +error.svelte, the one route that never called initPageMotion. This is not just an
	   optimisation: adding .gsap-ready sets `animation: none` on .reveal, so running here
	   would disable that page's CSS entrance fade and hand its only reveal mechanism to a
	   ScrollTrigger it doesn't need. */
	if (!document.querySelector('[data-anim]')) return;

	const failsafe = window.setTimeout(disarm, 4000);

	let gsap, ScrollTrigger;
	try {
		({ gsap } = await import('gsap'));
		({ ScrollTrigger } = await import('gsap/ScrollTrigger'));
	} catch {
		disarm(); // never strand the hero hidden if GSAP fails to load
		return;
	}
	window.clearTimeout(failsafe);
	gsap.registerPlugin(ScrollTrigger);

	const page = document.querySelector('.page');
	// Hands reveal control to GSAP, neutralising the CSS .reveal fade on this page.
	page?.classList.add('gsap-ready');

	const isHome = !!document.querySelector('[data-anim="hero-photo"]');

	if (isHome) {
		// ---------- LOAD: hero entrance ----------
		const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
		tl.from('[data-anim="hero-name"]', {
			yPercent: 24,
			opacity: 0,
			duration: 1.1,
			stagger: 0.15
		})
			// Fade only — the photo is full-bleed, so any y offset would slide a bare edge
			// into frame.
			.from('[data-anim="hero-photo"]', { opacity: 0, duration: 1.2 }, '-=0.8')
			.from('[data-anim="hero-blurb"]', { y: 18, opacity: 0, duration: 0.8 }, '-=0.7')
			.from('[data-anim="hero-fade"]', { opacity: 0, duration: 0.8, stagger: 0.12 }, '-=0.6');
	} else {
		// ---------- LOAD: secondary-page intro header staggers in ----------
		const loadEls = gsap.utils.toArray('[data-anim="intro"] [data-load]');
		if (loadEls.length) {
			gsap.from(loadEls, {
				y: 26,
				opacity: 0,
				duration: 0.9,
				ease: 'power3.out',
				stagger: 0.12
			});
		}
	}

	// The start states are now owned by GSAP, so the arming class can go.
	disarm();

	// ---------- SCROLL: generic section reveals ----------
	gsap.utils.toArray('.reveal:not([data-anim])').forEach((el) => {
		gsap.from(el, {
			opacity: 0,
			y: 40,
			duration: 0.9,
			ease: 'power3.out',
			scrollTrigger: { trigger: el, start: 'top 85%' }
		});
	});

	// ---------- SCROLL: homepage gallery peek tiles stagger in ----------
	const grid = document.querySelector('[data-anim="gallery"]');
	if (grid) {
		gsap.from(Array.from(grid.children), {
			opacity: 0,
			y: 50,
			duration: 0.7,
			ease: 'power3.out',
			stagger: 0.07,
			scrollTrigger: { trigger: grid, start: 'top bottom' }
		});
	}

	/* ---------- SCROLL: staggered batch reveal (masonry tiles / project rows) ----------
	   Which collection depends on the page; both are armed to opacity 0 by CSS, so
	   whichever exists here must be the one that gets released. */
	const batchSelector = document.querySelector('.mtile')
		? '.mtile'
		: document.querySelector('[data-anim="row"]')
			? '[data-anim="row"]'
			: null;

	if (batchSelector) {
		const items = gsap.utils.toArray(batchSelector);
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
}
