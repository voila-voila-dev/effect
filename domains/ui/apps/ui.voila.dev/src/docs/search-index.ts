import { groupTrail, locate } from "@voila.dev/docs/navigation";
import type { SearchEntry, SynonymGroups } from "@voila.dev/docs/search";
import {
	navigationSuggestions,
	pageSearchEntries,
} from "@voila.dev/docs/search-index";

import { docPages } from "./pages.ts";
import { docsTabs } from "./site.ts";

// Each page's prose, compiled with `?text`: this module loads the first time a
// reader opens the palette, so the prose never weighs on a page load.
const texts = import.meta.glob<string>("../content/docs/**/*.mdx", {
	query: "?text",
	import: "text",
	eager: true,
});

function textOf(slug: string): string | undefined {
	return texts[`../content/docs/${slug}.mdx`];
}

/** What the search palette matches: every page, by its title, description and prose, and each of its sections. */
export const searchEntries: ReadonlyArray<SearchEntry> = [
	...docPages.values(),
].flatMap((page) => {
	const location = locate(docsTabs, page.href);
	const text = textOf(page.slug);
	return pageSearchEntries(
		{ ...page, ...(text ? { text } : {}) },
		location
			? [location.tab.label, ...groupTrail(location.tab, location.group)]
					.filter((label, index, labels) => labels.indexOf(label) === index)
					.join(" · ")
			: "",
	);
});

/** What the palette offers before anything is typed: the pages, as the sidebar lists them. */
export const searchSuggestions = navigationSuggestions(docsTabs);

/** Words readers use for the same thing, any of which finds the pages using another. */
export const searchSynonyms: SynonymGroups = [
	["table", "datatable", "grid"],
	["spreadsheet", "sheet", "excel"],
	["dialog", "modal"],
	["select", "dropdown", "combobox"],
	["toast", "notification", "snackbar"],
	["theme", "palette", "tokens", "branding"],
	["editor", "wysiwyg", "rich text"],
	["map", "globe", "geo"],
	["chart", "graph", "plot"],
	["animation", "motion", "spring"],
];
