import { audienceIndex } from "./audience-index.ts";
const DAY = 86400000;
function daysBetween(from, to) {
    return Math.floor((Date.parse(to) - Date.parse(from)) / DAY);
}
function declaredEdges(page, slugAt) {
    return [
        ...page.links.map((href) => ({
            from: page.slug,
            to: slugAt.get(href) ?? href,
            via: "link",
        })),
        ...page.prerequisites.map((to) => ({
            from: page.slug,
            to,
            via: "prerequisites",
        })),
        ...page.next.map((to) => ({ from: page.slug, to, via: "next" })),
        ...(page.variants ?? []).map((to) => ({
            from: page.slug,
            to,
            via: "variants",
        })),
    ];
}
/** A path page lists its steps, and each step's progress bar links every step of its path. */
function pathEdges(path) {
    const steps = path.steps.map((step) => step.slug);
    return [path.page, ...steps].flatMap((from) => steps.map((to) => ({ from, to, via: "path" })));
}
/** The registry names the path page and its steps: each must exist. */
function registryEdges(path) {
    return [path.page, ...path.steps.map((step) => step.slug)].map((to) => ({
        from: path.id,
        to,
        via: "path",
    }));
}
function landingEdges(input) {
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
        ].map((to) => ({ from: landing, to, via: "link" }));
    });
}
function distancesFrom(start, edges, maxClicks) {
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
function pathPageMismatches(input) {
    const pathPages = new Set(input.paths.map((path) => path.page));
    return input.pages.flatMap((page) => {
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
function freshness(input) {
    return input.pages.flatMap((page) => page.lastVerified
        ? [
            {
                slug: page.slug,
                lastVerified: page.lastVerified,
                days: daysBetween(page.lastVerified, input.today),
            },
        ]
        : []);
}
/**
 * Whether a reader can get lost: a link or step to nowhere, a page more than
 * `maxClicks` from its audience's landing, a page nothing links to, an external
 * procedure checked too long ago.
 */
export function checkDocsGraph(input) {
    const { maxClicks = 2, failAfterDays = 180, warnAfterDays = 150 } = input;
    const slugAt = new Map(input.pages.map((page) => [page.href, page.slug]));
    const known = new Set(input.pages.map((page) => page.slug));
    const declared = [
        ...input.pages.flatMap((page) => declaredEdges(page, slugAt)),
        ...input.paths.flatMap(registryEdges),
        ...Object.values(input.landings).map((to) => ({
            from: "landings",
            to,
            via: "landing",
        })),
    ];
    const edges = [
        ...input.pages
            .flatMap((page) => declaredEdges(page, slugAt))
            .filter((edge) => known.has(edge.to)),
        ...input.paths.flatMap(pathEdges),
        ...landingEdges(input),
    ].filter((edge) => edge.from !== edge.to);
    const reachable = new Map(Object.entries(input.landings).map(([audience, landing]) => [
        audience,
        distancesFrom(landing, edges, maxClicks),
    ]));
    const inbound = new Set(edges.map((edge) => edge.to));
    const ages = freshness(input);
    return {
        deadLinks: declared.filter((edge) => !known.has(edge.to)),
        unreachable: input.pages.flatMap((page) => page.audience.flatMap((audience) => {
            const reached = reachable.get(audience)?.has(page.slug) ?? false;
            return reached
                ? []
                : [{ slug: page.slug, audience, landing: input.landings[audience] }];
        })),
        orphans: input.pages
            .map((page) => page.slug)
            .filter((slug) => slug !== input.root && !inbound.has(slug)),
        stale: ages.filter((age) => age.days > failAfterDays),
        aging: ages.filter((age) => age.days > warnAfterDays && age.days <= failAfterDays),
        pathPages: pathPageMismatches(input),
    };
}
