import type { FilterDefinition } from "#/filter/types.ts";

/** Case- and accent-blind, so "reference" finds « Référencé ». */
function foldForMatch(text: string): string {
	return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * The definitions whose label contains the query, case- and accent-blind — the
 * field search of a long editor. An empty query keeps them all.
 */
export function matchFilterDefinitions(
	definitions: ReadonlyArray<FilterDefinition>,
	query: string,
): ReadonlyArray<FilterDefinition> {
	const folded = foldForMatch(query.trim());
	return folded === ""
		? definitions
		: definitions.filter((definition) =>
				foldForMatch(definition.label).includes(folded),
			);
}
