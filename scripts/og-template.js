/**
 * Builds the OG-image SVG markup. Kept as a function so we can stamp a
 * per-page title/subtitle onto the same brand layout (1200×630).
 * Uses Georgia (a Windows/macOS system serif) for the wordmark so resvg can
 * rasterise it without bundling a webfont — the live site still uses Libre
 * Caslon Display, this is just the social-card approximation.
 */
export function ogSvg({ title = 'Mac Harness', subtitle = 'Visual storyteller · since 2024' } = {}) {
	const esc = (s) =>
		String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
	<defs>
		<radialGradient id="g1" cx="82%" cy="-8%" r="70%">
			<stop offset="0%" stop-color="#15131b"/><stop offset="52%" stop-color="#070708" stop-opacity="0"/>
		</radialGradient>
		<radialGradient id="g2" cx="-5%" cy="8%" r="60%">
			<stop offset="0%" stop-color="#16120c"/><stop offset="46%" stop-color="#070708" stop-opacity="0"/>
		</radialGradient>
	</defs>
	<rect width="1200" height="630" fill="#070708"/>
	<rect width="1200" height="630" fill="url(#g1)"/>
	<rect width="1200" height="630" fill="url(#g2)"/>
	<rect x="20" y="20" width="1160" height="590" rx="20" fill="none" stroke="#c9aa6e" stroke-opacity="0.18"/>

	<!-- diamond mark, top-left -->
	<path d="M96 86 L108 110 L132 122 L108 134 L96 158 L84 134 L60 122 L84 110 Z" fill="#c9aa6e"/>
	<text x="150" y="130" font-family="'Space Mono','Courier New',monospace" font-size="22" letter-spacing="6" fill="#f3f1ec">MAC HARNESS</text>

	<!-- kicker rule + label -->
	<rect x="84" y="372" width="44" height="2" fill="#c9aa6e" fill-opacity="0.7"/>
	<text x="144" y="379" font-family="'Space Mono','Courier New',monospace" font-size="20" letter-spacing="7" fill="#c9aa6e">${esc(subtitle.toUpperCase())}</text>

	<!-- headline -->
	<text x="80" y="490" font-family="Georgia,'Times New Roman',serif" font-size="104" fill="#f3f1ec">${esc(title)}</text>

	<text x="1120" y="560" text-anchor="end" font-family="'Space Mono','Courier New',monospace" font-size="18" letter-spacing="3" fill="#6f6c66">PORTRAIT · AUTOMOTIVE</text>
</svg>`;
}
