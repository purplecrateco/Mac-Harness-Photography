/* Interactive masonry gallery — vanilla port of MasonryGallery.svelte.
 *
 * A true masonry layout packed explicitly in JS (greedy skyline); one featured tile
 * expands to ~2 columns and the rest reflow. Each layout change animates as a single
 * cohesive FLIP transition, done with the native Web Animations API rather than GSAP so
 * no animation dependency is pulled in. The viewport eases to centre the opened frame
 * and the stage height grows/shrinks smoothly.
 *
 * What changed from the Svelte original, and what didn't:
 *
 * - The packing algorithm, the FLIP, the reduced-motion handling and the scroll-to-centre
 *   are ported line for line. They never depended on Svelte.
 * - `$state` + `$effect` become an explicit `relayout()` plus `first`/`lastWidth`/
 *   `prevExpanded` module state. The effect already tracked those manually, so this is
 *   the same control flow written out.
 * - Frame geometry is read from data attributes on the tiles instead of a prop, so the
 *   61-frame dataset isn't serialised into the page a second time as JSON.
 *
 * Intrinsic width/height come from the build (eleventy-img), so the first layout is
 * correct on first paint with no reflow — the property the whole design depends on.
 */
const GAP = 12;
const TILE = 340; // target column width — larger ⇒ fewer columns ⇒ bigger tiles
const MOTION = 0.72; // seconds
const EASE = 'cubic-bezier(0.65,0,0.35,1)'; // ≈ power3.inOut

/* Queried at the moment of animating rather than cached, matching how the rest of the
   site asks — no listener to keep in sync, and an OS-level change mid-session is picked
   up on the next layout pass. */
const prefersReducedMotion = () =>
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* greedy skyline packing: N equal columns; each frame drops into the shortest slot.
   The expanded frame reserves two columns and the rest reflow around it.

   `viewportH` is a parameter rather than reading window.innerHeight inline, purely so the
   packing can be exercised in Node — see scripts/check-masonry.mjs. Default preserves the
   original behaviour exactly. */
export function computeLayout(items, width, expandedId, viewportH = window.innerHeight) {
	const cols = Math.max(2, Math.min(6, Math.round(width / TILE)));
	const colW = (width - GAP * (cols - 1)) / cols;
	const colH = new Array(cols).fill(0);
	const maxH = viewportH * 0.9;
	const pos = new Array(items.length);

	items.forEach((im, idx) => {
		const aspect = im.w / im.h;
		const expanded = im.id === expandedId;
		const span = expanded ? Math.min(2, cols) : 1;

		let start = 0;
		if (span === 1) {
			let best = Infinity;
			for (let c = 0; c < cols; c++) {
				if (colH[c] < best - 0.5) {
					best = colH[c];
					start = c;
				}
			}
		} else {
			let best = Infinity;
			for (let c = 0; c <= cols - span; c++) {
				const top = Math.max(colH[c], colH[c + 1]);
				if (top < best - 0.5) {
					best = top;
					start = c;
				}
			}
		}

		const slotW = colW * span + GAP * (span - 1);
		let w = slotW;
		let h = w / aspect;
		if (expanded && h > maxH) {
			h = maxH;
			w = h * aspect;
		}

		const top = span === 1 ? colH[start] : Math.max(colH[start], colH[start + 1]);
		const slotX = start * (colW + GAP);
		const x = slotX + (slotW - w) / 2;
		pos[idx] = { x, y: top, w, h };

		const bottom = top + h + GAP;
		for (let c = start; c < start + span; c++) colH[c] = bottom;
	});

	const totalH = Math.max(...colH, 0) - GAP;
	return { pos, totalH };
}

export function initMasonry(container) {
	const tiles = Array.from(container.querySelectorAll('.mtile'));
	if (!tiles.length) return;

	const frames = tiles.map((el) => ({
		el,
		id: Number(el.dataset.id),
		w: Number(el.dataset.w),
		h: Number(el.dataset.h)
	}));

	let expandedId = null;
	let width = 0;
	let first = true;
	let lastWidth = 0;
	let prevExpanded = null;
	let escHandler = null;

	function relayout() {
		const w = width;
		const exp = expandedId;
		if (!w) return;

		const layout = computeLayout(frames, w, exp);
		const widthChanged = w !== lastWidth;
		const isFirst = first;
		// The first paint and resizes must land instantly; only a user-driven expand or
		// collapse is worth easing (or scrolling to).
		const settled = !isFirst && !widthChanged;
		const expandChanged = exp !== prevExpanded;
		// Reduced motion keeps the new packing — it just arrives without the FLIP, so tiles
		// jump straight to their slots and the stage height snaps instead of easing.
		const reduced = prefersReducedMotion();
		const animate = settled && !reduced && typeof tiles[0].animate === 'function';

		const prevH = container.offsetHeight;

		// FIRST — record current boxes from committed inline geometry
		const old = animate
			? tiles.map((t) => ({
					x: parseFloat(t.style.left) || 0,
					y: parseFloat(t.style.top) || 0,
					w: parseFloat(t.style.width) || 1,
					h: parseFloat(t.style.height) || 1
				}))
			: null;

		// LAST — commit new geometry
		tiles.forEach((t, i) => {
			const p = layout.pos[i];
			t.style.left = `${p.x}px`;
			t.style.top = `${p.y}px`;
			t.style.width = `${p.w}px`;
			t.style.height = `${p.h}px`;
		});

		if (animate && old) {
			// INVERT + PLAY — translate/scale each tile from its old box to the new one
			tiles.forEach((t, i) => {
				const o = old[i];
				const n = layout.pos[i];
				const dx = o.x - n.x;
				const dy = o.y - n.y;
				const sx = o.w / n.w;
				const sy = o.h / n.h;
				if (
					Math.abs(dx) < 0.5 &&
					Math.abs(dy) < 0.5 &&
					Math.abs(sx - 1) < 0.002 &&
					Math.abs(sy - 1) < 0.002
				)
					return;
				t.animate(
					[{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: 'none' }],
					{ duration: MOTION * 1000, easing: EASE }
				);
			});

			// height eases independently so the document grows/shrinks without snapping
			container.animate([{ height: `${prevH}px` }, { height: `${layout.totalH}px` }], {
				duration: MOTION * 1000,
				easing: EASE
			});
			container.style.height = `${layout.totalH}px`;
		} else {
			container.style.height = `${layout.totalH}px`;
			if (isFirst) requestAnimationFrame(() => container.classList.add('ready'));
		}

		/* Centre the opened frame in the viewport (never on collapse). The fixed nav
		   overlaps the top, so centre within the area *below* it. Hoisted out of the FLIP
		   branch: reduced motion still needs the frame brought on screen — dropping the
		   scroll would leave it opened somewhere off-viewport — so the scroll stays and
		   only its easing is given up. */
		if (settled && expandChanged && exp != null) {
			const idx = frames.findIndex((im) => im.id === exp);
			const p = layout.pos[idx];
			const nav = document.querySelector('nav')?.getBoundingClientRect().height ?? 70;
			const contTop = container.getBoundingClientRect().top + window.scrollY;
			const frameCenter = contTop + p.y + p.h / 2;
			const y = Math.max(0, frameCenter - window.innerHeight / 2 - nav);
			window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
		}

		first = false;
		lastWidth = w;
		prevExpanded = exp;
	}

	/* Reflect expand state into the DOM: the .is-expanded flag the dim-others CSS keys
	   off, the button's aria-expanded and its label, the cursor affordance, and the
	   "from the project" tag. The tag is present in the markup and toggled with the
	   `hidden` attribute rather than being created on open — `hidden` also takes it out
	   of the accessibility tree and out of tab order, which is what the Svelte version's
	   conditional render did. */
	function paintState() {
		container.classList.toggle('has-open', expandedId !== null);
		for (const f of frames) {
			const open = f.id === expandedId;
			const btn = f.el.querySelector('button');
			const tag = f.el.querySelector('.tag-from');
			f.el.classList.toggle('is-expanded', open);
			if (btn) {
				btn.setAttribute('aria-expanded', String(open));
				btn.setAttribute('aria-label', open ? btn.dataset.labelCollapse : btn.dataset.labelExpand);
				btn.classList.toggle('cursor-zoom-out', open);
				btn.classList.toggle('cursor-pointer', !open);
			}
			// Re-adding the node is what restarts the tag-rise entrance animation, which a
			// plain `hidden` toggle would not do on a second open.
			if (tag) {
				if (open) {
					tag.hidden = false;
					const clone = tag.cloneNode(true);
					tag.replaceWith(clone);
				} else {
					tag.hidden = true;
				}
			}
		}
	}

	function setExpanded(id) {
		expandedId = id;
		paintState();
		relayout();
		bindEscape();
	}

	/* Escape closes an open frame. Bound only while one is open rather than for the life
	   of the page: with nothing expanded the handler has no work to do, and leaving a
	   window-level key listener attached on the gallery route would quietly compete with
	   any future overlay for the same key. */
	function bindEscape() {
		if (expandedId === null) {
			if (escHandler) {
				window.removeEventListener('keydown', escHandler);
				escHandler = null;
			}
			return;
		}
		if (escHandler) return;
		escHandler = (e) => {
			if (e.key === 'Escape') collapse();
		};
		window.addEventListener('keydown', escHandler);
	}

	/* Collapse the open frame and put the keyboard back on the tile it came from. Focus is
	   grabbed *before* the state change: the "from the project" link only exists while a
	   frame is open, so collapsing with focus parked there would drop it to <body> and lose
	   the reader's place in a 60-tile grid. Focusing the button is a no-op when it already
	   holds focus (the usual case, since a click opened the frame). */
	function collapse() {
		const btn = container.querySelector('.mtile.is-expanded button');
		setExpanded(null);
		btn?.focus();
	}

	// Delegated so 61 tiles share one listener.
	container.addEventListener('click', (e) => {
		const btn = e.target.closest('.mtile button');
		if (!btn || !container.contains(btn)) return;
		const id = Number(btn.closest('.mtile').dataset.id);
		if (expandedId === id) collapse();
		else setExpanded(id);
	});

	/* Lay out immediately from the measured width, then let ResizeObserver handle changes.
	   The Svelte version relied on the observer for the first pass too, which is fine right
	   up until the observer's first delivery is deferred — a backgrounded tab, a page
	   restored from bfcache, print — because until then all 61 tiles sit at 0×0 on top of
	   each other with the stage collapsed. Measuring once here removes that dependency;
	   the observer's `w === width` guard means this doesn't cause a double layout. */
	width = Math.round(container.clientWidth);
	if (width) relayout();

	// observe stage width
	const ro = new ResizeObserver((entries) => {
		const w = Math.round(entries[0].contentRect.width);
		if (w === width) return;
		width = w;
		relayout();
	});
	ro.observe(container);
}
