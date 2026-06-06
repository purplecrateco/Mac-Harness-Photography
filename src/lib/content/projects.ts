import matter from 'gray-matter';
import { marked } from 'marked';

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
		html
	};
}

/** All known slugs — handy for prerendering / entry generation. */
export function projectSlugs(): string[] {
	return [...bySlug.keys()];
}
