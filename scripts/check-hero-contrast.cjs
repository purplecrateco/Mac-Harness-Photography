/* Verify the SHIPPED hero: brightness(1.35) saturate(1.05) photo under the two-layer
   scrim in Hero.svelte, with the colours actually used. Multiple viewports, because
   object-cover changes which pixels land behind the text. */
const sharp = require('sharp');
// Single-threaded, no cache: this is a batch of one-shot decodes, and libvips' worker
// pool otherwise keeps the process alive after the last result is printed.
sharp.concurrency(1);
sharp.cache(false);
const SAT = 1.05, B = 1.35, SC = [7, 7, 8];
const GOLD_HERO = '#ddc38d', INK = '#f3f1ec';
// object-position: 66% center — must match the class on the <img> in Hero.svelte
const OBJ_X = 0.66;

const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const relLum = (r, g, b) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const lumHex = (h) => { const n = parseInt(h.slice(1), 16); return relLum((n >> 16) & 255, (n >> 8) & 255, n & 255); };

// layer1 = bottom fade (transparent 62% -> #070708 100%), painted over layer2 = flat 0.60
const effAlpha = (y, VH) => {
	const f = y / VH;
	const a1 = f <= 0.62 ? 0 : (f - 0.62) / 0.38;
	return 1 - (1 - a1) * (1 - 0.6);
};

// text boxes as viewport fractions, from the measured 1440x960 layout
const FR = {
	mac:     { l: 116 / 1440, t: 273 / 960, w: 479 / 1440, h: 174 / 960, need: 3.0, col: GOLD_HERO },
	harness: { l: 535 / 1440, t: 535 / 960, w: 789 / 1440, h: 140 / 960, need: 3.0, col: GOLD_HERO },
	blurb:   { l: 116 / 1440, t: 642 / 960, w: 290 / 1440, h: 68 / 960,  need: 4.5, col: INK },
	scroll:  { l: 693 / 1440, t: 878 / 960, w: 55 / 1440,  h: 58 / 960,  need: 4.5, col: INK }
};

(async () => {
	const m = await sharp('static/IMG_7387.JPG').metadata();
	let fails = 0;
	for (const [VW, VH] of [[1440, 960], [1920, 1080], [1280, 800], [2560, 1080], [768, 1024], [390, 844]]) {
		const s = Math.max(VW / m.width, VH / m.height);
		const sw = Math.round(m.width * s), sh = Math.round(m.height * s);
		const { data } = await sharp('static/IMG_7387.JPG').resize(sw, sh)
			.extract({
				left: Math.round((sw - VW) * OBJ_X),   // object-position x
				top: Math.round((sh - VH) / 2),        // ...center
				width: VW, height: VH
			})
			.modulate({ brightness: B, saturation: SAT }).raw().toBuffer({ resolveWithObject: true });

		const out = [];
		for (const [name, f] of Object.entries(FR)) {
			if (name === 'blurb' && VW < 761) { out.push(`${name}=n/a`); continue; } // display:none there
			const L = Math.round(f.l * VW), T = Math.round(f.t * VH);
			const W = Math.round(f.w * VW), H = Math.round(f.h * VH);
			let hi = 0;
			for (let y = T; y < Math.min(T + H, VH); y++) {
				const a = effAlpha(y, VH);
				for (let x = L; x < Math.min(L + W, VW); x++) {
					const i = (y * VW + x) * 3;
					const lum = relLum(
						data[i] * (1 - a) + SC[0] * a,
						data[i + 1] * (1 - a) + SC[1] * a,
						data[i + 2] * (1 - a) + SC[2] * a
					);
					if (lum > hi) hi = lum;
				}
			}
			const r = ratio(lumHex(f.col), hi);
			if (r < f.need) fails++;
			out.push(`${name}=${r.toFixed(2)}${r >= f.need ? '' : ' FAIL'}`);
		}
		console.log(`${String(VW).padStart(4)}x${String(VH).padEnd(5)} ${out.join('  ')}`);
	}
	console.log(`\nwordmarks ${GOLD_HERO} need 3:1 (display type) | 10-13px copy ${INK} needs 4.5:1`);
	console.log(fails === 0 ? 'ALL VIEWPORTS PASS AA' : `${fails} FAILURE(S)`);
	process.exit(fails === 0 ? 0 : 1);
})();
