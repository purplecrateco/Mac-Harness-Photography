/* Client behaviour that was reactive state in Svelte components, plus the entry point for
 * the GSAP entrance/scroll motion.
 *
 * Bundled by esbuild (the `js:11ty` script) because animate.js imports gsap.
 */
import { initMasonry } from './masonry.js';
import { initAnimations } from './animate.js';

/** Smooth-scroll to an element by id, offsetting for the fixed nav bar. */
function scrollToId(id) {
	const el = document.getElementById(id);
	if (!el) return false;
	window.scrollTo({
		top: el.getBoundingClientRect().top + window.scrollY - 70,
		behavior: 'smooth'
	});
	return true;
}

/* NavBar `scrolled` state. Was $effect + $state; the classes are the same two sets the
   component toggled between. */
const nav = document.querySelector('[data-navbar]');
const backToTop = document.querySelector('[data-back-to-top]');
const SCROLLED = ['border-white/[0.07]', 'bg-[rgba(8,8,11,0.62)]', 'py-[14px]'];
const RESTING = ['border-transparent', 'bg-[rgba(8,8,11,0.3)]', 'py-5'];

function onScroll() {
	if (nav) {
		const on = window.scrollY > 24;
		nav.classList.toggle(SCROLLED[0], on);
		nav.classList.toggle(SCROLLED[1], on);
		nav.classList.toggle(SCROLLED[2], on);
		nav.classList.toggle(RESTING[0], !on);
		nav.classList.toggle(RESTING[1], !on);
		nav.classList.toggle(RESTING[2], !on);
	}
	// Shown on the homepage, or anywhere the top of the document has scrolled out of
	// view — i.e. where there is actually somewhere to scroll back to.
	if (backToTop && location.pathname !== '/') backToTop.hidden = window.scrollY <= 0;
}
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* In-page section links. On the homepage these scroll; elsewhere the href (/#section) is
   left alone so it navigates for real. Also closes the mobile drawer, which is what
   NavBar's onLink did. */
const dialog = document.querySelector('[data-nav-dialog]');
document.addEventListener('click', (e) => {
	const link = e.target.closest('[data-scroll-to]');
	if (!link) return;
	if (dialog?.open) dialog.close();
	const id = link.dataset.scrollTo;
	if (location.pathname === '/' && scrollToId(id)) e.preventDefault();
});

document.querySelector('[data-back-to-top]')?.addEventListener('click', (e) => {
	e.preventDefault();
	window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* Mobile drawer. <dialog>.showModal() brings the focus trap, Escape handling, ::backdrop
   and inert background with it — the parts bits-ui was supplying. */
const openBtn = document.querySelector('[data-nav-open]');
if (dialog && openBtn) {
	const sync = () => openBtn.setAttribute('aria-expanded', String(dialog.open));
	openBtn.addEventListener('click', () => {
		dialog.showModal();
		sync();
	});
	dialog.querySelector('[data-nav-close]')?.addEventListener('click', () => dialog.close());
	dialog.addEventListener('close', sync);
	// Click on the backdrop (i.e. outside the panel) closes, matching the Sheet.
	dialog.addEventListener('click', (e) => {
		if (e.target === dialog) dialog.close();
	});
}

/* Layout first, then reveal. The masonry has to commit its geometry before GSAP fades the
   tiles in, or the batch reveal animates tiles that are still stacked at 0x0.

   initAnimations() owns releasing .motion-armed: it disarms only after the `from` tweens
   have applied their start states, so nothing flashes at its final position. Do not disarm
   here as well. */
const masonry = document.querySelector('.masonry');
if (masonry) initMasonry(masonry);

const projects = document.querySelector('[data-projects]');
if (projects) {
	const { initProjectsTable } = await import('./projects-table.js');
	initProjectsTable(projects);
}

initAnimations();
