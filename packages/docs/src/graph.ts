import { audienceIndex, type IndexablePage } from "./audience-index.ts";
import type { NavigationTopic } from "./navigation.ts";
import type { DocsPath } from "./paths.ts";

/** A page as the graph sees it: where it is served, who it is for, and every page it points to. */
export interface GraphPage extends IndexablePage {
	href: string;
	prerequisites: ReadonlyArray<string>;
	next: ReadonlyArray<string>;
	/** The same page written for other reader contexts. */
	variants?: ReadonlyArray<string>;
	/** The site-relative hrefs its body links to, under the guides' root. */
	links: ReadonlyArray<string>;
	lastVerified?: string | undefined;
}

type LinkVia =
	| "link"
	| "prerequisites"
	| "next"
	| "variants"
	| "path"
	| "landing";

export interface DeadLink {
	from: string;
	to: string;
	via: LinkVia;
}

export interface Unreachable {
	slug: string;
	audience: string;
	/** The audience's landing, or undefined when the site declares none. */
	landing: string | undefined;
}

export interface Freshness {
	slug: string;
	lastVerified: string;
	days: number;
}

export interface PathPageMismatch {
	slug: string;
	problem:
		| "path page is not of kind path"
		| "page of kind path belongs to no path";
}

export interface DocsGraphReport {
	deadLinks: Array<DeadLink>;
	unreachable: Array<Unreachable>;
	orphans: Array<string>;
	stale: Array<Freshness>;
	aging: Array<Freshness>;
	pathPages: Array<PathPageMismatch>;
}

export interface DocsGraphInput {
	pages: ReadonlyArray<GraphPage>;
	paths: ReadonlyArray<DocsPath>;
	/** The docs home: the one page nothing needs to link to. */
	root: string;
	/** Each audience's landing page, by audience. */
	landings: Readonly<Record<string, string>>;
	/** The sidebar topics a landing lists its audience's pages under. */
	topics: ReadonlyArray<NavigationTopic>;
	/** The day of the check, `YYYY-MM-DD`. */
	today: string;
	maxClicks?: number;
	failAfterDays?: number;
	warnAfterDays?: number;
}

const DAY = 86_400_000;

function daysBetween(from: string, to: string): number {
	return Math.floor((Date.parse(to) - Date.parse(from)) / DAY);
}

interface Edge {
	from: string;
	to: string;
	via: LinkVia;
}

function declaredEdges(
	page: GraphPage,
	slugAt: ReadonlyMap<string, string>,
): Array<Edge> {
	return [
		...page.links.map((href) => ({
			from: page.slug,
			to: slugAt.get(href) ?? href,
			via: "link" as const,
		})),
		...page.prerequisites.map((to) => ({
			from: page.slug,
			to,
			via: "prerequisites" as const,
		})),
		...page.next.map((to) => ({ from: page.slug, to, via: "next" as const })),
		...(page.variants ?? []).map((to) => ({
			from: page.slug,
			to,
			via: "variants" as const,
		})),
	];
}

/** A path page lists its steps, and each step's progress bar links every step of its path. */
function pathEdges(path: DocsPath): Array<Edge> {
	const steps = path.steps.map((step) => step.slug);
	return [path.page, ...steps].flatMap((from) =>
		steps.map((to) => ({ from, to, via: "path" as const })),
	);
}

/** The registry names the path page and its steps: each must exist. */
function registryEdges(path: DocsPath): Array<Edge> {
	return [path.page, ...path.steps.map((step) => step.slug)].map((to) => ({
		from: path.id,
		to,
		via: "path" as const,
	}));
}

function landingEdges(input: DocsGraphInput): Array<Edge> {
	return Object.entries(input.landings).flatMap(([audience, landing]) => {
		const index = audienceIndex({
			pages: input.pages,
			paths: input.paths,
			audience,
			topics: input.topics,
			landing,
		});
		return [
			...index.paths.map((path) => path.page),
			...index.topics.flatMap((topic) => topic.pages.map((page) => page.slug)),
		].map((to) => ({ from: landing, to, via: "link" as const }));
	});
}

function distancesFrom(
	start: string,
	edges: ReadonlyArray<Edge>,
	maxClicks: number,
): Map<string, number> {
	const distances = new Map([[start, 0]]);
	let frontier = [start];
	for (let clicks = 1; clicks <= maxClicks; clicks += 1) {
		const reached = new Set(frontier);
		frontier = edges
			.filter((edge) => reached.has(edge.from) && !distances.has(edge.to))
			.map((edge) => edge.to);
		for (const slug of frontier) {
			distances.set(slug, clicks);
		}
	}
	return distances;
}

function pathPageMismatches(input: DocsGraphInput): Array<PathPageMismatch> {
	const pathPages = new Set(input.paths.map((path) => path.page));
	return input.pages.flatMap((page): Array<PathPageMismatch> => {
		if (pathPages.has(page.slug) && page.kind !== "path") {
			return [{ slug: page.slug, problem: "path page is not of kind path" }];
		}
		if (!pathPages.has(page.slug) && page.kind === "path") {
			return [
				{ slug: page.slug, problem: "page of kind path belongs to no path" },
			];
		}
		return [];
	});
}

function freshness(input: DocsGraphInput): Array<Freshness> {
	return input.pages.flatMap((page) =>
		page.lastVerified
			? [
					{
						slug: page.slug,
						lastVerified: page.lastVerified,
						days: daysBetween(page.lastVerified, input.today),
					},
				]
			: [],
	);
}

/**
 * Whether a reader can get lost: a link or step to nowhere, a page more than
 * `maxClicks` from its audience's landing, a page nothing links to, an external
 * procedure checked too long ago.
 */
export function checkDocsGraph(input: DocsGraphInput): DocsGraphReport {
	const { maxClicks = 2, failAfterDays = 180, warnAfterDays = 150 } = input;
	const slugAt = new Map(input.pages.map((page) => [page.href, page.slug]));
	const known = new Set(input.pages.map((page) => page.slug));
	const declared = [
		...input.pages.flatMap((page) => declaredEdges(page, slugAt)),
		...input.paths.flatMap(registryEdges),
		...Object.values(input.landings).map((to) => ({
			from: "landings",
			to,
			via: "landing" as const,
		})),
	];
	const edges = [
		...input.pages
			.flatMap((page) => declaredEdges(page, slugAt))
			.filter((edge) => known.has(edge.to)),
		...input.paths.flatMap(pathEdges),
		...landingEdges(input),
	].filter((edge) => edge.from !== edge.to);
	const reachable = new Map(
		Object.entries(input.landings).map(([audience, landing]) => [
			audience,
			distancesFrom(landing, edges, maxClicks),
		]),
	);
	const inbound = new Set(edges.map((edge) => edge.to));
	const ages = freshness(input);
	return {
		deadLinks: declared.filter((edge) => !known.has(edge.to)),
		unreachable: input.pages.flatMap((page) =>
			page.audience.flatMap((audience) => {
				const reached = reachable.get(audience)?.has(page.slug) ?? false;
				return reached
					? []
					: [{ slug: page.slug, audience, landing: input.landings[audience] }];
			}),
		),
		orphans: input.pages
			.map((page) => page.slug)
			.filter((slug) => slug !== input.root && !inbound.has(slug)),
		stale: ages.filter((age) => age.days > failAfterDays),
		aging: ages.filter(
			(age) => age.days > warnAfterDays && age.days <= failAfterDays,
		),
		pathPages: pathPageMismatches(input),
	};
}
