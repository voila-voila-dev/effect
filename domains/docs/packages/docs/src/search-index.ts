import type { ApiOperation } from "./api-reference/model.ts";
import type { DocHeading } from "./heading.ts";
import { groupTrail, type NavTab, navItemsOf } from "./navigation.ts";
import type { SearchEntry } from "./search.ts";

interface SearchablePage {
	title: string;
	description: string;
	href: string;
	headings: ReadonlyArray<DocHeading>;
	/** Who the page is for and when, shown as chips on its result. */
	tags?: ReadonlyArray<string>;
	/** The page's prose (`page.mdx?text`), matched with its description so a page is found by what it says. */
	text?: string;
}

/** A page and each of its sections; `group` is the sidebar group it sits in. */
export function pageSearchEntries(
	page: SearchablePage,
	group: string,
): Array<SearchEntry> {
	return [
		{
			kind: "page",
			title: page.title,
			context: group,
			href: page.href,
			keywords: page.text
				? `${page.description} ${page.text}`
				: page.description,
			...(page.tags ? { tags: page.tags } : {}),
		},
		...page.headings.map((heading) => ({
			kind: "section" as const,
			title: heading.text,
			context: page.title,
			href: `${page.href}#${heading.id}`,
		})),
	];
}

export function operationSearchEntry(operation: ApiOperation): SearchEntry {
	return {
		kind: "operation",
		title: operation.summary,
		context: operation.path,
		href: operation.href,
		keywords: `${operation.tag.name} ${operation.description ?? ""}`,
		method: operation.method,
	};
}

/** What the palette offers before anything is typed: the pages, as the sidebar lists them. */
export function navigationSuggestions(
	tabs: ReadonlyArray<NavTab>,
): Array<SearchEntry> {
	return tabs.flatMap((tab) =>
		tab.groups.flatMap((group) =>
			navItemsOf(group.items).map((item) => ({
				kind: item.method ? ("operation" as const) : ("page" as const),
				title: item.title,
				context: groupTrail(tab, group).join(" · "),
				href: item.href,
				...(item.method ? { method: item.method } : {}),
			})),
		),
	);
}
