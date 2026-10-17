/**
 * An audience landing's content: its paths first, then its other pages under
 * the sidebar topic that lists them, so the landing and the sidebar agree. A
 * page no topic lists itself is left out, so the reachability check names it
 * instead of the landing hiding it in a catch-all.
 */
export function audienceIndex({ pages, paths, audience, topics, landing, }) {
    const listed = new Map(pages
        .filter((page) => page.slug !== landing &&
        page.kind !== "path" &&
        page.audience.includes(audience))
        .map((page) => [page.slug, page]));
    return {
        paths: paths.filter((path) => path.audience === audience),
        topics: topics
            .map((topic) => ({
            label: topic.label,
            pages: topic.slugs.flatMap((slug) => {
                const page = listed.get(slug);
                return page ? [page] : [];
            }),
        }))
            .filter((topic) => topic.pages.length > 0),
    };
}
