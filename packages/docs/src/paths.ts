/** One block of a path, with the line that tells a reader when it does not apply to them. */
export interface DocsPathStep<Slug extends string = string> {
	slug: Slug;
	context?: string;
}

/** An ordered sequence of blocks for one persona. Its `page` introduces it; its steps are other pages, never copies of them. */
export interface DocsPath<
	Slug extends string = string,
	Audience extends string = string,
> {
	id: string;
	title: string;
	audience: Audience;
	page: Slug;
	steps: readonly [DocsPathStep<Slug>, ...Array<DocsPathStep<Slug>>];
}

/** Where a page sits in a path: its 0-based index, and its neighbours in the path's order. */
export interface PathPlace<Slug extends string = string> {
	path: DocsPath<Slug>;
	index: number;
	previous?: DocsPathStep<Slug>;
	next?: DocsPathStep<Slug>;
}

/** The paths that use a block, in registry order. */
export function pathsThrough<Slug extends string>(
	paths: ReadonlyArray<DocsPath<Slug>>,
	slug: string,
): Array<DocsPath<Slug>> {
	return paths.filter((path) => path.steps.some((step) => step.slug === slug));
}

/**
 * The path a reader follows on this page: the one the URL names when it holds
 * the page, else the only path that does. Two candidates and no choice is no path.
 */
export function placeInPath<Slug extends string>({
	paths,
	slug,
	requested,
}: {
	paths: ReadonlyArray<DocsPath<Slug>>;
	slug: string;
	requested?: string | undefined;
}): PathPlace<Slug> | undefined {
	const candidates = pathsThrough(paths, slug);
	const path =
		candidates.find((candidate) => candidate.id === requested) ??
		(candidates.length === 1 ? candidates[0] : undefined);
	if (!path) {
		return undefined;
	}
	const index = path.steps.findIndex((step) => step.slug === slug);
	const previous = path.steps[index - 1];
	const next = path.steps[index + 1];
	return {
		path,
		index,
		...(previous ? { previous } : {}),
		...(next ? { next } : {}),
	};
}

/** The query a link adds so the page it opens keeps the reader in their path, unless the site names its own. */
export const PATH_QUERY_PARAMETER = "path";

/** The page's href in a path: the same page, with the path named in the query. */
export function hrefInPath(
	href: string,
	pathId: string,
	options: { queryParameter?: string } = {},
): string {
	const parameter = options.queryParameter ?? PATH_QUERY_PARAMETER;
	return `${href}?${parameter}=${encodeURIComponent(pathId)}`;
}
