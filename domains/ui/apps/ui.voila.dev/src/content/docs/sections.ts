import type { docsConfig } from "../../../docs.config.ts";

type IconName = keyof typeof docsConfig.icons;

/**
 * The sidebar, as folders of pages rather than a list of slugs: a page joins
 * the sidebar by being written in its section's folder, and its frontmatter
 * places it there. `src/docs/navigation.ts` turns this into the docs'
 * `DocsNavigation`.
 *
 * A section is ordered one of two ways:
 *
 * - by number: every page carries `sidebar.order`, ties fall through to
 *   alphabetical by file name;
 * - by category, when the section declares `categories`: every page names one,
 *   except a single intro page with no `category` that pins above the groups.
 *   Pages are alphabetical by title inside their group, so adding a component
 *   never means renumbering its neighbours.
 */
export interface DocsSectionConfig {
	/** The sidebar group's heading, and the intro's group in a section with categories. */
	label: string;
	/** The folder under `src/content/docs` that feeds the section. */
	dir: string;
	categories?: ReadonlyArray<DocsCategoryConfig>;
	/**
	 * The section's entry in the landing page's package grid, which links to
	 * its first page.
	 */
	showcase?: DocsShowcaseConfig;
}

export interface DocsShowcaseConfig {
	/**
	 * Position in the grid. Deliberately not the sidebar order: the sidebar is
	 * foundational-first, the landing page leads with what is hardest to build
	 * yourself.
	 */
	order: number;
	/** One line. Also the package's npm description — keep the two in step. */
	blurb: string;
}

export interface DocsCategoryConfig {
	/** The value pages carry in their `category` frontmatter. */
	id: string;
	/** The sidebar group's heading. */
	label: string;
}

/** A header tab: one package area, its sections one after the other. */
export interface DocsTabConfig {
	label: string;
	icon: IconName;
	sections: ReadonlyArray<DocsSectionConfig>;
}

/**
 * The `ui` taxonomy. Not invented here: `ui/quick-start.mdx` already narrated
 * it as a prose "Page map" precisely because the sidebar could not show it.
 */
const uiCategories: ReadonlyArray<DocsCategoryConfig> = [
	{ id: "actions", label: "Actions" },
	{ id: "forms", label: "Forms" },
	{ id: "dates-and-time", label: "Dates & time" },
	{ id: "overlays", label: "Overlays" },
	{ id: "navigation", label: "Navigation" },
	{ id: "data-display", label: "Data display" },
	{ id: "feedback", label: "Feedback" },
	{ id: "layout", label: "Layout" },
];

export const docsTabsConfig: ReadonlyArray<DocsTabConfig> = [
	{
		label: "UI",
		icon: "cube",
		sections: [
			{ label: "Start", dir: "start" },
			{
				label: "@voila.dev/ui",
				dir: "ui",
				categories: uiCategories,
				showcase: {
					order: 10,
					blurb:
						"…and the 88 components underneath it all. One convention, the floor everything else stands on.",
				},
			},
			{
				label: "ui/icon",
				dir: "ui-icon",
				showcase: {
					order: 8,
					blurb:
						"Icons by name, safe by default — store a string, render an icon.",
				},
			},
			{
				label: "ui/design-tokens",
				dir: "ui-tokens",
				showcase: {
					order: 9,
					blurb:
						"Your whole brand in one CSS file. Change it, everything follows.",
				},
			},
		],
	},
	{
		label: "Chart",
		icon: "chart",
		sections: [
			{
				label: "chart",
				dir: "chart",
				showcase: {
					order: 4,
					blurb:
						"Charts as a definition of marks, SVG or Canvas, every value reachable from the keyboard.",
				},
			},
		],
	},
	{
		label: "Motion",
		icon: "motion",
		sections: [
			{
				label: "motion",
				dir: "motion",
				showcase: {
					order: 11,
					blurb:
						"Springs played by the browser, values on one frame loop, exits React waits for.",
				},
			},
		],
	},
	{
		label: "Datatable",
		icon: "table",
		sections: [
			{
				label: "ui/datatable",
				dir: "ui-datatable",
				showcase: {
					order: 3,
					blurb:
						"Sorting, pinning, CSV export — the table you keep rebuilding, finished.",
				},
			},
		],
	},
	{
		label: "Spreadsheet",
		icon: "grid",
		sections: [
			{
				label: "ui/spreadsheet",
				dir: "ui-spreadsheet",
				showcase: {
					order: 2,
					blurb:
						"An editable, virtualized grid your users will mistake for a native app.",
				},
			},
		],
	},
	{
		label: "Map",
		icon: "map",
		sections: [
			{
				label: "ui/map",
				dir: "ui-map",
				showcase: {
					order: 5,
					blurb:
						"Maps and a globe on free vector tiles. No API key, no bundle tax.",
				},
			},
		],
	},
	{
		label: "Filter",
		icon: "filter",
		sections: [
			{
				label: "ui/filter",
				dir: "ui-filter",
				showcase: {
					order: 6,
					blurb:
						"Composable filters that survive real product requirements — including geo.",
				},
			},
		],
	},
	{
		label: "Landing",
		icon: "landing",
		sections: [
			{
				label: "ui/landing",
				dir: "ui-landing",
				showcase: {
					order: 7,
					blurb: "Your marketing site, from the same system as your product.",
				},
			},
		],
	},
	{
		label: "Content editor",
		icon: "editor",
		sections: [
			{
				label: "ui/content-editor",
				dir: "ui-content-editor",
				showcase: {
					order: 1,
					blurb:
						"A rich content editor that lives in your app, from one feature registry.",
				},
			},
		],
	},
];
