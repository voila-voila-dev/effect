import { groupTrail, locate } from "@voila.dev/docs/navigation";
import type { SearchEntry, SynonymGroups } from "@voila.dev/docs/search";
import {
	navigationSuggestions,
	operationSearchEntry,
	pageSearchEntries,
} from "@voila.dev/docs/search-index";

import { apiReference } from "./api-reference.ts";
import { docPages } from "./pages.ts";
import { docsTabs } from "./site.ts";

/**
 * What the search palette matches: every page and each of its sections, and
 * every API operation. Its own module, loaded the first time a reader opens
 * the palette.
 */
export const searchEntries: ReadonlyArray<SearchEntry> = [
	...[...docPages.values()].flatMap((page) => {
		const location = locate(docsTabs, page.href);
		return pageSearchEntries(
			{ ...page, tags: page.stage ? [page.stage] : [] },
			location ? groupTrail(location.tab, location.group).join(" · ") : "",
		);
	}),
	...apiReference.operations.map(operationSearchEntry),
];

/** What the palette offers before anything is typed: the pages, as the sidebar lists them. */
export const searchSuggestions = navigationSuggestions(docsTabs);

/** Words readers use for the same thing, any of which finds the pages using another. */
export const searchSynonyms: SynonymGroups = [
	["sign in", "log in", "login"],
	["api key", "token"],
];
