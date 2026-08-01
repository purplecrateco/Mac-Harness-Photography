/* Cursor-following crossfade preview for the projects table — vanilla port of the
 * client half of ProjectsTable.svelte.
 *
 * The rAF easing loop and the cover warming are ported as-is; they never needed Svelte.
 * The crossfade `stack` (a keyed list in Svelte) becomes two fixed layers that alternate,
 * which is all the markup ever showed: the incoming layer and the one it replaces.
 */
const LAG = 0.12; // eased cursor follow factor

export function initProjectsTable(root) {
	const table = root.querySelector('[data-table]');
	const preview = root.querySelector('[data-preview]');
	if (!table || !preview) return;

	const layers = Array.from(preview.querySelectorAll('img'));
	if (layers.length < 2) return;

	let hovering = false;
	let front = 0; // index of the layer currently on top
	let currentSrc = null;

	const target = { x: -9999, y: -9999 };
	const pos = { x: -9999, y: -9999 };

	/* Warm the hover previews. These covers appear nowhere else on the page, so without
	   this the first hover over each row waits on a fetch and then a decode — exactly when
	   the delay is most obvious. Deferred to idle so it never competes with the page's own
	   render, and limited to rows that actually have a cover. */
	const covers = [
		...new Set(
			Array.from(table.querySelectorAll('[data-cover]'))
				.map((el) => el.dataset.cover)
				.filter(Boolean)
		)
	];
	if (covers.length) {
		const warm = () => {
			for (const src of covers) {
				const img = new Image();
				img.decoding = 'async';
				img.src = src;
				// Decode now too, so the first hover pays neither fetch nor decode.
				img.decode?.().catch(() => {
					/* decode is best-effort; the fetch above is what matters */
				});
			}
		};
		if (typeof window.requestIdleCallback === 'function') {
			window.requestIdleCallback(warm, { timeout: 2000 });
		} else {
			window.setTimeout(warm, 400);
		}
	}

	// eased cursor follow — preview centred on the cursor
	const ease = Math.min(0.35, Math.max(0.04, LAG));
	(function tick() {
		pos.x += (target.x - pos.x) * ease;
		pos.y += (target.y - pos.y) * ease;
		preview.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
		requestAnimationFrame(tick);
	})();

	const setHovering = (on) => {
		hovering = on;
		preview.classList.toggle('opacity-100', on);
		preview.classList.toggle('opacity-0', !on);
	};

	table.addEventListener('mousemove', (e) => {
		target.x = e.clientX;
		target.y = e.clientY;
	});

	table.addEventListener('mouseleave', () => {
		setHovering(false);
		table.dataset.hovering = 'false';
	});

	for (const row of table.querySelectorAll('[data-anim="row"]')) {
		row.addEventListener('mouseenter', (e) => {
			table.dataset.hovering = 'true';
			const src = row.dataset.cover;
			/* No cover in frontmatter means no preview: hide the panel rather than reach out
			   to a third-party placeholder service for a decorative image. */
			if (!src) {
				setHovering(false);
				return;
			}
			// Seed position on first contact so the preview doesn't fly in from the corner.
			if (pos.x < -9000) {
				pos.x = e.clientX;
				pos.y = e.clientY;
			}
			setHovering(true);
			if (src === currentSrc) return;
			currentSrc = src;

			const incoming = layers[1 - front];
			const outgoing = layers[front];
			incoming.src = src;
			// Start slightly scaled up and transparent, then settle — the same two-step the
			// keyed stack produced via requestAnimationFrame.
			incoming.classList.remove('scale-100', 'opacity-100');
			incoming.classList.add('scale-[1.08]', 'opacity-0');
			requestAnimationFrame(() => {
				incoming.classList.remove('scale-[1.08]', 'opacity-0');
				incoming.classList.add('scale-100', 'opacity-100');
				outgoing.classList.remove('scale-100', 'opacity-100');
				outgoing.classList.add('scale-[0.96]', 'opacity-0');
			});
			front = 1 - front;
		});
	}
}
