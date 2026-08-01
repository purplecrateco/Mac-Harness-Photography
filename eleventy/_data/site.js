/* Site content — the Eleventy port of src/lib/content/copy.ts and projects.ts.
 *
 * Exposed as one `site` data object so templates read `site.copy.hero.name_top`,
 * `site.projects`, `site.featured`, `site.pictureProjects`. Content files are read from
 * their existing locations under src/lib/content/, so both CMS configs keep working
 * unchanged — the port moves rendering, not content.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import Image from '@11ty/eleventy-img';
import matter from 'gray-matter';
import { marked } from 'marked';

const PROJECTS_DIR = 'src/lib/content/projects';
const SETTINGS = 'src/lib/content/settings/homepage.json';

/* A 480w cover per project at a path derivable from the SLUG, for the CMS preview.
 *
 * The featured-project block carries its project's slug and nothing else, so this is the
 * only way its partial can show a real photograph: `/preview/project-<slug>.jpg`. The
 * cover's own URL is already stable (`/project-media/<file>.jpg`) but its filename is not
 * derivable from the slug, which is the whole problem.
 *
 * Failure to process is swallowed: a cover that is missing or corrupt should cost the
 * preview one image, not fail the site build. */
const writeSlugCover = async (project) => {
	if (!project.cover) return;
	const source = path.join('static', String(project.cover).replace(/^\//, ''));
	try {
		await Image(source, {
			widths: [480],
			formats: ['jpeg'],
			outputDir: '_site/preview/',
			urlPath: '/preview/',
			filenameFormat: () => `project-${project.slug}.jpg`
		});
	} catch {
		/* preview-only asset; never worth failing a build over */
	}
};

/** Strips a trailing image extension only — NOT a directory. Mirrors
 *  normalizePictureRef in pictures.ts, which project `gallery:` refs depend on. */
const normalizePictureRef = (ref) => String(ref).replace(/\.(jpe?g|png|webp|avif|gif)$/i, '');

export default async function () {
	const copy = JSON.parse(await fs.readFile(SETTINGS, 'utf8'));

	// --- projects ------------------------------------------------------------------
	const files = (await fs.readdir(PROJECTS_DIR)).filter((f) => f.endsWith('.md'));
	const projects = [];
	for (const file of files) {
		const raw = await fs.readFile(path.join(PROJECTS_DIR, file), 'utf8');
		const { data, content } = matter(raw);
		projects.push({
			...data,
			slug: file.replace(/\.md$/, ''),
			html: marked.parse(content)
		});
	}

	await Promise.all(projects.map(writeSlugCover));

	// Most recent first, by year desc then slug for a stable tie-break.
	projects.sort((a, b) => {
		const ya = Number(a.year) || 0;
		const yb = Number(b.year) || 0;
		if (yb !== ya) return yb - ya;
		return a.slug.localeCompare(b.slug);
	});

	/* The homepage feature. Editors pick it in the CMS, which writes a slug. An empty
	 * setting — or one naming a project since renamed or deleted — falls back to the most
	 * recent, so the section can never end up blank on a stale reference. */
	/* The slug lives on the featured-project block, not at the top level, because the CMS
	   preview renders a block with only that block's own fields in scope — outside it, the
	   preview could not tell which project the section is showing. */
	const featuredBlock = (copy.blocks ?? []).find((b) => b.type === 'featured-project');
	const wanted = String(featuredBlock?.featured_project ?? '').trim();
	const featured = (wanted && projects.find((p) => p.slug === wanted)) || projects[0] || null;

	/* Reverse index: picture `name` -> the project featuring it, for the gallery's
	 * "from project" tag. Projects are year-desc, and the first writer wins, so the most
	 * recent project claims a picture listed by more than one. */
	const pictureProjects = {};
	for (const project of projects) {
		for (const ref of project.gallery ?? []) {
			const name = normalizePictureRef(ref);
			if (!pictureProjects[name]) {
				pictureProjects[name] = { slug: project.slug, title: project.title };
			}
		}
	}

	/* Header copy for /projects is derived from the loaded projects, not written by hand,
	   so it never drifts from what is actually in the projects directory. `range` is empty
	   when no project carries a year, which makes the kicker read just "Index". */
	const years = projects.map((p) => Number(p.year)).filter((y) => !Number.isNaN(y));
	const projectsRange = years.length ? ` · ${Math.min(...years)} → ${Math.max(...years)}` : '';

	return { copy, projects, featured, pictureProjects, projectsRange };
}
