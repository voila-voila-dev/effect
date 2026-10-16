import type { HttpMethod } from "./api-reference/model.ts";

/** A page named by its slug (its path under the content folder, without `.mdx`), or a folder the sidebar collapses. */
type DocsEntry = string | DocsFolder;

interface DocsFolder {
	label: string;
	pages: ReadonlyArray<DocsEntry>;
}

/** A sidebar group: a topic label over its pages and folders. A group for one audience shows only while the reader is in it. */
interface DocsGroup {
	label: string;
	audience?: string;
	pages: ReadonlyArray<DocsEntry>;
}

/** An audience the sidebar's switcher offers, named once: its groups are topics, so none of them carries the audience's name. */
interface DocsAudience {
	id: string;
	label: string;
}

interface DocsGuidesTab<IconName extends string> {
	label: string;
	icon?: IconName;
	/** Required as soon as a group names an audience; its first group's first page is the audience's landing. */
	audiences?: ReadonlyArray<DocsAudience>;
	groups: ReadonlyArray<DocsGroup>;
}

/** The API reference tab: its groups come from the OpenAPI document, and it hides while that has no operation. */
interface DocsApiReferenceTab<IconName extends string> {
	label: string;
	icon?: IconName;
	apiReference: true;
}

/** The sidebar registry: its tabs, their groups, and the pages they list by slug. An icon is a name the renderer maps to a glyph. */
export type DocsNavigation<IconName extends string = string> = ReadonlyArray<
	DocsGuidesTab<IconName> | DocsApiReferenceTab<IconName>
>;

type EntrySlug<Entry> = Entry extends string
	? Entry
	: Entry extends { pages: ReadonlyArray<infer Child> }
		? EntrySlug<Child>
		: never;

/** Every slug a registry declared `as const` lists: a path step or a link typed with it cannot name a page that is not in the sidebar. */
export type NavigationSlug<Navigation extends DocsNavigation> =
	Navigation[number] extends infer Tab
		? Tab extends { groups: ReadonlyArray<infer Group> }
			? Group extends { pages: ReadonlyArray<infer Entry> }
				? EntrySlug<Entry>
				: never
			: never
		: never;

export interface NavItem {
	title: string;
	/** A shorter title the sidebar shows in place of `title`. */
	sidebarTitle?: string;
	href: string;
	icon?: string;
	/** The HTTP verb of an API operation, shown as a badge. */
	method?: HttpMethod;
}

export interface NavFolder {
	label: string;
	items: ReadonlyArray<NavEntry>;
}

export type NavEntry = NavItem | NavFolder;

export interface NavGroup {
	label: string;
	audience?: string;
	items: ReadonlyArray<NavEntry>;
}

export interface NavAudience {
	id: string;
	label: string;
	/** The audience's landing: the first page of its first group. */
	href: string;
}

export interface NavTab {
	label: string;
	icon?: string;
	href: string;
	audiences: ReadonlyArray<NavAudience>;
	groups: ReadonlyArray<NavGroup>;
}

export interface NavLocation {
	tab: NavTab;
	/** The audience of the page's group, when it has one. */
	audience?: NavAudience;
	group: NavGroup;
	/** The folders between the group and the page, outermost first. */
	folders: ReadonlyArray<NavFolder>;
	item: NavItem;
	previous?: NavItem;
	next?: NavItem;
}

interface PageSummary {
	title: string;
	sidebarTitle?: string | undefined;
	href: string;
	icon?: string;
}

export function isNavFolder(entry: NavEntry): entry is NavFolder {
	return "items" in entry;
}

/** The pages of a list of entries, folders opened, in sidebar order. */
export function navItemsOf(entries: ReadonlyArray<NavEntry>): Array<NavItem> {
	return entries.flatMap((entry) =>
		isNavFolder(entry) ? navItemsOf(entry.items) : [entry],
	);
}

/** The slugs a list of registry entries names, folders opened, in sidebar order. */
export function slugsOf(entries: ReadonlyArray<DocsEntry>): Array<string> {
	return entries.flatMap((entry) =>
		typeof entry === "string" ? [entry] : slugsOf(entry.pages),
	);
}

function resolveEntry(
	entry: DocsEntry,
	pages: ReadonlyMap<string, PageSummary>,
): NavEntry {
	if (typeof entry !== "string") {
		return {
			label: entry.label,
			items: entry.pages.map((child) => resolveEntry(child, pages)),
		};
	}
	return pageEntry(entry, pages);
}

function pageEntry(
	slug: string,
	pages: ReadonlyMap<string, PageSummary>,
): NavEntry {
	const page = pages.get(slug);
	if (!page) {
		throw new Error(
			`docs navigation lists "${slug}", but its MDX file does not exist`,
		);
	}
	return {
		title: page.title,
		...(page.sidebarTitle ? { sidebarTitle: page.sidebarTitle } : {}),
		href: page.href,
		...(page.icon ? { icon: page.icon } : {}),
	};
}

function groupsOf(
	tab: DocsNavigation[number],
	pages: ReadonlyMap<string, PageSummary>,
	apiGroups: ReadonlyArray<NavGroup>,
): ReadonlyArray<NavGroup> {
	if ("apiReference" in tab) {
		return apiGroups;
	}
	return tab.groups.map((group) => ({
		label: group.label,
		...(group.audience ? { audience: group.audience } : {}),
		items: group.pages.map((entry) => resolveEntry(entry, pages)),
	}));
}

function audiencesOf(
	tab: DocsNavigation[number],
	groups: ReadonlyArray<NavGroup>,
): Array<NavAudience> {
	const declared = "audiences" in tab ? (tab.audiences ?? []) : [];
	const undeclared = groups.filter(
		(group) =>
			group.audience !== undefined &&
			!declared.some((audience) => audience.id === group.audience),
	);
	if (undeclared[0]) {
		throw new Error(
			`docs navigation: the group "${undeclared[0].label}" names the audience "${undeclared[0].audience}", which its tab's audiences do not declare`,
		);
	}
	return declared.map((audience) => {
		const landing = navItemsOf(
			groups
				.filter((group) => group.audience === audience.id)
				.flatMap((group) => group.items),
		)[0];
		if (!landing) {
			throw new Error(
				`docs navigation: the audience "${audience.id}" has no group with a page`,
			);
		}
		return { id: audience.id, label: audience.label, href: landing.href };
	});
}

/** The registry with each slug replaced by its page; a tab with nothing to show is dropped. */
export function resolveNavigation(
	navigation: DocsNavigation,
	pages: ReadonlyMap<string, PageSummary>,
	apiGroups: ReadonlyArray<NavGroup>,
): Array<NavTab> {
	return navigation.flatMap((tab) => {
		const groups = groupsOf(tab, pages, apiGroups);
		const first = navItemsOf(groups.flatMap((group) => group.items))[0];
		return first
			? [
					{
						label: tab.label,
						...(tab.icon ? { icon: tab.icon } : {}),
						href: first.href,
						audiences: audiencesOf(tab, groups),
						groups,
					},
				]
			: [];
	});
}

/** The audience a group belongs to, as its tab declares it. */
export function audienceOfGroup(
	tab: NavTab,
	group: NavGroup,
): NavAudience | undefined {
	return tab.audiences.find((audience) => audience.id === group.audience);
}

/** A group's place for a reader: its audience's name before it, since two audiences share topic names. */
export function groupTrail(tab: NavTab, group: NavGroup): Array<string> {
	const audience = audienceOfGroup(tab, group);
	return audience ? [audience.label, group.label] : [group.label];
}

/** The folders leading to the page at `href`, or undefined when the entries do not hold it. */
function foldersTo(
	entries: ReadonlyArray<NavEntry>,
	href: string,
): Array<NavFolder> | undefined {
	for (const entry of entries) {
		if (!isNavFolder(entry)) {
			if (entry.href === href) {
				return [];
			}
			continue;
		}
		const inner = foldersTo(entry.items, href);
		if (inner) {
			return [entry, ...inner];
		}
	}
	return undefined;
}

function locationIn(tab: NavTab, path: string): NavLocation | undefined {
	const items = navItemsOf(tab.groups.flatMap((group) => group.items));
	const index = items.findIndex((candidate) => candidate.href === path);
	const item = items[index];
	const holder = tab.groups.flatMap((group) => {
		const folders = foldersTo(group.items, path);
		return folders ? [{ group, folders }] : [];
	})[0];
	if (!(item && holder)) {
		return undefined;
	}
	const audience = audienceOfGroup(tab, holder.group);
	return {
		tab,
		...(audience ? { audience } : {}),
		...holder,
		item,
		...(items[index - 1] ? { previous: items[index - 1] } : {}),
		...(items[index + 1] ? { next: items[index + 1] } : {}),
	};
}

export function locate(
	tabs: ReadonlyArray<NavTab>,
	pathname: string,
): NavLocation | undefined {
	const path = pathname.replace(/(.)\/+$/u, "$1");
	for (const tab of tabs) {
		const location = locationIn(tab, path);
		if (location) {
			return location;
		}
	}
	return undefined;
}

/** A topic an audience landing lists its pages under: a sidebar group and the pages it lists itself, its folders left to the sidebar. */
export interface NavigationTopic {
	label: string;
	slugs: ReadonlyArray<string>;
}

/** Every guides group of a registry as a landing topic, in sidebar order. */
export function navigationTopics(
	navigation: DocsNavigation,
): Array<NavigationTopic> {
	return navigation.flatMap((tab) =>
		"groups" in tab
			? tab.groups.map((group) => ({
					label: group.label,
					slugs: group.pages.filter(
						(entry): entry is string => typeof entry === "string",
					),
				}))
			: [],
	);
}

export interface NavigationCoverage {
	/** Page files no tab lists. */
	unlisted: Array<string>;
	/** Slugs listed more than once. */
	repeated: Array<string>;
	/** Slugs listed without a page file. */
	missing: Array<string>;
}

/** How a registry covers the page files it orders: a sound one lists every page exactly once and nothing else. */
export function navigationCoverage(
	navigation: DocsNavigation,
	filed: ReadonlyArray<string>,
): NavigationCoverage {
	const listed = navigation.flatMap((tab) =>
		"groups" in tab ? tab.groups.flatMap((group) => slugsOf(group.pages)) : [],
	);
	return {
		unlisted: filed.filter((slug) => !listed.includes(slug)),
		repeated: listed.filter((slug, index) => listed.indexOf(slug) !== index),
		missing: listed.filter((slug) => !filed.includes(slug)),
	};
}
