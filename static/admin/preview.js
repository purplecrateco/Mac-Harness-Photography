/**
 * Custom preview pane for Site settings → Homepage.
 *
 * Sveltia renders a generic field-by-field preview by default, which is useless for
 * judging copy: the hero name, the accent word that goes gold and italic, and the
 * three-column contact block only make sense laid out. This template mirrors the
 * homepage's structure and typography closely enough to write copy against, and
 * updates as you type. It is deliberately NOT a pixel copy of the site — no images,
 * no full-bleed hero, no motion — it's a copy proof, not a staging environment.
 *
 * The preview API is Decap's: a React class component receiving the entry as an
 * Immutable Map. React isn't ours to import here, so we take the globals the CMS
 * exposes (`h`, `createClass`) and bail out to the default preview if they're
 * missing — a broken preview must never block editing.
 *
 * See https://sveltiacms.app/en/docs/api/preview-templates
 */
(function () {
	if (typeof CMS === 'undefined') return;

	const React = window.React;
	const h = window.h || (React && React.createElement);
	// createClass is the documented non-JSX helper; fall back to a plain class when a
	// future release drops it but still hands us React.
	const createClass =
		window.createClass ||
		(React &&
			((spec) =>
				class extends React.Component {
					render() {
						return spec.render.call(this);
					}
				}));

	if (!h || !createClass) return;

	const GOLD = '#c9aa6e';
	const INK = '#f3f1ec';
	const DIM = '#a7a39b';
	const FAINT = '#6f6c66';
	const SERIF = "'Libre Caslon Display', Georgia, serif";
	const MONO = "'Space Mono', ui-monospace, monospace";
	const SANS = "'Space Grotesk', system-ui, sans-serif";

	// Same Google Fonts the site loads, plus the page shell. registerPreviewStyle
	// injects into the preview iframe, which otherwise inherits none of app.css.
	CMS.registerPreviewStyle(
		'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Libre+Caslon+Display&display=swap'
	);
	CMS.registerPreviewStyle(
		`
			html, body { margin: 0; background: #070708; }
			body { font-family: ${SANS}; color: ${INK}; }
			.hp { padding: 28px 30px 60px; }
			.hp section { padding: 30px 0; border-top: 1px solid rgba(255,255,255,0.07); }
			.hp section:first-child { border-top: 0; }
			.hp em { color: ${GOLD}; font-style: italic; }
			.hp a { color: ${DIM}; }
		`,
		{ raw: true }
	);

	/** Immutable-safe read of a (possibly nested) field, as plain JS. */
	const read = (entry, path) => {
		const value = entry.getIn(['data'].concat(path));
		return value && typeof value.toJS === 'function' ? value.toJS() : value;
	};

	const kicker = (text) =>
		h(
			'div',
			{
				style: {
					fontFamily: MONO,
					fontSize: '10.5px',
					letterSpacing: '0.24em',
					textTransform: 'uppercase',
					color: GOLD,
					marginBottom: '10px'
				}
			},
			text || ''
		);

	/** Heading with the trailing accent set gold + italic, exactly as the site does. */
	const heading = (text, accent, size) =>
		h(
			'h2',
			{ style: { fontFamily: SERIF, fontWeight: 400, fontSize: size, lineHeight: 0.98, margin: '0 0 14px' } },
			(text || '') + ' ',
			accent ? h('em', {}, accent) : null,
			accent ? '.' : null
		);

	const para = (text, style) =>
		h('p', { style: Object.assign({ margin: '0 0 12px', lineHeight: 1.6, color: DIM }, style) }, text || '');

	/** Multi-line text field → one <div> per line, mirroring the site's <br/>s. */
	const multiline = (text, style) =>
		String(text || '')
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line, i) => h('div', { key: i, style: style }, line));

	const label = (text) =>
		h(
			'div',
			{
				style: {
					fontFamily: MONO,
					fontSize: '10px',
					letterSpacing: '0.16em',
					textTransform: 'uppercase',
					color: FAINT,
					marginBottom: '8px'
				}
			},
			text || ''
		);

	const HomepagePreview = createClass({
		render: function () {
			const { entry } = this.props;
			const get = (path) => read(entry, path);

			const hero = get(['hero']) || {};
			const gallery = get(['gallery']) || {};
			const project = get(['project']) || {};
			const about = get(['about']) || {};
			const contact = get(['contact']) || {};

			return h(
				'div',
				{ className: 'hp' },
				// ---------- hero ----------
				h(
					'section',
					{},
					h(
						'div',
						{ style: { fontFamily: SERIF, color: GOLD, fontSize: '54px', lineHeight: 0.82 } },
						hero.name_top || ''
					),
					h(
						'div',
						{
							style: {
								fontFamily: SERIF,
								color: GOLD,
								fontSize: '44px',
								lineHeight: 0.82,
								textAlign: 'right'
							}
						},
						hero.name_bottom || ''
					),
					h(
						'p',
						{
							style: {
								fontFamily: MONO,
								fontSize: '11px',
								textTransform: 'uppercase',
								letterSpacing: '0.04em',
								lineHeight: 1.75,
								color: DIM,
								maxWidth: '30ch',
								margin: '22px 0 18px'
							}
						},
						hero.blurb || ''
					),
					h(
						'span',
						{
							style: {
								display: 'inline-block',
								background: GOLD,
								color: '#16130c',
								fontFamily: MONO,
								fontSize: '11px',
								letterSpacing: '0.08em',
								textTransform: 'uppercase',
								borderRadius: '999px',
								padding: '9px 16px'
							}
						},
						(hero.cta || '') + ' →'
					),
					h(
						'div',
						{ style: { fontFamily: MONO, fontSize: '9.5px', letterSpacing: '0.26em', textTransform: 'uppercase', color: FAINT, marginTop: '18px' } },
						hero.scroll_hint || ''
					)
				),

				// ---------- selected work ----------
				h(
					'section',
					{},
					kicker(gallery.kicker),
					heading(gallery.heading, gallery.heading_accent, '38px'),
					h(
						'div',
						{ style: { fontFamily: MONO, fontSize: '11.5px', lineHeight: 1.9, color: DIM } },
						multiline(gallery.note),
						h('div', { style: { color: FAINT } }, gallery.note_years || '')
					)
				),

				// ---------- featured project ----------
				h(
					'section',
					{},
					kicker(project.kicker),
					h(
						'p',
						{ style: { fontFamily: MONO, fontSize: '11px', color: FAINT, margin: 0, lineHeight: 1.7 } },
						'Title, intro, category, year and the first four pictures come from the project selected above — they are not edited here.'
					)
				),

				// ---------- about ----------
				h(
					'section',
					{},
					kicker(about.kicker),
					h(
						'h2',
						{ style: { fontFamily: SERIF, fontWeight: 400, fontSize: '34px', margin: '0 0 16px' } },
						about.heading || ''
					),
					para(about.lead, { fontSize: '17px', color: INK, lineHeight: 1.5 }),
					para(about.body, { fontSize: '14px' }),
					h(
						'div',
						{ style: { display: 'flex', gap: '28px', margin: '22px 0' } },
						(about.stats || []).map((s, i) =>
							h(
								'div',
								{ key: i },
								h('div', { style: { fontFamily: SERIF, fontSize: '30px', color: GOLD, lineHeight: 1 } }, s.num || ''),
								h(
									'div',
									{ style: { fontFamily: MONO, fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: FAINT, marginTop: '6px' } },
									s.label || ''
								)
							)
						)
					),
					h(
						'div',
						{ style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
						(about.services || []).map((s, i) =>
							h(
								'span',
								{
									key: i,
									style: {
										border: '1px solid rgba(255,255,255,0.14)',
										background: 'rgba(255,255,255,0.055)',
										borderRadius: '999px',
										padding: '7px 13px',
										fontFamily: MONO,
										fontSize: '10.5px',
										letterSpacing: '0.1em',
										textTransform: 'uppercase',
										color: DIM
									}
								},
								s
							)
						)
					),
					h(
						'div',
						{ style: { fontFamily: SERIF, fontStyle: 'italic', fontSize: '24px', marginTop: '22px' } },
						about.signature || ''
					)
				),

				// ---------- contact ----------
				h(
					'section',
					{ style: { textAlign: 'center' } },
					kicker(contact.kicker),
					heading(contact.heading, contact.heading_accent, '46px'),
					para(contact.blurb, { maxWidth: '48ch', margin: '0 auto 26px' }),
					h(
						'div',
						{ style: { fontFamily: SERIF, fontSize: '26px', borderBottom: '1px solid rgba(255,255,255,0.14)', display: 'inline-block', paddingBottom: '6px' } },
						(contact.email || '') + ' →'
					),
					h(
						'div',
						{ style: { display: 'flex', justifyContent: 'center', gap: '44px', textAlign: 'left', marginTop: '34px', fontSize: '14px', lineHeight: 1.7 } },
						h('div', {}, label(contact.studio_title), multiline(contact.studio_lines)),
						h(
							'div',
							{},
							label(contact.follow_title),
							(contact.follow_links || []).map((l, i) => h('div', { key: i, style: { color: DIM } }, l.label || ''))
						),
						h(
							'div',
							{},
							label(contact.enquiries_title),
							h('div', { style: { color: DIM } }, contact.email || ''),
							h('div', {}, contact.phone || '')
						)
					)
				),

				// ---------- footer ----------
				h(
					'section',
					{},
					h(
						'div',
						{ style: { fontFamily: MONO, fontSize: '10.5px', letterSpacing: '0.08em', color: FAINT } },
						get(['footer_note']) || ''
					)
				)
			);
		}
	});

	// Registered under the file name within the `settings` collection.
	CMS.registerPreviewTemplate('homepage', HomepagePreview);
})();
