/** Smooth-scroll to an element by id, offsetting for the fixed nav bar. */
export function scrollToId(id: string): void {
	const el = document.getElementById(id);
	if (el) {
		window.scrollTo({
			top: el.getBoundingClientRect().top + window.scrollY - 70,
			behavior: 'smooth'
		});
	}
}

export function scrollToTop(): void {
	window.scrollTo({ top: 0, behavior: 'smooth' });
}
