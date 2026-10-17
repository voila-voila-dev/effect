import type { HttpMethod } from "./api-reference/model.ts";

export interface SearchEntry {
	kind: "page" | "section" | "operation";
	title: string;
	/** Where the entry sits: the group of a page, the page of a section, the path of an operation. */
	context: string;
	href: string;
	/** Matched but never shown: a page's description. */
	keywords?: string;
	/** Matched and shown as chips: who a page is for, the moment of their life it belongs to. */
	tags?: ReadonlyArray<string>;
	method?: HttpMethod;
}

/** Words a reader uses for the same thing, any of which finds the others: `["invoice", "bill"]`. */
export type SynonymGroups = ReadonlyArray<ReadonlyArray<string>>;

export interface SearchResult extends SearchEntry {
	score: number;
}

const KIND_BONUS: Readonly<Record<SearchEntry["kind"], number>> = {
	page: 15,
	operation: 10,
	section: 0,
};

function foldForSearch(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/gu, "")
		.replace(/[‘’]/gu, "'")
		.toLowerCase();
}

function isSubsequence(needle: string, haystack: string): boolean {
	let position = 0;
	for (const character of haystack) {
		if (character === needle[position]) {
			position += 1;
		}
	}
	return position === needle.length;
}

interface FoldedEntry {
	title: string;
	rest: string;
}

/** Each entry folded once: an index whose pages carry their prose would otherwise be folded again on every keystroke. */
const foldedEntries = new WeakMap<SearchEntry, FoldedEntry>();

function foldedEntryOf(entry: SearchEntry): FoldedEntry {
	let folded = foldedEntries.get(entry);
	if (!folded) {
		folded = {
			title: foldForSearch(entry.title),
			rest: foldForSearch(
				`${entry.context} ${entry.keywords ?? ""} ${entry.tags?.join(" ") ?? ""} ${entry.method ?? ""}`,
			),
		};
		foldedEntries.set(entry, folded);
	}
	return folded;
}

/** Each token scores where it lands best; a token found nowhere drops the entry. */
function tokenScore(token: string, entry: FoldedEntry): number {
	const scores = [
		entry.title.startsWith(token) ? 100 : 0,
		entry.title.split(/[^a-z0-9]+/u).some((word) => word.startsWith(token))
			? 60
			: 0,
		entry.title.includes(token) ? 40 : 0,
		entry.rest.includes(token) ? 10 : 0,
		token.length > 2 && isSubsequence(token, entry.title) ? 5 : 0,
	];
	return Math.max(...scores);
}

const PHRASE_MARK = "\u0000";

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/**
 * Each term of the query with the words that mean the same. A synonym of
 * several words ("chiffre d'affaires") is lifted out of the query first, so it
 * counts as one term.
 */
function queryTerms(
	query: string,
	synonyms: SynonymGroups,
): Array<Array<string>> {
	const groups = synonyms.map((group) => group.map(foldForSearch));
	const phrases: Array<Array<string>> = [];
	let rest = foldForSearch(query);
	for (const group of groups) {
		for (const member of group.filter((word) => /\s/u.test(word))) {
			const pattern = new RegExp(
				`(^|\\s)${escapeRegExp(member)}(?=\\s|$)`,
				"gu",
			);
			if (pattern.test(rest)) {
				rest = rest.replace(pattern, `$1${PHRASE_MARK}${phrases.length}`);
				phrases.push(group);
			}
		}
	}
	return rest
		.split(/\s+/u)
		.filter(Boolean)
		.map((token) =>
			token.startsWith(PHRASE_MARK)
				? (phrases[Number(token.slice(1))] ?? [token])
				: (groups.find((group) => group.includes(token)) ?? [token]),
		);
}

export function searchDocs(
	entries: ReadonlyArray<SearchEntry>,
	query: string,
	{
		limit = 12,
		synonyms = [],
	}: { limit?: number; synonyms?: SynonymGroups } = {},
): Array<SearchResult> {
	const terms = queryTerms(query, synonyms);
	if (terms.length === 0) {
		return [];
	}
	return entries
		.map((entry) => {
			const folded = foldedEntryOf(entry);
			const scores = terms.map((alternatives) =>
				Math.max(...alternatives.map((token) => tokenScore(token, folded))),
			);
			const score = scores.every((value) => value > 0)
				? scores.reduce((sum, value) => sum + value, 0) + KIND_BONUS[entry.kind]
				: 0;
			return { ...entry, score };
		})
		.filter((result) => result.score > 0)
		.sort((left, right) => right.score - left.score)
		.slice(0, limit);
}
