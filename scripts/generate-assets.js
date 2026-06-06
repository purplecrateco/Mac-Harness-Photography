/**
 * Generates raster assets from SVG sources using @resvg/resvg-js:
 *   static/og.png            1200×630  default Open Graph / Twitter card
 *   static/favicon.png        512×512   PNG fallback for the SVG favicon
 *   static/apple-touch-icon.png 180×180 iOS home-screen icon
 *
 * Run with: node scripts/generate-assets.js
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ogSvg } from './og-template.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (name) => resolve(root, 'static', name);

function render(svg, opts) {
	const r = new Resvg(svg, { font: { loadSystemFonts: true }, ...opts });
	return r.render().asPng();
}

// OG card (fixed intrinsic size from the SVG)
writeFileSync(out('og.png'), render(ogSvg()));

// Favicon PNGs from the brand SVG, scaled by width
const favSvg = readFileSync(resolve(root, 'src/lib/assets/favicon.svg'), 'utf8');
writeFileSync(out('favicon.png'), render(favSvg, { fitTo: { mode: 'width', value: 512 } }));
writeFileSync(out('apple-touch-icon.png'), render(favSvg, { fitTo: { mode: 'width', value: 180 } }));

console.log('Generated static/og.png, static/favicon.png, static/apple-touch-icon.png');
