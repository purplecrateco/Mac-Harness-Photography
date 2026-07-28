/**
 * Editable homepage copy.
 *
 * Every string the homepage renders (outside of project/picture content, which has
 * its own collections) lives in ./settings/homepage.json and is edited in the CMS
 * under "Site settings → Homepage". The JSON is imported — not fetched — so it is
 * bundled at build time and works the same in SSR, prerender and the browser; no
 * loader plumbing is needed to get it into a component.
 *
 * Fields are marked required in static/admin/config.yml, so the CMS won't write an
 * entry with copy missing. Lists can legitimately be emptied, so callers should
 * still guard those with `?? []`.
 *
 * Note: `footerNote` renders in the site-wide footer rather than only on the
 * homepage. It lives here because this is the one settings file — moving it later
 * means moving one field, not restructuring the collection.
 */
import homepage from './settings/homepage.json';

export type Stat = { num: string; label: string };
export type Link = { label: string; url: string };

export type HomepageCopy = {
	/** Slug of the project featured on the homepage; empty = newest. See projects.ts. */
	featured_project: string;
	hero: {
		name_top: string;
		name_bottom: string;
		blurb: string;
		cta: string;
		scroll_hint: string;
	};
	gallery: {
		kicker: string;
		/** Rendered as `heading <em>heading_accent</em>.` */
		heading: string;
		heading_accent: string;
		/** Multi-line: one line per newline. */
		note: string;
		note_years: string;
	};
	project: { kicker: string };
	about: {
		kicker: string;
		heading: string;
		lead: string;
		body: string;
		stats: Stat[];
		services: string[];
		signature: string;
	};
	contact: {
		kicker: string;
		heading: string;
		heading_accent: string;
		blurb: string;
		email: string;
		studio_title: string;
		/** Multi-line: one line per newline. */
		studio_lines: string;
		follow_title: string;
		follow_links: Link[];
		enquiries_title: string;
		phone: string;
	};
	footer_note: string;
};

export const copy = homepage as HomepageCopy;

/**
 * Split a multi-line CMS text field into renderable lines.
 *
 * Editors type these as one field with line breaks; the site renders one <br/>-
 * separated line each. Blank lines are dropped so a stray trailing newline in the
 * CMS doesn't open a gap in the layout.
 */
export const lines = (value: string | undefined): string[] =>
	(value ?? '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
