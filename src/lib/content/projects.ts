import matter from 'gray-matter';
import { marked } from 'marked';
import { normalizePictureRef } from './pictures';

/**
 * Project markdown content lives in ./projects/*.md and is bundled at build time
 * via Vite's import.meta.glob (eager + ?raw). This keeps the route working on
 * serverless targets (Vercel) where reading from disk at runtime is unreliable.
 */
const files = import.meta.glob('./projects/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

export type ProjectMeta = {
	title: string;
	cat?: string;
	year?: string;
	cover?: string;
	intro?: string;
	/**
	 * Gallery pictures featured in this project, referenced by `name` — the
	 * filename without extension as exposed by pictures.ts (e.g. "IMG_7270").
	 * Drives the project page's mini-gallery and the gallery's "from project" tag.
	 */
	gallery?: string[];
};

export type Project = ProjectMeta & {
	slug: string;
	html: string;
};

// slug -> raw markdown, keyed off the filename (salt-silver.md -> "salt-silver")
const bySlug = new Map<string, string>(
	Object.entries(files).map(([path, raw]) => {
		const slug = path.split('/').pop()!.replace(/\.md$/, '');
		return [slug, raw];
	})
);

/** Parse + render a project by slug. Returns null when no markdown file exists. */
export function getProject(slug: string): Project | null {
	const raw = bySlug.get(slug);
	if (raw === undefined) return null;

	const { data, content } = matter(raw);
	const meta = data as ProjectMeta;
	const html = marked.parse(content, { async: false }) as string;

	return {
		slug,
		title: meta.title ?? slug,
		cat: meta.cat,
		year: meta.year,
		cover: meta.cover,
		intro: meta.intro,
		gallery: Array.isArray(meta.gallery) ? meta.gallery : undefined,
		html
	};
}

/** All known slugs — handy for prerendering / entry generation. */
export function projectSlugs(): string[] {
	return [...bySlug.keys()];
}

/** All projects, most recent first (by year desc, then slug for a stable tie-break). */
export function getAllProjects(): Project[] {
	return [...bySlug.keys()]
		.map((slug) => getProject(slug))
		.filter((p): p is Project => p !== null)
		.sort((a, b) => {
			const ya = Number(a.year) || 0;
			const yb = Number(b.year) || 0;
			if (yb !== ya) return yb - ya;
			return a.slug.localeCompare(b.slug);
		});
}

/** The most recent project, or null when there are none. */
export function latestProject(): Project | null {
	return getAllProjects()[0] ?? null;
}

/**
 * Reverse index: gallery picture `name` -> the project that features it.
 * Built from each project's `gallery` frontmatter. If two projects list the
 * same picture, the most recent one wins (getAllProjects is year-desc), then
 * the loser overwrites nothing. Used by the gallery to tag an expanded frame.
 */
export function pictureProjectMap(): Record<string, { slug: string; title: string }> {
	const map: Record<string, { slug: string; title: string }> = {};
	for (const project of getAllProjects()) {
		for (const ref of project.gallery ?? []) {
			// Keyed by the normalised `name` so it matches Picture.name regardless of
			// whether the frontmatter reference carries a file extension.
			const name = normalizePictureRef(ref);
			if (!map[name]) map[name] = { slug: project.slug, title: project.title };
		}
	}
	return map;
}
