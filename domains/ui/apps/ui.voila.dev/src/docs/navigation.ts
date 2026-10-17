import type { DocsNavigation } from "@voila.dev/docs/navigation";

import type {
	DocsSectionConfig,
	DocsTabConfig,
} from "../content/docs/sections.ts";

/** What the sidebar needs to know of a page: where it is, its title and where its frontmatter files it. */
export interface SectionPage {
	slug: string;
	title: string;
	category?: string | undefined;
	sidebar?: { order: number } | undefined;
}

interface Group {
	label: string;
	pages: Array<string>;
}

function folderOf(slug: string): string {
	return slug.split("/").slice(0, -1).join("/");
}

function stemOf(slug: string): string {
	return slug.split("/").at(-1) ?? slug;
}

/** A section without categories: `sidebar.order`, then alphabetical by file name on ties. */
function groupsByNumber(
	section: DocsSectionConfig,
	pages: ReadonlyArray<SectionPage>,
): Array<Group> {
	const unordered = pages.find((page) => !page.sidebar);
	if (unordered) {
		throw new Error(
			`${unordered.slug}.mdx — the "${section.label}" section is ordered by number, so the page needs a sidebar.order.`,
		);
	}
	const sorted = [...pages].sort(
		(left, right) =>
			(left.sidebar?.order ?? 0) - (right.sidebar?.order ?? 0) ||
			stemOf(left.slug).localeCompare(stemOf(right.slug)),
	);
	return [{ label: section.label, pages: sorted.map((page) => page.slug) }];
}

/**
 * A section with categories: its intro (the one page with no `category`)
 * under the section's label, then a group per category in the config's order,
 * alphabetical by title inside each.
 */
function groupsByCategory(
	section: DocsSectionConfig,
	categories: NonNullable<DocsSectionConfig["categories"]>,
	pages: ReadonlyArray<SectionPage>,
): Array<Group> {
	const known = new Set(categories.map((category) => category.id));
	const intro = pages.filter((page) => !page.category);
	if (intro.length > 1) {
		throw new Error(
			`${section.dir} has ${intro.length} pages with no category (${intro.map((page) => stemOf(page.slug)).join(", ")}). Only the section intro may omit it.`,
		);
	}
	const stray = pages.find(
		(page) => page.category && !known.has(page.category),
	);
	if (stray) {
		throw new Error(
			`${stray.slug}.mdx — category "${stray.category}" is not one of the "${section.label}" categories: ${[...known].join(", ")}.`,
		);
	}
	const groups = categories.map((category) => {
		const inCategory = pages
			.filter((page) => page.category === category.id)
			.sort((left, right) => left.title.localeCompare(right.title));
		if (inCategory.length === 0) {
			throw new Error(
				`${section.dir} declares the "${category.id}" category but no page uses it. Remove it from sections.ts or give a page that category.`,
			);
		}
		return {
			label: category.label,
			pages: inCategory.map((page) => page.slug),
		};
	});
	return [
		...intro.map((page) => ({ label: section.label, pages: [page.slug] })),
		...groups,
	];
}

function groupsOf(
	section: DocsSectionConfig,
	pages: ReadonlyArray<SectionPage>,
): Array<Group> {
	return section.categories
		? groupsByCategory(section, section.categories, pages)
		: groupsByNumber(section, pages);
}

/**
 * The docs' navigation from the sections and the pages' frontmatter: a tab per
 * package area, a group per section (or per category). A folder of pages no
 * section claims fails the build: its pages would render nowhere.
 */
export function navigationOf<IconName extends string>(
	tabs: ReadonlyArray<DocsTabConfig & { icon: IconName }>,
	pages: ReadonlyArray<SectionPage>,
): DocsNavigation<IconName> {
	const byFolder = Map.groupBy(pages, (page) => folderOf(page.slug));
	const claimed = new Set(
		tabs.flatMap((tab) => tab.sections.map((section) => section.dir)),
	);
	const orphans = [...byFolder.keys()]
		.filter((folder) => !claimed.has(folder))
		.sort();
	if (orphans.length > 0) {
		throw new Error(
			`src/content/docs has ${orphans.length} folder(s) no section claims: ${orphans.join(", ")}. Add them to src/content/docs/sections.ts, or their pages appear nowhere.`,
		);
	}
	return tabs.map((tab) => ({
		label: tab.label,
		icon: tab.icon,
		groups: tab.sections.flatMap((section) => {
			const inSection = byFolder.get(section.dir) ?? [];
			if (inSection.length === 0) {
				throw new Error(
					`sections.ts lists the "${section.dir}" folder, which holds no page.`,
				);
			}
			return groupsOf(section, inSection);
		}),
	}));
}

export interface ShowcaseEntry {
	/** The section's folder, which is the package's name without its scope: `ui-datatable`. */
	name: string;
	/** The section's first page. */
	href: string;
	blurb: string;
}

/** The landing page's package grid, in its own order, each card linking to its section's first page. */
export function showcaseOf(
	tabs: ReadonlyArray<DocsTabConfig>,
	navigation: DocsNavigation,
	pageHref: (slug: string) => string,
): Array<ShowcaseEntry> {
	const groups = navigation.flatMap((tab) =>
		"groups" in tab ? tab.groups : [],
	);
	return tabs
		.flatMap((tab) => tab.sections)
		.flatMap((section) => {
			if (!section.showcase) {
				return [];
			}
			const first = groups
				.flatMap((group) => group.pages)
				.find(
					(entry): entry is string =>
						typeof entry === "string" && folderOf(entry) === section.dir,
				);
			if (!first) {
				throw new Error(`${section.dir} is in the showcase but has no page.`);
			}
			return [
				{
					order: section.showcase.order,
					entry: {
						name: section.dir,
						href: pageHref(first),
						blurb: section.showcase.blurb,
					},
				},
			];
		})
		.sort((left, right) => left.order - right.order)
		.map(({ entry }) => entry);
}
