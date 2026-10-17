export function apiOperationAt(reference, tagSlug, operationSlug) {
    return reference.operations.find((operation) => operation.tag.slug === tagSlug && operation.slug === operationSlug);
}
/** The API tab's groups: the overview, then one group per tag. Empty while the API has no operation, which hides the tab. */
export function apiNavigationGroups(reference, overview) {
    if (reference.operations.length === 0) {
        return [];
    }
    return [
        { label: reference.title, items: [overview] },
        ...reference.tags.map((tag) => ({
            label: tag.name,
            items: tag.operations.map((operation) => ({
                title: operation.summary,
                href: operation.href,
                method: operation.method,
            })),
        })),
    ];
}
