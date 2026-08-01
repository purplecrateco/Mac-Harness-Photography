/* Exercises the masonry packing headlessly, against the real 61 frames.
 *
 * Why this exists: the layout is the one piece of the Eleventy port that was reactive
 * Svelte state and is now a hand-written update loop, and it cannot be checked in a
 * browser pane — ResizeObserver and requestAnimationFrame don't run in a backgrounded
 * tab, so the interactive path is unobservable there. The packing itself is pure, so it
 * can be asserted directly.
 *
 * Run: node scripts/check-masonry.mjs
 */
import assert from 'node:assert/strict';
import { computeLayout } from '../eleventy/assets/masonry.js';
import pictures from '../eleventy/_data/pictures.js';

const GAP = 12;
const VIEWPORT_H = 900;

const frames = (await pictures()).map(({ id, w, h }) => ({ id, w, h }));
assert.ok(frames.length > 0, 'no frames to pack');

// Widths spanning the column-count range: Math.max(2, Math.min(6, round(width / 340)))
const WIDTHS = [360, 680, 1024, 1224, 1680, 2400];

function overlaps(a, b) {
	// Tiles are allowed to touch; only a real intersection is a bug. The epsilon absorbs
	// the float division in colW.
	const e = 0.01;
	return (
		a.x + a.w > b.x + e && b.x + b.w > a.x + e && a.y + a.h > b.y + e && b.y + b.h > a.y + e
	);
}

let checks = 0;
for (const width of WIDTHS) {
	const cols = Math.max(2, Math.min(6, Math.round(width / 340)));

	for (const expandedId of [null, frames[0].id, frames[Math.floor(frames.length / 2)].id]) {
		const { pos, totalH } = computeLayout(frames, width, expandedId, VIEWPORT_H);

		assert.equal(pos.length, frames.length, `every frame gets a slot @${width}`);

		for (const [i, p] of pos.entries()) {
			assert.ok(
				Number.isFinite(p.x) && Number.isFinite(p.y) && p.w > 0 && p.h > 0,
				`frame ${i} has finite positive geometry @${width}`
			);
			// Nothing may hang off either edge of the stage.
			assert.ok(p.x >= -0.01, `frame ${i} not off the left edge @${width}`);
			assert.ok(p.x + p.w <= width + 0.01, `frame ${i} not off the right edge @${width}`);

			// Aspect ratio is preserved: that is what makes the layout correct on first
			// paint, so a rounding regression here is a visible reflow.
			const f = frames[i];
			assert.ok(
				Math.abs(p.w / p.h - f.w / f.h) < 0.02,
				`frame ${i} keeps its aspect ratio @${width}`
			);
		}

		// No two tiles may intersect.
		for (let i = 0; i < pos.length; i++) {
			for (let j = i + 1; j < pos.length; j++) {
				assert.ok(!overlaps(pos[i], pos[j]), `frames ${i}/${j} overlap @${width} exp=${expandedId}`);
			}
		}

		// The expanded frame spans two columns (or all of them, when there are only two)
		// and is capped at 90% of the viewport height.
		if (expandedId !== null) {
			const idx = frames.findIndex((f) => f.id === expandedId);
			const p = pos[idx];
			assert.ok(p.h <= VIEWPORT_H * 0.9 + 0.01, `expanded frame capped to 90vh @${width}`);
			const colW = (width - GAP * (cols - 1)) / cols;
			const twoCols = colW * Math.min(2, cols) + GAP * (Math.min(2, cols) - 1);
			assert.ok(
				p.w <= twoCols + 0.01,
				`expanded frame within its ${Math.min(2, cols)}-column slot @${width}`
			);
		}

		// Stage height must contain every tile.
		const lowest = Math.max(...pos.map((p) => p.y + p.h));
		assert.ok(totalH + 0.01 >= lowest, `stage height contains all tiles @${width}`);

		checks++;
	}

	// Determinism: same inputs, same packing.
	const a = computeLayout(frames, width, null, VIEWPORT_H);
	const b = computeLayout(frames, width, null, VIEWPORT_H);
	assert.deepEqual(a, b, `packing is deterministic @${width}`);
}

console.log(
	`masonry OK — ${frames.length} frames, ${checks} layout passes across ${WIDTHS.length} widths ` +
		`(2–6 columns), collapsed and expanded: no overlaps, no overflow, aspect ratios kept.`
);
