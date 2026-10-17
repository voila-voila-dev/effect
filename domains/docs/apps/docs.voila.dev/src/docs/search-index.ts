import { groupTrail, locate } from "@voila.dev/docs/navigation";
import type { SearchEntry, SynonymGroups } from "@voila.dev/docs/search";
import {
	navigationSuggestions,
	pageSearchEntries,
} from "@voila.dev/docs/search-index";

import { docPages } from "./pages.ts";
import { docsTabs } from "./site.ts";

/** What the search palette matches: every page and each of its sections. Loaded the first time a reader opens it. */
export const searchEntries: ReadonlyArray<SearchEntry> = [
	...docPages.values(),
].flatMap((page) => {
	const location = locate(docsTabs, page.href);
	return pageSearchEntries(
		page,
		location ? groupTrail(location.tab, location.group).join(" · ") : "",
	);
});

/** What the palette offers before anything is typed: the pages, as the sidebar lists them. */
export const searchSuggestions = navigationSuggestions(docsTabs);

/** Words readers use for the same thing, any of which finds the pages using another. */
export const searchSynonyms: SynonymGroups = [
	["mail", "email", "e-mail"],
	["vat", "tva", "vies"],
	["siret", "siren", "company"],
	["websocket", "realtime", "live"],
	["lock", "mutex", "lease"],
	["payment", "stripe", "billing"],
	["lint", "biome"],
	["dotenv", "env", "environment"],
];
