/** The paths that use a block, in registry order. */
export function pathsThrough(paths, slug) {
    return paths.filter((path) => path.steps.some((step) => step.slug === slug));
}
/**
 * The path a reader follows on this page: the one the URL names when it holds
 * the page, else the only path that does. Two candidates and no choice is no path.
 */
export function placeInPath({ paths, slug, requested, }) {
    const candidates = pathsThrough(paths, slug);
    const path = candidates.find((candidate) => candidate.id === requested) ??
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
export function hrefInPath(href, pathId, options = {}) {
    const parameter = options.queryParameter ?? PATH_QUERY_PARAMETER;
    return `${href}?${parameter}=${encodeURIComponent(pathId)}`;
}
